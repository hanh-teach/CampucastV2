import { colors } from "../foundation/tokens/colors";
import React, { useEffect, useState } from "react";
import { Cloud, CloudOff, CloudLightning, RefreshCw, AlertCircle, CheckCircle, Database } from "lucide-react";
import { useSync } from "../hooks/useSync";
import { cn } from "../lib/utils";

interface SyncStatusProps {
  uiLanguage?: "vi" | "en";
  className?: string;
  showShortcutButton?: boolean;
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
    explainLocal: "Đang chạy mượt mà ở chế độ ngoại tuyến.",
    tooltipShortcut: "Kích hoạt đồng bộ dữ liệu đám mây ngay lập tức mà không cần mở cài đặt"
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
    explainLocal: "Running smoothly on local database.",
    tooltipShortcut: "Trigger immediate cloud synchronization without navigating to Settings"
  }
};

export function SyncStatus({ 
  uiLanguage = "vi", 
  className,
  showShortcutButton = true
}: SyncStatusProps) {
  const { 
    user, 
    cloudStatus, 
    syncStatus,
    queueLength, 
    triggerSync, 
    updateQueueLength,
    isOnline
  } = useSync();

  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const dict = statusDict[uiLanguage === "vi" ? "vi" : "en"];

  // Update pending queue count when mounted or cloudStatus changes
  useEffect(() => {
    updateQueueLength();
  }, [cloudStatus, updateQueueLength]);

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (syncStatus === "syncing" || isManualSyncing || !isOnline) return;

    try {
      setIsManualSyncing(true);
      await triggerSync();
    } finally {
      setTimeout(() => {
        setIsManualSyncing(false);
      }, 500);
    }
  };

  const isSyncing = syncStatus === "syncing" || isManualSyncing;

  const getStatusContent = () => {
    if (isSyncing) {
      return {
        icon: (
          <div className="relative flex items-center justify-center shrink-0">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
          </div>
        ),
        dot: (
          <span className="relative flex h-2 w-2 shrink-0" title="Syncing">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
          </span>
        ),
        text: queueLength > 0 ? `${dict.syncing} (${queueLength} ${dict.pending})` : dict.syncing,
        bg: "border border-sky-500/30 bg-sky-500/10 text-sky-500 animate-pulse ring-1 ring-sky-500/20",
        title: "Synchronization in progress..."
      };
    }

    switch (cloudStatus) {
      case "INITIALIZING":
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 animate-spin text-text-muted" />,
          dot: <RefreshCw className="w-2.5 h-2.5 animate-spin text-text-muted shrink-0" />,
          text: uiLanguage === "vi" ? "Đang khởi tạo..." : "Initializing...",
          bg: "border border-border-subtle bg-surface-subtle text-text-muted",
          title: "Initializing Supabase Cloud Connection..."
        };
      case "OFFLINE":
        return {
          icon: <CloudOff className="w-3.5 h-3.5 text-text-muted" />,
          dot: <span className="inline-block h-2 w-2 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0" title="Offline" />,
          text: dict.offline,
          bg: "border border-border-subtle bg-surface-subtle text-text-muted",
          title: dict.explainLocal
        };
      case "MISCONFIGURED":
        const isSuspended = typeof window !== "undefined" && (window as any).supabaseSuspended;
        return {
          icon: <CloudLightning className="w-3.5 h-3.5 animate-pulse text-red-500" />,
          dot: (
            <span className="relative flex h-2 w-2 shrink-0" title="Error / Misconfigured">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
          ),
          text: isSuspended 
            ? (uiLanguage === "vi" ? "Cloud bị tạm ngưng" : "Cloud Suspended")
            : dict.misconfigured,
          bg: "border border-red-500/30 bg-red-500/10 text-red-500",
          title: isSuspended
            ? (uiLanguage === "vi" 
                ? "Dự án Supabase của bạn đã bị tạm ngưng/khóa."
                : "Your Supabase Cloud project has been suspended.")
            : dict.explainMisconfigured
        };
      case "CONNECTED":
        return {
          icon: queueLength > 0 ? (
            <RefreshCw className="w-3.5 h-3.5 animate-pulse text-amber-500" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          ),
          dot: queueLength > 0 ? (
            <span className="relative flex h-2 w-2 shrink-0" title="Pending Items">
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
          ) : (
            <span className="relative flex h-2 w-2 shrink-0" title="Connected & Synced">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-xs" />
            </span>
          ),
          text: queueLength > 0 
            ? `${queueLength} ${dict.pending}` 
            : dict.connected,
          bg: queueLength > 0 
            ? "border border-amber-500/30 bg-amber-500/10 text-amber-500"
            : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          title: "Cloud Synced Successfully"
        };
      case "LOCAL_ONLY":
      default:
        return {
          icon: <Database className="w-3.5 h-3.5 text-amber-500" />,
          dot: <span className="inline-block h-2 w-2 rounded-full bg-amber-500 shrink-0" title="Local Mode" />,
          text: dict.localOnly,
          bg: "border border-amber-500/30 bg-amber-500/10 text-amber-500",
          title: dict.explainLocal
        };
    }
  };

  const status = getStatusContent();

  return (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      {/* Main Status Badge */}
      <div 
        className={cn(
          "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium transition-all duration-300 shadow-xs",
          status.bg
        )}
        id="sync-status-indicator"
        title={status.title}
      >
        {status.icon}
        <div className="flex items-center gap-1.5 font-sans leading-none font-semibold">
          {status.dot}
          <span className="hidden sm:inline whitespace-nowrap">{status.text}</span>
        </div>
      </div>

      {/* 'Sync Now' Shortcut Button */}
      {showShortcutButton && (
        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncing || !isOnline}
          title={dict.tooltipShortcut}
          aria-label={dict.syncNow}
          className={cn(
            "group relative px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono transition-all duration-200 cursor-pointer flex items-center gap-1.5 border shadow-xs select-none",
            "bg-brand-accent/10 hover:bg-brand-accent hover:text-white text-brand-accent border-brand-accent/30 hover:border-brand-accent",
            "active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-accent/40",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-accent/10 disabled:hover:text-brand-accent"
          )}
        >
          <RefreshCw className={cn(
            "w-3 h-3 transition-transform duration-300",
            isSyncing ? "animate-spin text-sky-500" : "group-hover:rotate-180"
          )} />
          <span className="leading-none hidden sm:inline whitespace-nowrap">
            {dict.syncNow}
          </span>
          {queueLength > 0 && (
            <span className="ml-0.5 px-1 py-0.2 rounded-full bg-brand-accent text-white text-[8px] font-bold">
              {queueLength}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

export default SyncStatus;

