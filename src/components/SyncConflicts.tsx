import React, { useState } from "react";
import { 
  GitCompare, 
  HardDrive, 
  Cloud, 
  CheckCircle2, 
  FileText, 
  Check, 
  CloudDownload, 
  FlaskConical,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRightLeft,
  Calendar,
  Database,
  Layers,
  Zap,
  SlidersHorizontal,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { useSync } from "../hooks/useSync";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";
import ConflictLogModal from "./ConflictLogModal";
import ConflictResolveDialog from "./ConflictResolveDialog";

interface SyncConflictsProps {
  uiLanguage?: "vi" | "en";
  className?: string;
}

export const SyncConflicts: React.FC<SyncConflictsProps> = ({
  uiLanguage = "vi",
  className
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
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState<boolean>(false);
  const [expandedDetailsMap, setExpandedDetailsMap] = useState<Record<string, boolean>>({});

  const isVi = uiLanguage === "vi";

  const handleResolveSingle = async (conflictId: string, resolution: "local" | "remote") => {
    try {
      setProcessingId(conflictId);
      await resolveConflict(conflictId, resolution);
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolveAll = async (resolution: "local" | "remote") => {
    try {
      setBulkProcessing(true);
      await resolveAllConflicts(resolution);
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleDetails = (id: string) => {
    setExpandedDetailsMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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

  const pendingConflicts = conflicts.filter(c => c.status === "pending");

  return (
    <Card className={cn("p-6 sm:p-8 border-border-subtle space-y-6 text-left shadow-sm", className)}>
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-2xl shrink-0 transition-colors",
            pendingConflicts.length > 0 
              ? "bg-amber-500/10 text-amber-500 dark:text-amber-400" 
              : "bg-brand-accent/10 text-brand-accent"
          )}>
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black uppercase tracking-tight text-text-primary">
                {isVi ? "Trình giải quyết Xung đột Đồng bộ" : "Sync Conflict Resolver"}
              </h4>
              {pendingConflicts.length > 0 ? (
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse">
                  {pendingConflicts.length} {isVi ? "xung đột" : "conflicts"}
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  {isVi ? "An toàn" : "Synced"}
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {isVi 
                ? "So sánh song song nội dung tập tin cục bộ và đám mây để quyết định giữ bản ghi phù hợp" 
                : "Side-by-side comparison of local vs remote content versions with manual conflict resolution controls"}
            </p>
          </div>
        </div>

        {/* Bulk Action Buttons & Conflict Log Modal Shortcut */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsResolveDialogOpen(true)}
            className="h-8 text-[10px] font-black uppercase tracking-wider text-brand-accent border-brand-accent/30 hover:bg-brand-accent/10 transition-all shrink-0"
            title={isVi ? "Mở Hộp thoại Giải quyết Xung đột" : "Open Conflict Resolve Dialog"}
          >
            <GitCompare className="w-3.5 h-3.5 mr-1.5 text-brand-accent" />
            {isVi ? "Hộp thoại Giải quyết Xung đột" : "Conflict Resolve Dialog"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLogModalOpen(true)}
            className="h-8 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 transition-all shrink-0"
            title={isVi ? "Mở cửa sổ Nhật ký Xung đột để quản lý & xử lý hàng loạt" : "Open Conflict Log modal for bulk resolution"}
          >
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
            {isVi ? "Cửa sổ Nhật ký Xung đột" : "Conflict Log Modal"}
          </Button>

          {pendingConflicts.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkProcessing}
                onClick={() => handleResolveAll("local")}
                className="h-8 text-[10px] font-black uppercase tracking-wider text-text-primary hover:border-brand-accent transition-all"
                title={isVi ? "Giữ tất cả phiên bản tập tin cục bộ trên thiết bị" : "Keep all local device file versions"}
              >
                <HardDrive className="w-3 h-3 mr-1.5 text-brand-accent" />
                {isVi ? "Giữ Tất cả Cục bộ" : "Keep All Local"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkProcessing}
                onClick={() => handleResolveAll("remote")}
                className="h-8 text-[10px] font-black uppercase tracking-wider text-text-primary hover:border-sky-500 transition-all"
                title={isVi ? "Ghi đè tất cả tập tin cục bộ bằng dữ liệu từ đám mây" : "Overwrite all local files with cloud remote data"}
              >
                <CloudDownload className="w-3 h-3 mr-1.5 text-sky-500" />
                {isVi ? "Ghi đè Tất cả bằng Đám mây" : "Overwrite All with Remote"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Auto-Resolve Conflicts Visual Toggle Control */}
      <div className={cn(
        "p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        autoResolveConflicts 
          ? "bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-500/10" 
          : "bg-surface-subtle/50 border-border-subtle"
      )}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl shrink-0 transition-colors mt-0.5 sm:mt-0",
            autoResolveConflicts 
              ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30" 
              : "bg-surface-bg text-text-muted border border-border-subtle"
          )}>
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-text-primary">
                {isVi ? "Tự động Giải quyết Xung đột" : "Auto-Resolve Conflicts"}
              </span>
              {autoResolveConflicts ? (
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  {isVi ? "Đã bật (Timestamp)" : "Enabled (Timestamp)"}
                </span>
              ) : (
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  {isVi ? "Giải quyết Thủ công" : "Manual Selection"}
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              {isVi
                ? "Tự động chọn và lưu phiên bản có mốc thời gian cập nhật gần nhất (Timestamp) khi phát hiện va chạm dữ liệu."
                : "Automatically keep and apply the data version with the most recent modification timestamp upon collision."}
            </p>
          </div>
        </div>

        {/* Visual Toggle Switch Button */}
        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
          <span className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider">
            {autoResolveConflicts ? (isVi ? "BẬT" : "ON") : (isVi ? "TẮT" : "OFF")}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={autoResolveConflicts}
            onClick={() => toggleAutoResolveConflicts(!autoResolveConflicts)}
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2",
              autoResolveConflicts ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-700"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                autoResolveConflicts ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>

      {/* Main Conflict Content */}
      {pendingConflicts.length === 0 ? (
        <div className="py-10 px-4 text-center space-y-4 bg-surface-subtle/30 rounded-2xl border border-dashed border-border-subtle">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <p className="text-xs font-bold text-text-primary uppercase tracking-wider">
              {isVi ? "Không tìm thấy xung đột dữ liệu nào" : "No Data Conflicts Detected"}
            </p>
            <p className="text-[11px] text-text-muted leading-relaxed">
              {isVi 
                ? "Tất cả tập tin bản tin và cấu hình người dùng trên thiết bị hiện tại hoàn toàn đồng nhất với dữ liệu đám mây Supabase." 
                : "All briefings and configuration files on this device match cloud data without any synchronization collisions."}
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
              {isVi ? "Mô phỏng Xung đột Thử nghiệm" : "Simulate Test Conflict"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingConflicts.map((conflict) => {
            const isProcessing = processingId === conflict.id || bulkProcessing;
            const isExpanded = !!expandedDetailsMap[conflict.id];

            // Compare timestamps to detect which version is newer
            const localTime = new Date(conflict.localVersion.updatedAt).getTime();
            const remoteTime = new Date(conflict.remoteVersion.updatedAt).getTime();
            const isLocalNewer = localTime > remoteTime;
            const isRemoteNewer = remoteTime > localTime;

            return (
              <div 
                key={conflict.id}
                className="bg-surface-subtle/60 border border-amber-500/30 rounded-2xl p-5 sm:p-6 space-y-5 text-left shadow-sm relative overflow-hidden transition-all hover:border-amber-500/50"
              >
                {/* Accent top line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

                {/* Conflict Item Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle/80 pb-4">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4.5 h-4.5 text-amber-500 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-text-primary truncate">
                          {conflict.fileName}
                        </span>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-surface-bg border border-border-subtle text-text-muted">
                          {conflict.entityType}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted font-mono mt-0.5">
                        ID: {conflict.fileId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted bg-surface-bg/80 px-2.5 py-1 rounded-lg border border-border-subtle">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>{isVi ? "Phát hiện lúc:" : "Detected at:"} {formatDate(conflict.detectedAt)}</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDetails(conflict.id)}
                      className="h-7 text-[10px] font-mono font-bold text-text-muted hover:text-text-primary px-2"
                    >
                      {isExpanded ? (
                        <>
                          <span>{isVi ? "Thu gọn" : "Hide Details"}</span>
                          <ChevronUp className="w-3 h-3 ml-1" />
                        </>
                      ) : (
                        <>
                          <span>{isVi ? "Xem Chi tiết Diff" : "View Diff"}</span>
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Side-by-Side Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* LOCAL VERSION CARD */}
                  <div className={cn(
                    "bg-surface-bg p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all relative",
                    isLocalNewer ? "border-brand-accent/60 shadow-xs" : "border-border-subtle hover:border-brand-accent/40"
                  )}>
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-brand-accent" />
                          <span className="text-xs font-bold text-text-primary">
                            {isVi ? "Phiên bản Cục bộ (Thiết bị)" : "Local Device Version"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isLocalNewer && (
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              {isVi ? "Mới hơn" : "Newer"}
                            </span>
                          )}
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent border border-brand-accent/20">
                            LOCAL
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div className="bg-surface-subtle/60 p-3 rounded-xl border border-border-subtle/60 text-xs text-text-primary font-medium leading-relaxed">
                          {conflict.localVersion.description}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-text-muted bg-surface-subtle/30 p-2.5 rounded-xl border border-border-subtle/40">
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-text-muted opacity-70">
                              {isVi ? "Thời gian sửa:" : "Modified:"}
                            </span>
                            <span className="font-bold text-text-primary">{formatDate(conflict.localVersion.updatedAt)}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-text-muted opacity-70">
                              {isVi ? "Kích thước:" : "Size:"}
                            </span>
                            <span className="font-bold text-text-primary">{formatSize(conflict.localVersion.sizeBytes)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="default"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleResolveSingle(conflict.id, "local")}
                      className="w-full text-xs font-bold uppercase tracking-wider h-10 shadow-sm"
                      title={isVi ? "Giữ dữ liệu cục bộ hiện tại và tải lên đám mây" : "Keep current local data version and push to remote"}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {isVi ? "Giữ bản Cục bộ" : "Keep Local"}
                    </Button>
                  </div>

                  {/* REMOTE VERSION CARD */}
                  <div className={cn(
                    "bg-surface-bg p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all relative",
                    isRemoteNewer ? "border-sky-500/60 shadow-xs" : "border-border-subtle hover:border-sky-500/40"
                  )}>
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Cloud className="w-4 h-4 text-sky-500" />
                          <span className="text-xs font-bold text-text-primary">
                            {isVi ? "Phiên bản Đám mây (Supabase)" : "Cloud Remote Version"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isRemoteNewer && (
                            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              {isVi ? "Mới hơn" : "Newer"}
                            </span>
                          )}
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-500 border border-sky-500/20">
                            REMOTE
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div className="bg-surface-subtle/60 p-3 rounded-xl border border-border-subtle/60 text-xs text-text-primary font-medium leading-relaxed">
                          {conflict.remoteVersion.description}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-text-muted bg-surface-subtle/30 p-2.5 rounded-xl border border-border-subtle/40">
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-text-muted opacity-70">
                              {isVi ? "Thời gian sửa:" : "Modified:"}
                            </span>
                            <span className="font-bold text-text-primary">{formatDate(conflict.remoteVersion.updatedAt)}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] uppercase tracking-wider text-text-muted opacity-70">
                              {isVi ? "Kích thước:" : "Size:"}
                            </span>
                            <span className="font-bold text-text-primary">{formatSize(conflict.remoteVersion.sizeBytes)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleResolveSingle(conflict.id, "remote")}
                      className="w-full text-xs font-bold uppercase tracking-wider h-10 border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500 transition-all"
                      title={isVi ? "Ghi đè bộ nhớ cục bộ bằng dữ liệu từ đám mây" : "Overwrite local storage with cloud remote version"}
                    >
                      <CloudDownload className="w-4 h-4 mr-2" />
                      {isVi ? "Ghi đè bằng Đám mây" : "Overwrite with Remote"}
                    </Button>
                  </div>
                </div>

                {/* Expandable JSON / Field Details Diff Viewer */}
                {isExpanded && (
                  <div className="pt-2 border-t border-border-subtle/60 animate-in fade-in slide-in-from-top-1">
                    <div className="bg-surface-bg p-4 rounded-xl border border-border-subtle space-y-3 font-mono text-xs">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-text-primary border-b border-border-subtle pb-2">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isVi ? "Bảng so sánh chi tiết thuộc tính dữ liệu" : "Detailed Property Diff Comparison"}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                        {/* Local Details */}
                        <div className="space-y-1.5 bg-surface-subtle/40 p-3 rounded-lg border border-border-subtle">
                          <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider block">
                            [LOCAL] {isVi ? "Cấu trúc dữ liệu Cục bộ" : "Local Data Structure"}
                          </span>
                          <pre className="text-[10px] text-text-muted whitespace-pre-wrap font-mono overflow-x-auto max-h-40 p-2 rounded bg-surface-bg border border-border-subtle/50">
                            {JSON.stringify(conflict.localVersion.details || { description: conflict.localVersion.description }, null, 2)}
                          </pre>
                        </div>

                        {/* Remote Details */}
                        <div className="space-y-1.5 bg-surface-subtle/40 p-3 rounded-lg border border-border-subtle">
                          <span className="text-[10px] font-bold text-sky-500 uppercase tracking-wider block">
                            [REMOTE] {isVi ? "Cấu trúc dữ liệu Đám mây" : "Remote Data Structure"}
                          </span>
                          <pre className="text-[10px] text-text-muted whitespace-pre-wrap font-mono overflow-x-auto max-h-40 p-2 rounded bg-surface-bg border border-border-subtle/50">
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

      {/* Standalone Conflict Log Modal */}
      <ConflictLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        uiLanguage={uiLanguage}
      />

      {/* Standalone Conflict Resolve Dialog */}
      <ConflictResolveDialog
        isOpen={isResolveDialogOpen}
        onClose={() => setIsResolveDialogOpen(false)}
        uiLanguage={uiLanguage}
      />
    </Card>
  );
};

export default SyncConflicts;
export { SyncConflicts as SyncConflictResolver };
