// src/features/memory/PersonalMemory.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain, 
  Trash2, 
  ShieldAlert, 
  Sparkles, 
  Plus, 
  Download, 
  Upload, 
  Check, 
  X, 
  Filter, 
  Search,
  Eye,
  EyeOff,
  Clock,
  BookOpen
} from "lucide-react";
import { 
  getPersonalMemory, 
  savePersonalMemory, 
  clearPersonalMemory, 
  addCustomMemoryItem,
  toggleMemoryItem,
  deleteMemoryItem,
  exportMemoryJSON,
  importMemoryJSON,
  featureStoreEvents 
} from "../store";
import { PersonalizedMemory, AIMemoryItem } from "../types";
import { colors } from "../../foundation/tokens/colors";

interface PersonalMemoryProps {
  uiLanguage?: "vi" | "en";
}

export function PersonalMemory({ uiLanguage = "vi" }: PersonalMemoryProps) {
  const [memory, setMemory] = useState<PersonalizedMemory | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Add form fields
  const [newTopic, setNewTopic] = useState("");
  const [newCategory, setNewCategory] = useState("Chủ đề");
  const [newType, setNewType] = useState<"long_term" | "short_term">("long_term");
  const [newNotes, setNewNotes] = useState("");

  // Import JSON field
  const [importJsonText, setImportJsonText] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");

  // Filter & Search
  const [filterType, setFilterType] = useState<"all" | "long_term" | "short_term">("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    addCustomMemoryItem(newTopic, newCategory, newType, newNotes);
    setNewTopic("");
    setNewNotes("");
    setShowAddModal(false);
  };

  const handleToggle = (id: string) => {
    toggleMemoryItem(id);
  };

  const handleDelete = (id: string) => {
    deleteMemoryItem(id);
  };

  const handleClearAll = () => {
    clearPersonalMemory();
    setShowConfirmClear(false);
  };

  const handleExport = () => {
    const jsonStr = exportMemoryJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commutecast_ai_memory_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    const success = importMemoryJSON(importJsonText);
    if (success) {
      setImportStatus("success");
      setTimeout(() => {
        setShowImportModal(false);
        setImportStatus("idle");
        setImportJsonText("");
      }, 1000);
    } else {
      setImportStatus("error");
    }
  };

  const filteredTopics = memory.favoriteTopics.filter((item) => {
    const matchesFilter = 
      filterType === "all" ? true :
      filterType === "long_term" ? (item.type === "long_term" || !item.type) :
      (item.type === "short_term");

    const matchesSearch = searchQuery.trim() === "" || 
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 rounded-3xl border shadow-xl flex flex-col text-left transition-colors" 
         id="personal-ai-memory-panel"
         style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl" style={{ backgroundColor: `${colors.interactive}1a` }}>
            <Brain className="w-5 h-5 animate-pulse-subtle" style={{ color: colors.interactive }} />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <span>{uiLanguage === "vi" ? "Bộ Nhớ & Cá Nhân Hóa Trợ Lý AI" : "AI Personal Memory & Preferences"}</span>
            </h3>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              {uiLanguage === "vi" ? "Ghi nhớ sở thích ngắn/dài hạn để tinh chỉnh kịch bản bản tin" : "Short-term & long-term memory facts for personalized broadcasts"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition hover:opacity-90"
            style={{ backgroundColor: colors.interactive, color: colors.onAccent, minHeight: "38px" }}
          >
            <Plus className="w-4 h-4" />
            <span>{uiLanguage === "vi" ? "Thêm trí nhớ" : "Add Fact"}</span>
          </button>

          <button
            onClick={handleExport}
            title={uiLanguage === "vi" ? "Xuất JSON bộ nhớ" : "Export Memory JSON"}
            className="p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center"
            style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border, color: colors.textPrimary, minHeight: "38px", minWidth: "38px" }}
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            title={uiLanguage === "vi" ? "Nhập JSON bộ nhớ" : "Import Memory JSON"}
            className="p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center"
            style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border, color: colors.textPrimary, minHeight: "38px", minWidth: "38px" }}
          >
            <Upload className="w-4 h-4" />
          </button>

          {memory.favoriteTopics.length > 0 && (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1"
              style={{ minHeight: "38px", color: colors.critical, backgroundColor: `${colors.critical}15` }}
              title={uiLanguage === "vi" ? "Xóa bộ nhớ" : "Clear memory"}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog overlay */}
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

      {/* Add Memory Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.form
            onSubmit={handleAddMemory}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 mb-4 border rounded-2xl flex flex-col gap-3 overflow-hidden"
            style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.interactive }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.interactive }}>
                {uiLanguage === "vi" ? "Thêm Trí Nhớ Mới Cho Trợ Lý" : "Add New AI Memory Fact"}
              </span>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-xs" 
                style={{ color: colors.textMuted }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold block mb-1" style={{ color: colors.textMuted }}>
                  {uiLanguage === "vi" ? "CHỦ ĐỀ / NỘI DUNG GHI NHỚ *" : "TOPIC / MEMORY FACT *"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={uiLanguage === "vi" ? "Ví dụ: Fintech, Trí tuệ nhân tạo..." : "E.g. AI Technology, Stocks..."}
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold block mb-1" style={{ color: colors.textMuted }}>
                  {uiLanguage === "vi" ? "CHUYÊN MỤC / PHÂN LOẠI" : "CATEGORY"}
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                >
                  <option value="Chủ đề">{uiLanguage === "vi" ? "Chủ đề yêu thích" : "Favorite Topic"}</option>
                  <option value="Ngành nghề">{uiLanguage === "vi" ? "Ngành nghề công tác" : "Domain Industry"}</option>
                  <option value="Lịch trình">{uiLanguage === "vi" ? "Lịch di chuyển" : "Commute Schedule"}</option>
                  <option value="Giọng đọc">{uiLanguage === "vi" ? "Gu giọng đọc" : "Host Style Preference"}</option>
                  <option value="Khác">{uiLanguage === "vi" ? "Khác" : "Other"}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold block mb-1" style={{ color: colors.textMuted }}>
                  {uiLanguage === "vi" ? "LOẠI BỘ NHỚ" : "MEMORY DURATION TYPE"}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType("long_term")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition ${newType === "long_term" ? "shadow-sm" : ""}`}
                    style={newType === "long_term" 
                      ? { backgroundColor: `${colors.interactive}20`, borderColor: colors.interactive, color: colors.interactive }
                      : { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textMuted }
                    }
                  >
                    {uiLanguage === "vi" ? "Dài hạn (Cố định)" : "Long-Term"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("short_term")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition ${newType === "short_term" ? "shadow-sm" : ""}`}
                    style={newType === "short_term" 
                      ? { backgroundColor: `${colors.warning}20`, borderColor: colors.warning, color: colors.warning }
                      : { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textMuted }
                    }
                  >
                    {uiLanguage === "vi" ? "Ngắn hạn (Tạm thời)" : "Short-Term"}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold block mb-1" style={{ color: colors.textMuted }}>
                  {uiLanguage === "vi" ? "GHI CHÚ CHI TIẾT" : "NOTES & CONTEXT"}
                </label>
                <input
                  type="text"
                  placeholder={uiLanguage === "vi" ? "Ghi chú bổ sung cho Gemini AI..." : "Additional prompt notes..."}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}` }}
              >
                {uiLanguage === "vi" ? "Hủy" : "Cancel"}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
              >
                {uiLanguage === "vi" ? "Lưu vào bộ nhớ" : "Save to Memory"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Import JSON Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 mb-4 border rounded-2xl flex flex-col gap-3 overflow-hidden"
            style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textPrimary }}>
                {uiLanguage === "vi" ? "Nhập Dữ Liệu Bộ Nhớ (JSON)" : "Import Memory Data (JSON)"}
              </span>
              <button onClick={() => setShowImportModal(false)} className="p-1 rounded-full text-xs">
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={4}
              placeholder='{"favoriteTopics": [...]}'
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="w-full p-2.5 border rounded-xl text-xs font-mono focus:outline-none custom-scrollbar"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
            />

            {importStatus === "error" && (
              <p className="text-xs font-bold" style={{ color: colors.critical }}>
                {uiLanguage === "vi" ? "Cấu trúc JSON không hợp lệ." : "Invalid JSON memory format."}
              </p>
            )}
            {importStatus === "success" && (
              <p className="text-xs font-bold" style={{ color: colors.success }}>
                {uiLanguage === "vi" ? "Đã nhập dữ liệu bộ nhớ thành công!" : "Memory imported successfully!"}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: colors.surface, color: colors.textMuted }}
              >
                {uiLanguage === "vi" ? "Đóng" : "Close"}
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                className="px-4 py-1.5 rounded-xl text-xs font-bold"
                style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
              >
                {uiLanguage === "vi" ? "Nhập dữ liệu" : "Import JSON"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl border shrink-0"
             style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border }}>
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${filterType === "all" ? "shadow-sm" : ""}`}
            style={filterType === "all" 
              ? { backgroundColor: colors.interactive, color: colors.onAccent }
              : { color: colors.textMuted }
            }
          >
            {uiLanguage === "vi" ? "Tất cả" : "All"} ({memory.favoriteTopics.length})
          </button>
          <button
            onClick={() => setFilterType("long_term")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${filterType === "long_term" ? "shadow-sm" : ""}`}
            style={filterType === "long_term" 
              ? { backgroundColor: colors.interactive, color: colors.onAccent }
              : { color: colors.textMuted }
            }
          >
            {uiLanguage === "vi" ? "Dài hạn" : "Long-Term"}
          </button>
          <button
            onClick={() => setFilterType("short_term")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${filterType === "short_term" ? "shadow-sm" : ""}`}
            style={filterType === "short_term" 
              ? { backgroundColor: colors.interactive, color: colors.onAccent }
              : { color: colors.textMuted }
            }
          >
            {uiLanguage === "vi" ? "Ngắn hạn" : "Short-Term"}
          </button>
        </div>

        {/* Search Field */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5" style={{ color: colors.textMuted }} />
          <input
            type="text"
            placeholder={uiLanguage === "vi" ? "Tìm trí nhớ..." : "Search memory..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border rounded-xl text-xs font-medium focus:outline-none"
            style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border, color: colors.textPrimary }}
          />
        </div>
      </div>

      {/* Memory Topics Grid / List */}
      {filteredTopics.length === 0 ? (
        <div className="py-8 px-4 text-center border border-dashed rounded-2xl flex flex-col items-center justify-center"
             style={{ borderColor: colors.border }}>
          <Brain className="w-8 h-8 mb-2 stroke-[1.5]" style={{ color: colors.textMuted, opacity: 0.5 }} />
          <p className="text-xs font-bold" style={{ color: colors.textMuted }}>
            {searchQuery 
              ? (uiLanguage === "vi" ? "Không tìm thấy trí nhớ phù hợp." : "No matching memory found.")
              : (uiLanguage === "vi" ? "AI chưa ghi nhận sở thích nào." : "AI memory is currently clean.")}
          </p>
          <p className="text-[10px] max-w-[240px] mt-1" style={{ color: colors.textMuted }}>
            {uiLanguage === "vi" ? "Bấm 'Thêm trí nhớ' hoặc bắt đầu nghe để AI tự động tích lũy." : "Click 'Add Fact' or start listening to populate memory."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence>
            {filteredTopics.map((topicItem) => {
              const isEnabled = topicItem.enabled !== false;
              const isShortTerm = topicItem.type === "short_term";
              return (
                <motion.div
                  key={topicItem.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: isEnabled ? 1 : 0.6, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-3 border rounded-2xl flex flex-col justify-between transition-all text-left relative group ${
                    !isEnabled ? "opacity-50 grayscale" : ""
                  }`}
                  style={{ 
                    backgroundColor: isEnabled ? `${colors.interactive}08` : colors.surfaceOverlay, 
                    borderColor: isEnabled ? `${colors.interactive}33` : colors.border 
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isShortTerm ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                        }`}>
                          {isShortTerm ? (uiLanguage === "vi" ? "Ngắn hạn" : "Short-term") : (uiLanguage === "vi" ? "Dài hạn" : "Long-term")}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                              style={{ backgroundColor: colors.surfaceRaised, color: colors.textMuted }}>
                          {topicItem.category || "General"}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs truncate max-w-[180px]" style={{ color: colors.textPrimary }}>
                        {topicItem.topic}
                      </h4>
                      {topicItem.notes && (
                        <p className="text-[10px] line-clamp-2" style={{ color: colors.textMuted }}>
                          {topicItem.notes}
                        </p>
                      )}
                    </div>

                    {/* Enable / Disable Toggle */}
                    <button
                      onClick={() => handleToggle(topicItem.id)}
                      className="p-1.5 rounded-xl transition hover:bg-black/5"
                      style={{ color: isEnabled ? colors.interactive : colors.textMuted }}
                      title={isEnabled ? (uiLanguage === "vi" ? "Tắt trí nhớ này" : "Disable fact") : (uiLanguage === "vi" ? "Bật trí nhớ này" : "Enable fact")}
                    >
                      {isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Footer metadata */}
                  <div className="flex items-center justify-between pt-2 border-t text-[9px]"
                       style={{ borderColor: colors.border, color: colors.textMuted }}>
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" style={{ color: colors.interactive }} />
                      <span>{uiLanguage === "vi" ? `Tương tác: ${topicItem.interactedCount}` : `Hits: ${topicItem.interactedCount}`}</span>
                    </div>

                    <button
                      onClick={() => handleDelete(topicItem.id)}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                      title={uiLanguage === "vi" ? "Xóa trí nhớ này" : "Delete memory"}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Quick status footer */}
      <div className="mt-4 pt-3 border-t text-[10px] flex justify-between items-center"
           style={{ borderColor: colors.border, color: colors.textMuted }}>
        <span>
          {uiLanguage === "vi" 
            ? `Tổng cộng: ${memory.favoriteTopics.length} trí nhớ | Đang kích hoạt: ${memory.favoriteTopics.filter(t => t.enabled !== false).length}`
            : `Total: ${memory.favoriteTopics.length} memory facts | Active: ${memory.favoriteTopics.filter(t => t.enabled !== false).length}`}
        </span>
        <span>
          {uiLanguage === "vi" ? `Cập nhật lần cuối: ${memory.lastActiveDate}` : `Last active: ${memory.lastActiveDate}`}
        </span>
      </div>
    </div>
  );
}
