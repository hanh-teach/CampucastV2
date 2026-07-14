import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AudioLines, ArrowLeft, Sparkles, Radio } from "lucide-react";
import { fetchSharedBriefing } from "../services/shareService";
import { SavedSummary } from "../types";
import ManualPcmPlayer from "./ManualPcmPlayer";
import { colors } from "../foundation/tokens/colors";

interface SharedBriefingPageProps {
  uiLanguage: "vi" | "en";
  setUiLanguage: (lang: "vi" | "en") => void;
}

const pageTranslations = {
  vi: {
    loading: "Đang tải bản tin được chia sẻ...",
    notFound: "Không tìm thấy bản tin phát thanh này.",
    notFoundSub: "Đường liên kết có thể đã hết hạn hoặc không tồn tại.",
    backHome: "Về trang chủ CommuteCast",
    ctaTitle: "Tạo bản tin phát thanh của riêng bạn?",
    ctaSub: "Sử dụng trí tuệ nhân tạo để tóm tắt bài báo và chuyển ngữ kịch bản sang giọng đọc tự nhiên cho hành trình đi làm hàng ngày của bạn.",
    ctaBtn: "Bắt đầu miễn phí ngay",
    tagline: "Đài phát thanh cá nhân hóa hành trình của bạn",
  },
  en: {
    loading: "Loading shared news briefing...",
    notFound: "This broadcast briefing could not be found.",
    notFoundSub: "The link may have expired or is incorrect.",
    backHome: "Go to CommuteCast Home",
    ctaTitle: "Want your own personalized radio show?",
    ctaSub: "Use AI to summarize articles and synthesize highly natural voiceovers tailored perfectly for your daily commute journey.",
    ctaBtn: "Get Started Free",
    tagline: "Your personalized commute news radio station",
  }
};

export default function SharedBriefingPage({ uiLanguage, setUiLanguage }: SharedBriefingPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const t = pageTranslations[uiLanguage];
  
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<SavedSummary | null>(null);

  useEffect(() => {
    if (!id) return;

    async function getSharedData() {
      setLoading(true);
      try {
        const brief = await fetchSharedBriefing(id);
        if (brief) {
          setBriefing(brief);
        }
      } catch (err) {
        console.error("Failed to load shared briefing on page:", err);
      } finally {
        setLoading(false);
      }
    }

    getSharedData();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col font-sans"
         style={{ backgroundColor: colors.surface, color: colors.textPrimary }}>
      
      {/* Header Panel */}
      <header className="border-b sticky top-0 z-50 backdrop-blur-md"
              style={{ backgroundColor: `${colors.surfaceOverlay}99`, borderColor: colors.border }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div 
            onClick={() => navigate("/")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-amber-300 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <AudioLines className="w-6 h-6 animate-pulse" style={{ color: colors.onAccent }} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
                <span>CommuteCast</span>
                <span className="text-[10px] font-mono border px-1.5 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: `${colors.interactive}1a`, color: colors.interactive, borderColor: `${colors.interactive}33` }}>
                  SHARE
                </span>
              </h1>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: colors.textMuted }}>{t.tagline}</p>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex border p-0.5 rounded-lg text-xs font-mono font-bold"
               style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <button
              onClick={() => setUiLanguage("vi")}
              className={`px-2 py-1 rounded transition-colors ${
                uiLanguage === "vi" 
                  ? "" 
                  : "hover:text-white"
              }`}
              style={uiLanguage === "vi" 
                ? { backgroundColor: colors.interactive, color: colors.onAccent } 
                : { color: colors.textMuted }}
            >
              VI
            </button>
            <button
              onClick={() => setUiLanguage("en")}
              className={`px-2 py-1 rounded transition-colors ${
                uiLanguage === "en" 
                  ? "" 
                  : "hover:text-white"
              }`}
              style={uiLanguage === "en" 
                ? { backgroundColor: colors.interactive, color: colors.onAccent } 
                : { color: colors.textMuted }}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
                 style={{ borderColor: colors.interactive, borderTopColor: "transparent" }}></div>
            <p className="font-mono text-sm animate-pulse" style={{ color: colors.textMuted }}>{t.loading}</p>
          </div>
        ) : !briefing ? (
          <div className="text-center max-w-md mx-auto py-12 px-6 border rounded-3xl shadow-xl space-y-6"
               style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
            <div className="w-16 h-16 border rounded-2xl flex items-center justify-center mx-auto"
                 style={{ backgroundColor: `${colors.warning}1a`, borderColor: `${colors.warning}33`, color: colors.warning }}>
              <Radio className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold" style={{ color: colors.textPrimary }}>{t.notFound}</h2>
              <p className="text-sm" style={{ color: colors.textMuted }}>{t.notFoundSub}</p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2 font-bold py-3.5 px-6 rounded-2xl transition cursor-pointer shadow-lg active:scale-98"
              style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.backHome}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Interactive Player Frame */}
            <div className="border rounded-3xl p-1 shadow-2xl backdrop-blur-sm"
                 style={{ backgroundColor: `${colors.surfaceOverlay}66`, borderColor: colors.border }}>
              <ManualPcmPlayer
                payload={briefing.payload}
                audioChunks={briefing.audioChunks || []}
                title={briefing.payload.title}
                briefingId={briefing.id}
                uiLanguage={uiLanguage}
                preferencesInfo={`🎙️ Voice: ${
                  briefing.preferences?.voice === "vi-HN" ? "Hanoi Male" : 
                  briefing.preferences?.voice === "vi-HCM" ? "HCM Female" : 
                  briefing.preferences?.voice === "en-UK" ? "UK Male" : "US Female"
                }`}
              />
            </div>

            {/* Call To Action Banner */}
            <div className="border rounded-3xl p-6 md:p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
                 style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none"
                   style={{ backgroundColor: `${colors.interactive}0d` }} />
              <div className="space-y-2 max-w-xl text-center md:text-left">
                <h3 className="text-lg font-bold flex items-center justify-center md:justify-start gap-2"
                    style={{ color: colors.textPrimary }}>
                  <Sparkles className="w-5 h-5 animate-pulse" style={{ color: colors.interactive }} />
                  <span>{t.ctaTitle}</span>
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
                  {t.ctaSub}
                </p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="shrink-0 font-bold px-6 py-3.5 rounded-2xl text-xs transition cursor-pointer shadow-md active:scale-95 flex items-center gap-2"
                style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
              >
                <span>{t.ctaBtn}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-[10px] font-mono"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textMuted }}>
        <p>© 2026 CommuteCast Personalized Podcast. Powered by Gemini & Google TTS.</p>
      </footer>
    </div>
  );
}
