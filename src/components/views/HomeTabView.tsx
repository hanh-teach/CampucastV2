import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Play, 
  ArrowRight, 
  Newspaper, 
  Mic, 
  History,
  Activity,
  ShieldCheck,
  LayoutDashboard,
  Radio,
  Clock,
  Compass,
  Terminal
} from "lucide-react";
import { SavedSummary, TabType, CommuteIntentProfile, CommuteIntentId, COMMUTE_INTENT_PROFILES } from "../../types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { PageTemplate } from "../../foundation/PageTemplate";
import { AdaptiveGrid } from "../../foundation/AdaptiveGrid";
import { colors } from "../../foundation/tokens/colors";
import { useVoiceInteraction } from "../../hooks/useVoiceInteraction";
import { IntentSelector } from "../IntentSelector";
import { SpeechDiagnosticsModal } from "../SpeechDiagnosticsModal";
import { SpeechDiagnosticsPanel } from "../SpeechDiagnosticsPanel";

interface HomeViewProps {
  uiLanguage: "vi" | "en";
  setActiveTab: (tab: TabType) => void;
  newsContent: string;
  savedBriefings: SavedSummary[];
  onPlayBriefing: (briefing: SavedSummary) => void;
  activePayload: any;
  step: string;
  activeTitle: string;
  onLaunchIntentProfile?: (profile: CommuteIntentProfile) => void;
}

