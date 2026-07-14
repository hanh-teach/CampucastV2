import { useState, useRef } from "react";
import { SummaryPayload, SavedSummary, ExecutionState, ResearchPackage, EditorialDraft, SpeechPackage, AudioArtifact, PipelineContext } from "../types";
import { telemetry } from "../services/telemetryService";
import { saveEpisodeToOffline, getEpisodeFromOffline } from "../services/offlineStorageService";
import { recordInteraction } from "../services/interactionService";
import { prepareSynthesisTimeline, applyPronunciationDictionary, getCohostVoice } from "../utils/synthesis";
import { normalizeText } from "../utils/text";
import { generateEditorialDraft, buildSpeechPackage, renderAudio } from "../services/productionPipeline";

interface UseBriefingGenerationProps {
  getApiUrl: (path: string) => string;
  uiLanguage: "vi" | "en";
  t: any;
  preferences: any;
  updatePreferences: any;
  saveNewBriefing: (briefing: SavedSummary) => Promise<void>;
  getFullBriefing: (id: string) => Promise<SavedSummary | null>;
  removeFromQueue: (id: string) => void;
  isAutoPublish: boolean;
  handlePublishPodcast: (id: string, silent: boolean) => Promise<void>;
  rssNotificationArticles: any[];
  setActiveTab: (tab: any) => void;
  onBriefingCreated?: (id: string) => void;
}

