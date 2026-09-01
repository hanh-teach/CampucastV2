import { SubTabBar } from "./components/SubTabBar";

import { colors } from "./foundation/tokens/colors";
import { cn } from "./lib/utils";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";

import { telemetry } from "./services/telemetryService";

import { ExecutionStateView } from "./components/ExecutionStateView";

import { 
  Activity, AudioLines, 
  Settings2, 
  HelpCircle, 
  Sparkles, 
  FileText, 
  Volume2, 
  Info, 
  Flame, 
  Download, 
  Trash2, 
  History, 
  CheckCircle,
  CheckCircle2, 
  Compass, 
  Clock, 
  AlertCircle,
  RefreshCcw,
  BookOpen,
  Languages,
  ArrowRight,
  ExternalLink,
  Bell,
  BellRing,
  BellOff,
  Rss,
  ThumbsUp,
  X,
  ShieldAlert,
  AlertTriangle,
  Podcast,
  Search,
  ListMusic,
  MapPin,
  Radio,
  Wrench
} from "lucide-react";

import { SummaryPreferences, SavedSummary, SummaryPayload, PublishedEpisode, ExecutionState, ExecutionStateEvent, TabType, DeviceType, WorkspaceSubTab, MissionStudioSubTab, LibrarySubTab, AICenterSubTab, SettingsSubTab, EnterpriseSubTab } from "./types";
import { EnterpriseTeamHub } from "./components/EnterpriseTeamHub";

import { SAMPLE_ARTICLES_PRESETS } from "./utils";
import { RssNotificationBanner } from "./components/views/RssNotificationBanner";

import ManualPcmPlayer from "./components/ManualPcmPlayer";

import PodcastManager from "./components/PodcastManager";

// Helper to construct fully qualified API URL on production

import { getApiUrl } from "./utils/apiUtils";



import { useDrivingMode } from "./hooks/useDrivingMode";
import { useVoiceSearch } from "./hooks/useVoiceSearch";
import { usePodcastPublishing } from "./hooks/usePodcastPublishing";
import { useBriefingGeneration } from "./hooks/useBriefingGeneration";
import { useMotionDetection } from "./hooks/useMotionDetection";
import { useScheduledBriefing } from "./hooks/useScheduledBriefing";
import { useTrafficAlerts } from "./hooks/useTrafficAlerts";

import { motion, AnimatePresence } from "motion/react";


import { useBriefcase } from "./hooks/useBriefcase";

import { useUserPreferences } from "./components/UserPreferencesProvider";
import { useTheme } from "./components/ThemeProvider";

import { incrementBriefingLikes, saveReadingItem } from "./services/storageService";

import { recordInteraction } from "./services/interactionService";

import { schedulePreferenceCalculation } from "./services/preferenceService";

const DrivingMode = React.lazy(() => import("./components/DrivingMode"));

import SampleBriefings from "./components/SampleBriefings";

import StorageStats from "./components/StorageStats";

import VoiceSearch from "./components/VoiceSearch";

import AssistantChat from "./components/AssistantChat";

// Modern AI Assistant Modular Features

import { SmartQueue } from "./features/queue/SmartQueue";

import { ReadingStatistics } from "./features/statistics/ReadingStatistics";

import { PersonalMemory } from "./features/memory/PersonalMemory";

const PwaStatus = lazy(() => import("./features/pwa/PwaStatus").then(m => ({ default: m.PwaStatus })));

import { PERSONALAS } from "./utils/personaData";
import { DownloadManager } from "./features/download/DownloadManager";

const SettingsTabView = lazy(() => import("./components/views/SettingsTabView"));

import { addToQueue, getPlayQueue, getPersonalMemory, removeFromQueue, recordListeningSession, addToPlaybackHistory, getRepeatMode, getAutoContinue, getPlaybackHistory, savePlayQueue } from "./features/store";

import { useKeyboardShortcuts } from "./features/keyboard/useKeyboardShortcuts";

import { Brain, ListPlus, Settings, Car, Mic, Folder, BrainCircuit } from "lucide-react";


import TopicSuggestions from "./components/TopicSuggestions";
import { TelemetryDashboard } from "./components/TelemetryDashboard";
import PreferencesForm from "./components/PreferencesForm";
import ComingSoonPlaceholder from "./components/ComingSoonPlaceholder";
import AutomationControl from "./components/AutomationControl";
import { PerceptionSurvey } from "./components/PerceptionSurvey";

import RSSManager from "./components/RSSManager";

import TrendingBriefings from "./components/TrendingBriefings";

import ShareButton from "./components/ShareButton";

import { setupBackgroundRSSCheck } from "./services/schedulerService";

import { formatArticlesForPrompt } from "./services/rssService";

import { RSSArticle } from "./types";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import SharedBriefingPage from "./components/SharedBriefingPage";

import { useSync } from "./hooks/useSync";

import UserProfile from "./components/UserProfile";
import LoginModal from "./components/LoginModal";
import HelpCenterModal from "./components/HelpCenterModal";

import { useAutosave } from "./hooks/useAutosave";

import SyncStatus from "./components/SyncStatus";
import SyncConflictToast from "./components/SyncConflictToast";

import { syncSaveVoiceHistoryAsync } from "./services/syncService";

import { saveEpisodeToOffline, getEpisodeFromOffline, deleteOldEpisodes } from "./services/offlineStorageService";

import { Header } from "./components/Header";
import { useAdaptive } from "./layouts/AdaptiveContext";
import { AdaptiveNavigation } from "./layouts/AdaptiveNavigation";
import { WorkspaceSkeleton } from "./components/WorkspaceSkeleton";
import HomeTabView from "./components/views/HomeTabView";
import MissionTabView from "./components/views/MissionTabView";
const AssetsTabView = lazy(() => import("./components/views/AssetsTabView"));
const SuggestionsTabView = lazy(() => import("./components/views/SuggestionsTabView").then(m => ({ default: m.SuggestionsTabView })));
const MissionIntelligenceWorkspace = lazy(() => import("./components/MissionIntelligenceWorkspace"));
const AIHostView = lazy(() => import("./components/AIHostView"));
const AdaptivePlayground = lazy(() => import("./components/AdaptivePlayground").then(m => ({ default: m.AdaptivePlayground })));
const AnalyticsView = lazy(() => import("./components/AnalyticsView"));
import { KNOWLEDGE_SNAPSHOTS } from "./data/snapshots";
import { SnapshotLifecycleState } from "./types/snapshot";

import { translations } from "./utils/translations";
import { sendNotification } from "./utils/notification";

