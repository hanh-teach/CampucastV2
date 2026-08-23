import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabaseClientAsync } from "../services/supabaseClient";
import { 
  performFullSyncAsync, 
  processSyncQueueAsync, 
  isOnline,
  abortSync as abortSyncService,
  getSyncQueue,
  getSyncHistory,
  clearSyncHistory as clearSyncHistoryService
} from "../services/syncService";
import { User } from "@supabase/supabase-js";
import { cloudSyncStatus, CloudSyncState } from "../services/cloudSyncStatus";
import { logger } from "../utils/logger";
import { SyncHistoryEvent, SyncConflictItem } from "../types";
import { 
  getSyncConflicts, 
  resolveSyncConflict, 
  resolveAllSyncConflicts, 
  generateSampleConflict,
  getAutoResolveConflictsSetting,
  setAutoResolveConflictsSetting
} from "../services/syncConflictService";
import { recordSyncHistoryEvent } from "../services/syncService";

export type SyncStatus = "synced" | "syncing" | "offline" | "error" | "unauthenticated";

export const MAX_AUTO_RETRIES = 5;
export const INITIAL_BACKOFF_DELAY_MS = 2000; // 2 seconds
export const MAX_BACKOFF_DELAY_MS = 32000; // 32 seconds max

export function useSync() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("unauthenticated");
  const [cloudStatus, setCloudStatus] = useState<CloudSyncState>(cloudSyncStatus.getState());
  const [isOnlineState, setIsOnlineState] = useState(isOnline());
  const [isAborting, setIsAborting] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEvent[]>(() => getSyncHistory());
  const [conflicts, setConflicts] = useState<SyncConflictItem[]>(() => getSyncConflicts());
  const [autoResolveConflicts, setAutoResolveConflictsState] = useState<boolean>(() => getAutoResolveConflictsSetting());

  // Auto-retry state for exponential backoff
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  const [retryAttemptCount, setRetryAttemptCount] = useState(0);
  const [nextRetryDelayMs, setNextRetryDelayMs] = useState<number | null>(null);

  // Sync Success Toast state with 3-second auto-dismiss
  const [showSyncSuccessToast, setShowSyncSuccessToast] = useState(false);
  const syncToastTimerRef = useRef<any>(null);

  // Ref to block parallel sync runs
  const syncInProgressRef = useRef(false);
  // Ref for debounce timer
  const debounceTimerRef = useRef<any>(null);
  // Auto-retry refs
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<any>(null);
  const lastProcessedFailedEventIdRef = useRef<string | null>(null);

  // Helper to clear sync success toast timer
  const dismissSyncSuccessToast = useCallback(() => {
    if (syncToastTimerRef.current) {
      clearTimeout(syncToastTimerRef.current);
      syncToastTimerRef.current = null;
    }
    setShowSyncSuccessToast(false);
  }, []);

  // Helper to trigger 'Sync Successful' toast with 3-second auto-dismiss timer
  const triggerSyncSuccessToast = useCallback(() => {
    if (syncToastTimerRef.current) {
      clearTimeout(syncToastTimerRef.current);
    }
    setShowSyncSuccessToast(true);
    logger.info("[useSync] 'Sync Successful' toast notification shown. Automatically dismissing after 3 seconds.");

    syncToastTimerRef.current = setTimeout(() => {
      setShowSyncSuccessToast(false);
      syncToastTimerRef.current = null;
    }, 3000); // Auto-dismiss after 3000ms (3 seconds)
  }, []);

  // Helper to clear pending retry timer
  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setIsAutoRetrying(false);
    setNextRetryDelayMs(null);
  }, []);

  // Cancel exponential backoff auto-retry sequence manually
  const cancelAutoRetry = useCallback(() => {
    logger.info("[useSync] Exponential backoff auto-retry sequence cancelled.");
    clearRetryTimer();
    retryCountRef.current = 0;
    setRetryAttemptCount(0);
    lastProcessedFailedEventIdRef.current = null;
  }, [clearRetryTimer]);

  // Update pending sync queue length
  const updateQueueLength = useCallback(async () => {
    try {
      const queue = await getSyncQueue();
      setQueueLength(queue.length);
    } catch (e) {
      setQueueLength(0);
    }
  }, []);

  // Safe synchronization runner
  const safePerformSync = useCallback(async () => {
    if (syncInProgressRef.current) {
      logger.info("[useSync] Sync already in progress. Skipping concurrent run.");
      return;
    }

    if (!isOnline()) {
      setSyncStatus("offline");
      return;
    }

    if (typeof window !== "undefined" && ((window as any).isCommuteCastGeneratingBriefing || (window as any).isCommuteCastClearingCache)) {
      logger.info("[useSync] Audio generation or cache clearing is active. Deferring sync.");
      return;
    }

    try {
      syncInProgressRef.current = true;
      setSyncStatus("syncing");
      setIsAborting(false);
      dismissSyncSuccessToast();
      
      logger.info("[useSync] Starting full cloud-local batch synchronization...");
      const ok = await performFullSyncAsync();
      
      if (ok) {
        setSyncStatus("synced");
        triggerSyncSuccessToast();
      } else {
        const isNowOnline = isOnline();
        setSyncStatus(isNowOnline ? "synced" : "offline");
        if (isNowOnline) {
          triggerSyncSuccessToast();
        }
      }
    } catch (err: any) {
      logger.error("[useSync] Sync failed:", err);
      setSyncStatus("error");
    } finally {
      syncInProgressRef.current = false;
      setIsAborting(false);
      await updateQueueLength();
    }
  }, [dismissSyncSuccessToast, triggerSyncSuccessToast, updateQueueLength]);

  // Schedule exponential backoff auto-retry when a 'failed' event occurs in SyncHistory
  const scheduleExponentialBackoffRetry = useCallback((failedEvent: SyncHistoryEvent) => {
    if (retryCountRef.current >= MAX_AUTO_RETRIES) {
      logger.info(`[useSync] Max auto-retry limit (${MAX_AUTO_RETRIES}) reached for failed sync event '${failedEvent.id}'. Stopping auto-retry.`);
      clearRetryTimer();
      return;
    }

    if (!isOnline()) {
      logger.info("[useSync] Network is offline. Deferring exponential backoff auto-retry until online.");
      clearRetryTimer();
      return;
    }

    const currentAttempt = retryCountRef.current;
    // Delay calculation: INITIAL_BACKOFF_DELAY_MS * 2^attempt (2s, 4s, 8s, 16s, 32s)
    const delayMs = Math.min(INITIAL_BACKOFF_DELAY_MS * Math.pow(2, currentAttempt), MAX_BACKOFF_DELAY_MS);

    clearRetryTimer();
    setIsAutoRetrying(true);
    setRetryAttemptCount(currentAttempt + 1);
    setNextRetryDelayMs(delayMs);

    logger.info(`[useSync] Exponential backoff auto-retry #${currentAttempt + 1}/${MAX_AUTO_RETRIES} scheduled in ${delayMs}ms for failed sync event '${failedEvent.id}'`);

    retryTimerRef.current = setTimeout(async () => {
      logger.info(`[useSync] Executing exponential backoff auto-retry attempt #${currentAttempt + 1}/${MAX_AUTO_RETRIES}...`);
      retryCountRef.current = currentAttempt + 1;
      setIsAutoRetrying(false);
      setNextRetryDelayMs(null);

      try {
        const supabase = await getSupabaseClientAsync(true);
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await safePerformSync();
          }
        }
      } catch (err) {
        logger.error(`[useSync] Auto-retry attempt #${currentAttempt + 1} failed:`, err);
      }
    }, delayMs);
  }, [clearRetryTimer, safePerformSync]);

  // Debounced cloud synchronization
  const triggerDebouncedSync = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    updateQueueLength();

    debounceTimerRef.current = setTimeout(async () => {
      logger.info("[useSync] Debounce timer fired. Executing batch synchronization...");
      
      const supabase = await getSupabaseClientAsync();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await safePerformSync();
      }
    }, 4000);
  }, [safePerformSync, updateQueueLength]);

  // Abort synchronization manually
  const handleAbortSync = useCallback(() => {
    if (syncStatus === "syncing") {
      const confirmed = window.confirm(
        "Bạn có chắc muốn hủy đồng bộ?\nDữ liệu sẽ không được cập nhật lên cloud."
      );
      if (confirmed) {
        setIsAborting(true);
        const aborted = abortSyncService();
        if (!aborted) {
          setIsAborting(false);
          alert("Không có tiến trình đồng bộ nào để hủy.");
        } else {
          setSyncStatus("synced");
          setIsAborting(false);
          updateQueueLength();
        }
      }
    } else {
      alert("Không có tiến trình đồng bộ nào đang chạy.");
    }
  }, [syncStatus, updateQueueLength]);

  // Check active session on startup
  const checkSession = useCallback(async () => {
    const supabase = await getSupabaseClientAsync();
    if (!supabase) {
      setUser(null);
      setSyncStatus("unauthenticated");
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await safePerformSync();
      } else {
        setUser(null);
        setSyncStatus("unauthenticated");
      }
    } catch (err: any) {
      logger.error("[useSync] Auth check error:", err);
      setSyncStatus("error");
    } finally {
      setLoading(false);
      await updateQueueLength();
    }
  }, [safePerformSync, updateQueueLength]);

  // Trigger immediate synchronization manually
  const triggerSync = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    cancelAutoRetry();

    if (!isOnline()) {
      setSyncStatus("offline");
      return;
    }

    try {
      const supabase = await getSupabaseClientAsync(true); // Force connection and health check ping
      if (!supabase) {
        setSyncStatus("error");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        setSyncStatus("unauthenticated");
        return;
      }

      await safePerformSync();
    } catch (err: any) {
      logger.error("[useSync] Failed during manual triggerSync:", err);
      setSyncStatus("error");
    }
  }, [cancelAutoRetry, safePerformSync]);

  // Network and event listeners configuration
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function setupListeners() {
      try {
        const supabase = await getSupabaseClientAsync();
        if (!supabase) {
          setUser(null);
          setSyncStatus("unauthenticated");
          setLoading(false);
          return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          try {
            logger.info(`[useSync] Auth event: ${event}`, session?.user?.email);
            
            if (session?.user) {
              setUser(session.user);
              await safePerformSync();
            } else {
              setUser(null);
              setSyncStatus("unauthenticated");
            }
            setLoading(false);
            await updateQueueLength();
          } catch (e) {
            logger.error("[useSync] Error in onAuthStateChange handler:", e);
          }
        });

        unsubscribe = () => subscription.unsubscribe();
        await checkSession();
      } catch (err: any) {
        logger.error("[useSync] Failed to setup listeners:", err);
        setUser(null);
        setSyncStatus("error");
        setLoading(false);
      }
    }

    setupListeners();

    // Trigger on browser going online
    const handleOnline = async () => {
      setIsOnlineState(true);
      logger.info("[useSync] Browser went ONLINE. Verifying connection and processing queue...");
      
      const supabase = await getSupabaseClientAsync(true); // Force reconnect and health check ping
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setSyncStatus("syncing");
          const ok = await processSyncQueueAsync();
          if (ok) {
            await safePerformSync();
          } else {
            setSyncStatus("error");
            await updateQueueLength();
          }
        }
      }
    };

    // Trigger on browser going offline
    const handleOffline = () => {
      setIsOnlineState(false);
      logger.info("[useSync] Browser went OFFLINE.");
      setSyncStatus(prev => (prev === "unauthenticated" ? "unauthenticated" : "offline"));
    };

    // Trigger on queue update
    const handleQueueUpdated = () => {
      logger.info("[useSync] Sync queue updated. Debouncing cloud synchronization...");
      triggerDebouncedSync();
    };

    // Trigger on sync history update
    const handleHistoryUpdated = (e: any) => {
      const historyLog: SyncHistoryEvent[] = e?.detail ? e.detail : getSyncHistory();
      setSyncHistory(historyLog);

      if (historyLog && historyLog.length > 0) {
        const latest = historyLog[0];
        if (latest.status === "failed") {
          // If this is a new failure event ID, reset retry count to 0 for this event
          if (lastProcessedFailedEventIdRef.current !== latest.id) {
            retryCountRef.current = 0;
            lastProcessedFailedEventIdRef.current = latest.id;
          }
          scheduleExponentialBackoffRetry(latest);
        } else if (latest.status === "success") {
          // Sync succeeded! Reset backoff retry state
          retryCountRef.current = 0;
          lastProcessedFailedEventIdRef.current = null;
          setRetryAttemptCount(0);
          clearRetryTimer();
        }
      }
    };

    // Trigger on sync conflicts update
    const handleConflictsUpdated = (e: any) => {
      if (e?.detail) {
        setConflicts(e.detail);
      } else {
        setConflicts(getSyncConflicts());
      }
    };

    const handleAutoResolveSettingUpdated = (e: any) => {
      if (typeof e?.detail === "boolean") {
        setAutoResolveConflictsState(e.detail);
      } else {
        setAutoResolveConflictsState(getAutoResolveConflictsSetting());
      }
    };

    const handlePreferencesUpdated = () => {
      const online = isOnline();
      setIsOnlineState(online);
      if (!online) {
        setSyncStatus("offline");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("commutecast-sync-queue-updated", handleQueueUpdated);
    window.addEventListener("commutecast-sync-history-updated", handleHistoryUpdated);
    window.addEventListener("commutecast-sync-conflicts-updated", handleConflictsUpdated);
    window.addEventListener("commutecast-auto-resolve-setting-updated", handleAutoResolveSettingUpdated);
    window.addEventListener("commutecast-user-preferences-updated", handlePreferencesUpdated);
    window.addEventListener("storage", handlePreferencesUpdated);

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("commutecast-sync-queue-updated", handleQueueUpdated);
      window.removeEventListener("commutecast-sync-history-updated", handleHistoryUpdated);
      window.removeEventListener("commutecast-sync-conflicts-updated", handleConflictsUpdated);
      window.removeEventListener("commutecast-auto-resolve-setting-updated", handleAutoResolveSettingUpdated);
      window.removeEventListener("commutecast-user-preferences-updated", handlePreferencesUpdated);
      window.removeEventListener("storage", handlePreferencesUpdated);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      clearRetryTimer();
    };
  }, [checkSession, clearRetryTimer, safePerformSync, scheduleExponentialBackoffRetry, triggerDebouncedSync, updateQueueLength]);

  const clearSyncHistory = useCallback(() => {
    clearSyncHistoryService();
    setSyncHistory([]);
  }, []);

  const toggleAutoResolveConflicts = useCallback(async (enabled: boolean) => {
    setAutoResolveConflictsState(enabled);
    const updated = await setAutoResolveConflictsSetting(enabled);
    setConflicts(updated);
  }, []);

  const resolveConflict = useCallback(async (id: string, resolution: "local" | "remote") => {
    const updated = await resolveSyncConflict(id, resolution);
    setConflicts(updated);
  }, []);

  const resolveAllConflicts = useCallback(async (resolution: "local" | "remote") => {
    const updated = await resolveAllSyncConflicts(resolution);
    setConflicts(updated);
  }, []);

  const createDemoConflict = useCallback(() => {
    generateSampleConflict();
    setConflicts(getSyncConflicts());
  }, []);

  const createDemoFailedSyncEvent = useCallback(() => {
    logger.info("[useSync] Logging demo failed sync event to test exponential backoff auto-retry.");
    recordSyncHistoryEvent({
      type: "auto_sync",
      status: "failed",
      itemsCount: 0,
      details: { durationMs: 150 },
      triggerSource: "demo_failure_test"
    });
  }, []);

  const retryFailedSync = useCallback(async (eventId?: string) => {
    logger.info(`[useSync] Selective manual retry requested for failed sync event '${eventId || "unknown"}'`);
    cancelAutoRetry();
    await triggerSync();
  }, [cancelAutoRetry, triggerSync]);

  return {
    user,
    loading,
    syncStatus,
    cloudStatus,
    isOnline: isOnlineState,
    triggerSync,
    checkSession,
    isAborting,
    abortSync: handleAbortSync,
    queueLength,
    updateQueueLength,
    syncHistory,
    clearSyncHistory,
    conflicts,
    resolveConflict,
    resolveAllConflicts,
    createDemoConflict,
    // Auto-Resolve Conflicts (By Most Recent Timestamp) Exports
    autoResolveConflicts,
    toggleAutoResolveConflicts,
    // Exponential Backoff Auto-Retry Exports
    isAutoRetrying,
    retryAttemptCount,
    nextRetryDelayMs,
    maxAutoRetries: MAX_AUTO_RETRIES,
    cancelAutoRetry,
    createDemoFailedSyncEvent,
    retryFailedSync,
    // Sync Success Toast Exports (Auto-dismisses in 3 seconds)
    showSyncSuccessToast,
    dismissSyncSuccessToast,
    triggerSyncSuccessToast
  };

}
export default useSync;
