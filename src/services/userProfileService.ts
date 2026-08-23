import { UnifiedUserProfile, UserPreferences } from "../types";
import { getVoiceHistory } from "./storageService";
import { getOfflineCachedArticles } from "./rssService"; // Import from rssService
import { getFeatureSettings, getPersonalMemory, getPlaybackHistory, getFavoriteIds } from "../features/store";
import { RSSFeed } from "../types";
import { getRSSFeeds } from "./storageService";

export async function buildUnifiedUserProfile(userId: string): Promise<UnifiedUserProfile> {
  const settings = getFeatureSettings();
  const memory = getPersonalMemory();
  const voiceHistory = await getVoiceHistory();
  const playbackHistory = getPlaybackHistory();
  const favoriteIds = getFavoriteIds();
  const rssFeeds = await getRSSFeeds();
  const rssHistory = getOfflineCachedArticles();

  // Aggregate profile data
  const profile: UnifiedUserProfile = {
    id: userId,
    youtube: {
      history: [], // Would need to fetch from YouTube API if logged in, or local history if tracked
      likedVideoIds: [],
      subscribedChannelIds: [],
      watchLaterIds: [],
      savedIds: [],
      recentlyPlayed: [],
      recentlyWatched: [],
      frequentlyPlayed: [],
      frequentlyWatched: [],
      favoriteChannels: [],
    },
    podcast: {
      history: [],
      favorites: [],
      subscriptions: [],
      continueListening: [],
    },
    rss: {
      history: rssHistory.map(a => a.link || a.title || ""),
      favorites: [],
      subscriptions: rssFeeds.map(f => f.id),
    },
    voice: {
      history: voiceHistory.map(v => ({
        id: v.id,
        timestamp: v.timestamp,
        query: v.query,
        answer: v.answer,
        language: v.language,
        sources: v.sources
      })),
    },
    driving: {
      history: [],
      totalDrivingSeconds: memory.totalListeningSeconds,
    },
    search: {
      history: [],
      recentlySearched: [],
    },
    settings: settings as unknown as UserPreferences, // Cast for now to fix type mismatch
    favorites: favoriteIds,
    playbackHistory: playbackHistory,
  };

  return profile;
}
