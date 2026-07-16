import { QueueItem } from "./features/types";

export enum LanguageMode {
  VN_ONLY = "VN_ONLY",
  EN_ONLY = "EN_ONLY",
  BILINGUAL = "BILINGUAL"
}

export interface NewsChapter {
  topic: string;
  scriptText: string;
  summaryBullets: string[];
  segments?: Array<{ speakerId: string; text: string }>;
}

export interface SummaryPayload {
  title: string;
  introduction: string;
  chapters: NewsChapter[];
  conclusion: string;
}

export interface BroadcastConfiguration {
  languageMode: LanguageMode;
  language: "vi" | "en" | "bilingual"; // legacy compatibility
  voiceVN: string;
  voiceEN: string;
  rate: number;
  speed: number; // legacy compatibility
  pitch: number;
  isDrivingMode: boolean;
  targetDuration: "short" | "medium" | "long";
  tone: "conversational" | "informative" | "upbeat" | "analytical" | "witty";
  focus: string;
  commuteType: "driving" | "transit" | "walking" | "cycling";
  customInstructions: string;
  locationName?: string;
  commuteRoute?: string;
  voice: "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr" | "vi-HN" | "vi-HCM" | "en-UK" | "en-US" | string;
  aiMode?: "rewrite" | "fact_check" | "detect_duplicate" | "podcast_style" | "morning_style" | "driving_style" | "student_mode" | "executive_mode" | "english_learning_mode" | string;
  audioEmotion?: string;
  audioPauseDuration?: number;
  audioPronunciationDict?: Array<{ word: string; replace: string }>;
  audioMusicGenre?: string;
  audioMusicVolume?: number;
  audioNormalize?: boolean;
  audioLimiter?: boolean;
  audioFadeDuration?: number;
  audioNoiseReduction?: boolean;
  hapticFeedbackEnabled?: boolean;
  wakeWordEnabled?: boolean;
  autoSuggestDrivingModeEnabled?: boolean;
}

export interface SummaryPreferences extends BroadcastConfiguration {}

export type PreferedVoice = string;
export type DefaultLanguage = "vi" | "en" | "bilingual";
export type ReadSpeed = number;
export type UserPreferences = BroadcastConfiguration;

export interface UserPreferencesContextType {
  preferences: BroadcastConfiguration;
  updatePreferences: (prefs: Partial<BroadcastConfiguration>) => void;
  updateVoice: (voice: PreferedVoice) => void;
  updateLanguage: (language: DefaultLanguage) => void;
  updateSpeed: (speed: ReadSpeed) => void;
  updateDrivingMode: (isDriving: boolean) => void;
}

export interface SavedSummary {
  id: string;
  timestamp: string;
  preferences: SummaryPreferences;
  payload: SummaryPayload;
  audioChunks?: string[]; // Base64 audio strings match: [Intro, ...Chapters, Conclusion]
  likeCount?: number;
  shareCount?: number;
  artworkUrl?: string;
  isArchived?: boolean; // Added in 1.1
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
}

export type SavePolicy = "manual" | "auto";
export interface SaveState {
  isSaving: boolean;
  saveProgress: number; // 0-100
  lastSavedAt: string | null;
  hasChanges: boolean;
  isConflict: boolean;
}

export interface VoiceHistoryItem {
  id: string;
  timestamp: string;
  query: string;
  answer: string;
  language: "vi" | "en";
  sources?: Array<{ title: string; uri: string }>;
}

export interface UnifiedUserProfile {
  id: string;
  youtube: {
    history: string[];
    likedVideoIds: string[];
    subscribedChannelIds: string[];
    watchLaterIds: string[];
    savedIds: string[];
    recentlyPlayed: string[];
    recentlyWatched: string[];
    frequentlyPlayed: string[];
    frequentlyWatched: string[];
    favoriteChannels: string[];
  };
  podcast: {
    history: string[];
    favorites: string[];
    subscriptions: string[];
    continueListening: string[];
  };
  rss: {
    history: string[];
    favorites: string[];
    subscriptions: string[];
  };
  voice: {
    history: VoiceHistoryItem[];
  };
  driving: {
    history: string[];
    totalDrivingSeconds: number;
  };
  search: {
    history: string[];
    recentlySearched: string[];
  };
  settings: UserPreferences;
  favorites: string[];
  playbackHistory: QueueItem[];
}

export interface RSSFeed {
  id: string;
  url: string;
  title: string;
  category?: string;
  feedType?: "news" | "podcast" | "blog";
  addedAt: string;
  lastFetchedAt?: string;
  // Sprint 1 RSS Studio Optional Fields
  priority?: "low" | "medium" | "high";
  healthStatus?: "healthy" | "unstable" | "failing";
  healthError?: string;
  fetchCount?: number;
  successCount?: number;
  avgFetchDuration?: number; // duration in ms
  // Prompt 3: Keyword Filtering
  includeKeywords?: string[];
  excludeKeywords?: string[];
}

export interface RSSArticle {
  title: string;
  link: string;
  pubDate?: string;
  content?: string;
  feedTitle?: string;
  feedCategory?: string;
  feedType?: "news" | "podcast" | "blog";
  feedId?: string; // Optional reference to parent feed
  feedPriority?: "low" | "medium" | "high"; // Sprint 1 feed priority reference
  isDuplicate?: boolean; // Sprint 1 duplicate detection flag
}

