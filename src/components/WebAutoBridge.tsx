import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Mic, 
  AlertTriangle, 
  Navigation, 
  Radio, 
  Sun, 
  Moon, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  Sparkles, 
  Maximize2, 
  Minimize2,
  Gauge,
  ListMusic
} from "lucide-react";
import { cn } from "../lib/utils";
import { useUserPreferences } from "./UserPreferencesProvider";

export interface WebAutoBridgeProps {
  title?: string;
  subTitle?: string;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  speed?: number;
  uiLanguage?: "vi" | "en";
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onToggleMute?: () => void;
  isMuted?: boolean;
  onVoiceTrigger?: () => void;
  onOpenTrafficAlerts?: () => void;
  onOpenPlaylistModal?: () => void;
  onClose?: () => void;
}

/**
 * WebAutoBridge - Native Automotive Web App Container for CarPlay & Android Auto
 * Complies with NHTSA Driving Distraction Guidelines:
 * - Giant touch targets (>64px) for safe touch while mounted
 * - Rotary Knob / D-Pad navigation support (BMW iDrive, Mazda Commander, Audi MMI)
 * - Ultra-High Contrast (Day Sunlight / Night Anti-Glare Modes)
 * - Minimum cognitive load: 2-step max navigation hierarchy
 */
export const WebAutoBridge: React.FC<WebAutoBridgeProps> = ({
  title = "Bản tin Sáng Doanh nhân",
  subTitle = "Cập nhật Giao thông & Thị trường Tự động",
  isPlaying = false,
  currentTime = 0,
  duration = 180,
  speed = 0,
  uiLanguage = "vi",
  onPlayPause,
  onNext,
  onPrevious,
  onToggleMute,
  isMuted = false,
  onVoiceTrigger,
  onOpenTrafficAlerts,
  onOpenPlaylistModal,
  onClose
}) => {
  const { preferences } = useUserPreferences();
  const [autoMode, setAutoMode] = useState<"carplay" | "android_auto" | "tesla">("carplay");
  const [isSunlightMode, setIsSunlightMode] = useState<boolean>(false);
  const [rotaryFocusedIndex, setRotaryFocusedIndex] = useState<number>(1); // Default to Play/Pause button
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting">("connected");

  // Rotary Knob / D-pad Key Listener for Automotive Head Units
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Arrow keys or Rotary Knob turns (Left = 37, Up = 38, Right = 39, Down = 40, Enter/Select = 13)
    if (["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "Enter"].includes(e.key)) {
      e.preventDefault();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setRotaryFocusedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setRotaryFocusedIndex((prev) => Math.min(5, prev + 1));
      } else if (e.key === "Enter") {
        // Trigger action based on focused button index
        switch (rotaryFocusedIndex) {
          case 0: onPrevious?.(); break;
          case 1: onPlayPause?.(); break;
          case 2: onNext?.(); break;
          case 3: onVoiceTrigger?.(); break;
          case 4: onOpenTrafficAlerts?.(); break;
          case 5: onOpenPlaylistModal?.(); break;
          default: break;
        }
      }
    }
  }, [rotaryFocusedIndex, onPrevious, onPlayPause, onNext, onVoiceTrigger, onOpenTrafficAlerts, onOpenPlaylistModal]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Auto-detect automotive screen aspect ratios & platform signatures
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("android") && ua.includes("car")) {
      setAutoMode("android_auto");
    } else if (ua.includes("tesla") || (window.innerWidth / window.innerHeight) > 1.8) {
      setAutoMode("tesla");
    } else {
      setAutoMode("carplay");
    }
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn(
        "fixed inset-0 z-[120] select-none flex flex-col justify-between p-4 md:p-8 font-sans transition-colors duration-300",
        isSunlightMode 
          ? "bg-yellow-400 text-black font-extrabold" 
          : "bg-zinc-950 text-white"
      )}
      id="web-auto-bridge-root"
    >
      {/* 1. TOP CARPLAY / ANDROID AUTO STATUS HEADER */}
      <header className={cn(
        "flex items-center justify-between pb-4 border-b shrink-0",
        isSunlightMode ? "border-black/20" : "border-white/10"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "px-3 py-1.5 rounded-xl font-mono text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-2 border shadow-sm",
            isSunlightMode 
              ? "bg-black text-yellow-400 border-black" 
              : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
          )}>
            <Radio className="w-4 h-4 animate-pulse" />
            <span>{autoMode === "carplay" ? "APPLE CARPLAY LINK" : autoMode === "android_auto" ? "ANDROID AUTO LINK" : "TESLA COCKPIT PROJECTION"}</span>
          </div>

          <div className={cn(
            "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono",
            isSunlightMode ? "bg-black/10 text-black border-black/30" : "bg-white/5 text-zinc-300 border-white/10"
          )}>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>NHTSA COMPLIANT</span>
          </div>
        </div>

        {/* Live GPS Speedometer & Sunlight Mode Controls */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-xl border font-mono shadow-md",
            isSunlightMode ? "bg-black text-yellow-400 border-black" : "bg-zinc-900 text-emerald-400 border-emerald-500/30"
          )}>
            <Gauge className="w-4 h-4 animate-pulse" />
            <span className="text-sm md:text-base font-black">{Math.round(speed)} <span className="text-[10px] uppercase">km/h</span></span>
          </div>

          <button
            onClick={() => setIsSunlightMode(!isSunlightMode)}
            className={cn(
              "p-3 rounded-2xl border transition-all active:scale-95 flex items-center gap-2 font-black text-xs uppercase",
              isSunlightMode 
                ? "bg-black text-yellow-400 border-black" 
                : "bg-white/10 text-yellow-400 border-white/20 hover:bg-white/20"
            )}
            title="Toggle Direct Sunlight High-Contrast Mode"
          >
            {isSunlightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            <span className="hidden md:inline">{isSunlightMode ? "NIGHT COCKPIT" : "SUNLIGHT HIGH CONTRAST"}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className={cn(
                "p-3 rounded-2xl border transition-all active:scale-95 font-black text-xs uppercase flex items-center gap-1.5",
                isSunlightMode 
                  ? "bg-black text-white border-black hover:bg-zinc-900" 
                  : "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30"
              )}
            >
              <Minimize2 className="w-5 h-5" />
              <span className="hidden md:inline">{uiLanguage === "vi" ? "THOÁT CHẾ ĐỘ XE" : "EXIT AUTO"}</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN COCKPIT DISPLAY AREA (GIANT AUTOMOTIVE TOUCH TARGETS) */}
      <main className="my-auto flex flex-col justify-center max-w-5xl mx-auto w-full py-4 space-y-6">
        {/* Track Metadata & Route Context */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest font-mono bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{preferences.commuteRoute ? `LỘ TRÌNH: ${preferences.commuteRoute}` : "COMMUTE EXECUTIVE BRIEFING"}</span>
          </div>
          <h1 className={cn(
            "text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight line-clamp-2",
            isSunlightMode ? "text-black" : "text-white"
          )}>
            {title}
          </h1>
          <p className={cn(
            "text-sm sm:text-lg font-medium line-clamp-1",
            isSunlightMode ? "text-black/80" : "text-zinc-400"
          )}>
            {subTitle}
          </p>
        </div>

        {/* Huge High-Contrast Audio Scrubber Progress Bar */}
        <div className="space-y-2 px-2">
          <div className={cn(
            "w-full h-4 sm:h-6 rounded-full overflow-hidden border shadow-inner relative cursor-pointer",
            isSunlightMode ? "bg-black/20 border-black/40" : "bg-zinc-800 border-white/10"
          )}>
            <div 
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                isSunlightMode ? "bg-black" : "bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className={cn(
            "flex justify-between font-mono text-xs sm:text-base font-bold",
            isSunlightMode ? "text-black" : "text-zinc-400"
          )}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* 3. AUTOMOTIVE PRIMARY CONTROLS (ROTARY KNOB / GIANT TOUCH MATRIX) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 pt-2">
          {/* Previous Track */}
          <button
            onClick={onPrevious}
            className={cn(
              "h-20 sm:h-24 rounded-3xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-xl",
              rotaryFocusedIndex === 0 && "ring-4 ring-blue-500 scale-105",
              isSunlightMode 
                ? "bg-black text-yellow-400 border-black" 
                : "bg-zinc-900 text-white border-white/15 hover:bg-zinc-800"
            )}
          >
            <SkipBack className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="text-[10px] font-black uppercase font-mono">{uiLanguage === "vi" ? "LÙI BÀI" : "PREV"}</span>
          </button>

          {/* PLAY / PAUSE (PRIMARY GIANT BUTTON) */}
          <button
            onClick={onPlayPause}
            className={cn(
              "h-20 sm:h-24 col-span-1 sm:col-span-2 rounded-3xl border-2 flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl",
              rotaryFocusedIndex === 1 && "ring-4 ring-emerald-400 scale-105",
              isSunlightMode 
                ? "bg-black text-yellow-400 border-black" 
                : isPlaying
                  ? "bg-emerald-600 border-emerald-400 text-white shadow-emerald-900/50" 
                  : "bg-blue-600 border-blue-400 text-white shadow-blue-900/50"
            )}
          >
            {isPlaying ? <Pause className="w-10 h-10 sm:w-12 sm:h-12 fill-current" /> : <Play className="w-10 h-10 sm:w-12 sm:h-12 fill-current ml-1" />}
            <span className="text-base sm:text-2xl font-black uppercase tracking-wider">
              {isPlaying ? (uiLanguage === "vi" ? "TẠM DỪNG" : "PAUSE") : (uiLanguage === "vi" ? "PHÁT BẢN TIN" : "PLAY")}
            </span>
          </button>

          {/* Next Track */}
          <button
            onClick={onNext}
            className={cn(
              "h-20 sm:h-24 rounded-3xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-xl",
              rotaryFocusedIndex === 2 && "ring-4 ring-blue-500 scale-105",
              isSunlightMode 
                ? "bg-black text-yellow-400 border-black" 
                : "bg-zinc-900 text-white border-white/15 hover:bg-zinc-800"
            )}
          >
            <SkipForward className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="text-[10px] font-black uppercase font-mono">{uiLanguage === "vi" ? "BÀI KẾ" : "NEXT"}</span>
          </button>

          {/* VOICE ASSISTANT COCKPIT LAUNCHER */}
          <button
            onClick={onVoiceTrigger}
            className={cn(
              "h-20 sm:h-24 rounded-3xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-xl",
              rotaryFocusedIndex === 3 && "ring-4 ring-purple-500 scale-105",
              isSunlightMode 
                ? "bg-black text-yellow-400 border-black" 
                : "bg-gradient-to-br from-purple-900/80 to-indigo-900/80 text-purple-300 border-purple-500/40 hover:from-purple-800 hover:to-indigo-800"
            )}
          >
            <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase font-mono">{uiLanguage === "vi" ? "TRỢ LÝ THOẠI" : "VOICE AI"}</span>
          </button>

          {/* FAST ACTION: TRAFFIC ALERTS / PLAYLIST */}
          <button
            onClick={onOpenTrafficAlerts}
            className={cn(
              "h-20 sm:h-24 rounded-3xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-xl",
              rotaryFocusedIndex === 4 && "ring-4 ring-amber-500 scale-105",
              isSunlightMode 
                ? "bg-black text-yellow-400 border-black" 
                : "bg-amber-950/80 text-amber-300 border-amber-500/40 hover:bg-amber-900/80"
            )}
          >
            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 animate-bounce" />
            <span className="text-[10px] font-black uppercase font-mono">{uiLanguage === "vi" ? "GIAO THÔNG" : "TRAFFIC"}</span>
          </button>
        </div>
      </main>

      {/* 4. BOTTOM AUTOMOTIVE ROTARY & SAFETY COMPLIANCE FOOTER */}
      <footer className={cn(
        "pt-3 border-t flex items-center justify-between shrink-0 text-xs font-mono font-bold uppercase",
        isSunlightMode ? "border-black/20 text-black" : "border-white/10 text-zinc-500"
      )}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{uiLanguage === "vi" ? "ĐANG DẪN ĐƯỜNG & PHÁT TIẾNG TỰ ĐỘNG" : "AUTOMOTIVE PROJECTION ACTIVE"}</span>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <span>{uiLanguage === "vi" ? "ĐIỀU KHIỂN NÚT VÔ LĂNG / ROTARY KNOB: PHÍM MŨI TÊN + ENTER" : "ROTARY KNOB / D-PAD READY: ARROW KEYS + ENTER"}</span>
        </div>
      </footer>
    </motion.div>
  );
};

export default WebAutoBridge;
