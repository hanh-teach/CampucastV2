export type SessionEvent =
  | { type: 'MISSION_CREATED'; payload: string }
  | { type: 'MISSION_UPDATED'; payload: string }
  | { type: 'MISSION_STARTED'; payload: string }
  | { type: 'MISSION_PAUSED'; payload: string }
  | { type: 'MISSION_RESUMED'; payload: string }
  | { type: 'MISSION_COMPLETED'; payload: string }
  | { type: 'MISSION_FAILED'; payload: string }
  | { type: 'MISSION_ARCHIVED'; payload: string }
  | { type: 'MISSION_STAGE_CHANGE'; payload: string }
  | { type: 'STEP_COMPLETED'; payload: string }
  | { type: 'AUTOSAVE_DONE' }
  | { type: 'RECOVERY_DONE' }
  | { type: 'MISSION_CHANGED'; payload: string };

type Listener = (event: SessionEvent) => void;

class SessionEventBus {
  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  emit(event: SessionEvent) {
    this.listeners.forEach((l) => l(event));
  }
}

export const sessionEventBus = new SessionEventBus();
