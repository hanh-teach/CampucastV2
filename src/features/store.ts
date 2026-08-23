// src/features/store.ts
import { VoiceProfile, AIMemoryItem, PersonalizedMemory, ListenStats, QueueItem, FeatureSettings, AccessibilityConfig } from "./types";
import { UnifiedUserProfile } from "../types";
import { safeJsonParse } from "../utils/safeJson";

// Keys
const KEYS = {
  VOICE_PROFILE: "cc_voice_profile",
  AI_MEMORY: "cc_ai_memory",
  STATS: "cc_stats",
  QUEUE: "cc_queue",
  ACCESSIBILITY: "cc_accessibility",
  SETTINGS: "cc_feature_settings",
  HISTORY: "cc_playback_history",
  FAVORITES: "cc_favorite_ids",
  REPEAT_MODE: "cc_repeat_mode",
  AUTO_CONTINUE: "cc_auto_continue",
  UNIFIED_USER_PROFILE: "cc_unified_user_profile"
};

const DEFAULT_VOICE_PROFILE: VoiceProfile = {
  speed: 1.0,
  pitch: 1.0,
  volume: 0.9,
  vietnameseVoice: "vi-HN",
  englishVoice: "en-US"
};

const DEFAULT_ACCESSIBILITY: AccessibilityConfig = {
  highContrast: false,
  reducedMotion: false,
  largeFont: false,
  keyboardOnly: false
};

const DEFAULT_SETTINGS: FeatureSettings = {
  voiceProfile: DEFAULT_VOICE_PROFILE,
  accessibility: DEFAULT_ACCESSIBILITY,
  pwaNotificationsEnabled: true,
  offlineDownloadsAuto: false
};

const DEFAULT_MEMORY: PersonalizedMemory = {
  favoriteTopics: [],
  preferredLanguage: "bilingual",
  preferredSources: [],
  totalListeningSeconds: 0,
  lastActiveDate: new Date().toLocaleDateString()
};

const DEFAULT_STATS: ListenStats = {
  totalSeconds: 0,
  totalStoriesRead: 0,
  byLanguage: { vi: 0, en: 0, bilingual: 0 },
  byCategory: {},
  byFeedSource: {},
  dailyHistory: [
    { date: "Mon", seconds: 120 },
    { date: "Tue", seconds: 450 },
    { date: "Wed", seconds: 300 },
    { date: "Thu", seconds: 600 },
    { date: "Fri", seconds: 150 },
    { date: "Sat", seconds: 0 },
    { date: "Sun", seconds: 0 }
  ]
};

// Simple event target to notify components on update
class FeatureEventEmitter extends EventTarget {
  emitChange() {
    this.dispatchEvent(new Event("change"));
  }
}
export const featureStoreEvents = new FeatureEventEmitter();

export const getUnifiedUserProfile = (): UnifiedUserProfile | null => {
  try {
    const saved = localStorage.getItem(KEYS.UNIFIED_USER_PROFILE);
    return safeJsonParse<UnifiedUserProfile | null>(saved, null);
  } catch {
    return null;
  }
};

export const saveUnifiedUserProfile = (profile: UnifiedUserProfile) => {
  try {
    localStorage.setItem(KEYS.UNIFIED_USER_PROFILE, JSON.stringify(profile));
    featureStoreEvents.emitChange();
  } catch (e) {
    console.warn("Failed to save unified user profile:", e);
  }
};

// Safe storage accessors
export const getVoiceProfile = (): VoiceProfile => {
  try {
    const saved = localStorage.getItem(KEYS.VOICE_PROFILE);
    return safeJsonParse<VoiceProfile>(saved, DEFAULT_VOICE_PROFILE);
  } catch {
    return DEFAULT_VOICE_PROFILE;
  }
};

