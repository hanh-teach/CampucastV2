import React, { useState, useEffect } from "react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { cn } from "../../lib/utils";
import RSSManager from "../RSSManager";
import { getApiUrl } from "../../utils/apiUtils";
import { 
  Folder, 
  FolderOpen, 
  Layers, 
  FileText, 
  Mic, 
  Music, 
  Radio, 
  Rss, 
  Trash2, 
  Play, 
  Pause,
  Share2, 
  CloudRain, 
  Database, 
  Info, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  ChevronRight,
  RefreshCw,
  Search,
  ExternalLink,
  BookOpen,
  History,
  Layout,
  Waves,
  Save,
  Download,
  Clock,
  Edit3,
  Copy,
  Archive as ArchiveIcon
} from "lucide-react";
import { SavedSummary, PublishedEpisode, TabType, LanguageMode, BroadcastConfiguration } from "../../types";
import { PageTemplate } from "../../foundation/PageTemplate";
import { AdaptiveWorkspace } from "../../foundation/AdaptiveWorkspace";
import { colors } from "../../foundation/tokens/colors";

interface AssetsWorkspaceProps {
  uiLanguage: "vi" | "en";
  savedBriefings: SavedSummary[];
  podcastEpisodes: PublishedEpisode[];
  isPublishingPodcast: boolean;
  podcastError: string | null;
  handlePublishPodcast: (briefing: SavedSummary) => Promise<any>;
  handleDeletePodcastEpisode: (id: string) => Promise<any>;
  isAutoPublish: boolean;
  setIsAutoPublish: (val: boolean) => void;
  selectedBriefId: string | null;
  setSelectedBriefId: (id: string | null) => void;
  isPlayerPlaying?: boolean;
  storageUsage?: string | { usedMB: number; totalMB?: number };
  clearAllBriefings: () => Promise<any>;
  deleteOneBriefing: (id: string) => Promise<any>;
  refreshBriefings: (v: boolean) => Promise<any>;
  handleApplyIntelligenceBriefing: (briefing: SavedSummary) => void;
  onPlayBriefing: (briefing: SavedSummary | any) => void;
  setActiveTab: (tab: TabType) => void;
  handleGenerateBriefing?: (content?: string) => void;
  handleGenerateScript?: (content?: string) => void;
  setIsRssBasedGeneration?: React.Dispatch<React.SetStateAction<boolean>>;
  setMissionStudioSubTab?: (tab: import("../../types").MissionStudioSubTab) => void;
  activeSubTab?: import("../../types").LibrarySubTab;
  onSubTabChange?: (tab: import("../../types").LibrarySubTab) => void;
  preferences?: BroadcastConfiguration;
  updatePreferences?: (prefs: Partial<BroadcastConfiguration>) => void;
  setNewsContent?: (content: string | ((prev: string) => string)) => void;
  loadPodcastEpisodes?: () => Promise<any>;
  isGenerating?: boolean;
}

type ActiveCategory = "missions" | "scripts" | "audio" | "sources" | "templates" | "archive";

