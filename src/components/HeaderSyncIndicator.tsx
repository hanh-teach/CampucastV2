import React, { useState } from "react";
import { 
  CloudOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  CloudCheck
} from "lucide-react";
import { useSync } from "../hooks/useSync";
import { cn } from "../lib/utils";
import { colors } from "../foundation/tokens/colors";

interface HeaderSyncIndicatorProps {
  uiLanguage?: "vi" | "en";
  className?: string;
  onOpenLogin?: () => void;
}

export const HeaderSyncIndicator: React.FC<HeaderSyncIndicatorProps> = ({
  uiLanguage = "vi",
  className,
  onOpenLogin,
}) => {
  const {
    syncStatus,
    cloudStatus,
    isOnline,
    queueLength,
    triggerSync,
    user
  } = useSync();

  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleSyncClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (syncStatus === "syncing" || isManualSyncing) return;
    
    if (!isOnline) {
      return;
    }

    try {
      setIsManualSyncing(true);
      await triggerSync();
    } finally {
      setTimeout(() => {
        setIsManualSyncing(false);
      }, 600);
    }
  };

  // Determine current display state
  const isSyncing = syncStatus === "syncing" || isManualSyncing;
  const isOffline = !isOnline || syncStatus === "offline" || cloudStatus === "OFFLINE";
  const isError = syncStatus === "error" || cloudStatus === "MISCONFIGURED";
  const isSynced = syncStatus === "synced" || cloudStatus === "CONNECTED";

  // Build localized text and visual attributes
  let statusText = uiLanguage === "vi" ? "Đã đồng bộ" : "Synced";
  let statusIcon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
  let dotColor = "bg-emerald-500";
  let badgeStyle = {
    backgroundColor: `${colors.success}14`,
    borderColor: `${colors.success}33`,
    color: colors.success,
  };
  let tooltip = uiLanguage === "vi" 
    ? "Đã đồng bộ với máy chủ đám mây. Nhấn để đồng bộ lại ngay." 
    : "Synced with Cloud. Click to sync now.";

  if (isOffline) {
    statusText = uiLanguage === "vi" ? "Ngoại tuyến" : "Offline";
    statusIcon = <CloudOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    dotColor = "bg-slate-400";
    badgeStyle = {
      backgroundColor: `${colors.surfaceOverlay}`,
      borderColor: `${colors.border}`,
      color: colors.textMuted,
    };
    tooltip = uiLanguage === "vi" 
      ? "Chế độ ngoại tuyến: Dữ liệu đang được lưu trữ an toàn trong máy." 
      : "Offline: Data is safely preserved in local storage.";
  } else if (isSyncing) {
    statusText = queueLength > 0 
      ? (uiLanguage === "vi" ? `Đang đồng bộ (${queueLength})` : `Syncing (${queueLength})`)
      : (uiLanguage === "vi" ? "Đang đồng bộ..." : "Syncing...");
    statusIcon = <RefreshCw className="w-3.5 h-3.5 text-sky-500 shrink-0 animate-spin" />;
    dotColor = "bg-sky-500 animate-pulse";
    badgeStyle = {
      backgroundColor: `${colors.interactive}18`,
      borderColor: `${colors.interactive}40`,
      color: colors.interactive,
    };
    tooltip = uiLanguage === "vi" 
      ? "Đang tải và cập nhật dữ liệu với đám mây..." 
      : "Syncing data with cloud services...";
  } else if (isError) {
    statusText = uiLanguage === "vi" ? "Lỗi đồng bộ" : "Sync Error";
    statusIcon = <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-pulse" />;
    dotColor = "bg-rose-500";
    badgeStyle = {
      backgroundColor: `${colors.critical}18`,
      borderColor: `${colors.critical}40`,
      color: colors.critical,
    };
    tooltip = uiLanguage === "vi" 
      ? "Không thể kết nối máy chủ đồng bộ. Nhấn để thử lại." 
      : "Sync failed. Click to retry.";
  } else if (!user && isOnline) {
    // Unauthenticated but online (Local database sync active)
    statusText = uiLanguage === "vi" ? "Lưu Cục bộ" : "Local Sync";
    statusIcon = <Database className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    dotColor = "bg-amber-500";
    badgeStyle = {
      backgroundColor: `${colors.warning}14`,
      borderColor: `${colors.warning}33`,
      color: colors.warning,
    };
    tooltip = uiLanguage === "vi" 
      ? "Đang lưu trữ cục bộ. Đăng nhập để đồng bộ xuyên thiết bị." 
      : "Local storage active. Sign in to enable cloud sync across devices.";
  }

  return (
    <button
      id="header-sync-indicator"
      type="button"
      onClick={handleSyncClick}
      title={tooltip}
      className={cn(
        "group relative flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider font-mono transition-all duration-200 cursor-pointer select-none",
        "hover:scale-[1.02] active:scale-[0.98] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/30",
        isSyncing && "animate-pulse-slow",
        className
      )}
      style={badgeStyle}
      aria-label={`Sync status: ${statusText}`}
    >
      {/* Visual Status Dot */}
      <span className="relative flex h-2 w-2 items-center justify-center">
        {isSyncing && (
          <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping", dotColor)} />
        )}
        <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", dotColor)} />
      </span>

      {/* Status Icon */}
      <span className="group-hover:rotate-12 transition-transform duration-200">
        {statusIcon}
      </span>

      {/* Status Label (responsive: text hidden on ultra-small mobile, visible on sm+) */}
      <span className="hidden sm:inline font-bold tracking-tight">
        {statusText}
      </span>

      {/* Hover action indicator for manual sync */}
      {isOnline && !isSyncing && (
        <RefreshCw className="w-2.5 h-2.5 opacity-0 -ml-1 group-hover:opacity-60 transition-opacity" />
      )}
    </button>
  );
};

export default HeaderSyncIndicator;
