import { colors } from "../foundation/tokens/colors";
import React, { useState, useEffect, useCallback } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  X, 
  ShieldAlert, 
  Mic, 
  MicOff, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  RefreshCw, 
  Archive, 
  Volume2, 
  VolumeX,
  X as XIcon,
  SkipForward,
  Music,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { useDrivingMode } from "../hooks/useDrivingMode";
import { YouTubeEntertainmentTab } from "./YouTubeEntertainmentTab";
import { useUserPreferences } from "./UserPreferencesProvider";
import { automotiveMediaService } from "../services/automotiveMediaService";
import { aiDjPersonaService } from "../services/aiDjPersonaService";
import { BatteryIndicator } from "./BatteryIndicator";

// Shared variables for managing beep cancellation
let sharedBeepAudioContext: AudioContext | null = null;
let activeOscillators: { stop: () => void }[] = [];

function playBeep(frequency: number, duration: number, double: boolean = false) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!sharedBeepAudioContext) {
      sharedBeepAudioContext = new AudioContextClass();
    }
    const ctx = sharedBeepAudioContext;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    // Cancel active/overlapping beeps
    activeOscillators.forEach(osc => {
      try { osc.stop(); } catch(e){}
    });
    activeOscillators = [];

    const playSingle = (timeOffset: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + timeOffset);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + timeOffset + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + timeOffset);
      osc.stop(ctx.currentTime + timeOffset + duration);

      const cleanup = () => {
        try { osc.disconnect(); } catch (e) {}
        try { gain.disconnect(); } catch (e) {}
      };

      const timeoutId = setTimeout(cleanup, (timeOffset + duration + 0.1) * 1000);

      activeOscillators.push({
        stop: () => {
          clearTimeout(timeoutId);
          try { osc.stop(); } catch(e){}
          cleanup();
        }
      });
    };

    if (double) {
      playSingle(0);
      playSingle(0.15); // play second beep after 150ms
    } else {
      playSingle(0);
    }
  } catch (err) {
    console.error("Failed to play beep:", err);
  }
}

function playTTSFeedback(
  text: string, 
  uiLanguage: "vi" | "en", 
  onStart?: () => void, 
  onEnd?: () => void
) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // cancel current speech immediately to prevent overlap
    
    // Strip emojis
    const cleanText = text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = uiLanguage === "vi" ? "vi-VN" : "en-US";
    
    if (onStart) {
      utterance.onstart = onStart;
    }
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd; // fallback if speech error occurs
    }
    
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error("Failed to play TTS feedback:", err);
    if (onEnd) onEnd();
  }
}

interface DrivingModeProps {
  key?: string;
  title: string;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  onPlayPause: () => void;
  onSkip: (seconds: number) => void;
  onScrubberChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExit: () => void;
  uiLanguage?: "vi" | "en";
  error?: string | null;
  isGenerating?: boolean;
  generationProgress?: number;
  savedBriefings?: any[];
  onPlaySavedBriefing?: (briefing: any) => void;
  onRetryGeneration?: () => void;
  onNext?: () => void;
  onDuckingChange?: (isDucked: boolean) => void;
  speed?: number;
  hasActiveAlert?: boolean;
  trafficAlert?: any;
  autoAudioAlertsEnabled?: boolean;
  onToggleAutoAudioAlerts?: () => void;
  onPlayAlertAudio?: () => void;
}

import { parseVoiceCommand } from "../utils/parseVoiceCommand";
import { CommutePlaylistEngine, CommutePlaylist } from "./CommutePlaylistEngine";
import WebAutoBridge from "./WebAutoBridge";
import { Gauge, Sun, Moon, MapPin, ListMusic, Radio } from "lucide-react";

