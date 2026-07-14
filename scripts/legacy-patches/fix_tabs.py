import re

with open("src/components/views/AssetsTabView.tsx", "r") as f:
    content = f.read()

start_marker = '            <div className="space-y-4">'
end_marker = '            </div>\n          </div>\n        </div>\n      </AdaptiveWorkspace>'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

replacement = """            <div className="space-y-4">
              {activeCategory === "missions" && (
                filteredBriefings.length > 0 ? (
                  filteredBriefings.map((brief) => (
                    <Card
                      key={brief.id}
                      onClick={() => setSelectedBriefingId(brief.id)}
                      className={cn(
                        "p-6 transition-all cursor-pointer flex justify-between items-center group",
                        selectedBriefingId === brief.id 
                          ? "border-2 border-brand-accent bg-brand-accent/[0.02]" 
                          : "border border-border-subtle hover:border-text-muted/20 bg-surface-subtle/20"
                      )}
                    >
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
                        <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.interactive }}>{uiLanguage === "vi" ? "Xem văn bản" : "View Text"}</Button>
                      </div>
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
                      if (handleGenerateBriefing) {
                        handleGenerateBriefing(content);
                      }
                      setActiveTab("mission_studio");
                    }}
                    isGenerating={false}
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
                    <Card key={tpl.id} className="p-8 border border-border-subtle bg-surface-subtle/30 hover:border-brand-accent/50 transition-all cursor-pointer group text-center space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-surface-bg border border-border-subtle flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <tpl.icon className="w-8 h-8 text-brand-accent" />
                      </div>
                      <h4 className="font-black text-sm text-text-main uppercase tracking-widest">{tpl.title}</h4>
                      <p className="text-[10px] text-text-muted opacity-60 leading-relaxed">{tpl.desc}</p>
                      <Button variant="outline" size="sm" className="w-full rounded-xl font-black text-[9px] uppercase tracking-widest mt-4">{uiLanguage === "vi" ? "Sử dụng mẫu" : "Use Template"}</Button>
                    </Card>
                  ))}
                </div>
              )}

              {activeCategory === "archive" && (
                <div className="py-32 text-center space-y-6">
                  <div className="w-20 h-20 bg-surface-subtle/50 rounded-full flex items-center justify-center mx-auto border border-border-subtle">
                    <History className="w-10 h-10 text-text-muted opacity-20" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-black text-text-main uppercase tracking-widest">{uiLanguage === "vi" ? "Kho lưu trữ trống" : "Archive Vault Empty"}</h3>
                    <p className="text-[10px] text-text-muted font-medium uppercase tracking-wider max-w-xs mx-auto">{uiLanguage === "vi" ? "Các mục cũ hơn 30 ngày sẽ tự động được lưu trữ tại đây. Hiện chưa có mục nào." : "Items older than 30 days are automatically archived here. No objects found currently."}</p>
                  </div>
                </div>
              )}
"""

new_content = content[:start_idx] + replacement + content[end_idx:]

with open("src/components/views/AssetsTabView.tsx", "w") as f:
    f.write(new_content)

