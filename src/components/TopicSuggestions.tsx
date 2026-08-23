import React from "react";
import { Sparkles, Compass, HelpCircle, AlertCircle } from "lucide-react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { usePreferences } from "../hooks/usePreferences";
import { colors } from "../foundation/tokens/colors";

interface TopicSuggestionsProps {
  uiLanguage: "vi" | "en";
  onSelectTopic: (topic: string) => void;
  isGenerating: boolean;
}

export default function TopicSuggestions({
  uiLanguage,
  onSelectTopic,
  isGenerating
}: TopicSuggestionsProps) {
  const { topTopics, isLoading, error } = usePreferences(5);

  const titleText = uiLanguage === "vi" ? "Chủ đề gợi ý cho bạn" : "Recommended for you";
  const descText = uiLanguage === "vi" 
    ? "Bản tin cá nhân hóa dựa trên lịch sử hoạt động của bạn. Bấm một chủ đề để phát thanh." 
    : "Personalized news topics based on your activity. Click any topic to broadcast.";

  const defaultTopics = uiLanguage === "vi"
    ? ["Trí tuệ nhân tạo", "Công nghệ", "Kinh tế", "Giao thông", "Thời tiết"]
    : ["AI", "Technology", "Finance", "Traffic", "Weather"];

  return (
    <Card variant="default" className="p-5 mb-6" id="topic-suggestions-container" style={{ borderColor: colors.border }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1.5 rounded-lg border" style={{ backgroundColor: `${colors.warning}1a`, borderColor: `${colors.warning}33` }}>
          <Compass className="w-4 h-4 animate-spin-slow" style={{ color: colors.warning }} />
        </div>
        <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: colors.textPrimary }}>
          <span>{titleText}</span>
          <Badge variant="warning" className="text-[9px] font-extrabold px-1.5 py-0">
            {uiLanguage === "vi" ? "Thông minh" : "Smart AI"}
          </Badge>
        </h4>
      </div>
      
      <p className="text-[11px] mb-4 block leading-relaxed" style={{ color: colors.textSecondary }}>
        {descText}
      </p>

      {/* States: Loading, Error, Empty, or Filled list */}
      {isLoading ? (
        /* Loading Skeleton */
        <div className="flex flex-wrap gap-2 animate-pulse" id="suggestions-skeleton">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="h-7 w-24 rounded-full border"
              style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}
            />
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="flex items-center gap-2 p-3 rounded-xl border" style={{ backgroundColor: `${colors.critical}0d`, borderColor: `${colors.critical}33` }}>
          <AlertCircle className="w-4 h-4 shrink-0 text-critical" />
          <span className="text-[10px] font-semibold text-critical">
            {uiLanguage === "vi"
              ? `Lỗi tải gợi ý cá nhân hóa: ${error}`
              : `Failed to load personalized suggestions: ${error}`}
          </span>
        </div>
      ) : topTopics.length === 0 ? (
        /* Empty State with Fallback Default Topics */
        <div className="space-y-3" id="suggestions-empty-state">
          <div className="flex items-center gap-1.5 p-2.5 rounded-xl border" style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
            <HelpCircle className="w-4 h-4 shrink-0" style={{ color: colors.textMuted }} />
            <span className="text-[10px]" style={{ color: colors.textMuted }}>
              {uiLanguage === "vi"
                ? "Chưa có đủ lịch sử để gợi ý riêng. Hãy tương tác nhiều hơn! Dưới đây là các chủ đề mặc định:"
                : "Not enough history for personalized topics yet. Here are some trending topics to start:"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {defaultTopics.map((topic, index) => (
              <button
                key={topic + "-" + index}
                onClick={() => !isGenerating && onSelectTopic(topic)}
                disabled={isGenerating}
                className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all border flex items-center gap-1.5 active:scale-95"
                style={isGenerating
                  ? { backgroundColor: colors.surfaceOverlay, color: colors.textMuted, borderColor: colors.border, cursor: "not-allowed" }
                  : { backgroundColor: colors.surfaceOverlay, color: colors.textPrimary, borderColor: colors.border }}
              >
                <Sparkles className="w-3 h-3 shrink-0" style={{ color: colors.textMuted }} />
                <span>{topic}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Personalized Topics Filled List */
        <div className="flex flex-wrap gap-2 animate-fade-in" id="suggestions-filled-list">
          {topTopics.map((pref, index) => (
            <button
              key={pref.topic + "-" + index}
              onClick={() => !isGenerating && onSelectTopic(pref.topic)}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all border flex items-center gap-1.5 active:scale-95 group"
              style={isGenerating
                ? { backgroundColor: colors.surfaceOverlay, color: colors.textMuted, borderColor: colors.border, cursor: "not-allowed" }
                : { backgroundColor: colors.surfaceOverlay, color: colors.textPrimary, borderColor: `${colors.warning}33` }}
              title={`${uiLanguage === "vi" ? "Điểm mức độ quan tâm" : "Interest score"}: ${pref.score.toFixed(1)}`}
            >
              <Sparkles className="w-3 h-3 shrink-0 group-hover:animate-bounce" style={{ color: colors.warning }} />
              <span>{pref.topic}</span>
              <span className="text-[8px] px-1 py-0.2 rounded-md font-mono font-bold"
                    style={{ backgroundColor: `${colors.warning}1a`, color: colors.warning }}>
                {pref.score > 99 ? "99+" : pref.score.toFixed(0)}
              </span>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
