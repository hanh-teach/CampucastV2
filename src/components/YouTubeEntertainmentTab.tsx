import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Music, 
  Flame, 
  User, 
  Video, 
  VideoOff, 
  Maximize2,
  Volume2,
  AlertCircle,
  Search,
  Sparkles,
  ChevronRight,
  Minimize2
} from 'lucide-react';
import { YouTubeVideo } from '../types';
import { cn } from '../lib/utils';

interface YouTubeEntertainmentTabProps {
  isDucked: boolean;
  onDuckingChange?: (isDucked: boolean) => void;
  uiLanguage: "vi" | "en";
  voiceSearchQuery?: string;
  onClearSearch?: () => void;
}

// Enhanced Mock Data including AI Suggestions
const MOCK_VIDEOS: YouTubeVideo[] = [
  {
    id: "hTWKbfoikeg",
    title: "Deep Focus Music - Lofi Hip Hop Mix",
    channelTitle: "Lofi Girl",
    thumbnailUrl: "https://i.ytimg.com/vi/hTWKbfoikeg/maxresdefault.jpg",
    duration: "24:00:00",
    viewCount: "500M",
    category: "Trending",
    isAudioFriendly: true
  },
  {
    id: "5qap5aO4i9A",
    title: "The Joe Rogan Experience - Elon Musk",
    channelTitle: "PowerfulJRE",
    thumbnailUrl: "https://i.ytimg.com/vi/5qap5aO4i9A/maxresdefault.jpg",
    duration: "2:30:15",
    viewCount: "25M",
    category: "New",
    isAudioFriendly: true
  },
  {
    id: "jfKfPfyJRdk",
    title: "lofi hip hop radio - beats to relax/study to",
    channelTitle: "Lofi Girl",
    thumbnailUrl: "https://i.ytimg.com/vi/jfKfPfyJRdk/maxresdefault.jpg",
    duration: "Live",
    viewCount: "1B",
    category: "For You",
    isAudioFriendly: true
  },
  {
    id: "7X8m3X_oZ0k",
    title: "Tech News Today: New Gemini Updates",
    channelTitle: "TechCrunch",
    thumbnailUrl: "https://i.ytimg.com/vi/7X8m3X_oZ0k/maxresdefault.jpg",
    duration: "12:45",
    viewCount: "100K",
    category: "AI Suggestions",
    isAudioFriendly: true
  },
  {
    id: "D0zYJ1RQ-jw",
    title: "Podcasts về xe điện và tương lai giao thông",
    channelTitle: "Xanh SM",
    thumbnailUrl: "https://i.ytimg.com/vi/D0zYJ1RQ-jw/maxresdefault.jpg",
    duration: "45:20",
    viewCount: "50K",
    category: "AI Suggestions",
    isAudioFriendly: true
  }
];

