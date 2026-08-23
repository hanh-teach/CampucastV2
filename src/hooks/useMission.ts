/**
 * useMission Hook - V4 Architecture
 * Quản lý state Mission real-time cho React components
 * Tương thích với MissionIntelligenceWorkspace
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Mission, 
  MissionSummary, 
  MissionStatus,
  MissionStep,
  MissionFilter,
  CreateMissionDTO,
  UpdateMissionDTO,
  MissionEvent,
  isMissionRunning,
  isMissionFinished,
  DEFAULT_MISSION
} from "../types/v4/mission";
import {
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
} from "../services/missionService";
import { logger } from "../utils/logger";

// ============================================================
// HOOK OPTIONS
// ============================================================

interface UseMissionOptions {
  /** Auto-refresh interval (ms) */
  refreshInterval?: number;
  
  /** Auto-sync with Supabase */
  autoSync?: boolean;
  
  /** Mission ID để theo dõi (nếu có) */
  missionId?: string;
  
  /** Callback khi mission thay đổi */
  onMissionUpdate?: (mission: Mission) => void;
  
  /** Callback khi mission hoàn thành */
  onMissionComplete?: (mission: Mission) => void;
  
  /** Callback khi mission thất bại */
  onMissionFailed?: (mission: Mission) => void;
}

// ============================================================
// HOOK IMPLEMENTATION
// ============================================================