export const saveVoiceProfile = (profile: VoiceProfile) => {
  try {
    localStorage.setItem(KEYS.VOICE_PROFILE, JSON.stringify(profile));
    featureStoreEvents.emitChange();
  } catch (e) {
    console.warn("Failed to save voice profile:", e);
  }
};

export const getAccessibilityConfig = (): AccessibilityConfig => {
  try {
    const saved = localStorage.getItem(KEYS.ACCESSIBILITY);
    return safeJsonParse<AccessibilityConfig>(saved, DEFAULT_ACCESSIBILITY);
  } catch {
    return DEFAULT_ACCESSIBILITY;
  }
};

export const saveAccessibilityConfig = (config: AccessibilityConfig) => {
  try {
    localStorage.setItem(KEYS.ACCESSIBILITY, JSON.stringify(config));
    // Apply visual effects globally
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (config.highContrast) {
        root.classList.add("high-contrast");
      } else {
        root.classList.remove("high-contrast");
      }
      if (config.largeFont) {
        root.classList.add("text-lg");
      } else {
        root.classList.remove("text-lg");
      }
      if (config.reducedMotion) {
        root.classList.add("motion-reduce");
      } else {
        root.classList.remove("motion-reduce");
      }
    }
    featureStoreEvents.emitChange();
  } catch (e) {
    console.warn("Failed to save accessibility settings:", e);
  }
};

export const getFeatureSettings = (): FeatureSettings => {
  try {
    const saved = localStorage.getItem(KEYS.SETTINGS);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    voiceProfile: getVoiceProfile(),
    accessibility: getAccessibilityConfig(),
    pwaNotificationsEnabled: true,
    offlineDownloadsAuto: false
  };
};

export const saveFeatureSettings = (settings: FeatureSettings) => {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    saveVoiceProfile(settings.voiceProfile);
    saveAccessibilityConfig(settings.accessibility);
    featureStoreEvents.emitChange();
  } catch (e) {
    console.warn("Failed to save feature settings:", e);
  }
};

export const getPersonalMemory = (): PersonalizedMemory => {
  try {
    const saved = localStorage.getItem(KEYS.AI_MEMORY);
    return saved ? JSON.parse(saved) : DEFAULT_MEMORY;
  } catch {
    return DEFAULT_MEMORY;
  }
};

export const savePersonalMemory = (memory: PersonalizedMemory) => {
  try {
    localStorage.setItem(KEYS.AI_MEMORY, JSON.stringify(memory));
    featureStoreEvents.emitChange();
  } catch (e) {
    console.warn("Failed to save personal memory:", e);
  }
};

export const clearPersonalMemory = () => {
  savePersonalMemory(DEFAULT_MEMORY);
};

export const addCustomMemoryItem = (
  topic: string,
  category = "Custom",
  type: "long_term" | "short_term" = "long_term",
  notes = ""
): PersonalizedMemory => {
  const memory = getPersonalMemory();
  const existing = memory.favoriteTopics.find(t => t.topic.toLowerCase() === topic.toLowerCase());
  if (existing) {
    existing.interactedCount += 1;
    existing.lastInteractedAt = new Date().toISOString();
    existing.enabled = true;
    if (notes) existing.notes = notes;
    if (type) existing.type = type;
  } else {
    memory.favoriteTopics.push({
      id: "mem_" + Math.random().toString(36).substring(2, 9),
      topic: topic.trim(),
      category: category.trim(),
      interactedCount: 1,
      lastInteractedAt: new Date().toISOString(),
      type,
      enabled: true,
      notes: notes.trim()
    });
  }
  savePersonalMemory(memory);
  return memory;
};

export const toggleMemoryItem = (id: string): PersonalizedMemory => {
  const memory = getPersonalMemory();
  const item = memory.favoriteTopics.find(t => t.id === id);
  if (item) {
    item.enabled = item.enabled === false ? true : false;
    savePersonalMemory(memory);
  }
  return memory;
};

