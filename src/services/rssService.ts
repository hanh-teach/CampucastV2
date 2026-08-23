import { RSSFeed, RSSArticle } from "../types";
import { saveRSSFeed } from "./storageService";
import { telemetry } from "./telemetryService";

const OFFLINE_ARTICLES_CACHE_KEY = "commute_cast_offline_articles";

/**
 * Automatically assign categories based on keywords if not specified
 */
export function detectCategoryFromKeywords(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();
  if (
    text.includes("công nghệ") || 
    text.includes("số hóa") || 
    text.includes("smartphone") || 
    text.includes("ai") || 
    text.includes("artificial intelligence") || 
    text.includes("technology") || 
    text.includes("software") || 
    text.includes("gpt") || 
    text.includes("máy tính")
  ) {
    return "Công nghệ";
  }
  if (
    text.includes("giáo dục") || 
    text.includes("trường học") || 
    text.includes("học sinh") || 
    text.includes("sinh viên") || 
    text.includes("thi tốt nghiệp") || 
    text.includes("education") || 
    text.includes("học tập")
  ) {
    return "Giáo dục";
  }
  if (
    text.includes("kinh tế") || 
    text.includes("tài chính") || 
    text.includes("bất động sản") || 
    text.includes("doanh nghiệp") || 
    text.includes("cổ phiếu") || 
    text.includes("vàng") || 
    text.includes("finance") || 
    text.includes("economy")
  ) {
    return "Kinh tế";
  }
  if (
    text.includes("sức khỏe") || 
    text.includes("y tế") || 
    text.includes("bác sĩ") || 
    text.includes("dịch bệnh") || 
    text.includes("health") || 
    text.includes("fitness")
  ) {
    return "Sức khỏe";
  }
  if (
    text.includes("thể thao") || 
    text.includes("bóng đá") || 
    text.includes("euro") || 
    text.includes("olympic") || 
    text.includes("sports") || 
    text.includes("champion")
  ) {
    return "Thể thao";
  }
  if (
    text.includes("giải trí") || 
    text.includes("phim") || 
    text.includes("nhạc") || 
    text.includes("showbiz") || 
    text.includes("celebrity") || 
    text.includes("entertainment")
  ) {
    return "Giải trí";
  }
  return "Thời sự";
}

/**
 * Fast keyword-based sentiment detection for RSS articles
 */
export function detectSentimentFromKeywords(title: string, content: string = ""): "positive" | "negative" | "neutral" {
  const text = `${title} ${content}`.toLowerCase();
  
  const positiveKeywords = [
    "tăng trưởng", "đột phá", "thành công", "thắng lớn", "phát triển", "kỷ lục", "hy vọng",
    "khen ngợi", "hợp tác", "phục hồi", "vinh danh", "xuất sắc", "giải thưởng", "khởi sắc",
    "bứt phá", "nâng cấp", "cải thiện", "tích cực", "hòa bình", "cứu sống", "tin vui", "thành tựu",
    "growth", "breakthrough", "success", "record", "award", "improve", "recovery", "win", "peace", "positive"
  ];
  
  const negativeKeywords = [
    "tai nạn", "sụp đổ", "khủng hoảng", "dịch bệnh", "tử vong", "thiệt hại", "lừa đảo",
    "xung đột", "chiến tranh", "tranh cãi", "thất bại", "sụt giảm", "thua lỗ", "cảnh báo",
    "bắt giữ", "tội phạm", "vi phạm", "đình công", "nguy hiểm", "bão lụt", "cháy lớn", "thiên tai",
    "crash", "crisis", "disaster", "accident", "death", "damage", "fraud", "conflict", "war", "decline", "loss", "danger", "negative"
  ];

  let posScore = 0;
  let negScore = 0;

  for (const kw of positiveKeywords) {
    if (text.includes(kw)) posScore++;
  }
  for (const kw of negativeKeywords) {
    if (text.includes(kw)) negScore++;
  }

  if (posScore > negScore) return "positive";
  if (negScore > posScore) return "negative";
  return "neutral";
}

/**
 * Calls Gemini AI endpoint to analyze sentiment for a batch of RSS articles.
 */
