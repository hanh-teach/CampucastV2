export type UserContextType = 'MorningCommute' | 'WorkFocus' | 'EveningRelax' | 'NightMode' | 'General';

import { BroadcastPlan } from './broadcast';
import { ResolvedPersona } from './persona';
import { TasteProfile } from './taste';

export type SessionObjective = 
  | 'InformQuickly' 
  | 'DeepUnderstanding' 
  | 'KeepAttention' 
  | 'CalmEnding' 
  | 'Entertainment';

export type SessionTimelineBeatType = 
  | 'Opening' 
  | 'LeadStory' 
  | 'SupportStory' 
  | 'QuickUpdate' 
  | 'DeepDive' 
  | 'Trivia' 
  | 'MusicBreak' 
  | 'Reflection' 
  | 'Closing'
  | 'Interjection'
  | 'Transition'
  | 'Music'
  | 'Ad'
  | 'Outro';

export interface SessionTimelineBeat {
  readonly id: string;
  readonly type: SessionTimelineBeatType;
  readonly startTimeSeconds: number;
  readonly durationSeconds: number;
  readonly metadata: Record<string, any>;
}

export interface ListeningSession {
  readonly sessionId: string;
  readonly userId: string;
  readonly context: UserContextType;
  readonly objective: SessionObjective;
  readonly broadcastPlan: BroadcastPlan;
  readonly persona: ResolvedPersona;
  readonly tasteProfile: TasteProfile;
  readonly timeline: SessionTimelineBeat[];
  readonly status: 'Planned' | 'Active' | 'Completed' | 'Interrupted';
}

export interface SessionAdaptation {
  readonly action: 'Recalculate' | 'Shorten' | 'ChangeTempo' | 'SwitchTopic';
  readonly reason: string;
  readonly targetBeatId?: string;
}

export interface SessionExperienceMetrics {
  readonly completionRate: number;
  readonly skipCount: number;
  readonly continuityScore: number; // 0.0 to 1.0
  readonly engagementDurationSeconds: number;
  readonly emotionalStability: number;
}