type CategoryType = "New" | "Trending" | "For You" | "AI Suggestions" | "Search Results";

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export const YouTubeEntertainmentTab: React.FC<YouTubeEntertainmentTabProps> = ({
  isDucked,
  onDuckingChange,
  uiLanguage,
  voiceSearchQuery,
  onClearSearch
}) => {
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(MOCK_VIDEOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isParkedMode, setIsParkedMode] = useState(false);
  const [category, setCategory] = useState<CategoryType>("Trending");
  const [searchStatus, setSearchStatus] = useState<string>("");

  const playerRef = React.useRef<any>(null);
  const isPlayerReadyRef = React.useRef<boolean>(false);
  const queuedVolumeRef = React.useRef<number | null>(null);
  const rampIntervalRef = React.useRef<any>(null);

  // Implement smooth volume ramp
  const rampVolume = useCallback((targetVolume: number) => {
    if (!playerRef.current || !isPlayerReadyRef.current) {
      queuedVolumeRef.current = targetVolume;
      return;
    }

    if (rampIntervalRef.current) {
      clearInterval(rampIntervalRef.current);
      rampIntervalRef.current = null;
    }

    try {
      if (typeof playerRef.current.getVolume !== 'function' || typeof playerRef.current.setVolume !== 'function') {
        return;
      }
      const startVolume = playerRef.current.getVolume();
      const duration = 200; // 200ms
      const stepTime = 20; // 20ms steps
      const totalSteps = duration / stepTime;
      const volumeDelta = (targetVolume - startVolume) / totalSteps;
      let currentStep = 0;

      rampIntervalRef.current = setInterval(() => {
        currentStep++;
        if (currentStep >= totalSteps) {
          if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
            playerRef.current.setVolume(targetVolume);
          }
          clearInterval(rampIntervalRef.current);
          rampIntervalRef.current = null;
        } else {
          const nextVolume = Math.round(startVolume + (volumeDelta * currentStep));
          if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
            playerRef.current.setVolume(nextVolume);
          }
        }
      }, stepTime);
    } catch (err) {
      console.warn("Volume ramp failed:", err);
      try {
        if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
          playerRef.current.setVolume(targetVolume);
        }
      } catch (e) {}
    }
  }, []);

  // Initialize YT Player
  const initPlayer = useCallback(() => {
    if (!currentVideo) return;
    if (playerRef.current) return;

    try {
      playerRef.current = new window.YT.Player('youtube-player-element', {
        height: '100%',
        width: '100%',
        videoId: currentVideo.id,
        playerVars: {
          autoplay: 1,
          mute: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          origin: typeof window !== 'undefined' && window.location ? window.location.origin : ""
        },
        events: {
          onReady: () => {
            isPlayerReadyRef.current = true;
            // Apply any queued volume adjustment
            if (queuedVolumeRef.current !== null) {
              const targetVol = queuedVolumeRef.current;
              queuedVolumeRef.current = null;
              rampVolume(targetVol);
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (
              event.data === window.YT.PlayerState.PAUSED ||
              event.data === window.YT.PlayerState.ENDED
            ) {
              setIsPlaying(false);
            }
          }
        }
      });
    } catch (e) {
      console.error("Failed to initialize YT Player:", e);
    }
  }, [currentVideo, rampVolume]);

  // Load YouTube API script & initialize
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      if (!document.getElementById('youtube-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        initPlayer();
      };

      const interval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          initPlayer();
          clearInterval(interval);
        }
      }, 500);

      return () => {
        clearInterval(interval);
      };
    }
  }, [initPlayer]);

  // Update video source when currentVideo changes
  useEffect(() => {
    if (currentVideo && playerRef.current && isPlayerReadyRef.current) {
      try {
        if (typeof playerRef.current.loadVideoById === 'function') {
          playerRef.current.loadVideoById({
            videoId: currentVideo.id,
            suggestedQuality: 'default'
          });
        }
      } catch (err) {
        console.error("Error loading video in YT player:", err);
      }
    }
  }, [currentVideo]);

  // Handle Ducking changes
  useEffect(() => {
    const targetVolume = isDucked ? 15 : 100;
    rampVolume(targetVolume);
    if (onDuckingChange) {
      onDuckingChange(isDucked);
    }
  }, [isDucked, onDuckingChange, rampVolume]);

  // Cleanup timers & player
  useEffect(() => {
    return () => {
      if (rampIntervalRef.current) {
        clearInterval(rampIntervalRef.current);
      }
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy();
          }
        } catch (e) {
          console.warn("Error destroying YT player:", e);
        }
        playerRef.current = null;
        isPlayerReadyRef.current = false;
      }
    };
  }, []);

  // Handle Voice Search
  useEffect(() => {
    if (voiceSearchQuery) {
      setSearchStatus(uiLanguage === "vi" ? `Đang tìm: "${voiceSearchQuery}"...` : `Searching for: "${voiceSearchQuery}"...`);
      setCategory("Search Results");
      
      // Simulate search delay
      const timer = setTimeout(() => {
        setSearchStatus("");
        if (onClearSearch) onClearSearch();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [voiceSearchQuery, uiLanguage, onClearSearch]);

  const playlist = useMemo(() => {
    const base = MOCK_VIDEOS.filter(v => (v.category === category || (category === "Search Results" && v.id === "jfKfPfyJRdk")) && v.isAudioFriendly);
    return base.length > 0 ? base : MOCK_VIDEOS.filter(v => v.category === "AI Suggestions");
  }, [category]);

  const toggleParkedMode = () => setIsParkedMode(!isParkedMode);

  return (
    <>
      {/* CỘT TRÁI - Khung hiển thị chính */}
      <div className="flex-[4] h-full flex flex-col items-center justify-center bg-zinc-900/50 rounded-2xl overflow-hidden relative p-4">
        <AnimatePresence mode="wait">
          {currentVideo && (
            <motion.div
              key={currentVideo.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="w-full h-full max-w-4xl flex flex-col items-center justify-center gap-4 md:gap-6"
            >
              {/* Voice Search Overlay */}
              {searchStatus && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-red-600 animate-ping" />
                  <span className="text-xl font-black text-red-500 animate-pulse uppercase tracking-[0.3em]">{searchStatus}</span>
                </div>
              )}

              {/* Media Container - Aspect Ratio Forced */}
              <div className="relative w-full aspect-video rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden bg-zinc-900 border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.6)]">
                
                {/* Audio-Only Mode (Driving Safety) */}
                <div className={cn(
                  "absolute inset-0 z-10 transition-opacity duration-700",
                  isParkedMode ? "opacity-0 pointer-events-none" : "opacity-100"
                )}>
                  <img 
                    src={currentVideo.thumbnailUrl} 
                    alt={currentVideo.title}
                    className="absolute inset-0 w-full h-full object-cover blur-[80px] opacity-30 scale-110"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-6">
                    <div className="space-y-2 max-w-2xl px-4">
                      <h2 className="text-xl md:text-2xl font-bold tracking-wide leading-tight line-clamp-2">
                        {currentVideo.title}
                      </h2>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">{currentVideo.channelTitle}</span>
                        <div className="w-1 h-1 rounded-full bg-red-500" />
                        <span className="text-[10px] text-zinc-500 font-mono">{currentVideo.viewCount} views</span>
                      </div>
                    </div>
                    
                    {/* Compact Visualizer */}
                    <div className="flex items-end gap-1 h-12 md:h-20">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: isPlaying ? [8, 60, 8] : 4 }}
                          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.04 }}
                          className="w-1 md:w-2 bg-red-600/60 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Video View (Persistent Mount) */}
                <div className={cn(
                  "absolute inset-0 z-0 transition-opacity duration-500 bg-black",
                  isParkedMode ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}>
                  <div id="youtube-player-element" className="w-full h-full" />
                </div>

                {/* Safety Toggle Overlay */}
                <button
                  onClick={toggleParkedMode}
                  className={cn(
                    "absolute bottom-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest backdrop-blur-md border transition-all",
                    isParkedMode ? "bg-green-600 border-green-400 text-white" : "bg-black/60 border-white/10 hover:bg-black/80"
                  )}
                >
                  {isParkedMode ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                  <span>{isParkedMode ? (uiLanguage === "vi" ? "ĐANG ĐỖ XE" : "PARKED") : (uiLanguage === "vi" ? "XEM VIDEO" : "VIEW VIDEO")}</span>
                </button>
              </div>

              {/* Stage Sub-Info */}
              <div className="flex items-center justify-between w-full px-4 text-[10px] font-medium uppercase tracking-widest text-white/30">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-red-500" />
                  <span>{uiLanguage === "vi" ? "DANH SÁCH AI LỰA CHỌN" : "AI CURATED STREAM"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <span className="text-white/10">NEXT:</span>
                   <span className="text-white/60 truncate max-w-[150px]">{playlist[(playlist.findIndex(v => v.id === currentVideo.id) + 1) % playlist.length]?.title}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CỘT PHẢI - Thanh danh mục dọc */}
      <div className="flex-[1] max-w-[200px] flex flex-col justify-start gap-3 pt-2">
        <div className="w-full text-center pb-2 text-white/30 text-xs font-semibold uppercase tracking-widest border-b border-white/10 mb-2">
          {uiLanguage === "vi" ? "DANH MỤC" : "CATEGORIES"}
        </div>
        {[
          { id: "Trending", icon: Music, label: uiLanguage === "vi" ? "🔥 HOT" : "🔥 HOT" },
          { id: "AI Suggestions", icon: Sparkles, label: uiLanguage === "vi" ? "✨ GỢI Ý AI" : "✨ AI PICKS" },
          { id: "New", icon: Flame, label: uiLanguage === "vi" ? "⏱️ MỚI" : "⏱️ NEW" },
          { id: "For You", icon: User, label: uiLanguage === "vi" ? "🎯 CHO BẠN" : "🎯 FOR YOU" }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setCategory(item.id as CategoryType)}
            className={cn(
              "flex items-center gap-2 w-full py-3 px-2 rounded-xl transition-all shrink-0 active:scale-95 border justify-center",
              category === item.id 
                ? "bg-red-600 border-red-500 shadow-lg scale-105" 
                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-sm font-semibold tracking-normal uppercase">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};

