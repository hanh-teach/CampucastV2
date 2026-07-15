import { YouTubeVideo } from "../types";
import { getUnifiedUserProfile } from "../features/store";

/**
 * Advanced AI-driven Recommendation Engine.
 * Tailors videos to user's interaction history (topics scored in UnifiedUserProfile)
 * and active context (Driving Mode safety requirements).
 */
export async function scoreAndSortRecommendations(
  videos: YouTubeVideo[],
  isDrivingMode: boolean,
  type: "AI" | "PERSONAL" | "SEARCH" = "AI"
): Promise<YouTubeVideo[]> {
  try {
    const profile = getUnifiedUserProfile();
    
    // Default profile if none exists
    const userProfile = profile || {
      youtube: { history: [], likedVideoIds: [], subscribedChannelIds: [], watchLaterIds: [], savedIds: [], recentlyPlayed: [], recentlyWatched: [], frequentlyPlayed: [], frequentlyWatched: [], favoriteChannels: [] },
      podcast: { history: [], favorites: [], subscriptions: [], continueListening: [] },
      rss: { history: [], favorites: [], subscriptions: [] },
      voice: { history: [] },
      driving: { history: [], totalDrivingSeconds: 0 },
      search: { history: [], recentlySearched: [] },
      settings: { languageMode: "BILINGUAL" } as any,
      favorites: [],
      playbackHistory: []
    };

    return videos.map(video => {
      let score = 0;
      const titleLower = (video.title || "").toLowerCase();

      // Common Personalization boost
      if (userProfile.youtube.likedVideoIds.includes(video.id)) score += 200;
      if (userProfile.youtube.subscribedChannelIds.includes(video.channelTitle)) score += 150;

      // Type-specific scoring
      if (type === 'PERSONAL') {
        if (userProfile.youtube.recentlyWatched.includes(video.id)) score += 1000;
        if (userProfile.youtube.recentlyPlayed.includes(video.id)) score += 800;
        if (userProfile.youtube.savedIds.includes(video.id)) score += 600;
        score += 300; // General personal interest boost
      } else if (type === 'AI') {
        if (userProfile.rss.history.some(h => titleLower.includes(h.toLowerCase()))) score += 100;
        if (userProfile.podcast.history.some(h => titleLower.includes(h.toLowerCase()))) score += 100;
        score += 150; // General AI suggestion boost
      } else if (type === 'SEARCH') {
        if (userProfile.search.recentlySearched.some(s => titleLower.includes(s.toLowerCase()))) score += 500;
      }

      // Driving Context
      if (isDrivingMode) {
        if (video.isAudioFriendly) score += 100;
        if (titleLower.includes("podcast") || titleLower.includes("tin tức")) score += 200;
        if (titleLower.includes("tutorial")) score -= 300;
      }

      return {
        ...video,
        recommendationScore: Math.round(score),
        personalFeedCategory: type === 'PERSONAL' ? "For You" : "AI Picks"
      };
    }).sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
  } catch (error) {
    console.error("[RecommendationEngine] Scoring failed, returning original order:", error);
    return videos;
  }
}

/**
 * Helper to convert short-hand formats like "500K", "1.2M" back to numbers.
 */
function parseFormattedCount(countStr: string): number {
  const clean = countStr.toUpperCase().replace(/,/g, "").trim();
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  
  if (clean.endsWith("B")) return num * 1_000_000_000;
  if (clean.endsWith("M")) return num * 1_000_000;
  if (clean.endsWith("K")) return num * 1_000;
  return num;
}
