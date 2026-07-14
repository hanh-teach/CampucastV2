import { clearAllLocalStores } from "./storageService";
import { syncClearVoiceHistoryAsync, abortSync, clearCloudDataAsync } from "./syncService";
import { getSupabaseClientAsync } from "./supabaseClient";

export interface ClearResult {
  indexedDbOk: boolean;
  voiceHistoryOk: boolean;
  localStorageOk: boolean;
  serverTtsCacheOk: boolean;
  cloudDataOk: boolean | null; // null if not requested
}

/**
 * Perform comprehensive local and server/cloud data purging sequentially
 * with safe try-catch blocks for every step so that failure in one doesn't halt others.
 */
export async function clearAllLocalDataComprehensive(options: {
  clearCloud: boolean;
}): Promise<ClearResult> {
  const result: ClearResult = {
    indexedDbOk: false,
    voiceHistoryOk: false,
    localStorageOk: false,
    serverTtsCacheOk: false,
    cloudDataOk: options.clearCloud ? false : null,
  };

  // 1. Tạm dừng mọi tiến trình sync đang chạy
  try {
    abortSync();
    console.log("[DataClear] Active synchronization aborted.");
  } catch (err) {
    console.error("[DataClear] Error aborting sync:", err);
  }

  // Set cờ hoãn sync tự động trong 10 giây để tránh bị cloud đẩy lại dữ liệu vừa xóa
  if (typeof window !== "undefined") {
    (window as any).isCommuteCastClearingCache = true;
    setTimeout(() => {
      (window as any).isCommuteCastClearingCache = false;
      console.log("[DataClear] Auto-sync hold released.");
    }, 10000); // 10 seconds hold
  }

  // 2. Xóa các store cục bộ trong IndexedDB
  try {
    await clearAllLocalStores();
    result.indexedDbOk = true;
    console.log("[DataClear] Local IndexedDB stores cleared successfully.");
  } catch (err) {
    console.error("[DataClear] Failed to clear IndexedDB stores:", err);
  }

  // 3. Xóa lịch sử giọng nói và đồng bộ xóa lên queue nếu không xóa cloud triệt để
  try {
    await syncClearVoiceHistoryAsync();
    result.voiceHistoryOk = true;
    console.log("[DataClear] Voice intelligence history cleared successfully.");
  } catch (err) {
    console.error("[DataClear] Failed to clear voice history:", err);
  }

  // 4. Xóa các key localStorage (tránh xóa token đăng nhập)
  try {
    const keysToKeep = [
      "supabase.auth.token", // Classic token
      "theme", // User interface themes are harmless
      "commutecast_sidebar_collapsed" // Harmless UI states
    ];

    const allKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allKeys.push(key);
    }

    for (const key of allKeys) {
      // Don't delete supabase session data, theme, sidebar settings
      const shouldKeep = keysToKeep.some(k => key.includes(k)) || key.startsWith("sb-");
      if (!shouldKeep) {
        localStorage.removeItem(key);
      }
    }
    result.localStorageOk = true;
    console.log("[DataClear] LocalStorage temporary preferences and history cleared.");
  } catch (err) {
    console.error("[DataClear] Failed to clear localStorage:", err);
  }

  // 5. Gọi API route server để xóa cache tts_cache
  try {
    const supabase = await getSupabaseClientAsync();
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch("/api/clear-tts-cache", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          result.serverTtsCacheOk = true;
          console.log("[DataClear] Server-side TTS cache cleared:", data.message);
        } else {
          console.warn("[DataClear] Server-side TTS cache clearing failed:", data.error);
        }
      } else {
        console.warn("[DataClear] Server cache clearing skipped: Unauthenticated (No access token)");
      }
    }
  } catch (err) {
    console.error("[DataClear] Error calling server-side cache clear API:", err);
  }

  // 6. Xóa dữ liệu trên Cloud nếu người dùng yêu cầu
  if (options.clearCloud) {
    try {
      const ok = await clearCloudDataAsync();
      result.cloudDataOk = ok;
      console.log(`[DataClear] Cloud data clearing finished with success: ${ok}`);
    } catch (err) {
      console.error("[DataClear] Failed to clear cloud data:", err);
    }
  }

  return result;
}
