import React, { useState } from 'react';
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { Layers, FileText, Play, Pause, Edit3, Download, Archive as ArchiveIcon, RefreshCw, Trash2, Clock, Eye, X } from "lucide-react";
import { colors } from "../../foundation/tokens/colors";
import { exportBriefingAsWav } from "../../utils/audioExport";

export const getSingleTagColor = (tag: string) => {
  const tagLower = tag.toLowerCase();
  if (tagLower === "tech") {
    return {
      textClass: "text-cyan-600 dark:text-cyan-400",
      bgClass: "bg-cyan-500/10 dark:bg-cyan-500/20",
      borderClass: "border-cyan-500/20",
      hex: "#06b6d4"
    };
  } else if (tagLower === "politics") {
    return {
      textClass: "text-rose-600 dark:text-rose-400",
      bgClass: "bg-rose-500/10 dark:bg-rose-500/20",
      borderClass: "border-rose-500/20",
      hex: "#f43f5e"
    };
  } else if (tagLower === "environment") {
    return {
      textClass: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
      borderClass: "border-emerald-500/20",
      hex: "#10b981"
    };
  }

  // Pick deterministic color based on hash for other tags
  const palettes = [
    { textClass: "text-orange-600 dark:text-orange-400", bgClass: "bg-orange-500/10 dark:bg-orange-500/20", hex: "#f97316" },
    { textClass: "text-amber-600 dark:text-amber-400", bgClass: "bg-amber-500/10 dark:bg-amber-500/20", hex: "#f59e0b" },
    { textClass: "text-violet-600 dark:text-violet-400", bgClass: "bg-violet-500/10 dark:bg-violet-500/20", hex: "#8b5cf6" },
    { textClass: "text-fuchsia-600 dark:text-fuchsia-400", bgClass: "bg-fuchsia-500/10 dark:bg-fuchsia-500/20", hex: "#d946ef" },
    { textClass: "text-blue-600 dark:text-blue-400", bgClass: "bg-blue-500/10 dark:bg-blue-500/20", hex: "#3b82f6" },
  ];

  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
};

