import { CuratedStory, SessionPlan } from './editorial';

export type BroadcastSectionType = 
  | 'Opening' 
  | 'LeadStory' 
  | 'SupportStory' 
  | 'QuickUpdate' 
  | 'DeepDive' 
  | 'Trivia' 
  | 'MusicBreak' 
  | 'Reflection' 
  | 'Closing';

export type Tempo = 'Fast' | 'Medium' | 'Slow' | 'Pause';
export type EnergyLevel = 'High' | 'Medium' | 'Peak' | 'Reflection' | 'Warm';

export interface BroadcastSection {
  readonly id: string;
  readonly type: BroadcastSectionType;
  readonly tempo: Tempo;
  readonly energy: EnergyLevel;
  readonly storyId?: string; // Optional if it's Opening, MusicBreak, Closing, Trivia
}

export interface BroadcastPlan {
  readonly id: string;
  readonly sections: BroadcastSection[];
  readonly estimatedDurationSeconds: number;
  readonly energyCurve: EnergyLevel[];
  readonly emotionCurve: string[]; 
  readonly musicSlots: number;
  readonly priority: 'Standard' | 'BreakingNews' | 'Relaxed';
}

export interface BroadcastPolicy {
  readonly maxDurationSeconds: number;
  readonly maxStories: number;
  readonly allowedSections: BroadcastSectionType[];
}
