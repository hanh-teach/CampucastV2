import { colors } from "../foundation/tokens/colors";
import React, { useState } from "react";
import { 
  Podcast, 
  Copy, 
  ExternalLink, 
  Trash2, 
  Play, 
  Check, 
  Settings, 
  Radio, 
  Info, 
  BookOpen, 
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { SavedSummary, PublishedEpisode } from "../types";

interface PodcastManagerProps {
  savedBriefings: SavedSummary[];
  podcastEpisodes: PublishedEpisode[];
  isPublishingPodcast: boolean;
  podcastError: string;
  onPublishPodcast: (briefId: string) => Promise<void>;
  onDeletePodcastEpisode: (id: string, e: React.MouseEvent) => Promise<void>;
  uiLanguage: "vi" | "en";
  isAutoPublish: boolean;
  setIsAutoPublish: (val: boolean) => void;
  selectedBriefId: string;
  setSelectedBriefId: (val: string) => void;
}

export default function PodcastManager({
  savedBriefings,
  podcastEpisodes,
  isPublishingPodcast,
  podcastError,
  onPublishPodcast,
  onDeletePodcastEpisode,
  uiLanguage,
  isAutoPublish,
  setIsAutoPublish,
  selectedBriefId,
  setSelectedBriefId,
}: PodcastManagerProps) {
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const t = {
    title: uiLanguage === "vi" ? "Kênh Podcast Cá Nhân" : "Personal Podcast Channel",
    desc: uiLanguage === "vi" 
      ? "Đăng ký bằng mã RSS trên Spotify, Apple Podcasts để nghe bản tin phát thanh CommuteCast tự động trên xe hơi hoặc điện thoại của bạn."
      : "Subscribe with your personal RSS feed on Spotify, Apple Podcasts to listen to automated CommuteCast briefings on your phone or car.",
    rssLabel: uiLanguage === "vi" ? "Địa chỉ RSS Feed chính thức" : "Official RSS Feed Address",
    copyBtn: uiLanguage === "vi" ? "Sao chép link" : "Copy Link",
    copied: uiLanguage === "vi" ? "Đã chép!" : "Copied!",
    autoPublishTitle: uiLanguage === "vi" ? "Tự Động Xuất Bản" : "Auto-Publish Episodes",
    autoPublishDesc: uiLanguage === "vi" 
      ? "Khi bật, mỗi khi bạn tạo một bản tin mới, hệ thống sẽ tự động chuyển đổi thành podcast và tải lên Supabase Storage."
      : "When active, creating a new briefing automatically compiles, uploads, and appends it to your cloud podcast feed.",
    manualPublishTitle: uiLanguage === "vi" ? "Xuất Bản Thủ Công" : "Manual Publish Episode",
    selectBriefing: uiLanguage === "vi" ? "-- Chọn một bản tin từ lịch sử để xuất bản --" : "-- Select a briefing from history to publish --",
    publishBtn: uiLanguage === "vi" ? "Đăng Lên Kênh" : "Publish to Cloud",
    publishingBtn: uiLanguage === "vi" ? "Đang xuất bản..." : "Publishing...",
    listTitle: uiLanguage === "vi" ? "Danh sách tập đã xuất bản" : "Published Episodes",
    episodeCount: uiLanguage === "vi" ? "tập" : "episodes",
    noEpisodes: uiLanguage === "vi" ? "Chưa có tập podcast nào được xuất bản lên mây." : "No podcast episodes published to the cloud yet.",
    deleteConfirm: uiLanguage === "vi" ? "Bạn có chắc chắn muốn gỡ tập podcast này?" : "Are you sure you want to unpublish this episode?",
    guideTitle: uiLanguage === "vi" ? "Hướng dẫn cấu hình Supabase Cloud" : "Supabase Cloud Integration Guide",
    guideStep1: uiLanguage === "vi" ? "1. Tạo Storage Bucket" : "1. Create Storage Bucket",
    guideStep1Body: uiLanguage === "vi" 
      ? "Đăng nhập vào bảng điều khiển Supabase, điều hướng đến Storage, tạo mới một bucket có tên chính xác là \"podcast-audio\". Hãy bật tùy chọn Public Bucket."
      : "Log in to your Supabase dashboard, go to Storage, and create a new bucket named exactly \"podcast-audio\". Ensure \"Public Bucket\" is checked.",
    guideStep2: uiLanguage === "vi" ? "2. Cài đặt RLS Policy (Chính sách truy cập)" : "2. Configure RLS Access Policies",
    guideStep2Body: uiLanguage === "vi"
      ? "Trong cài đặt Bucket \"podcast-audio\" > Policies, thêm chính sách mới để cho phép mọi người (Public/Anon) có quyền SELECT (đọc) tệp âm thanh công khai và quyền INSERT (tải lên) tệp mới."
      : "Within \"podcast-audio\" bucket settings > Policies, add new policies allowing Public/Anon clients SELECT (read) access for public audios and INSERT (upload) access for new files.",
    guideStep3: uiLanguage === "vi" ? "3. Điền cấu hình môi trường" : "3. Fill Environment Variables",
    guideStep3Body: uiLanguage === "vi"
      ? "Đảm bảo biến môi trường SUPABASE_URL và SUPABASE_ANON_KEY đã được định nghĩa trong Settings/Environment của bạn để hệ thống kết nối tự động."
      : "Verify that SUPABASE_URL and SUPABASE_ANON_KEY environment variables are populated in your project Settings/Environment to allow automatic sync."
  };

  const getRssUrl = () => {
    if (typeof window === "undefined") return "/api/podcast/feed";
    return `${window.location.protocol}//${window.location.host}/api/podcast/feed`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getRssUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl border shadow-sm flex flex-col gap-6" 
         style={{ backgroundColor: colors.surface, borderColor: colors.border }} 
         id="podcast-manager-container">
      {/* Title block */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl shrink-0 border"
             style={{ backgroundColor: `${colors.interactive}1a`, color: colors.interactive, borderColor: `${colors.interactive}33` }}>
          <Podcast className="w-6 h-6 animate-pulse" />
        </div>
        <div className="text-left">
          <h3 className="text-sm sm:text-base font-black flex items-center gap-2" style={{ color: colors.textPrimary }}>
            <span>{t.title}</span>
            <span className="text-white text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase font-black animate-pulse"
                  style={{ backgroundColor: colors.critical }}>
              Podcast RSS Live
            </span>
          </h3>
          <p className="text-[11px] sm:text-xs mt-1 font-medium leading-relaxed" style={{ color: colors.textSecondary }}>
            {t.desc}
          </p>
        </div>
      </div>

      {/* Copy RSS Link Row */}
      <div className="border p-3 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-[11px]"
           style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[10px] font-bold font-sans uppercase mb-1" style={{ color: colors.textMuted }}>{t.rssLabel}</p>
          <span className="truncate select-all px-3 py-1.5 rounded-lg border block text-xs font-mono"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}>
            {getRssUrl()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => handleCopyLink()}
            className="px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 min-h-[38px]"
            style={copied 
              ? { backgroundColor: colors.success, color: colors.onSuccess } 
              : { backgroundColor: colors.border, color: colors.textPrimary }}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{t.copyBtn}</span>
              </>
            )}
          </button>
          <a
            href="/api/podcast/feed"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl transition-all flex items-center justify-center min-w-[38px] min-h-[38px] border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textSecondary }}
            title="Open XML Raw Feed"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Auto Publish Switch */}
      <div className="border p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
           style={{ backgroundColor: `${colors.interactive}0d`, borderColor: `${colors.interactive}1a` }}>
        <div className="text-left flex-1">
          <h4 className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide" style={{ color: colors.interactive }}>
            <Radio className="w-4 h-4" />
            <span>{t.autoPublishTitle}</span>
          </h4>
          <p className="text-[11px] mt-1 leading-relaxed font-medium" style={{ color: colors.textSecondary }}>
            {t.autoPublishDesc}
          </p>
        </div>
        <div className="shrink-0 self-end sm:self-auto">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={isAutoPublish} 
              onChange={(e) => setIsAutoPublish(e.target.checked)}
              className="sr-only peer" 
            />
            <div 
              className="w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border after:rounded-full after:h-5 after:w-5 after:transition-all shadow-sm"
              style={{ 
                backgroundColor: isAutoPublish ? colors.interactive : colors.border,
              }}
              onMouseEnter={(e) => {
                // For the inner circle handle using style objects is tricky for pseudo-elements, 
                // but we can at least theme the background.
              }}
            ></div>
          </label>
        </div>
      </div>

      {/* Manual Publish Action */}
      <div className="border-t pt-5 text-left" style={{ borderColor: `${colors.border}66` }}>
        <h4 className="text-xs font-bold mb-2 uppercase tracking-wide flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
          <Settings className="w-3.5 h-3.5" style={{ color: colors.interactive }} />
          <span>{t.manualPublishTitle}</span>
        </h4>
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <select
            value={selectedBriefId}
            onChange={(e) => setSelectedBriefId(e.target.value)}
            className="flex-1 min-w-0 border text-xs px-3.5 py-2.5 rounded-xl outline-none font-semibold cursor-pointer min-h-[44px]"
            style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border, color: colors.textPrimary }}
          >
            <option value="">{t.selectBriefing}</option>
            {savedBriefings.map((brief) => {
              const isPublished = podcastEpisodes.some(ep => ep.id === brief.id);
              const pubBadge = isPublished ? (uiLanguage === "vi" ? " [Đã Live]" : " [Live]") : "";
              return (
                <option key={brief.id} value={brief.id}>
                  {brief.payload?.title || brief.id} ({brief.timestamp}){pubBadge}
                </option>
              );
            })}
          </select>
          <button
            type="button"
            onClick={() => onPublishPodcast(selectedBriefId)}
            disabled={isPublishingPodcast || !selectedBriefId}
            className="px-5 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap tracking-wide cursor-pointer transition-all flex items-center justify-center gap-1.5 min-h-[44px] shadow-sm hover:shadow active:scale-[0.98]"
            style={isPublishingPodcast || !selectedBriefId 
              ? { backgroundColor: colors.border, color: colors.textMuted, cursor: "not-allowed" } 
              : { backgroundColor: colors.interactive, color: colors.onAccent }}
          >
            <span>{isPublishingPodcast ? t.publishingBtn : t.publishBtn}</span>
          </button>
        </div>
        {podcastError && (
          <p className="text-[10px] font-semibold mt-1.5 flex items-center gap-1" style={{ color: colors.critical }}>
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{podcastError}</span>
          </p>
        )}
      </div>

      {/* Published Episodes Feed list */}
      <div className="border-t pt-5 flex flex-col gap-3 text-left" style={{ borderColor: `${colors.border}66` }}>
        <div className="flex justify-between items-center text-xs font-bold" style={{ color: colors.textSecondary }}>
          <span className="uppercase tracking-wide">{t.listTitle}</span>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold border"
                style={{ backgroundColor: colors.surface, color: colors.textMuted, borderColor: colors.border }}>
            {podcastEpisodes.length} {t.episodeCount}
          </span>
        </div>

        {podcastEpisodes.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5"
               style={{ color: colors.textMuted, borderColor: colors.border, backgroundColor: `${colors.surface}80` }}>
            <Radio className="w-5 h-5" style={{ color: colors.textMuted }} />
            <p className="text-[11px] font-medium">{t.noEpisodes}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 max-h-[250px] overflow-y-auto pr-1">
            {podcastEpisodes.map((ep) => {
              const fileName = ep.audioUrl.split("/").pop();
              return (
                <div
                  key={ep.id}
                  className="py-3 px-4 border rounded-xl transition flex justify-between items-center gap-3 text-left animate-fade-in"
                  style={{ backgroundColor: `${colors.surface}99`, borderColor: colors.border }}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold truncate" style={{ color: colors.textPrimary }}>
                      {ep.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[9px] font-semibold font-mono" style={{ color: colors.textMuted }}>
                      <span className="truncate max-w-[140px] px-1.5 py-0.5 rounded border"
                            style={{ backgroundColor: colors.surfaceOverlay, color: colors.textSecondary, borderColor: colors.border }}>
                        {fileName}
                      </span>
                      <span>•</span>
                      <span>🕒 {new Date(ep.pubDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>⌛ {ep.duration}s</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={ep.audioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 px-3 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 border shadow-sm"
                      style={{ backgroundColor: colors.surfaceOverlay, color: colors.textPrimary, borderColor: colors.border }}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Play</span>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => onDeletePodcastEpisode(ep.id, e)}
                      className="p-1.5 rounded-lg transition-all cursor-pointer border border-transparent hover:border-current"
                      style={{ color: colors.textMuted }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = colors.critical;
                        e.currentTarget.style.backgroundColor = `${colors.critical}1a`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = colors.textMuted;
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      title="Unpublish Episode"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Supabase integration instruction accordion */}
      <div className="border-t pt-4 text-left" style={{ borderColor: `${colors.border}66` }}>
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center justify-between w-full py-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
          style={{ color: colors.textSecondary }}
          onMouseEnter={(e) => e.currentTarget.style.color = colors.interactive}
          onMouseLeave={(e) => e.currentTarget.style.color = colors.textSecondary}
        >
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>{t.guideTitle}</span>
          </div>
          {showGuide ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
        </button>

        {showGuide && (
          <div className="mt-3 border p-4 rounded-xl flex flex-col gap-3 leading-relaxed text-xs"
               style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border, color: colors.textSecondary }}>
            <div>
              <p className="font-bold flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.interactive }}></span>
                {t.guideStep1}
              </p>
              <p className="text-[11px] mt-0.5 ml-3 font-medium">
                {t.guideStep1Body}
              </p>
            </div>
            <div>
              <p className="font-bold flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.interactive }}></span>
                {t.guideStep2}
              </p>
              <p className="text-[11px] mt-0.5 ml-3 font-medium font-mono p-2 rounded border overflow-x-auto whitespace-pre-wrap shadow-inner"
                 style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textMuted }}>
                {uiLanguage === "vi" 
                  ? "✓ Policy for SELECT: Allow public read access (All users/Anon)\n✓ Policy for INSERT: Allow upload access (All users or Authenticated)"
                  : "✓ Policy for SELECT: Allow public read access (All users/Anon)\n✓ Policy for INSERT: Allow upload access (All users or Authenticated)"}
              </p>
              <p className="text-[11px] mt-1 ml-3 font-medium">
                {t.guideStep2Body}
              </p>
            </div>
            <div className="border-t pt-2.5" style={{ borderColor: colors.border }}>
              <p className="font-bold flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.interactive }}></span>
                {t.guideStep3}
              </p>
              <p className="text-[11px] mt-0.5 ml-3 font-medium">
                {t.guideStep3Body}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
