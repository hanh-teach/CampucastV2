import React, { useEffect, useMemo } from 'react';
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
  AlertCircle,
  RotateCw,
  Sparkles,
  Heart
} from 'lucide-react';
import { CategoryType } from '../types';
import { cn } from '../lib/utils';
import { useYouTubeFeed } from '../hooks/useYouTubeFeed';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';
import { usePersonalization } from '../hooks/usePersonalization';
import { useYouTubeAuth } from '../hooks/useYouTubeAuth';

interface YouTubeEntertainmentTabProps {
  isDucked: boolean;
  onDuckingChange?: (isDucked: boolean) => void;
  uiLanguage: "vi" | "en";
  voiceSearchQuery?: string;
  onClearSearch?: () => void;
}

export const YouTubeEntertainmentTab = React.memo<YouTubeEntertainmentTabProps>(({
  isDucked,
  onDuckingChange,
  uiLanguage,
  voiceSearchQuery,
  onClearSearch
}) => {
  const [isParkedMode, setIsParkedMode] = React.useState(false);
  const [searchStatus, setSearchStatus] = React.useState<string>("");

  const {
    category,
    setCategory,
    activeSearchQuery,
    setActiveSearchQuery,
    videos,
    currentVideo,
    setCurrentVideo,
    isLoading,
    isFetchingMore,
    isOnline,
    handleManualRefresh,
    fetchVideos,
    loadMore,
    hasNextPage
  } = useYouTubeFeed("Trending");

  const { isAuthenticated, connectYouTube } = useYouTubeAuth(() => {
    fetchVideos(category, undefined, true);
  });

  const { isPlaying, handlePlayPause } = useYouTubePlayer(currentVideo, isDucked, onDuckingChange);
  
  const { handleToggleLike, isCurrentVideoLiked } = usePersonalization(currentVideo);

  // Handle Voice Search
  useEffect(() => {
    if (voiceSearchQuery) {
      setSearchStatus(uiLanguage === "vi" ? `Đang tìm: "${voiceSearchQuery}"...` : `Searching for: "${voiceSearchQuery}"...`);
      setActiveSearchQuery(voiceSearchQuery);
      setCategory("Search Results");
      
      const timer = setTimeout(() => {
        setSearchStatus("");
        if (onClearSearch) onClearSearch();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [voiceSearchQuery, uiLanguage, onClearSearch, setActiveSearchQuery, setCategory]);

  const playlist = useMemo(() => videos, [videos]);

  const toggleParkedMode = React.useCallback(() => setIsParkedMode(prev => !prev), []);

  const handleNextVideo = React.useCallback(() => {
    if (videos.length === 0 || !currentVideo) return;
    const currentIndex = videos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % videos.length;
    setCurrentVideo(videos[nextIndex]);
  }, [videos, currentVideo, setCurrentVideo]);

  const handlePrevVideo = React.useCallback(() => {
    if (videos.length === 0 || !currentVideo) return;
    const currentIndex = videos.findIndex(v => v.id === currentVideo.id);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
    setCurrentVideo(videos[prevIndex]);
  }, [videos, currentVideo, setCurrentVideo]);

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollWidth - target.scrollLeft <= target.clientWidth + 50) {
      loadMore();
    }
  }, [loadMore]);

  return (
    <>
      {/* CỘT TRÁI - Khung hiển thị chính */}
      <div className="flex-[4] h-full flex flex-col items-center justify-between bg-zinc-900/50 rounded-2xl overflow-hidden relative p-4 gap-4">
        
        {/* Connection Status Banner */}
        {!isOnline && (
          <div className="absolute top-4 left-4 right-4 z-30 bg-red-600/90 border border-red-500 text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-white" />
              <span className="text-xs font-bold tracking-wide uppercase">
                {uiLanguage === "vi" ? "Mất kết nối - Đang phát ngoại tuyến" : "Offline Mode - Playing Cached Content"}
              </span>
            </div>
            <span className="text-[10px] font-bold opacity-75 uppercase tracking-widest bg-black/25 px-2 py-0.5 rounded-md">
              Offline Cache
            </span>
          </div>
        )}

        {/* Loading Skeleton / Status Indicator */}
        {isLoading && videos.length === 0 && (
          <div className="absolute inset-0 z-20 bg-zinc-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                {uiLanguage === "vi" ? "Đang tải luồng giải trí..." : "Loading entertainment feed..."}
              </span>
            </div>
            <div className="w-full max-w-md h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-red-600"
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        )}

        {/* Empty State Layout */}
        {videos.length === 0 && !isLoading && (
          <div className="absolute inset-0 z-20 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center gap-4">
            <VideoOff className="w-14 h-14 text-zinc-600 animate-pulse" />
            <h3 className="text-lg font-bold text-zinc-300">
              {uiLanguage === "vi" ? "Không có video nào" : "No Videos Available"}
            </h3>
            <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
              {uiLanguage === "vi" 
                ? "Không thể tìm thấy video phù hợp trong mục này. Vui lòng thử lại hoặc tải lại." 
                : "We couldn't retrieve any videos for this category. Please try again or refresh."}
            </p>
            <button
              onClick={handleManualRefresh}
              className="mt-2 px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-95"
            >
              {uiLanguage === "vi" ? "Thử lại" : "Retry"}
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentVideo && (
            <motion.div
              key={currentVideo.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="w-full flex-1 flex flex-col items-center justify-between gap-3"
            >
              {/* Voice Search Overlay */}
              {searchStatus && (
                <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-red-600 animate-ping" />
                  <span className="text-xl font-black text-red-500 animate-pulse uppercase tracking-[0.3em]">{searchStatus}</span>
                </div>
              )}

              {/* Media Container - Aspect Ratio Forced */}
              <div className="relative w-full aspect-video rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-zinc-900 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                
                {/* Audio-Only Mode (Driving Safety Layout) */}
                <div className={cn(
                  "absolute inset-0 z-10 transition-opacity duration-700",
                  isParkedMode ? "opacity-0 pointer-events-none" : "opacity-100"
                )}>
                  <img 
                    src={currentVideo.thumbnailUrl} 
                    alt={currentVideo.title}
                    className="absolute inset-0 w-full h-full object-cover blur-[80px] opacity-30 scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-6">
                    <div className="space-y-2 max-w-2xl px-4">
                      <h2 className="text-lg md:text-xl font-bold tracking-wide leading-tight line-clamp-2 text-white">
                        {currentVideo.title}
                      </h2>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">{currentVideo.channelTitle}</span>
                        <div className="w-1 h-1 rounded-full bg-red-500" />
                        <span className="text-[10px] text-zinc-500 font-mono">{currentVideo.viewCount} views</span>
                      </div>
                    </div>
                    
                    {/* Compact Visualizer */}
                    <div className="flex items-end gap-1 h-12 md:h-16">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: isPlaying ? [8, 48, 8] : 4 }}
                          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.04 }}
                          className="w-1 md:w-1.5 bg-red-600/60 rounded-full"
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
                    "absolute bottom-4 right-4 z-20 flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest backdrop-blur-md border transition-all hover:scale-105 active:scale-95",
                    isParkedMode ? "bg-green-600 border-green-400 text-white" : "bg-black/60 border-white/10 hover:bg-black/80 text-white"
                  )}
                >
                  {isParkedMode ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                  <span>{isParkedMode ? (uiLanguage === "vi" ? "ĐANG ĐỖ XE" : "PARKED") : (uiLanguage === "vi" ? "XEM VIDEO" : "VIEW VIDEO")}</span>
                </button>
              </div>

              {/* Real tactile playback control deck with 44px+ touch targets */}
              <div className="flex items-center justify-between mt-1 bg-zinc-950/40 px-6 py-2 rounded-2xl border border-white/5 w-full max-w-lg shadow-inner shrink-0">
                <button
                  onClick={handlePrevVideo}
                  disabled={videos.length <= 1}
                  className="p-3.5 rounded-full hover:bg-white/5 text-white/70 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-90 h-11 w-11 flex items-center justify-center animate-none"
                  title="Previous Video"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={handlePlayPause}
                  className="p-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_6px_15px_rgba(220,38,38,0.3)] transition-all hover:scale-105 active:scale-95 h-13 w-13 flex items-center justify-center"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-5.5 h-5.5 fill-current" /> : <Play className="w-5.5 h-5.5 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={handleNextVideo}
                  disabled={videos.length <= 1}
                  className="p-3.5 rounded-full hover:bg-white/5 text-white/70 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-90 h-11 w-11 flex items-center justify-center animate-none"
                  title="Next Video"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                {/* Tactile Heart (Like/Save) Button for Personalization */}
                <button
                  onClick={handleToggleLike}
                  className={cn(
                    "p-3.5 rounded-full transition-all active:scale-90 h-11 w-11 flex items-center justify-center",
                    isCurrentVideoLiked ? "text-red-500 bg-red-500/10" : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                  title={isCurrentVideoLiked ? "Unlike video" : "Like video"}
                >
                  <Heart className={cn("w-5 h-5", isCurrentVideoLiked && "fill-current")} />
                </button>
              </div>

              {/* Tactile Scrolling Playlist Strip */}
              {videos.length > 0 && (
                <div className="w-full px-2 shrink-0">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                      {uiLanguage === "vi" ? "DANH SÁCH BÀI HÁT / TIN TỨC" : "PLAYLIST STREAM"} ({videos.length})
                    </span>
                  </div>
                  <div 
                    className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x"
                    onScroll={handleScroll}
                  >
                    {videos.map((vid) => {
                      const isSelected = currentVideo?.id === vid.id;
                      return (
                        <button
                          key={vid.id}
                          onClick={() => setCurrentVideo(vid)}
                          className={cn(
                            "flex gap-2.5 p-2 rounded-xl border text-left shrink-0 w-56 snap-start transition-all active:scale-95",
                            isSelected 
                              ? "bg-red-600/15 border-red-500/40" 
                              : "bg-zinc-900/30 border-white/5 hover:bg-zinc-800/30"
                          )}
                        >
                          <img 
                            src={vid.thumbnailUrl} 
                            alt={vid.title} 
                            className="w-14 aspect-video rounded-lg object-cover bg-zinc-850 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className={cn(
                              "text-[11px] font-bold truncate text-white",
                              isSelected ? "text-red-500 font-black" : "text-zinc-200"
                            )}>
                              {vid.title}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <p className="text-[9px] text-zinc-400 truncate">
                                {vid.channelTitle}
                              </p>
                              {vid.personalFeedCategory && (
                                <span className="text-[8px] px-1 py-0.5 bg-red-500/20 text-red-400 rounded-sm truncate">
                                  {vid.personalFeedCategory}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sub-Info showing dynamic current states */}
              <div className="flex items-center justify-between w-full px-2 text-[9px] font-medium uppercase tracking-widest text-white/20 shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-red-500" />
                  <span>{uiLanguage === "vi" ? "DANH SÁCH AI LỰA CHỌN" : "AI CURATED STREAM"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <span className="text-white/10">NEXT:</span>
                   <span className="text-white/60 truncate max-w-[120px]">
                     {playlist[(playlist.findIndex(v => v.id === currentVideo.id) + 1) % playlist.length]?.title || "..."}
                   </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CỘT PHẢI - Thanh danh mục dọc */}
      <div className="flex-[1] max-w-[200px] flex flex-col justify-start gap-3 pt-2">
        {!isAuthenticated && (
          <button onClick={connectYouTube} className="w-full text-center py-2.5 bg-red-600 rounded-lg text-white font-bold text-xs mb-2 hover:bg-red-700 active:scale-95 transition-all">
            {uiLanguage === "vi" ? "KẾT NỐI YOUTUBE" : "CONNECT YOUTUBE"}
          </button>
        )}
        
        {/* Category Header with Integrated manual Refresh Action */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-white/10 mb-1 px-1">
          <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">
            {uiLanguage === "vi" ? "DANH MỤC" : "CATEGORIES"}
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/5 active:scale-90 transition-all disabled:opacity-30"
            title={uiLanguage === "vi" ? "Tải lại dữ liệu" : "Refresh data"}
          >
            <RotateCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-red-500")} />
          </button>
        </div>

        {[
          { id: "Trending", icon: Music, label: uiLanguage === "vi" ? "🔥 HOT" : "🔥 HOT" },
          { id: "AI Suggestions", icon: Sparkles, label: uiLanguage === "vi" ? "✨ GỢI Ý AI" : "✨ AI PICKS" },
          { id: "New", icon: Flame, label: uiLanguage === "vi" ? "⏱️ MỚI" : "⏱️ NEW" },
          { id: "For You", icon: User, label: uiLanguage === "vi" ? "🎯 CÁ NHÂN" : "🎯 PERSONAL" }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setCategory(item.id as CategoryType)}
            className={cn(
              "flex items-center gap-2 w-full py-3 px-2 rounded-xl transition-all shrink-0 active:scale-95 border justify-center",
              category === item.id 
                ? "bg-red-600 border-red-500 shadow-lg scale-105 text-white" 
                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold tracking-normal uppercase">{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
});

YouTubeEntertainmentTab.displayName = "YouTubeEntertainmentTab";
