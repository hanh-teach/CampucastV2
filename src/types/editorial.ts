export interface SessionPlan {
  readonly id: string;
  readonly targetDurationSeconds: number;
  readonly targetStoryCount: number;
  readonly depth: 'Deep' | 'Summary';
  readonly pacing: 'Fast' | 'Relaxed' | 'Adaptive';
  readonly musicBreaks: number;
  readonly thematicFocus: string[];
}

export type EditorialIntent = 
  | 'BreakingNews'
  | 'DeepAnalysis'
  | 'ContrarianView'
  | 'HumanInterest'
  | 'Educational'
  | 'CasualUpdate';

export type EmotionArcRole = 
  | 'HighImpact'
  | 'Informative'
  | 'Reflective'
  | 'Uplifting';

export type NarrativeRole = 
  | 'Hook'
  | 'CoreEvidence'
  | 'CriticalAnalysis'
  | 'ContextualBridge'
  | 'ClosingThought';

export interface EditorialDecision {
  readonly intent: EditorialIntent;
  readonly curiosityScore: number;
  readonly emotionRole: EmotionArcRole;
  readonly narrativeRole: NarrativeRole;
  readonly hasSurpriseHook: boolean;
  readonly memoryThreadId?: string;
}

export interface CuratedStory {
  readonly id: string;
  readonly title: string;
  readonly editorial: EditorialDecision;
}
