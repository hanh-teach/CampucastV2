// src/features/pwa/PwaStatus.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, CloudOff, Wifi, CheckCircle2 } from "lucide-react";
import { colors } from "../../foundation/tokens/colors";

export function PwaStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setToastMessage("Đã khôi phục kết nối mạng! / Connected to network!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setToastMessage("Bạn đang ngoại tuyến. Một số tính năng nghe trực tiếp có thể bị hạn chế. / You are offline. Live streaming is limited.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if running as standalone
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-20 left-4 right-4 sm:left-6 sm:right-auto z-[9999] max-w-md p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-sm text-left transition-colors"
            style={{
              backgroundColor: isOnline ? `${colors.success}1a` : `${colors.warning}1a`,
              borderColor: isOnline ? `${colors.success}33` : `${colors.warning}33`,
              color: isOnline ? colors.success : colors.warning
            }}
          >
            {isOnline ? <Wifi className="w-5 h-5 shrink-0" /> : <CloudOff className="w-5 h-5 shrink-0" />}
            <div>
              <p className="font-semibold">{isOnline ? "Đang trực tuyến / Online" : "Chế độ ngoại tuyến / Offline Mode"}</p>
              <p className="opacity-90">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA App Promo Module */}
      <div className="p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left transition-colors"
           style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
        <div className="flex gap-3">
          <div className="p-2 rounded-xl" style={{ backgroundColor: `${colors.interactive}1a`, color: colors.interactive }}>
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm sm:text-base" style={{ color: colors.textPrimary }}>
              Trạng thái PWA / PWA Status
            </h4>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: colors.textSecondary }}>
              {isInstalled 
                ? "Ứng dụng đã được cài đặt thành công / App is installed and ready."
                : "Cài đặt để nghe Offline mượt mà hơn / Install for native offline access."}
            </p>
          </div>
        </div>

        {deferredPrompt && !isInstalled && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow transition cursor-pointer hover:brightness-110"
            style={{ minHeight: "44px", backgroundColor: colors.interactive, color: colors.onAccent }}
          >
            <Download className="w-4 h-4" />
            Cài đặt ứng dụng / Install App
          </motion.button>
        )}

        {isInstalled && (
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium" style={{ color: colors.success }}>
            <Wifi className="w-4 h-4" />
            Hoạt động độc lập / Standalone Active
          </div>
        )}
      </div>
    </>
  );
}
