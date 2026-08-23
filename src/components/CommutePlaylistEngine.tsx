import React, { useState } from "react";
import { ListMusic, Clock, Sparkles, Play, Compass, RefreshCw, Radio, CheckCircle, Sliders } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export interface PlaylistItem {
  id: string;
  type: "traffic" | "news" | "briefing" | "podcast" | "music";
  title: string;
  source: string;
  durationMinutes: number;
  audioUrl?: string;
}

export interface CommutePlaylist {
  id: string;
  title: string;
  totalDurationMinutes: number;
  items: PlaylistItem[];
  createdAt: string;
}

interface CommutePlaylistEngineProps {
  uiLanguage?: "vi" | "en";
  commuteRoute?: string;
  onPlayPlaylist?: (playlist: CommutePlaylist) => void;
  className?: string;
}

export const CommutePlaylistEngine: React.FC<CommutePlaylistEngineProps> = ({
  uiLanguage = "vi",
  commuteRoute = "Cầu Giấy - Khuất Duy Tiến - Nguyễn Trãi",
  onPlayPlaylist,
  className
}) => {
  const [commuteMinutes, setCommuteMinutes] = useState<number>(30);
  const [newsRatio, setNewsRatio] = useState<number>(30); // 30%
  const [trafficRatio, setTrafficRatio] = useState<number>(30); // 30%
  const [podcastRatio, setPodcastRatio] = useState<number>(20); // 20%
  const [musicRatio, setMusicRatio] = useState<number>(20); // 20%
  const [generatedPlaylist, setGeneratedPlaylist] = useState<CommutePlaylist | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const t = {
    vi: {
      title: "ĐỘNG CƠ DANH SÁCH LÁI XE THÔNG MINH",
      subtitle: "Tự động phối trộn Bản tin, Cảnh báo Giao thông, AI Briefing & Âm nhạc phù hợp chính xác thời gian lộ trình.",
      commuteDuration: "Thời gian lái xe dự kiến:",
      generateBtn: "TẠO PLAYLIST LỘ TRÌNH RẢNH TAY",
      generating: "ĐANG PHỐI TRỘN DỮ LIỆU LOGISTICS...",
      playNow: "PHÁT TOÀN BỘ PLAYLIST NGAY",
      mixRatios: "Tỉ lệ phân bổ nội dung:",
      traffic: "Cảnh báo Giao thông",
      news: "Tin tức Thời sự",
      briefing: "AI Briefing Tóm tắt",
      music: "Giải trí / Podcast",
      itemsCount: "Mục nội dung",
      totalMin: "phút"
    },
    en: {
      title: "SMART COMMUTE PLAYLIST ENGINE",
      subtitle: "Auto-mix News, Live Traffic, AI Briefing & Music tailored to your exact commute drive time.",
      commuteDuration: "Planned Commute Drive Time:",
      generateBtn: "GENERATE HANDS-FREE PLAYLIST",
      generating: "GENERATING & MIXING LOGISTICS FEED...",
      playNow: "PLAY FULL PLAYLIST NOW",
      mixRatios: "Content Mix Ratios:",
      traffic: "Traffic Alerts",
      news: "Daily News",
      briefing: "AI Briefing",
      music: "Music / Podcast",
      itemsCount: "Items",
      totalMin: "min"
    }
  }[uiLanguage];

  const generateSmartPlaylist = () => {
    setIsGenerating(true);

    setTimeout(() => {
      const items: PlaylistItem[] = [
        {
          id: `item-traffic-${Date.now()}`,
          type: "traffic",
          title: uiLanguage === "vi" 
            ? `🚨 Cập nhật Giao thông Thời gian thực: ${commuteRoute}`
            : `🚨 Real-time Traffic Update: ${commuteRoute}`,
          source: "Rá-đa CommuteCast Geo-fence",
          durationMinutes: Math.round(commuteMinutes * 0.25) || 5
        },
        {
          id: `item-news-${Date.now()}`,
          type: "news",
          title: uiLanguage === "vi"
            ? "📰 Bản tin Điểm tin Buổi sáng: Kinh tế, Công nghệ & Đời sống"
            : "📰 Daily Morning Brief: Economy, Tech & World News",
          source: "Tổng hợp RSS Tin tức",
          durationMinutes: Math.round(commuteMinutes * 0.35) || 10
        },
        {
          id: `item-briefing-${Date.now()}`,
          type: "briefing",
          title: uiLanguage === "vi"
            ? "🎙️ Tóm tắt AI Briefing: Lịch làm việc & Tiêu điểm tin cá nhân"
            : "🎙️ AI Executive Briefing: Daily Schedule & Priority Focus",
          source: "CommuteCast AI Studio Engine",
          durationMinutes: Math.round(commuteMinutes * 0.20) || 5
        },
        {
          id: `item-music-${Date.now()}`,
          type: "music",
          title: uiLanguage === "vi"
            ? "🎵 Nhạc Nhẹ Thư Giãn Lái Xe: Lofi Chill Beats & Acoustic"
            : "🎵 Relaxing Drive Hits: Lofi Chill Beats & Acoustic",
          source: "YouTube Entertainment Channel",
          durationMinutes: Math.round(commuteMinutes * 0.20) || 5
        }
      ];

      const playlist: CommutePlaylist = {
        id: `playlist-${Date.now()}`,
        title: uiLanguage === "vi" ? `Playlist Lộ Trình ${commuteMinutes} Phút` : `${commuteMinutes}-Min Commute Playlist`,
        totalDurationMinutes: commuteMinutes,
        items,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setGeneratedPlaylist(playlist);
      setIsGenerating(false);
    }, 600);
  };

  return (
    <div className={cn("p-6 bg-zinc-900/90 border border-white/10 rounded-3xl text-white backdrop-blur-xl shadow-2xl space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400">
          <ListMusic className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm md:text-base font-black tracking-wider uppercase">{t.title}</h3>
          <p className="text-xs text-zinc-400">{t.subtitle}</p>
        </div>
      </div>

      {/* Drive Time Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>{t.commuteDuration} <strong className="text-white text-sm font-mono">{commuteMinutes} {t.totalMin}</strong></span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[15, 25, 35, 45].map((mins) => (
            <button
              key={mins}
              onClick={() => setCommuteMinutes(mins)}
              className={cn(
                "py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all border active:scale-95",
                commuteMinutes === mins
                  ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
              )}
            >
              {mins} {t.totalMin}
            </button>
          ))}
        </div>
      </div>

      {/* Content Mixing Sliders */}
      <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>{t.mixRatios}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 bg-zinc-800/80 rounded-xl border border-white/5 space-y-1">
            <span className="text-red-400 font-bold block">{t.traffic}</span>
            <span className="font-mono text-zinc-400">~25% ({Math.round(commuteMinutes * 0.25)} {t.totalMin})</span>
          </div>
          <div className="p-2.5 bg-zinc-800/80 rounded-xl border border-white/5 space-y-1">
            <span className="text-blue-400 font-bold block">{t.news}</span>
            <span className="font-mono text-zinc-400">~35% ({Math.round(commuteMinutes * 0.35)} {t.totalMin})</span>
          </div>
          <div className="p-2.5 bg-zinc-800/80 rounded-xl border border-white/5 space-y-1">
            <span className="text-amber-400 font-bold block">{t.briefing}</span>
            <span className="font-mono text-zinc-400">~20% ({Math.round(commuteMinutes * 0.20)} {t.totalMin})</span>
          </div>
          <div className="p-2.5 bg-zinc-800/80 rounded-xl border border-white/5 space-y-1">
            <span className="text-purple-400 font-bold block">{t.music}</span>
            <span className="font-mono text-zinc-400">~20% ({Math.round(commuteMinutes * 0.20)} {t.totalMin})</span>
          </div>
        </div>
      </div>

      {/* Generate Action Button */}
      <button
        onClick={generateSmartPlaylist}
        disabled={isGenerating}
        className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>{t.generating}</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span>{t.generateBtn}</span>
          </>
        )}
      </button>

      {/* Generated Playlist View */}
      <AnimatePresence>
        {generatedPlaylist && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4 pt-4 border-t border-white/10"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{generatedPlaylist.title} ({generatedPlaylist.items.length} {t.itemsCount})</span>
              </span>
              <span className="text-xs font-mono text-zinc-400">{generatedPlaylist.createdAt}</span>
            </div>

            <div className="space-y-2">
              {generatedPlaylist.items.map((item, idx) => (
                <div key={item.id} className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/30 text-blue-300 font-black font-mono flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{item.title}</p>
                      <span className="text-[10px] text-zinc-400 uppercase">{item.source}</span>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-blue-300 shrink-0">{item.durationMinutes} {t.totalMin}</span>
                </div>
              ))}
            </div>

            {onPlayPlaylist && (
              <button
                onClick={() => onPlayPlaylist(generatedPlaylist)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t.playNow}</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
