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
  TrendingUp,
  Download,
  FileText,
  FileSpreadsheet
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import { useSync } from "../hooks/useSync";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";

interface ConflictLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLanguage?: "vi" | "en";
}

export const ConflictLogModal: React.FC<ConflictLogModalProps> = ({
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
  const [chartDays, setChartDays] = useState<7 | 30 | 90>(30);

  const isVi = uiLanguage === "vi";

  // Filter pending unresolved conflicts
  const pendingConflicts = conflicts.filter((c) => c.status === "pending");

  // Compute conflict frequency trend data for Recharts based on selected chartDays
  const chartData = React.useMemo(() => {
    const days: Record<string, { date: string; count: number; rawDate: string }> = {};
    const today = new Date();
    
    // Initialize last N days with 0 conflicts
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString(isVi ? "vi-VN" : "en-US", { month: "short", day: "numeric" });
      days[key] = { date: label, count: 0, rawDate: key };
    }

    // Count conflicts by detectedAt or localVersion.updatedAt
    conflicts.forEach(c => {
      const timestamp = c.detectedAt || c.localVersion.updatedAt;
      if (timestamp) {
        const key = timestamp.split("T")[0];
        if (days[key]) {
          days[key].count += 1;
        }
      }
    });

    return Object.values(days);
  }, [conflicts, isVi, chartDays]);

  // Close modal on Escape key press
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

  const handleResolveSingle = async (conflictId: string, resolution: "local" | "remote") => {
    try {
      setProcessingId(conflictId);
      await resolveConflict(conflictId, resolution);
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkResolve = async (resolution: "local" | "remote") => {
    try {
      setBulkProcessing(true);
      await resolveAllConflicts(resolution);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkResolveByTimestamp = async () => {
    try {
      setBulkProcessing(true);
      for (const conflict of pendingConflicts) {
        const localTime = new Date(conflict.localVersion.updatedAt).getTime();
        const remoteTime = new Date(conflict.remoteVersion.updatedAt).getTime();
        const choice = localTime >= remoteTime ? "local" : "remote";
        await resolveConflict(conflict.id, choice);
      }
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conflicts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sync_conflicts_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    if (conflicts.length === 0) return;
    const headers = ["ID", "Entity Type", "File Name", "Status", "Detected At", "Local Updated At", "Remote Updated At"];
    const rows = conflicts.map(c => [
      c.id,
      c.entityType,
      `"${(c.fileName || "").replace(/"/g, '""')}"`,
      c.status,
      c.detectedAt,
      c.localVersion.updatedAt,
      c.remoteVersion.updatedAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sync_conflicts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const toggleDetails = (id: string) => {
    setExpandedDetailsMap((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Card Backdrop Dismiss Area */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Modal Container */}
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-surface-bg border border-border-subtle rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Banner Bar */}
        <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 shrink-0" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-border-subtle flex items-center justify-between gap-4 bg-surface-subtle/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-2xl shrink-0",
              pendingConflicts.length > 0
                ? "bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse"
                : "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
            )}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-text-primary">
                  {isVi ? "Nhật ký Xung đột Đồng bộ" : "Sync Conflict Log"}
                </h3>
                {pendingConflicts.length > 0 ? (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                    {pendingConflicts.length} {isVi ? "chưa xử lý" : "unresolved"}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    {isVi ? "Đã giải quyết" : "Resolved"}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {isVi 
                  ? "Danh sách va chạm dữ liệu giữa thiết bị cục bộ và máy chủ đám mây Supabase với mốc thời gian sửa đổi" 
                  : "List of data collisions between local device and Supabase cloud server with modification timestamps"}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-9 h-9 p-0 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-subtle shrink-0"
            title={isVi ? "Đóng cửa sổ" : "Close modal"}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Modal Toolbar & Bulk Resolution Bar */}
        {pendingConflicts.length > 0 && (
          <div className="px-5 py-3.5 bg-amber-500/5 border-b border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{isVi ? "Xử lý Hàng loạt (Bulk Resolution):" : "Bulk Resolution Controls:"}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Keep All Local */}
              <Button
                variant="outline"
                size="sm"
                disabled={bulkProcessing}
                onClick={() => handleBulkResolve("local")}
                className="h-8 text-[10px] font-black uppercase tracking-wider text-text-primary border-brand-accent/40 hover:bg-brand-accent/10 transition-all"
                title={isVi ? "Giữ tất cả phiên bản tập tin cục bộ" : "Keep all local device versions"}
              >
                <HardDrive className="w-3 h-3 mr-1.5 text-brand-accent" />
                {isVi ? "Giữ Tất cả Cục bộ" : "Keep All Local"}
              </Button>

              {/* Overwrite All Remote */}
              <Button
                variant="outline"
                size="sm"
                disabled={bulkProcessing}
                onClick={() => handleBulkResolve("remote")}
                className="h-8 text-[10px] font-black uppercase tracking-wider text-text-primary border-sky-500/40 hover:bg-sky-500/10 transition-all"
                title={isVi ? "Ghi đè tất cả bằng dữ liệu đám mây" : "Overwrite all local files with remote cloud data"}
              >
                <CloudDownload className="w-3 h-3 mr-1.5 text-sky-500" />
                {isVi ? "Ghi đè Tất cả (Remote)" : "Overwrite All (Remote)"}
              </Button>

              {/* Bulk Resolve by Timestamp */}
              <Button
                variant="default"
                size="sm"
                disabled={bulkProcessing}
                onClick={handleBulkResolveByTimestamp}
                className="h-8 text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs"
                title={isVi ? "Tự động chọn phiên bản có mốc thời gian cập nhật mới nhất cho tất cả xung đột" : "Auto-select newest timestamp for all conflicts"}
              >
                <Sparkles className="w-3 h-3 mr-1.5 text-white" />
                {isVi ? "Chọn Theo Timestamp Mới Nhất" : "Resolve by Newest Timestamp"}
              </Button>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 max-h-[60vh] custom-scrollbar">
          {/* Export Actions Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface-subtle/30 border border-border-subtle rounded-2xl p-4">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-brand-accent" />
              <div>
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  {isVi ? "Xuất Dữ liệu Xung đột" : "Export Conflict Log"}
                </h4>
                <p className="text-[10px] text-text-muted">
                  {isVi ? `Tổng số ${conflicts.length} bản ghi xung đột (pending & resolved)` : `Total ${conflicts.length} conflict records (pending & resolved)`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
                className="h-8 text-[10px] font-black uppercase tracking-wider text-text-primary border-border-subtle hover:bg-surface-subtle transition-all flex-1 sm:flex-none"
                title={isVi ? "Xuất danh sách xung đột dưới dạng JSON" : "Export conflict log as JSON file"}
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                {isVi ? "Xuất JSON" : "Export JSON"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-8 text-[10px] font-black uppercase tracking-wider text-text-primary border-border-subtle hover:bg-surface-subtle transition-all flex-1 sm:flex-none"
                title={isVi ? "Xuất danh sách xung đột dưới dạng CSV" : "Export conflict log as CSV spreadsheet"}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                {isVi ? "Xuất CSV" : "Export CSV"}
              </Button>
            </div>
          </div>

          {/* Conflict Frequency Trend Chart with Date Range Filter */}
          <div className="bg-surface-subtle/50 border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  {isVi ? `Tần suất Xung đột ${chartDays} Ngày qua` : `${chartDays}-Day Conflict Frequency Trend`}
                </h4>
              </div>

              {/* Date Range Selector Buttons */}
              <div className="flex items-center gap-1 bg-surface-bg p-1 rounded-xl border border-border-subtle">
                {([7, 30, 90] as const).map((days) => (
                  <button
                    key={days}
                    onClick={() => setChartDays(days)}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all",
                      chartDays === days
                        ? "bg-amber-500 text-white shadow-xs"
                        : "text-text-muted hover:text-text-primary hover:bg-surface-subtle"
                    )}
                  >
                    {days} {isVi ? "ngày" : "d"}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-44 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }} 
                    stroke="currentColor" 
                    className="opacity-60" 
                    interval={chartDays === 7 ? 0 : chartDays === 30 ? 4 : 14} 
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 10 }} 
                    stroke="currentColor" 
                    className="opacity-60" 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      borderColor: 'rgba(255, 255, 255, 0.1)', 
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#f8fafc'
                    }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '2px', color: '#fbbf24' }}
                    formatter={(value: any) => [`${value} ${isVi ? "xung đột" : "conflicts"}`, isVi ? "Số lượng" : "Frequency"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#f59e0b" 
                    strokeWidth={2.5} 
                    dot={{ r: chartDays === 90 ? 2 : 3, fill: '#f59e0b' }} 
                    activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {pendingConflicts.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-4 bg-surface-subtle/30 rounded-2xl border border-dashed border-border-subtle">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <p className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  {isVi ? "Không có xung đột dữ liệu chưa xử lý" : "No Unresolved Data Conflicts"}
                </p>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  {isVi 
                    ? "Tất cả thông tin bản tin và cấu hình thiết bị cục bộ hoàn toàn đồng bộ và phù hợp với máy chủ đám mây Supabase." 
                    : "All local device briefings and user settings are synchronized smoothly with Supabase cloud storage."}
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
            <div className="space-y-5">
              {pendingConflicts.map((conflict) => {
                const isProcessing = processingId === conflict.id || bulkProcessing;
                const isExpanded = !!expandedDetailsMap[conflict.id];

                // Timestamps comparison
                const localTime = new Date(conflict.localVersion.updatedAt).getTime();
                const remoteTime = new Date(conflict.remoteVersion.updatedAt).getTime();
                const isLocalNewer = localTime > remoteTime;
                const isRemoteNewer = remoteTime > localTime;

                return (
                  <div
                    key={conflict.id}
                    className="bg-surface-subtle/50 border border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4 text-left shadow-xs hover:border-amber-500/50 transition-all"
                  >
                    {/* Item Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
                      <div className="flex items-center gap-2.5">
                        <GitCompare className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-text-primary truncate max-w-[280px]">
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
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted bg-surface-bg px-2.5 py-1 rounded-lg border border-border-subtle">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{isVi ? "Phát hiện:" : "Detected:"} {formatDate(conflict.detectedAt)}</span>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDetails(conflict.id)}
                          className="h-7 text-[10px] font-mono font-bold text-text-muted hover:text-text-primary px-2"
                        >
                          {isExpanded ? (
                            <>
                              <span>{isVi ? "Thu gọn" : "Hide Diff"}</span>
                              <ChevronUp className="w-3 h-3 ml-1" />
                            </>
                          ) : (
                            <>
                              <span>{isVi ? "Xem Diff" : "View Diff"}</span>
                              <ChevronDown className="w-3 h-3 ml-1" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Side-by-Side Version Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* LOCAL VERSION */}
                      <div className={cn(
                        "bg-surface-bg p-4 rounded-xl border flex flex-col justify-between space-y-3.5 transition-all",
                        isLocalNewer ? "border-brand-accent/60 shadow-xs" : "border-border-subtle"
                      )}>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-border-subtle/60 pb-2">
                            <div className="flex items-center gap-2">
                              <HardDrive className="w-3.5 h-3.5 text-brand-accent" />
                              <span className="text-xs font-bold text-text-primary">
                                {isVi ? "Bản Cục bộ (Thiết bị)" : "Local Device Version"}
                              </span>
                            </div>
                            {isLocalNewer && (
                              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                {isVi ? "Mới hơn" : "Newer"}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-text-primary bg-surface-subtle/60 p-2.5 rounded-lg border border-border-subtle/60 font-medium">
                            {conflict.localVersion.description}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-text-muted bg-surface-subtle/30 p-2 rounded-lg border border-border-subtle/40">
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider text-text-muted opacity-70">
                                {isVi ? "Thời gian:" : "Modified:"}
                              </span>
                              <span className="font-bold text-text-primary">{formatDate(conflict.localVersion.updatedAt)}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider text-text-muted opacity-70">
                                {isVi ? "Dung lượng:" : "Size:"}
                              </span>
                              <span className="font-bold text-text-primary">{formatSize(conflict.localVersion.sizeBytes)}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="default"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleResolveSingle(conflict.id, "local")}
                          className="w-full text-xs font-bold uppercase tracking-wider h-9 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                          {isVi ? "Giữ bản Cục bộ" : "Keep Local"}
                        </Button>
                      </div>

                      {/* REMOTE VERSION */}
                      <div className={cn(
                        "bg-surface-bg p-4 rounded-xl border flex flex-col justify-between space-y-3.5 transition-all",
                        isRemoteNewer ? "border-sky-500/60 shadow-xs" : "border-border-subtle"
                      )}>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-border-subtle/60 pb-2">
                            <div className="flex items-center gap-2">
                              <Cloud className="w-3.5 h-3.5 text-sky-500" />
                              <span className="text-xs font-bold text-text-primary">
                                {isVi ? "Bản Đám mây (Supabase)" : "Remote Cloud Version"}
                              </span>
                            </div>
                            {isRemoteNewer && (
                              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                {isVi ? "Mới hơn" : "Newer"}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-text-primary bg-surface-subtle/60 p-2.5 rounded-lg border border-border-subtle/60 font-medium">
                            {conflict.remoteVersion.description}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-text-muted bg-surface-subtle/30 p-2 rounded-lg border border-border-subtle/40">
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider text-text-muted opacity-70">
                                {isVi ? "Thời gian:" : "Modified:"}
                              </span>
                              <span className="font-bold text-text-primary">{formatDate(conflict.remoteVersion.updatedAt)}</span>
                            </div>
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider text-text-muted opacity-70">
                                {isVi ? "Dung lượng:" : "Size:"}
                              </span>
                              <span className="font-bold text-text-primary">{formatSize(conflict.remoteVersion.sizeBytes)}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleResolveSingle(conflict.id, "remote")}
                          className="w-full text-xs font-bold uppercase tracking-wider h-9 border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition-all"
                        >
                          <CloudDownload className="w-3.5 h-3.5 mr-1.5" />
                          {isVi ? "Ghi đè Đám mây" : "Overwrite Remote"}
                        </Button>
                      </div>
                    </div>

                    {/* Expandable JSON Diff View */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-border-subtle/60">
                        <div className="bg-surface-bg p-3.5 rounded-xl border border-border-subtle space-y-2 font-mono text-xs">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-text-primary border-b border-border-subtle pb-1.5">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
                            <span>{isVi ? "Chi tiết Cấu trúc Dữ liệu Diff" : "Detailed Data Structure Diff"}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[10px]">
                            <div className="space-y-1 bg-surface-subtle/40 p-2.5 rounded border border-border-subtle">
                              <span className="font-bold text-brand-accent block">[LOCAL DATA]</span>
                              <pre className="text-[9px] text-text-muted whitespace-pre-wrap font-mono overflow-x-auto max-h-32 p-1.5 rounded bg-surface-bg border border-border-subtle/50">
                                {JSON.stringify(conflict.localVersion.details || { description: conflict.localVersion.description }, null, 2)}
                              </pre>
                            </div>

                            <div className="space-y-1 bg-surface-subtle/40 p-2.5 rounded border border-border-subtle">
                              <span className="font-bold text-sky-500 block">[REMOTE DATA]</span>
                              <pre className="text-[9px] text-text-muted whitespace-pre-wrap font-mono overflow-x-auto max-h-32 p-1.5 rounded bg-surface-bg border border-border-subtle/50">
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

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-border-subtle bg-surface-subtle/40 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="font-mono">{pendingConflicts.length} {isVi ? "xung đột chưa xử lý" : "unresolved conflict(s)"}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs font-bold uppercase tracking-wider h-9 px-5"
          >
            {isVi ? "Đóng" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConflictLogModal;
