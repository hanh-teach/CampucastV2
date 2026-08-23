import { UserContextType } from './session';

export type ContextKey = 'Morning' | 'Day' | 'Evening' | 'Night' | 'Weekend' | 'Rainy' | 'Sunny' | 'Driving' | 'Working';

export interface TasteEntry {
  readonly topic: string;
  readonly affinity: number; // 0.0 to 1.0
  readonly contextAffinities: Record<ContextKey, number>;
  readonly lastInteraction: Date;
  readonly completionCount: number;
  readonly skipCount: number;
}

export interface TasteGraph {
  readonly userId: string;
  readonly entries: Record<string, TasteEntry>;
  readonly globalNoveltyRatio: number; // e.g., 0.15 for 15% surprise
  readonly diversityTarget: number; // e.g., 0.9 for high variety
}

export interface TasteProfile {
  readonly focusedTopics: string[];
  readonly noveltyTopics: string[];
  readonly weightedAffinities: Record<string, number>;
  readonly sessionGoal: string;
}

export interface ListeningEvent {
  readonly timestamp: Date;
  readonly type: 'Completion' | 'Skip' | 'Replay' | 'Start';
  readonly storyId: string;
  readonly topic: string;
  readonly context: UserContextType;
}
