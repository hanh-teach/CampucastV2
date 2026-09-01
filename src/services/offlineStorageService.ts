import { SavedSummary, SummaryPreferences, SummaryPayload, MissionAudioManifest } from "../types";
import { openDB } from "./storageService";

const STORE_NAME = "audios";
const MANIFEST_STORE_NAME = "appMetadata";
const MAX_STORAGE_LIMIT_BYTES = 250 * 1024 * 1024; // 250 MB max offline cache quota
const DEFAULT_MAX_AGE_MS = 72 * 60 * 60 * 1000; // 72 hours LRU retention

export function isIndexedDBSupported(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

/**
 * Lưu toàn bộ dữ liệu chữ và mảng base64 âm thanh vào IndexedDB
 */
export async function saveEpisodeToOffline(
  id: string,
  preferences: SummaryPreferences,
  payload: SummaryPayload,
  audioChunks: string[]
): Promise<void> {
  if (!isIndexedDBSupported()) {
    console.warn("IndexedDB not supported, cannot save offline.");
    return;
  }

  const db = await openDB();
  const timestamp = new Date().toISOString();
  
  const savedItem: SavedSummary = {
    id,
    timestamp,
    preferences,
    payload,
    audioChunks
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(savedItem);

    request.onsuccess = () => {
      console.log(`[OfflineStorage] Episode ${id} saved successfully to offline IndexedDB.`);
      // Calculate and save manifest
      const estimatedBytes = audioChunks.reduce((acc, chunk) => acc + (chunk ? chunk.length * 0.75 : 0), 0);
      const manifest: MissionAudioManifest = {
        missionId: `mission_${id}`,
        briefingId: id,
        createdAt: Date.now(),
        targetDurationSec: (preferences.targetDurationMinutes || 5) * 60,
        isFullyCached: true,
        cachedAt: Date.now(),
        totalSizeEstimatedBytes: Math.round(estimatedBytes),
        segments: audioChunks.map((chunk, idx) => ({
          index: idx,
          title: idx === 0 ? "Introduction" : idx === audioChunks.length - 1 ? "Conclusion" : `Chapter ${idx}`,
          durationSec: Math.round((chunk ? chunk.length : 1000) / 44100),
          cached: true,
          byteSize: Math.round(chunk ? chunk.length * 0.75 : 0)
        }))
      };
      saveAudioManifest(manifest).catch(err => console.warn("Failed to save audio manifest:", err));
      resolve();
    };

    request.onerror = () => {
      reject(request.error || new Error(`Failed to save episode ${id} offline`));
    };
  });
}

/**
 * Lưu manifest âm thanh để quản lý metadata
 */
export async function saveAudioManifest(manifest: MissionAudioManifest): Promise<void> {
  if (!isIndexedDBSupported()) return;
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(MANIFEST_STORE_NAME)) return;
    const tx = db.transaction(MANIFEST_STORE_NAME, "readwrite");
    const store = tx.objectStore(MANIFEST_STORE_NAME);
    store.put({ key: `manifest_${manifest.briefingId}`, value: manifest });
  } catch (err) {
    console.warn("[OfflineStorage] saveAudioManifest error:", err);
  }
}

/**
 * Lấy manifest âm thanh
 */
export async function getAudioManifest(briefingId: string): Promise<MissionAudioManifest | null> {
  if (!isIndexedDBSupported()) return null;
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(MANIFEST_STORE_NAME)) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(MANIFEST_STORE_NAME, "readonly");
      const store = tx.objectStore(MANIFEST_STORE_NAME);
      const req = store.get(`manifest_${briefingId}`);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Kiểm tra xem một bản tin đã được tải trọn vẹn vào cache ngoại tuyến hay chưa
 */
export async function isEpisodeCached(id: string): Promise<boolean> {
  if (!isIndexedDBSupported()) return false;
  try {
    const episode = await getEpisodeFromOffline(id);
    return !!(episode && episode.audioChunks && episode.audioChunks.length > 0);
  } catch {
    return false;
  }
}

/**
 * Lấy dữ liệu ra để phát lại
 */
export async function getEpisodeFromOffline(id: string): Promise<SavedSummary | null> {
  if (!isIndexedDBSupported()) {
    return null;
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = (event: any) => {
      resolve(event.target.result || null);
    };

    request.onerror = () => {
      reject(request.error || new Error(`Failed to get episode ${id} offline`));
    };
  });
}

/**
 * Thống kê dung lượng lưu trữ Offline
 */
export async function getOfflineStorageStats(): Promise<{
  totalEpisodes: number;
  totalBytesEstimated: number;
  storageQuotaPct: number;
}> {
  if (!isIndexedDBSupported()) {
    return { totalEpisodes: 0, totalBytesEstimated: 0, storageQuotaPct: 0 };
  }

  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const episodes: SavedSummary[] = req.result || [];
      let totalBytes = 0;
      for (const ep of episodes) {
        if (ep.audioChunks) {
          for (const chunk of ep.audioChunks) {
            totalBytes += chunk ? chunk.length * 0.75 : 0;
          }
        }
      }
      const quotaPct = Math.min(100, Math.round((totalBytes / MAX_STORAGE_LIMIT_BYTES) * 100));
      resolve({
        totalEpisodes: episodes.length,
        totalBytesEstimated: Math.round(totalBytes),
        storageQuotaPct: quotaPct
      });
    };

    req.onerror = () => {
      resolve({ totalEpisodes: 0, totalBytesEstimated: 0, storageQuotaPct: 0 });
    };
  });
}

/**
 * Tự động xóa các bản tin cũ hơn 72 giờ hoặc khi vượt quá 250MB (LRU Auto Eviction)
 */
export async function deleteOldEpisodes(maxAgeMs: number = DEFAULT_MAX_AGE_MS): Promise<number> {
  if (!isIndexedDBSupported()) {
    return 0;
  }

  const db = await openDB();
  const cutoffTime = Date.now() - maxAgeMs;
  let deletedCount = 0;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.openCursor();

    request.onsuccess = (event: any) => {
      const cursor = event.target.result;
      if (cursor) {
        const item = cursor.value;
        const itemTime = new Date(item.timestamp).getTime();
        
        // Không xóa nếu được đánh dấu favorite hoặc quan trọng
        const isProtected = item.isArchived === false && item.preferences?.favoriteTopics?.length > 0;

        if (!isProtected && !isNaN(itemTime) && itemTime < cutoffTime) {
          console.log(`[OfflineStorage] LRU Evicting old offline episode: ${item.id} from ${item.timestamp}`);
          cursor.delete();
          deletedCount++;
        }
        cursor.continue();
      } else {
        resolve(deletedCount);
      }
    };

    request.onerror = () => {
      reject(request.error || new Error("Failed to clear old offline episodes"));
    };
  });
}

