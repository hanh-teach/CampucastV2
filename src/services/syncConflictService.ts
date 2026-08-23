import { SyncConflictItem } from "../types";
import { saveBriefing } from "./storageService";

export const SYNC_CONFLICTS_STORAGE_KEY = "commutecast_sync_conflicts_v1";
export const AUTO_RESOLVE_CONFLICTS_STORAGE_KEY = "commutecast_auto_resolve_conflicts_v1";

/**
 * Gets whether 'Auto-Resolve Conflicts' (by most recent timestamp) is enabled
 */
export function getAutoResolveConflictsSetting(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const val = localStorage.getItem(AUTO_RESOLVE_CONFLICTS_STORAGE_KEY);
    return val === "true";
  } catch (err) {
    console.error("[SyncConflictService] Failed to read auto-resolve conflicts setting:", err);
    return false;
  }
}

/**
 * Sets 'Auto-Resolve Conflicts' setting and automatically resolves pending conflicts if enabled
 */
export async function setAutoResolveConflictsSetting(enabled: boolean): Promise<SyncConflictItem[]> {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(AUTO_RESOLVE_CONFLICTS_STORAGE_KEY, enabled ? "true" : "false");
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("commutecast-auto-resolve-setting-updated", { detail: enabled }));
    }

    if (enabled) {
      // Automatically resolve all currently pending conflicts by comparing timestamps
      const current = getSyncConflicts();
      const pending = current.filter(c => c.status === "pending");

      for (const conflict of pending) {
        const localTime = new Date(conflict.localVersion.updatedAt).getTime();
        const remoteTime = new Date(conflict.remoteVersion.updatedAt).getTime();
        const resolution = localTime >= remoteTime ? "local" : "remote";
        await resolveSyncConflict(conflict.id, resolution);
      }
    }
  } catch (err) {
    console.error("[SyncConflictService] Failed to set auto-resolve conflicts setting:", err);
  }

  return getSyncConflicts();
}

/**
 * Retrieves all stored sync conflict records
 */
export function getSyncConflicts(): SyncConflictItem[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(SYNC_CONFLICTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("[SyncConflictService] Failed to load sync conflicts:", err);
    return [];
  }
}

/**
 * Persists the list of sync conflicts and notifies listeners
 */
export function saveSyncConflicts(conflicts: SyncConflictItem[]): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(SYNC_CONFLICTS_STORAGE_KEY, JSON.stringify(conflicts));
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("commutecast-sync-conflicts-updated", { detail: conflicts }));
    }
  } catch (err) {
    console.error("[SyncConflictService] Failed to save sync conflicts:", err);
  }
}

/**
 * Adds a new detected sync conflict if it does not already exist
 */
export function recordSyncConflict(conflict: Omit<SyncConflictItem, "id" | "detectedAt" | "status">): SyncConflictItem {
  const current = getSyncConflicts();
  const existingIndex = current.findIndex(c => c.fileId === conflict.fileId && c.status === "pending");

  const newConflict: SyncConflictItem = {
    ...conflict,
    id: `conflict-${conflict.fileId}-${Date.now()}`,
    detectedAt: new Date().toISOString(),
    status: "pending"
  };

  let updated: SyncConflictItem[];
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = newConflict;
  } else {
    updated = [newConflict, ...current];
  }

  saveSyncConflicts(updated);

  // If auto-resolve is enabled, immediately resolve this conflict based on most recent timestamp
  if (getAutoResolveConflictsSetting()) {
    const localTime = new Date(newConflict.localVersion.updatedAt).getTime();
    const remoteTime = new Date(newConflict.remoteVersion.updatedAt).getTime();
    const resolution = localTime >= remoteTime ? "local" : "remote";
    resolveSyncConflict(newConflict.id, resolution).catch(err => {
      console.error("[SyncConflictService] Failed to auto-resolve conflict on record:", err);
    });
  }

  return newConflict;
}

/**
 * Resolves a single sync conflict by choosing either 'local' or 'remote'
 */
