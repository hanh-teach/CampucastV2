import re

with open("src/components/views/AssetsTabView.tsx", "r") as f:
    content = f.read()

old_block = """                      <div className="space-y-2 text-left min-w-0 flex-1 pr-6">
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(t.deleteConfirm)) {
                              deleteOneBriefing(brief.id).then(() => handleRefresh());
                            }
                          }}
                          className="p-3 hover:bg-[var(--color-critical)]/10 text-text-muted hover:text-[var(--color-critical)] rounded-xl transition-colors border border-transparent hover:border-[var(--color-critical)]/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>"""

new_block = """                      <div className="w-full space-y-4">
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
                      </div>"""

content = content.replace(old_block, new_block)

# Replace flex direction on the card for missions
content = content.replace(
    '"p-6 transition-all cursor-pointer flex justify-between items-center group"',
    '"p-6 transition-all cursor-pointer flex flex-col justify-between items-center group"'
)

with open("src/components/views/AssetsTabView.tsx", "w") as f:
    f.write(content)

