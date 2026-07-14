import { useState, useEffect } from "react";

export function usePwaStatus() {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const checkStandalone = () => {
      if (typeof window !== "undefined") {
        return window.matchMedia("(display-mode: standalone)").matches;
      }
      return false;
    };

    setIsInstalled(checkStandalone());

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("appinstalled", handleAppInstalled);
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("appinstalled", handleAppInstalled);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      }
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setCanInstall(false);
    }
    setDeferredPrompt(null);
  };

  // Synchronized with CACHE_NAME in public/sw.js
  // Reminder: If you change CACHE_NAME in public/sw.js, update this string too!
  const cacheVersion = "commutecast-v2";

  const checkForUpdate = async (): Promise<void> => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update();
      }
    }
  };

  return {
    isInstalled,
    canInstall,
    promptInstall,
    cacheVersion,
    checkForUpdate
  };
}
