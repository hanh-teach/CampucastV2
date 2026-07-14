import { useState, useEffect, useRef, useCallback } from "react";
import debounce from "lodash/debounce";

type SaveStatus = "idle" | "saving" | "saved";

export function useAutosave<T>(
  data: T,
  saveFn: (data: T) => void,
  debounceTime: number = 800
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const isInitialMount = useRef(true);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((dataToSave: T) => {
      setStatus("saving");
      try {
        saveFn(dataToSave);
        setStatus("saved");
        // Reset status after a delay
        setTimeout(() => setStatus("idle"), 2000);
      } catch (e) {
        console.error("Autosave failed", e);
        setStatus("idle");
      }
    }, debounceTime),
    [saveFn, debounceTime]
  );

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
