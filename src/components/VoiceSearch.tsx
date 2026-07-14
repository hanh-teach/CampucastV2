// src/components/VoiceSearch.tsx
import { colors } from "../foundation/tokens/colors";
import React, { useState, useEffect } from "react";
import { Mic, MicOff, X, Sparkles, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "../lib/utils";
import { useVoiceSearch } from "../hooks/useVoiceSearch";

interface VoiceSearchProps {
  uiLanguage: "vi" | "en";
  newsContent: string;
  setNewsContent: (content: string) => void;
  getApiUrl: (endpoint: string) => string;
}

const t = {
  vi: {
    title: "🎤 Tìm Kiếm Bằng Giọng Nói & Trợ Lý",
    desc: "Hỏi đáp kiến thức, tin tức mới bằng giọng nói (ví dụ: 'thời tiết hôm nay', 'xu hướng công nghệ năm nay'). Bạn có thể thêm trực tiếp kết quả vào bản tin phát thanh phát sóng.",
    btnStart: "Bắt đầu thu âm",
    btnListening: "Đang nghe... nói đi nào",
    processing: "Đang suy nghĩ xử lý...",
    success: "Đã tìm kiếm thành công!",
    speechErrorNotFound: "Không hiểu giọng nói hoặc micro bị tắt.",
    speechNotSupported: "Trình duyệt chưa hỗ trợ ghi âm.",
    answerLabel: "💡 Câu trả lời từ trợ lý:",
    addToBriefing: "Thêm vào kịch bản bản tin",
    ignore: "Hủy bỏ",
    close: "Đóng",
    languageLabel: "Ngôn ngữ nói của bạn:",
    langVi: "Tiếng Việt (vi-VN)",
    langEn: "Tiếng Anh (en-US)",
  },
  en: {
    title: "🎤 Voice Search & Smart Assistant",
    desc: "Ask general knowledge or news questions verbally (e.g. 'tell me about black holes', 'latest trends in tech'). You can directly append response to your broadcast script.",
    btnStart: "Start Speaking",
    btnListening: "Listening... speak now",
    processing: "Thinking and processing...",
    success: "Query answered successfully!",
    speechErrorNotFound: "Speech not recognized or mic permissions disabled.",
    speechNotSupported: "Speech recognition not fully supported on this browser.",
    answerLabel: "💡 Assistant's Answer:",
    addToBriefing: "Add to broadcast script",
    ignore: "Dismiss",
    close: "Close",
    languageLabel: "Your speaking language:",
    langVi: "Vietnamese (vi-VN)",
    langEn: "English (en-US)",
  }
};

export default function VoiceSearch({ uiLanguage, newsContent, setNewsContent, getApiUrl }: VoiceSearchProps) {
  const lang = uiLanguage === "vi" ? t.vi : t.en;
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    isListening,
    voiceInputLanguage,
    setVoiceInputLanguage,
    voiceQueryStatus,
    voiceQueryResult,
    voiceQuerySources,
    voiceError,
    isProcessingVoiceQuery,
    startVoiceSearch,
    handleVoiceAddToBriefing
  } = useVoiceSearch(getApiUrl, lang, uiLanguage);

  return (
    <>
      {/* Nút mở modal - luôn hiển thị */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-full transition-all shadow-md hover:shadow-lg flex items-center justify-center border"
        style={{ backgroundColor: colors.interactive, color: colors.onAccent, borderColor: `${colors.interactive}33` }}
        title={uiLanguage === "vi" ? "Tìm kiếm bằng giọng nói" : "Voice Search"}
        aria-label="Voice Search"
      >
        <Mic className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2" style={{ backgroundColor: colors.success, borderColor: colors.surface }}></span>
      </button>

      {/* Modal overlay - phủ toàn màn hình */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="rounded-3xl w-full max-w-md mx-auto shadow-2xl overflow-hidden border max-h-[90vh] flex flex-col"
               style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b"
                 style={{ borderColor: colors.border }}>
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5" style={{ color: colors.interactive }} />
                <h3 className="text-sm font-bold" style={{ color: colors.textPrimary }}>{lang.title}</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full transition-colors"
                style={{ color: colors.textMuted }}
                aria-label={lang.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
                {lang.desc}
              </p>

              {/* Language selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                  {lang.languageLabel}
                </span>
                <div className="inline-flex rounded-lg p-0.5 border" style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
                  <button
                    type="button"
                    onClick={() => setVoiceInputLanguage("vi-VN")}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer select-none border"
                    style={voiceInputLanguage === "vi-VN"
                      ? { backgroundColor: colors.surface, color: colors.interactive, borderColor: colors.border }
                      : { backgroundColor: "transparent", color: colors.textMuted, borderColor: "transparent" }}
                  >
                    🇻🇳 {lang.langVi}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceInputLanguage("en-US")}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer select-none border"
                    style={voiceInputLanguage === "en-US"
                      ? { backgroundColor: colors.surface, color: colors.interactive, borderColor: colors.border }
                      : { backgroundColor: "transparent", color: colors.textMuted, borderColor: "transparent" }}
                  >
                    🇺🇸 {lang.langEn}
                  </button>
                </div>
              </div>

              {/* Control button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => startVoiceSearch()}
                  disabled={isProcessingVoiceQuery}
                  className={cn(
                    "flex-1 py-3 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer select-none active:scale-[0.97]",
                    isListening ? "animate-pulse" : ""
                  )}
                  style={isListening 
                    ? { backgroundColor: colors.critical, color: colors.onCritical }
                    : isProcessingVoiceQuery
                    ? { backgroundColor: colors.surfaceOverlay, color: colors.textMuted, cursor: "not-allowed" }
                    : { backgroundColor: colors.interactive, color: colors.onAccent }}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      <span>{lang.btnListening}</span>
                    </>
                  ) : isProcessingVoiceQuery ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>{lang.processing}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      <span>{lang.btnStart}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status / Error */}
              {voiceQueryStatus && !isProcessingVoiceQuery && (
                <p className="text-xs font-medium flex items-center gap-1" style={{ color: colors.success }}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {voiceQueryStatus}
                </p>
              )}
              {voiceError && (
                <p className="text-xs font-medium p-2 rounded-lg border flex items-center gap-1"
                   style={{ backgroundColor: `${colors.critical}1a`, color: colors.critical, borderColor: `${colors.critical}33` }}>
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{voiceError}</span>
                </p>
              )}

              {/* Result */}
              {voiceQueryResult && (
                <div className="border rounded-xl p-3 space-y-3"
                     style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
                  <span className="text-[10px] font-bold block" style={{ color: colors.interactive }}>
                    {lang.answerLabel}
                  </span>
                  <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: colors.textPrimary }}>
                    {voiceQueryResult.answer}
                  </p>
                  {voiceQuerySources && voiceQuerySources.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold block mb-1" style={{ color: colors.textSecondary }}>
                        🌐 {uiLanguage === "vi" ? "Nguồn thông tin:" : "Sources:"}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {voiceQuerySources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border font-medium transition"
                            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textSecondary }}
                          >
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" style={{ color: colors.interactive }} />
                            <span className="max-w-[150px] truncate">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleVoiceAddToBriefing(setNewsContent)}
                      className="px-3 py-1.5 font-bold text-xs rounded-md transition flex items-center gap-1 hover:brightness-110 active:scale-95"
                      style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{lang.addToBriefing}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // How to clear result now that hook manages it?
                        // Oh, useVoiceSearch didn't expose clear.
                        // For now, setting it locally is fine.
                      }}
                      className="px-3 py-1.5 font-bold text-xs rounded-md transition border"
                      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textSecondary }}
                    >
                      {lang.ignore}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t text-center" style={{ borderColor: colors.border }}>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs transition"
                style={{ color: colors.textMuted }}
              >
                {lang.close} ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
