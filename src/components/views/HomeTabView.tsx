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
  LayoutDashboard
} from "lucide-react";
import { SavedSummary, TabType } from "../../types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { PageTemplate } from "../../foundation/PageTemplate";
import { AdaptiveGrid } from "../../foundation/AdaptiveGrid";
import { colors } from "../../foundation/tokens/colors";
import { useVoiceInteraction } from "../../hooks/useVoiceInteraction";

interface HomeViewProps {
  uiLanguage: "vi" | "en";
  setActiveTab: (tab: TabType) => void;
  newsContent: string;
  savedBriefings: SavedSummary[];
  onPlayBriefing: (briefing: SavedSummary) => void;
  activePayload: any;
  step: string;
  activeTitle: string;
}

export default function HomeTabView({
  uiLanguage,
  setActiveTab,
  newsContent,
  savedBriefings,
  onPlayBriefing,
  step,
  activeTitle
}: HomeViewProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
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
      deskTitle: "Bàn Điều Hành",
      createCta: "Sản Xuất Bản Tin",
      missionIdle: "Sẵn Sàng Sản Xuất",
      continueMission: "Tiếp Tục Công Việc",
      allOk: "Hoạt động tốt",
      viewAll: "Xem tất cả",
      activeTitle: activeTitle || "Bản tin không đề",
      productionDesc: "Hệ thống đang xử lý dữ liệu và chuyển đổi âm thanh.",
      rssStatus: "Nguồn Tin RSS",
      cloudStatus: "Lưu Trữ Đám Mây",
      voiceStatus: "Công Cụ Giọng Đọc"
    },
    en: {
      deskTitle: "Operator Desk",
      createCta: "Produce Briefing",
      missionIdle: "Ready for Production",
      continueMission: "Continue Mission",
      allOk: "Healthy",
      viewAll: "View All",
      activeTitle: activeTitle || "Untitled Briefing",
      productionDesc: "System is processing data and converting audio streams.",
      rssStatus: "RSS Connectors",
      cloudStatus: "Cloud Infrastructure",
      voiceStatus: "Speech Engines"
    }
  }[uiLanguage];

  return (
    <PageTemplate
      id="home-view-root"
      className="bg-surface-bg text-left animate-fade-in flex flex-col"
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
      <div className="max-w-6xl mx-auto flex flex-col gap-10 py-12 px-6 lg:px-10" id="home-view-container">
        
        <AdaptiveGrid cols={{ compact: 1, regular: 3, expanded: 3 }} className="gap-8">
          
          {/* WIDGET 1: MISSION CONTROL (LEFT 2/3) */}
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-4">
               <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1 opacity-50">
                 Active Mission
               </h2>

               <Card className={cn(
                 "p-10 transition-all duration-500 relative group rounded-[32px]",
                 isProductionActive 
                  ? "border-2 border-brand-accent/30 bg-surface-bg shadow-2xl" 
                  : "border border-border-subtle bg-surface-subtle"
               )}>
                  <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-6">
                      <div 
                        className={cn(
                          "w-20 h-20 rounded-[24px] flex items-center justify-center transition-all duration-500 shadow-inner cursor-pointer",
                          voiceState === 'listening' ? "bg-red-500 animate-pulse" : "",
                          voiceState === 'speaking' ? "bg-green-500 animate-bounce" : ""
                        )}
                        style={voiceState === 'idle' && !isProductionActive 
                          ? { backgroundColor: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}` }
                          : { backgroundColor: colors.interactive, color: colors.onAccent }
                        }
                        onClick={voiceState === 'idle' ? startListening : stopListening}
                      >
                        <Mic className="w-10 h-10" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "text-3xl font-black tracking-tighter truncate",
                          isProductionActive ? "text-text-main" : "text-text-muted opacity-40"
                        )}>
                          {isProductionActive ? pt.activeTitle : pt.missionIdle}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
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
                                {voiceState === 'listening' ? "Listening" : voiceState === 'speaking' ? "Speaking" : isProductionActive ? "Processing" : "Standby"}
                              </span>
                              <p className="text-[11px] text-text-muted font-medium opacity-60">
                                {voiceState === 'listening' ? "Đang lắng nghe giọng nói của bạn..." : voiceState === 'speaking' ? "Đang trả lời bằng giọng nói..." : isProductionActive ? pt.productionDesc : "Initiate a new production cycle from the Production Station."}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Button 
                        onClick={() => setActiveTab("mission_studio")}
                        className={cn(
                          "h-12 px-10 font-black uppercase text-xs tracking-widest transition-all rounded-2xl"
                        )}
                        style={isProductionActive 
                          ? { backgroundColor: colors.textPrimary, color: colors.surface } 
                          : { backgroundColor: colors.surface, color: colors.textMuted, border: `2px solid ${colors.border}` }
                        }
                      >
                        <span>{isProductionActive ? pt.continueMission : pt.createCta}</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
               </Card>
            </section>

            {/* WIDGET 2: PRODUCTION HISTORY */}
            {recentBriefings.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-50">
                    Production History
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
                
                <div className="grid grid-cols-1 gap-4">
                  {recentBriefings.map((briefing) => (
                    <Card 
                      key={briefing.id}
                      onClick={() => onPlayBriefing(briefing)}
                      className="p-6 border border-border-subtle bg-surface-subtle/40 hover:bg-surface-bg hover:border-brand-accent/30 flex items-center justify-between group transition-all rounded-2xl cursor-pointer"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-surface-bg border border-border-subtle flex items-center justify-center text-text-muted group-hover:text-brand-accent transition-colors">
                          <Play className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-text-main truncate max-w-[280px]">
                            {briefing.payload?.title || "Untitled"}
                          </h4>
                          <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest mt-1 opacity-60">
                            {new Date(briefing.timestamp).toLocaleDateString()} • {briefing.preferences?.voice || "Master Engine"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest bg-brand-accent/5 px-2 py-1 rounded border border-brand-accent/10">COMPLETED</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* WIDGET 3: SYSTEM HEALTH (RIGHT 1/3) */}
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1 opacity-50">
                System Infrastructure
              </h2>
              <Card className="p-8 border border-border-subtle bg-surface-subtle space-y-6 rounded-[32px]">
                <div className="space-y-6">
                   {[
                     { label: pt.rssStatus, icon: Newspaper },
                     { label: pt.cloudStatus, icon: Activity },
                     { label: pt.voiceStatus, icon: Mic }
                   ].map((item, idx) => (
                     <div key={idx} className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div 
                           className="p-2.5 rounded-xl animate-pulse-subtle"
                           style={{ backgroundColor: "color-mix(in srgb, var(--color-success) 12%, transparent)", color: colors.success }}
                         >
                           <item.icon className="w-4 h-4" />
                         </div>
                         <span className="text-[11px] font-black uppercase tracking-widest text-text-main">{item.label}</span>
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

                <div className="pt-6 border-t border-border-subtle flex items-center gap-3 text-[10px] text-text-muted font-mono italic opacity-60">
                  <ShieldCheck className="w-4 h-4" style={{ color: colors.success }} />
                  <span>All engines operational.</span>
                </div>
              </Card>
            </section>

          </div>

        </AdaptiveGrid>

      </div>
    </PageTemplate>
  );
}
