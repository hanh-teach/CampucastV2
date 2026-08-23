// src/features/queue/SmartQueue.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ListMusic, 
  Sparkles, 
  Check, 
  ListX,
  Shuffle,
  Repeat,
  Moon,
  Heart,
  History,
  Car,
  ChevronDown,
  Clock
} from "lucide-react";
import { 
  getPlayQueue, 
  savePlayQueue, 
  removeFromQueue, 
  featureStoreEvents,
  getPlaybackHistory,
  clearPlaybackHistory,
  getFavoriteIds,
  toggleFavoriteId,
  getRepeatMode,
  setRepeatMode,
  getAutoContinue,
  setAutoContinue,
  addToQueue
} from "../store";
import { QueueItem } from "../types";
import { getAllBriefings, incrementBriefingLikes } from "../../services/storageService";
import { useUserPreferences } from "../../components/UserPreferencesProvider";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { cn } from "../../lib/utils";
import { colors } from "../../foundation/tokens/colors";

interface SmartQueueProps {
  onSelectItem: (item: any) => void;
  activeItemId?: string;
  uiLanguage?: "vi" | "en";
}

export function SmartQueue({ onSelectItem, activeItemId, uiLanguage = "vi" }: SmartQueueProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [historyList, setHistoryList] = useState<QueueItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [allBriefings, setAllBriefings] = useState<any[]>([]);
  
  const [repeatMode, setRepeatModeState] = useState<"off" | "all" | "one">("off");
  const [autoContinue, setAutoContinueState] = useState<boolean>(true);
  
  const [showSleepTimerMenu, setShowSleepTimerMenu] = useState(false);
  const [sleepSecondsLeft, setSleepSecondsLeft] = useState<number | null>(null);
  const [sleepAtBriefingEnd, setSleepAtBriefingEnd] = useState(false);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const { updateDrivingMode } = useUserPreferences();

  // Load all data
  const refreshAll = async () => {
    setQueue(getPlayQueue());
    setHistoryList(getPlaybackHistory());
    setFavoriteIds(getFavoriteIds());
    setRepeatModeState(getRepeatMode());
    setAutoContinueState(getAutoContinue());
    setSleepAtBriefingEnd(localStorage.getItem("cc_sleep_at_briefing_end") === "true");
    
    try {
      const data = await getAllBriefings(false);
      setAllBriefings(data);
    } catch (e) {
      console.warn("Failed to fetch briefings list:", e);
    }
  };

  useEffect(() => {
    refreshAll();
    featureStoreEvents.addEventListener("change", refreshAll);
    return () => {
      featureStoreEvents.removeEventListener("change", refreshAll);
    };
  }, []);

  // Sleep Timer Countdown ticking
  useEffect(() => {
    const savedLeft = localStorage.getItem("cc_sleep_seconds_left");
    if (savedLeft) {
      setSleepSecondsLeft(Number(savedLeft));
    }

    const interval = setInterval(() => {
      const leftStr = localStorage.getItem("cc_sleep_seconds_left");
      const sleepAtEnd = localStorage.getItem("cc_sleep_at_briefing_end") === "true";
      setSleepAtBriefingEnd(sleepAtEnd);

      if (leftStr) {
        const left = Number(leftStr);
        if (left > 0) {
          const newLeft = left - 1;
          setSleepSecondsLeft(newLeft);
          localStorage.setItem("cc_sleep_seconds_left", String(newLeft));
          if (newLeft === 0) {
            window.dispatchEvent(new CustomEvent("commutecast-pause"));
            localStorage.removeItem("cc_sleep_seconds_left");
            setSleepSecondsLeft(null);
            showToast(uiLanguage === "vi" ? "Đã tạm dừng theo hẹn giờ ngủ" : "Sleep timer ended. Playback paused.");
          }
        } else {
          setSleepSecondsLeft(null);
          localStorage.removeItem("cc_sleep_seconds_left");
        }
      } else {
        setSleepSecondsLeft(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [uiLanguage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Reordering
  const moveItem = (index: number, direction: "up" | "down" | "top" | "bottom") => {
    if (queue.length <= 1) return;
    const updated = [...queue];
    const item = updated[index];
    
    if (direction === "up") {
      if (index === 0) return;
      updated.splice(index, 1);
      updated.splice(index - 1, 0, item);
    } else if (direction === "down") {
      if (index === queue.length - 1) return;
      updated.splice(index, 1);
      updated.splice(index + 1, 0, item);
    } else if (direction === "top") {
      if (index === 0) return;
      updated.splice(index, 1);
      updated.unshift(item);
    } else if (direction === "bottom") {
      if (index === queue.length - 1) return;
      updated.splice(index, 1);
      updated.push(item);
    }
    
    savePlayQueue(updated);
    showToast(uiLanguage === "vi" ? "Đã cập nhật thứ tự phát" : "Playback queue reordered");
  };

  const handleClearQueue = () => {
    savePlayQueue([]);
    showToast(uiLanguage === "vi" ? "Đã xóa sạch hàng đợi tiếp theo" : "Next up queue cleared");
  };

  const handleClearHistory = () => {
    clearPlaybackHistory();
    showToast(uiLanguage === "vi" ? "Đã xóa lịch sử phát" : "Playback history cleared");
  };

  const handleShuffle = () => {
    if (queue.length <= 1) {
      showToast(uiLanguage === "vi" ? "Cần ít nhất 2 bản tin để ngẫu nhiên hóa" : "Need at least 2 items to shuffle");
      return;
    }
    const shuffled = [...queue].sort(() => Math.random() - 0.5);
    savePlayQueue(shuffled);
    showToast(uiLanguage === "vi" ? "Đã xáo trộn thứ tự phát" : "Queue shuffled successfully!");
  };

  const handleToggleRepeat = () => {
    let nextMode: "off" | "all" | "one" = "off";
    if (repeatMode === "off") nextMode = "all";
    else if (repeatMode === "all") nextMode = "one";
    
    setRepeatMode(nextMode);
    showToast(
      nextMode === "off" 
        ? (uiLanguage === "vi" ? "Tắt lặp lại" : "Repeat mode off") 
        : nextMode === "all" 
          ? (uiLanguage === "vi" ? "Lặp lại tất cả" : "Repeat all items") 
          : (uiLanguage === "vi" ? "Lặp lại 1 bài" : "Repeat current item")
    );
  };

  const handleToggleAutoContinue = () => {
    const nextVal = !autoContinue;
    setAutoContinue(nextVal);
    showToast(
      nextVal 
        ? (uiLanguage === "vi" ? "Bật tự động phát tiếp" : "Auto-continue enabled") 
        : (uiLanguage === "vi" ? "Tắt tự động phát tiếp" : "Auto-continue disabled")
    );
  };

  const handleSleepTimerSelect = (mins: number | "end" | "off") => {
    if (mins === "off") {
      localStorage.removeItem("cc_sleep_seconds_left");
      localStorage.removeItem("cc_sleep_at_briefing_end");
      setSleepSecondsLeft(null);
      setSleepAtBriefingEnd(false);
      showToast(uiLanguage === "vi" ? "Đã tắt hẹn giờ ngủ" : "Sleep timer turned off");
    } else if (mins === "end") {
      localStorage.removeItem("cc_sleep_seconds_left");
      localStorage.setItem("cc_sleep_at_briefing_end", "true");
      setSleepSecondsLeft(null);
      setSleepAtBriefingEnd(true);
      showToast(uiLanguage === "vi" ? "Sẽ tắt sau khi hết bản tin hiện tại" : "Will pause after current briefing");
    } else {
      const seconds = mins * 60;
      localStorage.setItem("cc_sleep_seconds_left", String(seconds));
      localStorage.removeItem("cc_sleep_at_briefing_end");
      setSleepSecondsLeft(seconds);
      setSleepAtBriefingEnd(false);
      showToast(uiLanguage === "vi" ? `Sẽ tắt sau ${mins} phút` : `Timer set for ${mins} minutes`);
    }
    setShowSleepTimerMenu(false);
  };

  const handleToggleFavorite = async (item: any) => {
    toggleFavoriteId(item.id);
    await incrementBriefingLikes(item.id);
    refreshAll();
  };

  const formatItemDuration = (item: QueueItem) => {
    if (item.duration) {
      const mins = Math.floor(item.duration / 60);
      const secs = Math.floor(item.duration % 60);
      return `${mins}m ${secs}s`;
    }
    
    // Fallback estimate
    if (item.payload?.chapters) {
      const totalChars = item.payload.chapters.reduce((a: number, b: any) => a + (b.scriptText?.length || 0), 0);
      const estSecs = Math.round(totalChars * 0.08) + 120;
      const mins = Math.floor(estSecs / 60);
      const secs = Math.floor(estSecs % 60);
      return `${mins}m ${secs}s`;
    }
    return "2m";
  };

  const formatTimerLabel = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Get current active briefing item from saved library
  const currentPlayingItem = allBriefings.find(b => b.id === activeItemId);

  // Sum next queue estimated time
  const calculateTotalQueueDuration = () => {
    let totalSecs = 0;
    queue.forEach(item => {
      if (item.duration) {
        totalSecs += item.duration;
      } else if (item.payload?.chapters) {
        const totalChars = item.payload.chapters.reduce((a: number, b: any) => a + (b.scriptText?.length || 0), 0);
        totalSecs += Math.round(totalChars * 0.08) + 120;
      } else {
        totalSecs += 120;
      }
    });
    
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  // Filter list of favorited briefings
  const favoriteBriefings = allBriefings.filter(b => favoriteIds.includes(b.id) || (b.likeCount && b.likeCount > 0));

  const t = {
    vi: {
      nowPlaying: "Đang Phát",
      nextUp: "Tiếp Theo",
      history: "Lịch Sử",
      favorites: "Yêu Thích",
      emptyQueue: "Hàng đợi đang trống",
      noHistory: "Chưa có lịch sử nghe",
      noFavorites: "Chưa có bản tin yêu thích nào",
      clearAll: "Xóa hết",
      shuffle: "Trộn bài",
      repeat: "Lặp lại",
      autoContinue: "Tự động tiếp tục",
      sleepTimer: "Hẹn giờ ngủ",
      drivingMode: "Chế độ lái xe",
      totalTime: "Tổng thời gian còn lại",
      addToQueue: "Thêm vào hàng đợi",
      playImmediately: "Phát ngay"
    },
    en: {
      nowPlaying: "Now Playing",
      nextUp: "Next up",
      history: "History",
      favorites: "Favorites",
      emptyQueue: "Playback queue is empty",
      noHistory: "No playback history",
      noFavorites: "No favorited briefings",
      clearAll: "Clear all",
      shuffle: "Shuffle",
      repeat: "Repeat",
      autoContinue: "Auto Continue",
      sleepTimer: "Sleep Timer",
      drivingMode: "Driving Mode",
      totalTime: "Estimated remaining time",
      addToQueue: "Add to queue",
      playImmediately: "Play now"
    }
  }[uiLanguage];

  return (
    <Card className="p-6 flex flex-col text-left gap-8 relative overflow-visible transition-colors" 
          id="spotify-queue-container"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      
      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2"
            style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Control Toolbar */}
      <div className="p-3 rounded-app-2xl border flex flex-wrap items-center justify-between gap-4 transition-colors"
           style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShuffle}
            disabled={queue.length <= 1}
            className={cn(
              "h-10 w-10 p-0 transition-colors"
            )}
            style={queue.length <= 1 
              ? { opacity: 0.3, color: colors.textMuted } 
              : { color: colors.textMuted }}
            title={t.shuffle}
          >
            <Shuffle className="w-4 h-4" />
          </Button>

          <Button
            variant={repeatMode !== "off" ? "primary" : "ghost"}
            size="sm"
            onClick={handleToggleRepeat}
            className={cn(
              "h-10 w-10 p-0 relative transition-all"
            )}
            style={repeatMode !== "off" 
              ? { backgroundColor: colors.interactive, color: colors.onAccent } 
              : { color: colors.textMuted }}
            title={`${t.repeat}: ${repeatMode}`}
          >
            <Repeat className="w-4 h-4" />
            {repeatMode === "one" && (
              <span className="absolute top-1 right-1 text-[8px] font-black px-1 rounded-full border"
                    style={{ backgroundColor: colors.surface, color: colors.interactive, borderColor: colors.interactive }}>1</span>
            )}
          </Button>

          <Button
            variant={autoContinue ? "primary" : "ghost"}
            size="sm"
            onClick={handleToggleAutoContinue}
            className={cn(
              "h-10 w-10 p-0 transition-all"
            )}
            style={autoContinue 
              ? { backgroundColor: colors.interactive, color: colors.onAccent } 
              : { color: colors.textMuted }}
            title={t.autoContinue}
          >
            <Play className={cn("w-4 h-4", autoContinue && "fill-current")} />
          </Button>
        </div>

        <div className="flex items-center gap-2 relative">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSleepTimerMenu(!showSleepTimerMenu)}
              className={cn(
                "h-10 flex items-center gap-2 px-3 text-[10px] font-black uppercase tracking-wider transition-all"
              )}
              style={(sleepSecondsLeft !== null || sleepAtBriefingEnd) 
                ? { backgroundColor: `${colors.interactive}1a`, borderColor: colors.interactive, color: colors.interactive } 
                : { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textMuted }}
            >
              <Moon className="w-3.5 h-3.5" />
              {sleepSecondsLeft !== null ? (
                <span className="font-mono">{formatTimerLabel(sleepSecondsLeft)}</span>
              ) : sleepAtBriefingEnd ? (
                <span>{uiLanguage === "vi" ? "Hết bài" : "End"}</span>
              ) : (
                <span className="hidden sm:inline">{t.sleepTimer}</span>
              )}
              <ChevronDown className="w-3 h-3 opacity-60 ml-1" />
            </Button>

            {showSleepTimerMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-48 border rounded-app-xl shadow-2xl z-[100] py-2 animate-in fade-in slide-in-from-bottom-2 text-[10px] font-black uppercase tracking-wider"
                   style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                {[5, 15, 30, 45, 60].map((m) => (
                  <button 
                    key={m}
                    onClick={() => handleSleepTimerSelect(m)} 
                    className="w-full text-left px-4 py-3 flex justify-between items-center transition-colors font-black"
                    style={{ color: colors.textPrimary, minHeight: "44px" }}
                  >
                    <span>{m} {uiLanguage === "vi" ? "phút" : "minutes"}</span>
                  </button>
                ))}
                <button 
                  onClick={() => handleSleepTimerSelect("end")} 
                  className="w-full text-left px-4 py-3 flex items-center gap-2 transition-colors border-t mt-1"
                  style={{ color: colors.interactive, borderColor: colors.border, minHeight: "44px" }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{uiLanguage === "vi" ? "Hết bản tin" : "End of briefing"}</span>
                </button>
                <button 
                  onClick={() => handleSleepTimerSelect("off")} 
                  className="w-full text-left px-4 py-3 border-t transition-colors font-black"
                  style={{ color: colors.critical, borderColor: colors.border, minHeight: "44px" }}
                >
                  <span>{uiLanguage === "vi" ? "Tắt hẹn giờ" : "Turn off timer"}</span>
                </button>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => updateDrivingMode(true)}
            className="h-10 px-4 text-[10px] font-black uppercase tracking-widest gap-2"
            style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
          >
            <Car className="w-4 h-4" />
            <span className="hidden sm:inline">{t.drivingMode}</span>
          </Button>
        </div>
      </div>

      {/* SECTION 1: Now Playing */}
      <div className="space-y-3">
        <div className="flex items-center gap-2" style={{ color: colors.textMuted }}>
          <Play className="w-3 h-3 fill-current" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">{t.nowPlaying}</h4>
        </div>
        
        {currentPlayingItem ? (
          <Card className="p-4 flex items-center justify-between gap-4 group transition-colors"
                style={{ backgroundColor: `${colors.interactive}0d`, borderColor: `${colors.interactive}33` }}>
            <div className="flex items-center gap-4 overflow-hidden flex-1">
              <div className="w-12 h-12 rounded-app-xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform"
                   style={{ backgroundColor: colors.interactive, color: colors.onAccent }}>
                <ListMusic className="w-6 h-6 animate-pulse" />
              </div>
              <div className="overflow-hidden space-y-1">
                <p className="font-black text-sm truncate uppercase tracking-tight" style={{ color: colors.textPrimary }}>
                  {currentPlayingItem.payload?.title || (uiLanguage === "vi" ? "Bản tin hành trình" : "Commute Podcast")}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                  <span className="truncate">{currentPlayingItem.preferences?.locationName || "CommuteCast"}</span>
                  <span className="opacity-30">•</span>
                  <span className="font-mono" style={{ color: colors.interactive }}>
                    {currentPlayingItem.payload?.chapters ? `${currentPlayingItem.payload.chapters.length} chaps` : ""}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToggleFavorite(currentPlayingItem)}
              className={cn(
                "h-10 w-10 transition-colors"
              )}
              style={(favoriteIds.includes(currentPlayingItem.id) || currentPlayingItem.likeCount > 0)
                ? { color: colors.critical }
                : { color: colors.textMuted }}
            >
              <Heart className={cn("w-5 h-5", (favoriteIds.includes(currentPlayingItem.id) || currentPlayingItem.likeCount > 0) && "fill-current")} />
            </Button>
          </Card>
        ) : (
          <div className="p-8 rounded-app-2xl border border-dashed text-center"
               style={{ backgroundColor: `${colors.surfaceOverlay}4d`, borderColor: colors.border }}>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>
              {uiLanguage === "vi" ? "Chưa có bản tin nào đang phát" : "No active briefing currently playing"}
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: Next Up */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ color: colors.textMuted }}>
            <ListMusic className="w-4 h-4" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">{t.nextUp}</h4>
            {queue.length > 0 && (
              <Badge className="font-mono text-[9px] ml-1"
                     style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border, color: colors.textMuted }}>
                {queue.length} • {calculateTotalQueueDuration()}
              </Badge>
            )}
          </div>
          
          {queue.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearQueue}
              className="h-8 px-2 text-[10px] font-black uppercase tracking-widest gap-1.5 transition-colors"
              style={{ color: colors.critical }}
            >
              <ListX className="w-3.5 h-3.5" />
              <span>{t.clearAll}</span>
            </Button>
          )}
        </div>

        {queue.length === 0 ? (
          <div className="p-10 text-center border border-dashed rounded-app-2xl"
               style={{ borderColor: colors.border }}>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>{t.emptyQueue}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            <AnimatePresence initial={false}>
              {queue.map((item, index) => {
                const isFavorite = favoriteIds.includes(item.id);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    layout
                  >
                    <Card className="p-3 flex items-center justify-between gap-4 group transition-all"
                          style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => onSelectItem(item)}
                          className="h-10 w-10 shrink-0 transition-colors"
                          style={{ backgroundColor: colors.surfaceOverlay, color: colors.textPrimary }}
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </Button>
                        
                        <div className="overflow-hidden space-y-0.5">
                          <p className="font-black text-xs truncate uppercase tracking-tight transition-colors"
                             style={{ color: colors.textPrimary }}>
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                            <span className="truncate">{item.subtitle}</span>
                            <span className="opacity-30">•</span>
                            <span className="font-mono">{formatItemDuration(item)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleFavorite(item)}
                          className={cn(
                            "h-8 w-8 transition-colors"
                          )}
                          style={isFavorite ? { color: colors.critical, backgroundColor: `${colors.critical}1a` } : { color: colors.textMuted }}
                        >
                          <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-current")} />
                        </Button>

                        <div className="flex flex-col gap-0.5 mx-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={index === 0}
                            onClick={() => moveItem(index, "up")}
                            className="h-6 w-6 p-0 disabled:opacity-20 transition-colors"
                            style={{ color: colors.textMuted }}
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={index === queue.length - 1}
                            onClick={() => moveItem(index, "down")}
                            className="h-6 w-6 p-0 disabled:opacity-20 transition-colors"
                            style={{ color: colors.textMuted }}
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromQueue(item.id)}
                          className="h-8 w-8 transition-colors"
                          style={{ color: colors.critical }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* SECTION 3: Playback History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ color: colors.textMuted }}>
            <History className="w-4 h-4" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">{t.history}</h4>
          </div>
          
          {historyList.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="h-8 px-2 text-[10px] font-black uppercase tracking-widest gap-1.5 transition-colors"
              style={{ color: colors.critical }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.clearAll}</span>
            </Button>
          )}
        </div>

        {historyList.length === 0 ? (
          <div className="p-8 text-center rounded-app-2xl border transition-colors"
               style={{ backgroundColor: `${colors.surfaceOverlay}4d`, borderColor: colors.border }}>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>{t.noHistory}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
            {historyList.map((item) => {
              const isFavorite = favoriteIds.includes(item.id);
              return (
                <div 
                  key={item.id} 
                  className="p-3 border rounded-app-xl flex items-center justify-between gap-4 transition-colors group"
                  style={{ backgroundColor: `${colors.surfaceOverlay}80`, borderColor: colors.border }}
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => onSelectItem(item)}
                      className="h-8 w-8 shrink-0 transition-colors"
                      style={{ backgroundColor: colors.surface, color: colors.textPrimary }}
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </Button>
                    <div className="overflow-hidden space-y-0.5">
                      <p className="font-black text-[11px] truncate uppercase tracking-tight transition-colors"
                         style={{ color: colors.textPrimary }}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                        <span className="truncate">{item.subtitle}</span>
                        <span className="opacity-30">•</span>
                        <span className="font-mono">{formatItemDuration(item)}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleFavorite(item)}
                    className={cn(
                      "h-8 w-8 transition-colors"
                    )}
                    style={isFavorite ? { color: colors.critical, backgroundColor: `${colors.critical}1a` } : { color: colors.textMuted }}
                  >
                    <Heart className={cn("w-3.5 h-3.5", isFavorite && "fill-current")} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 4: Favorites */}
      <div className="space-y-4">
        <div className="flex items-center gap-2" style={{ color: colors.textMuted }}>
          <Heart className="w-4 fill-current" style={{ color: colors.critical }} />
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">{t.favorites}</h4>
          {favoriteBriefings.length > 0 && (
            <Badge className="font-mono text-[9px] h-4 min-w-4 p-0 flex items-center justify-center rounded-full ml-1"
                   style={{ backgroundColor: colors.interactive, color: colors.onAccent }}>
              {favoriteBriefings.length}
            </Badge>
          )}
        </div>

        {favoriteBriefings.length === 0 ? (
          <div className="p-8 text-center rounded-app-2xl border transition-colors"
               style={{ backgroundColor: `${colors.surfaceOverlay}4d`, borderColor: colors.border }}>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>{t.noFavorites}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
            {favoriteBriefings.map((item) => {
              const queueItem: QueueItem = {
                id: item.id,
                title: item.payload?.title || "Briefing",
                subtitle: item.preferences?.locationName || "CommuteCast",
                type: "custom",
                payload: item.payload
              };
              
              const isInQueue = queue.some(q => q.id === item.id);

              return (
                <div 
                  key={item.id} 
                  className="p-3 border rounded-app-xl flex items-center justify-between gap-4 transition-colors group"
                  style={{ backgroundColor: `${colors.surfaceOverlay}80`, borderColor: colors.border }}
                >
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => onSelectItem(item)}
                      className="h-8 w-8 shrink-0 transition-colors"
                      style={{ backgroundColor: colors.surface, color: colors.textPrimary }}
                      title={t.playImmediately}
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </Button>
                    <div className="overflow-hidden space-y-0.5">
                      <p className="font-black text-[11px] truncate uppercase tracking-tight transition-colors"
                         style={{ color: colors.textPrimary }}>
                        {item.payload?.title || "Untitled Briefing"}
                      </p>
                      <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>
                        <span className="truncate">{item.preferences?.locationName || "CommuteCast"}</span>
                        <span className="opacity-30">•</span>
                        <span className="font-mono">{formatItemDuration(queueItem)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant={isInQueue ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => {
                        addToQueue(queueItem);
                        showToast(uiLanguage === "vi" ? "Đã thêm vào hàng đợi" : "Added to queue");
                      }}
                      disabled={isInQueue}
                      className="h-8 px-3 text-[9px] font-black uppercase tracking-widest gap-1 transition-all"
                      style={isInQueue 
                        ? { backgroundColor: colors.interactive, color: colors.onAccent } 
                        : { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }}
                    >
                      {isInQueue ? <Check className="w-3 h-3" /> : t.addToQueue}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFavorite(item)}
                      className="h-8 w-8 transition-colors"
                      style={{ color: colors.critical }}
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </Card>
  );
}
