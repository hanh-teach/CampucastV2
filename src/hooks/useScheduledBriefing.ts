import { useEffect, useState, useCallback, useRef } from "react";
import { BroadcastConfiguration } from "../types";

interface UseScheduledBriefingProps {
  preferences: BroadcastConfiguration;
  onTriggerBriefing?: () => void;
  uiLanguage?: "vi" | "en";
}

export function useScheduledBriefing({
  preferences,
  onTriggerBriefing,
  uiLanguage = "vi"
}: UseScheduledBriefingProps) {
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(false);
  const [scheduledToast, setScheduledToast] = useState<{ title: string; body: string; time: string } | null>(null);
  const lastTriggeredDateRef = useRef<string | null>(null);

  // Check notification permission
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setHasNotificationPermission(Notification.permission === "granted");
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setHasNotificationPermission(perm === "granted");
        return perm === "granted";
      } catch (err) {
        console.warn("[ScheduledBriefing] Notification permission error:", err);
      }
    }
    return false;
  }, []);

  const triggerBriefingAlert = useCallback((isTest = false) => {
    const timeStr = preferences.scheduledBriefingTime || "07:30";
    const routeStr = preferences.commuteRoute ? ` (${preferences.commuteRoute})` : "";
    const locationStr = preferences.locationName || "Hà Nội";

    const title = uiLanguage === "vi" 
      ? `⏰ Rá-đa Bản Tin Sáng ${timeStr}` 
      : `⏰ Morning Briefing Radar ${timeStr}`;
    
    const body = uiLanguage === "vi"
      ? `Bản tin cá nhân hóa thời tiết ${locationStr}, giao thông${routeStr} & tin tức đã sẵn sàng! Chạm để phát radio rảnh tay.`
      : `Personalized weather for ${locationStr}, traffic${routeStr} & news are ready! Tap to start broadcast.`;

    setScheduledToast({ title, body, time: timeStr });

    // Send native system notification if permitted
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        const notif = new Notification(title, {
          body,
          icon: "/icon-192.jpg",
          tag: "commutecast-scheduled-briefing",
          requireInteraction: true
        });
        notif.onclick = () => {
          window.focus();
          if (onTriggerBriefing) onTriggerBriefing();
          notif.close();
        };
      } catch (e) {
        console.warn("[ScheduledBriefing] Failed to display native notification:", e);
      }
    }
  }, [preferences.scheduledBriefingTime, preferences.commuteRoute, preferences.locationName, uiLanguage, onTriggerBriefing]);

  // Periodic time checker for scheduled time match (e.g. 07:30)
  useEffect(() => {
    if (!preferences.scheduledBriefingEnabled) return;

    const checkSchedule = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMinutes = String(now.getMinutes()).padStart(2, "0");
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayDateStr = now.toISOString().split("T")[0];

      const targetTime = preferences.scheduledBriefingTime || "07:30";

      if (currentTimeStr === targetTime && lastTriggeredDateRef.current !== todayDateStr) {
        lastTriggeredDateRef.current = todayDateStr;
        triggerBriefingAlert(false);
      }
    };

    // Check immediately and every 20 seconds
    checkSchedule();
    const interval = setInterval(checkSchedule, 20000);

    return () => clearInterval(interval);
  }, [preferences.scheduledBriefingEnabled, preferences.scheduledBriefingTime, triggerBriefingAlert]);

  const dismissToast = useCallback(() => {
    setScheduledToast(null);
  }, []);

  return {
    scheduledToast,
    dismissToast,
    triggerTestBriefing: () => triggerBriefingAlert(true),
    hasNotificationPermission,
    requestNotificationPermission
  };
}
