import re

with open("src/components/views/MissionTabView.tsx", "r") as f:
    content = f.read()

voice_tab_replacement = """  const renderVoiceTab = () => (
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
                             fetch(getApiUrl(`/api/tts/preview?voice=${voice}&lang=${uiLanguage === 'vi' ? 'vi' : 'en'}`))
                               .then(res => res.json())
                               .then(data => {
                                 if (data.success && data.audioBase64) {
                                   if (previewAudioRef.current) {
                                     previewAudioRef.current.pause();
                                   }
                                   const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
                                   audio.onended = () => setPreviewPlayingVoice(null);
                                   audio.play();
                                   previewAudioRef.current = audio;
                                   setPreviewPlayingVoice(voice);
                                 }
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
                             if (!musicSynthRef.current) {
                               musicSynthRef.current = new PreviewMusicSynth();
                             }
                             if (previewPlayingMusic === music) {
                               musicSynthRef.current.stop();
                               setPreviewPlayingMusic(null);
                             } else {
                               if (previewPlayingMusic) {
                                 musicSynthRef.current.stop();
                               }
                               musicSynthRef.current.play(music);
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
  );"""

content = re.sub(
    r'  const renderVoiceTab = \(\) => \([\s\S]*?\n  \);',
    voice_tab_replacement,
    content
)

with open("src/components/views/MissionTabView.tsx", "w") as f:
    f.write(content)
