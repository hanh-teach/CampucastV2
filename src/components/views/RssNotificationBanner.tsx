import React from "react";
import { Rss, Sparkles } from "lucide-react";
import { colors } from "../../foundation/tokens/colors";

interface RssNotificationBannerProps {
  articles: any[];
  uiLanguage: string;
  onClose: () => void;
  onGenerate: () => void;
}

export const RssNotificationBanner: React.FC<RssNotificationBannerProps> = ({
  articles,
  uiLanguage,
  onClose,
  onGenerate,
}) => {
  return (
    <div
      className="md:col-span-12 p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in relative overflow-hidden text-left border"
      style={{
        background: `linear-gradient(90deg, ${colors.interactive}, ${colors.interactive})`,
        color: colors.onAccent,
        borderColor: `${colors.interactive}33`,
      }}
      id="rss-alert-banner"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
      <div className="flex items-center gap-3 relative">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: colors.surfaceOverlay, color: colors.interactive }}>
          <Rss className="w-5 h-5 animate-bounce-slow" style={{ color: colors.interactive }} />
        </div>
        <div>
          <h4 className="text-sm font-extrabold text-white">
            {uiLanguage === "vi" ? "⚡ Bản tin RSS tự động mới đã sẵn sàng!" : "⚡ Automated Daily RSS Briefing Ready!"}
          </h4>
          <p className="text-xs font-medium mt-0.5" style={{ color: colors.textMuted }}>
            {uiLanguage === "vi"
              ? `Phát hiện ${articles.length} bài viết mới từ các nguồn RSS của bạn hôm nay.`
              : `Detected ${articles.length} new articles from your subscribed RSS channels.`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 relative w-full sm:w-auto justify-end font-sans">
        <button
          type="button"
          onClick={onGenerate}
          className="px-4 py-2 hover:brightness-110 font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
          style={{ backgroundColor: colors.surface, color: colors.textPrimary }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: colors.interactive }} />
          <span>{uiLanguage === "vi" ? "Nghe bản tin RSS" : "Listen RSS Briefing"}</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 hover:bg-opacity-40 font-bold text-xs rounded-xl transition cursor-pointer"
          style={{ backgroundColor: `${colors.surfaceOverlay}33`, color: colors.onAccent }}
        >
          {uiLanguage === "vi" ? "Bỏ qua" : "Ignore"}
        </button>
      </div>
    </div>
  );
};
