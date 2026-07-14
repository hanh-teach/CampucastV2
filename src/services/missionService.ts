/**
 * Mission Service - V4 Architecture
 * Quản lý CRUD Mission với IndexedDB + Supabase sync
 * Tương thích với MissionIntelligenceWorkspace
 */

import { openDB, IDBPDatabase } from "idb";
import { 
  Mission, 
  MissionSummary, 
  MissionStep, 
  MissionStatus,
  MissionFilter,
  CreateMissionDTO,
  UpdateMissionDTO,
  MissionEvent,
  MissionEventCallback,
  isMissionFinished,
  DEFAULT_MISSION
} from "../types/v4/mission";
import { getSupabaseClientAsync } from "./supabaseClient";
import { logger } from "../utils/logger";
import { telemetry } from "./telemetryService";
import { v4 as uuidv4 } from "uuid";

// ============================================================
// CONSTANTS
// ============================================================

const DB_NAME = "commutecast_mission_db";
const DB_VERSION = 1;
const MISSION_STORE = "missions";
const MISSION_QUEUE_STORE = "mission_queue";
const MISSION_CACHE_KEY = "commutecast_missions_cache";

const SYNC_DEBOUNCE_MS = 5000;

// ============================================================
// DATABASE SETUP
// ============================================================

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store cho missions
      if (!db.objectStoreNames.contains(MISSION_STORE)) {
        const store = db.createObjectStore(MISSION_STORE, { keyPath: "id" });
        store.createIndex("status", "status");
        store.createIndex("type", "type");
        store.createIndex("priority", "priority");
        store.createIndex("createdAt", "createdAt");
        store.createIndex("updatedAt", "updatedAt");
        store.createIndex("userId", "userId");
        store.createIndex("status_created", ["status", "createdAt"]);
      }

      // Store cho sync queue
      if (!db.objectStoreNames.contains(MISSION_QUEUE_STORE)) {
        const queue = db.createObjectStore(MISSION_QUEUE_STORE, { 
          keyPath: "id",
          autoIncrement: true 
        });
        queue.createIndex("synced", "synced");
        queue.createIndex("createdAt", "createdAt");
      }
    },
  });

  return dbInstance;
}

// ============================================================
// INDEXEDDB OPERATIONS
// ============================================================

/**
 * Lưu mission vào IndexedDB
 */
async function saveMissionToDB(mission: Mission): Promise<void> {
  try {
    const db = await getDB();
    await db.put(MISSION_STORE, mission);
    logger.info(`[MissionService] Saved mission ${mission.id} to IndexedDB`);
  } catch (error) {
    logger.error("[MissionService] Failed to save mission to IndexedDB:", error);
    throw error;
  }
}

/**
 * Lấy mission từ IndexedDB
 */
async function getMissionFromDB(id: string): Promise<Mission | undefined> {
  try {
    const db = await getDB();
    return await db.get(MISSION_STORE, id);
  } catch (error) {
    logger.error(`[MissionService] Failed to get mission ${id} from IndexedDB:`, error);
    return undefined;
  }
}

/**
 * Lấy tất cả missions từ IndexedDB
 */
async function getAllMissionsFromDB(filter?: MissionFilter): Promise<Mission[]> {
  try {
    const db = await getDB();
    let missions: Mission[] = [];

    if (filter?.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      const tx = db.transaction(MISSION_STORE, "readonly");
      let allMissions: Mission[] = [];

      for (const status of statuses) {
        const range = IDBKeyRange.only(status);
        const items = await tx.store.index("status").getAll(range);
        allMissions = allMissions.concat(items);
      }

      // Remove duplicates
      const seen = new Set();
      missions = allMissions.filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
    } else {
      missions = await db.getAll(MISSION_STORE);
    }

    // Apply filters
    if (filter) {
      if (filter.type) {
        const types = Array.isArray(filter.type) ? filter.type : [filter.type];
        missions = missions.filter(m => types.includes(m.type));
      }
      if (filter.priority) {
        const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
        missions = missions.filter(m => priorities.includes(m.priority));
      }
      if (filter.language) {
        missions = missions.filter(m => m.language === filter.language);
      }
      if (filter.topic) {
        missions = missions.filter(m => m.topic?.toLowerCase().includes(filter.topic!.toLowerCase()));
      }
      if (filter.fromDate) {
        const from = new Date(filter.fromDate).getTime();
        missions = missions.filter(m => new Date(m.createdAt).getTime() >= from);
      }
      if (filter.toDate) {
        const to = new Date(filter.toDate).getTime();
        missions = missions.filter(m => new Date(m.createdAt).getTime() <= to);
      }
      if (filter.userId) {
        missions = missions.filter(m => m.userId === filter.userId);
      }
      if (filter.tags?.length) {
        missions = missions.filter(m => 
          m.tags?.some(tag => filter.tags!.includes(tag))
        );
      }

      // Sort
      if (filter.sortBy) {
        const sortField = filter.sortBy;
        const sortOrder = filter.sortOrder || "desc";
        missions.sort((a, b) => {
          const aVal = a[sortField as keyof Mission];
          const bVal = b[sortField as keyof Mission];
          if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
          if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
          return 0;
        });
      }

      // Paginate
      if (filter.limit !== undefined) {
        const offset = filter.offset || 0;
        missions = missions.slice(offset, offset + filter.limit);
      }
    }

    return missions;
  } catch (error) {
    logger.error("[MissionService] Failed to get missions from IndexedDB:", error);
    return [];
  }
}

