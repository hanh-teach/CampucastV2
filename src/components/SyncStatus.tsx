import { colors } from "../foundation/tokens/colors";
import React, { useEffect } from "react";
import { Cloud, CloudOff, CloudLightning, RefreshCw, AlertCircle, CheckCircle, Database } from "lucide-react";
import { useSync } from "../hooks/useSync";

interface SyncStatusProps {
  uiLanguage?: "vi" | "en";
}

const statusDict = {
  vi: {
    connected: "Đã kết nối đám mây",
    localOnly: "Lưu trữ nội bộ",
    offline: "Ngoại tuyến (Offline)",
    misconfigured: "Chưa cấu hình Cloud",
    syncing: "Đang đồng bộ...",
    syncNow: "Đồng bộ ngay",
    retry: "Thử lại",
    pending: "chờ",
    explainMisconfigured: "Vui lòng nhập cấu hình Supabase URL/Key trong môi trường cài đặt.",
    explainLocal: "Đang chạy mượt mà ở chế độ ngoại tuyến."
  },
  en: {
    connected: "Cloud Connected",
    localOnly: "Local Mode Only",
    offline: "Offline",
    misconfigured: "Cloud Misconfigured",
    syncing: "Syncing...",
    syncNow: "Sync Now",
    retry: "Retry",
    pending: "pending",
    explainMisconfigured: "Please set Supabase URL/Key environment variables to enable sync.",
    explainLocal: "Running smoothly on local database."
  }
};

export function SyncStatus({ uiLanguage = "vi" }: SyncStatusProps) {
  const { 
    user, 
    cloudStatus, 
    syncStatus,
    queueLength, 
    triggerSync, 
    updateQueueLength 
  } = useSync();

  const dict = statusDict[uiLanguage === "vi" ? "vi" : "en"];

  // Update pending queue count when mounted or cloudStatus changes
  useEffect(() => {
    updateQueueLength();
  }, [cloudStatus, updateQueueLength]);

  const getStatusContent = () => {
    if (syncStatus === "syncing") {
      return {
        icon: <RefreshCw className="w-4 h-4 animate-spin" style={{ color: colors.interactive }} />,
        text: queueLength > 0 ? `${dict.syncing} (${queueLength} ${dict.pending})` : dict.syncing,
        bg: "border",
        style: { backgroundColor: `${colors.interactive}1a`, borderColor: `${colors.interactive}33`, color: colors.interactive },
        actionBtn: null,
        title: "Synchronization in progress"
      };
    }

    switch (cloudStatus) {
      case "INITIALIZING":
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" style={{ color: colors.textMuted }} />,
          text: uiLanguage === "vi" ? "Đang khởi tạo..." : "Initializing...",
          bg: "border",
          style: { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textMuted },
          actionBtn: null,
          title: "Initializing Supabase Cloud Connection..."
        };
      case "OFFLINE":
        return {
          icon: <CloudOff className="w-4 h-4" style={{ color: colors.textMuted }} />,
          text: dict.offline,
          bg: "border",
          style: { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textMuted },
          actionBtn: null,
          title: dict.explainLocal
        };
      case "MISCONFIGURED":
        const isSuspended = typeof window !== "undefined" && (window as any).supabaseSuspended;
        return {
          icon: <CloudLightning className="w-4 h-4 animate-pulse" style={{ color: colors.critical }} />,
          text: isSuspended 
            ? (uiLanguage === "vi" ? "Cloud bị tạm ngưng" : "Cloud Suspended")
            : dict.misconfigured,
          bg: "border",
          style: { backgroundColor: `${colors.critical}1a`, borderColor: `${colors.critical}33`, color: colors.critical },
          actionBtn: null,
          title: isSuspended
            ? (uiLanguage === "vi" 
                ? "Dự án Supabase của bạn đã bị nhà cung cấp tạm ngưng/khóa (This service has been suspended). Vui lòng kích hoạt lại trên trang quản trị Supabase."
                : "Your Supabase Cloud project has been suspended by the provider. Please log in to your Supabase dashboard to resume it.")
            : dict.explainMisconfigured
        };
      case "CONNECTED":
        return {
          icon: queueLength > 0 ? (
            <RefreshCw className="w-4 h-4 animate-pulse" style={{ color: colors.warning }} />
          ) : (
            <CheckCircle className="w-4 h-4" style={{ color: colors.success }} />
          ),
          text: queueLength > 0 
            ? `${queueLength} ${dict.pending}` 
            : dict.connected,
          bg: "border",
          style: queueLength > 0 
            ? { backgroundColor: `${colors.warning}1a`, borderColor: `${colors.warning}33`, color: colors.warning }
            : { backgroundColor: `${colors.success}1a`, borderColor: `${colors.success}33`, color: colors.success },
          actionBtn: (
            <button
              onClick={triggerSync}
              className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-95 cursor-pointer hidden sm:inline-block"
              style={queueLength > 0 
                ? { backgroundColor: colors.warning, color: colors.onWarning } 
                : { backgroundColor: colors.surface, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
            >
              {dict.syncNow}
            </button>
          ),
          title: "Cloud Synced Successfully"
        };
      case "LOCAL_ONLY":
      default:
        return {
          icon: <Database className="w-4 h-4" style={{ color: colors.warning }} />,
          text: dict.localOnly,
          bg: "border",
          style: { backgroundColor: `${colors.warning}1a`, borderColor: `${colors.warning}33`, color: colors.warning },
          actionBtn: user ? (
            <button
              onClick={triggerSync}
              className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-95 cursor-pointer hidden sm:inline-block"
              style={{ backgroundColor: colors.warning, color: colors.onWarning }}
            >
              {dict.retry}
            </button>
          ) : null,
          title: dict.explainLocal
        };
    }
  };

  const status = getStatusContent();

  return (
    <div 
      className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium transition-all duration-300 shadow-sm ${status.bg}`}
      style={status.style}
      id="sync-status-indicator"
      title={status.title}
    >
      <div className="flex items-center gap-1.5">
        {status.icon}
        <span className="font-sans leading-none hidden sm:inline">{status.text}</span>
      </div>
      {status.actionBtn}
    </div>
  );
}

export default SyncStatus;