export default function DrivingMode({
  title,
  isPlaying,
  currentTime,
  totalDuration,
  onPlayPause,
  onSkip,
  onExit,
  uiLanguage = "vi",
  error = null,
  isGenerating = false,
  generationProgress = 0,
  savedBriefings = [],
  onPlaySavedBriefing,
  onRetryGeneration,
  onNext,
  onDuckingChange,
  speed = 0,
  hasActiveAlert = false,
  trafficAlert = null,
  autoAudioAlertsEnabled = false,
  onToggleAutoAudioAlerts,
  onPlayAlertAudio
}: DrivingModeProps) {

  const { preferences, updatePreferences } = useUserPreferences();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [localFeedback, setLocalFeedback] = useState("");
  const [activeView, setActiveView] = useState<"briefing" | "youtube">("briefing");
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState<boolean>(false);
  const [showWebAutoBridge, setShowWebAutoBridge] = useState<boolean>(false);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState<string | undefined>(undefined);
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);
  const [ytVoiceAction, setYtVoiceAction] = useState<{ type: string; timestamp: number } | null>(null);

  const playTTS = useCallback((msg: string) => {
    setIsSpeechActive(true);
    playTTSFeedback(
      msg,
      uiLanguage,
      () => setIsSpeechActive(true),
      () => setIsSpeechActive(false)
    );
  }, [uiLanguage]);

  const handleVoiceCommand = useCallback((commandText: string) => {
    const action = parseVoiceCommand(commandText, uiLanguage);
    
    const triggerSuccessFeedback = (msg: string) => {
      setLocalFeedback(msg);
      playBeep(880, 0.1);
      setTimeout(() => {
        playTTS(msg);
      }, 150);
      if (preferences.hapticFeedbackEnabled !== false && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }
    };

    switch (action.type) {
      case "SWITCH_VIEW":
        setActiveView(action.view);
        if (action.view === "youtube") {
          triggerSuccessFeedback(uiLanguage === "vi" ? "📺 Chế độ giải trí YouTube" : "📺 YouTube Entertainment Mode");
        } else {
          triggerSuccessFeedback(uiLanguage === "vi" ? "📰 Chế độ bản tin phát thanh" : "📰 Briefing Mode");
        }
        break;
      case "SEARCH":
        setVoiceSearchQuery(action.query);
        setActiveView("youtube");
        triggerSuccessFeedback(uiLanguage === "vi" ? `🔍 Tìm YouTube: ${action.query}` : `🔍 YouTube Search: ${action.query}`);
        break;
      case "PLAY":
        if (activeView === "youtube") {
          setYtVoiceAction({ type: "PLAY", timestamp: Date.now() });
          triggerSuccessFeedback(uiLanguage === "vi" ? "▶️ YouTube: Đang phát..." : "▶️ YouTube: Playing...");
        } else {
          triggerSuccessFeedback(uiLanguage === "vi" ? "▶️ Bản tin: Đang phát..." : "▶️ Briefing: Playing...");
          if (!isPlaying) onPlayPause();
        }
        break;
      case "PAUSE":
        if (activeView === "youtube") {
          setYtVoiceAction({ type: "PAUSE", timestamp: Date.now() });
          triggerSuccessFeedback(uiLanguage === "vi" ? "⏸️ YouTube: Đã tạm dừng" : "⏸️ YouTube: Paused");
        } else {
          triggerSuccessFeedback(uiLanguage === "vi" ? "⏸️ Bản tin: Đã tạm dừng" : "⏸️ Briefing: Paused");
          if (isPlaying) onPlayPause();
        }
        break;
      case "NEXT":
        if (activeView === "youtube") {
          setYtVoiceAction({ type: "NEXT", timestamp: Date.now() });
          triggerSuccessFeedback(uiLanguage === "vi" ? "⏭️ YouTube: Bài tiếp theo" : "⏭️ YouTube: Next Track");
        } else {
          triggerSuccessFeedback(uiLanguage === "vi" ? "⏭️ Bản tin: Bài tiếp theo" : "⏭️ Briefing: Next Track");
          if (onNext) onNext();
        }
        break;
      case "PREVIOUS":
        if (activeView === "youtube") {
          setYtVoiceAction({ type: "PREVIOUS", timestamp: Date.now() });
          triggerSuccessFeedback(uiLanguage === "vi" ? "⏮️ YouTube: Bài trước đó" : "⏮️ YouTube: Previous Track");
        } else {
          triggerSuccessFeedback(uiLanguage === "vi" ? "⏮️ Bản tin: Bài trước đó" : "⏮️ Briefing: Previous Track");
          onSkip(-30);
        }
        break;
      case "VOLUME_UP":
        triggerSuccessFeedback(uiLanguage === "vi" ? "🔊 Đã tăng âm lượng" : "🔊 Volume Increased");
        break;
      case "VOLUME_DOWN":
        triggerSuccessFeedback(uiLanguage === "vi" ? "🔉 Đã giảm âm lượng" : "🔉 Volume Decreased");
        break;
      case "MUTE":
        triggerSuccessFeedback(uiLanguage === "vi" ? "🔇 Đã tắt tiếng" : "🔇 Muted");
        break;
      case "UNMUTE":
        triggerSuccessFeedback(uiLanguage === "vi" ? "🔊 Đã bật tiếng" : "🔊 Unmuted");
        break;
      case "TRAFFIC_ALERT":
        triggerSuccessFeedback(uiLanguage === "vi" ? "⚠️ Đang kiểm tra cảnh báo giao thông..." : "⚠️ Checking Traffic Alert...");
        break;
      case "ASSISTANT":
        triggerSuccessFeedback(uiLanguage === "vi" ? `🤖 Trợ lý: "${action.prompt || 'Đang lắng nghe'}"` : `🤖 Assistant: "${action.prompt || 'Listening'}"`);
        break;
      case "FORWARD":
        triggerSuccessFeedback(uiLanguage === "vi" ? `⏩ Tua nhanh ${action.seconds}s` : `⏩ Fast Forward ${action.seconds}s`);
        onSkip(action.seconds);
        break;
      case "REWIND":
        triggerSuccessFeedback(uiLanguage === "vi" ? `⏪ Tua lùi ${action.seconds}s` : `⏪ Rewind ${action.seconds}s`);
        onSkip(-action.seconds);
        break;
      case "EXIT":
        triggerSuccessFeedback(uiLanguage === "vi" ? "🚪 Thoát..." : "🚪 Exiting...");
        setTimeout(onExit, 1000);
        break;
      case "UNRECOGNIZED":
        const failMsg = uiLanguage === "vi" ? `❓ Chưa rõ: "${action.raw}"` : `❓ Unrecognized: "${action.raw}"`;
        setLocalFeedback(failMsg);
        playBeep(220, 0.1, true); // Low pitch double beep for unrecognized commands
        if (preferences.hapticFeedbackEnabled !== false) {
          vibrate([50, 100, 50]); // 2 short vibration pulses
        }
        break;
    }

    setTimeout(() => setLocalFeedback(""), 3000);
  }, [isPlaying, onPlayPause, onSkip, onExit, onNext, uiLanguage, preferences.hapticFeedbackEnabled, playTTS]);

  const {
    isListening,
    isContinuous,
    setIsContinuous,
    micError,
    startSpeechRecognition,
    stopSpeechRecognition,
    transcript,
    interimTranscript,
    audioLevel,
    vibrate
  } = useDrivingMode(uiLanguage, { onCommand: handleVoiceCommand });

  const isDucked = isListening || isSpeechActive;

  useEffect(() => {
    if (onDuckingChange) onDuckingChange(isDucked);
  }, [isDucked, onDuckingChange]);

  // Sync Automotive Native Media Session (Car Steering Controls & Dashboard Metadata)
  useEffect(() => {
    automotiveMediaService.updateMetadata({
      title: title || (uiLanguage === "vi" ? "CommuteCast Bản Tin Lái Xe" : "CommuteCast Automotive Radio"),
      artist: "MC Minh & MC An (CommuteCast AI DJ)",
      album: uiLanguage === "vi" ? "Chế độ Lái xe HUD Ô Tô" : "Automotive HUD Dashboard",
      duration: totalDuration,
      playbackRate: speed
    });

    automotiveMediaService.updatePlaybackState(isPlaying ? "playing" : "paused");

    automotiveMediaService.registerAutomotiveControls({
      onPlay: () => { if (!isPlaying) onPlayPause(); },
      onPause: () => { if (isPlaying) onPlayPause(); },
      onNext: () => { if (onNext) onNext(); else onSkip(30); },
      onPrevious: () => onSkip(-15),
      onSeekForward: () => onSkip(15),
      onSeekBackward: () => onSkip(-15)
    });
  }, [title, isPlaying, totalDuration, speed, uiLanguage, onPlayPause, onNext, onSkip]);

  useEffect(() => {
    automotiveMediaService.updatePositionState(totalDuration, speed, currentTime);
  }, [currentTime, totalDuration, speed]);

  useEffect(() => {
    return () => {
      // Clean up SpeechSynthesis to prevent overlaps/hanging speech
      if (typeof window !== "undefined" && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }

      // Stop any remaining beep audio sources
      activeOscillators.forEach(osc => {
        try { osc.stop(); } catch(e){}
      });
      activeOscillators = [];

      // Close Beep AudioContext
      if (sharedBeepAudioContext) {
        try {
          sharedBeepAudioContext.close();
        } catch (e) {
          console.warn("Failed to close sharedBeepAudioContext:", e);
        }
        sharedBeepAudioContext = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isContinuous) startSpeechRecognition();
    else stopSpeechRecognition();
    return () => stopSpeechRecognition();
  }, [isContinuous, startSpeechRecognition, stopSpeechRecognition]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      if (isContinuous) {
        setIsContinuous(false);
        stopSpeechRecognition();
        const msg = uiLanguage === "vi" ? "Mất mạng: Đã tắt giọng nói" : "Offline: Voice control disabled";
        setLocalFeedback(msg);
        playBeep(440, 0.2, true); // Warning beep
        setTimeout(() => {
          playTTS(msg);
        }, 250);
        setTimeout(() => setLocalFeedback(""), 4000);
      }
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isContinuous, setIsContinuous, stopSpeechRecognition, uiLanguage, playTTS]);

  useEffect(() => {
    const docElm = document.documentElement;
    const enterFullscreen = async () => {
      try {
        if (docElm.requestFullscreen) await docElm.requestFullscreen();
      } catch (err) {
        console.warn("Fullscreen request blocked:", err);
      }
    };
    enterFullscreen();
    return () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    let wakeLock: any = null;
    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator) wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.warn("Wake Lock failed:", err);
      }
    };
    requestLock();
    return () => {
      document.body.style.overflow = "";
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, []);

  const t = {
    vi: {
      modeActive: "DRIVING HUD ACTIVE",
      safetyWarning: "Tập trung lái xe an toàn • Ra lệnh bằng giọng nói",
      exitBtn: "Thoát HUD",
      noBriefing: "Sẵn sàng phát thanh",
      offlineWarning: "MẤT KẾT NỐI: Đang dùng dữ liệu ngoại tuyến",
      voiceActive: "Trợ lý sẵn sàng",
      continuousOn: "Rảnh tay liên tục: Bật",
      continuousOff: "Nhấn để ra lệnh",
      statusListening: "🎙️ Đang lắng nghe...",
      statusProcessing: "⚙️ Đang xử lý...",
      savedTitle: "Bản tin lưu trữ",
      voiceOffline: "Mất kết nối mạng — Ngoại tuyến"
    },
    en: {
      modeActive: "DRIVING HUD ACTIVE",
      safetyWarning: "Focus on driving • Hands-free voice control",
      exitBtn: "Exit HUD",
      noBriefing: "Ready to broadcast",
      offlineWarning: "OFFLINE: Using cached resources",
      voiceActive: "Assistant Ready",
      continuousOn: "Hands-free: ON",
      continuousOff: "Tap to command",
      statusListening: "🎙️ Listening...",
      statusProcessing: "⚙️ Processing...",
      savedTitle: "Offline Archive",
      voiceOffline: "Voice control suspended — no network connection"
    }
  }[uiLanguage];

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const isQuotaLimit = error && (error.includes("QUOTA_LIMIT") || error.includes("429") || error.includes("quota"));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-[100] select-none overflow-hidden flex flex-col p-2 md:p-6 transition-colors duration-300",
        isHighContrast 
          ? "bg-yellow-400 text-black font-extrabold" 
          : "bg-black text-white"
      )}
      id="driving-hud-root"
    >
      {/* 1. TOP HEADER (Fixed Height with Scroll & Fixed Exit HUD Button) */}
      <header className={cn("shrink-0 h-16 md:h-20 flex items-center justify-between gap-2 px-2 md:px-4 border-b z-30 overflow-x-auto no-scrollbar", isHighContrast ? "border-black/20" : "border-white/5")}>
        <div className="flex items-center gap-3 shrink-0">
          <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border", isHighContrast ? "bg-black text-yellow-400 border-black" : "bg-blue-600/20 border-blue-500/30")}>
            <ShieldAlert className="w-5 h-5 md:w-6 md:h-6 text-yellow-500 animate-pulse" />
          </div>
          <div className="hidden sm:block">
            <h2 className={cn("text-[10px] md:text-xs font-black tracking-widest uppercase font-mono", isHighContrast ? "text-black" : "text-blue-400")}>{t.modeActive}</h2>
            <p className={cn("text-[8px] md:text-[10px] font-bold uppercase tracking-tighter", isHighContrast ? "text-black/70" : "text-white/40")}>{t.safetyWarning}</p>
          </div>
        </div>

        {/* Real-time GPS Speedometer Readout */}
        <div className={cn("flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl border font-mono shadow-xl shrink-0", isHighContrast ? "bg-black text-yellow-400 border-black" : "bg-zinc-900/90 text-emerald-400 border-emerald-500/40")}>
          <Gauge className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 animate-pulse" />
          <div className="flex flex-col leading-none">
            <span className="text-sm md:text-lg font-black">{Math.round(speed)} <span className="text-[9px] uppercase font-sans">km/h</span></span>
            <span className="text-[7px] md:text-[8px] text-zinc-400 uppercase font-sans font-bold">{uiLanguage === "vi" ? "Tốc độ GPS" : "GPS Speed"}</span>
          </div>
        </div>

        {/* Live Battery & Commute Power Readiness Indicator */}
        <BatteryIndicator uiLanguage={uiLanguage} variant="hud" isHighContrast={isHighContrast} />

        {/* High-Contrast Sun Mode Toggle */}
        <button
          onClick={() => setIsHighContrast(!isHighContrast)}
          className={cn("p-2 md:p-2.5 rounded-xl border flex items-center gap-1.5 transition-all active:scale-95 shrink-0", isHighContrast ? "bg-black text-yellow-400 border-black" : "bg-white/5 border-white/10 hover:bg-white/10 text-yellow-400")}
          title="Toggle High-Contrast Sunlight Mode"
        >
          {isHighContrast ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
          <span className="text-[10px] font-black uppercase tracking-wider hidden lg:inline">{isHighContrast ? "HIGH CONTRAST ON" : "SUNLIGHT MODE"}</span>
        </button>

        {/* Automotive CarPlay / Android Auto Native Web Bridge Launcher */}
        <button
          onClick={() => setShowWebAutoBridge(true)}
          className="p-2 md:p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center gap-1.5 transition-all active:scale-95 shadow-md shrink-0"
          title="Open Native CarPlay / Android Auto Web Bridge Container"
        >
          <Radio className="w-4 h-4 md:w-5 md:h-5 animate-pulse text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">CARPLAY / AUTO</span>
        </button>

        {/* Traffic Alert & Auto Audio Toggle Control Button */}
        {(hasActiveAlert || trafficAlert) ? (
          <button
            onClick={() => {
              if (onToggleAutoAudioAlerts) onToggleAutoAudioAlerts();
              if (!autoAudioAlertsEnabled && onPlayAlertAudio) {
                onPlayAlertAudio();
              }
            }}
            className={cn(
              "p-2 md:p-2.5 rounded-xl border font-mono font-black text-[10px] flex items-center gap-1.5 transition-all active:scale-95 shadow-xl shrink-0",
              !autoAudioAlertsEnabled
                ? "border-amber-500 bg-amber-500/20 text-amber-300 animate-pulse hover:bg-amber-500/30 ring-2 ring-amber-500/40"
                : "border-emerald-500 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
            )}
            title={!autoAudioAlertsEnabled 
              ? (uiLanguage === "vi" ? "Cảnh báo giao thông mới! Chạm để BẬT tự động & phát âm thanh" : "New traffic alert! Tap to ENABLE auto audio & play now")
              : (uiLanguage === "vi" ? "Đang tự động đọc cảnh báo giao thông. Chạm để tắt" : "Auto audio alert is ON. Tap to disable")
            }
          >
            {!autoAudioAlertsEnabled ? (
              <>
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-400 animate-bounce shrink-0" />
                <span className="hidden md:inline uppercase tracking-wider text-amber-300">
                  {uiLanguage === "vi" ? "⚠️ CẢNH BÁO MỚI (CHẠM ĐỂ BẬT & NGHE)" : "⚠️ NEW ALERT (TAP TO ENABLE & PLAY)"}
                </span>
                <span className="md:hidden uppercase font-black text-amber-300">⚠️ CẢNH BÁO</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 shrink-0" />
                <span className="hidden md:inline uppercase tracking-wider text-emerald-300">
                  {uiLanguage === "vi" ? "🔊 CẢNH BÁO TỰ ĐỘNG: BẬT" : "🔊 AUTO ALERT: ON"}
                </span>
                <span className="md:hidden uppercase font-black text-emerald-300">🔊 TỰ ĐỘNG</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => {
              if (onToggleAutoAudioAlerts) onToggleAutoAudioAlerts();
            }}
            className={cn(
              "p-2 md:p-2.5 rounded-xl border font-mono font-bold text-[10px] flex items-center gap-1.5 transition-all active:scale-95 shadow-md shrink-0",
              autoAudioAlertsEnabled
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                : "border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80"
            )}
            title={autoAudioAlertsEnabled 
              ? (uiLanguage === "vi" ? "Cảnh báo âm thanh tự động: BẬT" : "Auto audio alert: ON") 
              : (uiLanguage === "vi" ? "Cảnh báo âm thanh tự động: TẮT (Chạm để bật)" : "Auto audio alert: OFF (Tap to enable)")
            }
          >
            {autoAudioAlertsEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="hidden lg:inline uppercase">{uiLanguage === "vi" ? "🔊 ÂM THANH TỰ ĐỘNG: BẬT" : "🔊 AUTO AUDIO: ON"}</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="hidden lg:inline uppercase">{uiLanguage === "vi" ? "🔇 ÂM THANH TỰ ĐỘNG: TẮT" : "🔇 AUTO AUDIO: OFF"}</span>
              </>
            )}
          </button>
        )}

        {/* Unified Tab Switcher */}
        <nav className="flex bg-zinc-900/80 p-1 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md shrink-0">
          <button
            onClick={() => setActiveView("briefing")}
            className={cn(
              "px-3 md:px-8 py-2 md:py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all",
              activeView === "briefing" ? "bg-blue-600 text-white shadow-lg" : "text-white/40 hover:text-white/60"
            )}
          >
            {uiLanguage === "vi" ? "BẢN TIN" : "BRIEFING"}
          </button>
          <button
            onClick={() => setActiveView("youtube")}
            className={cn(
              "px-3 md:px-8 py-2 md:py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-2",
              activeView === "youtube" ? "bg-red-600 text-white shadow-lg" : "text-white/40 hover:text-white/60"
            )}
          >
            <Music className="w-3 h-3" />
            {uiLanguage === "vi" ? "GIẢI TRÍ" : "YOUTUBE"}
          </button>
        </nav>

        {/* Prominent Sticky / Pinned Exit HUD Button */}
        <button 
          onClick={onExit}
          className="h-10 md:h-14 px-3 md:px-6 rounded-xl bg-red-600/20 border border-red-500/50 flex items-center gap-2 hover:bg-red-600/30 transition-all active:scale-95 group shrink-0 shadow-lg"
          title="Thoát chế độ lái xe HUD"
        >
          <XIcon className="w-4 h-4 md:w-5 md:h-5 text-red-400 group-hover:scale-110" />
          <span className="font-black uppercase tracking-widest text-[10px] md:text-xs text-red-300 whitespace-nowrap">{t.exitBtn}</span>
        </button>
      </header>

      {/* GLOBAL VOICE FEEDBACK TOAST BANNER */}
      <AnimatePresence mode="wait">
        {localFeedback && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-blue-600/90 border border-blue-400/50 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
            <span className="text-xs md:text-sm font-black uppercase tracking-wider text-white whitespace-nowrap">{localFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL VOICE HUD STATUS BAR (Synchronized across Briefing & YouTube Views) */}
      {isListening && (
        <div className="w-full max-w-4xl mx-auto px-4 py-2 bg-blue-950/50 border border-blue-500/30 rounded-2xl backdrop-blur-md flex items-center justify-between z-30 shrink-0 mt-2 mb-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <Mic className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 whitespace-nowrap">
              {uiLanguage === "vi" ? "TRỢ LÝ ĐANG NGHE" : "VOICE ASSISTANT LISTENING"}
            </span>
            {interimTranscript && (
              <span className="text-xs font-mono text-white/90 truncate bg-white/10 px-3 py-0.5 rounded-lg border border-white/10">
                🗣️ "{interimTranscript}"
              </span>
            )}
          </div>

          {/* Real-time Decibel Audio Level Meter */}
          <div className="flex items-center gap-1 h-4 shrink-0">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
              const barThreshold = (i / 8) * 100;
              const isActive = (audioLevel * 100) >= barThreshold;
              return (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-all duration-75",
                    isActive ? "bg-emerald-400 h-4 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-white/10 h-1.5"
                  )}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 2. CENTER STAGE (Flexible Height) */}
      <main className="w-full flex flex-row items-stretch gap-6 px-6 my-auto flex-1 overflow-hidden py-2">
        {activeView === "briefing" ? (
          <>
            {/* CỘT TRÁI - Khung hiển thị chính */}
            <div className="flex-[4] h-full flex flex-col items-center justify-center bg-zinc-900/50 rounded-2xl overflow-hidden relative p-6">

              <motion.div 
                key="briefing-stage"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center gap-6 text-center w-full"
              >
                {/* AI DJ ON-AIR BADGE */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-400/30 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                    {uiLanguage === "vi" ? "AI DJ ON AIR • MC MINH & MC AN" : "AI DJ ON AIR • MC MINH & MC AN"}
                  </span>
                </div>

                <h1 className="text-xl md:text-2xl font-bold tracking-wide leading-tight max-w-2xl px-6">
                  {isGenerating ? (uiLanguage === "vi" ? "ĐANG TỔNG HỢP..." : "GENERATING...") : title || t.noBriefing}
                </h1>
                
                {/* Dynamic Audio Level Meter Waves */}
                <div className="flex items-center gap-1.5 h-16 md:h-24">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => {
                    const waveHeight = isListening
                      ? Math.max(12, Math.sin((i + Date.now() / 100) * 0.5) * 40 * (audioLevel || 0.4) + 20)
                      : isPlaying ? [10, 80, 10] : 6;
                    return (
                      <motion.div
                        key={i}
                        animate={{ height: waveHeight }}
                        transition={{ duration: isListening ? 0.1 : (isPlaying ? 0.6 : 1.2), repeat: isListening ? 0 : Infinity, delay: i * 0.04 }}
                        className={cn(
                          "w-1.5 md:w-2.5 rounded-full transition-all duration-150",
                          isPlaying 
                            ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                            : (isListening ? "bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" : "bg-white/10")
                        )}
                      />
                    );
                  })}
                </div>

                {/* Live Interim Transcript & Feedback Status */}
                <div className="mt-4 flex flex-col items-center gap-4 w-full max-w-md">
                  {interimTranscript && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs text-center shadow-lg animate-pulse"
                    >
                      🗣️ "{interimTranscript}"
                    </motion.div>
                  )}

                  {micError ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-red-950/80 border border-red-500/30 text-center space-y-2 w-full"
                    >
                      <div className="flex items-center justify-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{uiLanguage === "vi" ? "LỖI MICROPHONE" : "MICROPHONE ERROR"}</span>
                      </div>
                      <p className="text-xs text-red-200 font-semibold leading-relaxed px-2">
                        {micError}
                      </p>
                      <button 
                        onClick={() => {
                          setIsContinuous(true);
                          startSpeechRecognition();
                        }}
                        className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                      >
                        {uiLanguage === "vi" ? "CẤP QUYỀN LẠI / THỬ LẠI" : "GRANT ACCESS / RETRY"}
                      </button>
                    </motion.div>
                  ) : isListening ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 w-full text-center"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                          {uiLanguage === "vi" ? "TRỢ LÝ ĐANG LẮNG NGHE" : "ASSISTANT LISTENING"}
                        </span>
                      </div>
                      
                      <p className="text-xs text-blue-200 font-medium max-w-xs leading-relaxed mt-1">
                        {preferences.wakeWordEnabled !== false ? (
                          uiLanguage === "vi" ? (
                            <>Nói: <span className="text-white font-extrabold font-mono">"Cast ơi, [khẩu lệnh]"</span><br /><span className="text-[10px] text-white/50">(Ví dụ: "Cast ơi phát", "Cast ơi qua bài", "Cast ơi tăng âm")</span></>
                          ) : (
                            <>Say: <span className="text-white font-extrabold font-mono">"Hey Cast, [command]"</span><br /><span className="text-[10px] text-white/50">(e.g. "Hey Cast play", "Hey Cast next", "Hey Cast volume up")</span></>
                          )
                        ) : (
                          uiLanguage === "vi" ? (
                            <>Nói trực tiếp: <span className="text-white font-extrabold font-mono">"phát", "tạm dừng", "qua bài", "tăng âm"</span></>
                          ) : (
                            <>Say directly: <span className="text-white font-extrabold font-mono">"play", "pause", "next", "volume up"</span></>
                          )
                        )}
                      </p>
                    </motion.div>
                  ) : isOffline ? (
                    <div className="text-[10px] font-bold text-amber-500/80 uppercase tracking-[0.15em] text-center">
                      {uiLanguage === "vi" 
                        ? "Điều khiển giọng nói tạm ngưng • Ngoại tuyến" 
                        : "Voice Control Suspended • Offline"}
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] text-center">
                      {uiLanguage === "vi" 
                        ? "Micro đang tắt • Nhấn 'VOICE OFF' bên dưới để bật rảnh tay" 
                        : "Voice Control Off • Tap 'VOICE OFF' below to enable hands-free"}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
            
            {/* CỘT PHẢI - Tính năng phụ dọc */}
            <div className="flex-[1] max-w-[250px] flex flex-col justify-start gap-4 pt-2 overflow-y-auto">
              <div className="w-full text-center pb-2 text-white/30 text-xs font-semibold uppercase tracking-widest border-b border-white/10 mb-2">
                {uiLanguage === "vi" ? "BẢN TIN LƯU TRỮ" : "OFFLINE ARCHIVE"}
              </div>
              
              {savedBriefings.map((briefing) => (
                <div key={briefing.id} className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-2">
                  <div className="text-[10px] font-bold text-white/80 uppercase truncate">{briefing.title}</div>
                  <button 
                    onClick={() => onPlaySavedBriefing?.(briefing)}
                    className="w-full py-2 bg-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all"
                  >
                    {uiLanguage === "vi" ? "Phát Ngoại Tuyến" : "Play Offline"}
                  </button>
                </div>
              ))}

              <div className="w-full text-center pb-2 text-white/30 text-xs font-semibold uppercase tracking-widest border-b border-white/10 mb-2 mt-4">
                {uiLanguage === "vi" ? "TÙY CHỌN" : "OPTIONS"}
              </div>
              
              <button 
                onClick={() => setShowPlaylistModal(true)} 
                className="flex items-center gap-2 w-full py-3.5 px-2 justify-center rounded-xl font-black text-[10px] md:text-xs transition-all bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 active:scale-95 uppercase tracking-wider"
              >
                <ListMusic className="w-4 h-4" />
                <span>{uiLanguage === "vi" ? "PLAYLIST LỘ TRÌNH" : "SMART PLAYLIST"}</span>
              </button>

              <button 
                onClick={() => updatePreferences({ wakeWordEnabled: !preferences.wakeWordEnabled })} 
                className={cn(
                  "flex items-center gap-2 w-full py-3.5 px-2 justify-center rounded-xl font-black text-[10px] md:text-xs transition-all border active:scale-95 uppercase tracking-widest",
                  preferences.wakeWordEnabled !== false 
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-400" 
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                )}
              >
                <span>
                  {uiLanguage === "vi" 
                    ? `ĐÁNH THỨC 'CAST ƠI': ${preferences.wakeWordEnabled !== false ? "BẬT" : "TẮT"}` 
                    : `WAKE WORD: ${preferences.wakeWordEnabled !== false ? "ON" : "OFF"}`}
                </span>
              </button>

              <button 
                onClick={() => setShowVoiceHelp(true)} 
                className="flex items-center gap-2 w-full py-3 px-2 justify-center rounded-xl font-bold text-xs transition-all bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 active:scale-95 uppercase tracking-wider"
              >
                <Mic className="w-4 h-4" />
                <span>{uiLanguage === "vi" ? "HƯỚNG DẪN KHẨU LỆNH" : "VOICE HELP"}</span>
              </button>

              <button onClick={onRetryGeneration} className="flex items-center gap-2 w-full py-3 px-2 justify-center rounded-xl font-semibold text-sm transition-all bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 active:scale-95">
                <RefreshCw className="w-4 h-4" />
                <span>{uiLanguage === "vi" ? "LÀM MỚI" : "REFRESH"}</span>
              </button>
            </div>
          </>
        ) : (
          <YouTubeEntertainmentTab 
            isDucked={isListening}
            uiLanguage={uiLanguage}
            voiceSearchQuery={voiceSearchQuery}
            onClearSearch={() => setVoiceSearchQuery(undefined)}
            voiceCommandAction={ytVoiceAction}
          />
        )}
      </main>

      {/* SMART COMMUTE PLAYLIST ENGINE MODAL */}
      <AnimatePresence>
        {showPlaylistModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-white/20 rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>

              <CommutePlaylistEngine
                uiLanguage={uiLanguage}
                commuteRoute={preferences.commuteRoute || "Cầu Giấy - Khuất Duy Tiến - Nguyễn Trãi"}
                onPlayPlaylist={(playlist) => {
                  setShowPlaylistModal(false);
                  setLocalFeedback(uiLanguage === "vi" ? `▶️ Đang phát: ${playlist.title}` : `▶️ Playing: ${playlist.title}`);
                  if (!isPlaying) onPlayPause();
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NATIVE WEB AUTO BRIDGE (CARPLAY & ANDROID AUTO CONTAINER) */}
      <AnimatePresence>
        {showWebAutoBridge && (
          <WebAutoBridge
            title={title}
            subTitle={uiLanguage === "vi" ? "Đang dẫn đường & Phát tin tự động" : "Commute Auto Executive Briefing"}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={totalDuration}
            speed={speed}
            uiLanguage={uiLanguage}
            onPlayPause={onPlayPause}
            onNext={onNext}
            onPrevious={onSkip}
            onVoiceTrigger={() => {
              setShowWebAutoBridge(false);
              setShowVoiceHelp(true);
            }}
            onOpenTrafficAlerts={() => {
              setShowWebAutoBridge(false);
              setActiveView("briefing");
            }}
            onOpenPlaylistModal={() => {
              setShowWebAutoBridge(false);
              setShowPlaylistModal(true);
            }}
            onClose={() => setShowWebAutoBridge(false)}
          />
        )}
      </AnimatePresence>

      {/* VOICE HELP MODAL */}
      <AnimatePresence>
        {showVoiceHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/20 rounded-3xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
                    <Mic className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base tracking-wide">
                      {uiLanguage === "vi" ? "DANH SÁCH KHẨU LỆNH GIỌNG NÓI" : "VOICE COMMAND REFERENCE"}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {uiLanguage === "vi" ? "Từ khóa đánh thức mặc định: 'Cast ơi' hoặc 'Hey Cast'" : "Default wake word: 'Cast ơi' or 'Hey Cast'"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowVoiceHelp(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <span className="font-extrabold text-emerald-400 uppercase tracking-wider block">▶️ Điều khiển phát nhạc</span>
                  <p className="text-zinc-300">"Cast ơi phát" / "Cast ơi tạm dừng" / "Cast ơi tiếp tục"</p>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <span className="font-extrabold text-blue-400 uppercase tracking-wider block">⏭️ Chuyển bài & Tua</span>
                  <p className="text-zinc-300">"Cast ơi qua bài" / "Cast ơi bài trước" / "Cast ơi tua nhanh" / "Cast ơi tua lùi"</p>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <span className="font-extrabold text-amber-400 uppercase tracking-wider block">🔊 Âm lượng & Cảnh báo</span>
                  <p className="text-zinc-300">"Cast ơi tăng âm" / "Cast ơi giảm âm" / "Cast ơi tắt tiếng" / "Cast ơi cảnh báo giao thông"</p>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <span className="font-extrabold text-purple-400 uppercase tracking-wider block">📺 Chuyển màn hình & Trợ lý</span>
                  <p className="text-zinc-300">"Cast ơi mở bản tin" / "Cast ơi mở youtube" / "Cast ơi gọi trợ lý"</p>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-1">
                  <span className="font-extrabold text-red-400 uppercase tracking-wider block">🚪 Thoát Chế Độ Lái Xe</span>
                  <p className="text-zinc-300">"Cast ơi thoát" / "Cast ơi đóng HUD" / "Cast ơi về trang chủ"</p>
                </div>
              </div>

              <button
                onClick={() => setShowVoiceHelp(false)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
              >
                {uiLanguage === "vi" ? "ĐÃ HỂU, ĐÓNG HƯỚNG DẪN" : "GOT IT, CLOSE"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. BOTTOM CONTROL BLOCK (Unified) */}
      <footer className="shrink-0 flex flex-col gap-4 pb-2 z-40 mt-auto w-full max-w-4xl mx-auto">
        <div className="w-full space-y-2 px-4 mb-2">
          <div className="flex justify-between font-mono text-[10px] md:text-xs font-medium text-white/40 uppercase tracking-widest">
            <span>{formatTime(currentTime)}</span>
            <span className={cn("transition-colors", isPlaying ? "text-blue-400" : "text-white/20")}>{isPlaying ? "STREAMING" : "PAUSED"}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
          <div className="relative h-1.5 md:h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)]"
              animate={{ width: `${(currentTime / (totalDuration || 1)) * 100}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
          </div>
        </div>

        {/* STATUS BAR & MEDIA CONTROLS (Absolute Bottom) */}
        <div className="relative flex items-center justify-between px-4 md:px-8 h-16 border-t border-white/5 pt-2">
          {/* Left Status */}
          <div className="flex items-center gap-6 z-10">
            {isOffline ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500/80">
                <WifiOff className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t.voiceOffline}</span>
              </div>
            ) : (
              <button onClick={() => setIsContinuous(!isContinuous)} className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-semibold tracking-normal transition-all", isContinuous ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-white/30 border border-white/10")}>
                {isContinuous ? <Mic className="w-2.5 h-2.5" /> : <MicOff className="w-2.5 h-2.5" />}
                <span>{isContinuous ? "VOICE ON" : "VOICE OFF"}</span>
              </button>
            )}
            <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-medium hidden sm:flex">
              <Volume2 className="w-3 h-3" />
              <span>{isListening ? "15% (DUCKED)" : "100%"}</span>
            </div>
          </div>

          {/* Center Media Controls */}
          <div className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20 mt-1",
            isOffline ? "gap-10 md:gap-14" : "gap-6 md:gap-10"
          )}>
            <button 
              onClick={() => onSkip(-15)} 
              className={cn(
                "rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all active:scale-90",
                isOffline ? "w-14 h-14 md:w-16 md:h-16" : "w-10 h-10 md:w-12 md:h-12"
              )}
            >
              <RotateCcw className={cn("text-white/60", isOffline ? "w-6 h-6 md:w-7 md:h-7" : "w-4 h-4 md:w-5 md:h-5")} />
            </button>

            <button 
              onClick={onPlayPause} 
              className={cn(
                "rounded-full bg-white text-black shadow-xl flex items-center justify-center hover:bg-zinc-200 transition-all active:scale-95",
                isOffline ? "w-18 h-18 md:w-24 md:h-24" : "w-14 h-14 md:w-16 md:h-16"
              )}
            >
              {isPlaying ? (
                <Pause className={cn("fill-current", isOffline ? "w-8 h-8 md:w-10 md:h-10" : "w-6 h-6 md:w-8 md:h-8")} />
              ) : (
                <Play className={cn("fill-current ml-1", isOffline ? "w-8 h-8 md:w-10 md:h-10" : "w-6 h-6 md:w-8 md:h-8")} />
              )}
            </button>

            <button 
              onClick={() => onSkip(15)} 
              className={cn(
                "rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all active:scale-90",
                isOffline ? "w-14 h-14 md:w-16 md:h-16" : "w-10 h-10 md:w-12 md:h-12"
              )}
            >
              <RotateCw className={cn("text-white/60", isOffline ? "w-6 h-6 md:w-7 md:h-7" : "w-4 h-4 md:w-5 md:h-5")} />
            </button>

            {onNext && (
              <button 
                onClick={onNext} 
                className={cn(
                  "rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90",
                  isOffline ? "w-14 h-14 md:w-16 md:h-16" : "w-10 h-10 md:w-12 md:h-12"
                )}
              >
                <SkipForward className={cn("text-blue-400", isOffline ? "w-6 h-6 md:w-7 md:h-7" : "w-4 h-4 md:w-5 md:h-5")} />
              </button>
            )}
          </div>

          {/* Right Status */}
          <div className="flex items-center gap-6 z-10">
            <span className="text-red-500/40 text-[9px] font-bold tracking-[0.2em] animate-pulse uppercase hidden sm:block">
              {uiLanguage === "vi" ? "LÁI XE AN TOÀN" : "DRIVE SAFELY"}
            </span>
            <button className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors">
              <Archive className="w-3 h-3" />
              <span className="text-[10px] font-medium uppercase tracking-widest hidden sm:block">{t.savedTitle} ({savedBriefings.length})</span>
            </button>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {(isOffline || error) && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-24 left-4 right-4 md:left-10 md:right-10 z-[110]">
             <div className={cn("p-4 md:p-6 rounded-2xl border flex items-center gap-4 shadow-2xl backdrop-blur-xl", isQuotaLimit ? "bg-amber-950/90 border-amber-500/50" : "bg-red-950/90 border-red-500/50")}>
                <AlertTriangle className={cn("w-6 h-6 shrink-0", isQuotaLimit ? "text-amber-400" : "text-red-400")} />
                <div className="flex-1 min-w-0">
                   <h3 className="text-xs md:text-sm font-black uppercase tracking-widest leading-none">{isQuotaLimit ? "QUOTA LIMIT" : "SYSTEM ERROR"}</h3>
                   <p className="text-[10px] md:text-xs font-bold opacity-70 truncate">{error || (isOffline ? t.offlineWarning : "")}</p>
                </div>
                <button onClick={onRetryGeneration} className="shrink-0 px-4 py-2 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-lg hover:bg-zinc-200">
                  Retry
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
