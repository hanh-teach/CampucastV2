export type DialogueIntent = 
  | 'ExplainMore' 
  | 'Summarize' 
  | 'Debunk' 
  | 'Contextualize' 
  | 'PersonalInterjection';

export interface DialogueContext {
  readonly storyId: string;
  readonly topic: string;
  readonly userLastInteraction?: string;
  readonly sessionGoal: string;
}

export interface HostDialogue {
  readonly id: string;
  readonly intent: DialogueIntent;
  readonly text: string;
  readonly durationSeconds: number;
  readonly metadata: {
    readonly tone: string;
    readonly emphasisPoints: string[];
    readonly interactionType: 'Monologue' | 'InteractiveSlot';
  };
}

export interface InterjectionRequest {
  readonly sessionId: string;
  readonly storyId: string;
  readonly intent: DialogueIntent;
  readonly targetDuration: number;
}