export async function analyzeArticlesSentimentWithAI(
  articles: RSSArticle[],
  getApiUrl: (path: string) => string,
  uiLanguage: "vi" | "en" = "vi"
): Promise<RSSArticle[]> {
  if (!articles || articles.length === 0) return [];

  try {
    const payload = articles.map(art => ({
      title: art.title,
      content: art.content || ""
    }));

    const response = await fetch(getApiUrl("/api/analyze-rss-sentiment"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articles: payload, language: uiLanguage })
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    if (data.results && Array.isArray(data.results)) {
      return articles.map((art, idx) => {
        const found = data.results.find((r: any) => r.index === idx);
        const sentiment: "positive" | "negative" | "neutral" = 
          (found?.sentiment === "positive" || found?.sentiment === "negative" || found?.sentiment === "neutral")
            ? found.sentiment
            : art.sentiment || detectSentimentFromKeywords(art.title, art.content);
        return { ...art, sentiment };
      });
    }
  } catch (err) {
    console.warn("AI sentiment analysis failed, falling back to keyword sentiment:", err);
  }

  return articles.map(art => ({
    ...art,
    sentiment: art.sentiment || detectSentimentFromKeywords(art.title, art.content)
  }));
}

/**
 * Calculate Jaccard similarity index between two strings.
 * Evaluates intersection over union of word tokens.
 */
export function calculateJaccardSimilarity(str1: string, str2: string): number {
  const getWords = (str: string) => {
    return new Set(
      str
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
        .split(/\s+/)
        .filter(word => word.length > 1)
    );
  };
  const set1 = getWords(str1);
  const set2 = getWords(str2);
  if (set1.size === 0 || set2.size === 0) return 0;

  let intersectionSize = 0;
  set1.forEach(word => {
    if (set2.has(word)) {
      intersectionSize++;
    }
  });

  const unionSize = set1.size + set2.size - intersectionSize;
  return intersectionSize / unionSize;
}

const DEFAULT_EXCLUDED_KEYWORDS = [
  /sponsored/i,
  /\b(ad|quảng cáo)\b/i,
  /giveaway/i,
  /roundup/i,
  /khuyến mãi/i,
  /tài trợ/i
];

/**
 * Check if article is fresh based on pubDate
 */
export function isArticleFresh(article: RSSArticle, maxAgeHours: number = 24): boolean {
  if (!article.pubDate) return true; // Assume fresh if no date
  const pubDate = new Date(article.pubDate).getTime();
  const now = new Date().getTime();
  const ageHours = (now - pubDate) / (1000 * 60 * 60);
  return ageHours <= maxAgeHours;
}

/**
 * Filter articles based on user keywords.
 */
export function filterArticlesByUserKeywords(articles: RSSArticle[], includeKeywords: string[], excludeKeywords: string[]): RSSArticle[] {
  return articles.filter(art => {
    const text = `${art.title} ${art.content}`.toLowerCase();
    
    // 1. Exclude check (if article matches any exclude keyword, remove it)
    if (excludeKeywords.some(kw => text.includes(kw.toLowerCase()))) {
      return false;
    }
    
    // 2. Include check (if includeKeywords list is not empty, article MUST match at least one)
    if (includeKeywords.length > 0) {
      return includeKeywords.some(kw => text.includes(kw.toLowerCase()));
    }
    
    return true;
  });
}

/**
 * Checks if title or content contains any excluded spam/promo keywords.
 */
export function containsExcludedKeywords(title: string, content: string): boolean {
  const text = `${title} ${content}`;
  return DEFAULT_EXCLUDED_KEYWORDS.some(regex => regex.test(text));
}

/**
 * Filter duplicates out or label them.
 * Performs deep duplicate detection using Title Jaccard Similarity, key entity token overlap, and a 24-hour time window.
 */
