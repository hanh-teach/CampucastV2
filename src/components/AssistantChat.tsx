import { colors } from "../foundation/tokens/colors";
import React, { useEffect, useRef, useState } from "react";
import { 
  X, 
  Send, 
  Mic, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Trash2, 
  AlertCircle, 
  ExternalLink,
  Bot,
  User,
  Plus,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAssistant } from "../hooks/useAssistant";
import { useAdaptive } from "../layouts/AdaptiveContext";
import { DeviceType } from "../types";
import { cn } from "../lib/utils";

interface AssistantChatProps {
  uiLanguage: "vi" | "en";
  activeTab: string;
  step: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  getApiUrl: (path: string) => string;
  handleCreateNews: (topic: string) => Promise<void> | void;
  newsContent: string;
  setNewsContent: (content: string) => void;
  onAction?: (action: string, param: any) => void;
  isDrivingMode?: boolean;
}

const dict = {
  vi: {
    headerTitle: "Hỗ Trợ Vận Hành",
    headerStatus: "Sẵn sàng hỗ trợ",
    inputPlaceholder: "Hỏi trợ lý hoặc yêu cầu tác vụ...",
    tooltipTtsOn: "Bật phát âm thanh",
    tooltipTtsOff: "Tắt phát âm thanh",
    tooltipClear: "Xóa hội thoại",
    errTitle: "Lỗi hệ thống",
    suggestionTitle: "Gợi ý tác vụ hiện tại:",
    emptyTitle: "Chào Operator,",
    emptyDesc: "Tôi là trợ lý vận hành của CommuteCast. Tôi hiểu ngữ cảnh bạn đang làm việc để đưa ra hỗ trợ chính xác nhất.",
    listening: "Đang nghe...",
    processing: "Đang xử lý...",
    sourcesTitle: "Nguồn:",
    suggestedTopicsTitle: "💡 Chủ đề gợi ý:",
    workstationHome: "Về Bàn Điều Hành",
    workstationCreate: "Về Trạm Sản Xuất",
    workstationAssets: "Về Kho Lưu Trữ",
    workstationSettings: "Về Cấu Hình",
    missionControl: "Trung tâm điều hành",
    systemHealth: "Sức khỏe hệ thống",
    statusHealthy: "Vận hành ổn định",
    statusWarning: "Cần chú ý",
    statusError: "Lỗi hệ thống"
  },
  en: {
    headerTitle: "Operator Assistant",
    headerStatus: "Context-aware & Ready",
    inputPlaceholder: "Ask assistant or request a task...",
    tooltipTtsOn: "Enable voice",
    tooltipTtsOff: "Disable voice",
    tooltipClear: "Clear history",
    errTitle: "System error",
    suggestionTitle: "Suggested for current workstation:",
    emptyTitle: "Hello Operator,",
    emptyDesc: "I am your CommuteCast Operator Assistant. I monitor your active workstation to provide high-confidence guidance.",
    listening: "Listening...",
    processing: "Processing...",
    sourcesTitle: "Sources:",
    suggestedTopicsTitle: "💡 Suggested topics:",
    workstationHome: "Home Desk Ops",
    workstationCreate: "Production Flow",
    workstationAssets: "Asset Management",
    workstationSettings: "System Config",
    missionControl: "Mission Control",
    systemHealth: "System Health",
    statusHealthy: "Healthy Ops",
    statusWarning: "Attention Required",
    statusError: "System Error"
  }
};

