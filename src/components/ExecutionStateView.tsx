/**
 * ExecutionStateView Component
 * 
 * ARCHITECTURAL DECISION:
 * This component does NOT wrap PageTemplate. It is designed as a modular sub-component
 * intended to be rendered within the "player" tab container (specifically inside the 
 * "bg-card-bg" area in App.tsx). It is not a standalone top-level route/page.
 */
import React from "react";
import { motion } from "motion/react";
import { 
  Sparkles, 
  Search, 
  Layers, 
  BarChart, 
  ListMusic, 
  Mic, 
  Volume2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { ExecutionState } from "../types";
import { colors } from "../foundation/tokens/colors";

interface ExecutionStateViewProps {
  state: ExecutionState;
  progressMessage?: string;
  uiLanguage: "vi" | "en";
}

export const ExecutionStateView: React.FC<ExecutionStateViewProps> = ({ 
  state, 
  progressMessage,
  uiLanguage 
}) => {
  const t = {
    initializing: uiLanguage === "vi" ? "Đang chuẩn bị trải nghiệm hành trình..." : "Preparing your commute experience...",
    fetching_sources: uiLanguage === "vi" ? "Đang lấy nguồn tin mới nhất..." : "Fetching latest news sources...",
    normalizing_content: uiLanguage === "vi" ? "Đang làm sạch và cấu trúc nội dung..." : "Cleaning and structuring content...",
    ranking_stories: uiLanguage === "vi" ? "Đang chọn lọc các tin quan trọng..." : "Selecting most relevant stories...",
    building_queue: uiLanguage === "vi" ? "Đang xây dựng hàng đợi bản tin..." : "Building your briefing queue...",
    synthesizing_audio: uiLanguage === "vi" ? "Đang chuẩn bị giọng đọc audio..." : "Preparing audio narration...",
    buffering_audio: uiLanguage === "vi" ? "Đang tối ưu hóa phát lại..." : "Optimizing playback...",
    ready_to_play: uiLanguage === "vi" ? "Sẵn sàng phát" : "Ready to start",
    playing: uiLanguage === "vi" ? "Đang phát bản tin của bạn" : "Now playing your briefing",
    error: uiLanguage === "vi" ? "Có lỗi xảy ra" : "An error occurred"
  };

  const getIcon = () => {
    switch (state) {
      case "initializing": return <Sparkles className="w-5 h-5" style={{ color: colors.warning }} />;
      case "fetching_sources": return <Search className="w-5 h-5" style={{ color: colors.interactive }} />;
      case "normalizing_content": return <Layers className="w-5 h-5" style={{ color: colors.interactive }} />;
      case "ranking_stories": return <BarChart className="w-5 h-5" style={{ color: colors.success }} />;
      case "building_queue": return <ListMusic className="w-5 h-5" style={{ color: colors.interactive }} />;
      case "synthesizing_audio": return <Mic className="w-5 h-5" style={{ color: colors.critical }} />;
      case "buffering_audio": return <Volume2 className="w-5 h-5" style={{ color: colors.warning }} />;
      case "ready_to_play": return <CheckCircle2 className="w-5 h-5" style={{ color: colors.success }} />;
      case "error": return <AlertCircle className="w-5 h-5" style={{ color: colors.critical }} />;
      default: return <Sparkles className="w-5 h-5" style={{ color: colors.textMuted }} />;
    }
  };

  if (state === "idle") return null;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 animate-fade-in">
      <div className="relative">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-20 h-20 rounded-full border flex items-center justify-center shadow-lg"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          {getIcon()}
        </motion.div>
        
        {/* Progress Orbit */}
        <div className="absolute inset-0 -m-2">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="46"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              style={{ color: colors.surfaceOverlay }}
            />
            <motion.circle
              cx="48"
              cy="48"
              r="46"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              strokeDasharray="289"
              animate={{
                strokeDashoffset: [289, 100, 289],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{ color: colors.interactive }}
            />
          </svg>
        </div>
      </div>

      <div className="space-y-2 max-w-xs">
        <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: colors.textPrimary }}>
          {t[state] || t.initializing}
        </h3>
        <p className="text-xs font-medium leading-relaxed" style={{ color: colors.textSecondary }}>
          {progressMessage || (uiLanguage === "vi" ? "Vui lòng đợi trong khi hệ thống xử lý dữ liệu..." : "Please wait while the system processes your feed...")}
        </p>
      </div>

      {/* Skeleton Cards Simulation */}
      <div className="w-full max-w-sm space-y-3 pt-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 p-3 rounded-app-2xl border"
               style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
            <div className="w-10 h-10 rounded-app-xl animate-pulse" 
                 style={{ backgroundColor: colors.border }} />
            <div className="flex-1 space-y-2">
              <div className="h-2.5 w-3/4 rounded-full animate-pulse" 
                   style={{ backgroundColor: colors.border }} />
              <div className="h-2 w-1/2 rounded-full animate-pulse" 
                   style={{ backgroundColor: colors.surface }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
