// src/features/memory/PersonalMemory.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Trash2, ShieldAlert, Sparkles, AlertCircle, Trash } from "lucide-react";
import { getPersonalMemory, savePersonalMemory, clearPersonalMemory, featureStoreEvents } from "../store";
import { PersonalizedMemory } from "../types";
import { colors } from "../../foundation/tokens/colors";

interface PersonalMemoryProps {
  uiLanguage?: "vi" | "en";
}

export function PersonalMemory({ uiLanguage = "vi" }: PersonalMemoryProps) {
  const [memory, setMemory] = useState<PersonalizedMemory | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const refreshMemory = () => {
    setMemory(getPersonalMemory());
  };

  useEffect(() => {
    refreshMemory();
    featureStoreEvents.addEventListener("change", refreshMemory);
    return () => {
      featureStoreEvents.removeEventListener("change", refreshMemory);
    };
  }, []);

  if (!memory) return null;

  const removeTopic = (id: string) => {
    const updated = { ...memory };
    updated.favoriteTopics = updated.favoriteTopics.filter(t => t.id !== id);
    savePersonalMemory(updated);
  };

  const handleClearAll = () => {
    clearPersonalMemory();
    setShowConfirmClear(false);
  };

  return (
    <div className="p-6 rounded-3xl border shadow-xl flex flex-col text-left transition-colors" 
         id="personal-ai-memory-panel"
         style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 animate-pulse-subtle" style={{ color: colors.interactive }} />
          <h3 className="font-bold" style={{ color: colors.textPrimary }}>
            {uiLanguage === "vi" ? "Trí Nhớ Trợ Lý AI" : "Personal AI Memory"}
          </h3>
        </div>
        {memory.favoriteTopics.length > 0 && (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="text-xs transition flex items-center gap-1 font-bold"
            style={{ minHeight: "44px", color: colors.critical }}
          >
            <Trash className="w-3.5 h-3.5" />
            {uiLanguage === "vi" ? "Xóa bộ nhớ" : "Clear memory"}
          </button>
        )}
      </div>

      <p className="text-xs sm:text-sm mb-4 leading-relaxed" style={{ color: colors.textMuted }}>
        {uiLanguage === "vi" 
          ? "AI của CommuteCast tự động ghi nhận các chủ đề, chuyên mục bạn thường nghe để cá nhân hóa đề xuất tin tức. Dữ liệu này chỉ được lưu cục bộ và có thể xóa bất cứ lúc nào."
          : "CommuteCast automatically remembers topics and source feeds you listen to, personalizing your smart recommendations. This data is kept 100% locally and private."}
      </p>

      {/* Confirmation Dialog overlay inside the component */}
      <AnimatePresence>
        {showConfirmClear && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 mb-4 border rounded-2xl flex flex-col gap-3"
            style={{ backgroundColor: `${colors.critical}1a`, borderColor: `${colors.critical}33` }}
          >
            <div className="flex gap-2 text-xs font-semibold" style={{ color: colors.critical }}>
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                {uiLanguage === "vi" 
                  ? "Bạn chắc chắn muốn xóa toàn bộ thông tin AI đã ghi nhớ?" 
                  : "Are you sure you want to completely erase your AI memory?"}
              </span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ minHeight: "44px", minWidth: "80px", backgroundColor: colors.surfaceOverlay, color: colors.textMuted }}
              >
                {uiLanguage === "vi" ? "Hủy" : "Cancel"}
              </button>
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-lg text-xs hover:opacity-90 transition font-bold"
                style={{ minHeight: "44px", minWidth: "120px", backgroundColor: colors.critical, color: colors.onAccent }}
              >
                {uiLanguage === "vi" ? "Xóa hết bộ nhớ" : "Clear Memory"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {memory.favoriteTopics.length === 0 ? (
        <div className="py-8 px-4 text-center border border-dashed rounded-2xl flex flex-col items-center justify-center"
             style={{ borderColor: colors.border }}>
          <Brain className="w-8 h-8 mb-2 stroke-[1.5]" style={{ color: colors.textMuted, opacity: 0.5 }} />
          <p className="text-xs font-bold" style={{ color: colors.textMuted }}>
            {uiLanguage === "vi" ? "AI chưa ghi nhận sở thích nào." : "AI memory is currently clean."}
          </p>
          <p className="text-[10px] max-w-[200px] mt-1" style={{ color: colors.textMuted }}>
            {uiLanguage === "vi" ? "Khi bạn bắt đầu nghe, bộ nhớ thông minh sẽ hiển thị tại đây." : "Once you start listening, your preferences will appear here."}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence>
            {memory.favoriteTopics.map((topicItem) => (
              <motion.div
                key={topicItem.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 pl-3 pr-1 py-1 border rounded-full text-xs font-medium transition"
                style={{ backgroundColor: `${colors.interactive}0d`, borderColor: `${colors.interactive}33`, color: colors.textPrimary }}
              >
                <Sparkles className="w-3 h-3" style={{ color: colors.interactive }} />
                <span className="truncate max-w-[150px]">{topicItem.topic}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black font-mono"
                      style={{ backgroundColor: `${colors.interactive}33`, color: colors.interactive }}>
                  {topicItem.interactedCount}
                </span>
                <button
                  onClick={() => removeTopic(topicItem.id)}
                  className="p-1 rounded-full transition hover:scale-110 active:scale-95"
                  style={{ minWidth: "44px", minHeight: "44px", color: colors.textMuted }}
                  title={uiLanguage === "vi" ? "Xóa chủ đề này" : "Forget this topic"}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Quick metadata about memory status */}
      {memory.favoriteTopics.length > 0 && (
        <div className="mt-4 pt-4 border-t text-[10px] flex justify-between items-center"
             style={{ borderColor: colors.border, color: colors.textMuted }}>
          <span>{uiLanguage === "vi" ? "Đồng bộ hóa: Cục bộ / Sync: Local Only" : "Data sync: Local sandbox"}</span>
          <span>
            {uiLanguage === "vi" ? `Lần hoạt động cuối: ${memory.lastActiveDate}` : `Last active: ${memory.lastActiveDate}`}
          </span>
        </div>
      )}
    </div>
  );
}