export default function AssistantChat({
  uiLanguage,
  activeTab,
  step,
  isOpen,
  setIsOpen,
  getApiUrl,
  handleCreateNews,
  newsContent,
  setNewsContent,
  onAction,
  isDrivingMode = false
}: AssistantChatProps) {
  const { device } = useAdaptive();
  const isMobile = device === DeviceType.Mobile;
  const t = dict[uiLanguage === "vi" ? "vi" : "en"];
  
  const {
    messages,
    isListening,
    isProcessing,
    ttsEnabled,
    setTtsEnabled,
    errorMsg,
    inputVal,
    setInputVal,
    startListening,
    stopListening,
    sendMessage,
    clearChat,
    stopSpeaking
  } = useAssistant({
    uiLanguage,
    getApiUrl,
    handleCreateNews,
    newsContent,
    setNewsContent,
    activeTab,
    step,
    isDrivingMode,
    onAction
  });

  const getWorkstationSuggestions = () => {
    if (uiLanguage === "vi") {
      switch (activeTab) {
        case "home": return ["Có gì mới hôm nay?", "Tiếp tục bản tin dở dang", "Xem sức khỏe hệ thống"];
        case "create": return ["Tạo bản tin giao thông", "Thêm nguồn RSS mới", "Chọn giọng đọc phù hợp"];
        case "assets": return ["Tìm bản tin hôm qua", "Xóa các tệp nháp", "Xuất bản tin mới nhất"];
        case "settings": return ["Cách đổi giọng AI Host", "Xóa bộ nhớ đệm", "Cài đặt ưu tiên giao thông"];
        default: return ["Tạo bản tin mới", "Tóm tắt RSS"];
      }
    } else {
      switch (activeTab) {
        case "home": return ["What's new today?", "Resume pending mission", "Check system health"];
        case "create": return ["Create traffic briefing", "Add new RSS source", "Pick best voice"];
        case "assets": return ["Find yesterday's briefing", "Purge draft files", "Export latest audio"];
        case "settings": return ["How to change AI Host", "Clear system cache", "Set traffic priority"];
        default: return ["Create new briefing", "Summarize RSS"];
      }
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isProcessing, isListening]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (inputVal.trim() !== "") {
      sendMessage(inputVal.trim());
    }
  };

  const handleActionClick = (type: string, payload: any) => {
    if (type === "create_news") {
      sendMessage(uiLanguage === "vi" ? `Tạo bản tin về ${payload || "tin mới"}` : `Create news about ${payload || "latest news"}`);
    } else if (type === "add_to_news") {
      sendMessage(uiLanguage === "vi" ? "Thêm vào bản tin" : "Add to news");
    } else if (type === "read_rss") {
      sendMessage(uiLanguage === "vi" ? "Tổng hợp tin RSS" : "Summarize RSS");
    } else if (type === "clear_cache") {
      clearChat();
      if (onAction) onAction("clear_cache", payload);
    } else if (onAction) {
      onAction(type, payload);
    }
  };

  return (
    <>
      {/* Floating Trigger - Minimal */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed z-[100] h-14 w-14 rounded-full flex items-center justify-center hover:scale-110 transition-all group border",
            isMobile ? "bottom-24 right-6" : "bottom-8 right-8"
          )}
          style={{ backgroundColor: colors.surfaceOverlay, color: colors.interactive, borderColor: `${colors.interactive}33`, boxShadow: `0 0 20px ${colors.interactive}4d` }}
        >
          <div className="relative">
            <Bot className="w-6 h-6" />
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 animate-pulse" style={{ color: colors.interactive }} />
          </div>
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 border rounded-full" 
                style={{ backgroundColor: colors.success, borderColor: colors.surface }} />
        </motion.button>
      )}

      {/* Side Panel Layout */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 backdrop-blur-sm z-[110] lg:hidden"
              style={{ backgroundColor: `${colors.surface}80` }}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-[120] w-full sm:w-[400px] h-screen flex flex-col shadow-2xl border-l"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              id="assistant-panel"
            >
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between"
                   style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl border"
                       style={{ backgroundColor: `${colors.interactive}1a`, color: colors.interactive, borderColor: `${colors.interactive}33` }}>
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight uppercase" style={{ color: colors.textPrimary }}>{t.headerTitle}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.success }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>{t.headerStatus}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setTtsEnabled(!ttsEnabled);
                      stopSpeaking();
                    }}
                    className="p-2 rounded-lg transition-colors"
                    style={ttsEnabled 
                      ? { backgroundColor: `${colors.interactive}1a`, color: colors.interactive } 
                      : { color: colors.textMuted }}
                    title={ttsEnabled ? t.tooltipTtsOff : t.tooltipTtsOn}
                  >
                    {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={clearChat}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: colors.textMuted }}
                    title={t.tooltipClear}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: colors.textSecondary }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Mission Control / System Health (NEW) */}
              <div className="px-4 py-3 border-b flex items-center justify-between"
                   style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
                <div className="flex items-center gap-2">
                   <div className="relative">
                    <AlertCircle className="w-4 h-4" 
                                  style={{ color: step === "error" ? colors.critical : colors.success }} />
                    {step !== "error" && <span className="absolute inset-0 rounded-full animate-ping" 
                                               style={{ backgroundColor: `${colors.success}33` }} />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>{t.systemHealth}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border"
                     style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <span className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: step === "error" ? colors.critical : colors.success }} />
                  <span className="text-[9px] font-bold uppercase tracking-tighter" style={{ color: colors.textPrimary }}>
                    {step === "error" ? t.statusError : t.statusHealthy}
                  </span>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center px-4 space-y-6 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="p-5 rounded-3xl border" style={{ backgroundColor: `${colors.interactive}0d`, borderColor: `${colors.interactive}1a` }}>
                      <Sparkles className="w-10 h-10" style={{ color: colors.interactive }} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black tracking-tight" style={{ color: colors.textPrimary }}>{t.emptyTitle}</h4>
                      <p className="text-sm leading-relaxed max-w-[280px]" style={{ color: colors.textSecondary }}>
                        {t.emptyDesc}
                      </p>
                    </div>

                    <div className="w-full space-y-4 pt-6">
                      <div className="flex items-center gap-2 px-1">
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.interactive }} />
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>
                          {t.suggestionTitle}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {getWorkstationSuggestions().map((s, i) => (
                          <button
                            key={i}
                            onClick={() => sendMessage(s)}
                            className="text-left text-xs border p-4 rounded-2xl font-bold transition-all flex items-center justify-between group shadow-sm"
                            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                          >
                            <span>{s}</span>
                            <ChevronRight className="w-4 h-4 transition-all group-hover:translate-x-1" style={{ color: colors.textMuted }} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex flex-col gap-2",
                          msg.role === "user" ? "items-end" : "items-start"
                        )}
                      >
                        <div className={cn(
                          "flex gap-3",
                          msg.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                          style={msg.role === "assistant" 
                            ? { backgroundColor: colors.surfaceOverlay, borderColor: colors.border, color: colors.interactive } 
                            : { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textMuted }}
                        >
                            {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div className={cn(
                            "p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap max-w-[85%] border",
                            msg.role === "user"
                              ? "font-medium rounded-tr-none"
                              : "rounded-tl-none"
                          )}
                          style={msg.role === "user"
                            ? { backgroundColor: colors.interactive, color: colors.onAccent, borderColor: colors.interactive }
                            : { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                          >
                            {msg.content}

                            {msg.role === "assistant" && msg.suggestedTopics && msg.suggestedTopics.length > 0 && (
                              <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: colors.border }}>
                                <span className="text-[10px] font-black uppercase tracking-widest block" style={{ color: colors.interactive }}>
                                  {t.suggestedTopicsTitle}
                                </span>
                                <div className="grid grid-cols-1 gap-2">
                                  {msg.suggestedTopics.map((item, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleCreateNews(item.topic)}
                                      className="text-left border p-3 rounded-xl transition-all"
                                      style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}
                                    >
                                      <span className="font-bold text-[11px] block mb-1" style={{ color: colors.textPrimary }}>{item.topic}</span>
                                      <span className="text-[10px] leading-tight block" style={{ color: colors.textSecondary }}>{item.reason}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {msg.role === "assistant" && msg.actions && msg.actions.length > 0 && (
                              <div className="mt-4 pt-4 border-t flex flex-wrap gap-2" style={{ borderColor: colors.border }}>
                                {msg.actions.map((act, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleActionClick(act.type, act.payload)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border"
                                    style={{ backgroundColor: colors.surfaceOverlay, color: colors.interactive, borderColor: `${colors.interactive}33` }}
                                  >
                                    {act.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isProcessing && (
                      <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 rounded-xl border flex items-center justify-center"
                             style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border, color: colors.interactive }}>
                          <Bot className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold italic" style={{ color: colors.textMuted }}>
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          <span>{t.processing}</span>
                        </div>
                      </div>
                    )}

                    {isListening && (
                      <div className="flex flex-row-reverse gap-3 items-center">
                         <div className="w-8 h-8 rounded-full flex items-center justify-center animate-pulse"
                              style={{ backgroundColor: colors.critical, color: colors.onCritical }}>
                          <Mic className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: colors.critical }}>{t.listening}</span>
                      </div>
                    )}

                    {errorMsg && (
                      <div className="p-4 rounded-2xl flex gap-3 items-start border"
                           style={{ backgroundColor: `${colors.critical}1a`, borderColor: `${colors.critical}33` }}>
                        <AlertCircle className="w-4 h-4 mt-0.5" style={{ color: colors.critical }} />
                        <div className="space-y-1">
                          <span className="text-xs font-black uppercase tracking-wider" style={{ color: colors.critical }}>{t.errTitle}</span>
                          <p className="text-xs leading-relaxed" style={{ color: colors.textSecondary }}>{errorMsg}</p>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <div className="relative flex items-end gap-2">
                  <div className="flex-1 border rounded-2xl transition-all focus-within:ring-1"
                       style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
                    <textarea
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={t.inputPlaceholder}
                      className="w-full bg-transparent p-3 text-sm focus:outline-none resize-none min-h-[44px] max-h-[120px]"
                      style={{ color: colors.textPrimary }}
                      rows={1}
                    />
                    <div className="flex items-center justify-between px-3 pb-2">
                       <button
                        onClick={isListening ? stopListening : startListening}
                        className="p-1.5 rounded-lg transition-all"
                        style={isListening 
                          ? { backgroundColor: `${colors.critical}1a`, color: colors.critical } 
                          : { color: colors.textMuted }}
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={isProcessing || !inputVal.trim()}
                        className="p-1.5 rounded-lg transition-all"
                        style={inputVal.trim() && !isProcessing 
                          ? { backgroundColor: `${colors.interactive}1a`, color: colors.interactive } 
                          : { color: colors.textMuted, opacity: 0.5 }}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
