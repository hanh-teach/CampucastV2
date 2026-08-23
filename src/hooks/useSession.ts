import { useState, useEffect } from "react";
import { SessionEngine } from "../features/session/SessionEngine";
import { sessionEventBus } from "../features/session/SessionEvents";
import { Mission } from "../features/session/SessionTypes";

export function useSession() {
  const [mission, setMission] = useState<Mission | null>(SessionEngine.getCurrentMission());

  useEffect(() => {
    const unsubscribe = sessionEventBus.subscribe((event) => {
      if (event.type === 'MISSION_CHANGED' || event.type === 'AUTOSAVE_DONE') {
        setMission(SessionEngine.getCurrentMission());
      }
    });
    return unsubscribe;
  }, []);

  return { mission };
}