export async function resolveSyncConflict(
  conflictId: string, 
  resolution: "local" | "remote" | "merge"
): Promise<SyncConflictItem[]> {
  const current = getSyncConflicts();
  const target = current.find(c => c.id === conflictId);

  if (!target) return current;

  try {
    if (resolution === "remote") {
      // User chose remote version: apply remote data to local storage
      if (target.entityType === "briefing" && target.remoteVersion.details) {
        await saveBriefing(target.remoteVersion.details as any);
      } else if (target.entityType === "preference" && target.remoteVersion.details) {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("commute_cast_user_preferences", JSON.stringify(target.remoteVersion.details));
        }
      }
    } else if (resolution === "merge") {
      // Merge local and remote details (prefer local properties, fallback or combine remote fields)
      const mergedDetails = {
        ...(typeof target.remoteVersion.details === 'object' && target.remoteVersion.details !== null ? target.remoteVersion.details : {}),
        ...(typeof target.localVersion.details === 'object' && target.localVersion.details !== null ? target.localVersion.details : {}),
        mergedAt: new Date().toISOString()
      };
      if (target.entityType === "briefing") {
        await saveBriefing(mergedDetails as any);
      } else if (target.entityType === "preference") {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("commute_cast_user_preferences", JSON.stringify(mergedDetails));
        }
      }
    } else {
      // User chose local version: keep local data
      if (target.entityType === "briefing" && target.localVersion.details) {
        await saveBriefing(target.localVersion.details as any);
      } else if (target.entityType === "preference" && target.localVersion.details) {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("commute_cast_user_preferences", JSON.stringify(target.localVersion.details));
        }
      }
    }
  } catch (err) {
    console.error(`[SyncConflictService] Error applying resolution '${resolution}' for ${conflictId}:`, err);
  }

  // Remove resolved conflict or mark status
  const updated = current.filter(c => c.id !== conflictId);
  saveSyncConflicts(updated);
  return updated;
}

/**
 * Resolves all pending sync conflicts at once
 */
export async function resolveAllSyncConflicts(
  resolution: "local" | "remote" | "merge"
): Promise<SyncConflictItem[]> {
  const current = getSyncConflicts();
  const pending = current.filter(c => c.status === "pending");

  for (const conflict of pending) {
    await resolveSyncConflict(conflict.id, resolution);
  }

  return getSyncConflicts();
}

/**
 * Generates a sample/demo conflict item for testing and demonstration
 */
export function generateSampleConflict(): SyncConflictItem {
  const sample: Omit<SyncConflictItem, "id" | "detectedAt" | "status"> = {
    fileId: `briefing-${Date.now()}`,
    fileName: `daily-briefing-tech-${new Date().toISOString().slice(0, 10)}.json`,
    entityType: "briefing",
    localVersion: {
      updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
      sizeBytes: 4280,
      description: "Bản tóm tắt công nghệ với 5 chủ đề tin tức (Sửa cục bộ trên thiết bị)",
      details: {
        id: `briefing-${Date.now()}`,
        topic: "Công nghệ & AI",
        summaryText: "Bản tóm tắt tin tức công nghệ đã được bổ sung ghi chú cá nhân tại thiết bị cục bộ.",
        createdAt: new Date().toISOString()
      }
    },
    remoteVersion: {
      updatedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 mins ago
      sizeBytes: 4890,
      description: "Bản tóm tắt công nghệ từ đám mây Supabase (Cập nhật từ thiết bị di động)",
      details: {
        id: `briefing-${Date.now()}`,
        topic: "Công nghệ & AI",
        summaryText: "Bản tóm tắt tin tức công nghệ tự động đồng bộ từ phiên bản đám mây mới hơn.",
        createdAt: new Date().toISOString()
      }
    }
  };

  return recordSyncConflict(sample);
}

/**
 * Clears all conflicts from storage
 */
export function clearAllConflicts(): void {
  saveSyncConflicts([]);
}
