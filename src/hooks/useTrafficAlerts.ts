import { useState, useCallback, useEffect, useRef } from "react";
import { BroadcastConfiguration, TrafficAlertItem } from "../types";

interface UseTrafficAlertsProps {
  preferences: BroadcastConfiguration;
  uiLanguage?: "vi" | "en";
  onBreakInStart?: () => void;
  onBreakInEnd?: () => void;
  geofenceRadiusKm?: number;
  isDrivingMode?: boolean;
  autoAudioAlertsEnabled?: boolean;
}

export function useTrafficAlerts({
  preferences,
  uiLanguage = "vi",
  onBreakInStart,
  onBreakInEnd,
  geofenceRadiusKm = 8.0,
  isDrivingMode = false,
  autoAudioAlertsEnabled = false
}: UseTrafficAlertsProps) {
  const [activeAlert, setActiveAlert] = useState<TrafficAlertItem | null>(null);
  const [isAlertAudioPlaying, setIsAlertAudioPlaying] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyAlerts, setNearbyAlerts] = useState<TrafficAlertItem[]>([]);
  const [isGeoFenceActive, setIsGeoFenceActive] = useState<boolean>(false);

  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const announcedAlertsRef = useRef<Map<string, number>>(new Map()); // alertId -> announcedTimestamp
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchGeoIdRef = useRef<number | null>(null);

  // Manual or direct play alert audio function (called on user touch/click)
  const playAlertAudio = useCallback((customScript?: string) => {
    const script = customScript || activeAlert?.audioScript;
    if (!script) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel(); // Cancel any ongoing speech

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = uiLanguage === "vi" ? "vi-VN" : "en-US";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsAlertAudioPlaying(true);
      if (onBreakInStart) onBreakInStart();
    };

    utterance.onend = () => {
      setIsAlertAudioPlaying(false);
      if (onBreakInEnd) onBreakInEnd();
    };

    utterance.onerror = (e) => {
      console.warn("[TrafficAlert] Audio playback error:", e);
      setIsAlertAudioPlaying(false);
      if (onBreakInEnd) onBreakInEnd();
    };

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [activeAlert, uiLanguage, onBreakInStart, onBreakInEnd]);

  // Automatic Audio Interrupt via SpeechSynthesis (Strictly guarded by isDrivingMode AND autoAudioAlertsEnabled)
  const autoSpeakAlertScript = useCallback((script: string) => {
    if (!isDrivingMode || !autoAudioAlertsEnabled) return; // ONLY speak automatically if Driving Mode AND Auto Audio are enabled
    playAlertAudio(script);
  }, [isDrivingMode, autoAudioAlertsEnabled, playAlertAudio]);

  // Trigger a traffic alert (manual or automatic)
  const triggerTrafficAlert = useCallback((customAlert?: Partial<TrafficAlertItem>) => {
    const route = preferences.commuteRoute || (uiLanguage === "vi" ? "Tuyến đường Cầu Giấy - Nguyễn Trãi" : "Main Highway Route");
    const city = preferences.locationName || (uiLanguage === "vi" ? "Hà Nội" : "City Center");

    const defaultAlert: TrafficAlertItem = {
      id: `alert-${Date.now()}`,
      severity: "critical",
      title: uiLanguage === "vi" 
        ? "🚨 BẢN TIN CẮT NGANG: Cảnh báo ùn tắc giao thông khẩn cấp" 
        : "🚨 BREAK-IN ALERT: Emergency Traffic Congestion Warning",
      location: route,
      delayMinutes: 20,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      description: uiLanguage === "vi"
        ? `Phát hiện sự cố va chạm và kẹt xe kéo dài hơn 2.5 km tại khu vực ${route} (${city}). Dự kiến chậm 20 phút. Khuyến nghị chuyển lộ trình.`
        : `Traffic accident and tailback detected on ${route} (${city}). Expect 20-min delay. Recommend switching route.`,
      audioScript: uiLanguage === "vi"
        ? `Cảnh báo giao thông khẩn cấp từ Rá-đa CommuteCast! Tuyến đường ${route} hiện đang xảy ra kẹt xe nghiêm trọng. Thời gian di chuyển dự kiến tăng 20 phút. Quý tài xế vui lòng cân nhắc lộ trình thay thế.`
        : `Emergency traffic alert from CommuteCast Radar! Severe congestion on ${route}. Estimated delay 20 minutes. Please consider an alternate route.`,
      requiresAudioInterrupt: true
    };

    const finalAlert: TrafficAlertItem = { ...defaultAlert, ...customAlert };
    setActiveAlert(finalAlert);

    // Speak High Priority Audio Interrupt ONLY if auto audio alerts enabled & driving mode active
    autoSpeakAlertScript(finalAlert.audioScript);
  }, [preferences.commuteRoute, preferences.locationName, uiLanguage, autoSpeakAlertScript]);

  const dismissAlert = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setActiveAlert(null);
    setIsAlertAudioPlaying(false);
    if (onBreakInEnd) onBreakInEnd();
  }, [onBreakInEnd]);

  // Fetch real-time geo-fenced incidents from backend
  const fetchRealtimeTraffic = useCallback(async (lat?: number, lng?: number) => {
    if (preferences.trafficAlertsEnabled === false) return;

    try {
      let url = `/api/traffic/realtime?radius=${geofenceRadiusKm}&lang=${uiLanguage}`;
      if (lat !== undefined && lng !== undefined) {
        url += `&lat=${lat}&lng=${lng}`;
      }

      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      if (data && Array.isArray(data.alerts)) {
        setNearbyAlerts(data.alerts);

        // Check if any critical alert requires High Priority Audio Interrupt
        const NOW = Date.now();
        const ANNOUNCE_COOLDOWN_MS = 5 * 60 * 1000; // 5 min cooldown per alert

        const criticalInterrupt = data.alerts.find((alert: TrafficAlertItem) => {
          if (!alert.requiresAudioInterrupt) return false;
          const lastAnnounced = announcedAlertsRef.current.get(alert.id) || 0;
          return NOW - lastAnnounced > ANNOUNCE_COOLDOWN_MS;
        });

        if (criticalInterrupt) {
          announcedAlertsRef.current.set(criticalInterrupt.id, NOW);
          setActiveAlert(criticalInterrupt);
          autoSpeakAlertScript(criticalInterrupt.audioScript);
        }
      }
    } catch (err) {
      console.warn("[useTrafficAlerts] Fetch real-time traffic failed:", err);
    }
  }, [preferences.trafficAlertsEnabled, geofenceRadiusKm, uiLanguage, autoSpeakAlertScript]);

  // Track HTML5 Geolocation
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setIsGeoFenceActive(false);
      fetchRealtimeTraffic(); // Fallback without GPS
      return;
    }

    if (preferences.trafficAlertsEnabled === false) {
      setIsGeoFenceActive(false);
      return;
    }

    const handleSuccess = (pos: GeolocationPosition) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserCoords(coords);
      setIsGeoFenceActive(true);
      fetchRealtimeTraffic(coords.lat, coords.lng);
    };

    const handleError = (err: GeolocationPositionError) => {
      // Cleanly handle permission policy / user denial without noisy warning spam
      if (err.code === err.PERMISSION_DENIED) {
        console.info("[useTrafficAlerts] Geolocation permission not granted or policy restricted. Using default location.");
      } else {
        console.info("[useTrafficAlerts] Geolocation unavailable:", err.message);
      }
      setIsGeoFenceActive(false);
      fetchRealtimeTraffic(); // Fallback query
    };

    watchGeoIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
    );

    // Periodic sync poll every 60 seconds
    pollTimerRef.current = setInterval(() => {
      fetchRealtimeTraffic(userCoords?.lat, userCoords?.lng);
    }, 60000);

    return () => {
      if (watchGeoIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchGeoIdRef.current);
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [preferences.trafficAlertsEnabled, fetchRealtimeTraffic, userCoords?.lat, userCoords?.lng]);

  // Cancel speech synthesis immediately if Driving Mode is deactivated
  useEffect(() => {
    if (!isDrivingMode) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsAlertAudioPlaying(false);
    }
  }, [isDrivingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    activeAlert,
    isAlertAudioPlaying,
    userCoords,
    nearbyAlerts,
    isGeoFenceActive,
    triggerTrafficAlert,
    dismissAlert,
    playAlertAudio,
    refreshTraffic: () => fetchRealtimeTraffic(userCoords?.lat, userCoords?.lng)
  };
}