export const deleteMemoryItem = (id: string): PersonalizedMemory => {
  const memory = getPersonalMemory();
  memory.favoriteTopics = memory.favoriteTopics.filter(t => t.id !== id);
  savePersonalMemory(memory);
  return memory;
};

export const updateMemoryItem = (id: string, updates: Partial<AIMemoryItem>): PersonalizedMemory => {
  const memory = getPersonalMemory();
  const itemIndex = memory.favoriteTopics.findIndex(t => t.id === id);
  if (itemIndex !== -1) {
    memory.favoriteTopics[itemIndex] = { ...memory.favoriteTopics[itemIndex], ...updates };
    savePersonalMemory(memory);
  }
  return memory;
};

export const exportMemoryJSON = (): string => {
  const memory = getPersonalMemory();
  return JSON.stringify(memory, null, 2);
};

export const importMemoryJSON = (jsonStr: string): boolean => {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && Array.isArray(parsed.favoriteTopics)) {
      savePersonalMemory(parsed);
      return true;
    }
  } catch (e) {
    console.warn("Failed to import memory JSON:", e);
  }
  return false;
};

export const getFormattedMemoryForContext = (): string => {
  const memory = getPersonalMemory();
  const activeItems = memory.favoriteTopics.filter(t => t.enabled !== false);
  if (activeItems.length === 0) return "";
  
  const longTerm = activeItems.filter(t => t.type === "long_term" || !t.type);
  const shortTerm = activeItems.filter(t => t.type === "short_term");

  let result = "USER PERSONAL AI MEMORY & PREFERENCES:\n";
  if (longTerm.length > 0) {
    result += "- Long-term Interests/Preferences: " + longTerm.map(i => `${i.topic}${i.notes ? ` (${i.notes})` : ""}`).join(", ") + "\n";
  }
  if (shortTerm.length > 0) {
    result += "- Short-term Context/Topics: " + shortTerm.map(i => `${i.topic}${i.notes ? ` (${i.notes})` : ""}`).join(", ") + "\n";
  }
  if (memory.coHostPersona) {
    result += `- Preferred AI Co-Host Persona: ${memory.coHostPersona}\n`;
  }
  return result;
};

export const getListenStats = (): ListenStats => {
  try {
    const saved = localStorage.getItem(KEYS.STATS);
    return saved ? JSON.parse(saved) : DEFAULT_STATS;
  } catch {
    return DEFAULT_STATS;
  }
};

export const saveListenStats = (stats: ListenStats) => {
  try {
    localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
    featureStoreEvents.emitChange();
  } catch (e) {
    console.warn("Failed to save stats:", e);
  }
};

export const recordListeningSession = (seconds: number, language: "vi" | "en" | "bilingual", category = "News", source = "CommuteCast Feed") => {
  const stats = getListenStats();
  const memory = getPersonalMemory();

  // 1. Update statistics
  stats.totalSeconds += seconds;
  stats.totalStoriesRead += 1;
  stats.byLanguage[language] = (stats.byLanguage[language] || 0) + 1;
  stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
  stats.byFeedSource[source] = (stats.byFeedSource[source] || 0) + 1;

  // Add to dailyHistory (last item matching today's weekday)
  const today = new Date().toLocaleDateString("en-US", { weekday: "short" });
  const index = stats.dailyHistory.findIndex(d => d.date === today);
  if (index !== -1) {
    stats.dailyHistory[index].seconds += seconds;
  } else {
    // shift or add
    if (stats.dailyHistory.length >= 7) {
      stats.dailyHistory.shift();
    }
    stats.dailyHistory.push({ date: today, seconds });
  }
  saveListenStats(stats);

  // 2. Update AI Personalized Memory
  const existingTopicIndex = memory.favoriteTopics.findIndex(t => t.topic.toLowerCase() === category.toLowerCase());
  if (existingTopicIndex !== -1) {
    memory.favoriteTopics[existingTopicIndex].interactedCount += 1;
    memory.favoriteTopics[existingTopicIndex].lastInteractedAt = new Date().toISOString();
  } else {
    memory.favoriteTopics.push({
      id: Math.random().toString(),
      topic: category,
      category,
      interactedCount: 1,
      lastInteractedAt: new Date().toISOString()
    });
  }
  
  memory.totalListeningSeconds += seconds;
  if (!memory.preferredSources.includes(source)) {
    memory.preferredSources.push(source);
    if (memory.preferredSources.length > 5) {
      memory.preferredSources.shift();
    }
  }
  memory.preferredLanguage = language;
  memory.lastActiveDate = new Date().toLocaleDateString();

  savePersonalMemory(memory);
};

