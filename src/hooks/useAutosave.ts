import { useState, useEffect, useRef, useCallback } from "react";
import debounce from "lodash/debounce";

export type SaveStatus = "idle" | "saving" | "saved" | "offline_saved" | "error";

export function useAutosave<T>(
  data: T,
  saveFn: (data: T) => void | Promise<void>,
  debounceTime: number = 800,
  draftKey: string = "commutecast_autosave_backup"
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const isInitialMount = useRef(true);
  const pendingDataRef = useRef<T | null>(null);

  // Debounced save function with offline local backup and error recovery
  const debouncedSave = useCallback(
    debounce(async (dataToSave: T) => {
      setStatus("saving");
      pendingDataRef.current = dataToSave;

      try {
        if (!navigator.onLine) {
          // Backup locally when offline
          localStorage.setItem(draftKey, JSON.stringify(dataToSave));
          setStatus("offline_saved");
          return;
        }

        await saveFn(dataToSave);
        localStorage.setItem(draftKey, JSON.stringify(dataToSave));
        pendingDataRef.current = null;
        setStatus("saved");

        // Reset status after a delay
        setTimeout(() => setStatus("idle"), 2500);
      } catch (e) {
        console.warn("[useAutosave] Online save failed, backing up locally:", e);
        try {
          localStorage.setItem(draftKey, JSON.stringify(dataToSave));
          setStatus("offline_saved");
        } catch (lsErr) {
          console.error("[useAutosave] Local backup save error:", lsErr);
          setStatus("error");
        }
      }
    }, debounceTime),
    [saveFn, debounceTime, draftKey]
  );

  // Auto-sync pending offline draft when network connection restores
  useEffect(() => {
    const handleOnline = async () => {
      if (pendingDataRef.current !== null || localStorage.getItem(draftKey)) {
        const stored = pendingDataRef.current || JSON.parse(localStorage.getItem(draftKey) || "null");
        if (stored) {
          setStatus("saving");
          try {
            await saveFn(stored);
            pendingDataRef.current = null;
            setStatus("saved");
            setTimeout(() => setStatus("idle"), 2500);
          } catch (err) {
            console.error("[useAutosave] Online reconnect sync failed:", err);
            setStatus("offline_saved");
          }
        }
      }
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [saveFn, draftKey]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setStatus("idle");
    debouncedSave(data);

    return () => {
      debouncedSave.cancel();
    };
  }, [data, debouncedSave]);

  return { status };
}