/**
 * Helper component to highlight matching search query terms inside title or description text.
 */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim() || !text) {
    return <>{text}</>;
  }

  const trimmedQuery = query.trim();
  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmedQuery.toLowerCase() ? (
          <mark
            key={index}
            className="bg-amber-400/30 text-amber-900 dark:bg-amber-400/25 dark:text-amber-300 font-black px-0.5 rounded underline decoration-amber-500/60 decoration-1 underline-offset-2 inline"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

function AppContent() {
  const { device } = useAdaptive();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [uiLanguage, setUiLanguage] = useState<"vi" | "en">(() => {
    const saved = localStorage.getItem("commutecast_ui_language");
    if (saved === "vi" || saved === "en") return saved;
    return "vi";
  });
  const t = translations[uiLanguage];
  const [activeTab, setActiveTab] = useState<TabType>("workspace");
  const [workspaceSubTab, setWorkspaceSubTab] = useState<WorkspaceSubTab>("dashboard");
  const [missionStudioSubTab, setMissionStudioSubTab] = useState<MissionStudioSubTab>("source");
  const [librarySubTab, setLibrarySubTab] = useState<LibrarySubTab>("missions");
  const [aiCenterSubTab, setAiCenterSubTab] = useState<AICenterSubTab>("models");
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>("general");

  const [createSubTab, setCreateSubTab] = useState<"editor" | "rss">("editor");
  const [activeLibrarySubTab, setActiveLibrarySubTab] = useState<"briefings" | "podcast" | "queue" | "stats" | "storage">("briefings");
  const [isAdvancedAiExpanded, setIsAdvancedAiExpanded] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);

  const { preferences, updatePreferences, updateVoice, updateLanguage, updateSpeed, updateDrivingMode } = useUserPreferences();
  const userPref = preferences;

  // --- UI Layout & Global States ---
  const [activeIntelligenceTab, setActiveIntelligenceTab] = useState<"history" | "podcast">("history");
  const [rightTab, setRightTab] = useState<"player" | "ai" | "settings">("player");
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [rssNotificationArticles, setRssNotificationArticles] = useState<RSSArticle[]>([]);
  const [showRssNotification, setShowRssNotification] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Sync uiLanguage state with preferences.language
  useEffect(() => {
    if (preferences.language && (preferences.language === "vi" || preferences.language === "en")) {
      setUiLanguage(preferences.language);
    }
  }, [preferences.language]);

  // --- 1. Cloud Synchronization (useSync) ---
  const { 
    user, 
    syncStatus, 
    isOnline: syncOnline, 
    triggerSync, 
    abortSync,
    showSyncSuccessToast,
    dismissSyncSuccessToast
  } = useSync();

  // --- 2. Briefings Storage & Database (useBriefcase) ---
  const {
    briefings: savedBriefings,
    saveNewBriefing,
    deleteOneBriefing,
    archiveBriefing,
    updateBriefingTags,
    getFullBriefing,
    storageUsage,
    clearAllBriefings,
    clearAllLocalDataComprehensive,
    refreshBriefings
  } = useBriefcase();

  // --- 3. Podcast Publishing Manager (usePodcastPublishing) ---
  const {
    podcastEpisodes,
    selectedBriefId,
    setSelectedBriefId,
    isPublishingPodcast,
    podcastError,
    setPodcastError,
    isAutoPublish,
    setIsAutoPublish,
    loadPodcastEpisodes,
    handlePublishPodcast,
    handleDeletePodcastEpisode
  } = usePodcastPublishing({
    getApiUrl,
    uiLanguage,
    getFullBriefing,
    saveNewBriefing
  });

  // --- 4. Voice Search Assistant (useVoiceSearch) ---
  const {
    isListening,
    voiceInputLanguage,
    setVoiceInputLanguage,
    voiceQueryStatus,
    voiceQueryResult,
    setVoiceQueryResult,
    voiceQuerySources,
    setVoiceQuerySources,
    showVoiceAddPrompt,
    setShowVoiceAddPrompt,
    voiceError,
    isProcessingVoiceQuery,
    startVoiceSearch,
    handleVoiceAddToBriefing
  } = useVoiceSearch(getApiUrl, t, uiLanguage);

  // --- 5. Custom Audio Briefing Engine (useBriefingGeneration) ---
  const {
    newsContent,
    setNewsContent,
    selectedNewsCategory,
    setSelectedNewsCategory,
    isGeneratingNews,
    newsGenerationError,
    step,
    setStep,
    executionState,
    setExecutionState,
    trackExecutionState,
    errorMessage,
    setErrorMessage,
    generationProgress,
    setGenerationProgress,
    isRssBasedGeneration,
    setIsRssBasedGeneration,
    targetNewsTitle,
    setTargetNewsTitle,
    currentCorrelationId,
    setCurrentCorrelationId,
    activePayload,
    setActivePayload,
    activeAudioChunks,
    setActiveAudioChunks,
    activeTitle,
    setActiveTitle,
    pendingVoiceConfirm,
    confirmDefaultVoiceAndContinue,
    cancelVoiceConfirm,
    synthesisWarning,
    handleCreateNews,
    handleGenerateBriefing,
    handleGenerateScript,
    handleGenerateAudio,
    handleApplyIntelligenceBriefing
  } = useBriefingGeneration({
    getApiUrl,
    uiLanguage,
    t,
    preferences,
    updatePreferences,
    saveNewBriefing,
    getFullBriefing,
    removeFromQueue,
    isAutoPublish,
    handlePublishPodcast,
    rssNotificationArticles,
    setActiveTab,
    onBriefingCreated: setSelectedBriefId
  });

  const [isPlayerPlaying, setIsPlayerPlaying] = useState(false);

  useEffect(() => {
    const handlePlayerState = (e: any) => {
      setIsPlayerPlaying(e.detail.isPlaying);
    };
    window.addEventListener("commutecast-player-state", handlePlayerState);
    return () => window.removeEventListener("commutecast-player-state", handlePlayerState);
  }, []);

  const playBriefing = (brief: any) => {
    if (selectedBriefId === brief.id) {
       // Toggle if same
       window.dispatchEvent(new CustomEvent("commutecast-toggle-play"));
    } else {
       handleApplyIntelligenceBriefing(brief);
       setSelectedBriefId(brief.id);
    }
    setRightTab("player");
  };


  const { status: autosaveStatus } = useAutosave(newsContent, (data) => {
    localStorage.setItem("commutecast_draft_news", data);
  });

  const charLength = newsContent.length;
  const wordCount = newsContent.trim() === "" ? 0 : newsContent.trim().split(/\s+/).length;

  useEffect(() => {
    // Reset scroll to top when tab changes
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTop = 0;
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).isCommuteCastGeneratingBriefing = (step === "summarizing" || step === "synthesizing");
    }
  }, [step]);

  const getPublicRssUrl = (): string => {
    const apiPath = getApiUrl("/api/podcast/feed");
    if (apiPath.startsWith("http")) {
      return apiPath;
    }
    if (typeof window !== "undefined") {
      return `${window.location.protocol}//${window.location.host}${apiPath.startsWith("/") ? apiPath : `/${apiPath}`}`;
    }
    return "/api/podcast/feed";
  };
  const absoluteRssUrl = getPublicRssUrl();

  // Notification State and Controller
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