export interface PublishedEpisode {
  id: string;
  title: string;
  description: string;
  pubDate: string;
  audioUrl: string;
  duration: number;
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

export interface TelemetryEvent {
  type: 
    | "execution_state_transition" 
    | "perceived_performance" 
    | "user_confusion_signal"
    | "execution_start"
    | "execution_finished"
    | "rss_fetch_success"
    | "rss_fetch_error"
    | "audio_decode_success"
    | "audio_play_start"
    | "rage_tap"
    | "perception_survey"
    | "mission_created"
    | "mission_updated"
    | "mission_deleted";
  sessionId: string;
  visitorId: string;
  timestamp: number;
  correlationId: string;
  payload: any;
}

export interface PerceivedPerformanceMetric {
  routineId: string;
  actualDurationMs: number;
  perceivedAnxietyScore: number; // 1-10
  didReload: boolean;
}

export type CategoryType = "New" | "Trending" | "For You" | "AI Suggestions" | "Search Results";

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration?: string;
  viewCount?: string;
  publishedAt?: string;
  likeCount?: string;
  trendingScore?: number;
  recommendationScore?: number;
  category: CategoryType;
  isAudioFriendly: boolean; // AI Filtering flag
  personalFeedCategory?: string; // Phase 4 requirement
}

export interface FeedResponse {
  videos: YouTubeVideo[];
  nextPageToken?: string;
}

export interface YouTubePlayerState {
  isPlaying: boolean;
  currentVideo: YouTubeVideo | null;
  playlist: YouTubeVideo[];
  isParkedMode: boolean; // Safety lock
  isSearching: boolean;
  searchQuery: string;
}

export type WorkspaceSubTab = "dashboard" | "recent" | "continue" | "suggestions";
export type MissionStudioSubTab = "source" | "research" | "draft" | "editor" | "voice" | "preview" | "publish" | "history";
export type LibrarySubTab = "missions" | "audio" | "scripts" | "sources" | "templates" | "archive";
export type AICenterSubTab = "models" | "prompt" | "personas" | "voice" | "memory" | "automation";
export type SettingsSubTab = "general" | "appearance" | "storage" | "sync" | "security" | "pwa" | "about";

export type TabType = "workspace" | "mission_studio" | "library" | "ai_center" | "settings";

export enum LayoutVariant {
  Compact = "compact",
  Regular = "regular",
  Expanded = "expanded",
}

export enum Orientation {
  Portrait = "portrait",
  Landscape = "landscape",
}

export enum DeviceType {
  Mobile = "mobile",
  Tablet = "tablet",
  Desktop = "desktop",
}

export enum PointerType {
  Touch = "touch",
  Coarse = "coarse",
  Fine = "fine",
}

export enum DensityType {
  Default = "default",
  High = "high",
  Low = "low",
}

export interface SafeArea {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Generic stage result wrapper reflecting loading, error, and success states
 */
export interface StageResult<T> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: T | null;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

/**
 * Stage 1 Output / Stage 2 Input
 */
export interface ResearchPackage {
  id: string;
  missionId: string;
  articles: Array<{
    id: string;
    title: string;
    content: string;
    source?: string;
    publishedAt?: string;
  }>;
  aggregatedText: string;
  language: string;
  createdAt: string;
}

/**
 * Stage 2 Output / Stage 3 Input
 */
export interface EditorialDraft {
  id: string;
  missionId: string;
  language: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  hostProfile: {
    primaryVoice: string;
    cohostVoice?: string;
  };
  narrationStyle: string;
  createdAt: string;
  version: number;
}

/**
 * Speech Segment - Segment generated during Stage 3 Speech Preparation
 */
export interface SpeechSegment {
  id: string;
  label: string;
  text: string;               // Normalized pronunciation/ssml text
  originalText: string;
  voice: string;
  emotion?: string;
  pauseDurationBefore?: number;
  pauseDurationAfter?: number;
  ssml?: string;
  estimatedDuration: number;  // timing estimation in seconds
}

/**
 * Speech Package - Immutable Stage 3 Output
 */
export interface SpeechPackage {
  id: string;
  draftId: string;
  segments: SpeechSegment[];
  language: string;
  createdAt: string;
  totalEstimatedDuration: number;
}

/**
 * Audio Artifact - Immutable Stage 4 Output
 */
export interface AudioArtifact {
  id: string;
  speechPackageId: string;
  audioChunks: string[];      // Base64 audio arrays
  succeededSegments: string[]; // List of segment IDs successfully processed
  failedSegments: Array<{ id: string; label: string; message: string }>;
  completedAt: string;
  checksum: string;           // Checksum of base64 chunks or text
  metadata: {
    totalDuration: number;
    bitRate: string;
    sampleRate: number;
    channelCount: number;
    voiceManifest: Record<string, string>; // segmentId -> voice mapping
    volumeLevelDb: number;        // Target or estimated loudness (e.g. -14 LUFS)
    generatedBy: string;
  };
  isPartial: boolean;
}

/**
 * Central orchestrating context to coordinate resume, restart, and recovery operations
 */
export interface PipelineContext {
  pipelineId: string;
  missionId: string;
  currentStage: 1 | 2 | 3 | 4;
  stages: {
    stage1: StageResult<ResearchPackage>;
    stage2: StageResult<EditorialDraft>;
    stage3: StageResult<SpeechPackage>;
    stage4: StageResult<AudioArtifact>;
  };
  synthesisWarning: string | null;
}