export function detectAndMarkDuplicates(articles: RSSArticle[]): RSSArticle[] {
  const result = articles.map(art => ({ ...art, isDuplicate: false }));
  const priorityWeight = { high: 3, medium: 2, low: 1 };

  for (let i = 0; i < result.length; i++) {
    if (result[i].isDuplicate) continue;

    const artA = result[i];
    const timeA = artA.pubDate ? new Date(artA.pubDate).getTime() : 0;
    const priorityA = priorityWeight[artA.feedPriority || "medium"];

    for (let j = i + 1; j < result.length; j++) {
      if (result[j].isDuplicate) continue;

      const artB = result[j];
      const timeB = artB.pubDate ? new Date(artB.pubDate).getTime() : 0;
      const priorityB = priorityWeight[artB.feedPriority || "medium"];

      // Check if within 24-hour window
      const timeDiffHours = Math.abs(timeA - timeB) / (1000 * 60 * 60);
      const isWithin24Hours = !timeA || !timeB || timeDiffHours <= 24;

      if (isWithin24Hours) {
        const titleSimilarity = calculateJaccardSimilarity(artA.title || "", artB.title || "");
        const isExactLinkMatch = artA.link && artB.link && artA.link.trim().toLowerCase() === artB.link.trim().toLowerCase();

        // Check significant overlap (>0.65) or entity similarity
        if (titleSimilarity >= 0.65 || isExactLinkMatch) {
          if (priorityA >= priorityB) {
            result[j].isDuplicate = true;
          } else {
            result[i].isDuplicate = true;
            break;
          }
        }
      }
    }
  }

  return result;
}

/**
 * Load offline cached articles
 */
export function getOfflineCachedArticles(): RSSArticle[] {
  try {
    const raw = localStorage.getItem(OFFLINE_ARTICLES_CACHE_KEY);
    if (!raw) return [];
    const list: RSSArticle[] = JSON.parse(raw);
    return list.map(art => ({ ...art, isOfflineCached: true }));
  } catch (err) {
    console.error("Failed to load cached articles:", err);
    return [];
  }
}

/**
 * Save articles to offline cache
 */
export function saveOfflineCachedArticles(articles: RSSArticle[]): void {
  try {
    // Keep at most 150 latest articles for offline storage to preserve quota
    const sliced = articles.slice(0, 150).map(art => ({ ...art, isOfflineCached: true }));
    localStorage.setItem(OFFLINE_ARTICLES_CACHE_KEY, JSON.stringify(sliced));
  } catch (err) {
    console.error("Failed to cache articles offline:", err);
  }
}

/**
 * Fetch and parse articles from multiple RSS feeds.
 * Uses the server proxy `/api/parse-rss` to avoid CORS issues.
 * Adds health statistics tracking & caching fallbacks.
 */
/**
 * Helper to check if Offline Mode preference is enabled in localStorage
 */
export function isOfflineModeEnabled(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const saved = localStorage.getItem("commutecast_user_preferences");
    if (!saved) return false;
    const parsed = JSON.parse(saved);
    return Boolean(parsed.isOfflineMode);
  } catch {
    return false;
  }
}