export default function AssetsTabView({
  uiLanguage,
  savedBriefings,
  podcastEpisodes,
  isPublishingPodcast,
  podcastError,
  handlePublishPodcast,
  handleDeletePodcastEpisode,
  isAutoPublish,
  setIsAutoPublish,
  selectedBriefId,
  setSelectedBriefId,
  isPlayerPlaying = false,
  storageUsage = { usedMB: 14.2, totalMB: 512 },
  clearAllBriefings,
  deleteOneBriefing,
  refreshBriefings,
  handleApplyIntelligenceBriefing,
  onPlayBriefing,
  setActiveTab,
  handleGenerateBriefing,
  handleGenerateScript,
  setIsRssBasedGeneration,
  setMissionStudioSubTab,
  activeSubTab,
  preferences,
  updatePreferences,
  setNewsContent,
  loadPodcastEpisodes,
  onSubTabChange,
  isGenerating = false
}: AssetsWorkspaceProps) {
  
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("missions");

  // Sync internal category with external sub-tab from header
  useEffect(() => {
    if (activeSubTab && activeSubTab !== activeCategory) {
      setActiveCategory(activeSubTab as ActiveCategory);
    }
  }, [activeSubTab]);

  const [selectedBriefingId, setSelectedBriefingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedScriptId, setExpandedScriptId] = useState<string | null>(null);
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);

  const handleCopyScript = (brief: SavedSummary) => {
    const fullText = [
      `== ${brief.payload.title} ==`,
      `[MỞ ĐẦU / INTRODUCTION]`,
      brief.payload.introduction,
      "",
      ...brief.payload.chapters.map((ch, idx) => {
        return `[CHƯƠNG ${idx + 1} / CHAPTER ${idx + 1}: ${ch.topic}]\n${ch.scriptText}\n${ch.summaryBullets && ch.summaryBullets.length > 0 ? `Tóm tắt / Summary:\n- ${ch.summaryBullets.join("\n- ")}` : ""}`;
      }),
      "",
      `[KẾT LUẬN / CONCLUSION]`,
      brief.payload.conclusion
    ].join("\n\n");

    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedScriptId(brief.id);
      setTimeout(() => setCopiedScriptId(null), 2000);
    });
  };

  const handleSelectTemplate = (templateId: string) => {
    if (!updatePreferences || !setNewsContent || !setMissionStudioSubTab) return;

    let targetTone: string = "conversational";
    let targetDuration: string = "medium";
    let promptContent: string = "";

    if (templateId === "morning") {
      targetTone = "optimistic";
      targetDuration = "short";
      promptContent = uiLanguage === "vi" 
        ? "Bản tin sáng sớm: Chào buổi sáng! Hãy điểm qua những tin tức quan trọng nhất để bắt đầu ngày mới đầy năng lượng. Tập trung vào tin thế giới, kinh tế và dự báo thời tiết."
        : "Morning Brief: Good morning! Let's go through the most important news to start a productive day. Focus on world news, economy, and weather forecast.";
    } else if (templateId === "commute") {
      targetTone = "informative";
      targetDuration = "medium";
      promptContent = uiLanguage === "vi"
        ? "Đồng hành đi làm: Cập nhật nhanh tình hình giao thông, tin vắn công nghệ và các sự kiện đáng chú ý đang diễn ra. Phù hợp nghe khi đang di chuyển."
        : "Commute Companion: Quick updates on traffic, tech headlines, and notable events happening now. Perfect for listening on the go.";
    } else if (templateId === "digest") {
      targetTone = "analytical";
      targetDuration = "long";
      promptContent = uiLanguage === "vi"
        ? "Tổng kết cuối ngày: Nhìn lại toàn cảnh các sự kiện trong ngày. Phân tích sâu các vấn đề nổi bật và những gì cần lưu ý cho ngày mai."
        : "Evening Digest: A comprehensive look back at the day's events. Deep analysis of major issues and what to watch for tomorrow.";
    }

    updatePreferences({
      tone: targetTone as any,
      targetDuration: targetDuration as any,
      customInstructions: promptContent
    });

    setNewsContent(promptContent);
    setActiveTab("mission_studio");
    setMissionStudioSubTab("draft");
  };

  const formattedStorage = typeof storageUsage === "object" && storageUsage !== null
    ? `${storageUsage.usedMB.toFixed(2)} MB / ${storageUsage.totalMB || 512} MB`
    : String(storageUsage || "");

  const t = {
    vi: {
      title: "Thư viện Đối tượng",
      subtitle: "Quản lý dữ liệu theo cấu trúc: Mission → Script → Audio → Source",
      missions: "Nhiệm vụ (Missions)",
      scripts: "Kịch bản (Scripts)",
      audio: "Âm thanh (Audio)",
      sources: "Nguồn tin (Sources)",
      templates: "Mẫu bản tin (Templates)",
      archive: "Lưu trữ (Archive)",
      searchPlaceholder: "Tìm kiếm trong thư viện...",
      noMissions: "Không tìm thấy nhiệm vụ nào.",
      noEpisodes: "Chưa có tập podcast nào.",
      deleteConfirm: "Xác nhận xóa vĩnh viễn đối tượng này?",
      loadMission: "Nạp vào Workspace",
      downloadAudio: "Tải Master (.wav)",
      storageLabel: "Bộ nhớ ngoại tuyến",
      metadataLabel: "Thông tin chi tiết"
    },
    en: {
      title: "Object Library",
      subtitle: "Data management by structure: Mission → Script → Audio → Source",
      missions: "Missions",
      scripts: "Scripts",
      audio: "Audio Masters",
      sources: "RSS Sources",
      templates: "Templates",
      archive: "Archive",
      searchPlaceholder: "Search library objects...",
      noMissions: "No saved missions found.",
      noEpisodes: "No podcast episodes found.",
      deleteConfirm: "Confirm permanent deletion of this object?",
      loadMission: "Load into Workspace",
      downloadAudio: "Download Master (.wav)",
      storageLabel: "Offline Storage",
      metadataLabel: "Object Metadata"
    }
  }[uiLanguage];

  const categories: { id: ActiveCategory; label: string; icon: any; count?: number }[] = [
    { id: "missions", label: t.missions, icon: Layers, count: savedBriefings.length },
    { id: "scripts", label: t.scripts, icon: FileText, count: savedBriefings.length },
    { id: "audio", label: t.audio, icon: Mic, count: savedBriefings.length },
    { id: "sources", label: t.sources, icon: Rss, count: 5 },
    { id: "templates", label: t.templates, icon: Layout, count: 3 },
    { id: "archive", label: t.archive, icon: History, count: podcastEpisodes.length }
  ];

  // Auto-fetch podcast episodes when viewing the Archive tab or on mount
  useEffect(() => {
    if (loadPodcastEpisodes) {
      loadPodcastEpisodes();
    }
  }, [activeCategory, loadPodcastEpisodes]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBriefings(true);
    if (loadPodcastEpisodes) {
      await loadPodcastEpisodes();
    }
    setIsRefreshing(false);
  };

  const selectedBriefing = savedBriefings.find(b => b.id === selectedBriefingId) || savedBriefings[0];

  const filteredBriefings = savedBriefings.filter(b => {
    const title = b.payload?.title || "";
    const intro = b.payload?.introduction || "";
    const query = searchQuery.toLowerCase();
    return title.toLowerCase().includes(query) || intro.toLowerCase().includes(query);
  });

  const filteredEpisodes = podcastEpisodes.filter(ep => {
    const title = ep.title || "";
    const desc = ep.description || "";
    const query = searchQuery.toLowerCase();
    return title.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
  });

  return (
    <PageTemplate
      id="assets-workspace-root"
      className="h-[calc(100vh-68px)] bg-surface-bg text-left flex flex-col"
      header={
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <div>
            <h1 className="text-2xl font-black text-text-main tracking-tight uppercase flex items-center gap-3">
              <BookOpen className="w-6 h-6" style={{ color: colors.interactive }} />
              <span>{t.title}</span>
            </h1>
            <p className="text-[10px] text-text-muted font-mono tracking-wider mt-1 uppercase opacity-60">
              {t.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-10 px-4 border-border-subtle bg-surface-bg flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted"
              style={{ borderColor: colors.border }}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing ? "animate-spin" : "")} style={isRefreshing ? { color: colors.interactive } : {}} />
              <span>Refresh</span>
            </Button>

            <Button
              onClick={() => setActiveTab("mission_studio")}
              className="font-black text-xs h-10 px-6 rounded-xl flex items-center gap-2 uppercase tracking-[0.1em] shadow-lg shadow-brand-accent/20"
              style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: colors.onAccent }} />
              <span>New Production</span>
            </Button>
          </div>
        </div>
      }
    >
      <AdaptiveWorkspace
        className="flex-1 overflow-hidden"
        sidebar={null}
      >
        <div className="h-full p-6 overflow-y-auto custom-scrollbar" id="assets-workspace-content">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative w-full max-w-md">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-subtle border border-border-subtle rounded-2xl pl-11 pr-4 py-3 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-brand-accent/50 focus:bg-surface-bg transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              {activeCategory === "missions" && (
                filteredBriefings.length > 0 ? (
                  filteredBriefings.map((brief) => (
                    <Card
                      key={brief.id}
                      onClick={() => setSelectedBriefingId(brief.id)}
                      className={cn(
                        "p-6 transition-all cursor-pointer flex flex-col justify-between items-center group",
                        selectedBriefingId === brief.id 
                          ? "border-2 border-brand-accent bg-brand-accent/[0.02]" 
                          : "border border-border-subtle hover:border-text-muted/20 bg-surface-subtle/20"
                      )}
                    >
                      <div className="w-full space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 text-left min-w-0 flex-1 pr-6">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-surface-bg flex items-center justify-center border border-border-subtle group-hover:scale-110 transition-transform overflow-hidden" style={{ color: colors.interactive }}>
                                  {brief.artworkUrl ? (
                                    <img src={brief.artworkUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                  ) : (
                                    <Layers className="w-4 h-4" />
                                  )}
                               </div>
                               <h4 className="font-black text-base text-text-main truncate tracking-tight">{brief.payload.title}</h4>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-text-muted font-black uppercase tracking-widest opacity-60">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {brief.timestamp}</span>
                              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {brief.payload.chapters.length} Chapters</span>
                              <span className="px-2 py-0.5 rounded bg-surface-bg border border-border-subtle text-[8px]">{brief.preferences?.languageMode || "BILINGUAL"}</span>
                            </div>
                          </div>
                             
                          <div className="flex items-center gap-3">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayBriefing(brief);
                              }}
                              className="font-black text-[10px] uppercase tracking-widest h-10 px-4 rounded-xl flex items-center gap-2 hover:bg-brand-accent hover:text-on-accent transition-all"
                              style={{ backgroundColor: colors.textPrimary, color: colors.surface }}
                            >
                              {isPlayerPlaying && selectedBriefId === brief.id ? (
                                <Pause className="w-3 h-3 fill-current" />
                              ) : (
                                <Play className="w-3 h-3 fill-current" />
                              )}
                              <span>{selectedBriefId === brief.id ? (isPlayerPlaying ? (uiLanguage === "vi" ? "Tạm dừng" : "Pause") : (uiLanguage === "vi" ? "Tiếp tục" : "Resume")) : (uiLanguage === "vi" ? "Phát" : "Play")}</span>
                            </Button>
                          </div>
                        </div>

                        {selectedBriefingId === brief.id && (
                          <div className="flex items-center gap-2 pt-4 border-t border-border-subtle/50 overflow-x-auto custom-scrollbar pb-1">
                            {/* Actions Sequence */}
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleApplyIntelligenceBriefing(brief); }} className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-accent hover:bg-brand-accent/10">
                              <Edit3 className="w-3 h-3 mr-1.5" /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }} className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-accent hover:bg-brand-accent/10">
                              <Save className="w-3 h-3 mr-1.5" /> Save
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }} className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-accent hover:bg-brand-accent/10">
                              <Copy className="w-3 h-3 mr-1.5" /> Duplicate
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }} className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-accent hover:bg-brand-accent/10">
                              <Share2 className="w-3 h-3 mr-1.5" /> Share
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); window.open(getApiUrl(`/api/audio/download/${brief.id}`), '_blank'); }} className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-accent hover:bg-brand-accent/10">
                              <Download className="w-3 h-3 mr-1.5" /> Export
                            </Button>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }} className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-accent hover:bg-brand-accent/10">
                              <ArchiveIcon className="w-3 h-3 mr-1.5" /> Archive
                            </Button>
                            <div className="flex-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(t.deleteConfirm)) {
                                  deleteOneBriefing(brief.id).then(() => handleRefresh());
                                }
                              }}
                              className="p-2 flex items-center gap-2 hover:bg-[var(--color-critical)]/10 text-text-muted hover:text-[var(--color-critical)] rounded-lg transition-colors border border-transparent hover:border-[var(--color-critical)]/20 text-[10px] font-black uppercase tracking-widest"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-surface-subtle rounded-full flex items-center justify-center mx-auto">
                      <Layers className="w-8 h-8 text-text-muted opacity-50" />
                    </div>
                    <p className="text-sm font-black text-text-muted uppercase tracking-widest">{t.noMissions}</p>
                  </div>
                )
              )}

              {activeCategory === "scripts" && (
                filteredBriefings.length > 0 ? (
                  filteredBriefings.map((brief) => (
                    <Card key={brief.id} className="p-6 border border-border-subtle bg-surface-subtle/30 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-surface-bg border border-border-subtle flex items-center justify-center" style={{ color: colors.interactive }}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-text-main truncate">{uiLanguage === "vi" ? "Kịch bản" : "Script"}: {brief.payload.title}</h4>
                            <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">{brief.payload.chapters.length} Chapters • ~{brief.payload.introduction.length + brief.payload.conclusion.length} chars</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setExpandedScriptId(expandedScriptId === brief.id ? null : brief.id)}
                          className="text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent/10 transition-colors px-3 py-1.5 rounded-lg" 
                          style={{ color: colors.interactive }}
                        >
                          {expandedScriptId === brief.id 
                            ? (uiLanguage === "vi" ? "Thu gọn" : "Collapse") 
                            : (uiLanguage === "vi" ? "Xem văn bản" : "View Text")}
                        </Button>
                      </div>

                      {expandedScriptId === brief.id && (
                        <div className="pt-6 mt-4 border-t border-border-subtle/50 space-y-6 text-left">
                          {/* Introduction Block */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent">
                              {uiLanguage === "vi" ? "Lời mở đầu" : "Introduction"}
                            </span>
                            <div className="bg-surface-bg p-4 rounded-xl border border-border-subtle/40 text-xs text-text-main leading-relaxed font-sans">
                              {brief.payload.introduction}
                            </div>
                          </div>

                          {/* Chapters Block */}
                          <div className="space-y-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent block">
                              {uiLanguage === "vi" ? "Nội dung chương mục" : "Chapters & Segments"}
                            </span>
                            <div className="space-y-3">
                              {brief.payload.chapters.map((chapter, cIdx) => (
                                <div key={cIdx} className="bg-surface-bg/60 p-4 rounded-xl border border-border-subtle/40 space-y-3">
                                  <div className="flex items-center justify-between border-b border-border-subtle/20 pb-2">
                                    <h5 className="font-black text-xs text-text-main uppercase tracking-wider flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-md bg-brand-accent/10 text-brand-accent flex items-center justify-center font-mono text-[10px]">
                                        {cIdx + 1}
                                      </span>
                                      {chapter.topic}
                                    </h5>
                                  </div>
                                  <p className="text-xs text-text-main leading-relaxed font-sans whitespace-pre-wrap">
                                    {chapter.scriptText}
                                  </p>
                                  {chapter.summaryBullets && chapter.summaryBullets.length > 0 && (
                                    <div className="bg-surface-subtle/30 p-3 rounded-lg space-y-1.5 border border-border-subtle/10">
                                      <span className="text-[9px] font-black uppercase tracking-wider text-text-muted block">
                                        {uiLanguage === "vi" ? "Ý chính tóm tắt" : "Key Points"}
                                      </span>
                                      <ul className="list-disc list-inside text-[11px] text-text-muted space-y-1 pl-1">
                                        {chapter.summaryBullets.map((bullet, bIdx) => (
                                          <li key={bIdx} className="leading-relaxed">{bullet}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Conclusion Block */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent">
                              {uiLanguage === "vi" ? "Lời kết thúc" : "Conclusion"}
                            </span>
                            <div className="bg-surface-bg p-4 rounded-xl border border-border-subtle/40 text-xs text-text-main leading-relaxed font-sans">
                              {brief.payload.conclusion}
                            </div>
                          </div>

                          {/* Action Toolbar */}
                          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border-subtle/30">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleCopyScript(brief)}
                              className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-border-subtle text-text-muted hover:text-brand-accent hover:border-brand-accent/20 transition-all flex items-center gap-2"
                            >
                              {copiedScriptId === brief.id ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 text-[var(--color-success)]" />
                                  <span className="text-[var(--color-success)]">{uiLanguage === "vi" ? "Đã sao chép" : "Copied"}</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>{uiLanguage === "vi" ? "Sao chép kịch bản" : "Copy Script"}</span>
                                </>
                              )}
                            </Button>

                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                handleApplyIntelligenceBriefing(brief);
                                setActiveTab("mission_studio");
                                if (setMissionStudioSubTab) {
                                  setMissionStudioSubTab("draft");
                                }
                              }}
                              className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-border-subtle text-text-muted hover:text-brand-accent hover:border-brand-accent/20 transition-all flex items-center gap-2"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{uiLanguage === "vi" ? "Nạp vào trình soạn thảo" : "Load into Editor"}</span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-surface-subtle rounded-full flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-text-muted opacity-50" />
                    </div>
                    <p className="text-sm font-black text-text-muted uppercase tracking-widest">{uiLanguage === "vi" ? "Chưa có kịch bản nào." : "No scripts found."}</p>
                  </div>
                )
              )}

              {activeCategory === "audio" && (
                filteredBriefings.length > 0 ? (
                  filteredBriefings.map((brief) => (
                    <Card key={brief.id} className="p-6 border border-border-subtle bg-surface-subtle/30 space-y-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-bg border border-border-subtle flex items-center justify-center overflow-hidden" style={{ color: colors.interactive }}>
                          {brief.artworkUrl ? (
                            <img src={brief.artworkUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                          ) : (
                            <Mic className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-text-main truncate">{uiLanguage === "vi" ? "Bản thu" : "Audio Master"}: {brief.payload.title}</h4>
                          <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">PCM Stream • {brief.preferences?.voice} • ~8.5 mins</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-border-subtle text-text-muted hover:text-text-main" onClick={() => onPlayBriefing(brief)}>
                            {isPlayerPlaying && selectedBriefId === brief.id ? (
                              <Pause className="w-3 h-3 mr-2" />
                            ) : (
                              <Play className="w-3 h-3 mr-2" />
                            )}
                            {selectedBriefId === brief.id ? (isPlayerPlaying ? (uiLanguage === "vi" ? "Tạm dừng" : "Pause") : (uiLanguage === "vi" ? "Tiếp tục" : "Resume")) : (uiLanguage === "vi" ? "Phát" : "Play")}
                         </Button>
                         <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border-border-subtle text-text-muted hover:text-brand-accent" onClick={() => {
                           const audioUrl = getApiUrl(`/api/audio/download/${brief.id}`);
                           window.open(audioUrl, '_blank');
                         }}>
                            <Download className="w-3 h-3 mr-2" /> {uiLanguage === "vi" ? "Xuất" : "Export"}
                         </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-surface-subtle rounded-full flex items-center justify-center mx-auto">
                      <Mic className="w-8 h-8 text-text-muted opacity-50" />
                    </div>
                    <p className="text-sm font-black text-text-muted uppercase tracking-widest">{uiLanguage === "vi" ? "Chưa có âm thanh nào." : "No audio found."}</p>
                  </div>
                )
              )}

              {activeCategory === "sources" && (
                <div className="w-full">
                  <RSSManager
                    uiLanguage={uiLanguage}
                    getApiUrl={getApiUrl}
                    onGenerateFromRSS={(content) => {
                      if (setIsRssBasedGeneration) {
                        setIsRssBasedGeneration(true);
                      }
                      setActiveTab("mission_studio");
                      if (setMissionStudioSubTab) {
                        setMissionStudioSubTab("draft");
                      }
                      if (handleGenerateBriefing) {
                        handleGenerateBriefing(content);
                      }
                    }}
                    isGenerating={isGenerating}
                    onAddToDraft={(text) => {
                      if (setNewsContent) {
                        setNewsContent(prev => typeof prev === "string" ? prev + "\n\n" + text : text);
                      }
                    }}
                  />
                </div>
              )}

              {activeCategory === "templates" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { id: "morning", title: uiLanguage === "vi" ? "Bản tin Sáng sớm" : "Morning Brief", desc: uiLanguage === "vi" ? "Tối ưu cho việc thức dậy và bắt đầu ngày mới." : "Optimized for waking up and starting the day.", icon: Sparkles },
                    { id: "commute", title: uiLanguage === "vi" ? "Đồng hành đi làm" : "Commute Companion", desc: uiLanguage === "vi" ? "Tập trung vào giao thông, thời tiết và tin vắn." : "Focuses on traffic, weather, and headlines.", icon: Radio },
                    { id: "digest", title: uiLanguage === "vi" ? "Tổng kết cuối ngày" : "Evening Digest", desc: uiLanguage === "vi" ? "Phân tích sâu các sự kiện nổi bật trong ngày." : "Deep analysis of the day's highlights.", icon: Moon }
                  ].map((tpl) => (
                    <Card 
                      key={tpl.id} 
                      onClick={() => handleSelectTemplate(tpl.id)}
                      className="p-8 border border-border-subtle bg-surface-subtle/30 hover:border-brand-accent/50 transition-all cursor-pointer group text-center space-y-4"
                    >
                      <div className="w-16 h-16 rounded-3xl bg-surface-bg border border-border-subtle flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <tpl.icon className="w-8 h-8 text-brand-accent" />
                      </div>
                      <h4 className="font-black text-sm text-text-main uppercase tracking-widest">{tpl.title}</h4>
                      <p className="text-[10px] text-text-muted opacity-60 leading-relaxed">{tpl.desc}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full rounded-xl font-black text-[9px] uppercase tracking-widest mt-4 group-hover:bg-brand-accent group-hover:text-white transition-colors"
                      >
                        {uiLanguage === "vi" ? "Sử dụng mẫu" : "Use Template"}
                      </Button>
                    </Card>
                  ))}
                </div>
              )}

              {activeCategory === "archive" && (
                filteredEpisodes.length > 0 ? (
                  <div className="space-y-4">
                    {filteredEpisodes.map((episode) => (
                      <Card key={episode.id} className="p-6 border border-border-subtle bg-surface-subtle/30 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                              <ArchiveIcon className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-black text-sm text-text-main truncate max-w-[200px] sm:max-w-md">{episode.title}</h4>
                              <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">
                                {new Date(episode.pubDate).toLocaleDateString(uiLanguage === "vi" ? "vi-VN" : "en-US")} • {Math.floor(episode.duration / 60)}m {episode.duration % 60}s
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => window.open(episode.audioUrl, "_blank")}
                              className="w-8 h-8 p-0 rounded-xl hover:bg-brand-accent/10 hover:text-brand-accent transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                if (confirm(uiLanguage === "vi" ? "Bạn có chắc chắn muốn xóa tập podcast này khỏi kho lưu trữ?" : "Are you sure you want to delete this podcast episode from the archive?")) {
                                  handleDeletePodcastEpisode(episode.id);
                                }
                              }}
                              className="w-8 h-8 p-0 rounded-xl hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="bg-surface-bg/50 p-3 rounded-xl border border-border-subtle/40">
                          <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                            {episode.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-border-subtle text-text-muted px-2 py-0.5">
                              {uiLanguage === "vi" ? "Đã xuất bản" : "Published"}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter border-brand-accent/20 text-brand-accent px-2 py-0.5 bg-brand-accent/5">
                              {episode.audioUrl.includes("supabase.co") ? "Supabase" : "Local"}
                            </Badge>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              if (onPlayBriefing) {
                                onPlayBriefing({ id: episode.id, audioUrl: episode.audioUrl });
                              } else {
                                window.open(episode.audioUrl, "_blank");
                              }
                            }}
                            className="h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest border-border-subtle text-text-muted hover:text-brand-accent hover:border-brand-accent/20 transition-all flex items-center gap-2"
                          >
                            <Play className="w-3 h-3" />
                            <span>{uiLanguage === "vi" ? "Nghe lại" : "Play Episode"}</span>
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="py-32 text-center space-y-6">
                    <div className="w-20 h-20 bg-surface-subtle/50 rounded-full flex items-center justify-center mx-auto border border-border-subtle">
                      <History className="w-10 h-10 text-text-muted opacity-20" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-black text-text-main uppercase tracking-widest">{uiLanguage === "vi" ? "Kho lưu trữ trống" : "Archive Vault Empty"}</h3>
                      <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider max-w-xs mx-auto">
                        {uiLanguage === "vi" 
                          ? "Hãy xuất bản bản tin của bạn để thấy chúng xuất hiện tại đây." 
                          : "Publish your briefings to see them appear here in the archive."}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </AdaptiveWorkspace>
    </PageTemplate>
  );
}

const Moon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);
