import re

with open("src/components/views/MissionTabView.tsx", "r") as f:
    content = f.read()

source_tab_replacement = """  const renderSourceTab = () => (
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
                         setNewsContent(prev => prev ? prev + "\\n\\n" + data.content : data.content);
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
  );"""

content = re.sub(
    r'  const renderSourceTab = \(\) => \([\s\S]*?\n  \);',
    source_tab_replacement,
    content
)

with open("src/components/views/MissionTabView.tsx", "w") as f:
    f.write(content)
