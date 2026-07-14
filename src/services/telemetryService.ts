import { TelemetryEvent } from "../types";

class TelemetryService {
  private sessionId: string;
  private visitorId: string;
  private currentCorrelationId: string = "N/A";
  private events: TelemetryEvent[] = [];
  private lastStateTimestamp: number | null = null;
  private lastState: string | null = null;
  private samplingRate: number = 1.0; // 1.0 for dogfooding

  private lastEventTimestamp: number = Date.now();
  private maxSilentGap: number = 0;
  private currentSessionStats: any = {
    feeds: {},
    audio: {
      download: 0,
      decode: 0,
      queue: 0,
      play: 0
    }
  };

  constructor() {
    this.sessionId = (typeof crypto !== "undefined" && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    // Persistent visitorId
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("commutecast_visitor_id");
      if (stored) {
        this.visitorId = stored;
      } else {
        this.visitorId = this.sessionId;
        localStorage.setItem("commutecast_visitor_id", this.visitorId);
      }
    } else {
      this.visitorId = this.sessionId;
    }
  }

  public startExecution(routineId: string) {
    this.currentCorrelationId = routineId;
    this.maxSilentGap = 0;
    this.lastEventTimestamp = Date.now();
    this.currentSessionStats = {
      feeds: {},
      audio: { download: 0, decode: 0, queue: 0, play: 0 }
    };
  }

  public setSamplingRate(rate: number) {
    this.samplingRate = rate;
  }

  public track(type: TelemetryEvent["type"], payload: any) {
    if (Math.random() > this.samplingRate) return;
    const now = Date.now();
    
    // Calculate Silent Gap
    const gap = now - this.lastEventTimestamp;
    if (gap > this.maxSilentGap && this.lastState !== "Playing") {
      this.maxSilentGap = gap;
    }
    this.lastEventTimestamp = now;

    // Handle specific metrics
    if (type === "rss_fetch_success") {
      const { url, duration } = payload;
      this.currentSessionStats.feeds[url] = duration;
    }

    if (type === "audio_decode_success") {
      this.currentSessionStats.audio.decode = payload.duration;
    }
    
    // Calculate duration for state transitions
    if (type === "execution_state_transition") {
      if (this.lastStateTimestamp && this.lastState) {
        const duration = now - this.lastStateTimestamp;
        // Track the duration of the previous state
        this.trackDuration(this.lastState, duration);
      }
      this.lastStateTimestamp = now;
      this.lastState = payload.state;
    }

    const event: TelemetryEvent = {
      type,
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      correlationId: this.currentCorrelationId,
      timestamp: now,
      payload: {
        ...payload,
        maxSilentGap: this.maxSilentGap
      }
    };
    
    this.events.push(event);
    console.log("[Telemetry] ", type, ":", payload);
    this.saveToLocal();
  }

  public getStats() {
    return {
      maxSilentGap: this.maxSilentGap,
      sessionStats: this.currentSessionStats
    };
  }

  private trackDuration(state: string, durationMs: number) {
    const event: TelemetryEvent = {
      type: "execution_state_transition",
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      correlationId: this.currentCorrelationId,
      timestamp: Date.now(),
      payload: { state, durationMs, isDurationReport: true }
    };
    this.events.push(event);
    this.saveToLocal();
  }

  private saveToLocal() {
    try {
      if (typeof localStorage === "undefined") return;
      const stored = localStorage.getItem("commutecast_telemetry") || "[]";
      const allEvents = JSON.parse(stored);
      
      // Add the latest event
      if (this.events.length > 0) {
        allEvents.push(this.events[this.events.length - 1]);
      }
            
      // Keep only last 200 events for better dashboard history
      if (allEvents.length > 200) {
        allEvents.splice(0, allEvents.length - 200);
      }
            
      localStorage.setItem("commutecast_telemetry", JSON.stringify(allEvents));
    } catch (e) {
      console.error("Failed to save telemetry", e);
    }
  }

  public getEvents(): TelemetryEvent[] {
    try {
      if (typeof localStorage === "undefined") return [];
      const stored = localStorage.getItem("commutecast_telemetry") || "[]";
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }

  public clearTelemetry() {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("commutecast_telemetry");
    }
    this.events = [];
  }
}

export const telemetry = new TelemetryService();
