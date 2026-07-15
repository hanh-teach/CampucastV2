import { YouTubeVideo, CategoryType, FeedResponse } from "../types";
import { YouTubeRepository } from "../repositories/youtubeRepository";
import { FeedCacheService } from "./feedCacheService";
import { rankVideosByHot } from "./rankingEngine";
import { scoreAndSortRecommendations } from "./recommendationEngine";

export const FeedOrchestrator = {
  async getFeed(
    category: CategoryType,
    options: {
      query?: string;
      forceRefresh?: boolean;
      isDrivingMode?: boolean;
      pageToken?: string;
    } = {}
  ): Promise<FeedResponse> {
    const { query, forceRefresh = false, isDrivingMode = false, pageToken } = options;
    const cacheKey = category === "Search Results" ? `search_${query || ""}` : category;

    // 1. Check Cache (only if not fetching a specific next page)
    if (!forceRefresh && !pageToken) {
      const cached = FeedCacheService.get(cacheKey);
      if (cached && cached.videos && cached.videos.length > 0) {
        console.log(`[FeedOrchestrator] Loaded from cache for key: ${cacheKey}`);
        return cached;
      }
    }

    // 2. Fetch from Repository
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    if (isOnline) {
      try {
        const result = await YouTubeRepository.fetchFromApi(category, query, pageToken);
        if (result && result.videos && result.videos.length > 0) {
          result.videos = await this.processEngines(result.videos, category, isDrivingMode);
          if (pageToken) {
             FeedCacheService.append(cacheKey, result.videos, result.nextPageToken);
          } else {
             FeedCacheService.set(cacheKey, result.videos, result.nextPageToken);
          }
          return result;
        }
      } catch (err) {
        console.error(`[FeedOrchestrator] API fetch failed for category ${category}:`, err);
      }
    }

    // 3. Fallback to Stale Cache
    if (!pageToken) {
      const fallbackCached = FeedCacheService.getAnyFallback(cacheKey);
      if (fallbackCached && fallbackCached.videos && fallbackCached.videos.length > 0) {
        console.log(`[FeedOrchestrator] Offline. Fallback to existing stale cache for key: ${cacheKey}`);
        return fallbackCached;
      }
    }

    return { videos: [] };
  },

  async processEngines(
    videos: YouTubeVideo[],
    category: string,
    isDrivingMode: boolean
  ): Promise<YouTubeVideo[]> {
    if (category === "New") {
      return [...videos].sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    if (category === "Trending") {
      return rankVideosByHot(videos);
    }

    if (category === "AI Suggestions") {
      return await scoreAndSortRecommendations(videos, isDrivingMode, "AI");
    }
    
    if (category === "For You") {
      return await scoreAndSortRecommendations(videos, isDrivingMode, "PERSONAL");
    }

    if (category === "Search Results") {
      return await scoreAndSortRecommendations(videos, isDrivingMode, "SEARCH");
    }

    return videos;
  }
};
