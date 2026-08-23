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

  const [isSensorActive, setIsSensorActive] = useState<boolean>(false);
  const [recoveryCount, setRecoveryCount] = useState<number>(0);

  const lastPositionRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null);
  const highSpeedStartTimestampRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const smoothedSpeedRef = useRef<number>(0);

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
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      setSpeed(0);
      setSuggestDrivingMode(false);
      setIsSensorActive(false);
      lastPositionRef.current = null;
      highSpeedStartTimestampRef.current = null;
      smoothedSpeedRef.current = 0;
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by this device.");
      setIsSensorActive(false);
      return;
    }

    let retryDelayMs = 2000;

    const startWatching = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      const handleSuccess = (position: GeolocationPosition) => {
        setIsSensorActive(true);
        setError(null);
        retryDelayMs = 2000; // Reset retry delay on success

        const coords = position.coords;
        const currentTimestamp = position.timestamp;
        let calculatedSpeedKh = 0;

        if (coords.speed !== null && coords.speed !== undefined && coords.speed >= 0) {
          calculatedSpeedKh = coords.speed * 3.6; // m/s to km/h
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
          calculatedSpeedKh = 0; // Filter unreasonable GPS telemetry jump
        }

        // Exponential Moving Average (EMA) smoothing for speed jitter reduction
        const ALPHA = 0.35;
        const smoothed = smoothedSpeedRef.current === 0
          ? calculatedSpeedKh
          : ALPHA * calculatedSpeedKh + (1 - ALPHA) * smoothedSpeedRef.current;
        smoothedSpeedRef.current = smoothed;

        setSpeed(Math.round(smoothed * 10) / 10);

        lastPositionRef.current = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          timestamp: currentTimestamp,
        };

        if (smoothed > 15) {
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
        setIsSensorActive(false);
        setError(err.message);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }

        // Schedule auto-recovery attempt with exponential backoff up to 30s
        if (enabled) {
          setRecoveryCount((prev) => prev + 1);
          retryTimeoutRef.current = setTimeout(() => {
            console.log("[MotionDetection] Attempting GPS sensor auto-recovery...");
            startWatching();
          }, retryDelayMs);
          retryDelayMs = Math.min(retryDelayMs * 1.5, 30000);
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
    };

    startWatching();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [enabled]);

  return {
    speed,
    suggestDrivingMode,
    dismissSuggestion,
    error,
    isSensorActive,
    recoveryCount,
  };
}
