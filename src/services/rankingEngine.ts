import { YouTubeVideo } from "../types";
import { getUnifiedUserProfile } from "../features/store";

/**
 * Advanced Ranking Engine for calculating trending/HOT scores.
 * Computes scores based on views, likes, publication time (freshness), engagement, and user preferences.
 */
export function calculateHotScore(video: YouTubeVideo): number {
  const userProfile = getUnifiedUserProfile();
  const views = video.viewCount ? parseFormattedCount(video.viewCount) : 0;
  const likes = video.likeCount ? parseFormattedCount(video.likeCount) : 0;
  
  // 1. Freshness Decay
  const pubDate = video.publishedAt ? new Date(video.publishedAt).getTime() : Date.now();
  const ageInMs = Math.max(1, Date.now() - pubDate);
  const ageInHours = Math.max(0.1, ageInMs / (1000 * 60 * 60));
  const ageInDays = ageInHours / 24;
  
  // Exponential decay: Halves every 3 days
  const freshnessScore = 500 * Math.pow(0.5, ageInDays / 3);

  // 2. Views Velocity (Views per hour)
  const viewsVelocity = views / ageInHours;
  const velocityScore = Math.min(viewsVelocity * 2, 300); // Cap at 300

  // 3. Engagement (Like Ratio)
  const likeRatio = views > 0 ? (likes / views) : 0.02; // Default to 2% if views is 0
  const engagementScore = Math.min(likeRatio * 3000, 200); // Caps at 200

  // 4. Size Log Scale (Watch Momentum)
  const sizeScore = views > 0 ? Math.log10(views) * 50 : 0;
  
  // 5. Personalization Boost (Integration with UnifiedUserProfile)
  let personalBoost = 0;
  if (userProfile) {
    const titleLower = (video.title || "").toLowerCase();
    const channelLower = (video.channelTitle || "").toLowerCase();
    
    if (userProfile.youtube.likedVideoIds.includes(video.id)) personalBoost += 500;
    if (userProfile.youtube.subscribedChannelIds.includes(video.channelTitle)) personalBoost += 300;
    if (userProfile.youtube.recentlyWatched.includes(video.id)) personalBoost += 200;
    
    // Cross-source interest
    if (userProfile.rss.history.some(h => titleLower.includes(h.toLowerCase()))) personalBoost += 150;
  }
  
  // Base authority
  const authorityScore = 50; 

  // Final Composite Score
  return Math.round(sizeScore + engagementScore + freshnessScore + velocityScore + authorityScore + personalBoost);
}

/**
 * Parses counts like "1.2M", "500K", "10B" back to numbers for calculations.
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

/**
 * Sorts and ranks a list of videos descending by HOT score.
 */
export function rankVideosByHot(videos: YouTubeVideo[]): YouTubeVideo[] {
  return videos.map(video => {
    const score = calculateHotScore(video);
    return {
      ...video,
      trendingScore: score
    };
  }).sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
}