export const getBriefingAccent = (tags?: string[]) => {
  if (!tags || tags.length === 0) {
    return {
      hex: "#6366f1", // brand accent default
      selectedBorder: "border-brand-accent",
      selectedBg: "bg-brand-accent/[0.02]",
      hoverBorder: "hover:border-brand-accent/30",
      badgeText: "text-brand-accent",
      badgeBg: "bg-brand-accent/10",
      textColor: "text-brand-accent",
      textThemeClass: "text-indigo-500",
      bgThemeClass: "bg-indigo-500",
      bgHoverThemeClass: "hover:bg-indigo-600",
      previewBtnHover: "hover:bg-brand-accent/10 hover:text-brand-accent",
    };
  }

  const primaryTag = tags[0];
  const tagLower = primaryTag.toLowerCase();

  if (tagLower === "tech") {
    return {
      hex: "#06b6d4",
      selectedBorder: "border-cyan-500",
      selectedBg: "bg-cyan-500/[0.02]",
      hoverBorder: "hover:border-cyan-500/30",
      badgeText: "text-cyan-500",
      badgeBg: "bg-cyan-500/10",
      textColor: "text-cyan-500",
      textThemeClass: "text-cyan-500",
      bgThemeClass: "bg-cyan-500",
      bgHoverThemeClass: "hover:bg-cyan-600",
      previewBtnHover: "hover:bg-cyan-500/10 hover:text-cyan-500",
    };
  } else if (tagLower === "politics") {
    return {
      hex: "#f43f5e",
      selectedBorder: "border-rose-500",
      selectedBg: "bg-rose-500/[0.02]",
      hoverBorder: "hover:border-rose-500/30",
      badgeText: "text-rose-500",
      badgeBg: "bg-rose-500/10",
      textColor: "text-rose-500",
      textThemeClass: "text-rose-500",
      bgThemeClass: "bg-rose-500",
      bgHoverThemeClass: "hover:bg-rose-600",
      previewBtnHover: "hover:bg-rose-500/10 hover:text-rose-500",
    };
  } else if (tagLower === "environment") {
    return {
      hex: "#10b981",
      selectedBorder: "border-emerald-500",
      selectedBg: "bg-emerald-500/[0.02]",
      hoverBorder: "hover:border-emerald-500/30",
      badgeText: "text-emerald-500",
      badgeBg: "bg-emerald-500/10",
      textColor: "text-emerald-500",
      textThemeClass: "text-emerald-500",
      bgThemeClass: "bg-emerald-500",
      bgHoverThemeClass: "hover:bg-emerald-600",
      previewBtnHover: "hover:bg-emerald-500/10 hover:text-emerald-500",
    };
  }

  // Hash code for custom tag palette match
  const palettes = [
    { hex: "#f97316", selectedBorder: "border-orange-500", selectedBg: "bg-orange-500/[0.02]", hoverBorder: "hover:border-orange-500/30", textThemeClass: "text-orange-500", bgThemeClass: "bg-orange-500", bgHoverThemeClass: "hover:bg-orange-600", previewBtnHover: "hover:bg-orange-500/10 hover:text-orange-500" },
    { hex: "#f59e0b", selectedBorder: "border-amber-500", selectedBg: "bg-amber-500/[0.02]", hoverBorder: "hover:border-amber-500/30", textThemeClass: "text-amber-500", bgThemeClass: "bg-amber-500", bgHoverThemeClass: "hover:bg-amber-600", previewBtnHover: "hover:bg-amber-500/10 hover:text-amber-500" },
    { hex: "#8b5cf6", selectedBorder: "border-violet-500", selectedBg: "bg-violet-500/[0.02]", hoverBorder: "hover:border-violet-500/30", textThemeClass: "text-violet-500", bgThemeClass: "bg-violet-500", bgHoverThemeClass: "hover:bg-violet-600", previewBtnHover: "hover:bg-violet-500/10 hover:text-violet-500" },
    { hex: "#d946ef", selectedBorder: "border-fuchsia-500", selectedBg: "bg-fuchsia-500/[0.02]", hoverBorder: "hover:border-fuchsia-500/30", textThemeClass: "text-fuchsia-500", bgThemeClass: "bg-fuchsia-500", bgHoverThemeClass: "hover:bg-fuchsia-600", previewBtnHover: "hover:bg-fuchsia-500/10 hover:text-fuchsia-500" },
    { hex: "#3b82f6", selectedBorder: "border-blue-500", selectedBg: "bg-blue-500/[0.02]", hoverBorder: "hover:border-blue-500/30", textThemeClass: "text-blue-500", bgThemeClass: "bg-blue-500", bgHoverThemeClass: "hover:bg-blue-600", previewBtnHover: "hover:bg-blue-500/10 hover:text-blue-500" },
  ];

  let hash = 0;
  for (let i = 0; i < primaryTag.length; i++) {
    hash = primaryTag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palettes.length;
  return {
    ...palettes[index],
    badgeText: palettes[index].textThemeClass,
    badgeBg: palettes[index].bgThemeClass + "/10",
    textColor: palettes[index].textThemeClass,
  };
};

export const BriefingItem = ({ 
  brief, 
  isSelected, 
  onSelect, 
  onPlay, 
  isPlayerPlaying, 
  uiLanguage, 
  deleteOneBriefing,
  archiveBriefing,
  handleApplyIntelligenceBriefing,
  handleRefresh,
  showToast,
  getFullBriefing,
  updateBriefingTags
}: any) => {

  const [isArchiving, setIsArchiving] = useState(false);
  const [optimisticArchived, setOptimisticArchived] = useState<boolean | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const currentIsArchived = optimisticArchived !== null ? optimisticArchived : !!brief.isArchived;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;

    if (window.confirm(uiLanguage === "vi" ? "Bạn có chắc chắn muốn xóa bản tin này?" : "Are you sure you want to delete this briefing?")) {
      setIsDeleting(true);
      try {
        await deleteOneBriefing(brief.id);
        showToast(uiLanguage === "vi" ? "Đã xóa bản tin." : "Briefing deleted.", "success");
      } catch (err) {
        setIsDeleting(false);
        showToast(uiLanguage === "vi" ? "Lỗi khi xóa bản tin." : "Failed to delete briefing.", "error");
      }
    }
  };

  const handleDownloadAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    let audioData = brief.audioChunks;
    
    // Nếu chưa có audioChunks, thử lấy toàn bộ briefing
    if (!audioData || audioData.length === 0) {
       try {
         const fullBriefing = await getFullBriefing(brief.id);
         if (fullBriefing && fullBriefing.audioChunks) {
           audioData = fullBriefing.audioChunks;
         }
       } catch (err) {
         console.error("Failed to fetch full briefing:", err);
       }
    }

    if (!audioData || audioData.length === 0) {
      showToast(uiLanguage === "vi" ? "Chưa có audio để tải." : "No audio available to download.", "error");
      return;
    }
    
    try {
      showToast(uiLanguage === "vi" ? "Đang chuẩn bị file WAV..." : "Preparing WAV file...", "loading");
      
      await exportBriefingAsWav(audioData, brief.payload?.title || "Briefing");
      showToast(uiLanguage === "vi" ? "Đã tải xuống thành công" : "Downloaded successfully", "success");
    } catch (err) {
      console.error("Export audio error:", err);
      showToast(uiLanguage === "vi" ? "Lỗi tải xuống" : "Failed to download audio", "error");
    }
  };

  const handleExportTranscript = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const payload = brief.payload || {};
      const title = payload.title || "Untitled Briefing";
      const introduction = payload.introduction || "";
      const conclusion = payload.conclusion || "";
      const chapters = payload.chapters || [];
      const tagsString = brief.tags && brief.tags.length > 0 ? brief.tags.join(", ") : "None";

      let content = `# ${title}\n\n`;
      content += `**Tags**: ${tagsString}\n\n`;

      if (introduction) {
        content += `## Introduction\n${introduction}\n\n`;
      }

      if (chapters.length > 0) {
        content += `## Chapters Summary\n\n`;
        chapters.forEach((ch: any, idx: number) => {
          content += `### ${idx + 1}. ${ch.topic || "Untitled Chapter"}\n`;
          if (ch.summaryBullets && ch.summaryBullets.length > 0) {
            ch.summaryBullets.forEach((bullet: string) => {
              content += `- ${bullet}\n`;
            });
          } else if (ch.scriptText) {
            content += `${ch.scriptText}\n`;
          }
          content += `\n`;
        });
      }

      if (conclusion) {
        content += `## Conclusion\n${conclusion}\n\n`;
      }

      content += `---\n*Generated by CommuteCast Enterprise*\n`;

      const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const safeFilename = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      link.download = `${safeFilename || "briefing"}-transcript.md`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(uiLanguage === "vi" ? "Đã xuất bản tin thành công." : "Briefing transcript exported successfully.", "success");
    } catch (err) {
      console.error("Export transcript error:", err);
      showToast(uiLanguage === "vi" ? "Lỗi khi xuất bản tin." : "Failed to export briefing transcript.", "error");
    }
  };

  const handleToggleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isArchiving || !archiveBriefing) return;
    
    setIsArchiving(true);
    const newStatus = !currentIsArchived;
    setOptimisticArchived(newStatus); // Optimistic UI update
    
    showToast(uiLanguage === "vi" ? (newStatus ? "Đang lưu trữ..." : "Đang khôi phục...") : (newStatus ? "Archiving..." : "Restoring..."), "loading");
    
    const success = await archiveBriefing(brief.id, newStatus);
    
    if (success) {
      showToast(uiLanguage === "vi" ? (newStatus ? "Đã lưu trữ thành công." : "Đã khôi phục thành công.") : (newStatus ? "Archived successfully." : "Restored successfully."), "success");
      setOptimisticArchived(null); // Clear local override, rely on parent state
    } else {
      setOptimisticArchived(null); // Rollback
      showToast(uiLanguage === "vi" ? "Lỗi khi cập nhật trạng thái." : "Failed to update archive status.", "error");
    }
    setIsArchiving(false);
  };

  const accent = getBriefingAccent(brief.tags);

  return (
    <Card
      key={brief.id}
      onClick={() => onSelect(brief.id)}
      className={cn(
        "p-6 transition-all cursor-pointer flex flex-col justify-between items-center group",
        isSelected 
          ? `border-2 ${accent.selectedBorder} ${accent.selectedBg}` 
          : `border border-border-subtle ${accent.hoverBorder} bg-surface-subtle/20`
      )}
    >
      <div className="w-full space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 text-left min-w-0 flex-1 pr-6">
            {brief.tags && brief.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                {brief.tags.map((tag: string) => {
                  const tagCol = getSingleTagColor(tag);
                  return (
                    <span 
                      key={tag} 
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border shadow-xs transition-all", 
                        tagCol.bgClass, 
                        tagCol.textClass, 
                        (tagCol as any).borderClass || "border-transparent"
                      )}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-bg flex items-center justify-center border border-border-subtle group-hover:scale-110 transition-transform overflow-hidden" style={{ color: accent.hex }}>
                  {brief.artworkUrl ? (
                    <img src={brief.artworkUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <Layers className="w-4 h-4" />
                  )}
                </div>
                <h4 className="font-black text-base text-text-main truncate tracking-tight">{brief.payload.title}</h4>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[10px] text-text-muted font-black uppercase tracking-widest opacity-60">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {brief.timestamp}</span>
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {brief.payload.chapters.length} Chapters</span>
              <span className="px-2 py-0.5 rounded bg-surface-bg border border-border-subtle text-[8px]">{brief.preferences?.languageMode || "BILINGUAL"}</span>
            </div>
          </div>
              
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setShowPreviewModal(true);
              }}
              className={cn("font-black text-[10px] uppercase tracking-widest h-10 px-3.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-border-subtle", accent.previewBtnHover)}
              style={{ color: colors.textPrimary }}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{uiLanguage === "vi" ? "Xem nhanh" : "Preview"}</span>
            </Button>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                onPlay(brief);
              }}
              className="font-black text-[10px] uppercase tracking-widest h-10 px-4 rounded-xl flex items-center gap-2 transition-all cursor-pointer hover:opacity-90"
              style={{ backgroundColor: accent.hex, color: colors.surface }}
            >
              {isPlayerPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isPlayerPlaying ? (uiLanguage === "vi" ? "Tạm dừng" : "Pause") : (uiLanguage === "vi" ? "Phát" : "Play")}</span>
            </Button>
          </div>
        </div>

         {isSelected && (
          <div className="flex items-center gap-2 pt-4 border-t border-border-subtle/50 overflow-x-auto custom-scrollbar pb-1">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleApplyIntelligenceBriefing(brief); }} className={cn("h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-opacity-10", `hover:${accent.textColor} hover:${accent.badgeBg}`)}>
              <Edit3 className="w-3 h-3 mr-1.5" /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownloadAudio} className={cn("h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-opacity-10", `hover:${accent.textColor} hover:${accent.badgeBg}`)}>
              <Download className="w-3 h-3 mr-1.5" /> Download
            </Button>
            <Button id={`export-transcript-btn-${brief.id}`} variant="ghost" size="sm" onClick={handleExportTranscript} className={cn("h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-opacity-10", `hover:${accent.textColor} hover:${accent.badgeBg}`)}>
              <FileText className="w-3 h-3 mr-1.5" /> Export
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToggleArchive} disabled={isArchiving} className={cn("h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted hover:bg-opacity-10", `hover:${accent.textColor} hover:${accent.badgeBg}`)}>
              {currentIsArchived ? (
                <><RefreshCw className={cn("w-3 h-3 mr-1.5", isArchiving && "animate-spin")} /> Restore</>
              ) : (
                <><ArchiveIcon className="w-3 h-3 mr-1.5" /> Archive</>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isDeleting} className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-critical/60 hover:text-critical hover:bg-critical/10 ml-auto">
              <Trash2 className={cn("w-3 h-3 mr-1.5", isDeleting && "animate-pulse")} /> Delete
            </Button>
          </div>
        )}

        {/* Tag Manager Section */}
        {isSelected && updateBriefingTags && (
          <div className="pt-3.5 mt-3 border-t border-border-subtle/50 flex flex-wrap items-center gap-2 text-left w-full">
              <span className="text-[9px] font-black uppercase tracking-widest text-text-muted shrink-0 mr-1">
                {uiLanguage === "vi" ? "Nhãn :" : "Tags :"}
              </span>
              
              {/* Active Tags */}
              {brief.tags && brief.tags.map((tag: string) => {
                const tagCol = getSingleTagColor(tag);
                return (
                  <span key={tag} className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1", tagCol.bgClass, tagCol.textClass)}>
                    <span>{tag}</span>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newTags = brief.tags.filter((t: string) => t !== tag);
                        updateBriefingTags(brief.id, newTags);
                      }}
                      className={cn("hover:opacity-85 ml-0.5 focus:outline-none text-[11px] font-bold cursor-pointer", tagCol.textClass)}
                      title={uiLanguage === "vi" ? "Xóa nhãn" : "Remove tag"}
                    >
                      ×
                    </button>
                  </span>
                );
              })}

              {/* Suggestions */}
              {(!brief.tags || !brief.tags.includes('Tech')) && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newTags = [...(brief.tags || []), 'Tech'];
                    updateBriefingTags(brief.id, newTags);
                  }}
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-dashed border-border-subtle/60 text-text-muted hover:border-cyan-500/50 hover:text-cyan-500 transition cursor-pointer"
                >
                  + Tech
                </button>
              )}
              {(!brief.tags || !brief.tags.includes('Politics')) && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newTags = [...(brief.tags || []), 'Politics'];
                    updateBriefingTags(brief.id, newTags);
                  }}
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-dashed border-border-subtle/60 text-text-muted hover:border-rose-500/50 hover:text-rose-500 transition cursor-pointer"
                >
                  + Politics
                </button>
              )}
              {(!brief.tags || !brief.tags.includes('Environment')) && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newTags = [...(brief.tags || []), 'Environment'];
                    updateBriefingTags(brief.id, newTags);
                  }}
                  className="px-2 py-0.5 rounded-full text-[9px] font-bold border border-dashed border-border-subtle/60 text-text-muted hover:border-emerald-500/50 hover:text-emerald-500 transition cursor-pointer"
                >
                  + Environment
                </button>
              )}

              {/* Add custom tag input */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const form = e.currentTarget;
                  const input = form.elements.namedItem('customTag') as HTMLInputElement;
                  const val = input.value.trim();
                  if (val && (!brief.tags || !brief.tags.includes(val))) {
                    const newTags = [...(brief.tags || []), val];
                    updateBriefingTags(brief.id, newTags);
                    input.value = '';
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center"
              >
                <input 
                  type="text" 
                  name="customTag"
                  maxLength={18}
                  placeholder={uiLanguage === 'vi' ? 'Thêm thẻ...' : 'New tag...'}
                  className="px-2 py-0.5 rounded-lg border border-border-subtle/60 text-[10px] w-18 focus:outline-none focus:border-brand-accent/50 focus:ring-0 bg-transparent text-text-main placeholder-text-muted"
                />
              </form>
            </div>
          )}
      </div>

      {/* Quick Summary Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-xs" onClick={(e) => e.stopPropagation()}>
          <div 
            className="w-full max-w-xl rounded-app-2xl shadow-2xl flex flex-col h-[75vh] md:h-[65vh] relative overflow-hidden border text-left"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b flex items-start justify-between gap-4" style={{ borderColor: colors.border }}>
              <div className="space-y-1">
                <span className={cn("text-[10px] font-black uppercase tracking-widest", accent.textThemeClass)}>
                  {uiLanguage === "vi" ? "Xem nhanh bản tin" : "Quick Briefing Preview"}
                </span>
                <h3 className="text-sm md:text-base font-black leading-snug" style={{ color: colors.textPrimary }}>
                  {brief.payload.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-full transition-colors cursor-pointer"
                style={{ color: colors.textMuted }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.critical;
                  e.currentTarget.style.backgroundColor = `${colors.critical}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.textMuted;
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Briefing Summary */}
            <div 
              className="flex-1 overflow-y-auto p-6 space-y-6 text-xs md:text-sm leading-relaxed"
              style={{ color: colors.textPrimary }}
            >
              {/* Introduction */}
              {brief.payload.introduction && (
                <div className="space-y-1.5">
                  <h4 className={cn("text-[10px] font-black uppercase tracking-wider", accent.textThemeClass)}>
                    {uiLanguage === "vi" ? "Lời mở đầu" : "Introduction"}
                  </h4>
                  <p className="font-medium text-app-text-muted italic">
                    "{brief.payload.introduction}"
                  </p>
                </div>
              )}

              {/* Chapters */}
              <div className="space-y-4">
                <h4 className={cn("text-[10px] font-black uppercase tracking-wider", accent.textThemeClass)}>
                  {uiLanguage === "vi" ? "Tóm tắt các chương tin" : "Chapters Summary"}
                </h4>
                <div className="space-y-3">
                  {brief.payload.chapters && brief.payload.chapters.map((ch: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="p-3 border rounded-xl space-y-1.5"
                      style={{ backgroundColor: `${colors.surface}40`, borderColor: colors.border }}
                    >
                      <h5 className="font-bold text-xs flex items-center gap-2">
                        <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono", accent.textThemeClass)} style={{ backgroundColor: `${accent.hex}15` }}>
                          {idx + 1}
                        </span>
                        <span>{ch.topic}</span>
                      </h5>
                      {ch.summaryBullets && ch.summaryBullets.length > 0 ? (
                        <ul className="list-disc list-inside pl-1 text-[11px] text-app-text-muted font-medium space-y-1">
                          {ch.summaryBullets.map((bullet: string, bIdx: number) => (
                            <li key={bIdx}>{bullet}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-app-text-muted font-medium line-clamp-2">
                          {ch.scriptText}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Conclusion */}
              {brief.payload.conclusion && (
                <div className="space-y-1.5 border-t pt-4" style={{ borderColor: colors.border }}>
                  <h4 className={cn("text-[10px] font-black uppercase tracking-wider", accent.textThemeClass)}>
                    {uiLanguage === "vi" ? "Lời kết" : "Conclusion"}
                  </h4>
                  <p className="font-medium text-app-text-muted italic">
                    "{brief.payload.conclusion}"
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex items-center justify-between text-[10px] font-black uppercase tracking-wider" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
              <span className="text-app-text-muted">
                {brief.payload.chapters?.length || 0} {uiLanguage === "vi" ? "Chương" : "Chapters"} • {brief.timestamp}
              </span>
              <Button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  onPlay(brief);
                }}
                className={cn("h-8 px-4 rounded-lg flex items-center gap-1 text-white cursor-pointer font-black text-[9px]", accent.bgThemeClass, accent.bgHoverThemeClass)}
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>{uiLanguage === "vi" ? "Phát Bản Tin" : "Play Briefing"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
