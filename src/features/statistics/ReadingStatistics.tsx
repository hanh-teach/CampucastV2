// src/features/statistics/ReadingStatistics.tsx
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BarChart3, Clock, PlayCircle, Globe, Award, Sparkles, TrendingUp } from "lucide-react";
import { getListenStats, featureStoreEvents } from "../store";
import { ListenStats } from "../types";
import { colors } from "../../foundation/tokens/colors";

interface ReadingStatisticsProps {
  uiLanguage?: "vi" | "en";
}

export function ReadingStatistics({ uiLanguage = "vi" }: ReadingStatisticsProps) {
  const [stats, setStats] = useState<ListenStats | null>(null);

  const refreshStats = () => {
    setStats(getListenStats());
  };

  useEffect(() => {
    refreshStats();
    featureStoreEvents.addEventListener("change", refreshStats);
    return () => {
      featureStoreEvents.removeEventListener("change", refreshStats);
    };
  }, []);

  if (!stats) return null;

  const totalMinutes = Math.round(stats.totalSeconds / 60);
  const totalHours = (stats.totalSeconds / 3600).toFixed(1);

  // Maximum value for daily history to scale charts
  const maxDailySeconds = Math.max(...stats.dailyHistory.map(d => d.seconds), 1);

  // Categories list ordered by frequency
  const categories = Object.entries(stats.byCategory)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 4);

  return (
    <div className="p-6 rounded-3xl border shadow-xl flex flex-col text-left" id="reading-statistics-panel"
         style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5" style={{ color: colors.interactive }} />
        <h3 className="font-bold" style={{ color: colors.textPrimary }}>
          {uiLanguage === "vi" ? "Thống Kê Phát Thanh" : "Listening Insights & Stats"}
        </h3>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-2xl border" style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
          <div className="flex items-center gap-2 text-xs mb-1" style={{ color: colors.textMuted }}>
            <Clock className="w-4 h-4" style={{ color: colors.interactive }} />
            <span>{uiLanguage === "vi" ? "Tổng thời gian nghe" : "Total listen time"}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono" style={{ color: colors.textPrimary }}>
            {totalMinutes > 0 ? `${totalMinutes}m` : `${stats.totalSeconds}s`}
          </p>
          <p className="text-[10px] mt-1" style={{ color: colors.textMuted }}>
            {uiLanguage === "vi" ? `Khoảng ${totalHours} giờ nghe` : `Approx. ${totalHours} hrs`}
          </p>
        </div>

        <div className="p-4 rounded-2xl border" style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
          <div className="flex items-center gap-2 text-xs mb-1" style={{ color: colors.textMuted }}>
            <PlayCircle className="w-4 h-4" style={{ color: colors.interactive }} />
            <span>{uiLanguage === "vi" ? "Bản tin đã phát" : "Stories completed"}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono" style={{ color: colors.textPrimary }}>
            {stats.totalStoriesRead}
          </p>
          <p className="text-[10px] mt-1" style={{ color: colors.textMuted }}>
            {uiLanguage === "vi" ? "Đã tổng hợp qua AI" : "AI Summaries broadcasted"}
          </p>
        </div>
      </div>

      {/* Daily Listening History chart */}
      <div className="mb-6">
        <h4 className="text-xs sm:text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: colors.textSecondary }}>
          <TrendingUp className="w-3.5 h-3.5" style={{ color: colors.interactive }} />
          {uiLanguage === "vi" ? "Biểu đồ hoạt động (7 ngày)" : "Listening Activity (7 days)"}
        </h4>
        <div className="flex items-end justify-between h-28 gap-2 px-1 pt-4 border-b" style={{ borderColor: colors.border }}>
          {stats.dailyHistory.map((day, idx) => {
            const pct = Math.max(8, Math.min(100, (day.seconds / maxDailySeconds) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative">
                {/* Tooltip */}
                <div className="absolute -top-8 px-2 py-1 text-[10px] rounded shadow-md opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none whitespace-nowrap z-10 font-mono"
                     style={{ backgroundColor: colors.surfaceOverlay, color: colors.textPrimary, borderColor: colors.border }}>
                  {day.seconds > 60 ? `${Math.round(day.seconds / 60)}m` : `${day.seconds}s`}
                </div>
                {/* Bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${pct}%` }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                  className="w-full max-w-[18px] bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-t-lg group-hover:brightness-110 shadow-sm"
                />
                <span className="text-[10px] font-mono mt-1.5 shrink-0" style={{ color: colors.textMuted }}>
                  {day.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Language splits / categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: colors.textSecondary }}>
            <Globe className="w-3.5 h-3.5" style={{ color: colors.interactive }} />
            {uiLanguage === "vi" ? "Ngôn ngữ ưa thích" : "Language Preferences"}
          </h4>
          <div className="flex flex-col gap-2">
            {Object.entries(stats.byLanguage).map(([lang, count]) => {
              const total = (Object.values(stats.byLanguage).reduce((a: number, b: any) => a + (b as number), 0) as number) || 1;
              const pct = Math.round(((count as number) / (total as number)) * 100);
              const label = lang === "vi" ? "Tiếng Việt" : lang === "en" ? "English" : "Song ngữ / Bilingual";
              return (
                <div key={lang} className="text-xs">
                  <div className="flex justify-between mb-1" style={{ color: colors.textSecondary }}>
                    <span className="font-medium">{label}</span>
                    <span className="font-mono" style={{ color: colors.textMuted }}>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.surfaceOverlay }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors.interactive }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(stats.byLanguage).length === 0 && (
              <p className="text-xs" style={{ color: colors.textMuted }}>{uiLanguage === "vi" ? "Chưa có dữ liệu" : "No statistics yet"}</p>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: colors.textSecondary }}>
            <Award className="w-3.5 h-3.5" style={{ color: colors.interactive }} />
            {uiLanguage === "vi" ? "Chủ đề thường nghe" : "Top Heard Topics"}
          </h4>
          <div className="flex flex-col gap-2">
            {categories.map(([cat, count]) => {
              const total = (Object.values(stats.byCategory).reduce((a: number, b: any) => a + (b as number), 0) as number) || 1;
              const pct = Math.round(((count as number) / (total as number)) * 100);
              return (
                <div key={cat} className="text-xs">
                  <div className="flex justify-between mb-1" style={{ color: colors.textSecondary }}>
                    <span className="font-medium truncate max-w-[120px]">{cat}</span>
                    <span className="font-mono" style={{ color: colors.textMuted }}>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.surfaceOverlay }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors.interactive }} />
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <p className="text-xs" style={{ color: colors.textMuted }}>{uiLanguage === "vi" ? "Chưa có dữ liệu" : "No statistics yet"}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