/**
 * Xóa mission khỏi IndexedDB
 */
async function deleteMissionFromDB(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(MISSION_STORE, id);
    logger.info(`[MissionService] Deleted mission ${id} from IndexedDB`);
  } catch (error) {
    logger.error(`[MissionService] Failed to delete mission ${id} from IndexedDB:`, error);
    throw error;
  }
}

// ============================================================
// SYNC QUEUE OPERATIONS
// ============================================================

interface SyncQueueItem {
  id?: number;
  missionId: string;
  operation: "create" | "update" | "delete";
  data: any;
  synced: boolean;
  createdAt: number;
  retryCount: number;
}

async function addToSyncQueue(
  missionId: string,
  operation: "create" | "update" | "delete",
  data: any
): Promise<void> {
  try {
    const db = await getDB();
    const item: SyncQueueItem = {
      missionId,
      operation,
      data,
      synced: false,
      createdAt: Date.now(),
      retryCount: 0,
    };
    await db.add(MISSION_QUEUE_STORE, item);
    logger.info(`[MissionService] Added ${operation} operation for mission ${missionId} to sync queue`);
    
    // Trigger sync
    triggerSync();
  } catch (error) {
    logger.error("[MissionService] Failed to add to sync queue:", error);
  }
}

async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  try {
    const db = await getDB();
    return await db.getAllFromIndex(MISSION_QUEUE_STORE, "synced", IDBKeyRange.only(false));
  } catch (error) {
    logger.error("[MissionService] Failed to get pending sync items:", error);
    return [];
  }
}

async function markSyncItemSynced(id: number): Promise<void> {
  try {
    const db = await getDB();
    const item = await db.get(MISSION_QUEUE_STORE, id);
    if (item) {
      item.synced = true;
      await db.put(MISSION_QUEUE_STORE, item);
    }
  } catch (error) {
    logger.error(`[MissionService] Failed to mark sync item ${id} as synced:`, error);
  }
}

// ============================================================
// SUPABASE SYNC
// ============================================================

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let isSyncing = false;
const syncCallbacks: MissionEventCallback[] = [];

function triggerSync() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    processSyncQueue().catch(err => {
      logger.error("[MissionService] Sync process failed:", err);
    });
  }, SYNC_DEBOUNCE_MS);
}

