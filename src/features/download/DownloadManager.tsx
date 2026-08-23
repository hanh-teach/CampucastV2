// src/features/download/DownloadManager.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DownloadCloud, HardDrive, Trash2, CheckCircle, RefreshCw, FolderClosed, ShieldAlert } from "lucide-react";
import { getPlayQueue, savePlayQueue } from "../store";
import { colors } from "../../foundation/tokens/colors";

interface DownloadManagerProps {
  savedBriefings: any[];
  onDeleteBriefing?: (id: string) => void;
  onClearAll?: () => void;
  uiLanguage?: "vi" | "en";
}

export function DownloadManager({
  savedBriefings,
  onDeleteBriefing,
  onClearAll,
  uiLanguage = "vi"
}: DownloadManagerProps) {
  const [totalSizeMB, setTotalSizeMB] = useState(0);

  useEffect(() => {
    // Dynamically estimate downloaded size based on character length and audio chunks
    let bytes = 0;
    savedBriefings.forEach(briefing => {
      // JSON text estimate
      bytes += JSON.stringify(briefing).length * 2;
      // Audio chunks base64 estimate
      if (briefing.audioChunks) {
        briefing.audioChunks.forEach((chunk: string) => {
          bytes += chunk.length * 0.75;
        });
      }
    });

    setTotalSizeMB(parseFloat((bytes / (1024 * 1024)).toFixed(2)));
  }, [savedBriefings]);

  return (
    <div className="p-6 rounded-3xl border shadow-xl flex flex-col text-left transition-colors" 
         id="download-manager-panel"
         style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DownloadCloud className="w-5 h-5" style={{ color: colors.interactive }} />
          <h3 className="font-bold" style={{ color: colors.textPrimary }}>
            {uiLanguage === "vi" ? "Trình Quản Lý Tải Xuống" : "Download & Cache Center"}
          </h3>
        </div>
        {savedBriefings.length > 0 && onClearAll && (
          <button
            onClick={() => {
              if (window.confirm(uiLanguage === "vi" ? "Xóa toàn bộ các tệp và kịch bản đã lưu ngoại tuyến?" : "Clear all offline cache and briefings?")) {
                onClearAll();
              }
            }}
            className="text-xs transition font-bold"
            style={{ minHeight: "44px", color: colors.critical }}
          >
            {uiLanguage === "vi" ? "Dọn dẹp tất cả" : "Clear all cache"}
          </button>
        )}
      </div>

      <div className="p-4 rounded-2xl border mb-5 flex items-center justify-between"
           style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
        <div className="flex items-center gap-2.5">
          <HardDrive className="w-5 h-5" style={{ color: colors.interactive }} />
          <div>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              {uiLanguage === "vi" ? "Bộ nhớ đệm ngoại tuyến" : "Offline Cache Used"}
            </p>
            <p className="text-lg font-black font-mono" style={{ color: colors.textPrimary }}>
              {totalSizeMB.toFixed(2)} MB
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: colors.textMuted }}>
            {uiLanguage === "vi" ? "Tổng số bản tin" : "Total stored items"}
          </p>
          <p className="text-sm font-black" style={{ color: colors.textPrimary }}>
            {savedBriefings.length}
          </p>
        </div>
      </div>

      {savedBriefings.length === 0 ? (
        <div className="py-8 px-4 text-center border border-dashed rounded-2xl flex flex-col items-center justify-center"
             style={{ borderColor: colors.border }}>
          <FolderClosed className="w-8 h-8 mb-2 stroke-[1.5]" style={{ color: colors.textMuted, opacity: 0.5 }} />
          <p className="text-xs font-bold" style={{ color: colors.textMuted }}>
            {uiLanguage === "vi" ? "Chưa có bản tin tải xuống ngoại tuyến." : "No offline downloads available."}
          </p>
          <p className="text-[10px] max-w-[220px] mt-1" style={{ color: colors.textMuted }}>
            {uiLanguage === "vi" ? "Các bản tin phát thanh bạn tạo sẽ tự động được đồng bộ và lưu ngoại tuyến tại đây." : "Briefings you generate are automatically saved and cached here for offline play."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence>
            {savedBriefings.map((briefing) => (
              <motion.div
                key={briefing.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 border rounded-2xl flex justify-between items-center gap-3 text-xs"
                style={{ backgroundColor: `${colors.surfaceOverlay}80`, borderColor: colors.border }}
              >
                <div className="overflow-hidden flex-1">
                  <p className="font-bold truncate" style={{ color: colors.textPrimary }}>
                    {briefing.title || briefing.payload?.title || (uiLanguage === "vi" ? "Bản tin không tên" : "Untitled Briefing")}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                    {new Date(briefing.timestamp).toLocaleString(uiLanguage === "vi" ? "vi-VN" : "en-US")}
                  </p>
                </div>
                {onDeleteBriefing && (
                  <button
                    onClick={() => onDeleteBriefing(briefing.id)}
                    className="p-2 rounded-xl transition hover:scale-110 active:scale-95"
                    style={{ minHeight: "44px", minWidth: "44px", color: colors.textMuted }}
                    title={uiLanguage === "vi" ? "Xóa tệp ngoại tuyến" : "Delete offline file"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
