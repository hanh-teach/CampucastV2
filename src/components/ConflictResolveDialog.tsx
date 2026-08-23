import React, { useState, useEffect } from "react";
import { 
  GitCompare, 
  X, 
  HardDrive, 
  Cloud, 
  CloudDownload, 
  Check, 
  Clock, 
  Sparkles, 
  AlertTriangle, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  FlaskConical,
  CheckCircle2,
  ArrowRightLeft,
  Layers,
  ShieldAlert,
  GitMerge
} from "lucide-react";
import { useSync } from "../hooks/useSync";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";

interface ConflictResolveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  uiLanguage?: "vi" | "en";
}

export const ConflictResolveDialog: React.FC<ConflictResolveDialogProps> = ({
  isOpen,
  onClose,
  uiLanguage = "vi"
}) => {
  const {
    conflicts = [],
    resolveConflict,
    resolveAllConflicts,
    createDemoConflict,
    autoResolveConflicts = false,
    toggleAutoResolveConflicts
  } = useSync();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState<boolean>(false);
  const [expandedDetailsMap, setExpandedDetailsMap] = useState<Record<string, boolean>>({});

  const isVi = uiLanguage === "vi";

  // Filter pending unresolved conflicts
  const pendingConflicts = conflicts.filter((c) => c.status === "pending");

  // Close dialog on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = (isoString?: string) => {
    if (!isoString) return "--";
    try {
      const date = new Date(isoString);
      return date.toLocaleString(isVi ? "vi-VN" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "--";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleResolveSingle = async (conflictId: string, resolution: "local" | "remote" | "merge") => {
    try {
      setProcessingId(conflictId);
      await resolveConflict(conflictId, resolution);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkResolve = async (resolution: "local" | "remote" | "merge") => {
    try {
      setBulkProcessing(true);
      await resolveAllConflicts(resolution);
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleDetails = (id: string) => {
    setExpandedDetailsMap((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Dialog Backdrop Dismiss Area */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Dialog Container */}
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] bg-surface-bg border border-border-subtle rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Banner Bar */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-brand-accent to-sky-500 shrink-0" />

        {/* Dialog Header */}
        <div className="p-5 sm:p-6 border-b border-border-subtle flex items-center justify-between gap-4 bg-surface-subtle/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-2xl shrink-0",
              pendingConflicts.length > 0
                ? "bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse"
                : "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
            )}>
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-text-primary">
                  {isVi ? "Hộp thoại Giải quyết Xung đột" : "Conflict Resolve Dialog"}
                </h3>
                {pendingConflicts.length > 0 ? (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                    {pendingConflicts.length} {isVi ? "xung đột" : "conflicts"}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    {isVi ? "Đã sạch xung đột" : "Resolved"}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {isVi 
                  ? "Bảng kiểm tra chi tiết các mục xung đột dữ liệu đồng bộ với thời gian sửa đổi và diff trường dữ liệu" 
                  : "Detailed sync conflict inspection table with timestamps and field diffs"}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-9 h-9 p-0 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle shrink-0"
            title={isVi ? "Đóng cửa sổ" : "Close dialog"}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Resolve All Bulk Action Bar */}
        {pendingConflicts.length > 0 && (
          <div className="px-5 py-3.5 bg-amber-500/5 border-b border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{isVi ? "Thao tác Hàng loạt (Resolve All):" : "Resolve All Bulk Actions:"}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Resolve All: Keep Local */}
              <Button
                variant="outline"
                size="sm"
                disabled={bulkProcessing}
                onClick={() => handleBulkResolve("local")}
                className="h-8 text-[10px] font-black uppercase tracking-wider text-text-primary border-brand-accent/40 hover:bg-brand-accent/10 transition-all"
                title={isVi ? "Giải quyết tất cả bằng cách giữ bản Cục bộ" : "Resolve all by keeping local version"}
              >
                <HardDrive className="w-3 h-3 mr-1.5 text-brand-accent" />
                {isVi ? "Giữ Tất cả Cục bộ" : "Resolve All Local"}
              </Button>

              {/* Resolve All: Keep Cloud / Remote */}
              <Button
                variant="outline"
                size="sm"
                disabled={bulkProcessing}
                onClick={() => handleBulkResolve("remote")}
                className="h-8 text-[10px] font-black uppercase tracking-wider text-text-primary border-sky-500/40 hover:bg-sky-500/10 transition-all"
                title={isVi ? "Giải quyết tất cả bằng cách giữ bản Đám mây (Cloud)" : "Resolve all by keeping cloud version"}
              >
                <CloudDownload className="w-3 h-3 mr-1.5 text-sky-500" />
                {isVi ? "Giữ Tất cả Đám mây" : "Resolve All Cloud"}
              </Button>

              {/* Resolve All: Merge */}
              <Button
                variant="default"
                size="sm"
                disabled={bulkProcessing}
                onClick={() => handleBulkResolve("merge")}
                className="h-8 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs"
                title={isVi ? "Gộp (Merge) tự động tất cả xung đột" : "Bulk merge all pending conflicts"}
              >
                <GitMerge className="w-3 h-3 mr-1.5 text-white" />
                {isVi ? "Gộp Tất cả (Merge)" : "Resolve All Merge"}
              </Button>
            </div>
          </div>
        )}

        {/* Dialog Scrollable Body: Conflicting Items Table & Diffs */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 max-h-[62vh] custom-scrollbar">
          {pendingConflicts.length === 0 ? (
            <div className="py-14 px-4 text-center space-y-4 bg-surface-subtle/30 rounded-2xl border border-dashed border-border-subtle">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <p className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  {isVi ? "Không có xung đột dữ liệu nào cần giải quyết" : "No Conflict Items Pending"}
                </p>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {isVi 
                    ? "Dịch vụ đồng bộ không phát hiện bất kỳ sự bất đồng bộ dữ liệu nào giữa thiết bị và đám mây." 
                    : "The sync service has not found any data collisions between device local storage and cloud records."}
                </p>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createDemoConflict}
                  className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary transition-all"
                >
                  <FlaskConical className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                  {isVi ? "Tạo Xung đột Thử nghiệm" : "Simulate Test Conflict"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingConflicts.map((conflict) => {
                const isProcessing = processingId === conflict.id || bulkProcessing;
                const isExpanded = !!expandedDetailsMap[conflict.id];

                const localTime = new Date(conflict.localVersion.updatedAt).getTime();
                const remoteTime = new Date(conflict.remoteVersion.updatedAt).getTime();
                const isLocalNewer = localTime >= remoteTime;

                return (
                  <div
                    key={conflict.id}
                    className="bg-surface-subtle/40 border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs hover:border-amber-500/40 transition-all"
                  >
                    {/* Conflict Item Header Summary */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                          <GitCompare className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-text-primary truncate max-w-[300px]">
                              {conflict.fileName}
                            </span>
                            <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-surface-bg border border-border-subtle text-text-muted">
                              {conflict.entityType}
                            </span>
                          </div>
                          <p className="text-[10px] text-text-muted font-mono mt-0.5">
                            ID: <span className="text-text-primary">{conflict.fileId}</span> • Detected: {formatDate(conflict.detectedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDetails(conflict.id)}
                          className="h-7 text-[10px] font-mono font-bold text-text-muted hover:text-text-primary px-2.5 border border-border-subtle bg-surface-bg"
                        >
                          {isExpanded ? (
                            <>
                              <span>{isVi ? "Ẩn Field Diff" : "Hide Diffs"}</span>
                              <ChevronUp className="w-3 h-3 ml-1" />
                            </>
                          ) : (
                            <>
                              <span>{isVi ? "Xem Field Diff" : "View Diffs"}</span>
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Table-based Side-by-Side Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* LOCAL VERSION CARD */}
                      <div className={cn(
                        "bg-surface-bg p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all",
                        isLocalNewer ? "border-brand-accent/60 shadow-xs" : "border-border-subtle"
                      )}>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                            <div className="flex items-center gap-2">
                              <HardDrive className="w-3.5 h-3.5 text-brand-accent" />
                              <span className="text-xs font-bold text-text-primary">
                                {isVi ? "Bản Cục bộ (Local)" : "Local Version"}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                              {formatSize(conflict.localVersion.sizeBytes)}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-text-primary">
                            <span className="text-[10px] font-mono text-text-muted block">
                              {isVi ? "Cập nhật:" : "Modified:"} <strong className="text-text-primary">{formatDate(conflict.localVersion.updatedAt)}</strong>
                            </span>
                            <p className="text-xs font-medium bg-surface-subtle/50 p-2.5 rounded-lg border border-border-subtle/50">
                              {conflict.localVersion.description}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleResolveSingle(conflict.id, "local")}
                            className="w-full text-xs font-bold uppercase tracking-wider h-8 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            {isVi ? "Giữ Local" : "Keep Local"}
                          </Button>
                        </div>
                      </div>

                      {/* CLOUD / REMOTE VERSION CARD */}
                      <div className={cn(
                        "bg-surface-bg p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all",
                        !isLocalNewer ? "border-sky-500/60 shadow-xs" : "border-border-subtle"
                      )}>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                            <div className="flex items-center gap-2">
                              <Cloud className="w-3.5 h-3.5 text-sky-500" />
                              <span className="text-xs font-bold text-text-primary">
                                {isVi ? "Bản Đám mây (Cloud)" : "Cloud Version"}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20">
                              {formatSize(conflict.remoteVersion.sizeBytes)}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-text-primary">
                            <span className="text-[10px] font-mono text-text-muted block">
                              {isVi ? "Cập nhật:" : "Modified:"} <strong className="text-text-primary">{formatDate(conflict.remoteVersion.updatedAt)}</strong>
                            </span>
                            <p className="text-xs font-medium bg-surface-subtle/50 p-2.5 rounded-lg border border-border-subtle/50">
                              {conflict.remoteVersion.description}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isProcessing}
                            onClick={() => handleResolveSingle(conflict.id, "remote")}
                            className="w-full text-xs font-bold uppercase tracking-wider h-8 border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition-all"
                          >
                            <CloudDownload className="w-3.5 h-3.5 mr-1.5" />
                            {isVi ? "Giữ Cloud" : "Keep Cloud"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Merge Action Button Bar per Conflict */}
                    <div className="pt-1 flex items-center justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleResolveSingle(conflict.id, "merge")}
                        className="h-8 px-4 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10 transition-all inline-flex items-center gap-1.5"
                        title={isVi ? "Gộp (Merge) cả hai phiên bản dữ liệu này" : "Merge both local and cloud versions"}
                      >
                        <GitMerge className="w-3.5 h-3.5 text-amber-500" />
                        {isVi ? "Gộp (Merge) Mục này" : "Merge Conflict Item"}
                      </Button>
                    </div>

                    {/* Expandable Field Diffs View */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-border-subtle">
                        <div className="bg-surface-bg p-4 rounded-xl border border-border-subtle space-y-3 font-mono text-xs">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-text-primary border-b border-border-subtle pb-2">
                            <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                            <span>{isVi ? "So sánh Chi tiết Trường Dữ liệu (Field Diffs)" : "Field-by-Field Diff Comparison"}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                            <div className="space-y-1.5 bg-surface-subtle/50 p-3 rounded-lg border border-border-subtle">
                              <span className="font-bold text-brand-accent block uppercase tracking-wider">
                                {isVi ? "Dữ liệu Cục bộ (Local Payload)" : "Local Payload JSON"}
                              </span>
                              <pre className="text-[9px] text-text-muted whitespace-pre-wrap font-mono overflow-x-auto max-h-40 p-2 rounded bg-surface-bg border border-border-subtle/60">
                                {JSON.stringify(conflict.localVersion.details || { description: conflict.localVersion.description }, null, 2)}
                              </pre>
                            </div>

                            <div className="space-y-1.5 bg-surface-subtle/50 p-3 rounded-lg border border-border-subtle">
                              <span className="font-bold text-sky-500 block uppercase tracking-wider">
                                {isVi ? "Dữ liệu Đám mây (Cloud Payload)" : "Cloud Payload JSON"}
                              </span>
                              <pre className="text-[9px] text-text-muted whitespace-pre-wrap font-mono overflow-x-auto max-h-40 p-2 rounded bg-surface-bg border border-border-subtle/60">
                                {JSON.stringify(conflict.remoteVersion.details || { description: conflict.remoteVersion.description }, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dialog Footer */}
        <div className="p-4 sm:p-5 border-t border-border-subtle bg-surface-subtle/40 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
            <span>{pendingConflicts.length} {isVi ? "xung đột đang chờ xử lý" : "unresolved item(s) pending"}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold uppercase tracking-wider h-9 px-6"
          >
            {isVi ? "Đóng" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolveDialog;
