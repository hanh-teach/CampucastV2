import { useState, useCallback, useEffect, useRef } from 'react';
import { YouTubeVideo, CategoryType } from '../types';
import { FeedOrchestrator } from '../services/feedOrchestrator';

export function useYouTubeFeed(initialCategory: CategoryType = "Trending") {
  const [category, setCategory] = useState<CategoryType>(initialCategory);
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>("");
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  
  const lastFetchTime = useRef(Date.now());

  // Sync online/offline status & reconnect refresh
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Smart refresh on reconnect
      if (Date.now() - lastFetchTime.current > 60000) {
        smartRefresh();
      }
    };
    const handleOffline = () => setIsOnline(false);
    
    // Smart refresh on app resume (foreground)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFetchTime.current > 300000) { // 5 mins
        smartRefresh();
      }
    };
    
    const hasWindow = typeof window !== 'undefined';
    if (hasWindow && typeof window.addEventListener === 'function') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    return () => {
      if (hasWindow && typeof window.removeEventListener === 'function') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [category, activeSearchQuery]);

  const fetchVideos = useCallback(async (cat: CategoryType, query?: string, forceRefresh = false, token?: string) => {
    if (videos.length === 0 && !token) {
      setIsLoading(true);
    } else if (token) {
      setIsFetchingMore(true);
    }

    try {
      const isDrivingMode = true; // Default driving context constraint
      const fetched = await FeedOrchestrator.getFeed(cat, {
        query,
        forceRefresh,
        isDrivingMode,
        pageToken: token
      });

      lastFetchTime.current = Date.now();

      if (token) {
         setVideos(prev => {
            const newIds = new Set(fetched.videos.map(v => v.id));
            const prevFiltered = prev.filter(v => !newIds.has(v.id));
            return [...prevFiltered, ...fetched.videos];
         });
      } else if (forceRefresh && videos.length > 0) {
         // Background / Smart Update: only prepend new items, don't reset whole list
         setVideos(prev => {
            const existingIds = new Set(prev.map(v => v.id));
            const newItems = fetched.videos.filter(v => !existingIds.has(v.id));
            return [...newItems, ...prev];
         });
      } else {
         setVideos(fetched.videos);
      }
      
      setNextPageToken(fetched.nextPageToken);

      // Auto-play/select first item if current video is invalid or from previous category
      if (fetched.videos.length > 0 && !token && (!currentVideo || !fetched.videos.some(v => v.id === currentVideo?.id))) {
        setCurrentVideo(fetched.videos[0]);
      }
    } catch (err) {
      console.error("[YouTubeFeed] Error loading feed:", err);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [currentVideo, videos.length]);

  const smartRefresh = useCallback(() => {
    fetchVideos(category, category === "Search Results" ? activeSearchQuery : undefined, true);
  }, [category, activeSearchQuery, fetchVideos]);

  // Handle Tab Switch / initial load
  useEffect(() => {
    fetchVideos(category, category === "Search Results" ? activeSearchQuery : undefined);
  }, [category, activeSearchQuery, fetchVideos]);

  // Periodic automatic refresh every 10 minutes
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (isOnline && !isLoading) {
        console.log(`[YouTube] Background automatic poll refresh for: ${category}`);
        smartRefresh();
      }
    }, 600000); // 10 minutes

    return () => clearInterval(pollInterval);
  }, [category, activeSearchQuery, isLoading, isOnline, smartRefresh]);

  const handleManualRefresh = useCallback(() => {
    smartRefresh();
  }, [smartRefresh]);

  const loadMore = useCallback(() => {
    if (nextPageToken && !isLoading && !isFetchingMore) {
      fetchVideos(category, category === "Search Results" ? activeSearchQuery : undefined, false, nextPageToken);
    }
  }, [nextPageToken, isLoading, isFetchingMore, category, activeSearchQuery, fetchVideos]);

  return {
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
    hasNextPage: !!nextPageToken
  };
}
