import { YouTubeVideo, FeedResponse } from "../types";

const LOCAL_CACHE_PREFIX = "commute_cast_yt_cache_";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL for driving mode

interface CacheEntry {
  videos: YouTubeVideo[];
  timestamp: number;
  nextPageToken?: string;
  etag?: string;
}

/**
 * High-performance Cache Service for YouTube Feeds.
 * Supports instant memory lookup and localStorage persistence for offline survival.
 */
export const FeedCacheService = {
  // In-memory runtime cache to eliminate micro-flickers during fast transitions
  memoryCache: {} as Record<string, CacheEntry>,

  /**
   * Retrieves videos from memory or local persistence.
   */
  get(key: string): FeedResponse | null {
    // 1. Check memory cache first
    const memEntry = this.memoryCache[key];
    if (memEntry && Date.now() - memEntry.timestamp < CACHE_TTL_MS) {
      return { videos: memEntry.videos, nextPageToken: memEntry.nextPageToken };
    }

    // 2. Check persistent storage (e.g., offline mode or cold start)
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`${LOCAL_CACHE_PREFIX}${key}`);
        if (stored) {
          const entry: CacheEntry = JSON.parse(stored);
          // Store in memory for future fast checks
          this.memoryCache[key] = entry;
          return { videos: entry.videos, nextPageToken: entry.nextPageToken };
        }
      } catch (e) {
        console.warn("[FeedCacheService] Failed to read from localStorage:", e);
      }
    }
    return null;
  },

  /**
   * Saves videos with timestamps to both memory and localStorage.
   */
  set(key: string, videos: YouTubeVideo[], nextPageToken?: string): void {
    const entry: CacheEntry = {
      videos,
      timestamp: Date.now(),
      nextPageToken
    };

    // 1. Set memory
    this.memoryCache[key] = entry;

    // 2. Persist to localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`${LOCAL_CACHE_PREFIX}${key}`, JSON.stringify(entry));
      } catch (e) {
        console.warn("[FeedCacheService] Failed to write to localStorage:", e);
      }
    }
  },

  /**
   * Incremental append to cache for pagination.
   */
  append(key: string, newVideos: YouTubeVideo[], nextPageToken?: string): void {
    const existing = this.getAnyFallback(key);
    let allVideos = newVideos;
    if (existing) {
      // Avoid duplicates
      const newVideoIds = new Set(newVideos.map(v => v.id));
      const filteredExisting = existing.videos.filter(v => !newVideoIds.has(v.id));
      allVideos = [...filteredExisting, ...newVideos];
    }
    this.set(key, allVideos, nextPageToken);
  },

  /**
   * Clears specific or all YouTube cache entries.
   */
  clear(key?: string): void {
    if (key) {
      delete this.memoryCache[key];
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(`${LOCAL_CACHE_PREFIX}${key}`);
        } catch (e) {}
      }
    } else {
      this.memoryCache = {};
      if (typeof window !== "undefined") {
        try {
          Object.keys(localStorage)
            .filter(k => k.startsWith(LOCAL_CACHE_PREFIX))
            .forEach(k => localStorage.removeItem(k));
        } catch (e) {}
      }
    }
  },

  /**
   * Checks if cached content exists for a given key regardless of TTL.
   * Useful for offline situations.
   */
  getAnyFallback(key: string): FeedResponse | null {
    const memEntry = this.memoryCache[key];
    if (memEntry) {
      return { videos: memEntry.videos, nextPageToken: memEntry.nextPageToken };
    }
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`${LOCAL_CACHE_PREFIX}${key}`);
        if (stored) {
          const entry: CacheEntry = JSON.parse(stored);
          return { videos: entry.videos, nextPageToken: entry.nextPageToken };
        }
      } catch (e) {}
    }
    return null;
  }
};
