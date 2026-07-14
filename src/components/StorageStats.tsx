import { colors } from "../foundation/tokens/colors";
import React, { useState } from "react";
import { Database, AlertTriangle, Trash2, HardDrive, ShieldCheck, Play, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { runRecommendationTestSuite, TestResult } from "../utils/testSuite";

interface StorageStatsProps {
  usedMB: number;
  totalItems: number;
  onClearAll?: () => void;
  uiLanguage?: "vi" | "en";
}

const LIMIT_MB = 50.0;

export default function StorageStats({ usedMB, totalItems, onClearAll, uiLanguage = "vi" }: StorageStatsProps) {
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const percentage = Math.min(100, parseFloat(((usedMB / LIMIT_MB) * 100).toFixed(1)));
  const isCloseToLimit = usedMB >= 40.0;
  const isExceeded = usedMB >= LIMIT_MB;

  const t = {
    vi: {
      title: "Quản Lý Bộ Nhớ Bản Tin",
      used: "Đã sử dụng",
      items: "Bản tin đã lưu",
      clearAllBtn: "Xóa toàn bộ kịch bản và audio",
      warningExceeded: "⚠️ Cảnh báo: Bộ nhớ IndexedDB đã dùng vượt ngưỡng 50MB!",
      warningClose: "⚠️ Sắp đầy bộ nhớ: Bạn đã sử dụng hơn 80% dung lượng tối ưu (40MB/50MB).",
      advice: "Gợi ý: Hãy xóa bớt các bản tin cũ không còn nghe để tránh làm chậm hệ thống và đảm bảo dệt các kịch bản mới mượt mà.",
      noItems: "Chưa sử dụng",
      runDiag: "Chạy Thử Nghiệm Thuật Toán Gợi Ý",
      diagProgress: "Đang kiểm tra...",
      diagHeader: "Kết Quả Kiểm Thử (Recommendation Engine Test Suite)"
    },
    en: {
      title: "Storage & Workspace Health",
      used: "Used",
      items: "Saved Briefings",
      clearAllBtn: "Clear storage history",
      warningExceeded: "⚠️ Warning: IndexedDB storage usage exceeded 50MB threshold!",
      warningClose: "⚠️ Storage running low: You have used over 80% of optimal capacity (40MB/50MB).",
      advice: "Tip: Delete older or unused briefings to keep performance peak and ensure seamless audio compilation.",
      noItems: "Empty",
      runDiag: "Run Recommendation Engine Tests",
      diagProgress: "Testing algs...",
      diagHeader: "Alg Diagnostics (Recommendation Engine Test Suite)"
    }
  }[uiLanguage];

  // Pick color based on storage status
  const getStatusColor = () => {
    if (isExceeded) return colors.critical;
    if (isCloseToLimit) return colors.warning;
    return colors.interactive;
  };

  const statusColor = getStatusColor();

  const handleRunDiagnostics = async () => {
    try {
      setIsTesting(true);
      const res = await runRecommendationTestSuite();
      setTestResults(res);
    } catch (err) {
      console.error("Failed to run diagnostics:", err);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="rounded-3xl border p-5 shadow-xs flex flex-col gap-4" 
         style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textSecondary }} 
         id="storage-stats-container">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"
            style={{ color: colors.textPrimary }}>
          <HardDrive className="w-4.5 h-4.5" style={{ color: colors.interactive }} />
          <span>{t.title}</span>
        </h4>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono font-bold"
             style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border, color: colors.textSecondary }}>
          <span>{totalItems} {t.items}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 border p-4 rounded-2xl"
           style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
        <div className="flex justify-between items-end">
          <span className="text-xs font-medium" style={{ color: colors.textMuted }}>{t.used}</span>
          <span className="text-xs font-mono font-bold" style={{ color: colors.textPrimary }}>
            {usedMB.toFixed(2)} MB / {LIMIT_MB} MB ({percentage}%)
          </span>
        </div>

        {/* Progress Bar with motion layout animations */}
        <div className="w-full h-3 rounded-full overflow-hidden relative"
             style={{ backgroundColor: colors.border }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: statusColor }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Warnings & Advice */}
      {(isCloseToLimit || isExceeded) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl border text-xs leading-relaxed flex gap-2.5 items-start"
          style={isExceeded 
            ? { backgroundColor: `${colors.critical}1a`, borderColor: `${colors.critical}33`, color: colors.critical }
            : { backgroundColor: `${colors.warning}1a`, borderColor: `${colors.warning}33`, color: colors.warning }
          }
        >
          <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" 
                         style={{ color: isExceeded ? colors.critical : colors.warning }} />
          <div className="flex flex-col gap-1">
            <p className="font-bold">
              {isExceeded ? t.warningExceeded : t.warningClose}
            </p>
            <p className="opacity-90">{t.advice}</p>
          </div>
        </motion.div>
      )}

      {/* Diagnostics / Test Suite Section */}
      <div className="border-t pt-3" style={{ borderColor: colors.border }} id="diagnostic-test-suite">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color: colors.textMuted }}>
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: colors.interactive }} />
            <span>AI recommendation diagnostics</span>
          </span>
          <button
            onClick={handleRunDiagnostics}
            disabled={isTesting}
            className="text-[10px] px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-80"
            style={{ 
              backgroundColor: `${colors.interactive}0d`, 
              borderColor: `${colors.interactive}33`, 
              color: colors.interactive,
              minHeight: "32px"
            }}
          >
            {isTesting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-2.5 h-2.5" />
            )}
            <span>{isTesting ? t.diagProgress : t.runDiag}</span>
          </button>
        </div>

        {testResults && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-2xl p-3.5 border text-xs space-y-2 max-h-[160px] overflow-y-auto font-sans shadow-inner mt-2.5 custom-scrollbar"
            style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}
          >
            <span className="font-bold text-[11px] block mb-1" style={{ color: colors.textPrimary }}>
              {t.diagHeader}:
            </span>
            <div className="space-y-1.5">
              {testResults.map((res, idx) => (
                <div key={idx} className="flex items-start justify-between px-2.5 py-1.5 rounded-xl border"
                     style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <div className="flex items-center gap-2">
                    {res.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: colors.success }} />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 shrink-0" style={{ color: colors.critical }} />
                    )}
                    <span className="font-medium text-[11px]" style={{ color: colors.textSecondary }}>{res.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[9px] font-semibold">
                    <span style={{ color: colors.textMuted }}>({res.durationMs}ms)</span>
                    <span style={{ color: res.passed ? colors.success : colors.critical }}>
                      {res.passed ? "PASS" : "FAIL"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Clear Storage action if handler is provided and items exist */}
      {onClearAll && totalItems > 0 && (
        <div className="flex justify-end pt-1">
          <button
            onClick={() => {
              const confirmMsg = uiLanguage === "vi"
                ? "Hành động này sẽ xóa toàn bộ danh sách bản tin đã lưu và tất cả các tệp âm thanh trong bộ nhớ máy. Bạn có chắc chắn muốn xóa?"
                : "This action will permanently delete all saved briefings and local audio tracks from IndexedDB. Are you sure?";
              if (window.confirm(confirmMsg)) {
                onClearAll();
              }
            }}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl transition font-bold border cursor-pointer hover:bg-opacity-80 active:scale-95"
            style={{ 
              backgroundColor: `${colors.critical}0d`, 
              borderColor: `${colors.critical}33`, 
              color: colors.critical,
              minHeight: "40px"
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearAllBtn}</span>
          </button>
        </div>
      )}
    </div>
  );
}