async function processSyncQueue(): Promise<void> {
  if (isSyncing) {
    logger.info("[MissionService] Sync already in progress, skipping...");
    return;
  }

  try {
    isSyncing = true;
    const items = await getPendingSyncItems();
    
    if (items.length === 0) {
      logger.info("[MissionService] No pending sync items");
      return;
    }

    logger.info(`[MissionService] Processing ${items.length} sync items...`);

    const supabase = await getSupabaseClientAsync();
    if (!supabase) {
      logger.warn("[MissionService] Supabase not available, skipping sync");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      logger.warn("[MissionService] User not authenticated, skipping sync");
      return;
    }

    const userId = session.user.id;
    const successfulIds: number[] = [];

    for (const item of items) {
      try {
        let result;
        const mission = item.data;

        switch (item.operation) {
          case "create":
          case "update":
            result = await supabase
              .from("missions")
              .upsert({
                ...mission,
                user_id: userId,
                updated_at: new Date().toISOString(),
              }, { onConflict: "id" });
            break;
          case "delete":
            result = await supabase
              .from("missions")
              .delete()
              .eq("id", item.missionId)
              .eq("user_id", userId);
            break;
        }

        if (result?.error) {
          logger.error(`[MissionService] Sync failed for ${item.missionId}:`, result.error);
          item.retryCount++;
          if (item.retryCount > 3) {
            logger.error(`[MissionService] Sync item ${item.id} exceeded retry limit, marking as synced`);
            successfulIds.push(item.id!);
          }
          continue;
        }

        successfulIds.push(item.id!);
        logger.info(`[MissionService] Synced ${item.operation} for mission ${item.missionId}`);
      } catch (err) {
        logger.error(`[MissionService] Error syncing item ${item.id}:`, err);
      }
    }

    // Mark successful items as synced
    for (const id of successfulIds) {
      await markSyncItemSynced(id);
    }

    logger.info(`[MissionService] Sync completed. ${successfulIds.length}/${items.length} items synced.`);

    // Broadcast sync event
    broadcastSyncEvent({
      type: "sync_completed",
      missionId: "all",
      timestamp: new Date().toISOString(),
      data: { synced: successfulIds.length }
    });

  } catch (error) {
    logger.error("[MissionService] Sync process error:", error);
  } finally {
    isSyncing = false;
  }
}

// ============================================================
// EVENT BROADCASTING
// ============================================================

function broadcastSyncEvent(event: MissionEvent) {
  for (const callback of syncCallbacks) {
    try {
      callback(event);
    } catch (err) {
      logger.error("[MissionService] Error in sync callback:", err);
    }
  }

  // Dispatch DOM event for React hooks
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mission-sync-updated", {
      detail: event
    }));
  }
}