// Request notification permission with better error handling
const requestNotificationPermission = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    alert(uiLanguage === "vi" ? "Trình duyệt không hỗ trợ thông báo." : "Notifications not supported.");
    return;
  }

  const currentPermission = Notification.permission;
  
  if (currentPermission === "granted") {
    alert(uiLanguage === "vi" 
      ? "🔔 Thông báo đang bật. Để tắt, hãy vào cài đặt trình duyệt (Settings > Privacy > Notifications) và chặn trang web này."
      : "🔔 Notifications are enabled. To disable, go to browser settings and block this site."
    );
    return;
  }

  if (currentPermission === "denied") {
    alert(uiLanguage === "vi"
      ? "❌ Thông báo đã bị chặn. Vui lòng vào cài đặt trình duyệt để bật lại."
      : "❌ Notifications are blocked. Please enable in browser settings."
    );
    return;
  }

  // default: request permission
  try {
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    
    if (permission === "granted") {
      sendNotification(t.notificationToastTitle, {
        body: t.notificationToastBody,
        icon: "/icon-192.jpg"
      });
    }
  } catch (error) {
    console.error("Notification error:", error);
  }
};



  // Synchronize UI Language setting and cache language state securely
  const handleSetUiLanguage = (lang: "vi" | "en") => {
    setUiLanguage(lang);
    localStorage.setItem("commutecast_ui_language", lang);
    updatePreferences({ language: lang });
  };

  const { toggleDrivingMode, toast: drivingToast, clearToast: clearDrivingToast } = useDrivingMode(uiLanguage);
  const { speed, suggestDrivingMode, dismissSuggestion } = useMotionDetection();
  const { scheduledToast, dismissToast: dismissScheduledToast } = useScheduledBriefing({
    preferences: userPref,
    uiLanguage,
    onTriggerBriefing: () => handleGenerateBriefing()
  });
  const { activeAlert: trafficAlert, dismissAlert: dismissTrafficAlert, triggerTrafficAlert, playAlertAudio } = useTrafficAlerts({
    preferences: userPref,
    uiLanguage,
    isDrivingMode: userPref.isDrivingMode,
    autoAudioAlertsEnabled: userPref.autoAudioAlertsEnabled
  });

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onTogglePlay: () => {
      window.dispatchEvent(new CustomEvent("commutecast-toggle-play"));
    },
    onToggleDrivingMode: () => {
      if (typeof updateDrivingMode === "function") {
        updateDrivingMode(!userPref.isDrivingMode);
      }
    },
    onFocusSearch: () => {
      const searchInput = document.getElementById("rss-search-input");
      if (searchInput) {
        searchInput.focus();
      }
    },
    onCloseDialog: () => {
      setStep("idle");
    },
    onSeekBackward: () => {
      window.dispatchEvent(new CustomEvent("commutecast-seek", { detail: { direction: "backward" } }));
    },
    onSeekForward: () => {
      window.dispatchEvent(new CustomEvent("commutecast-seek", { detail: { direction: "forward" } }));
    }
  });

  // Reload local briefings when Cloud Sync finishes successfully
  useEffect(() => {
    if (syncStatus === "synced") {
      refreshBriefings(false);
    }
  }, [syncStatus, refreshBriefings]);

  // Global Ctrl+K Search Palette States
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSearchCategory, setSelectedSearchCategory] = useState<"all" | "briefings" | "settings" | "tools">("all");

  useEffect(() => {
    const handleGlobalSearchKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
        setSearchQuery(""); // clear query on open
        setSelectedSearchCategory("all");
      }
    };
    window.addEventListener("keydown", handleGlobalSearchKey);
    return () => window.removeEventListener("keydown", handleGlobalSearchKey);
  }, []);

  // Tự động dọn dẹp các tập âm thanh offline cũ hơn 7 ngày khi khởi động ứng dụng
  useEffect(() => {
    deleteOldEpisodes()
      .then((count) => {
        if (count > 0) {
          console.log(`[Offline Storage] Đã tự động dọn dẹp ${count} bản tin cũ hơn 7 ngày từ store offline.`);
        }
      })
      .catch((err) => {
        console.warn("Lỗi khi tự động dọn dẹp bản tin offline cũ:", err);
      });
  }, []);

  // Background RSS fetch scheduler setup
  useEffect(() => {
    const unsubscribe = setupBackgroundRSSCheck(getApiUrl, (articles) => {
      setRssNotificationArticles(articles);
      setShowRssNotification(true);

      // Automatically add to Smart Play Queue so user can play it later
      if (articles && articles.length > 0) {
        addToQueue({
          id: "automated-rss-daily-briefing",
          title: uiLanguage === "vi" ? "⚡ Bản tin RSS tự động mới" : "⚡ New Automated RSS Briefing",
          subtitle: uiLanguage === "vi" 
            ? `Phát hiện ${articles.length} bài viết mới từ nguồn RSS` 
            : `Detected ${articles.length} new articles from RSS`,
          type: "rss",
          payload: articles
        });
      }
      
      // Also show browser native notification if permission is granted
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        sendNotification(uiLanguage === "vi" ? "Bản tin RSS mới khả dụng!" : "New RSS Briefing Available!", {
          body: uiLanguage === "vi" 
            ? `Có ${articles.length} bài viết mới sẵn sàng được phát thanh.` 
            : `There are ${articles.length} new articles ready for voice broadcast.`,
          icon: "/icon-192.jpg"
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [uiLanguage]);

  // Load shared briefing from hash on load or on hashchange
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#briefing=")) {
        const sharedId = hash.replace("#briefing=", "");
        if (sharedId) {
          try {
            const fullItem = await getFullBriefing(sharedId);
            if (fullItem) {
              setActivePayload(fullItem.payload);
              setActiveAudioChunks(fullItem.audioChunks || []);
              setActiveTitle(fullItem.payload.title);
              updatePreferences(fullItem.preferences);
              setSelectedBriefId(fullItem.id);
              setStep("ready");
    trackExecutionState("ready_to_play");
              
              alert(uiLanguage === "vi" 
                ? `Đã tải bản tin được chia sẻ: "${fullItem.payload.title}"` 
                : `Loaded shared briefing: "${fullItem.payload.title}"`
              );
              
              // Clear hash to prevent infinite load triggers
              window.location.hash = "";
            } else {
              console.log("Shared briefing not found locally.");
            }
          } catch (err) {
            console.error("Error loading shared hash briefing:", err);
          }
        }
      }
    };

    // Run on startup shortly after mount
    const timer = setTimeout(handleHashChange, 1200);

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [getFullBriefing, uiLanguage]);

  // Load shared RSS article from URL query parameter
  useEffect(() => {
    const checkSharedArticle = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedArtB64 = urlParams.get("shared_art");
        if (sharedArtB64) {
          const decodedStr = decodeURIComponent(escape(atob(sharedArtB64)));
          const article = JSON.parse(decodedStr);
          if (article && article.title) {
            saveReadingItem({
              id: article.link || article.title,
              title: article.title,
              url: article.link,
              feedTitle: article.feedTitle || (uiLanguage === "vi" ? "Bài viết chia sẻ" : "Shared Article"),
              category: article.category || (uiLanguage === "vi" ? "Chia sẻ" : "Shared"),
              content: article.content || "",
              pubDate: article.pubDate || new Date().toISOString(),
              feedType: "news"
            });

            // Brief delay to let UI establish, then show alert/notification
            setTimeout(() => {
              alert(uiLanguage === "vi"
                ? `Đã nhận được bài viết chia sẻ: "${article.title}". Đã lưu vào danh sách Đọc Sau!`
                : `Received shared article: "${article.title}". Saved to your Read Later list!`
              );
            }, 800);

            // Clean up query param to avoid repeat imports
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }
        }
      } catch (err) {
        console.error("Error parsing shared article:", err);
      }
    };

    const timer = setTimeout(checkSharedArticle, 1500);
    return () => clearTimeout(timer);
  }, [uiLanguage]);

