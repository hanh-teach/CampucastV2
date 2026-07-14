import { EmotionArcRole } from './editorial';

export interface PersonaProfile {
  readonly id: string;
  readonly name: string;
  readonly editorialIdentity: string;
  
  // Character traits (0.0 to 1.0)
  readonly formality: number;
  readonly humor: number;
  readonly confidence: number;
  readonly curiosity: number;
  readonly opinionTendency: number;
  
  // Style properties
  readonly vocabulary: string[];
  readonly sentenceRhythm: 'Punchy' | 'Flowing' | 'Measured';
  readonly transitionStyle: 'Abrupt' | 'Smooth' | 'Thematic';
  readonly catchphrases: string[];
  
  // Editorial Signatures
  readonly openingStyle: string[];
  readonly closingStyle: string[];
  
  // Strategic preferences
  readonly analysisDepth: 'Deep' | 'Summary' | 'Adaptive';
  readonly storyPacing: 'Fast' | 'Relaxed' | 'Adaptive';
  readonly preferredEmotionArc: EmotionArcRole[];
}

export interface ResolvedPersona {
  readonly profile: PersonaProfile;
  readonly confidenceScore: number;
}
