import { SessionSnapshot, Mission, MissionHistoryEvent, MissionStage } from './SessionTypes';
import { SessionRepository } from './SessionRepository';
import { sessionEventBus } from './SessionEvents';

export const SESSION_UPDATE_DEBOUNCE_MS = 750;

export class SessionEngine {
  private snapshot: SessionSnapshot | null = null;

  constructor() {
    this.snapshot = SessionRepository.load();
  }

  static resume(): SessionSnapshot | null {
    return SessionRepository.load();
  }

  static save(snapshot: SessionSnapshot): void {
    SessionRepository.save(snapshot);
    sessionEventBus.emit({ type: 'AUTOSAVE_DONE' });
  }

  /**
   * Publish a mission event to transition state or record history.
   * This is the preferred way to interact with Missions.
   */
  static publishMissionEvent(
    type: 'MISSION_UPDATED' | 'MISSION_STARTED' | 'MISSION_FAILED' | 'MISSION_COMPLETED',
    payload: {
      missionUpdate: Partial<Mission>;
      historyEvent?: Omit<MissionHistoryEvent, 'id' | 'timestamp'>;
    }
  ): void {
    let snapshot = SessionRepository.load();
    
    if (!snapshot) {
      snapshot = {
        activeMission: null,
        draftState: {},
        workspaceContext: 'studio_production',
        uiState: {
          cursorPosition: { line: 0, ch: 0 },
          scrollPosition: 0,
          activeTab: 'home'
        },
        lastUpdated: Date.now()
      };
    }

    if (!snapshot.activeMission) {
      snapshot.activeMission = {
        id: `mission_${Date.now()}`,
        version: 1,
        projectId: 'default_project',
        name: 'Initial Mission',
        status: 'created',
        stage: 'editing',
        priority: 'P1',
        executionHealth: 'healthy',
        progress: 0,
        confidenceScore: 100,
        capabilities: [{ id: 'summary', type: 'required' }, { id: 'storage', type: 'required' }],
        nextAction: {
          actionId: 'start',
          label: 'Start Mission',
          route: '/create'
        },
        history: [],
        lastUpdated: Date.now()
      };
    }

    // Update mission fields
    snapshot.activeMission = { 
      ...snapshot.activeMission, 
      ...payload.missionUpdate,
      lastUpdated: Date.now()
    } as Mission;

    // Record History Event if provided (Mission Immutability Principle)
    if (payload.historyEvent) {
      const newEvent: MissionHistoryEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        stage: snapshot.activeMission.stage,
        timestamp: Date.now(),
        classification: 'system', // Default
        ...payload.historyEvent
      };
      snapshot.activeMission.history = [
        ...(snapshot.activeMission.history || []),
        newEvent
      ];
    }

    snapshot.lastUpdated = Date.now();
    SessionRepository.save(snapshot);
    
    // Broadcast specific event type if it's a major transition
    const eventType = (payload as any).eventType || 'MISSION_CHANGED';
    sessionEventBus.emit({ 
      type: eventType as any, 
      payload: JSON.stringify(snapshot.activeMission) 
    });
  }

  /**
   * Simplified helper for common updates
   */
  static updateActiveMission(mission: Partial<Mission>): void {
    this.publishMissionEvent('MISSION_UPDATED', { missionUpdate: mission });
  }

  /**
   * Enhanced event publisher for external engines (The "Mission Bus")
   */
  static logMissionEvent(
    type: 
      | 'MISSION_UPDATED' 
      | 'MISSION_STARTED' 
      | 'MISSION_FAILED' 
      | 'MISSION_COMPLETED'
      | 'MISSION_CREATED'
      | 'MISSION_PAUSED'
      | 'MISSION_RESUMED'
      | 'MISSION_ARCHIVED'
      | 'MISSION_STAGE_CHANGE',
    message: string,
    metadata?: Record<string, any>
  ): void {
    const classification = metadata?.classification || 'system';
    const source = metadata?.source || 'system';

    this.publishMissionEvent(type as any, {
      missionUpdate: {
        // Map event type to status if applicable
        ...(type === 'MISSION_STARTED' && { status: 'running' }),
        ...(type === 'MISSION_PAUSED' && { status: 'paused' }),
        ...(type === 'MISSION_COMPLETED' && { status: 'completed', progress: 100 }),
        ...(type === 'MISSION_FAILED' && { status: 'failed', executionHealth: 'critical' }),
      },
      historyEvent: {
        message,
        source,
        classification,
        stage: this.getCurrentMission()?.stage || 'editing',
        metadata
      }
    });
  }

  static getCurrentMission(): Mission | null {
    const snapshot = SessionRepository.load();
    return snapshot ? snapshot.activeMission : null;
  }
}
