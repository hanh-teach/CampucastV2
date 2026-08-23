import React from "react";
import { Car, Coffee, Zap, Sparkles, Check, Clock, Radio } from "lucide-react";
import { CommuteIntentProfile, COMMUTE_INTENT_PROFILES, CommuteIntentId } from "../types";
import { Card } from "./ui/Card";
import { cn } from "../lib/utils";
import { colors } from "../foundation/tokens/colors";

interface IntentSelectorProps {
  selectedIntentId: CommuteIntentId;
  onSelectIntent: (profile: CommuteIntentProfile) => void;
  onLaunchIntent?: (profile: CommuteIntentProfile) => void;
  uiLanguage: "vi" | "en";
  isGenerating?: boolean;
  activeGeneratingId?: CommuteIntentId | null;
}

export const IntentSelector: React.FC<IntentSelectorProps> = ({
  selectedIntentId,
  onSelectIntent,
  onLaunchIntent,
  uiLanguage,
  isGenerating = false,
  activeGeneratingId = null,
}) => {
  const getIcon = (iconName: string, isSelected: boolean) => {
    const iconClass = "w-6 h-6 shrink-0 transition-transform duration-300";
    switch (iconName) {
      case "Car":
        return <Car className={cn(iconClass, isSelected ? "text-amber-400 scale-110" : "text-zinc-400")} />;
      case "Coffee":
        return <Coffee className={cn(iconClass, isSelected ? "text-emerald-400 scale-110" : "text-zinc-400")} />;
      case "Zap":
        return <Zap className={cn(iconClass, isSelected ? "text-cyan-400 scale-110" : "text-zinc-400")} />;
      default:
        return <Radio className={cn(iconClass, isSelected ? "text-blue-400 scale-110" : "text-zinc-400")} />;
    }
  };

  return (
    <div className="w-full space-y-4" id="intent-selector-container">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
            {uiLanguage === "vi" ? "Chế Độ Hành Trình 1-Chạm" : "1-Touch Commute Profiles"}
          </h2>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
          {uiLanguage === "vi" ? "Tự động tối ưu AI" : "Auto AI Optimized"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COMMUTE_INTENT_PROFILES.map((profile) => {
          const isSelected = selectedIntentId === profile.id;
          const isCurrentlyGenerating = isGenerating && activeGeneratingId === profile.id;

          return (
            <Card
              key={profile.id}
              onClick={() => onSelectIntent(profile)}
              className={cn(
                "p-5 rounded-2xl border transition-all duration-300 relative cursor-pointer group flex flex-col justify-between select-none shadow-md",
                isSelected
                  ? "bg-zinc-900/90 border-blue-500/60 ring-2 ring-blue-500/20 shadow-blue-500/10"
                  : "bg-zinc-900/40 border-white/5 hover:border-white/20 hover:bg-zinc-900/60"
              )}
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300",
                      isSelected
                        ? "bg-blue-600/20 border-blue-500/40"
                        : "bg-zinc-800/80 border-white/5 group-hover:border-white/10"
                    )}
                  >
                    {getIcon(profile.icon, isSelected)}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-zinc-100 uppercase tracking-tight group-hover:text-blue-300 transition-colors">
                      {uiLanguage === "vi" ? profile.nameVi : profile.nameEn}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 mt-0.5">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span>{uiLanguage === "vi" ? profile.durationLabelVi : profile.durationLabelEn}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                    isSelected
                      ? "bg-blue-500/20 border-blue-400/40 text-blue-300"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400"
                  )}
                >
                  {uiLanguage === "vi" ? profile.badgeVi : profile.badgeEn}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-zinc-400 leading-relaxed mb-4 min-h-[36px]">
                {uiLanguage === "vi" ? profile.descVi : profile.descEn}
              </p>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{uiLanguage === "vi" ? "2 MC Đối Thoại" : "Dual-Host Engine"}</span>
                </div>

                {onLaunchIntent && (
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectIntent(profile);
                      onLaunchIntent(profile);
                    }}
                    className={cn(
                      "h-9 px-3.5 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 active:scale-95",
                      isSelected
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10"
                    )}
                  >
                    {isCurrentlyGenerating ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-300" />
                        <span>{uiLanguage === "vi" ? "Đang tạo..." : "Generating..."}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>{uiLanguage === "vi" ? "Phát Ngay" : "Play Now"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
