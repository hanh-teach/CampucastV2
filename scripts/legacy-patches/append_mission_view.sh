#!/bin/bash
cat << 'INNER_EOF' >> src/components/views/MissionTabView.tsx

  // --- Reconstructed UI for Mission Studio Subtabs ---
  // Using activeSubTab from App.tsx instead of activeStage

  const renderSourceTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-black tracking-tight text-text-main">{pt.sourceTitle}</h2>
      </div>
      <div className="bg-surface-bg border border-border-subtle rounded-2xl p-6 shadow-sm">
         <textarea
           className="w-full h-48 bg-surface-subtle text-text-main placeholder:text-text-muted rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
           placeholder={pt.sourcePlaceholder}
           value={newsContent}
           onChange={(e) => setNewsContent(e.target.value)}
         />
         <div className="mt-4 flex justify-end">
           <Button onClick={() => setActiveTab("ai_center")} variant="outline" className="text-xs uppercase font-black tracking-widest">{pt.aiSuggest}</Button>
         </div>
      </div>
      <div className="flex justify-between items-center pt-4">
         <Button variant="ghost" onClick={btnReset} className="text-status-error hover:bg-status-error/10 uppercase tracking-widest text-[10px] font-black">{pt.clearCta}</Button>
         <Button onClick={() => { setIsRssBasedGeneration(false); handleGenerateBriefing(newsContent); }} disabled={!newsContent.trim() || isProcessing} className="uppercase tracking-widest text-xs font-black px-6" style={{ backgroundColor: colors.interactive, color: colors.onAccent }}>
           {isProcessing ? "Processing..." : pt.btnNext}
         </Button>
      </div>
    </div>
  );

  const renderDraftEditorTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-black tracking-tight text-text-main">{pt.contentTitle}</h2>
      </div>
      {activePayload ? (
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-surface-bg border border-border-subtle rounded-2xl p-6 shadow-sm">
            <h3 className="font-black text-sm uppercase tracking-widest mb-4">{pt.voiceSelect}</h3>
            <div className="space-y-2">
               {["alloy", "echo", "fable", "onyx", "nova", "shimmer"].map(voice => (
                 <button key={voice} onClick={() => updatePreference('defaultVoice', voice)} className={cn("w-full text-left p-3 rounded-xl border capitalize font-medium transition-all", preferences?.defaultVoice === voice ? "border-brand-accent bg-brand-accent/10 text-brand-accent" : "border-border-subtle text-text-main hover:bg-surface-subtle")}>
                    {voice}
                 </button>
               ))}
            </div>
         </div>
      </div>
      <div className="flex justify-end pt-4">
         <Button onClick={() => handlePublishPodcast("temp_id", false)} disabled={!activePayload || isProcessing} className="uppercase tracking-widest text-xs font-black px-6" style={{ backgroundColor: colors.interactive, color: colors.onAccent }}>
           {isProcessing ? pt.productionLive : pt.btnExecute}
         </Button>
      </div>
    </div>
  );

  const renderPreviewPublishTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-black tracking-tight text-text-main">{pt.publishTitle}</h2>
      </div>
      <div className="bg-surface-bg border border-border-subtle rounded-2xl p-12 text-center shadow-sm">
         <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center bg-brand-accent/20 text-brand-accent mb-6">
            <Mic className="w-10 h-10" />
         </div>
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
      case "research": return <div className="p-12 text-center text-text-muted bg-surface-bg rounded-2xl">Research Module not implemented yet.</div>;
      case "draft":
      case "editor": return renderDraftEditorTab();
      case "voice": return renderVoiceTab();
      case "preview":
      case "publish": return renderPreviewPublishTab();
      case "history": return <div className="p-12 text-center text-text-muted bg-surface-bg rounded-2xl">History Module belongs in Library.</div>;
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
INNER_EOF
