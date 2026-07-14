import React, { useState, useRef, useEffect } from "react";
import { CoHostBubble } from "../CoHostBubble";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Trash2, 
  Sparkles, 
  AudioLines, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink, 
  Cpu, 
  Settings2,
  Rss,
  ChevronDown,
  ChevronUp,
  Volume2,
  ArrowRight,
  Mic,
  Waves,
  RefreshCcw,
  Clock,
  Music,
  Share2,
  Download,
  Save,
  Wand2,
  ListRestart,
  X,
  Play,
  Pause,
  Square,
  Loader2
} from "lucide-react";
import TopicSuggestions from "../TopicSuggestions";
import RSSManager from "../RSSManager";
import { SAMPLE_ARTICLES_PRESETS, base64ToArrayBuffer, encodeWavHeader } from "../../utils";
import { exportBriefingAsWav } from "../../utils/audioExport";
import { PreviewMusicSynth } from "../../utils/musicSynth";
import { ExecutionStateView } from "../ExecutionStateView";
import ManualPcmPlayer from "../ManualPcmPlayer";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { PageHeader } from "../ui/PageHeader";
import { cn } from "../../lib/utils";
import { SessionEngine } from "../../features/session/SessionEngine";
import { MissionCommandBar } from "../MissionCommandBar";
import { CapabilityId, CapabilityRegistry } from "../../features/studio/CapabilityRegistry";

import { PageTemplate } from "../../foundation/PageTemplate";
import { AdaptiveGrid } from "../../foundation/AdaptiveGrid";
import { AdaptiveCard } from "../../foundation/AdaptiveCard";
import { colors } from "../../foundation/tokens/colors";

interface MissionStudioProps {
  uiLanguage: "vi" | "en";
  newsContent: string;
  setNewsContent: React.Dispatch<React.SetStateAction<string>>;
  selectedNewsCategory: string;
  setSelectedNewsCategory: React.Dispatch<React.SetStateAction<string>>;
  isGeneratingNews: boolean;
  handleCreateNews: (topic?: string) => void;
  newsGenerationError: string;
  isListening: boolean;
  voiceInputLanguage: "vi-VN" | "en-US";
  setVoiceInputLanguage: React.Dispatch<React.SetStateAction<"vi-VN" | "en-US">>;
  isProcessingVoiceQuery: boolean;
  startVoiceSearch: () => void;
  voiceQueryStatus: string;
  voiceError: string;
  showVoiceAddPrompt: boolean;
  setShowVoiceAddPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  voiceQueryResult: any;
  setVoiceQueryResult: React.Dispatch<React.SetStateAction<any>>;
  voiceQuerySources: any[];
  setVoiceQuerySources: React.Dispatch<React.SetStateAction<any[]>>;
  handleVoiceAddToBriefing: (setNewsContent: React.Dispatch<React.SetStateAction<string>>) => void;
  handleApplyPreset: (index: number) => void;
  handleClearInput: () => void;
  wordCount: number;
  charLength: number;
  t: any;
  getApiUrl: (path: string) => string;
  step: "idle" | "summarizing" | "synthesizing" | "ready" | "error";
  executionState: any;
  generationProgress: string;
  handleGenerateBriefing: (content?: string, voiceOverride?: string) => void;
  handleGenerateScript?: (content?: string, voiceOverride?: string) => Promise<any>;
  handleGenerateAudio?: () => Promise<any>;
  setActivePayload?: React.Dispatch<React.SetStateAction<any>>;
  setActiveTitle?: React.Dispatch<React.SetStateAction<string>>;
  isRssBasedGeneration: boolean;
  setIsRssBasedGeneration: React.Dispatch<React.SetStateAction<boolean>>;
  setActiveTab: (tab: any) => void;
  preferences: any;
  setPreferences: React.Dispatch<React.SetStateAction<any>>;
  errorMessage: string;
  btnReset: () => void;
  activePayload: any;
  activeAudioChunks: any[];
  activeTitle: string;
  selectedBriefId: string;
  handlePlayerEnded: () => void;
  autosaveStatus: "idle" | "saving" | "saved";
  handlePublishPodcast: (id: string, silent?: boolean) => Promise<void>;
  isPublishingPodcast: boolean;
  pendingVoiceConfirm: boolean;
  confirmDefaultVoiceAndContinue: () => void;
  cancelVoiceConfirm: () => void;
  synthesisWarning?: string | null;
  activeSubTab?: import("../../types").MissionStudioSubTab;
  setMissionStudioSubTab?: (tab: any) => void;
  onPlayBriefing?: (briefing: any) => void;
  isPlayerPlaying?: boolean;
  savedBriefings?: any[];
}

