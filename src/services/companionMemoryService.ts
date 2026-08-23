import { CompanionMemoryItem, RSSArticle } from "../types";

const COMPANION_MEMORY_STORAGE_KEY = "commutecast_companion_memory_48h";
const ROLLING_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 Hours in milliseconds

/**
 * Generates a simple fast hash for text content
 */
export function simpleHash(text: string): string {
  let hash = 0;
  const str = text.trim().toLowerCase();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Gets all recorded memory items within the rolling 48-hour window
 */
export function getCompanionMemory(): CompanionMemoryItem[] {
  try {
    const raw = localStorage.getItem(COMPANION_MEMORY_STORAGE_KEY);
    if (!raw) return [];
    const items: CompanionMemoryItem[] = JSON.parse(raw);
    const cutoff = Date.now() - ROLLING_WINDOW_MS;
    // Filter out items older than 48 hours
    const validItems = items.filter((item) => {
      const time = new Date(item.listenedAt).getTime();
      return !isNaN(time) && time >= cutoff;
    });

    if (validItems.length !== items.length) {
      localStorage.setItem(COMPANION_MEMORY_STORAGE_KEY, JSON.stringify(validItems));
    }
    return validItems;
  } catch (err) {
    console.warn("[CompanionMemory] Failed to read companion memory:", err);
    return [];
  }
}

/**
 * Records news items as listened in the companion memory
 */
export function recordListenedNews(items: Array<{ title: string; source?: string; topic?: string }>): void {
  try {
    const current = getCompanionMemory();
    const now = new Date().toISOString();

    const newEntries: CompanionMemoryItem[] = items.map((item) => ({
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: item.title,
      source: item.source || "Feed",
      contentHash: simpleHash(item.title),
      listenedAt: now,
      topic: item.topic || "General"
    }));

    const merged = [...newEntries, ...current].slice(0, 200); // Keep max 200 recent entries
    localStorage.setItem(COMPANION_MEMORY_STORAGE_KEY, JSON.stringify(merged));
    console.log(`[CompanionMemory] Recorded ${newEntries.length} stories into 48h memory.`);
  } catch (err) {
    console.warn("[CompanionMemory] Failed to record listened news:", err);
  }
}

/**
 * Checks if a story has already been heard within the 48-hour memory window
 */
export function isStoryHeard(title: string, memory: CompanionMemoryItem[]): boolean {
  if (!title || memory.length === 0) return false;
  const hash = simpleHash(title);
  const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9à-ỹ\s]/gi, "").trim();

  return memory.some((mem) => {
    if (mem.contentHash === hash) return true;
    const memTitle = mem.title.toLowerCase().replace(/[^a-z0-9à-ỹ\s]/gi, "").trim();
    if (memTitle === normalizedTitle) return true;

    // Check high token overlap (>80%)
    const words1 = new Set(normalizedTitle.split(/\s+/).filter((w) => w.length > 2));
    const words2 = new Set(memTitle.split(/\s+/).filter((w) => w.length > 2));
    if (words1.size === 0 || words2.size === 0) return false;

    let overlap = 0;
    words1.forEach((w) => {
      if (words2.has(w)) overlap++;
    });
    const similarity = overlap / Math.max(words1.size, words2.size);
    return similarity >= 0.8;
  });
}

/**
 * Filters out RSS articles that were heard within the last 48 hours
 */
export function filterUnheardArticles(articles: RSSArticle[]): { freshArticles: RSSArticle[]; filteredCount: number } {
  const memory = getCompanionMemory();
  if (memory.length === 0) {
    return { freshArticles: articles, filteredCount: 0 };
  }

  const freshArticles = articles.filter((art) => !isStoryHeard(art.title || "", memory));
  const filteredCount = articles.length - freshArticles.length;

  if (filteredCount > 0) {
    console.log(`[CompanionMemory] Filtered ${filteredCount} previously heard stories out of ${articles.length}.`);
  }

  // Fallback: If filtering removes all items, return at least the newest ones
  if (freshArticles.length === 0 && articles.length > 0) {
    console.warn("[CompanionMemory] All items were in memory. Retaining newest 5 items as fallback.");
    return { freshArticles: articles.slice(0, 5), filteredCount: 0 };
  }

  return { freshArticles, filteredCount };
}

/**
 * Clears companion memory (used for resetting preferences)
 */
export function clearCompanionMemory(): void {
  try {
    localStorage.removeItem(COMPANION_MEMORY_STORAGE_KEY);
    console.log("[CompanionMemory] Memory cleared.");
  } catch (err) {
    console.warn("[CompanionMemory] Failed to clear memory:", err);
  }
}
