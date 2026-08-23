import React, { useState } from "react";
import { 
  History, 
  CheckCircle2, 
  XCircle,
  AlertTriangle, 
  Clock, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw,
  RotateCw,
  Sliders,
  Mic
} from "lucide-react";
import { useSync } from "../hooks/useSync";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { SyncHistoryEvent } from "../types";
import { cn } from "../lib/utils";
import { SyncHistoryD3Chart } from "./SyncHistoryD3Chart";

interface SyncHistoryProps {
  uiLanguage?: "vi" | "en";
  className?: string;
  maxItems?: number;
}

export const SyncHistory: React.FC<SyncHistoryProps> = ({
  uiLanguage = "vi",
  className,
  maxItems = 10
}) => {
  const { 
    syncHistory, 
    clearSyncHistory, 
    triggerSync, 
    retryFailedSync,
    syncStatus, 
    isOnline,
    isAutoRetrying,
    retryAttemptCount,
    nextRetryDelayMs,
    maxAutoRetries,
    cancelAutoRetry,
    createDemoFailedSyncEvent
  } = useSync();

  const [retryingEventId, setRetryingEventId] = useState<string | null>(null);

  const isVi = uiLanguage === "vi";

  const handleRetryEvent = async (eventId: string) => {
    try {
      setRetryingEventId(eventId);
      await retryFailedSync(eventId);
    } catch (err) {
      console.error("[SyncHistory] Error retrying sync event:", eventId, err);
    } finally {
      setRetryingEventId(null);
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      let relativeTime = "";
      if (diffSec < 60) {
        relativeTime = isVi ? "vừa xong" : "just now";
      } else if (diffSec < 3600) {
        const mins = Math.floor(diffSec / 60);
        relativeTime = isVi ? `${mins} phút trước` : `${mins}m ago`;
      } else if (diffSec < 86400) {
        const hours = Math.floor(diffSec / 3600);
        relativeTime = isVi ? `${hours} giờ trước` : `${hours}h ago`;
      } else {
        relativeTime = date.toLocaleDateString(isVi ? "vi-VN" : "en-US", {
          month: "short",
          day: "numeric"
        });
      }

      const exactTime = date.toLocaleTimeString(isVi ? "vi-VN" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });

      return { relativeTime, exactTime };
    } catch {
      return { relativeTime: isoString, exactTime: "" };
    }
  };

  const getSyncTypeLabel = (type: SyncHistoryEvent["type"]) => {
    switch (type) {
      case "full_sync":
        return isVi ? "Đồng bộ Toàn phần" : "Full Synchronization";
      case "queue_batch":
        return isVi ? "Xử lý Hàng đợi" : "Queue Batch Sync";
      case "manual_sync":
        return isVi ? "Đồng bộ Thủ công" : "Manual Sync";
      case "auto_sync":
      default:
        return isVi ? "Tự động Đồng bộ" : "Auto Sync";
    }
  };

  const renderStatusBadge = (status: SyncHistoryEvent["status"]) => {
    switch (status) {
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <XCircle className="w-3 h-3 text-red-500 shrink-0" />
            {isVi ? "Thất bại" : "Failed"}
          </span>
        );
      case "warning":
      case "partial":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
            {isVi ? "Một phần" : "Partial"}
          </span>
        );
      case "success":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
            {isVi ? "Thành công" : "Success"}
          </span>
        );
    }
  };

  const displayEvents = syncHistory.slice(0, maxItems);

  return (
    <Card className={cn("p-6 sm:p-8 border-border-subtle space-y-6 text-left", className)}>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-accent/10 rounded-2xl text-brand-accent shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black uppercase tracking-tight text-text-primary">
                {isVi ? "Lịch sử Đồng bộ Đám mây" : "Cloud Sync History"}
              </h4>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-surface-subtle border border-border-subtle text-text-muted">
                {syncHistory.length} {isVi ? "sự kiện" : "events"}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {isVi 
                ? "Thống kê biểu đồ D3 30 ngày & nhật ký các phiên đồng bộ dữ liệu đám mây" 
                : "30-day D3 chart analytics & cloud synchronization event logs"}
            </p>
          </div>
        </div>

        {syncHistory.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={createDemoFailedSyncEvent}
              title={isVi ? "Tạo sự kiện thất bại giả lập để thử nghiệm tự động thử lại backoff" : "Simulate failed sync event to test backoff"}
              className="h-8 text-[10px] font-black uppercase tracking-widest text-amber-500 border-amber-500/30 hover:bg-amber-500/10 transition-all"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              {isVi ? "Giả lập Lỗi Sync" : "Test Failed Sync"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={clearSyncHistory}
              className="h-8 text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-red-500 hover:border-red-500/30 transition-all"
            >
              <Trash2 className="w-3 h-3 mr-1.5" />
              {isVi ? "Xóa Lịch sử" : "Clear History"}
            </Button>
          </div>
        )}
      </div>

      {/* 30-Day D3 Bar Chart Visualization */}
      <SyncHistoryD3Chart events={syncHistory} uiLanguage={uiLanguage} />

      {/* Exponential Backoff Auto-Retry Banner */}
      {isAutoRetrying && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-600 dark:text-amber-400 font-medium shadow-xs animate-pulse">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
            <div>
              <p className="font-bold">
                {isVi 
                  ? `Đang tự động thử lại đồng bộ (Lần ${retryAttemptCount}/${maxAutoRetries})...` 
                  : `Exponential Backoff Auto-Retrying Sync (Attempt ${retryAttemptCount}/${maxAutoRetries})...`}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isVi 
                  ? `Hệ thống sẽ tự động gửi lại yêu cầu đồng bộ sau khoảng ${Math.ceil((nextRetryDelayMs || 0) / 1000)} giây.` 
                  : `Next retry will trigger automatically in approximately ${Math.ceil((nextRetryDelayMs || 0) / 1000)}s.`}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={cancelAutoRetry}
            className="h-7 text-[10px] font-black uppercase tracking-wider text-amber-600 border-amber-500/30 hover:bg-amber-500/20 shrink-0 self-end sm:self-center"
          >
            {isVi ? "Hủy Thử lại" : "Cancel Retry"}
          </Button>
        </div>
      )}

      {/* History Table */}
      {displayEvents.length === 0 ? (
        <div className="py-12 text-center space-y-3 bg-surface-subtle/40 rounded-2xl border border-dashed border-border-subtle">
          <Clock className="w-8 h-8 mx-auto text-text-muted opacity-40 animate-pulse" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              {isVi ? "Chưa có sự kiện đồng bộ nào" : "No sync events recorded yet"}
            </p>
            <p className="text-[11px] text-text-muted max-w-sm mx-auto">
              {isVi 
                ? "Các phiên đồng bộ dữ liệu tự động hoặc thủ công sẽ tự động hiển thị trong bảng lịch sử này." 
                : "Automatic or manual synchronization events will automatically populate in this log table."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={triggerSync}
            disabled={syncStatus === "syncing" || !isOnline}
            className="mt-2 text-[10px] font-black uppercase tracking-widest"
          >
            <RefreshCw className={cn("w-3 h-3 mr-1.5", syncStatus === "syncing" && "animate-spin")} />
            {isVi ? "Chạy Đồng bộ Ngay" : "Run Sync Now"}
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border-subtle">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/80 border-b border-border-subtle text-[11px] font-bold uppercase tracking-wider text-text-muted font-mono">
                <th className="py-3 px-4">{isVi ? "Mốc thời gian" : "Timestamp"}</th>
                <th className="py-3 px-4">{isVi ? "Loại đồng bộ" : "Sync Type"}</th>
                <th className="py-3 px-4">{isVi ? "Trạng thái" : "Status"}</th>
                <th className="py-3 px-4">{isVi ? "Số lượng" : "Items"}</th>
                <th className="py-3 px-4">{isVi ? "Chi tiết" : "Details"}</th>
                <th className="py-3 px-4 text-right">{isVi ? "Thao tác" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {displayEvents.map((event, idx) => {
                const { relativeTime, exactTime } = formatTimestamp(event.timestamp);
                const eventKey = event.id || `evt-${idx}-${event.timestamp}`;
                const isFailedEvent = event.status === "failed" || event.status === "warning" || event.status === "partial";
                const isCurrentlyRetrying = retryingEventId === eventKey && syncStatus === "syncing";

                return (
                  <tr 
                    key={eventKey}
                    className="hover:bg-surface-subtle/50 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-text-primary text-[11px]">
                        {exactTime}
                      </div>
                      <div className="text-[10px] font-mono text-text-muted">
                        {relativeTime}
                      </div>
                    </td>

                    {/* Sync Type */}
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-text-primary">
                      {getSyncTypeLabel(event.type)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderStatusBadge(event.status)}
                    </td>

                    {/* Items Count */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-text-muted text-xs">
                      {event.itemsCount} {isVi ? "mục" : "items"}
                    </td>

                    {/* Details Breakdown */}
                    <td className="py-3 px-4">
                      {event.details ? (
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-text-muted">
                          {event.details.briefingsDownloaded !== undefined && event.details.briefingsDownloaded > 0 && (
                            <span className="inline-flex items-center gap-1 bg-surface-subtle px-2 py-0.5 rounded border border-border-subtle">
                              <ArrowDownLeft className="w-2.5 h-2.5 text-sky-500" />
                              {event.details.briefingsDownloaded} {isVi ? "tải về" : "in"}
                            </span>
                          )}
                          {event.details.briefingsUploaded !== undefined && event.details.briefingsUploaded > 0 && (
                            <span className="inline-flex items-center gap-1 bg-surface-subtle px-2 py-0.5 rounded border border-border-subtle">
                              <ArrowUpRight className="w-2.5 h-2.5 text-emerald-500" />
                              {event.details.briefingsUploaded} {isVi ? "tải lên" : "out"}
                            </span>
                          )}
                          {event.details.voiceHistorySynced !== undefined && event.details.voiceHistorySynced > 0 && (
                            <span className="inline-flex items-center gap-1 bg-surface-subtle px-2 py-0.5 rounded border border-border-subtle">
                              <Mic className="w-2.5 h-2.5 text-amber-500" />
                              {event.details.voiceHistorySynced} {isVi ? "nhật ký giọng" : "voice logs"}
                            </span>
                          )}
                          {event.details.preferencesSynced && (
                            <span className="inline-flex items-center gap-1 bg-surface-subtle px-2 py-0.5 rounded border border-border-subtle">
                              <Sliders className="w-2.5 h-2.5 text-purple-500" />
                              {isVi ? "Cấu hình" : "Prefs"}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-text-muted italic">
                          {isVi ? "Không có dữ liệu bổ sung" : "No details"}
                        </span>
                      )}
                    </td>

                    {/* Action Column: Selective Manual Retry for Failed Events */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      {isFailedEvent ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetryEvent(eventKey)}
                          disabled={syncStatus === "syncing" || !isOnline}
                          title={isVi ? "Thử lại phiên đồng bộ này" : "Selectively retry this failed sync event"}
                          className="h-7 px-2.5 text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 transition-all shrink-0 inline-flex items-center gap-1"
                        >
                          <RotateCw className={cn("w-3 h-3", isCurrentlyRetrying && "animate-spin")} />
                          {isCurrentlyRetrying 
                            ? (isVi ? "Đang thử lại..." : "Retrying...") 
                            : (isVi ? "Thử lại Sync" : "Retry Sync")}
                        </Button>
                      ) : (
                        <span className="text-[10px] font-mono text-text-muted opacity-40 select-none">–</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default SyncHistory;