// Smart Queue persistence & management
export const getPlayQueue = (): QueueItem[] => {
  try {
    const saved = localStorage.getItem(KEYS.QUEUE);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const savePlayQueue = (queue: QueueItem[]) => {
  try {
    localStorage.setItem(KEYS.QUEUE, JSON.stringify(queue));
    featureStoreEvents.emitChange();
  } catch (e) {
    console.warn("Failed to save queue:", e);
  }
};

export const addToQueue = (item: QueueItem) => {
  const queue = getPlayQueue();
  if (!queue.some(q => q.id === item.id)) {
    queue.push(item);
    savePlayQueue(queue);
  }
};

export const removeFromQueue = (id: string) => {
  const queue = getPlayQueue();
  const updated = queue.filter(q => q.id !== id);
  savePlayQueue(updated);
};

export const clearQueue = () => {
  savePlayQueue([]);
};

// Playback History
export const getPlaybackHistory = (): QueueItem[] => {
  try {
    const saved = localStorage.getItem(KEYS.HISTORY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const savePlaybackHistory = (history: QueueItem[]) => {
  try {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
    featureStoreEvents.emitChange();
  } catch (e) {
    console.warn("Failed to save history:", e);
  }
};

export const addToPlaybackHistory = (item: QueueItem) => {
  const history = getPlaybackHistory();
  const filtered = history.filter(h => h.id !== item.id);
  // Max 30 items
  const updated = [item, ...filtered].slice(0, 30);
  savePlaybackHistory(updated);
};

export const clearPlaybackHistory = () => {
  savePlaybackHistory([]);
};

// Favorites
export const getFavoriteIds = (): string[] => {
  try {
    const saved = localStorage.getItem(KEYS.FAVORITES);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveFavoriteIds = (ids: string[]) => {
  try {
    localStorage.setItem(KEYS.FAVORITES, JSON.stringify(ids));
    featureStoreEvents.emitChange();
  } catch (e) {
    console.warn("Failed to save favorites:", e);
  }
};

export const toggleFavoriteId = (id: string) => {
  const ids = getFavoriteIds();
  const updated = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
  saveFavoriteIds(updated);
};

// Repeat Mode: "off" | "all" | "one"
export const getRepeatMode = (): "off" | "all" | "one" => {
  try {
    const saved = localStorage.getItem(KEYS.REPEAT_MODE);
    return (saved as any) || "off";
  } catch {
    return "off";
  }
};

export const setRepeatMode = (mode: "off" | "all" | "one") => {
  try {
    localStorage.setItem(KEYS.REPEAT_MODE, mode);
    featureStoreEvents.emitChange();
  } catch (e) {
    console.warn("Failed to save repeat mode:", e);
  }
};

// Auto Continue
export const getAutoContinue = (): boolean => {
  try {
    const saved = localStorage.getItem(KEYS.AUTO_CONTINUE);
    return saved !== null ? saved === "true" : true;
  } catch {
    return true;
  }
};

export const setAutoContinue = (enabled: boolean) => {
  try {
    localStorage.setItem(KEYS.AUTO_CONTINUE, String(enabled));
    featureStoreEvents.emitChange();
  } catch (e) {
    console.warn("Failed to save auto continue:", e);
  }
};
