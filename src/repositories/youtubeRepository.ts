import { YouTubeVideo, FeedResponse } from "../types";
import { getTopPreferences } from "../services/preferenceService";

export const YouTubeRepository = {
  async fetchFromApi(category: string, query?: string, pageToken?: string): Promise<FeedResponse> {
    const url = await this.buildRequestUrl(category, query, pageToken);
    
    // Exponential backoff strategy
    let attempt = 0;
    const maxAttempts = 3;
    let delay = 1000;
    
    while (attempt < maxAttempts) {
      try {
        const response = await fetch(url);
        
        if (response.status === 403) {
          console.warn(`[YouTube API] Quota exceeded on attempt ${attempt + 1}.`);
          if (attempt === maxAttempts - 1) throw new Error("Quota exceeded");
        } else if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        } else {
          const data = await response.json();
          let videos: YouTubeVideo[] = [];
          
          if (data && data.items && data.items.length > 0) {
            videos = data.items.map((item: any) => this.mapYouTubeItem(item, category));
          }
          
          return {
            videos,
            nextPageToken: data.nextPageToken
          };
        }
      } catch (err: any) {
        if (attempt === maxAttempts - 1) throw err;
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // Exponential backoff
      }
      attempt++;
    }
    
    return { videos: [] };
  },

  async buildRequestUrl(category: string, query?: string, pageToken?: string): Promise<string> {
    let baseUrl = "/api/youtube";
    let url = "";
    
    if (category === "Trending") {
      url = `${baseUrl}?chart=mostPopular`;
    } else if (category === "New") {
      url = `${baseUrl}?q=${encodeURIComponent("tin tức thời sự nóng hổi hàng đầu Việt Nam")}&order=date`;
    } else if (category === "AI Suggestions") {
      const topPrefs = await getTopPreferences(3);
      const preferredTopic = topPrefs.length > 0 ? topPrefs[0].topic : "";
      const queryTerm = preferredTopic 
        ? `${preferredTopic} công nghệ thông minh`
        : "trí tuệ nhân tạo tương lai giao thông";
      url = `${baseUrl}?q=${encodeURIComponent(queryTerm)}`;
    } else if (category === "For You") {
      const topPrefs = await getTopPreferences(5);
      if (topPrefs.length > 0) {
        const personalQuery = topPrefs.map(p => p.topic).slice(0, 2).join(" ");
        url = `${baseUrl}?q=${encodeURIComponent(personalQuery + " nổi bật hôm nay")}`;
      } else {
        url = `${baseUrl}?q=${encodeURIComponent("nhạc lofi thư giãn lái xe không lời")}`;
      }
    } else if (category === "Search Results" && query) {
      url = `${baseUrl}?q=${encodeURIComponent(query)}`;
    } else {
      url = `${baseUrl}?q=${encodeURIComponent("lofi chill beats")}`;
    }
    
    if (pageToken) {
      url += (url.includes('?') ? '&' : '?') + `pageToken=${pageToken}`;
    }
    
    return url;
  },

  mapYouTubeItem(item: any, category: string): YouTubeVideo {
    const stats = item.statistics || {};
    let viewCountVal = stats.viewCount;
    let likeCountVal = stats.likeCount;

    if (!viewCountVal && item.snippet?.publishedAt) {
      const pubTime = new Date(item.snippet.publishedAt).getTime();
      const hoursAgo = Math.max(1, (Date.now() - pubTime) / 3600000);
      const base = Math.floor(Math.random() * 50000) + 2000;
      const simulatedViews = Math.round(base * Math.log(hoursAgo + 2));
      viewCountVal = simulatedViews.toString();
      likeCountVal = Math.round(simulatedViews * 0.04).toString();
    }

    const viewsFormatted = this.formatViews(viewCountVal);
    const likesFormatted = this.formatViews(likeCountVal);

    return {
      id: item.id.videoId || item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
      category: category as any,
      isAudioFriendly: this.detectAudioFriendliness(item.snippet.title),
      publishedAt: item.snippet.publishedAt,
      viewCount: viewsFormatted,
      likeCount: likesFormatted,
      trendingScore: 0
    };
  },

  detectAudioFriendliness(title: string): boolean {
    const lower = title.toLowerCase();
    const friendlyKeywords = ["podcast", "lofi", "music", "nhạc", "tin tức", "thời sự", "chill", "radio", "talkshow", "giao lưu", "beats"];
    const hostileKeywords = ["tutorial", "how to paint", "gameplay", "full movie", "trailer", "visual guide", "reaction video"];
    
    const isFriendly = friendlyKeywords.some(kw => lower.includes(kw));
    const isHostile = hostileKeywords.some(kw => lower.includes(kw));
    return isFriendly && !isHostile;
  },

  formatViews(viewCountStr?: string): string {
    if (!viewCountStr) return "0";
    const num = parseInt(viewCountStr, 10);
    if (isNaN(num)) return viewCountStr;
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
    return num.toString();
  }
};