export function subscribeToMissionEvents(callback: MissionEventCallback): () => void {
  syncCallbacks.push(callback);
  return () => {
    const index = syncCallbacks.indexOf(callback);
    if (index !== -1) {
      syncCallbacks.splice(index, 1);
    }
  };
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Tạo mission mới
 */
export async function createMission(
  dto: CreateMissionDTO,
  userId?: string
): Promise<Mission> {
  const now = new Date().toISOString();
  const mission: Mission = {
    id: uuidv4(),
    name: dto.name,
    type: dto.type,
    status: "idle",
    priority: dto.priority || "medium",
    language: dto.language || "vi",
    topic: dto.topic,
    config: {
      name: dto.name,
      type: dto.type,
      priority: dto.priority || "medium",
      language: dto.language || "vi",
      topic: dto.topic,
      feedIds: dto.feedIds || [],
      articleIds: dto.articleIds || [],
      options: dto.options || {
        voice: "vi-HN",
        tone: "conversational",
        emotion: "cheerful",
        publishPodcast: false,
        aiMode: "balanced",
      },
    },
    steps: [],
    confidence: 0,
    totalSteps: 0,
    completedSteps: 0,
    createdAt: now,
    updatedAt: now,
    userId,
    tags: [],
  };

  try {
    // Save to IndexedDB
    await saveMissionToDB(mission);

    // Add to sync queue
    await addToSyncQueue(mission.id, "create", mission);

    // Track telemetry
    telemetry.track("mission_created", {
      missionId: mission.id,
      type: mission.type,
      priority: mission.priority,
    });

    // Broadcast event
    broadcastSyncEvent({
      type: "step_added",
      missionId: mission.id,
      timestamp: now,
      data: mission,
    });

    logger.info(`[MissionService] Created mission: ${mission.id} (${mission.name})`);
    return mission;
  } catch (error) {
    logger.error("[MissionService] Failed to create mission:", error);
    throw error;
  }
}

/**
 * Lấy mission theo ID
 */
export async function getMission(id: string): Promise<Mission | undefined> {
  try {
    // Try IndexedDB first
    let mission = await getMissionFromDB(id);
    if (mission) return mission;

    // Fallback to Supabase
    const supabase = await getSupabaseClientAsync();
    if (supabase) {
      const { data } = await supabase
        .from("missions")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (data) {
        mission = data as Mission;
        // Cache back to IndexedDB
        await saveMissionToDB(mission);
        return mission;
      }
    }

    return undefined;
  } catch (error) {
    logger.error(`[MissionService] Failed to get mission ${id}:`, error);
    return undefined;
  }
}

/**
 * Lấy danh sách missions
 */
export async function getMissions(
  filter?: MissionFilter,
  forceRefresh: boolean = false
): Promise<Mission[]> {
  try {
    // If force refresh, try Supabase first
    if (forceRefresh) {
      const supabase = await getSupabaseClientAsync();
      if (supabase) {
        let query = supabase.from("missions").select("*");
        
        if (filter?.status) {
          const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
          query = query.in("status", statuses);
        }
        if (filter?.type) {
          const types = Array.isArray(filter.type) ? filter.type : [filter.type];
          query = query.in("type", types);
        }
        if (filter?.priority) {
          const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
          query = query.in("priority", priorities);
        }
        if (filter?.language) {
          query = query.eq("language", filter.language);
        }
        if (filter?.topic) {
          query = query.ilike("topic", `%${filter.topic}%`);
        }
        if (filter?.userId) {
          query = query.eq("user_id", filter.userId);
        }

        const { data, error } = await query
          .order(filter?.sortBy || "createdAt", {
            ascending: filter?.sortOrder === "asc",
          })
          .range(
            filter?.offset || 0,
            (filter?.offset || 0) + (filter?.limit || 50) - 1
          );

        if (!error && data) {
          // Cache all to IndexedDB
          for (const mission of data as Mission[]) {
            await saveMissionToDB(mission);
          }
          return data as Mission[];
        }
      }
    }

    // Fallback to IndexedDB
    return await getAllMissionsFromDB(filter);
  } catch (error) {
    logger.error("[MissionService] Failed to get missions:", error);
    return [];
  }
}

/**
 * Lấy tóm tắt missions (cho danh sách)
 */
export async function getMissionSummaries(
  filter?: MissionFilter,
  forceRefresh: boolean = false
): Promise<MissionSummary[]> {
  const missions = await getMissions(filter, forceRefresh);
  return missions.map(m => ({
    id: m.id,
    name: m.name,
    type: m.type,
    status: m.status,
    priority: m.priority,
    confidence: m.confidence,
    totalSteps: m.totalSteps,
    completedSteps: m.completedSteps,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    language: m.language,
    topic: m.topic,
  }));
}

/**
 * Cập nhật mission
 */
export async function updateMission(
  id: string,
  dto: UpdateMissionDTO
): Promise<Mission | undefined> {
  try {
    const mission = await getMissionFromDB(id);
    if (!mission) return undefined;

    // Merge updates
    const updated: Mission = {
      ...mission,
      ...dto,
      config: dto.config ? { ...mission.config, ...dto.config } : mission.config,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate completion
    if (updated.steps.length > 0) {
      updated.totalSteps = updated.steps.length;
      updated.completedSteps = updated.steps.filter(s => 
        s.status === "success" || s.status === "skipped"
      ).length;
    }

    // Update confidence based on steps
    if (updated.totalSteps > 0) {
      updated.confidence = Math.round(
        (updated.completedSteps / updated.totalSteps) * 100
      );
    }

    // Save to IndexedDB
    await saveMissionToDB(updated);

    // Add to sync queue
    await addToSyncQueue(id, "update", updated);

    // Track telemetry
    telemetry.track("mission_updated", {
      missionId: id,
      status: updated.status,
      confidence: updated.confidence,
    });

    // Broadcast event
    broadcastSyncEvent({
      type: "step_updated",
      missionId: id,
      timestamp: new Date().toISOString(),
      data: updated,
    });

    logger.info(`[MissionService] Updated mission: ${id}`);
    return updated;
  } catch (error) {
    logger.error(`[MissionService] Failed to update mission ${id}:`, error);
    throw error;
  }
}

/**
 * Thêm step vào mission
 */
export async function addMissionStep(
  missionId: string,
  step: Omit<MissionStep, "id" | "correlationId" | "schemaVersion">
): Promise<Mission | undefined> {
  const mission = await getMissionFromDB(missionId);
  if (!mission) return undefined;

  const newStep: MissionStep = {
    ...step,
    id: uuidv4(),
    correlationId: `${missionId}-${Date.now()}`,
    schemaVersion: "1.0",
  };

  mission.steps.push(newStep);
  mission.updatedAt = new Date().toISOString();
  mission.totalSteps = mission.steps.length;
  mission.completedSteps = mission.steps.filter(s => 
    s.status === "success" || s.status === "skipped"
  ).length;

  // Update status if step is running
  if (step.status === "in_progress" && mission.status === "idle") {
    mission.status = "running";
  }

  // Check if all steps completed
  const allCompleted = mission.steps.every(s => 
    s.status === "success" || s.status === "skipped" || s.status === "failed"
  );
  if (allCompleted && mission.steps.length > 0) {
    const hasFailure = mission.steps.some(s => s.status === "failed");
    mission.status = hasFailure ? "failed" : "completed";
    if (mission.status === "completed") {
      mission.completedAt = new Date().toISOString();
    }
  }

  // Update confidence
  if (mission.totalSteps > 0) {
    mission.confidence = Math.round(
      (mission.completedSteps / mission.totalSteps) * 100
    );
  }

  await saveMissionToDB(mission);
  await addToSyncQueue(missionId, "update", mission);

  // Broadcast event
  broadcastSyncEvent({
    type: "step_added",
    missionId: missionId,
    timestamp: new Date().toISOString(),
    data: { step: newStep, mission },
  });

  return mission;
}

/**
 * Xóa mission
 */
export async function deleteMission(id: string): Promise<boolean> {
  try {
    const mission = await getMissionFromDB(id);
    if (!mission) return false;

    // Delete from IndexedDB
    await deleteMissionFromDB(id);

    // Add to sync queue
    await addToSyncQueue(id, "delete", { id });

    // Track telemetry
    telemetry.track("mission_deleted", {
      missionId: id,
      type: mission.type,
    });

    // Broadcast event
    broadcastSyncEvent({
      type: "step_updated",
      missionId: id,
      timestamp: new Date().toISOString(),
      data: { deleted: true },
    });

    logger.info(`[MissionService] Deleted mission: ${id}`);
    return true;
  } catch (error) {
    logger.error(`[MissionService] Failed to delete mission ${id}:`, error);
    throw error;
  }
}

/**
 * Hủy bỏ mission đang chạy
 */
export async function abortMission(id: string): Promise<Mission | undefined> {
  const mission = await getMissionFromDB(id);
  if (!mission) return undefined;

  if (!isMissionFinished(mission.status)) {
    mission.status = "aborted";
    mission.updatedAt = new Date().toISOString();

    // Add abort step
    await addMissionStep(id, {
      timestamp: new Date().toISOString(),
      actor: "Operator",
      event: "Mission aborted by user",
      duration: 0,
      status: "skipped",
      retryCount: 0,
    });

    return mission;
  }

  return mission;
}

/**
 * Xóa tất cả missions (cẩn thận!)
 */
export async function clearAllMissions(): Promise<number> {
  try {
    const missions = await getAllMissionsFromDB();
    const db = await getDB();
    const tx = db.transaction(MISSION_STORE, "readwrite");
    await tx.store.clear();
    await tx.done;

    for (const mission of missions) {
      await addToSyncQueue(mission.id, "delete", { id: mission.id });
    }

    logger.info(`[MissionService] Cleared ${missions.length} missions`);
    return missions.length;
  } catch (error) {
    logger.error("[MissionService] Failed to clear missions:", error);
    throw error;
  }
}

/**
 * Khởi tạo bảng Supabase (chạy một lần)
 */
export async function setupMissionTable(): Promise<void> {
  const supabase = await getSupabaseClientAsync();
  if (!supabase) {
    logger.warn("[MissionService] Supabase not available, skipping table setup");
    return;
  }

  try {
    // Kiểm tra bảng có tồn tại không bằng cách thử query
    const { error } = await supabase
      .from("missions")
      .select("id")
      .limit(1);

    if (error && error.message.includes("does not exist")) {
      logger.warn("[MissionService] 'missions' table does not exist. Please create it in Supabase.");
      logger.info(`[MissionService] SQL to create table:
        CREATE TABLE missions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id),
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'idle',
          priority TEXT NOT NULL DEFAULT 'medium',
          language TEXT NOT NULL DEFAULT 'vi',
          topic TEXT,
          config JSONB NOT NULL,
          steps JSONB[] DEFAULT '{}',
          result JSONB,
          confidence INTEGER DEFAULT 0,
          total_steps INTEGER DEFAULT 0,
          completed_steps INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          started_at TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          tags TEXT[] DEFAULT '{}',
          metadata JSONB
        );
      `);
    }
  } catch (error) {
    logger.error("[MissionService] Failed to setup mission table:", error);
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  createMission,
  getMission,
  getMissions,
  getMissionSummaries,
  updateMission,
  addMissionStep,
  deleteMission,
  abortMission,
  clearAllMissions,
  subscribeToMissionEvents,
  setupMissionTable,
  processSyncQueue,
};