import React, { useState } from 'react';
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { Layers, FileText, Play, Pause, Edit3, Download, Archive as ArchiveIcon, RefreshCw, Trash2, Clock } from "lucide-react";
import { colors } from "../../foundation/tokens/colors";

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
  getFullBriefing
}: any) => {

  const [isArchiving, setIsArchiving] = useState(false);
  const [optimisticArchived, setOptimisticArchived] = useState<boolean | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const { exportBriefingAsWav } = await import("../../utils/audioExport");
      await exportBriefingAsWav(audioData, brief.payload?.title || "Briefing");
      showToast(uiLanguage === "vi" ? "Đã tải xuống thành công" : "Downloaded successfully", "success");
    } catch (err) {
      console.error("Export audio error:", err);
      showToast(uiLanguage === "vi" ? "Lỗi tải xuống" : "Failed to download audio", "error");
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

  return (
    <Card
      key={brief.id}
      onClick={() => onSelect(brief.id)}
      className={cn(
        "p-6 transition-all cursor-pointer flex flex-col justify-between items-center group",
        isSelected 
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
                onPlay(brief);
              }}
              className="font-black text-[10px] uppercase tracking-widest h-10 px-4 rounded-xl flex items-center gap-2 hover:bg-brand-accent hover:text-on-accent transition-all"
              style={{ backgroundColor: colors.textPrimary, color: colors.surface }}
            >
              {isPlayerPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isPlayerPlaying ? (uiLanguage === "vi" ? "Tạm dừng" : "Pause") : (uiLanguage === "vi" ? "Phát" : "Play")}</span>
            </Button>
          </div>
        </div>

        {isSelected && (
          <div className="flex items-center gap-2 pt-4 border-t border-border-subtle/50 overflow-x-auto custom-scrollbar pb-1">
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleApplyIntelligenceBriefing(brief); }} className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-accent hover:bg-brand-accent/10">
              <Edit3 className="w-3 h-3 mr-1.5" /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownloadAudio} className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-accent hover:bg-brand-accent/10">
              <Download className="w-3 h-3 mr-1.5" /> Download
            </Button>
            <Button variant="ghost" size="sm" onClick={handleToggleArchive} disabled={isArchiving} className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-brand-accent hover:bg-brand-accent/10">
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
      </div>
    </Card>
  );
};
