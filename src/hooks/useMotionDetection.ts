import { useState, useEffect, useRef } from "react";
import { useUserPreferences } from "../components/UserPreferencesProvider";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export function useMotionDetection() {
  const { preferences } = useUserPreferences();
  const enabled = !!preferences.autoSuggestDrivingModeEnabled;

  const [speed, setSpeed] = useState<number>(0); // in km/h
  const [suggestDrivingMode, setSuggestDrivingMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const lastPositionRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null);
  const highSpeedStartTimestampRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const dismissSuggestion = () => {
    setSuggestDrivingMode(false);
    highSpeedStartTimestampRef.current = null;
  };

  useEffect(() => {
    if (!enabled) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setSpeed(0);
      setSuggestDrivingMode(false);
      lastPositionRef.current = null;
      highSpeedStartTimestampRef.current = null;
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by this device.");
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const coords = position.coords;
      const currentTimestamp = position.timestamp;
      let calculatedSpeedKh = 0;

      if (coords.speed !== null && coords.speed !== undefined && coords.speed >= 0) {
        calculatedSpeedKh = coords.speed * 3.6; // convert m/s to km/h
      } else if (lastPositionRef.current) {
        const last = lastPositionRef.current;
        const distKm = getDistance(
          last.latitude,
          last.longitude,
          coords.latitude,
          coords.longitude
        );
        const timeHours = (currentTimestamp - last.timestamp) / 3600000;
        if (timeHours > 0) {
          calculatedSpeedKh = distKm / timeHours;
        }
      }

      if (calculatedSpeedKh > 250) {
        calculatedSpeedKh = 0;
      }

      setSpeed(calculatedSpeedKh);

      lastPositionRef.current = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: currentTimestamp,
      };

      if (calculatedSpeedKh > 15) {
        if (highSpeedStartTimestampRef.current === null) {
          highSpeedStartTimestampRef.current = currentTimestamp;
        } else {
          const elapsedMs = currentTimestamp - highSpeedStartTimestampRef.current;
          if (elapsedMs >= 30000) {
            setSuggestDrivingMode(true);
          }
        }
      } else {
        highSpeedStartTimestampRef.current = null;
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn("[MotionDetection] Geolocation error:", err.message);
      setError(err.message);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled]);

  return {
    speed,
    suggestDrivingMode,
    dismissSuggestion,
    error,
  };
}
