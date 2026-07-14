// src/features/types.ts
export interface VoiceProfile {
  speed: number;
  pitch: number;
  volume: number;
  vietnameseVoice: string;
  englishVoice: string;
}

export interface AIMemoryItem {
  id: string;
  topic: string;
  category: string;
  interactedCount: number;
  lastInteractedAt: string;
}

export interface PersonalizedMemory {
  favoriteTopics: AIMemoryItem[];
  preferredLanguage: "vi" | "en" | "bilingual";
  preferredSources: string[];
  totalListeningSeconds: number;
  lastActiveDate: string;
}

export interface ListenStats {
  totalSeconds: number;
  totalStoriesRead: number;
  byLanguage: { vi: number; en: number; bilingual: number };
  byCategory: { [category: string]: number };
  byFeedSource: { [feedTitle: string]: number };
  dailyHistory: { date: string; seconds: number }[];
}

export interface QueueItem {
  id: string;
  title: string;
  subtitle: string;
  audioUrl?: string;
  duration?: number;
  type: "rss" | "podcast" | "custom";
  payload?: any;
}

export interface AccessibilityConfig {
  highContrast: boolean;
  reducedMotion: boolean;
  largeFont: boolean;
  keyboardOnly: boolean;
}

export interface FeatureSettings {
  voiceProfile: VoiceProfile;
  accessibility: AccessibilityConfig;
  pwaNotificationsEnabled: boolean;
  offlineDownloadsAuto: boolean;
}

export type ExecutionState =
  | "idle"
  | "initializing"
  | "fetching_sources"
  | "normalizing_content"
  | "ranking_stories"
  | "building_queue"
  | "synthesizing_audio"
  | "buffering_audio"
  | "ready_to_play"
  | "playing"
  | "error";

export interface ExecutionStateEvent {
  sessionId: string;
  routineId: string;
  state: ExecutionState;
  progress?: {
    current: number;
    total: number;
    message?: string;
  };
}
