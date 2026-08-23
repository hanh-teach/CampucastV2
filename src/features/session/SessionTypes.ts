export type MissionStatus = 'created' | 'ready' | 'running' | 'paused' | 'completed' | 'failed' | 'archived';

export type MissionPriority = 'P0' | 'P1' | 'P2';

export type MissionExecutionHealth = 'healthy' | 'waiting' | 'blocked' | 'warning' | 'critical';

export type MissionEventClass = 'operator' | 'ai' | 'system' | 'background' | 'warning' | 'recovery';

export interface MissionCapabilityRequirement {
  id: string;
  type: 'required' | 'optional';
}

export type MissionStage = 
  | 'editing' 
  | 'preparing' 
  | 'fetching' 
  | 'generating-audio' 
  | 'rendering-video' 
  | 'publishing' 
  | 'completed' 
  | 'failed';

export interface MissionHistoryEvent {
  id: string;
  stage: MissionStage;
  timestamp: number;
  message: string;
  source: 'operator' | 'rss' | 'audio' | 'video' | 'ai' | 'system';
  classification: MissionEventClass;
  metadata?: Record<string, any>;
}

export interface NextAction {
  actionId: string;
  label: string;
  route: string;
}

export interface Mission {
  id: string;
  version: number; // For optimistic locking and history tracking
  projectId: string;
  name: string;
  status: MissionStatus;
  stage: MissionStage;
  priority: MissionPriority;
  executionHealth: MissionExecutionHealth;
  progress: number; // 0-100
  confidenceScore: number; // 0-100
  capabilities: MissionCapabilityRequirement[];
  nextAction: NextAction;
  history: MissionHistoryEvent[];
  lastUpdated: number;
}

export interface SessionSnapshot {
  activeMission: Mission | null;
  draftState: Record<string, any>;
  workspaceContext: string;
  uiState: {
    cursorPosition: { line: number; ch: number };
    scrollPosition: number;
    activeTab: string;
  };
  lastUpdated: number;
}
