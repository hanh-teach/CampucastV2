import { colors } from "../foundation/tokens/colors";
import React, { useState } from "react";
import { Flame, ThumbsUp, Play, Sparkles } from "lucide-react";
import { SavedSummary } from "../types";
import { incrementBriefingLikes } from "../services/storageService";
import ShareButton from "./ShareButton";

interface TrendingBriefingsProps {
  savedBriefings: SavedSummary[];
  onSelectBriefing: (briefing: SavedSummary) => void;
  onRefreshList: () => void;
  uiLanguage: "vi" | "en";
}

export default function TrendingBriefings({
  savedBriefings,
  onSelectBriefing,
  onRefreshList,
  uiLanguage
}: TrendingBriefingsProps) {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // Sort by likeCount descending, filter out ones with 0 likes if we want,
  // or just show top 4 most liked from the list
  const trendingList = [...savedBriefings]
    .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    .slice(0, 4);

  const handleLike = async (e: React.MouseEvent, briefingId: string) => {
    e.stopPropagation();
    if (likedIds.has(briefingId)) return; // Prevent double like in single session

    try {
      await incrementBriefingLikes(briefingId);
      setLikedIds(prev => {
        const next = new Set(prev);
        next.add(briefingId);
        return next;
      });
      onRefreshList(); // Trigger re-fetching the updated list in parent component
    } catch (err) {
      console.error("Failed to like briefing:", err);
    }
  };

  const t = {
    trendingTitle: uiLanguage === "vi" ? "Thịnh hành hôm nay" : "Trending Today",
    trendingDesc: uiLanguage === "vi" ? "Bản tin có nhiều lượt thích và tương tác cao nhất." : "Most liked and highly engaged briefings.",
    likesLabel: uiLanguage === "vi" ? "thích" : "likes",
    sharesLabel: uiLanguage === "vi" ? "chia sẻ" : "shares",
    emptyTrending: uiLanguage === "vi" 
      ? "Chưa có bản tin thịnh hành. Hãy thích bản tin đầu tiên của bạn!" 
      : "No trending briefings yet. Drop a like on your first briefing!",
    playNow: uiLanguage === "vi" ? "Nghe ngay" : "Listen now"
  };

  return (
    <div className="p-6 rounded-2xl border shadow-xl flex flex-col gap-4 relative overflow-hidden" 
         id="trending-briefings-panel"
         style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
      {/* Decorative radial ambient light */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none" 
           style={{ backgroundColor: `${colors.interactive}1a` }} />
      
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <span className="p-1 px-1.5 text-[10px] rounded-lg font-bold flex items-center gap-1 uppercase tracking-wider border"
                  style={{ backgroundColor: `${colors.critical}1a`, color: colors.critical, borderColor: `${colors.critical}33` }}>
              <Flame className="w-3 h-3 animate-pulse animate-bounce-slow" style={{ color: colors.critical }} />
              <span>{t.trendingTitle}</span>
            </span>
          </h3>
          <p className="text-[11px] mt-1 font-medium leading-relaxed text-left" style={{ color: colors.textSecondary }}>
            {t.trendingDesc}
          </p>
        </div>
      </div>

      {trendingList.length === 0 ? (
        <div className="text-center py-6 border border-dashed rounded-xl"
             style={{ color: colors.textMuted, borderColor: colors.border, backgroundColor: `${colors.surface}1a` }}>
          <p className="text-xs">{t.emptyTrending}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {trendingList.map((brief, index) => {
            const hasLiked = likedIds.has(brief.id);
            const displayRank = index + 1;
            
            return (
              <div
                key={brief.id}
                onClick={() => onSelectBriefing(brief)}
                className="p-3 border rounded-xl transition-all cursor-pointer flex flex-col justify-between gap-3 relative group"
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              >
                {/* Ranking tag badge */}
                <span className="absolute top-2.5 right-2.5 text-xs font-black font-mono transition-colors"
                      style={{ color: colors.textMuted }}>
                  #{displayRank}
                </span>

                <div>
                  <h4 className="text-xs font-bold line-clamp-1 pr-6 transition-colors"
                      style={{ color: colors.textPrimary }}>
                    {brief.payload.title}
                  </h4>
                  <p className="text-[9px] mt-0.5" style={{ color: colors.textMuted }}>
                    {brief.timestamp.split(",")[0] || brief.timestamp}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 border-t pt-2.5" style={{ borderColor: colors.border }}>
                  {/* Like Button */}
                  <div className="flex gap-1.5 items-center">
                    <button
                      type="button"
                      onClick={(e) => handleLike(e, brief.id)}
                      disabled={hasLiked}
                      className="p-1.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer"
                      style={hasLiked
                        ? { backgroundColor: `${colors.critical}1a`, color: colors.critical, borderColor: `${colors.critical}33` }
                        : { backgroundColor: colors.surfaceOverlay, color: colors.textSecondary, borderColor: colors.border }}
                      title={hasLiked ? "Liked" : "Like this briefing"}
                    >
                      <ThumbsUp className={`w-3 h-3 ${hasLiked ? "fill-current" : ""}`} />
                      <span className="text-[10px] font-bold">
                        {brief.likeCount || 0}
                      </span>
                    </button>

                    {/* Share Button */}
                    <ShareButton
                      briefingId={brief.id}
                      uiLanguage={uiLanguage}
                      onShareSuccess={onRefreshList}
                    />
                  </div>

                  {/* Play Quick Button */}
                  <button
                    type="button"
                    className="w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md active:scale-90"
                    style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
                    title={t.playNow}
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