export function useBriefingGeneration({
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
  onBriefingCreated
}: UseBriefingGenerationProps) {
  // News Input State
  const [newsContent, setNewsContent] = useState<string>(() => {
    return localStorage.getItem("commutecast_draft_news") || "";
  });

  // AI News Generator States
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>("Technology");
  const [isGeneratingNews, setIsGeneratingNews] = useState<boolean>(false);
  const [newsGenerationError, setNewsGenerationError] = useState<string>("");

  // Flow & Progress States
  const [step, setStep] = useState<"idle" | "summarizing" | "synthesizing" | "ready" | "error">("idle");
  const [executionState, setExecutionState] = useState<ExecutionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>(" ");
  const [generationProgress, setGenerationProgress] = useState<string>("");
  const [isRssBasedGeneration, setIsRssBasedGeneration] = useState<boolean>(false);
  const [targetNewsTitle, setTargetNewsTitle] = useState<string>("");
  const [currentCorrelationId, setCurrentCorrelationId] = useState<string>("");

  // Active Briefing Payload State
  const [activePayload, setActivePayload] = useState<SummaryPayload | null>(null);
  const [activeAudioChunks, setActiveAudioChunks] = useState<string[]>([]);
  const [activeTitle, setActiveTitle] = useState<string>("");
  const [synthesisWarning, setSynthesisWarning] = useState<string | null>(null);

  // Modern Pipeline State Context
  const [pipelineContext, setPipelineContext] = useState<PipelineContext>(() => ({
    pipelineId: "",
    missionId: "default_mission",
    currentStage: 1,
    stages: {
      stage1: { status: "idle", data: null, error: null, startedAt: null, completedAt: null },
      stage2: { status: "idle", data: null, error: null, startedAt: null, completedAt: null },
      stage3: { status: "idle", data: null, error: null, startedAt: null, completedAt: null },
      stage4: { status: "idle", data: null, error: null, startedAt: null, completedAt: null },
    },
    synthesisWarning: null,
  }));

  // Voice-confirm modal state (replaces blocking window.confirm)
  const [pendingVoiceConfirm, setPendingVoiceConfirm] = useState<boolean>(false);
  const [pendingContentOverride, setPendingContentOverride] = useState<string | undefined>(undefined);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStep("error");
      setErrorMessage(
        uiLanguage === "vi"
          ? "Đã hủy quá trình tạo bản tin theo yêu cầu."
          : "Generation process was cancelled by the user."
      );
    }
  };

  const trackExecutionState = (state: ExecutionState) => {
    setExecutionState(state);
    telemetry.track("execution_state_transition", { state });
  };

  const handleCreateNews = async (categoryOverride?: string) => {
    const routineId = crypto.randomUUID();
    telemetry.startExecution(routineId);
    try {
      setIsGeneratingNews(true);
      setNewsGenerationError("");

      const categoryToUse = typeof categoryOverride === "string" ? categoryOverride : selectedNewsCategory;

      if (categoryToUse) {
        recordInteraction(categoryToUse, "click").catch((err) =>
          console.error("Failed to record click interaction:", err)
        );
      }

      if (typeof categoryOverride === "string" && categoryOverride) {
        setSelectedNewsCategory(categoryOverride);
      }

      const res = await fetch(getApiUrl("/api/generate-news"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: categoryToUse,
          language: preferences.language,
          aiMode: preferences.aiMode,
        }),
      });

      if (!res.ok) {
        let errorMsg = "Failed to connect to news generation server.";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            errorMsg = errorData.error || errorMsg;
          } else {
            const errorText = await res.text();
            if (errorText.includes("QUOTA_LIMIT") || res.status === 429) {
              errorMsg =
                uiLanguage === "vi"
                  ? "QUOTA_LIMIT: Bạn đã hết tài nguyên cuộc gọi miễn phí trong ngày hôm nay. Vui lòng thử lại sau ít phút!"
                  : "QUOTA_LIMIT: Free-tier quota limit reached. Please retry after some time.";
            } else {
              errorMsg = `Server error (${res.status}): ${errorText.substring(0, 200)}`;
            }
          }
        } catch {
          errorMsg =
            uiLanguage === "vi"
              ? `Máy chủ gặp lỗi (${res.status}). Vui lòng kiểm tra lại kết nối hoặc cài đặt khóa API của bạn.`
              : `Server encountered an error (${res.status}). Please check your API configuration.`;
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      if (data.newsText) {
        setNewsContent((prev) => {
          const separator = prev ? "\n\n---\n\n" : "";
          return prev + separator + data.newsText;
        });
      } else {
        throw new Error(uiLanguage === "vi" ? "Máy chủ tạo tin phản hồi dữ liệu trống." : "Response data is empty.");
      }
    } catch (err: any) {
      console.error("AI News generation error:", err);
      setNewsGenerationError(err.message || "Failed to generate AI news.");
    } finally {
      setIsGeneratingNews(false);
    }
  };

  const executeStage1 = (rawText: string, missionId: string = "default_mission"): ResearchPackage => {
    const started = new Date().toISOString();
    setPipelineContext(prev => ({
      ...prev,
      stages: {
        ...prev.stages,
        stage1: { status: "loading", data: null, error: null, startedAt: started, completedAt: null }
      }
    }));

    if (!rawText.trim()) {
      const errorMsg = uiLanguage === "vi"
        ? "Vui lòng dán hoặc chọn một chủ đề tin tức mẫu để bắt đầu."
        : "Please paste or load at least one news article to begin.";
      setPipelineContext(prev => ({
        ...prev,
        stages: {
          ...prev.stages,
          stage1: { status: "error", data: null, error: errorMsg, startedAt: started, completedAt: new Date().toISOString() }
        }
      }));
      throw new Error(errorMsg);
    }

    const researchPackage: ResearchPackage = {
      id: `res_${Math.random().toString(36).substring(7)}`,
      missionId,
      articles: [{ id: "art_1", title: "Input Content", content: rawText }],
      aggregatedText: rawText,
      language: uiLanguage,
      createdAt: new Date().toISOString()
    };

    setPipelineContext(prev => ({
      ...prev,
      currentStage: 2,
      stages: {
        ...prev.stages,
        stage1: {
          status: "success",
          data: researchPackage,
          error: null,
          startedAt: started,
          completedAt: new Date().toISOString()
        }
      }
    }));

    return researchPackage;
  };

  const executeStage2 = async (researchPkg: ResearchPackage, prefs: any): Promise<EditorialDraft> => {
    const started = new Date().toISOString();
    setPipelineContext(prev => ({
      ...prev,
      stages: {
        ...prev.stages,
        stage2: { status: "loading", data: null, error: null, startedAt: started, completedAt: null }
      }
    }));

    try {
      const draft = await generateEditorialDraft(researchPkg, prefs, getApiUrl);
      
      setPipelineContext(prev => ({
        ...prev,
        currentStage: 3,
        stages: {
          ...prev.stages,
          stage2: {
            status: "success",
            data: draft,
            error: null,
            startedAt: started,
            completedAt: new Date().toISOString()
          }
        }
      }));

      // Backward compatible state sync
      const parsedPayload = JSON.parse(draft.body);
      setActivePayload(parsedPayload);
      setActiveTitle(draft.title);

      return draft;
    } catch (err: any) {
      setPipelineContext(prev => ({
        ...prev,
        stages: {
          ...prev.stages,
          stage2: {
            status: "error",
            data: null,
            error: err.message,
            startedAt: started,
            completedAt: new Date().toISOString()
          }
        }
      }));
      throw err;
    }
  };

  const executeStage3 = (draft: EditorialDraft, prefs: any): SpeechPackage => {
    const started = new Date().toISOString();
    setPipelineContext(prev => ({
      ...prev,
      stages: {
        ...prev.stages,
        stage3: { status: "loading", data: null, error: null, startedAt: started, completedAt: null }
      }
    }));

    try {
      const speechPkg = buildSpeechPackage(
        draft,
        prefs.audioPronunciationDict || [],
        prefs.audioEmotion
      );

      setPipelineContext(prev => ({
        ...prev,
        currentStage: 4,
        stages: {
          ...prev.stages,
          stage3: {
            status: "success",
            data: speechPkg,
            error: null,
            startedAt: started,
            completedAt: new Date().toISOString()
          }
        }
      }));

      return speechPkg;
    } catch (err: any) {
      setPipelineContext(prev => ({
        ...prev,
        stages: {
          ...prev.stages,
          stage3: {
            status: "error",
            data: null,
            error: err.message,
            startedAt: started,
            completedAt: new Date().toISOString()
          }
        }
      }));
      throw err;
    }
  };

  const executeStage4 = async (
    speechPkg: SpeechPackage,
    prefs: any,
    existingArtifact?: AudioArtifact
  ): Promise<AudioArtifact> => {
    const started = new Date().toISOString();
    setPipelineContext(prev => ({
      ...prev,
      stages: {
        ...prev.stages,
        stage4: { status: "loading", data: null, error: null, startedAt: started, completedAt: null }
      }
    }));

    // Setup fresh AbortController for cancel capability
    abortControllerRef.current = new AbortController();

    try {
      const artifact = await renderAudio(speechPkg, {
        getApiUrl,
        tone: prefs.tone,
        languageMode: prefs.languageMode,
        signal: abortControllerRef.current.signal,
        useCache: true,
        existingArtifact,
        onProgress: (p) => {
          const currentProgressLabel =
            uiLanguage === "vi"
              ? `Đang tạo âm thanh: [${p.current}/${p.total}] - Xong: ${p.label}`
              : `Synthesizing audio: [${p.current}/${p.total}] - Finished: ${p.label}`;
          setGenerationProgress(currentProgressLabel);
        }
      });

      // Clear controller reference upon successful completion
      abortControllerRef.current = null;

      if (artifact.audioChunks.length === 0) {
        throw new Error(
          uiLanguage === "vi"
            ? "Không thể tổng hợp bất kỳ phân đoạn âm thanh nào."
            : "Failed to synthesize any audio segments."
        );
      }

      let warningMsg: string | null = null;
      if (artifact.isPartial) {
        const failedLabels = artifact.failedSegments.map((s) => s.label).join(", ");
        warningMsg = uiLanguage === "vi"
          ? `Bỏ qua ${artifact.failedSegments.length} phân đoạn do lỗi tổng hợp: ${failedLabels}. Bản tin vẫn được lưu với các phần còn lại.`
          : `Skipped ${artifact.failedSegments.length} segment(s) due to synthesis failure: ${failedLabels}. The briefing was saved with the remaining audio.`;
        setSynthesisWarning(warningMsg);
      } else {
        setSynthesisWarning(null);
      }

      setPipelineContext(prev => ({
        ...prev,
        synthesisWarning: warningMsg,
        stages: {
          ...prev.stages,
          stage4: {
            status: "success",
            data: artifact,
            error: null,
            startedAt: started,
            completedAt: new Date().toISOString()
          }
        }
      }));

      // Backward compatible state sync
      setActiveAudioChunks(artifact.audioChunks);

      return artifact;
    } catch (err: any) {
      abortControllerRef.current = null;
      setPipelineContext(prev => ({
        ...prev,
        stages: {
          ...prev.stages,
          stage4: {
            status: "error",
            data: null,
            error: err.message,
            startedAt: started,
            completedAt: new Date().toISOString()
          }
        }
      }));
      throw err;
    }
  };

  const handleGenerateScript = async (contentOverride?: string, voiceOverride?: string): Promise<EditorialDraft | undefined> => {
    setSynthesisWarning(null);
    const actualContent = typeof contentOverride === "string" ? contentOverride : newsContent;

    if (!actualContent.trim()) {
      setErrorMessage(
        uiLanguage === "vi"
          ? "Vui lòng dán hoặc chọn một chủ đề tin tức mẫu để bắt đầu."
          : "Please paste or load at least one news article to begin."
      );
      setStep("error");
      return;
    }

    const effectiveVoice = voiceOverride || preferences.voice;

    if (!effectiveVoice) {
      setPendingContentOverride(contentOverride);
      setPendingVoiceConfirm(true);
      return;
    }

    if (voiceOverride && voiceOverride !== preferences.voice) {
      updatePreferences({ voice: voiceOverride });
    }

    let detectedTitle = "";
    const firstLine = actualContent.split("\n").map((l) => l.trim()).find((l) => l.length > 0) || "";
    if (firstLine.includes("Bài báo #1:") || firstLine.includes("Article #1:")) {
      detectedTitle = firstLine.replace(/Bài báo #1:\s*/i, "").replace(/Article #1:\s*/i, "").trim();
    } else if (firstLine.includes("Dưới đây là danh sách") || firstLine.includes("Here is the aggregated")) {
      const lines = actualContent.split("\n").map((l) => l.trim());
      const articleLine = lines.find((l) => l.includes("Bài báo #1:") || l.includes("Article #1:"));
      if (articleLine) {
        detectedTitle = articleLine.replace(/Bài báo #1:\s*/i, "").replace(/Article #1:\s*/i, "").trim();
      } else {
        detectedTitle = uiLanguage === "vi" ? "Bản tin tổng hợp RSS" : "Aggregated RSS News";
      }
    } else {
      detectedTitle = firstLine;
    }

    detectedTitle = detectedTitle.replace(/^["'“«]+|["'”»]+$/g, "").trim();

    if (detectedTitle.length > 90) {
      detectedTitle = detectedTitle.substring(0, 87) + "...";
    }
    setTargetNewsTitle(detectedTitle || (uiLanguage === "vi" ? "Bản tin cá nhân" : "Personalized Broadcast"));

    try {
      setErrorMessage("");
      setStep("summarizing");
      const routineId = Math.random().toString(36).substring(7);
      setCurrentCorrelationId(routineId);
      telemetry.startExecution(routineId);
      telemetry.track("execution_start", { title: detectedTitle });
      trackExecutionState("initializing");
      setGenerationProgress(t.progressStep1);

      // --- Stage 1: News Aggregation ---
      trackExecutionState("normalizing_content");
      const researchPkg = executeStage1(actualContent);

      // --- Stage 2: Editorial Draft Engine ---
      trackExecutionState("ranking_stories");
      const currentPrefs = { ...preferences, voice: effectiveVoice };
      const draft = await executeStage2(researchPkg, currentPrefs);

      setStep("idle");
      trackExecutionState("idle");
      telemetry.track("execution_finished", { stage: "script", status: "success" });

      // Reset audio for the fresh draft so user is guided to generate audio
      setActiveAudioChunks([]);

      return draft;
    } catch (err: any) {
      console.error("Script Generation Error:", err);
      setErrorMessage(err.message || "An unexpected error occurred during script generation.");
      setStep("error");
    }
  };

  const handleGenerateAudio = async (): Promise<SavedSummary | undefined> => {
    if (!activePayload) {
      setErrorMessage(
        uiLanguage === "vi"
          ? "Vui lòng tạo kịch bản bản tin trước."
          : "Please generate a briefing script first."
      );
      setStep("error");
      return;
    }

    try {
      setErrorMessage("");
      setStep("synthesizing");
      trackExecutionState("synthesizing_audio");
      setGenerationProgress(t.progressStep2);

      const currentPrefs = { ...preferences };

      // Reconstruct EditorialDraft object with the updated activePayload edits
      const draft: EditorialDraft = {
        id: `draft_${Math.random().toString(36).substring(7)}`,
        missionId: "default_mission",
        language: uiLanguage,
        title: activeTitle || activePayload.title || "Untitled Briefing",
        summary: activePayload.chapters?.map((c: any) => c.topic).join(", ") || "",
        body: JSON.stringify(activePayload),
        tags: [preferences.tone || "informative", preferences.commuteType || "driving"],
        hostProfile: {
          primaryVoice: preferences.voice || "vi-HN",
          cohostVoice: getCohostVoice(preferences.voice || "vi-HN"),
        },
        narrationStyle: preferences.tone || "conversational",
        createdAt: new Date().toISOString(),
        version: 1,
      };

      // --- Stage 3: Speech Preparation ---
      const speechPkg = executeStage3(draft, currentPrefs);

      // --- Stage 4: Audio Generation ---
      const assembly = await executeStage4(speechPkg, currentPrefs);

      // Save Output Package
      const newBriefing: SavedSummary = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2) + Date.now().toString(36),
        timestamp: new Date().toLocaleString(),
        preferences: currentPrefs,
        payload: activePayload,
        audioChunks: assembly.audioChunks,
        artworkUrl: `https://images.unsplash.com/photo-1478737270239-2fccd2c7fd14?auto=format&fit=crop&q=80&w=800&q=80`
      };

      await saveNewBriefing(newBriefing);
      if (onBriefingCreated) {
        onBriefingCreated(newBriefing.id);
      }
      try {
        await saveEpisodeToOffline(newBriefing.id, currentPrefs, activePayload, assembly.audioChunks);
      } catch (offlineErr) {
        console.warn("Failed to save copy to offline audios store:", offlineErr);
      }

      if (isAutoPublish) {
        console.log("[Auto-Publish] Automatically uploading newly generated briefing:", newBriefing.id);
        handlePublishPodcast(newBriefing.id, true);
      }

      // Trigger system notification
      const { sendNotification } = await import("../utils/notification");
      sendNotification(t.notificationSuccessTitle, {
        body: `${t.notificationSuccessBody} (${draft.title})`,
        icon: "/icon-192.jpg",
        badge: "/icon-192.jpg",
        tag: "commutecast-complete",
      });

      setStep("ready");
      trackExecutionState("ready_to_play");
      telemetry.track("execution_finished", { status: "success" });
      return newBriefing;
    } catch (err: any) {
      console.error("Audio Generation Error:", err);
      setErrorMessage(err.message || "An unexpected error occurred during audio generation.");
      setStep("error");
    }
  };

  const handleGenerateBriefing = async (contentOverride?: string, voiceOverride?: string) => {
    const draft = await handleGenerateScript(contentOverride, voiceOverride);
    if (draft) {
      return await handleGenerateAudio();
    }
  };

  const confirmDefaultVoiceAndContinue = () => {
    setPendingVoiceConfirm(false);
    const contentToUse = pendingContentOverride;
    setPendingContentOverride(undefined);
    // Pass "Fenrir" explicitly as voiceOverride so generation can proceed
    // immediately without waiting for the preferences state update to flush.
    handleGenerateBriefing(contentToUse, "Fenrir");
  };

  const cancelVoiceConfirm = () => {
    setPendingVoiceConfirm(false);
    setPendingContentOverride(undefined);
    setActiveTab("settings");
  };

  const handleApplyIntelligenceBriefing = async (item: SavedSummary | any) => {
    try {
      if (item.id === "automated-rss-daily-briefing") {
        setIsRssBasedGeneration(true);
        const articlesToUse = item.payload || rssNotificationArticles;
        const { formatArticlesForPrompt } = await import("../services/rssService");
        const rawContent = formatArticlesForPrompt(articlesToUse, uiLanguage);
        handleGenerateBriefing(rawContent);
        removeFromQueue("automated-rss-daily-briefing");
        return;
      }

      let fullItem = await getEpisodeFromOffline(item.id);
      if (!fullItem) {
        fullItem = await getFullBriefing(item.id);
      }
      if (fullItem) {
        setActivePayload(fullItem.payload);
        setActiveAudioChunks(fullItem.audioChunks || []);
        setActiveTitle(fullItem.payload.title);
        updatePreferences(fullItem.preferences);
        setStep("ready");
        trackExecutionState("ready_to_play");

        fullItem.payload?.chapters?.forEach((ch: any) => {
          if (ch.topic) {
            recordInteraction(ch.topic, "view", ch.id || fullItem.id).catch((err) =>
              console.error("Failed to record view interaction on load:", err)
            );
          }
        });
        return fullItem;
      } else if (item.audioUrl) {
        window.open(item.audioUrl, "_blank");
      } else {
        alert(uiLanguage === "vi" ? "Không tìm thấy dữ liệu phát thanh để phát." : "Could not find broadcast audio data to play.");
      }
    } catch (err) {
      console.error("Failed to load briefing details:", err);
    }
  };

  return {
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
    handleApplyIntelligenceBriefing,
    pipelineContext,
    setPipelineContext,
    executeStage1,
    executeStage2,
    executeStage3,
    executeStage4,
  };
}