export function useMission(options: UseMissionOptions = {}) {
  const {
    refreshInterval = 30000,
    autoSync = true,
    missionId,
    onMissionUpdate,
    onMissionComplete,
    onMissionFailed,
  } = options;

  // State
  const [missions, setMissions] = useState<MissionSummary[]>([]);
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filter, setFilter] = useState<MissionFilter>({});
  const [selectedMissionId, setSelectedMissionId] = useState<string | undefined>(missionId);

  // Refs
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // ============================================================
  // LOAD MISSIONS
  // ============================================================

  const loadMissions = useCallback(async (forceRefresh: boolean = false) => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const missionList = await getMissionSummaries(filter, forceRefresh);
      
      if (isMountedRef.current) {
        setMissions(missionList);
        
        // Auto-select first mission if none selected
        if (!selectedMissionId && missionList.length > 0) {
          setSelectedMissionId(missionList[0].id);
        }
      }
    } catch (err: any) {
      logger.error("[useMission] Failed to load missions:", err);
      if (isMountedRef.current) {
        setError(err.message || "Failed to load missions");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [filter, selectedMissionId]);

  // ============================================================
  // LOAD CURRENT MISSION
  // ============================================================

  const loadCurrentMission = useCallback(async (id: string) => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const mission = await getMission(id);
      
      if (isMountedRef.current) {
        setCurrentMission(mission || null);
        
        if (mission) {
          onMissionUpdate?.(mission);
          
          if (mission.status === "completed") {
            onMissionComplete?.(mission);
          } else if (mission.status === "failed") {
            onMissionFailed?.(mission);
          }
        }
      }
    } catch (err: any) {
      logger.error(`[useMission] Failed to load mission ${id}:`, err);
      if (isMountedRef.current) {
        setError(err.message || "Failed to load mission");
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [onMissionUpdate, onMissionComplete, onMissionFailed]);

  // ============================================================
  // CREATE MISSION
  // ============================================================

  const createNewMission = useCallback(async (dto: CreateMissionDTO): Promise<Mission | null> => {
    try {
      setLoading(true);
      setError(null);

      const mission = await createMission(dto);
      
      if (isMountedRef.current && mission) {
        setSelectedMissionId(mission.id);
        setCurrentMission(mission);
        await loadMissions(true);
        return mission;
      }
      
      return null;
    } catch (err: any) {
      logger.error("[useMission] Failed to create mission:", err);
      setError(err.message || "Failed to create mission");
      return null;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [loadMissions]);

  // ============================================================
  // UPDATE MISSION
  // ============================================================

  const updateExistingMission = useCallback(async (
    id: string,
    dto: UpdateMissionDTO
  ): Promise<Mission | null> => {
    try {
      setLoading(true);
      setError(null);

      const mission = await updateMission(id, dto);
      
      if (isMountedRef.current && mission) {
        setCurrentMission(mission);
        await loadMissions(true);
        return mission;
      }
      
      return null;
    } catch (err: any) {
      logger.error(`[useMission] Failed to update mission ${id}:`, err);
      setError(err.message || "Failed to update mission");
      return null;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [loadMissions]);

  // ============================================================
  // ADD STEP
  // ============================================================

  const addStep = useCallback(async (
    id: string,
    step: Omit<MissionStep, "id" | "correlationId" | "schemaVersion">
  ): Promise<Mission | null> => {
    try {
      const mission = await addMissionStep(id, step);
      
      if (isMountedRef.current && mission) {
        setCurrentMission(mission);
        await loadMissions(true);
        return mission;
      }
      
      return null;
    } catch (err: any) {
      logger.error(`[useMission] Failed to add step to mission ${id}:`, err);
      setError(err.message || "Failed to add step");
      return null;
    }
  }, [loadMissions]);

  // ============================================================
  // DELETE MISSION
  // ============================================================

  const deleteExistingMission = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = await deleteMission(id);
      
      if (isMountedRef.current && success) {
        if (selectedMissionId === id) {
          setSelectedMissionId(undefined);
          setCurrentMission(null);
        }
        await loadMissions(true);
        return true;
      }
      
      return false;
    } catch (err: any) {
      logger.error(`[useMission] Failed to delete mission ${id}:`, err);
      setError(err.message || "Failed to delete mission");
      return false;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [selectedMissionId, loadMissions]);

  // ============================================================
  // ABORT MISSION
  // ============================================================

  const abortExistingMission = useCallback(async (id: string): Promise<Mission | null> => {
    try {
      const mission = await abortMission(id);
      
      if (isMountedRef.current && mission) {
        setCurrentMission(mission);
        await loadMissions(true);
        return mission;
      }
      
      return null;
    } catch (err: any) {
      logger.error(`[useMission] Failed to abort mission ${id}:`, err);
      setError(err.message || "Failed to abort mission");
      return null;
    }
  }, [loadMissions]);

  // ============================================================
  // CLEAR ALL MISSIONS
  // ============================================================

  const clearAll = useCallback(async (): Promise<number> => {
    try {
      setLoading(true);
      setError(null);

      const count = await clearAllMissions();
      
      if (isMountedRef.current) {
        setSelectedMissionId(undefined);
        setCurrentMission(null);
        await loadMissions(true);
        return count;
      }
      
      return 0;
    } catch (err: any) {
      logger.error("[useMission] Failed to clear missions:", err);
      setError(err.message || "Failed to clear missions");
      return 0;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [loadMissions]);

  // ============================================================
  // SELECT MISSION
  // ============================================================

  const selectMission = useCallback((id: string | undefined) => {
    setSelectedMissionId(id);
    if (!id) {
      setCurrentMission(null);
    }
  }, []);

  // ============================================================
  // REFRESH
  // ============================================================

  const refresh = useCallback(async () => {
    await loadMissions(true);
    if (selectedMissionId) {
      await loadCurrentMission(selectedMissionId);
    }
  }, [loadMissions, loadCurrentMission, selectedMissionId]);

  // ============================================================
  // EFFECTS
  // ============================================================

  // Load missions on mount and filter change
  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  // Load current mission when selected ID changes
  useEffect(() => {
    if (selectedMissionId) {
      loadCurrentMission(selectedMissionId);
    } else {
      setCurrentMission(null);
    }
  }, [selectedMissionId, loadCurrentMission]);

  // Subscribe to mission events
  useEffect(() => {
    const unsubscribe = subscribeToMissionEvents((event: MissionEvent) => {
      if (!isMountedRef.current) return;

      // Auto-refresh on events
      if (event.missionId === selectedMissionId || event.missionId === "all") {
        refresh();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [selectedMissionId, refresh]);

  // Auto-refresh timer
  useEffect(() => {
    if (refreshInterval > 0 && autoSync) {
      refreshTimerRef.current = setInterval(() => {
        refresh();
      }, refreshInterval);

      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
      };
    }
  }, [refreshInterval, autoSync, refresh]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  // ============================================================
  // RETURN
  // ============================================================

  return {
    // State
    missions,
    currentMission,
    loading,
    error,
    isSyncing,
    filter,
    selectedMissionId,

    // Actions
    loadMissions,
    loadCurrentMission,
    createMission: createNewMission,
    updateMission: updateExistingMission,
    addStep,
    deleteMission: deleteExistingMission,
    abortMission: abortExistingMission,
    clearAllMissions: clearAll,
    selectMission,
    refresh,
    setFilter,

    // Helpers
    isRunning: currentMission ? isMissionRunning(currentMission.status) : false,
    isFinished: currentMission ? isMissionFinished(currentMission.status) : false,
    isIdle: currentMission?.status === "idle",
    isCompleted: currentMission?.status === "completed",
    isFailed: currentMission?.status === "failed",
    isAborted: currentMission?.status === "aborted",

    // Progress
    progress: currentMission 
      ? Math.round((currentMission.completedSteps / Math.max(currentMission.totalSteps, 1)) * 100)
      : 0,
  };
}

// ============================================================
// TYPE GUARDS
// ============================================================

export function useMissionWithId(missionId: string, options?: Omit<UseMissionOptions, "missionId">) {
  return useMission({
    ...options,
    missionId,
  });
}

export default useMission;