import { getRSSFeeds } from "./storageService";
import { fetchRSSArticles } from "./rssService";
import { RSSArticle } from "../types";
import { checkLowPowerModeActive } from "../utils/batteryUtils";

const AUTO_CHECK_KEY = "commute_cast_last_rss_check";
const PROCESSED_ARTICLES_KEY = "commute_cast_processed_article_ids";
const REFRESH_INTERVAL_KEY = "commute_cast_rss_refresh_interval_minutes";
const DEFAULT_REFRESH_INTERVAL_MINUTES = 30; // 30 minutes default

export interface AutoBriefingCheckResult {
  shouldGenerate: boolean;
  newArticles: RSSArticle[];
}

/**
 * Retrieves configured RSS refresh interval in minutes (defaults to 30 mins).
 */
export function getRefreshIntervalMinutes(): number {
  try {
    const stored = localStorage.getItem(REFRESH_INTERVAL_KEY);
    if (stored) {
      const val = parseInt(stored, 10);
      if (!isNaN(val) && val > 0) return val;
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_REFRESH_INTERVAL_MINUTES;
}

/**
 * Saves configured RSS refresh interval in minutes.
 */
export function setRefreshIntervalMinutes(minutes: number): void {
  try {
    localStorage.setItem(REFRESH_INTERVAL_KEY, minutes.toString());
  } catch (e) {
    console.warn("Failed to save RSS refresh interval setting:", e);
  }
}

/**
 * Helper to get stored processed article identifiers (links or titles).
 */
function getProcessedArticleIds(): Set<string> {
  try {
    const raw = localStorage.getItem(PROCESSED_ARTICLES_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}

/**
 * Helper to save processed article identifiers to localStorage (keeping max 300).
 */
function markArticlesAsProcessed(articles: RSSArticle[]) {
  try {
    const processed = getProcessedArticleIds();
    articles.forEach(art => {
      const identifier = (art.link || art.title || "").trim().toLowerCase();
      if (identifier) {
        processed.add(identifier);
      }
    });
    // Convert back to array, keep last 300
    const arr = Array.from(processed).slice(-300);
    localStorage.setItem(PROCESSED_ARTICLES_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn("Failed to mark articles as processed:", e);
  }
}

/**
 * Checks if there are any configured RSS feeds and if the cooldown period of 6 hours has elapsed.
 * If yes, fetches latest articles, filters out duplicates, and flags that an auto-briefing can be generated.
 */
export async function checkForNewRSSArticles(
  getApiUrl: (path: string) => string,
  forceCheck = false
): Promise<AutoBriefingCheckResult> {
  try {
    // Check Low Power Mode / Low Battery status (< 20%)
    const powerStatus = await checkLowPowerModeActive();
    if (powerStatus.isActive && !forceCheck) {
      console.log(`[Scheduler] Low Power Mode active (${powerStatus.reason === "battery_low" ? `Battery level ${powerStatus.level}%` : "Manual toggle"}). Pausing background RSS polling.`);
      return { shouldGenerate: false, newArticles: [] };
    }

    const feeds = await getRSSFeeds();
    if (!feeds || feeds.length === 0) {
      return { shouldGenerate: false, newArticles: [] };
    }

    const lastCheck = localStorage.getItem(AUTO_CHECK_KEY);
    const now = Date.now();
    const intervalMinutes = getRefreshIntervalMinutes();
    const intervalMs = intervalMinutes * 60 * 1000;

    // Check cooldown unless forced
    if (!forceCheck && lastCheck && now - parseInt(lastCheck, 10) < intervalMs) {
      return { shouldGenerate: false, newArticles: [] };
    }

    // Prioritize starred feeds first during automatic background check
    const prioritizedFeeds = [...feeds].sort((a, b) => {
      const aStar = a.isStarred ? 1 : 0;
      const bStar = b.isStarred ? 1 : 0;
      return bStar - aStar;
    });

    // Fetch fresh articles
    const articles = await fetchRSSArticles(prioritizedFeeds, getApiUrl);
    if (!articles || articles.length === 0) {
      localStorage.setItem(AUTO_CHECK_KEY, now.toString());
      return { shouldGenerate: false, newArticles: [] };
    }

    // 1. Deduplicate incoming articles batch internally
    const seenBatch = new Set<string>();
    const uniqueBatch: RSSArticle[] = [];
    for (const art of articles) {
      const id = (art.link || art.title || "").trim().toLowerCase();
      if (id && !seenBatch.has(id)) {
        seenBatch.add(id);
        uniqueBatch.push(art);
      }
    }

    // 2. Filter out already processed/queued articles
    const processedIds = getProcessedArticleIds();
    const trulyNewArticles = uniqueBatch.filter(art => {
      const id = (art.link || art.title || "").trim().toLowerCase();
      return id && !processedIds.has(id);
    });

    // Save timestamp of successful check
    localStorage.setItem(AUTO_CHECK_KEY, now.toString());

    if (trulyNewArticles.length === 0) {
      return { shouldGenerate: false, newArticles: [] };
    }

    // Mark these new articles as processed so they won't trigger duplicate checks
    markArticlesAsProcessed(trulyNewArticles);

    return { shouldGenerate: true, newArticles: trulyNewArticles.slice(0, 12) };
  } catch (err) {
    console.warn("Failed to check for auto RSS articles:", err);
    return { shouldGenerate: false, newArticles: [] };
  }
}

/**
 * Set up a periodic background timer that checks for RSS updates based on user's refresh frequency setting.
 */
export function setupBackgroundRSSCheck(
  getApiUrl: (path: string) => string,
  onNewBriefingReady: (articles: RSSArticle[]) => void
): () => void {
  // Quick check shortly after app startup
  setTimeout(async () => {
    const res = await checkForNewRSSArticles(getApiUrl);
    if (res.shouldGenerate && res.newArticles.length > 0) {
      onNewBriefingReady(res.newArticles);
    }
  }, 2000); 

  // Check every 1 minute if the configured refresh interval has elapsed
  const intervalId = setInterval(async () => {
    const res = await checkForNewRSSArticles(getApiUrl);
    if (res.shouldGenerate && res.newArticles.length > 0) {
      onNewBriefingReady(res.newArticles);
    }
  }, 60 * 1000);

  return () => clearInterval(intervalId);
}