export default function MissionTabView({
  uiLanguage,
  newsContent,
  setNewsContent,
  selectedNewsCategory,
  setSelectedNewsCategory,
  isGeneratingNews,
  handleCreateNews,
  newsGenerationError,
  isListening,
  voiceInputLanguage,
  setVoiceInputLanguage,
  isProcessingVoiceQuery,
  startVoiceSearch,
  voiceQueryStatus,
  voiceError,
  showVoiceAddPrompt,
  setShowVoiceAddPrompt,
  voiceQueryResult,
  setVoiceQueryResult,
  voiceQuerySources,
  setVoiceQuerySources,
  handleVoiceAddToBriefing,
  handleApplyPreset,
  handleClearInput,
  wordCount,
  charLength,
  t,
  getApiUrl,
  step,
  executionState,
  generationProgress,
  handleGenerateBriefing,
  handleGenerateScript,
  handleGenerateAudio,
  setActivePayload,
  setActiveTitle,
  isRssBasedGeneration,
  setIsRssBasedGeneration,
  setActiveTab,
  preferences,
  setPreferences,
  errorMessage,
  btnReset,
  activePayload,
  activeAudioChunks,
  activeTitle,
  selectedBriefId,
  handlePlayerEnded,
  autosaveStatus,
  handlePublishPodcast,
  isPublishingPodcast,
  pendingVoiceConfirm,
  confirmDefaultVoiceAndContinue,
  cancelVoiceConfirm,
  synthesisWarning,
  activeSubTab,
  setMissionStudioSubTab,
  onPlayBriefing,
  isPlayerPlaying,
  savedBriefings
}: MissionStudioProps) {
  const [activeStage, setActiveStage] = useState<number>(1);
  const [isRssModalOpen, setIsRssModalOpen] = useState(false);
  const [isScrapePanelOpen, setIsScrapePanelOpen] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  
  // Keyword filter states
  const [includeKeywords, setIncludeKeywords] = useState("");
  const [excludeKeywords, setExcludeKeywords] = useState("");

  const [publishSuccessId, setPublishSuccessId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const currentBriefing = savedBriefings?.find(b => b.id === selectedBriefId);
  const isPlayingCurrent = !!(isPlayerPlaying && currentBriefing && selectedBriefId);

  const handlePlayClick = () => {
    if (currentBriefing && onPlayBriefing) {
      onPlayBriefing(currentBriefing);
    }
  };


  // Script Draft inline editing utilities
  const updateDraftTitle = (newVal: string) => {
    setActiveTitle?.(newVal);
    if (activePayload) {
      setActivePayload?.({
        ...activePayload,
        title: newVal
      });
    }
  };

  const updateDraftIntroduction = (newVal: string) => {
    if (activePayload) {
      setActivePayload?.({
        ...activePayload,
        introduction: newVal
      });
    }
  };

  const updateDraftConclusion = (newVal: string) => {
    if (activePayload) {
      setActivePayload?.({
        ...activePayload,
        conclusion: newVal
      });
    }
  };

  const updateChapterTopic = (chapterIdx: number, newVal: string) => {
    if (activePayload && activePayload.chapters) {
      const updatedChapters = [...activePayload.chapters];
      updatedChapters[chapterIdx] = {
        ...updatedChapters[chapterIdx],
        topic: newVal
      };
      setActivePayload?.({
        ...activePayload,
        chapters: updatedChapters
      });
    }
  };

  const updateSegmentText = (chapterIdx: number, segmentIdx: number, newVal: string) => {
    if (activePayload && activePayload.chapters) {
      const updatedChapters = [...activePayload.chapters];
      const chapter = updatedChapters[chapterIdx];
      if (chapter.segments) {
        const updatedSegments = [...chapter.segments];
        updatedSegments[segmentIdx] = {
          ...updatedSegments[segmentIdx],
          text: newVal
        };
        updatedChapters[chapterIdx] = {
          ...chapter,
          segments: updatedSegments
        };
        setActivePayload?.({
          ...activePayload,
          chapters: updatedChapters
        });
      }
    }
  };

  const updateChapterScriptText = (chapterIdx: number, newVal: string) => {
    if (activePayload && activePayload.chapters) {
      const updatedChapters = [...activePayload.chapters];
      updatedChapters[chapterIdx] = {
        ...updatedChapters[chapterIdx],
        scriptText: newVal
      };
      setActivePayload?.({
        ...activePayload,
        chapters: updatedChapters
      });
    }
  };

  // Music preview states
  const musicSynthRef = useRef<PreviewMusicSynth | null>(null);
  const [previewPlayingMusic, setPreviewPlayingMusic] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!selectedBriefId) return;
    try {
      await handlePublishPodcast(selectedBriefId, false);
      setPublishSuccessId(selectedBriefId);
    } catch (err) {
      console.error("Publishing error in view:", err);
    }
  };

  const handleExportWav = async () => {
    if (activeAudioChunks.length === 0) return;
    setIsExporting(true);
    try {
      await exportBriefingAsWav(activeAudioChunks, activeTitle || "CommuteSummary");
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const isProcessing = step === "summarizing" || step === "synthesizing";

  const ProgressiveFeedback = ({ progress, uiLanguage }: { progress: string, uiLanguage: string }) => {
    const isAudioStage = step === "synthesizing";

    const steps = isAudioStage
      ? (uiLanguage === 'vi'
          ? ["Chuẩn bị giọng đọc...", "Đang tạo Audio...", "Hoàn tất"]
          : ["Preparing voice...", "Synthesizing Audio...", "Complete"])
      : (uiLanguage === 'vi'
          ? ["Đang phân tích...", "Đang tạo Prompt...", "Đang tóm tắt...", "Hoàn tất"]
          : ["Analyzing...", "Generating Prompt...", "Summarizing...", "Complete"]);

    // Basic heuristic to determine active step based on string matching
    let activeStep = 0;
    if (isAudioStage) {
      if (progress.toLowerCase().includes("audio") || progress.toLowerCase().includes("tạo âm thanh") || progress.toLowerCase().includes("synthesiz") || progress.toLowerCase().includes("synthesis")) {
        activeStep = 1;
      } else if (progress.toLowerCase().includes("complete") || progress.toLowerCase().includes("hoàn tất") || progress.toLowerCase().includes("ready")) {
        activeStep = 2;
      }
    } else {
      if (progress.toLowerCase().includes("prompt")) {
        activeStep = 1;
      } else if (progress.toLowerCase().includes("summariz") || progress.toLowerCase().includes("tóm tắt")) {
        activeStep = 2;
      } else if (progress.toLowerCase().includes("complete") || progress.toLowerCase().includes("hoàn tất") || progress.toLowerCase().includes("ready")) {
        activeStep = 3;
      }
    }

    return (
      <div className="w-full max-w-sm space-y-3">
        {steps.map((stepItem, index) => (
          <div key={stepItem} className={cn(
            "flex items-center gap-3 p-3 rounded-xl transition-all",
            index === activeStep ? "" : "bg-surface-subtle"
          )}
          style={index === activeStep ? {
            backgroundColor: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
            borderColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)",
            borderWidth: "1px"
          } : {}}
          >
             <div className={cn(
               "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black",
               index === activeStep ? "" : "bg-border-subtle text-text-muted"
             )}
             style={index === activeStep ? { backgroundColor: colors.interactive, color: colors.onAccent } : {}}
             >
                {index < activeStep ? <CheckCircle className="w-3 h-3" /> : index + 1}
             </div>
             <span className={cn(
               "text-xs font-bold tracking-widest",
               index === activeStep ? "" : "text-text-muted"
             )}
             style={index === activeStep ? { color: colors.interactive } : {}}
             >{stepItem}</span>
          </div>
        ))}
      </div>
    );
  };

  const stages = {
    vi: [
      { id: 1, name: "Nguồn Tin", icon: Rss, desc: "Chọn RSS, URL hoặc dán văn bản" },
      { id: 2, name: "Nội Dung", icon: Wand2, desc: "Gemini tóm tắt và biên dịch" },
      { id: 3, name: "Giọng Đọc", icon: Mic, desc: "Chọn giọng, nhạc và nghe thử" },
      { id: 4, name: "Xuất Bản", icon: Share2, desc: "Tải về hoặc lưu vào thư viện" }
    ],
    en: [
      { id: 1, name: "Source", icon: Rss, desc: "Pick RSS, URL or paste text" },
      { id: 2, name: "Content", icon: Wand2, desc: "Gemini summary & rewrite" },
      { id: 3, name: "Voice", icon: Mic, desc: "Select voice & preview audio" },
      { id: 4, name: "Publish", icon: Share2, desc: "Export or save to library" }
    ]
  }[uiLanguage];

  const pt = {
    vi: {
      sourceTitle: "1. Lựa chọn nguồn tin",
      contentTitle: "2. Trí tuệ nội dung",
      voiceTitle: "3. Studio giọng đọc",
      publishTitle: "4. Hoàn tất & Xuất bản",
      btnNext: "Tiếp theo",
      btnBack: "Quay lại",
      btnExecute: "Thực thi sản xuất",
      btnPublish: "Lưu vào thư viện",
      clearCta: "Xóa sạch dữ liệu",
      sourcePlaceholder: "Dán nội dung tin tức của bạn vào đây...",
      aiSuggest: "Gợi ý từ AI",
      noContent: "Chưa có nội dung đầu vào",
      scriptReady: "Kịch bản đã sẵn sàng",
      voiceSelect: "Chọn Host AI",
      musicSelect: "Nhạc nền",
      previewAudio: "Nghe thử bản tin",
      productionLive: "Đang sản xuất trực tiếp",
      errorOccurred: "Lỗi trong quá trình xử lý"
    },
    en: {
      sourceTitle: "1. News Source Selection",
      contentTitle: "2. Content Intelligence",
      voiceTitle: "3. Speech & Voice Studio",
      publishTitle: "4. Fulfillment & Publishing",
      btnNext: "Continue",
      btnBack: "Go Back",
      btnExecute: "Execute Production",
      btnPublish: "Save to Library",
      clearCta: "Clear All Data",
      sourcePlaceholder: "Paste your raw news content here...",
      aiSuggest: "AI Suggestions",
      noContent: "No input content provided",
      scriptReady: "Script is ready for voiceover",
      voiceSelect: "Select AI Host",
      musicSelect: "Background Music",
      previewAudio: "Preview Broadcast",
      productionLive: "Live Production in Progress",
      errorOccurred: "Operational Error Occurred"
    }
  }[uiLanguage];

  const updatePreference = (key: string, value: any) => {
    setPreferences((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const [previewLoadingVoice, setPreviewLoadingVoice] = useState<string | null>(null);
  const [previewVoiceError, setPreviewVoiceError] = useState<string | null>(null);

  useEffect(() => {
    if (musicSynthRef.current && previewPlayingMusic) {
      musicSynthRef.current.setVolume(preferences?.musicVolume || 50);
    }
  }, [preferences?.musicVolume, previewPlayingMusic]);
  const [previewPlayingVoice, setPreviewPlayingVoice] = useState<string | null>(null);
  const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);

  // --- Reconstructed UI for Mission Studio Subtabs ---
  // Using activeSubTab from App.tsx instead of activeStage

  const renderSourceTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-black tracking-tight text-text-main">{pt.sourceTitle}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6 flex flex-col">
          <div className="bg-surface-bg border border-border-subtle rounded-2xl p-6 shadow-sm">
             <RSSManager
               uiLanguage={uiLanguage}
               getApiUrl={getApiUrl}
               onGenerateFromRSS={(content) => {
                 if (setIsRssBasedGeneration) setIsRssBasedGeneration(true);
                 if (handleGenerateScript) handleGenerateScript(content);
                 if (setMissionStudioSubTab) setMissionStudioSubTab("draft");
               }}
               isGenerating={isProcessing}
               onAddToDraft={(text) => setNewsContent(prev => prev ? prev + "\n\n" + text : text)}
             />
          </div>

          <div className="bg-surface-bg border border-border-subtle rounded-2xl p-6 shadow-sm">
             <TopicSuggestions
                uiLanguage={uiLanguage}
                onSelectTopic={(topic) => {
                  if (setIsRssBasedGeneration) setIsRssBasedGeneration(false);
                  if (handleCreateNews) handleCreateNews(topic);
                  if (setMissionStudioSubTab) setMissionStudioSubTab("draft");
                }}
                isGenerating={isProcessing}
             />
          </div>
          
          {/* 4. URL Scraping Panel */}
          <div className="bg-surface-bg border border-border-subtle rounded-2xl p-6 shadow-sm flex-1">
             <h3 className="font-black text-sm uppercase tracking-widest mb-4">{uiLanguage === "vi" ? "Lấy tin từ URL" : "Scrape from URL"}</h3>
             <div className="flex flex-col gap-4">
               <div className="flex gap-4 items-center">
                 <input 
                   type="text" 
                   className="flex-1 bg-surface-subtle text-text-main placeholder:text-text-muted rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50" 
                   placeholder="https://..."
                   value={scrapeUrl}
                   onChange={(e) => setScrapeUrl(e.target.value)}
                 />
                 <Button 
                   onClick={async () => {
                     setIsScraping(true);
                     setScrapeError(null);
                     try {
                       const response = await fetch(getApiUrl("/api/rss/scrape"), {
                         method: "POST",
                         headers: { "Content-Type": "application/json" },
                         body: JSON.stringify({ url: scrapeUrl })
                       });
                       if (!response.ok) throw new Error("Scrape failed");
                       const data = await response.json();
                       if (data.success && data.content) {
                           setNewsContent(prev => prev ? prev + "\n\n" + data.content : data.content);
                         setScrapeUrl("");
                       } else {
                         throw new Error(data.error || "No content found");
                       }
                     } catch (err: any) {
                       setScrapeError(err.message);
                     } finally {
                       setIsScraping(false);
                     }
                   }}
                   disabled={isScraping || !scrapeUrl}
                   className="uppercase tracking-widest text-[10px] font-black px-6 whitespace-nowrap"
                 >
                   {isScraping ? (uiLanguage === "vi" ? "Đang xử lý..." : "Scraping...") : (uiLanguage === "vi" ? "Trích xuất" : "Extract")}
                 </Button>
               </div>
               
               <div className="flex gap-4">
                 <input 
                   type="text" 
                   className="flex-1 bg-surface-subtle text-text-main placeholder:text-text-muted rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/50" 
                   placeholder={uiLanguage === "vi" ? "Từ khóa bao gồm..." : "Include keywords..."}
                   value={includeKeywords}
                   onChange={(e) => setIncludeKeywords(e.target.value)}
                 />
                 <input 
                   type="text" 
                   className="flex-1 bg-surface-subtle text-text-main placeholder:text-text-muted rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/50" 
                   placeholder={uiLanguage === "vi" ? "Từ khóa loại trừ..." : "Exclude keywords..."}
                   value={excludeKeywords}
                   onChange={(e) => setExcludeKeywords(e.target.value)}
                 />
               </div>
             </div>
             {scrapeError && <p className="text-status-error text-xs mt-2">{scrapeError}</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-bg border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col h-full min-h-[500px]">
             <h3 className="font-black text-sm uppercase tracking-widest mb-4">{uiLanguage === "vi" ? "Hoặc dán văn bản" : "Or paste raw text"}</h3>
             <textarea
               className="flex-1 w-full bg-surface-subtle text-text-main placeholder:text-text-muted rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-accent/50 mb-4"
               placeholder={pt.sourcePlaceholder}
               value={newsContent}
               onChange={(e) => setNewsContent(e.target.value)}
             />
             <div className="flex justify-between items-center pt-4 border-t border-border-subtle">
                <Button variant="ghost" onClick={btnReset} className="text-status-error hover:bg-status-error/10 uppercase tracking-widest text-[10px] font-black">{pt.clearCta}</Button>
                <Button onClick={() => { if (setIsRssBasedGeneration) setIsRssBasedGeneration(false); if (handleGenerateScript) handleGenerateScript(newsContent); if (setMissionStudioSubTab) setMissionStudioSubTab("draft"); }} disabled={!newsContent.trim() || isProcessing} className="uppercase tracking-widest text-xs font-black px-6" style={{ backgroundColor: colors.interactive, color: colors.onAccent }}>
                  {isProcessing ? "Processing..." : pt.btnNext}
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDraftEditorTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-black tracking-tight text-text-main">{pt.contentTitle}</h2>
      </div>
      {step === "summarizing" ? (
        <div className="p-12 bg-surface-bg border border-border-subtle rounded-2xl">
           <ProgressiveFeedback progress={generationProgress} uiLanguage={uiLanguage} />
         </div>
      ) : activePayload ? (
        <div className="space-y-6">
          <div className="bg-surface-bg border border-border-subtle rounded-2xl p-6 shadow-sm space-y-4">
             <label className="text-xs font-black uppercase tracking-widest text-text-muted">Title</label>
             <input type="text" value={activeTitle} onChange={(e) => updateDraftTitle(e.target.value)} className="w-full bg-surface-subtle text-text-main p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 font-bold" />
             
             <label className="text-xs font-black uppercase tracking-widest text-text-muted mt-4 block">Introduction</label>
             <textarea value={activePayload.introduction} onChange={(e) => updateDraftIntroduction(e.target.value)} className="w-full h-24 bg-surface-subtle text-text-main p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-accent/50 text-sm" />
             
             {activePayload.chapters?.map((ch: any, idx: number) => (
                <div key={idx} className="mt-4 border-t border-border-subtle pt-4">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted mb-2 block">Chapter {idx + 1}</label>
                  <input type="text" value={ch.topic} onChange={(e) => updateChapterTopic(idx, e.target.value)} className="w-full mb-2 bg-surface-subtle text-text-main p-3 rounded-xl focus:outline-none font-medium text-sm" />
                  <textarea value={ch.scriptText || ""} onChange={(e) => updateChapterScriptText(idx, e.target.value)} className="w-full h-24 bg-surface-subtle text-text-main p-3 rounded-xl focus:outline-none text-sm" placeholder="Script text..." />
                </div>
             ))}
          </div>
          <div className="flex justify-end pt-4">
             <Button onClick={() => { if (setMissionStudioSubTab) setMissionStudioSubTab("voice"); }} className="uppercase tracking-widest text-xs font-black px-6" style={{ backgroundColor: colors.interactive, color: colors.onAccent }}>
               {uiLanguage === "vi" ? "Tiếp theo" : "Next"}
             </Button>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-text-muted bg-surface-bg border border-border-subtle rounded-2xl">
           <p className="font-medium">{pt.noContent}</p>
        </div>
      )}
    </div>
  );

  const renderVoiceTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-black tracking-tight text-text-main">{pt.voiceTitle}</h2>
      </div>
      {step === "synthesizing" ? (
        <div className="p-12 bg-surface-bg border border-border-subtle rounded-2xl">
           <ProgressiveFeedback progress={generationProgress} uiLanguage={uiLanguage} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-surface-bg border border-border-subtle rounded-2xl p-6 shadow-sm">
                <h3 className="font-black text-sm uppercase tracking-widest mb-4">{pt.voiceSelect}</h3>
                <div className="space-y-2">
                   {["alloy", "echo", "fable", "onyx", "nova", "shimmer"].map(voice => (
                     <div key={voice} className="flex gap-2">
                       <button onClick={() => updatePreference('defaultVoice', voice)} className={cn("flex-1 text-left p-3 rounded-xl border capitalize font-medium transition-all", preferences?.defaultVoice === voice ? "border-brand-accent bg-brand-accent/10 text-brand-accent" : "border-border-subtle text-text-main hover:bg-surface-subtle")}>
                          {voice}
                       </button>
                       <Button 
                         variant="outline" 
                         size="icon" 
                         className="h-auto aspect-square rounded-xl"
                         onClick={() => {
                           if (previewPlayingVoice === voice) {
                             if (previewAudioRef.current) {
                               previewAudioRef.current.pause();
                               previewAudioRef.current.currentTime = 0;
                             }
                             setPreviewPlayingVoice(null);
                           } else {
                             setPreviewLoadingVoice(voice);
                             setPreviewVoiceError(null);
                             fetch(getApiUrl('/api/tts/preview'), {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ voice, lang: uiLanguage === 'vi' ? 'vi' : 'en' })
                             })
                               .then(res => res.json())
                               .then(data => {
                                 if (data.success && data.audioBase64) {
                                   if (previewAudioRef.current) {
                                     previewAudioRef.current.pause();
                                   }
                                   const isWav = data.audioBase64.startsWith("UklGR");
                                   const mimeType = isWav ? "audio/wav" : "audio/mp3";
                                   const audio = new Audio(`data:${mimeType};base64,${data.audioBase64}`);
                                   audio.onended = () => setPreviewPlayingVoice(null);
                                   audio.onerror = () => {
                                     console.error("[Voice Preview] Audio decoding or load failed");
                                     setPreviewPlayingVoice(null);
                                     setPreviewLoadingVoice(null);
                                     setPreviewVoiceError("Failed to decode or play preview audio.");
                                   };
                                   audio.play().catch(e => {
                                     console.error("[Voice Preview] Play failed:", e);
                                     setPreviewPlayingVoice(null);
                                     setPreviewVoiceError(e.message || "Failed to play preview audio.");
                                   });
                                   previewAudioRef.current = audio;
                                   setPreviewPlayingVoice(voice);
                                 } else {
                                   setPreviewVoiceError(data.error || "Failed to preview voice.");
                                 }
                               })
                               .catch(err => {
                                 setPreviewVoiceError(err.message || "Failed to preview voice.");
                               })
                               .finally(() => setPreviewLoadingVoice(null));
                           }
                         }}
                       >
                         {previewLoadingVoice === voice ? <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" /> : 
                          previewPlayingVoice === voice ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                       </Button>
                     </div>
                   ))}
                   {previewVoiceError && <p className="text-status-error text-xs mt-2">{previewVoiceError}</p>}
                </div>
             </div>

             <div className="bg-surface-bg border border-border-subtle rounded-2xl p-6 shadow-sm">
                <h3 className="font-black text-sm uppercase tracking-widest mb-4">{pt.musicSelect}</h3>
                <div className="space-y-2">
                   {["none", "ambient", "news", "electronic", "lofi"].map(music => (
                     <div key={music} className="flex gap-2">
                       <button onClick={() => updatePreference('backgroundMusic', music)} className={cn("flex-1 text-left p-3 rounded-xl border capitalize font-medium transition-all", preferences?.backgroundMusic === music ? "border-brand-accent bg-brand-accent/10 text-brand-accent" : "border-border-subtle text-text-main hover:bg-surface-subtle")}>
                          {music === "none" ? (uiLanguage === "vi" ? "Không có nhạc" : "No Music") : music}
                       </button>
                       {music !== "none" && (
                         <Button 
                           variant="outline" 
                           size="icon" 
                           className="h-auto aspect-square rounded-xl"
                           onClick={() => {
                             if (previewPlayingMusic === music) {
                               if (musicSynthRef.current) musicSynthRef.current.stop();
                               setPreviewPlayingMusic(null);
                             } else {
                               if (musicSynthRef.current) musicSynthRef.current.stop();
                               musicSynthRef.current = new PreviewMusicSynth(music, preferences?.musicVolume || 50);
                               musicSynthRef.current.start();
                               setPreviewPlayingMusic(music);
                             }
                           }}
                         >
                           {previewPlayingMusic === music ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                         </Button>
                       )}
                     </div>
                   ))}
                </div>
                <div className="mt-4 p-3 bg-surface-subtle rounded-xl flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-text-muted">{uiLanguage === "vi" ? "Âm lượng nhạc" : "Music Volume"}</span>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={preferences?.musicVolume || 50} 
                    onChange={(e) => updatePreference('musicVolume', parseInt(e.target.value))}
                    className="w-1/2"
                  />
                </div>
             </div>
          </div>
          <div className="flex justify-end pt-4">
             <Button onClick={async () => { if (handleGenerateAudio) { const res = await handleGenerateAudio(); if (res && setMissionStudioSubTab) setMissionStudioSubTab("publish"); } }} disabled={!activePayload || isProcessing} className="uppercase tracking-widest text-xs font-black px-6" style={{ backgroundColor: colors.interactive, color: colors.onAccent }}>
               {isProcessing ? pt.productionLive : pt.btnExecute}
             </Button>
          </div>
        </>
      )}
    </div>
  );

  const renderPreviewPublishTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-black tracking-tight text-text-main">{pt.publishTitle}</h2>
      </div>
      <div className="bg-surface-bg border border-border-subtle rounded-2xl p-12 text-center shadow-sm">
         <button 
           onClick={handlePlayClick}
           disabled={!currentBriefing}
           className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-all focus:outline-none relative group ${
             isPlayingCurrent 
               ? "bg-brand-accent text-white scale-105 shadow-lg shadow-brand-accent/30" 
               : "bg-brand-accent/20 text-brand-accent hover:bg-brand-accent/30 hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
           } mb-6`}
           title={isPlayingCurrent 
             ? (uiLanguage === "vi" ? "Tạm dừng phát" : "Pause preview") 
             : (uiLanguage === "vi" ? "Phát nghe thử" : "Play preview")}
         >
           {isPlayingCurrent ? (
             <Pause className="w-10 h-10" />
           ) : (
             <Mic className="w-10 h-10 group-hover:scale-110 transition-transform" />
           )}
           {isPlayingCurrent && (
             <span className="absolute -inset-1 rounded-full border-2 border-brand-accent/50 animate-ping opacity-75" />
           )}
         </button>
         <h3 className="text-lg font-black tracking-tight mb-2 text-text-main">Mission Ready</h3>
         <p className="text-text-muted mb-8">{pt.scriptReady}</p>
         
         <div className="flex justify-center gap-4">
           <Button onClick={handleExportWav} disabled={isExporting} variant="outline" className="uppercase tracking-widest text-xs font-black px-6">
             <Download className="w-4 h-4 mr-2" />
             Export WAV
           </Button>
           <Button onClick={handlePublish} disabled={!selectedBriefId} className="uppercase tracking-widest text-xs font-black px-6" style={{ backgroundColor: colors.interactive, color: colors.onAccent }}>
             <Share2 className="w-4 h-4 mr-2" />
             {pt.btnPublish}
           </Button>
         </div>
      </div>
    </div>
  );

  const renderActiveSubTab = () => {
    switch (activeSubTab) {
      case "source": return renderSourceTab();
      case "research": return (
        <div className="p-12 text-center bg-surface-bg border border-border-subtle rounded-2xl shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-brand-accent/20 text-brand-accent mb-5">
            <Rss className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black tracking-tight mb-2 text-text-main">
            {uiLanguage === "vi" ? "Chưa có bước Nghiên cứu riêng" : "No standalone Research step yet"}
          </h3>
          <p className="text-text-muted mb-8 max-w-md mx-auto text-sm">
            {uiLanguage === "vi"
              ? "Hiện tại việc thu thập nguồn tin (RSS) và tạo bản nháp đã được gộp chung ở bước Nguồn tin. Hãy quay lại đó để chọn nguồn và tạo bản tin."
              : "Sourcing (RSS) and draft generation are currently combined in the Source step. Go back there to pick sources and generate a briefing."}
          </p>
          <Button
            onClick={() => setMissionStudioSubTab && setMissionStudioSubTab("source")}
            className="uppercase tracking-widest text-xs font-black px-6"
            style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
          >
            {uiLanguage === "vi" ? "Đi tới Nguồn tin" : "Go to Source"}
          </Button>
        </div>
      );
      case "draft":
      case "editor": return renderDraftEditorTab();
      case "voice": return renderVoiceTab();
      case "preview":
      case "publish": return renderPreviewPublishTab();
      case "history": return (
        <div className="p-12 text-center bg-surface-bg border border-border-subtle rounded-2xl shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-brand-accent/20 text-brand-accent mb-5">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black tracking-tight mb-2 text-text-main">
            {uiLanguage === "vi" ? "Lịch sử nằm ở Thư viện" : "History lives in Library"}
          </h3>
          <p className="text-text-muted mb-8 max-w-md mx-auto text-sm">
            {uiLanguage === "vi"
              ? "Các bản tin đã tạo trước đây được lưu và quản lý trong tab Thư viện, không phải ở đây."
              : "Previously generated briefings are stored and managed in the Library tab, not here."}
          </p>
          <Button
            onClick={() => setActiveTab("library")}
            className="uppercase tracking-widest text-xs font-black px-6"
            style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
          >
            {uiLanguage === "vi" ? "Đi tới Thư viện" : "Go to Library"}
          </Button>
        </div>
      );
      default: return renderSourceTab();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-32">
      {/* Subtab content container */}
      <div className="pt-2">
        {renderActiveSubTab()}
      </div>
      
      {/* Absolute overlay for voice confirmation dialog */}
      {pendingVoiceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface-bg border border-border-primary rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-6">
            <h3 className="text-lg font-black tracking-tight">Confirm Voice Settings</h3>
            <p className="text-text-muted text-sm">{synthesisWarning || "Proceed with current voice settings?"}</p>
            <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
              <Button variant="outline" onClick={cancelVoiceConfirm}>Cancel</Button>
              <Button onClick={confirmDefaultVoiceAndContinue} style={{ backgroundColor: colors.interactive, color: colors.onAccent }}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
