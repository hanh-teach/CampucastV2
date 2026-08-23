import re

with open("src/components/views/MissionTabView.tsx", "r") as f:
    content = f.read()

source_tab_replacement = """  const renderSourceTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
         <h2 className="text-xl font-black tracking-tight text-text-main">{pt.sourceTitle}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
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
               onAddToDraft={(text) => setNewsContent(prev => prev ? prev + "\\n\\n" + text : text)}
             />
          </div>

          <div className="bg-surface-bg border border-border-subtle rounded-2xl p-6 shadow-sm">
             <TopicSuggestions
                uiLanguage={uiLanguage}
                onSelectTopic={(topic) => {
                  if (setIsRssBasedGeneration) setIsRssBasedGeneration(false);
                  if (handleGenerateScript) handleGenerateScript(`Write a comprehensive summary about ${topic}.`);
                  if (setMissionStudioSubTab) setMissionStudioSubTab("draft");
                }}
                isGenerating={isProcessing}
             />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-bg border border-border-subtle rounded-2xl p-6 shadow-sm flex flex-col h-[calc(100%-1.5rem)]">
             <h3 className="font-black text-sm uppercase tracking-widest mb-4">{uiLanguage === "vi" ? "Hoặc dán văn bản" : "Or paste raw text"}</h3>
             <textarea
               className="flex-1 w-full min-h-[300px] bg-surface-subtle text-text-main placeholder:text-text-muted rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
               placeholder={pt.sourcePlaceholder}
               value={newsContent}
               onChange={(e) => setNewsContent(e.target.value)}
             />
             <div className="flex justify-between items-center pt-4 mt-auto">
                <Button variant="ghost" onClick={btnReset} className="text-status-error hover:bg-status-error/10 uppercase tracking-widest text-[10px] font-black">{pt.clearCta}</Button>
                <Button onClick={() => { if (setIsRssBasedGeneration) setIsRssBasedGeneration(false); if (handleGenerateScript) handleGenerateScript(newsContent); if (setMissionStudioSubTab) setMissionStudioSubTab("draft"); }} disabled={!newsContent.trim() || isProcessing} className="uppercase tracking-widest text-xs font-black px-6" style={{ backgroundColor: colors.interactive, color: colors.onAccent }}>
                  {isProcessing ? "Processing..." : pt.btnNext}
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );"""

content = re.sub(
    r'  const renderSourceTab = \(\) => \([\s\S]*?\n  \);',
    source_tab_replacement,
    content
)

with open("src/components/views/MissionTabView.tsx", "w") as f:
    f.write(content)