export async function fetchRSSArticles(
  feeds: RSSFeed[], 
  getApiUrl: (path: string) => string,
  forceRefresh: boolean = false,
  onFeedUpdated?: (feed: RSSFeed) => void,
  onProgress?: (current: number, total: number, feedTitle: string) => void): Promise<RSSArticle[]> {
  const aggregatedArticles: RSSArticle[] = [];
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  const isForcedOffline = isOfflineModeEnabled();

  if (isForcedOffline || !isOnline) {
    console.log("Offline Mode active or device offline. Restricting data fetching to cached local storage...");
    return detectAndMarkDuplicates(getOfflineCachedArticles());
  }

  // Group feeds by priority: starred feeds first, then by priority level (high > medium > low)
  const sortedFeedsByPriority = [...feeds].sort((a, b) => {
    const starA = a.isStarred ? 1 : 0;
    const starB = b.isStarred ? 1 : 0;
    if (starB !== starA) {
      return starB - starA; // Starred feeds come first!
    }
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    const weightA = priorityWeight[a.priority || "medium"];
    const weightB = priorityWeight[b.priority || "medium"];
    return weightB - weightA;
  });

  const totalFeeds = sortedFeedsByPriority.length;
  for (let i = 0; i < totalFeeds; i++) {
    const feed = sortedFeedsByPriority[i];
    if (onProgress) {
      onProgress(i + 1, totalFeeds, feed.title || feed.url);
    }
    const startTime = performance.now();
    let isSuccess = false;
    let errorMessage = "";
    
    try {
      const urlWithForce = `/api/parse-rss?url=${encodeURIComponent(feed.url)}${forceRefresh ? "&forceRefresh=true" : ""}`;
      const response = await fetch(getApiUrl(urlWithForce));
      
      const duration = Math.round(performance.now() - startTime);

      if (!response.ok) {
        telemetry.track("rss_fetch_error", { url: feed.url, error: response.statusText, duration });
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      isSuccess = true;
      telemetry.track("rss_fetch_success", { url: feed.url, duration });
      
      // Update statistics
      const currentFetchCount = (feed.fetchCount || 0) + 1;
      const currentSuccessCount = (feed.successCount || 0) + 1;
      const currentAvgDuration = feed.avgFetchDuration 
        ? Math.round((feed.avgFetchDuration * (currentFetchCount - 1) + duration) / currentFetchCount)
        : duration;

      const updatedFeed: RSSFeed = {
        ...feed,
        lastFetchedAt: new Date().toISOString(),
        healthStatus: "healthy",
        healthError: undefined,
        fetchCount: currentFetchCount,
        successCount: currentSuccessCount,
        avgFetchDuration: currentAvgDuration
      };

      // Save updated feed statistics asynchronously
      saveRSSFeed(updatedFeed).then(() => {
        if (onFeedUpdated) onFeedUpdated(updatedFeed);
      }).catch(e => console.warn("Could not auto-save feed health statistics:", e));

      if (data.articles && Array.isArray(data.articles)) {
        // Apply feed-specific keyword filtering
        let filteredArticles = data.articles.filter((art: any) => !containsExcludedKeywords(art.title || "", art.content || ""));
        
        if (feed.includeKeywords || feed.excludeKeywords) {
          filteredArticles = filterArticlesByUserKeywords(filteredArticles as RSSArticle[], feed.includeKeywords || [], feed.excludeKeywords || []);
        }

        // Apply freshness and deduplication
        filteredArticles = filteredArticles.filter((art: any) => isArticleFresh(art as RSSArticle));
        filteredArticles = detectAndMarkDuplicates(filteredArticles as RSSArticle[]).filter(art => !art.isDuplicate);

        const withFeedInfo = filteredArticles.map((art: any) => {
            const category = feed.category || detectCategoryFromKeywords(art.title || "", art.content || "");
            const sentiment = art.sentiment || detectSentimentFromKeywords(art.title || "", art.content || "");
            return {
              ...art,
              feedId: feed.id,
              feedTitle: data.title || feed.title,
              feedCategory: category,
              feedType: feed.feedType || "news",
              feedPriority: feed.priority || "medium",
              sentiment
            };
          });
        aggregatedArticles.push(...withFeedInfo);
      }
    } catch (err: any) {
      errorMessage = err?.message || String(err);
      console.warn(`Error processing feed ${feed.title}:`, errorMessage);

      const duration = Math.round(performance.now() - startTime);
      const currentFetchCount = (feed.fetchCount || 0) + 1;
      const currentAvgDuration = feed.avgFetchDuration 
        ? Math.round((feed.avgFetchDuration * (currentFetchCount - 1) + duration) / currentFetchCount)
        : duration;

      // Calculate health based on fetch failure ratio
      const failureRatio = currentFetchCount > 0 ? (currentFetchCount - (feed.successCount || 0)) / currentFetchCount : 0;
      const health: "failing" | "broken" = failureRatio >= 0.7 ? "broken" : "failing";

      const updatedFeed: RSSFeed = {
        ...feed,
        healthStatus: health,
        healthError: errorMessage,
        fetchCount: currentFetchCount,
        avgFetchDuration: currentAvgDuration
      };

      saveRSSFeed(updatedFeed).then(() => {
        if (onFeedUpdated) onFeedUpdated(updatedFeed);
      }).catch(e => console.warn("Could not save failing feed stats:", e));
    }
  }

  // If we couldn't fetch anything but have feeds, fallback to offline cache
  if (aggregatedArticles.length === 0 && getOfflineCachedArticles().length > 0) {
    return detectAndMarkDuplicates(getOfflineCachedArticles());
  }

  // Sort articles by publication date if available (newest first)
  const sortedArticles = aggregatedArticles.sort((a, b) => {
    const timeA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const timeB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    if (timeA && timeB) {
      return timeB - timeA;
    }
    return 0; // retain default order otherwise
  });

  // Save successful result list to offline cache
  if (sortedArticles.length > 0) {
    saveOfflineCachedArticles(sortedArticles);
  }

  const cachedResult = sortedArticles.map(art => ({ ...art, isOfflineCached: true }));
  return detectAndMarkDuplicates(cachedResult);
}

/**
 * Format a list of RSS articles into a single raw text string for summarization.
 */
export function formatArticlesForPrompt(articles: RSSArticle[], uiLanguage: "vi" | "en"): string {
  if (articles.length === 0) return "";

  const header = uiLanguage === "vi"
    ? `Dưới đây là danh sách tin tức mới nhất tổng hợp từ nguồn RSS tự động:\n\n`
    : `Here is the aggregated news list from the registered RSS channels:\n\n`;

  // Filter out duplicates for clean prompts
  const activeArticles = articles.filter(art => !art.isDuplicate);

  const formatted = activeArticles.map((art, index) => {
    const sourceLabel = art.feedTitle ? `[Nguồn: ${art.feedTitle}]` : "";
    const categoryLabel = art.feedCategory ? ` [Chủ đề: ${art.feedCategory}]` : "";
    return `Bài báo #${index + 1}: ${art.title} ${sourceLabel}${categoryLabel}
Ngày đăng: ${art.pubDate || "N/A"}
Nội dung: ${art.content || "N/A"}
Liên kết: ${art.link}
---`;
  }).join("\n\n");

  return header + formatted;
}

/**
 * Export subscribed feeds to standard OPML XML string
 */
export function exportToOPML(feeds: RSSFeed[]): string {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>CommuteCast RSS Feeds Export</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
    <outline text="Subscriptions" title="Subscriptions">`;
  
  const body = feeds.map(feed => {
    const title = (feed.title || "").replace(/&/g, "&amp;").replace(/"/g, '&quot;').replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const url = (feed.url || "").replace(/&/g, "&amp;").replace(/"/g, '&quot;').replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const category = (feed.category || "Thời sự").replace(/&/g, "&amp;").replace(/"/g, '&quot;');
    const type = feed.feedType || "news";
    const priority = feed.priority || "medium";
    return `      <outline type="rss" text="${title}" title="${title}" xmlUrl="${url}" htmlUrl="${url}" category="${category}" feedType="${type}" priority="${priority}" />`;
  }).join("\n");

  const footer = `
    </outline>
  </body>
</opml>`;

  return header + "\n" + body + "\n" + footer;
}

/**
 * Parse an imported OPML XML string into raw feed parameters
 */
export function parseOPML(xmlText: string): Array<{ url: string; title: string; category: string; feedType: "news" | "podcast" | "blog"; priority: "low" | "medium" | "high" }> {
  const feeds: any[] = [];
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    // Check if xml parsing failed
    const parserError = xmlDoc.getElementsByTagName("parsererror");
    if (parserError.length > 0) {
      console.warn("OPML Parser Error:", parserError[0].textContent);
    }

    const outlines = xmlDoc.getElementsByTagName("outline");
    
    for (let i = 0; i < outlines.length; i++) {
      const el = outlines[i];
      const xmlUrl = el.getAttribute("xmlUrl") || el.getAttribute("url");
      const text = el.getAttribute("text") || el.getAttribute("title") || "Untitled Feed";
      const category = el.getAttribute("category") || "Thời sự";
      const feedTypeAttr = el.getAttribute("feedType");
      const priorityAttr = el.getAttribute("priority");

      if (xmlUrl) {
        feeds.push({
          url: xmlUrl,
          title: text,
          category: category,
          feedType: (feedTypeAttr === "news" || feedTypeAttr === "podcast" || feedTypeAttr === "blog") ? feedTypeAttr : "news",
          priority: (priorityAttr === "low" || priorityAttr === "medium" || priorityAttr === "high") ? priorityAttr : "medium"
        });
      }
    }
  } catch (err) {
    console.error("Failed to parse OPML XML content:", err);
  }
  return feeds;
}