export default function HomeTabView({
  uiLanguage,
  setActiveTab,
  newsContent,
  savedBriefings,
  onPlayBriefing,
  step,
  activeTitle,
  onLaunchIntentProfile
}: HomeViewProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [selectedIntentId, setSelectedIntentId] = useState<CommuteIntentId>("commute");
  const [showSpeechDiagnostics, setShowSpeechDiagnostics] = useState(false);
  const { state: voiceState, error: voiceError, startListening, stopListening } = useVoiceInteraction();

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString(uiLanguage === "vi" ? "vi-VN" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
      const dateStr = now.toLocaleDateString(uiLanguage === "vi" ? "vi-VN" : "en-US", {
        weekday: "long",
        day: "numeric",
        month: "long"
      });
      setCurrentTime(timeStr);
      setCurrentDate(dateStr);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, [uiLanguage]);

  const recentBriefings = savedBriefings.slice(0, 3);
  const isProductionActive = step === "summarizing" || step === "synthesizing" || step === "voiceStaging";

  const pt = {
    vi: {
      deskTitle: "Bàn Điều Hành Hành Trình",
      createCta: "Sản Xuất Bản Tin",
      missionIdle: "Trợ Lý Giọng Nói Sẵn Sàng",
      continueMission: "Tiếp Tục Bản Tin",
      allOk: "Hoạt động tốt",
      viewAll: "Xem tất cả",
      activeTitle: activeTitle || "Bản tin đang xử lý",
      productionDesc: "Hệ thống đang xử lý dữ liệu và chuyển đổi âm thanh 24kHz.",
      rssStatus: "Nguồn Tin RSS",
      cloudStatus: "Lưu Trữ Đám Mây",
      voiceStatus: "Công Cụ Giọng Đọc Gemini",
      quickStartTitle: "Phát Nhanh Hành Trình",
      recentTitle: "Bản Tin Gần Đây"
    },
    en: {
      deskTitle: "Commute Operator Desk",
      createCta: "Produce Briefing",
      missionIdle: "Voice Assistant Ready",
      continueMission: "Continue Briefing",
      allOk: "Healthy",
      viewAll: "View All",
      activeTitle: activeTitle || "Briefing in Progress",
      productionDesc: "System is processing data and synthesizing 24kHz audio streams.",
      rssStatus: "RSS Connectors",
      cloudStatus: "Cloud Infrastructure",
      voiceStatus: "Gemini Voice Engines",
      quickStartTitle: "Quick Commute Start",
      recentTitle: "Recent Briefings"
    }
  }[uiLanguage];

  const handleLaunchProfile = (profile: CommuteIntentProfile) => {
    if (onLaunchIntentProfile) {
      onLaunchIntentProfile(profile);
    } else {
      setActiveTab("mission_studio");
    }
  };

  return (
    <PageTemplate
      id="home-view-root"
      className="bg-surface-bg text-left animate-fade-in flex flex-col flex-1"
      header={
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: colors.surfaceRaised, color: colors.interactive }}
            >
               <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-text-main uppercase tracking-tight">{pt.deskTitle}</h1>
              <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest mt-0.5 opacity-60">{currentDate} • {currentTime}</p>
            </div>
          </div>
          
          <Button 
            onClick={() => setActiveTab("mission_studio")}
            className="h-11 px-6 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-brand-accent/20"
            style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
          >
            <Sparkles className="w-3.5 h-3.5 mr-2" style={{ color: colors.onAccent }} />
            <span>{pt.createCta}</span>
          </Button>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto flex flex-col gap-8 py-8 px-4 lg:px-8" id="home-view-container">
        
        {/* SECTION 1: INTENT-FIRST 1-TOUCH PROFILES */}
        <section className="space-y-3">
          <IntentSelector
            selectedIntentId={selectedIntentId}
            onSelectIntent={(p) => setSelectedIntentId(p.id)}
            onLaunchIntent={handleLaunchProfile}
            uiLanguage={uiLanguage}
            isGenerating={isProductionActive}
          />
        </section>

        {/* SECTION 2: ACTIVE MISSION & SYSTEM RADAR */}
        <AdaptiveGrid cols={{ compact: 1, regular: 3, expanded: 3 }} className="gap-6">
          
          {/* WIDGET 1: VOICE / ACTIVE STATUS CARD (LEFT 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <section className="space-y-3">
               <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1 opacity-50">
                 {uiLanguage === "vi" ? "Trợ Lý Giọng Nói & Trạng Thái" : "Voice Assistant & Live State"}
               </h2>

               <Card className={cn(
                 "p-6 sm:p-8 transition-all duration-500 relative group rounded-3xl",
                 isProductionActive 
                  ? "border-2 border-brand-accent/30 bg-surface-bg shadow-2xl" 
                  : "border border-border-subtle bg-surface-subtle"
               )}>
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-5">
                      <div 
                        className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner cursor-pointer shrink-0",
                          ['listening', 'speech_detected', 'streaming'].includes(voiceState) ? "bg-red-500 animate-pulse" : "",
                          voiceState === 'speaking' ? "bg-green-500 animate-bounce" : "",
                          ['connecting', 'thinking', 'reconnect', 'interrupted'].includes(voiceState) ? "bg-amber-500 animate-pulse" : ""
                        )}
                        style={voiceState === 'idle' && !isProductionActive 
                          ? { backgroundColor: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}` }
                          : { backgroundColor: colors.interactive, color: colors.onAccent }
                        }
                        onClick={voiceState === 'idle' || voiceState === 'error' ? startListening : stopListening}
                        title={uiLanguage === "vi" ? "Nhấn để ra lệnh giọng nói" : "Tap to speak voice command"}
                      >
                        <Mic className="w-8 h-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "text-xl sm:text-2xl font-black tracking-tight truncate",
                          isProductionActive ? "text-text-main" : "text-text-main"
                        )}>
                          {isProductionActive ? pt.activeTitle : pt.missionIdle}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {voiceState === 'error' && voiceError ? (
                            <div className="flex flex-col gap-1">
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 self-start">
                                Error
                              </span>
                              <p className="text-[11px] text-red-400 font-medium leading-relaxed">
                                {voiceError}
                              </p>
                            </div>
                          ) : (
                            <>
                              <span 
                                className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest"
                                style={isProductionActive 
                                  ? { backgroundColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)", color: colors.interactive } 
                                  : { backgroundColor: colors.border, color: colors.textMuted }
                                }
                              >
                                {(() => {
                                  switch (voiceState) {
                                    case 'connecting': return uiLanguage === 'vi' ? 'Đang kết nối' : 'Connecting';
                                    case 'listening': return uiLanguage === 'vi' ? 'Đang nghe' : 'Listening';
                                    case 'speech_detected': return uiLanguage === 'vi' ? 'Phát hiện giọng' : 'Speech Detected';
                                    case 'streaming': return uiLanguage === 'vi' ? 'Đang truyền' : 'Streaming';
                                    case 'thinking': return uiLanguage === 'vi' ? 'Đang xử lý' : 'Processing';
                                    case 'speaking': return uiLanguage === 'vi' ? 'Đang nói' : 'Speaking';
                                    case 'interrupted': return uiLanguage === 'vi' ? 'Ngắt quãng' : 'Interrupted';
                                    case 'reconnect': return uiLanguage === 'vi' ? 'Thử lại' : 'Retrying';
                                    default: return isProductionActive ? "Processing" : "Standby";
                                  }
                                })()}
                              </span>
                              <p className="text-[11px] text-text-muted font-medium opacity-75 truncate">
                                {(() => {
                                  switch (voiceState) {
                                    case 'connecting': return uiLanguage === 'vi' ? 'Đang kết nối đến máy chủ âm thanh...' : 'Connecting to voice server...';
                                    case 'listening': return uiLanguage === 'vi' ? 'Sẵn sàng! Hãy nói yêu cầu của bạn...' : 'Ready! Speak now...';
                                    case 'speech_detected': return uiLanguage === 'vi' ? 'Đã nhận diện giọng nói...' : 'Speech detected...';
                                    case 'streaming': return uiLanguage === 'vi' ? 'Đang truyền dữ liệu âm thanh...' : 'Streaming voice audio...';
                                    case 'thinking': return uiLanguage === 'vi' ? 'Đang tạo câu trả lời...' : 'Synthesizing response...';
                                    case 'speaking': return uiLanguage === 'vi' ? 'Đang phát phản hồi...' : 'Speaking reply...';
                                    case 'interrupted': return uiLanguage === 'vi' ? 'Đã dừng theo lệnh.' : 'Paused by command.';
                                    default: return isProductionActive ? pt.productionDesc : (uiLanguage === 'vi' ? 'Chạm micro để ra lệnh hoặc chọn chế độ bên trên để nghe ngay.' : 'Tap mic to dictate or choose a commute mode above to listen.');
                                  }
                                })()}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button 
                        onClick={() => setActiveTab("mission_studio")}
                        className={cn(
                          "h-11 px-6 font-black uppercase text-xs tracking-wider transition-all rounded-xl shadow-md"
                        )}
                        style={isProductionActive 
                          ? { backgroundColor: colors.textPrimary, color: colors.surface } 
                          : { backgroundColor: colors.surface, color: colors.textPrimary, border: `1px solid ${colors.border}` }
                        }
                      >
                        <span>{isProductionActive ? pt.continueMission : pt.createCta}</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
               </Card>
            </section>

            {/* WIDGET 2: RECENT PRODUCTION HISTORY */}
            {recentBriefings.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-50">
                    {pt.recentTitle}
                  </h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveTab("library")}
                    className="text-[10px] uppercase font-black tracking-widest"
                    style={{ color: colors.interactive }}
                  >
                    {pt.viewAll}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {recentBriefings.map((briefing) => (
                    <Card 
                      key={briefing.id}
                      onClick={() => onPlayBriefing(briefing)}
                      className="p-4 sm:p-5 border border-border-subtle bg-surface-subtle/40 hover:bg-surface-bg hover:border-brand-accent/30 flex items-center justify-between group transition-all rounded-2xl cursor-pointer"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-surface-bg border border-border-subtle flex items-center justify-center text-text-muted group-hover:text-brand-accent transition-colors shrink-0">
                          <Play className="w-4 h-4 fill-current" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-text-main truncate">
                            {briefing.payload?.title || "Untitled"}
                          </h4>
                          <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest mt-0.5 opacity-60">
                            {new Date(briefing.timestamp).toLocaleDateString()} • {briefing.preferences?.voice || "Dual-Host Engine"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                         <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                           READY
                         </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* WIDGET 3: SYSTEM INFRASTRUCTURE STATUS (RIGHT 1/3) */}
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1 opacity-50">
                {uiLanguage === "vi" ? "Hạ Tầng Âm Thanh & AI" : "Audio & AI Engine Status"}
              </h2>
              <Card className="p-6 border border-border-subtle bg-surface-subtle space-y-5 rounded-3xl">
                <div className="space-y-4">
                   {[
                     { label: pt.rssStatus, icon: Newspaper },
                     { label: pt.cloudStatus, icon: Activity },
                     { label: pt.voiceStatus, icon: Mic }
                   ].map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <div 
                           className="p-2 rounded-lg animate-pulse-subtle"
                           style={{ backgroundColor: "color-mix(in srgb, var(--color-success) 12%, transparent)", color: colors.success }}
                         >
                           <item.icon className="w-3.5 h-3.5" />
                         </div>
                         <span className="text-[11px] font-black uppercase tracking-wider text-text-main">{item.label}</span>
                       </div>
                       <span 
                         className="text-[9px] font-black uppercase tracking-widest"
                         style={{ color: colors.success }}
                       >
                         {pt.allOk}
                       </span>
                     </div>
                   ))}
                </div>

                <div className="pt-4 border-t border-border-subtle flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 text-[10px] text-text-muted font-mono italic opacity-60">
                    <ShieldCheck className="w-4 h-4" style={{ color: colors.success }} />
                    <span>24kHz Studio HD • Ready</span>
                  </div>

                  <Button
                    onClick={() => setShowSpeechDiagnostics(true)}
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center gap-2 text-[11px] font-bold py-2 rounded-xl"
                  >
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    <span>{uiLanguage === "vi" ? "Chẩn Đoán Chi Tiết (Modal)" : "Full Diagnostics Modal"}</span>
                  </Button>
                </div>
              </Card>
            </section>

            {/* Granular Web Speech State Diagnostics Panel */}
            <SpeechDiagnosticsPanel 
              uiLanguage={uiLanguage} 
              defaultExpanded={true} 
            />

          </div>

        </AdaptiveGrid>

        {/* Web Speech API Live Event Diagnostics Modal */}
        <SpeechDiagnosticsModal
          isOpen={showSpeechDiagnostics}
          onClose={() => setShowSpeechDiagnostics(false)}
          uiLanguage={uiLanguage}
        />

      </div>
    </PageTemplate>
  );
}