const handleApplyPreset = (index: number) => {
  // Ép kiểu an toàn, đảm bảo index luôn là số
  const safeIndex = typeof index === 'number' ? index : 0;
  const preset = SAMPLE_ARTICLES_PRESETS[safeIndex];
  if (!preset) return;
  setNewsContent((prev) => {
    const separator = prev ? "\n\n---\n\n" : "";
    return prev + separator + `Source: ${preset.title}\n\n${preset.content}`;
  });
};

  const handleClearInput = () => {
    setNewsContent("");
    setActivePayload(null);
    setActiveAudioChunks([]);
    setSelectedBriefId("");
    setMissionStudioSubTab("source");
  };

  const handlePlayerEnded = async () => {
    // Check if Sleep Timer is set to "End of current briefing"
    const sleepAtEnd = localStorage.getItem("cc_sleep_at_briefing_end") === "true";
    if (sleepAtEnd) {
      localStorage.removeItem("cc_sleep_at_briefing_end");
      localStorage.removeItem("cc_sleep_seconds_left");
      // Stop playing, trigger a state update to stop or keep as paused
      return;
    }

    // 1. Record listen session to statistics and AI memory
    if (activePayload) {
      const estimatedSeconds = activePayload.chapters.reduce(
        (acc: number, ch: any) => acc + (ch.scriptText?.length || 0) * 0.08,
        120
      );
      recordListeningSession(
        Math.round(estimatedSeconds),
        preferences.language === "bilingual" ? "bilingual" : preferences.language === "en" ? "en" : "vi",
        activePayload.chapters[0]?.topic || "News",
        "CommuteCast Podcast Feed"
      );

      // Add the ended item to Playback History
      const playedQueueItem = {
        id: selectedBriefId || `briefing-${Date.now()}`,
        title: activePayload.title || activeTitle || "Untitled",
        subtitle: activePayload.subtitle || (uiLanguage === "vi" ? "Bản tin tổng hợp" : "Summarized Briefing"),
        duration: estimatedSeconds,
        type: "custom" as const,
        payload: activePayload
      };
      addToPlaybackHistory(playedQueueItem);
    }

    const repeatMode = getRepeatMode();
    const autoContinue = getAutoContinue();

    if (repeatMode === "one") {
      // Repeat current item: replay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("commutecast-toggle-play"));
      }, 1000);
      return;
    }

    if (!autoContinue) {
      // Auto continue is disabled, stop playback
      return;
    }

    // 2. Play next item in Smart Queue if available
    const queue = getPlayQueue();
    if (queue.length > 0) {
      const nextItem = queue[0];
      removeFromQueue(nextItem.id); 

      try {
        let fullItem = await getEpisodeFromOffline(nextItem.id);
        if (!fullItem) {
          fullItem = await getFullBriefing(nextItem.id);
        }
        if (fullItem) {
          setActivePayload(fullItem.payload);
          setActiveAudioChunks(fullItem.audioChunks || []);
          setActiveTitle(fullItem.payload.title);
          updatePreferences(fullItem.preferences);
          setSelectedBriefId(fullItem.id);
          setStep("ready");
    trackExecutionState("ready_to_play");
          
          // Trigger custom event to start playing immediately
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("commutecast-toggle-play"));
          }, 1000);
        }
      } catch (err) {
        console.error("Failed to auto-play next queue item:", err);
      }
    } else if (repeatMode === "all") {
      // Repeat All: repopulate queue from History and play first
      const history = getPlaybackHistory();
      if (history.length > 0) {
        const reordered = [...history].reverse();
        savePlayQueue(reordered);

        const nextItem = reordered[0];
        removeFromQueue(nextItem.id);

        try {
          let fullItem = await getEpisodeFromOffline(nextItem.id);
          if (!fullItem) {
            fullItem = await getFullBriefing(nextItem.id);
          }
          if (fullItem) {
            setActivePayload(fullItem.payload);
            setActiveAudioChunks(fullItem.audioChunks || []);
            setActiveTitle(fullItem.payload.title);
            updatePreferences(fullItem.preferences);
            setSelectedBriefId(fullItem.id);
            setStep("ready");
    trackExecutionState("ready_to_play");
            
            // Trigger custom event to start playing immediately
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("commutecast-toggle-play"));
            }, 1000);
          }
        } catch (err) {
          console.error("Failed to auto-play next queue item in Repeat All:", err);
        }
      }
    }
  };

  const handleDeleteIntelligenceItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemToDelete = savedBriefings.find(item => item.id === id);
    await deleteOneBriefing(id);

    if (activePayload && itemToDelete && itemToDelete.payload.title === activePayload.title) {
      setActivePayload(null);
      setActiveAudioChunks([]);
      setStep("idle");
    }
  };

  const getSearchResults = () => {
    const query = searchQuery.trim().toLowerCase();
    // If no search query and 'all' category is selected, return empty so quick suggestions show
    if (!query && selectedSearchCategory === "all") return [];

    const results: any[] = [];

    // 1. Workstations / Tools / Settings
    const stations = [
      { id: "home", category: "tools", categoryLabelVi: "Công cụ", categoryLabelEn: "Tools", titleVi: "Trang Chủ (Workspace Resume)", titleEn: "Home Workspace", descVi: "Tổng quan công việc, tiếp tục bản thảo và khôi phục phiên làm việc", descEn: "Overview, resume drafts, and session recovery", action: () => { setActiveTab("workspace"); setWorkspaceSubTab("dashboard"); setShowSearchModal(false); } },
      { id: "create", category: "tools", categoryLabelVi: "Công cụ", categoryLabelEn: "Tools", titleVi: "Trạm Soạn Thảo (Studio Desk)", titleEn: "Studio Desk (Create)", descVi: "Soạn kịch bản, đọc báo RSS, phát sinh bản tin phát thanh AI", descEn: "Draft scripts, read RSS, generate AI radio briefings", action: () => { setActiveTab("mission_studio"); setMissionStudioSubTab("draft"); setShowSearchModal(false); } },
      { id: "rss", category: "tools", categoryLabelVi: "Công cụ", categoryLabelEn: "Tools", titleVi: "Đọc Báo RSS", titleEn: "RSS Channels Reader", descVi: "Xem các nguồn tin RSS và tổng hợp tự động", descEn: "Browse RSS feeds and aggregate content", action: () => { setActiveTab("mission_studio"); setMissionStudioSubTab("source"); setShowSearchModal(false); } },
      { id: "intelligence", category: "tools", categoryLabelVi: "Công cụ", categoryLabelEn: "Tools", titleVi: "Thư Viện Phát & Lưu Trữ (Media Library)", titleEn: "Media Library & Playlists", descVi: "Quản lý bản tin đã lưu, hàng đợi phát và kênh Podcast", descEn: "Manage play queue, saved briefings, and podcast publishing", action: () => { setActiveTab("library"); setLibrarySubTab("missions"); setShowSearchModal(false); } },
      { id: "podcast", category: "tools", categoryLabelVi: "Công cụ", categoryLabelEn: "Tools", titleVi: "Nhà Xuất Bản Podcast", titleEn: "Podcast Publisher Portal", descVi: "Xuất bản bản tin lên feed Podcast công cộng", descEn: "Publish compiled episodes to public RSS feeds", action: () => { setActiveTab("library"); setLibrarySubTab("archive"); setShowSearchModal(false); } },
      { id: "queue", category: "tools", categoryLabelVi: "Công cụ", categoryLabelEn: "Tools", titleVi: "Hàng Đợi Nghe Thông Minh", titleEn: "Smart Play Queue", descVi: "Sắp xếp thứ tự danh sách phát bản tin offline", descEn: "Arrange offline playback order and playlist history", action: () => { setActiveTab("library"); setLibrarySubTab("audio"); setShowSearchModal(false); } },
      { id: "stats", category: "tools", categoryLabelVi: "Công cụ", categoryLabelEn: "Tools", titleVi: "Thống Kê Thói Quen Nghe", titleEn: "Listening Analytics", descVi: "Phân tích thời lượng nghe, dung lượng lưu trữ offline", descEn: "Analyze play time and cached storage metrics", action: () => { setActiveTab("library"); setLibrarySubTab("archive"); setShowSearchModal(false); } },
      { id: "read_history", category: "tools", categoryLabelVi: "Công cụ", categoryLabelEn: "Tools", titleVi: "Lịch Sử Đọc Báo (Read History)", titleEn: "Article Read History", descVi: "Xem nhật ký các bài viết RSS đã đọc theo thời gian", descEn: "View chronological log of consumed RSS articles", action: () => { setActiveTab("library"); setLibrarySubTab("read_history"); setShowSearchModal(false); } },
      { id: "settings", category: "settings", categoryLabelVi: "Cài đặt", categoryLabelEn: "Settings", titleVi: "Cài Đặt Hệ Thống & AI Host", titleEn: "System & AI Host Settings", descVi: "Cấu hình giọng nói, tốc độ đọc, địa điểm, đồng bộ đám mây", descEn: "Configure voice settings, speed, weather commute, and cloud sync", action: () => { setActiveTab("ai_center"); setAiCenterSubTab("voice"); setShowSearchModal(false); } },
    ];
    stations.forEach(s => {
      if (!query || s.titleVi.toLowerCase().includes(query) || s.titleEn.toLowerCase().includes(query) || s.descVi.toLowerCase().includes(query) || s.descEn.toLowerCase().includes(query)) {
        results.push(s);
      }
    });

    // 2. Match Saved Briefings
    savedBriefings.forEach(b => {
      const title = b.payload?.title || "";
      const subtitle = b.payload?.subtitle || "";
      if (!query || title.toLowerCase().includes(query) || subtitle.toLowerCase().includes(query)) {
        results.push({
          id: b.id,
          category: "briefings",
          categoryLabelVi: "Bản tin",
          categoryLabelEn: "Briefings",
          titleVi: title,
          titleEn: title,
          descVi: `Bản tin lưu ngày ${new Date(b.createdAt || Date.now()).toLocaleDateString()}`,
          descEn: `Saved briefing from ${new Date(b.createdAt || Date.now()).toLocaleDateString()}`,
          action: () => {
            handleApplyIntelligenceBriefing(b);
            setShowSearchModal(false);
          }
        });
      }
    });

    // 3. Match AI Host Personas
    const personas = PERSONALAS.map(p => ({
      ...p,
      category: "settings",
      categoryLabelVi: "Cài đặt",
      categoryLabelEn: "Settings",
      action: () => { updatePreferences({ voice: p.voice }); setActiveTab("ai_center"); setAiCenterSubTab("voice"); setShowSearchModal(false); }
    }));
    personas.forEach(p => {
      if (!query || p.titleVi.toLowerCase().includes(query) || p.titleEn.toLowerCase().includes(query) || p.descVi.toLowerCase().includes(query) || p.descEn.toLowerCase().includes(query)) {
        results.push(p);
      }
    });

    // 4. Match System Controls
    const controls = [
      { id: "toggle_lang", category: "settings", categoryLabelVi: "Cài đặt", categoryLabelEn: "Settings", titleVi: "Đổi Ngôn Ngữ Giao Diện", titleEn: "Switch UI Language", descVi: "Chuyển giao diện sang Tiếng Anh hoặc Tiếng Việt", descEn: "Toggle interface between English and Vietnamese", action: () => { handleSetUiLanguage(uiLanguage === "vi" ? "en" : "vi"); setShowSearchModal(false); } },
      { id: "toggle_driving", category: "settings", categoryLabelVi: "Cài đặt", categoryLabelEn: "Settings", titleVi: "Bật/Tắt Chế Độ Lái Xe", titleEn: "Toggle Driving Mode", descVi: "Chuyển đổi giao diện HUD lái xe rảnh tay", descEn: "Activate or deactivate driving mode interface", action: () => { toggleDrivingMode(); setShowSearchModal(false); } },
      { id: "cloud_sync", category: "tools", categoryLabelVi: "Công cụ", categoryLabelEn: "Tools", titleVi: "Đồng Bộ Đám Mây", titleEn: "Trigger Cloud Sync", descVi: "Bắt đầu sao lưu và đồng bộ lịch sử bản tin", descEn: "Force backup and synchronization of your briefings", action: () => { triggerSync(); setActiveTab("settings"); setSettingsSubTab("sync"); setShowSearchModal(false); } },
    ];
    controls.forEach(c => {
      if (!query || c.titleVi.toLowerCase().includes(query) || c.titleEn.toLowerCase().includes(query) || c.descVi.toLowerCase().includes(query) || c.descEn.toLowerCase().includes(query)) {
        results.push(c);
      }
    });

    const filtered = selectedSearchCategory === "all"
      ? results
      : results.filter(r => r.category === selectedSearchCategory);

    return filtered.slice(0, 10);
  };

  const searchResults = getSearchResults();

  return (
    <>
      <Routes>
        <Route 
            path="/share/:id" 
            element={<SharedBriefingPage uiLanguage={uiLanguage} setUiLanguage={handleSetUiLanguage} />} 
        />
        <Route 
          path="/*" 
          element={
            <>
              <AnimatePresence>
              {userPref.isDrivingMode && activeAudioChunks.length === 0 && (
                <Suspense fallback={null}>
                  <DrivingMode
                    key="driving-empty"
                    title={step === "generating" || step === "summarizing" || step === "synthesizing" ? (uiLanguage === "vi" ? "Đang tạo bản tin vắn tắt..." : "Generating briefing...") : ""}
                    isPlaying={false}
                    currentTime={0}
                    totalDuration={0}
                    onPlayPause={() => {
                      if (savedBriefings && savedBriefings.length > 0) {
                        handleApplyIntelligenceBriefing(savedBriefings[0]);
                      }
                    }}
                    onSkip={() => {}}
                    onScrubberChange={() => {}}
                    onExit={() => updateDrivingMode(false)}
                    uiLanguage={uiLanguage}
                    error={step === "error" ? errorMessage : null}
                    isGenerating={step === "generating" || step === "summarizing" || step === "synthesizing" || isGeneratingNews}
                    generationProgress={generationProgress}
                    savedBriefings={savedBriefings}
                    onPlaySavedBriefing={handleApplyIntelligenceBriefing}
                    onRetryGeneration={() => handleGenerateBriefing()}
                    speed={speed}
                    hasActiveAlert={Boolean(trafficAlert)}
                    trafficAlert={trafficAlert}
                    autoAudioAlertsEnabled={userPref.autoAudioAlertsEnabled}
                    onToggleAutoAudioAlerts={() => {
                      if (typeof updatePreferences === "function") {
                        updatePreferences({ autoAudioAlertsEnabled: !userPref.autoAudioAlertsEnabled });
                      }
                    }}
                    onPlayAlertAudio={playAlertAudio}
                  />
                </Suspense>
              )}
            </AnimatePresence>

           <div className={`h-screen flex flex-col overflow-hidden bg-bg-primary text-text-main font-sans transition-colors duration-200 ${userPref.isDrivingMode ? "hidden" : ""}`} id="audio-commute-root">

      
      <Header 
        uiLanguage={uiLanguage}
        activeTab={activeTab}
        activeBriefingTitle={activeTitle}
        onSearchClick={() => setShowSearchModal(true)}
        onDrivingModeToggle={toggleDrivingMode}
        onNotificationClick={() => requestNotificationPermission()}
        onProfileClick={() => {
          if (user) {
            setActiveTab("settings");
          } else {
            setIsLoginOpen(true);
          }
        }}
        onAssistantToggle={() => setIsAssistantOpen(!isAssistantOpen)}
        onLanguageToggle={() => handleSetUiLanguage(uiLanguage === "vi" ? "en" : "vi")}
        onThemeToggle={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        isDarkMode={resolvedTheme === "dark"}
        syncStatus={syncStatus}
        user={user}
        onOpenLogin={() => setIsLoginOpen(true)}
        isOfflineMode={Boolean(userPref?.isOfflineMode)}
      />

      {/* Main Wrapper Layout with Sidebar & Content panel */}
      <div className="flex flex-col md:flex-row w-full max-w-[1600px] mx-auto relative flex-1 min-h-0 overflow-hidden">
      <AdaptiveNavigation activeTab={activeTab} setActiveTab={setActiveTab} uiLanguage={uiLanguage} />
                     
       <main className="flex-1 max-w-full overflow-y-auto custom-scrollbar">
         <div className="min-h-full flex flex-col justify-between w-full">
           <div className="flex-1 w-full flex flex-col">
             <ErrorBoundary>
               <Suspense fallback={<WorkspaceSkeleton />}>
           
           {/* RSS Auto-Briefing Notification banner */}
           {activeTab === "workspace" && (
             <SubTabBar 
               tabs={[
                 { id: "dashboard", label: uiLanguage === "vi" ? "Bảng điều khiển" : "Dashboard" },
                 { id: "recent", label: uiLanguage === "vi" ? "Gần đây" : "Recent" },
                 { id: "continue", label: uiLanguage === "vi" ? "Tiếp tục nhiệm vụ" : "Continue Mission" },
                 { id: "suggestions", label: uiLanguage === "vi" ? "AI Đề xuất" : "AI Suggestion" }
               ]}
               activeTab={workspaceSubTab}
               onTabChange={(id) => setWorkspaceSubTab(id as any)}
             />
           )}
           {activeTab === "mission_studio" && (
             <SubTabBar 
               tabs={[
                 { id: "source", label: uiLanguage === "vi" ? "Nguồn" : "Source" },
                 { id: "draft", label: uiLanguage === "vi" ? "Nội Dung" : "Content" },
                 { id: "voice", label: uiLanguage === "vi" ? "Giọng đọc" : "Voice" },
                 { id: "publish", label: uiLanguage === "vi" ? "Xuất bản" : "Publish" }
               ]}
               activeTab={missionStudioSubTab}
               onTabChange={(id) => setMissionStudioSubTab(id as any)}
             />
           )}
           {activeTab === "library" && (
             <SubTabBar 
               tabs={[
                 { id: "missions", label: uiLanguage === "vi" ? "Nhiệm vụ" : "Missions" },
                 { id: "audio", label: uiLanguage === "vi" ? "Âm thanh" : "Audio" },
                 { id: "scripts", label: uiLanguage === "vi" ? "Kịch bản" : "Scripts" },
                 { id: "sources", label: uiLanguage === "vi" ? "Nguồn" : "Sources" },
                 { id: "templates", label: uiLanguage === "vi" ? "Mẫu" : "Templates" },
                 { id: "archive", label: uiLanguage === "vi" ? "Lưu trữ" : "Archive" },
                 { id: "read_history", label: uiLanguage === "vi" ? "Lịch sử đọc" : "Read History" }
               ]}
               activeTab={librarySubTab}
               onTabChange={(id) => setLibrarySubTab(id as any)}
             />
           )}
           

          {activeTab === "ai_center" && (
             <SubTabBar 
               tabs={[
                 { id: "models", label: uiLanguage === "vi" ? "Mô hình" : "Models" },
                 { id: "prompt", label: uiLanguage === "vi" ? "Prompt" : "Prompt" },
                 { id: "personas", label: uiLanguage === "vi" ? "Nhân vật" : "Personas" },
                 { id: "voice", label: uiLanguage === "vi" ? "Giọng đọc" : "Voice" },
                 { id: "memory", label: uiLanguage === "vi" ? "Bộ nhớ" : "Memory" },
                 { id: "automation", label: uiLanguage === "vi" ? "Tự động hóa" : "Automation" },
                 { id: "enterprise", label: uiLanguage === "vi" ? "Doanh nghiệp" : "Enterprise" }
               ]}
               activeTab={aiCenterSubTab}
               onTabChange={(id) => setAiCenterSubTab(id as any)}
             />
           )}
           {activeTab === "settings" && (
             <SubTabBar 
               tabs={[
                 { id: "general", label: uiLanguage === "vi" ? "Chung" : "General" },
                 { id: "appearance", label: uiLanguage === "vi" ? "Giao diện" : "Appearance" },
                 { id: "storage", label: uiLanguage === "vi" ? "Lưu trữ" : "Storage" },
                 { id: "sync", label: uiLanguage === "vi" ? "Đồng bộ" : "Sync" },
                 { id: "security", label: uiLanguage === "vi" ? "Bảo mật" : "Security" },
                 { id: "pwa", label: uiLanguage === "vi" ? "Ứng dụng PWA" : "PWA" },
                 { id: "about", label: uiLanguage === "vi" ? "Giới thiệu" : "About" }
               ]}
               activeTab={settingsSubTab}
               onTabChange={(id) => setSettingsSubTab(id as any)}
             />
           )}

           <AnimatePresence>
             {showRssNotification && rssNotificationArticles.length > 0 && activeTab === "workspace" && (
               <RssNotificationBanner
                 articles={rssNotificationArticles}
                 uiLanguage={uiLanguage}
                 onClose={() => setShowRssNotification(false)}
                 onGenerate={() => {
                   setIsRssBasedGeneration(true);
                   const rawContent = formatArticlesForPrompt(rssNotificationArticles, uiLanguage);
                   setActiveTab("mission_studio");
                   setMissionStudioSubTab("draft");
                   handleGenerateBriefing(rawContent);
                   setShowRssNotification(false);
                   removeFromQueue("automated-rss-daily-briefing");
                 }}
               />
             )}
           </AnimatePresence>

         {activeTab === "workspace" && workspaceSubTab === "dashboard" && (
           <React.Fragment>

             <HomeTabView
               uiLanguage={uiLanguage}
               setActiveTab={setActiveTab}
               newsContent={newsContent}
               savedBriefings={savedBriefings}
               onPlayBriefing={playBriefing}
               activePayload={activePayload}
               step={step}
               activeTitle={activeTitle}
               onLaunchIntentProfile={(profile) => {
                 updatePreferences({
                   targetDuration: profile.targetDuration,
                   tone: profile.tone,
                   aiMode: profile.aiMode,
                   speed: profile.speed,
                   focus: profile.focus
                 });
                 setActiveTab("mission_studio");
                 setMissionStudioSubTab("draft");
                 handleGenerateBriefing(newsContent || undefined);
               }}
             />
           </React.Fragment>
         )}

         {(activeTab === "mission_studio" || (activeTab === "workspace" && workspaceSubTab === "continue")) && (
           <React.Fragment>

             <MissionTabView

             uiLanguage={uiLanguage}
             newsContent={newsContent}
             setNewsContent={setNewsContent}
             selectedNewsCategory={selectedNewsCategory}
             setSelectedNewsCategory={setSelectedNewsCategory}
             isGeneratingNews={isGeneratingNews}
             handleCreateNews={handleCreateNews}
             autosaveStatus={autosaveStatus}
             newsGenerationError={newsGenerationError}
             isListening={isListening}
             voiceInputLanguage={voiceInputLanguage}
             setVoiceInputLanguage={setVoiceInputLanguage}
             isProcessingVoiceQuery={isProcessingVoiceQuery}
             startVoiceSearch={startVoiceSearch}
             voiceQueryStatus={voiceQueryStatus}
             voiceError={voiceError}
             showVoiceAddPrompt={showVoiceAddPrompt}
             setShowVoiceAddPrompt={setShowVoiceAddPrompt}
             voiceQueryResult={voiceQueryResult}
             setVoiceQueryResult={setVoiceQueryResult}
             voiceQuerySources={voiceQuerySources}
             setVoiceQuerySources={setVoiceQuerySources}
             handleVoiceAddToBriefing={handleVoiceAddToBriefing}
             handleApplyPreset={handleApplyPreset}
             handleClearInput={handleClearInput}
             wordCount={wordCount}
             charLength={charLength}
             t={t}
             getApiUrl={getApiUrl}
             step={step as any}
             executionState={executionState}
             generationProgress={generationProgress}
             handleGenerateBriefing={handleGenerateBriefing}
             handleGenerateScript={handleGenerateScript}
             handleGenerateAudio={handleGenerateAudio}
             setActivePayload={setActivePayload}
             setActiveTitle={setActiveTitle}
             isRssBasedGeneration={isRssBasedGeneration}
             setIsRssBasedGeneration={setIsRssBasedGeneration}
             setActiveTab={setActiveTab}
             preferences={preferences}
             setPreferences={updatePreferences}
             errorMessage={errorMessage}
             btnReset={handleClearInput}
             activePayload={activePayload}
             activeAudioChunks={activeAudioChunks}
             activeTitle={activeTitle}
             selectedBriefId={selectedBriefId}
             savedBriefings={savedBriefings}
             onPlayBriefing={playBriefing}
             isPlayerPlaying={isPlayerPlaying}
             handlePlayerEnded={() => {}}
             handlePublishPodcast={handlePublishPodcast}
             isPublishingPodcast={isPublishingPodcast}
             pendingVoiceConfirm={pendingVoiceConfirm}
             confirmDefaultVoiceAndContinue={confirmDefaultVoiceAndContinue}
             cancelVoiceConfirm={cancelVoiceConfirm}
             synthesisWarning={synthesisWarning}
             activeSubTab={missionStudioSubTab}
             setMissionStudioSubTab={setMissionStudioSubTab}
           />
           </React.Fragment>
         )}

         {activeTab === "workspace" && workspaceSubTab === "suggestions" && (
            <React.Fragment>
              <SuggestionsTabView
                uiLanguage={uiLanguage}
                onSelectTopic={(topic) => {
                  setNewsContent(topic);
                  setActiveTab("mission_studio");
                  setMissionStudioSubTab("draft");
                  handleGenerateBriefing(topic);
                }}
                isGenerating={step === "summarizing" || step === "synthesizing"}
              />
            </React.Fragment>
          )}

          {(activeTab === "library" || (activeTab === "workspace" && workspaceSubTab === "recent")) && (
           <React.Fragment>

             <AssetsTabView
                activeSubTab={librarySubTab}
                onSubTabChange={setLibrarySubTab}
               uiLanguage={uiLanguage}
               savedBriefings={savedBriefings}
               podcastEpisodes={podcastEpisodes}
               loadPodcastEpisodes={loadPodcastEpisodes}
               isPublishingPodcast={isPublishingPodcast}
               podcastError={podcastError}
               handlePublishPodcast={(briefing) => handlePublishPodcast(briefing.id)}
               handleDeletePodcastEpisode={(id) => handleDeletePodcastEpisode(id, t)}
               isAutoPublish={isAutoPublish}
               setIsAutoPublish={setIsAutoPublish}
               selectedBriefId={selectedBriefId}
              onPlayBriefing={playBriefing}
              isPlayerPlaying={isPlayerPlaying}
               setSelectedBriefId={setSelectedBriefId}
               storageUsage={storageUsage}
               clearAllBriefings={clearAllBriefings}
               deleteOneBriefing={(id) => deleteOneBriefing(id).then(() => refreshBriefings(false))}
               archiveBriefing={archiveBriefing}
               updateBriefingTags={updateBriefingTags}
               getFullBriefing={getFullBriefing}
               refreshBriefings={refreshBriefings}
               handleApplyIntelligenceBriefing={handleApplyIntelligenceBriefing}
               preferences={preferences}
               updatePreferences={updatePreferences}
                setNewsContent={setNewsContent}
                isGenerating={step === "summarizing" || step === "synthesizing"}

               setActiveTab={setActiveTab}
               handleGenerateBriefing={handleGenerateBriefing}
               setIsRssBasedGeneration={setIsRssBasedGeneration}
               handleGenerateScript={handleGenerateScript}
               setMissionStudioSubTab={setMissionStudioSubTab}
             />
           </React.Fragment>
         )}

         {activeTab === "ai_center" && (
           <div className="space-y-8 animate-fade-in pb-20">
               {aiCenterSubTab === "voice" && (
                 <PreferencesForm
                    preferences={preferences}
                    updatePreferences={updatePreferences}
                    uiLanguage={uiLanguage}
                    t={t}
                    userPref={userPref}
                    updateSpeed={updateSpeed}
                    step={step}
                    setIsRssBasedGeneration={setIsRssBasedGeneration}
                    handleGenerateBriefing={() => {
                      setActiveTab("mission_studio");
                      setMissionStudioSubTab("draft");
                      handleGenerateBriefing();
                    }}
                  />
               )}
               {aiCenterSubTab === "memory" && (
                 <PersonalMemory uiLanguage={uiLanguage} />
               )}
               {aiCenterSubTab === "automation" && (
                 <div className="space-y-6">
                   <AutomationControl 
                     uiLanguage={uiLanguage}
                     isAutoPublish={isAutoPublish}
                     setIsAutoPublish={setIsAutoPublish}
                   />
                   <div className="p-8 rounded-2xl border border-dashed border-border-subtle bg-surface-subtle/30 text-center">
                     <p className="text-xs text-text-muted font-medium italic">
                       {uiLanguage === "vi" 
                         ? "Để quản lý chi tiết các nguồn tin tự động, vui lòng truy cập Thư viện > Nguồn." 
                         : "To manage detailed automated news sources, please visit Library > Sources."}
                     </p>
                   </div>
                 </div>
               )}
               {aiCenterSubTab === "models" && (
                 <ComingSoonPlaceholder 
                   uiLanguage={uiLanguage}
                   featureName={uiLanguage === "vi" ? "Mô hình AI" : "AI Models"}
                   description={uiLanguage === "vi" 
                     ? "Tùy chỉnh mô hình ngôn ngữ lớn (LLM) dùng để tóm tắt và phân tích tin tức. Hỗ trợ Gemini Pro, Flash và các mô hình chuyên biệt khác." 
                     : "Customize the Large Language Models (LLM) used for news summarization and analysis. Supports Gemini Pro, Flash, and specialized models."}
                 />
               )}
               {aiCenterSubTab === "prompt" && (
                 <ComingSoonPlaceholder 
                   uiLanguage={uiLanguage}
                   featureName={uiLanguage === "vi" ? "Prompt Engine" : "Prompt Engine"}
                   description={uiLanguage === "vi" 
                     ? "Tinh chỉnh các câu lệnh (system prompts) để thay đổi cách AI biên tập tin tức theo phong cách cá nhân của bạn." 
                     : "Fine-tune system prompts to change how the AI edits and transforms news according to your personal style."}
                 />
               )}
               {aiCenterSubTab === "personas" && (
                 <ComingSoonPlaceholder 
                   uiLanguage={uiLanguage}
                   featureName={uiLanguage === "vi" ? "Nhân vật AI" : "AI Personas"}
                   description={uiLanguage === "vi" 
                     ? "Tạo và quản lý các 'phóng viên ảo' với cá tính, quan điểm và cách dẫn dắt câu chuyện khác nhau cho bản tin của bạn." 
                     : "Create and manage 'virtual reporters' with unique personalities, viewpoints, and storytelling styles for your briefings."}
                 />
               )}
               {aiCenterSubTab === "enterprise" && (
                 <EnterpriseTeamHub
                   uiLanguage={uiLanguage}
                   onSendToStudio={(script, title) => {
                     setNewsContent(script);
                     setTargetNewsTitle(title);
                     setActiveTab("mission_studio");
                     setMissionStudioSubTab("draft");
                   }}
                   onPlayBroadcastAudio={(title) => {
                     setTargetNewsTitle(title);
                     handleGenerateAudio();
                   }}
                 />
               )}
            </div>
          )}

         {activeTab === "enterprise" && (
            <div className="space-y-8 animate-fade-in pb-20">
              <EnterpriseTeamHub
                uiLanguage={uiLanguage}
                onSendToStudio={(script, title) => {
                  setNewsContent(script);
                  setTargetNewsTitle(title);
                  setActiveTab("mission_studio");
                  setMissionStudioSubTab("draft");
                }}
                onPlayBroadcastAudio={(title) => {
                  setTargetNewsTitle(title);
                  handleGenerateAudio();
                }}
              />
            </div>
          )}

         {activeTab === "settings" && (
            <div className="space-y-8 animate-fade-in pb-20">
               <SettingsTabView
                 activeCategory={settingsSubTab}
                 onCategoryChange={setSettingsSubTab}
                 uiLanguage={uiLanguage}
                 setUiLanguage={handleSetUiLanguage}
                 preferences={preferences}
                 setPreferences={updatePreferences}
                 onClearAllCache={clearAllLocalDataComprehensive}
                 storageUsage={storageUsage}
                 syncStatus={syncStatus}
                 isOnline={syncOnline}
                 triggerSync={triggerSync}
                 abortSync={abortSync}
                 user={user}
                  onOpenLogin={() => setIsLoginOpen(true)}
               />
            </div>
         )}

                 </Suspense>
         </ErrorBoundary>
         </div>
          
         <footer className="shrink-0 bg-surface-card border-t border-border-primary py-6 text-text-dim w-full z-10 mt-8">
           <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between items-center gap-4 text-xs">
             <div className="flex items-center gap-2">
               <AudioLines className="w-4 h-4 text-brand-accent" />
               <span className="font-semibold text-text-muted">CommuteCast Radio News</span>
               <span>© 2026 | Created by Nguyen Viet Dieu</span>
             </div>
             <div className="flex items-center gap-4 text-[11px] text-text-muted">
               <span>Gemini Dual-Speech Architecture (TTS 24kHz)</span>
               <span>•</span>
               <span>Made with Gemini 3.1 & 3.5</span>
             </div>
           </div>
         </footer>
         </div>
       </main>

       {/* Floating / Side Player Panel for Production History & Global Playback */}
       <AnimatePresence>
         {activeAudioChunks.length > 0 && rightTab === "player" && (
           <motion.aside
             initial={{ x: "100%", opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             exit={{ x: "100%", opacity: 0 }}
             transition={{ type: "spring", damping: 30, stiffness: 300 }}
             className="w-full md:w-[400px] lg:w-[450px] border-l border-border-primary bg-surface-card overflow-y-auto custom-scrollbar z-30 shadow-2xl relative"
             id="global-player-sidebar"
           >
             <div className="sticky top-0 z-40 bg-surface-card/80 backdrop-blur-md border-b border-border-primary p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                      <AudioLines className="w-4 h-4" />
                   </div>
                   <span className="text-xs font-black uppercase tracking-widest text-text-main">
                      {uiLanguage === "vi" ? "Trình phát bản tin" : "Briefing Player"}
                   </span>
                </div>
                <button 
                  onClick={() => setActiveAudioChunks([])} 
                  className="p-2 hover:bg-surface-subtle rounded-xl text-text-muted hover:text-text-main transition-colors"
                  title={uiLanguage === "vi" ? "Đóng trình phát" : "Close Player"}
                >
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="p-4 sm:p-6">
                <ManualPcmPlayer
                  audioChunks={activeAudioChunks}
                  payload={activePayload!}
                  title={activeTitle || (uiLanguage === "vi" ? "Bản tin không tên" : "Untitled Briefing")}
                  uiLanguage={uiLanguage}
                  onEnded={handlePlayerEnded}
                  briefingId={selectedBriefId || ""}
                />
             </div>
           </motion.aside>
         )}
       </AnimatePresence>
     </div>
           

      <AssistantChat 
        activeTab={activeTab}
        step={step}
        isOpen={isAssistantOpen}
        setIsOpen={setIsAssistantOpen}
        getApiUrl={getApiUrl}
        handleCreateNews={handleCreateNews}
        newsContent={newsContent}
        setNewsContent={setNewsContent}
        onAction={(type, payload) => {
          if (type === "navigate" && typeof payload === "string") {
            setActiveTab(payload as TabType);
          } else if (type === "toggle_play") {
            window.dispatchEvent(new CustomEvent("commutecast-toggle-play"));
          } else if (type === "toggle_theme") {
            setTheme(resolvedTheme === "dark" ? "light" : "dark");
          } else if (type === "toggle_driving") {
            if (typeof updateDrivingMode === "function") {
              updateDrivingMode(!userPref.isDrivingMode);
            }
          } else if (type === "clear_cache") {
            localStorage.clear();
            alert(uiLanguage === "vi" ? "🧹 Đã xóa sạch bộ nhớ đệm và lịch sử hội thoại thành công!" : "🧹 Cleared cache and history successfully!");
          }
        }}
        preferences={preferences}
      />
    </div>

    <LoginModal 
      isOpen={isLoginOpen} 
      onClose={() => setIsLoginOpen(false)} 
      uiLanguage={uiLanguage} 
    />

    {/* Global Ctrl+K Search Command Palette Modal */}
    <AnimatePresence>
      {showSearchModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99999] flex items-start justify-center pt-[10vh] px-4"
          onClick={() => setShowSearchModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-card-bg border border-border-primary rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="p-4 border-b border-border-primary/60 flex items-center gap-3 bg-surface-bg/50">
              <Search className="w-5 h-5 text-brand-accent shrink-0 animate-pulse" />
              <input
                type="text"
                autoFocus
                placeholder={uiLanguage === "vi" ? "Tìm kiếm bản tin, giọng đọc, cài đặt... (Ctrl + K)" : "Search briefings, voices, settings... (Ctrl + K)"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:ring-0 outline-none"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-text-muted hover:text-text-main text-[10px] font-mono bg-surface-bg border border-border-primary px-2 py-0.5 rounded-lg"
              >
                ESC
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="px-4 py-2 border-b border-border-primary/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-surface-bg/30">
              {[
                { id: "all", labelVi: "Tất cả", labelEn: "All", icon: Sparkles },
                { id: "briefings", labelVi: "Bản tin", labelEn: "Briefings", icon: FileText },
                { id: "settings", labelVi: "Cài đặt", labelEn: "Settings", icon: Settings2 },
                { id: "tools", labelVi: "Công cụ", labelEn: "Tools", icon: Wrench },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedSearchCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedSearchCategory(cat.id as any)}
                    className={cn(
                      "px-3 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer border",
                      isSelected
                        ? "bg-brand-accent text-white border-brand-accent shadow-xs"
                        : "bg-surface-bg/80 text-text-muted hover:text-text-main hover:bg-surface-bg border-border-primary/60"
                    )}
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    <span>{uiLanguage === "vi" ? cat.labelVi : cat.labelEn}</span>
                  </button>
                );
              })}
            </div>

            {/* Results Slate */}
            <div className="max-h-[360px] overflow-y-auto p-2 custom-scrollbar">
              {searchQuery.trim() === "" && selectedSearchCategory === "all" ? (
                <div className="py-8 px-4 text-center space-y-2">
                  <span className="text-[10px] text-brand-accent font-black tracking-widest uppercase block font-mono">
                    {uiLanguage === "vi" ? "Đề xuất tìm nhanh" : "Quick Search Suggestions"}
                  </span>
                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    {["Create", "Voice", "Driving Mode", "Sync"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="text-[11px] bg-surface-bg border border-border-primary text-text-main hover:border-brand-accent/40 hover:text-brand-accent px-3 py-1.5 rounded-xl transition-colors cursor-pointer font-medium"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-12 text-center text-text-muted space-y-1.5">
                  <p className="text-xs font-bold">
                    {uiLanguage === "vi" ? "Không tìm thấy kết quả" : "No results matching query"}
                  </p>
                  <p className="text-[10px] opacity-75">
                    {uiLanguage === "vi" ? "Thử nhập từ khóa khác hoặc chọn danh mục khác." : "Try searching for alternative key phrase or changing category."}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((res: any, idx: number) => (
                    <button
                      key={res.id || idx}
                      onClick={res.action}
                      className="w-full text-left p-3 hover:bg-surface-bg rounded-2xl transition-all duration-150 flex items-start justify-between gap-4 group cursor-pointer border border-transparent hover:border-border-primary/40"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[8px] bg-brand-accent/10 text-brand-accent border border-brand-accent/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider font-mono inline-block mb-1">
                          {uiLanguage === "vi" ? (res.categoryLabelVi || res.category) : (res.categoryLabelEn || res.category)}
                        </span>
                        <h4 className="text-xs font-black text-text-main group-hover:text-brand-accent transition-colors truncate">
                          <HighlightText
                            text={uiLanguage === "vi" ? res.titleVi : res.titleEn}
                            query={searchQuery}
                          />
                        </h4>
                        <p className="text-[10px] text-text-muted truncate">
                          <HighlightText
                            text={uiLanguage === "vi" ? res.descVi : res.descEn}
                            query={searchQuery}
                          />
                        </p>
                      </div>
                      <div className="shrink-0 self-center text-text-muted group-hover:text-brand-accent transition-colors text-xs font-mono">
                        ⏎
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Command Helper Footer */}
            <div className="p-3 bg-surface-bg/40 border-t border-border-primary/60 text-[9px] text-text-muted font-mono flex justify-between items-center">
              <span>{uiLanguage === "vi" ? "Dùng chuột hoặc phím để chọn" : "Use mouse navigation"}</span>
              <span>Ctrl + K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Auto-Dismissing 'Sync Successful' Toast Notification (Dismisses after 3 seconds) */}
    <AnimatePresence>
      {showSyncSuccessToast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed bottom-6 right-6 z-[9999] bg-neutral-900 text-white px-4 py-3 rounded-2xl border border-emerald-500/40 shadow-2xl flex items-center justify-between gap-4 max-w-sm w-auto cursor-pointer backdrop-blur-md"
          onClick={dismissSyncSuccessToast}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center border border-emerald-500/30 text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black tracking-wider text-emerald-400 uppercase font-mono leading-none">
                {uiLanguage === "vi" ? "Đồng bộ Đám mây" : "Cloud Sync"}
              </p>
              <p className="text-xs font-bold text-neutral-100 mt-1">
                {uiLanguage === "vi" ? "Đồng bộ thành công" : "Sync Successful"}
              </p>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); dismissSyncSuccessToast(); }}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Sleek Safe-Driving Toast Notification */}
    <AnimatePresence>
      {drivingToast.show && drivingToast.message && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-[9999] bg-gradient-to-r from-neutral-900 via-black to-neutral-900 text-white px-5 py-3.5 rounded-2xl border border-[var(--color-warning)]/30 shadow-2xl flex items-center justify-between gap-4 max-w-sm w-auto cursor-pointer"
          onClick={clearDrivingToast}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-warning)]/10 flex items-center justify-center border border-[var(--color-warning)]/20 text-[var(--color-warning)]">
              <ShieldAlert className="w-4 h-4 animate-pulse text-[var(--color-warning)]" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black tracking-wider text-[var(--color-warning)] uppercase font-mono">
                {uiLanguage === "vi" ? "Thông báo an toàn" : "Safety Alert"}
              </p>
              <p className="text-[13px] font-extrabold text-neutral-100">
                {drivingToast.message}
              </p>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); clearDrivingToast(); }}
            className="text-text-dim hover:text-text-muted p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Emergency Traffic Break-In Alert Overlay (Only displayed during Driving HUD Mode) */}
    <AnimatePresence>
      {userPref.isDrivingMode && trafficAlert && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-6 left-4 right-4 sm:left-auto sm:right-6 z-[10000] bg-red-950 text-white p-5 rounded-2xl border-2 border-red-500 shadow-2xl flex flex-col gap-3 max-w-md w-full backdrop-blur-md"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/30 flex items-center justify-center border border-red-500/50 text-red-400 shrink-0 animate-pulse">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="text-left flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-widest text-red-400 uppercase font-mono">
                  {trafficAlert.title}
                </span>
                <span className="text-[10px] font-bold text-red-300 font-mono">
                  {trafficAlert.timestamp}
                </span>
              </div>
              <p className="text-xs font-bold text-white mt-1 leading-relaxed">
                {trafficAlert.description}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] font-mono font-bold text-red-200">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>{trafficAlert.location}</span>
                {trafficAlert.delayMinutes && (
                  <span className="px-2 py-0.5 rounded bg-red-600/40 text-red-200 text-[10px]">
                    +{trafficAlert.delayMinutes}m delay
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={dismissTrafficAlert}
              className="text-red-300 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-red-900/60 gap-2 flex-wrap sm:flex-nowrap">
            <span className="text-[10px] font-mono text-red-300 animate-pulse flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span>
                {userPref.autoAudioAlertsEnabled
                  ? (uiLanguage === "vi" ? "Đang tự động phát âm thanh..." : "Auto audio broadcasting...")
                  : (uiLanguage === "vi" ? "Âm thanh tự động: TẮT" : "Auto audio: OFF")}
              </span>
            </span>
            <div className="flex items-center gap-2">
              {!userPref.autoAudioAlertsEnabled && (
                <button
                  onClick={() => {
                    if (typeof updatePreferences === "function") {
                      updatePreferences({ autoAudioAlertsEnabled: true });
                    }
                    playAlertAudio();
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-1.5 active:scale-95"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{uiLanguage === "vi" ? "Bật Tự Động & Nghe" : "Enable & Play"}</span>
                </button>
              )}
              <button
                onClick={dismissTrafficAlert}
                className="px-3 py-1.5 rounded-xl text-xs font-black bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg active:scale-95"
              >
                {uiLanguage === "vi" ? "Đã Hiểu / Tắt" : "Dismiss"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Scheduled 7:30 AM Morning Briefing Toast Overlay */}
    <AnimatePresence>
      {scheduledToast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 z-[9999] bg-neutral-900 text-white p-5 rounded-2xl border border-brand-accent/50 shadow-2xl flex flex-col gap-3 max-w-sm w-full"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/20 flex items-center justify-center border border-brand-accent/30 text-brand-accent shrink-0">
              <BellRing className="w-5 h-5 text-brand-accent animate-bounce" />
            </div>
            <div className="text-left flex-1">
              <p className="text-[10px] font-black tracking-wider text-brand-accent uppercase font-mono">
                {scheduledToast.title}
              </p>
              <p className="text-xs font-medium text-neutral-200 mt-1 leading-relaxed">
                {scheduledToast.body}
              </p>
            </div>
            <button
              onClick={dismissScheduledToast}
              className="text-text-muted hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-800">
            <button
              onClick={dismissScheduledToast}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-400 hover:text-white transition-colors"
            >
              {uiLanguage === "vi" ? "Để sau" : "Later"}
            </button>
            <button
              onClick={() => {
                dismissScheduledToast();
                handleGenerateBriefing();
              }}
              className="px-4 py-1.5 rounded-xl text-xs font-black bg-brand-accent text-neutral-950 hover:bg-brand-accent/90 transition-all flex items-center gap-1.5 shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{uiLanguage === "vi" ? "Phát Bản Tin 7:30 Ngay" : "Start Briefing Now"}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    <AnimatePresence>
      {suggestDrivingMode && !userPref.isDrivingMode && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed bottom-24 right-4 sm:right-6 z-[9999] bg-gradient-to-br from-neutral-900 to-black text-white px-5 py-4 rounded-2xl border border-[var(--color-accent)]/40 shadow-2xl flex flex-col gap-3 max-w-sm w-full sm:w-auto"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center border border-[var(--color-accent)]/20 text-[var(--color-accent)] shrink-0">
              <Car className="w-5 h-5 text-[var(--color-accent)] animate-bounce" />
            </div>
            <div className="text-left flex-1">
              <h4 className="text-[10px] font-black tracking-wider text-[var(--color-accent)] uppercase font-mono">
                {uiLanguage === "vi" ? "Phát hiện di chuyển" : "Motion Detected"}
              </h4>
              <p className="text-xs font-semibold text-neutral-300 mt-0.5">
                {uiLanguage === "vi" ? `Tốc độ ước tính: ~${Math.round(speed)} km/h` : `Estimated speed: ~${Math.round(speed)} km/h`}
              </p>
              <p className="text-[13px] font-extrabold text-neutral-100 mt-1">
                {uiLanguage === "vi" 
                  ? "Bạn có đang di chuyển? Bật Chế độ lái xe?" 
                  : "Are you moving? Turn on Driving Mode?"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 mt-1 border-t border-neutral-800 pt-3">
            <button
              onClick={dismissSuggestion}
              id="dismiss-suggestion-btn"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              {uiLanguage === "vi" ? "Bỏ qua" : "Dismiss"}
            </button>
            <button
              onClick={() => {
                if (typeof updateDrivingMode === "function") {
                  updateDrivingMode(true);
                }
                dismissSuggestion();
              }}
              id="accept-suggestion-btn"
              className="px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-[var(--color-accent)] text-black hover:opacity-90 transition-opacity"
            >
              {uiLanguage === "vi" ? "Đồng ý" : "Agree"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
          </>
        }
      />
    </Routes>
    <SyncConflictToast uiLanguage={uiLanguage} />
  </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
