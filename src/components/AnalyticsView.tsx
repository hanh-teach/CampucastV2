import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart3, 
  Activity, 
  LineChart, 
  Layers, 
  TrendingUp, 
  Database
} from "lucide-react";
import { TelemetryDashboard } from "./TelemetryDashboard";
import { ReadingStatistics } from "../features/statistics/ReadingStatistics";
import { KNOWLEDGE_SNAPSHOTS } from "../data/snapshots";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { PageHeader } from "./ui/PageHeader";
import { PageTemplate } from "../foundation/PageTemplate";
import { colors } from "../foundation/tokens/colors";
import { cn } from "../lib/utils";

interface AnalyticsViewProps {
  uiLanguage: "vi" | "en";
}

export default function AnalyticsView({
  uiLanguage
}: AnalyticsViewProps) {
  const [activeTab, setActiveTab] = useState<"lineage" | "reading" | "telemetry">("lineage");

  return (
    <PageTemplate
      header={
        <PageHeader
          title={uiLanguage === "vi" ? "Bảng Phân Tích & Lineage" : "Observation Deck (Analytics)"}
          subtitle={uiLanguage === "vi" 
            ? "Theo dõi telemetry thời gian thực, phân tích thói quen nghe của người dùng và đo lường Knowledge Snapshot." 
            : "Track microsecond telemetry events, aggregate listening durations, and map Snapshot product metrics."}
          actions={
            <div className="flex gap-1 bg-surface-subtle border border-border-primary p-1 rounded-xl">
              {[
                { id: "lineage", label: uiLanguage === "vi" ? "Impact Lineage" : "Impact Lineage", icon: Layers },
                { id: "reading", label: uiLanguage === "vi" ? "Thói Quen" : "Habit Stats", icon: LineChart },
                { id: "telemetry", label: uiLanguage === "vi" ? "Raw Telemetry" : "Telemetry Logs", icon: Activity }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSel = activeTab === tab.id;
                return (
                  <Button
                    key={tab.id}
                    variant={isSel ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "text-[10px] font-black uppercase tracking-wider h-8",
                      isSel ? "bg-brand-accent" : "text-text-muted hover:text-text-main"
                    )}
                    style={isSel ? { color: colors.onAccent } : undefined}
                  >
                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                    <span>{tab.label}</span>
                  </Button>
                );
              })}
            </div>
          }
        >
          <Badge variant="accent" className="font-mono py-1 px-3 mb-2 tracking-widest text-[10px]">
            {uiLanguage === "vi" ? "GIÁM SÁT HỆ THỐNG & ĐO LƯỜNG" : "OBSERVATION DECK & ANALYTICS"}
          </Badge>
        </PageHeader>
      }
    >
      <AnimatePresence mode="wait">
        {activeTab === "lineage" && (
          <motion.div
            key="lineage"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            <Card variant="default" className="p-8 relative overflow-hidden bg-gradient-to-br from-surface-bg to-brand-accent/5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-text-main uppercase tracking-widest">
                    {uiLanguage === "vi" ? "Hệ thống Đánh giá Thực nghiệm" : "Evidence Platform Scorecard"}
                  </h3>
                  <p className="text-sm text-text-muted max-w-3xl leading-relaxed font-medium">
                    {uiLanguage === "vi" 
                      ? "Gắn chặt mỗi Knowledge Snapshot với một Thử nghiệm sản phẩm thực tế để đo lường mức độ gia tăng trong trải nghiệm người dùng." 
                      : "Every Knowledge Snapshot acts as an isolated product experiment to systematically measure quantitative lift across core engagement KPIs."}
                  </p>
                </div>
                <Badge variant="accent" className="font-mono text-[10px] py-1.5 px-3 flex items-center gap-2 bg-brand-accent/10 border-brand-accent/20">
                  <Database className="w-3.5 h-3.5" />
                  <span>BASELINE 4.0 PROTOCOL</span>
                </Badge>
              </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-4">
                <Card variant="default" className="p-8">
                  <div className="flex justify-between items-center border-b border-border-primary pb-4 mb-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-text-main">
                      {uiLanguage === "vi" ? "Chỉ Số Tác Động Giai Đoạn 2" : "Phase 2 Product Scorecard Lift"}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: "Recommendation Acceptance", score: "+8.4%", desc: uiLanguage === "vi" ? "Mức độ chấp nhận kịch bản đề xuất tự động từ AI" : "User acceptance rate of AI suggested news topics" },
                      { label: "Story Continuity", score: "+6.8%", desc: uiLanguage === "vi" ? "Mức liền mạch, duy trì nghe giữa các chương phát thanh" : "The ratio of subsequent audio chapters completed" },
                      { label: "Completion Rate", score: "+11.2%", desc: uiLanguage === "vi" ? "Tỷ lệ hoàn thành trọn vẹn bản tin dài (~4 phút)" : "Overall percentage of fully listened 4m briefings" },
                      { label: "Daily Return (PWA)", score: "+5.2%", desc: uiLanguage === "vi" ? "Tỷ lệ quay lại mở app hằng ngày thông qua PWA" : "Rate of consecutive daily user app returns via desktop/PWA" },
                      { label: "Dialogue Satisfaction", score: "9.4/10", desc: uiLanguage === "vi" ? "Điểm số hài lòng về khả năng giao tiếp của Host song ngữ" : "Self-reported satisfaction scores of conversational host" }
                    ].map((metric, idx) => (
                      <div key={idx} className="p-5 bg-surface-subtle border border-border-primary rounded-xl flex justify-between items-center gap-4 transition-all hover:border-brand-accent/30 group">
                        <div className="space-y-1">
                          <span className="text-sm font-black text-text-main block group-hover:text-brand-accent transition-colors">{metric.label}</span>
                          <span className="text-[11px] text-text-muted block leading-relaxed font-medium">{metric.desc}</span>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-base font-black text-brand-accent font-mono flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4" />
                            {metric.score}
                          </span>
                          <span className="text-[9px] text-text-muted font-black tracking-widest uppercase mt-0.5">LIFT RECOGNIZED</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-5">
                <Card variant="default" className="p-8">
                  <div className="flex justify-between items-center border-b border-border-primary pb-4 mb-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-text-main">
                      {uiLanguage === "vi" ? "Phả Hệ Tiến Hóa Tri Thức" : "Knowledge Evolution Lineage"}
                    </h3>
                  </div>

                  <div className="relative pl-8 space-y-8 before:absolute before:top-2 before:left-3 before:bottom-2 before:w-px before:bg-border-primary">
                    {KNOWLEDGE_SNAPSHOTS.map((snap) => {
                      const isProd = snap.snapshot.id === "Snap-2026.09.01";
                      return (
                        <div key={snap.snapshot.id} className="relative">
                          <div className={cn(
                            "absolute top-1.5 -left-[23.5px] w-3 h-3 rounded-full border-2 border-surface-bg transition-all",
                            isProd ? "bg-brand-accent scale-125 ring-4 ring-brand-accent/20" : "bg-border-primary"
                          )} />
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-xs font-black font-mono tracking-tight",
                                isProd ? "text-brand-accent" : "text-text-main"
                              )}>
                                {snap.snapshot.id}
                              </span>
                              {isProd && (
                                <Badge variant="accent" className="text-[8px] py-0 px-2 uppercase font-black bg-brand-accent/10 border-brand-accent/20">
                                  ACTIVE IN PROD
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-xs text-text-muted leading-relaxed font-medium italic">
                              "{snap.product.hypothesis}"
                            </p>

                            <div className="flex flex-wrap gap-2 pt-1">
                              <Badge variant="default" className="text-[9px] font-mono py-0 px-2 bg-surface-subtle border-border-primary text-text-muted">
                                KPI: {snap.product.targetKPIs[0]}
                              </Badge>
                              <Badge variant="default" className="text-[9px] font-mono py-0 px-2 bg-surface-subtle border-border-primary text-text-muted">
                                Score: {snap.validation.editorialScore}/10
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "reading" && (
          <motion.div
            key="reading"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <Card variant="default" className="p-8">
              <ReadingStatistics uiLanguage={uiLanguage} />
            </Card>
          </motion.div>
        )}

        {activeTab === "telemetry" && (
          <motion.div
            key="telemetry"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <Card variant="default" className="p-8 overflow-hidden">
              <TelemetryDashboard embedded onClose={() => {}} />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTemplate>
  );
}
