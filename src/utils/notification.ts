// Mobile-compatible notification sender that uses ServiceWorker registration when available
export const sendNotification = async (title: string, options?: NotificationOptions) => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.log("[Notification] Notification API not supported in this browser.");
    return;
  }

  if (Notification.permission !== "granted") {
    console.log("[Notification] Notification permission is not granted:", Notification.permission);
    return;
  }

  // Use Service Worker if available (standard and required on mobile devices)
  if ("serviceWorker" in navigator) {
    try {
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.log("[Notification] Service Worker registration not found, registering...");
        registration = await navigator.serviceWorker.register("/sw.js");
      }
      
      // Ensure registration is fully ready and active
      await navigator.serviceWorker.ready;

      if (registration && typeof registration.showNotification === "function") {
        await registration.showNotification(title, {
          ...options,
          badge: options?.badge || "/icon-192.jpg",
          icon: options?.icon || "/icon-192.jpg"
        });
        console.log("[Notification] Dispatched mobile-friendly notification via Service Worker.");
        return;
      }
    } catch (swError) {
      console.warn("[Notification] Service Worker showNotification failed, trying fallback:", swError);
    }
  }

  // Fallback to legacy window.Notification if showNotification is unavailable or fails (desktop)
  try {
    new Notification(title, options);
    console.log("[Notification] Dispatched standard notification constructor fallback.");
  } catch (err) {
    console.error("[Notification] All notification attempts failed:", err);
  }
};
