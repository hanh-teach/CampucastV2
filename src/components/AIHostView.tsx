import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mic, 
  Volume2, 
  Settings2, 
  ShieldCheck, 
  Cpu, 
  TrendingUp, 
  Layers, 
  CheckCircle,
  Activity,
  Globe,
  Sliders,
  Sparkles,
  Info,
  Clock
} from "lucide-react";
import { KNOWLEDGE_SNAPSHOTS } from "../data/snapshots";
import { SnapshotLifecycleState } from "../types/snapshot";
import { cn } from "../lib/utils";
import { Card } from "./ui/Card";
import { PageTemplate } from "../foundation/PageTemplate";
import { colors } from "../foundation/tokens/colors";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";

interface AIHostViewProps {
  uiLanguage: "vi" | "en";
  preferences: any;
  setPreferences: React.Dispatch<React.SetStateAction<any>>;
  t: any;
}

export default function AIHostView({
  uiLanguage,
  preferences,
  setPreferences,
  t
}: AIHostViewProps) {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("Snap-2026.09.01");
  const [activeTab, setActiveTab] = useState<"personality" | "snapshot">("personality");

  const activeSnapshot = KNOWLEDGE_SNAPSHOTS.find(s => s.snapshot.id === selectedSnapshotId) || KNOWLEDGE_SNAPSHOTS[0];

  const updatePreference = (key: string, value: any) => {
    setPreferences((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  // Tone Options with descriptions
  const toneOptions = [
    { id: "conversational", icon: "🗣️", label: uiLanguage === "vi" ? "🗣️ Trò Chuyện (Co-host)" : "🗣️ Podcast Co-host", desc: uiLanguage === "vi" ? "Lời văn tự nhiên, ngắt nghỉ giống cuộc trò chuyện hai người." : "Natural banter, interactive tone like a two-person show." },
    { id: "informative", icon: "📰", label: uiLanguage === "vi" ? "📰 Truyền Thống" : "📰 Traditional News", desc: uiLanguage === "vi" ? "Giọng đọc tin tức chính luận, trang nghiêm, mạch lạc." : "Formal radio news host style, clear and informative." },
    { id: "upbeat", icon: "🔥", label: uiLanguage === "vi" ? "🔥 Sôi Nổi (Morning DJ)" : "🔥 Morning DJ Show", desc: uiLanguage === "vi" ? "Năng lượng cao, vui vẻ, chào đón ngày mới hào hứng." : "High energy, enthusiastic greeting, upbeat music integration." },
    { id: "analytical", icon: "🧠", label: uiLanguage === "vi" ? "🧠 Phân Tích" : "🧠 Critical Thinker", desc: uiLanguage === "vi" ? "Điềm tĩnh, tập trung vào số liệu, bóc tách nguyên nhân." : "Slower pace, focuses on data correlations and analysis." },
    { id: "witty", icon: "🎭", label: uiLanguage === "vi" ? "🎭 Hóm Hỉnh (Companion)" : "🎭 Witty Companion", desc: uiLanguage === "vi" ? "Sử dụng lối nói mỉa mai nhẹ nhàng, đùa vui thân mật." : "Uses friendly humor, metaphors, and lightweight remarks." }
  ];

  const voicesList = [
    { id: "vi-HN", label: "Hà Nội - Nam (vi-HN)", lang: "vi" },
    { id: "vi-HCM", label: "Sài Gòn - Nữ (vi-HCM)", lang: "vi" },
    { id: "Zephyr", label: "Zephyr Male (en-US)", lang: "en" },
    { id: "Fenrir", label: "Fenrir Deep (en-UK)", lang: "en" },
    { id: "Kore", label: "Kore Warm (en-US)", lang: "en" },
    { id: "Puck", label: "Puck Lively (en-UK)", lang: "en" }
  ];

  return (
    <PageTemplate
      id="aihost-view-container"
      className="max-w-5xl mx-auto flex flex-col gap-6 md:gap-8 text-left animate-fade-in px-4"
      header={
        <Card className="relative overflow-hidden p-6 md:p-8 shadow-app-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none"
             style={{ background: `linear-gradient(135deg, ${colors.interactive}0d, ${colors.warning}0d)` }} />
        
        <div className="space-y-2 relative z-10">
          <Badge variant="warning" className="text-[10px] font-bold uppercase tracking-widest font-mono">
            {uiLanguage === "vi" ? "Cấu hình AI Host" : "AI Host Configuration"}
          </Badge>
          <h1 className="text-xl md:text-3xl font-black tracking-tight flex items-center gap-2.5"
              style={{ color: colors.textPrimary }}>
            <Mic className="w-8 h-8" style={{ color: colors.interactive }} />
            <span>{uiLanguage === "vi" ? "Phòng thu AI Host" : "AI Host Studio"}</span>
          </h1>
          <p className="text-xs md:text-sm max-w-xl font-medium" style={{ color: colors.textSecondary }}>
            {uiLanguage === "vi" 
              ? "Tinh chỉnh phong cách, giọng đọc, và quản lý các phiên bản dữ liệu tri thức của người dẫn." 
              : "Calibrate reading styles, vocal delivery, and manage host knowledge snapshots."}
          </p>
        </div>

        {/* Inner Tabs Selector */}
        <div className="flex gap-1.5 p-1 rounded-app-xl relative z-10 self-stretch md:self-auto border"
             style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border }}>
          <button
            onClick={() => setActiveTab("personality")}
            className={cn(
              "flex-1 md:flex-none px-4 py-2 rounded-app-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border-0",
              activeTab === "personality"
                  ? "shadow-app-sm"
                  : "text-app-text-muted hover:text-app-text bg-transparent"
            )} style={activeTab === "personality" ? { backgroundColor: colors.interactive, color: colors.onAccent } : {}}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{uiLanguage === "vi" ? "Phong cách" : "Personality"}</span>
          </button>
          <button
            onClick={() => setActiveTab("snapshot")}
            className={cn(
              "flex-1 md:flex-none px-4 py-2 rounded-app-lg font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer border-0",
              activeTab === "snapshot"
                  ? "shadow-app-sm"
                  : "text-app-text-muted hover:text-app-text bg-transparent"
            )} style={activeTab === "snapshot" ? { backgroundColor: colors.interactive, color: colors.onAccent } : {}}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{uiLanguage === "vi" ? "Dữ liệu tri thức" : "Knowledge Base"}</span>
          </button>
        </div>
      
        </Card>
      }
    >
      <AnimatePresence mode="wait">
        {activeTab === "personality" ? (
          <motion.div
            key="personality"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8"
          >
            {/* Left Box: Persona selection */}
            <div className="md:col-span-7 space-y-6">
              <Card className="p-6 space-y-4 shadow-app-sm text-left"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: colors.border }}>
                  <Sparkles className="w-4 h-4" style={{ color: colors.interactive }} />
                  <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: colors.textPrimary }}>
                    {uiLanguage === "vi" ? "Chọn Phong Cách (Tone)" : "Select Persona Style (Tone)"}
                  </h3>
                </div>

                <div className="flex flex-col gap-3">
                  {toneOptions.map((opt) => {
                    const isSelected = preferences.tone === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => updatePreference("tone", opt.id)}
                        className="p-4 border rounded-app-xl cursor-pointer transition-all flex gap-3.5 items-start text-left"
                        style={isSelected 
                          ? { backgroundColor: `${colors.interactive}0d`, borderColor: colors.interactive } 
                          : { backgroundColor: colors.surfaceOverlay, borderColor: colors.border }
                        }
                      >
                        <span className="text-xl shrink-0 mt-0.5">{opt.icon}</span>
                        <div className="space-y-1">
                          <h4 className="text-xs font-black tracking-wide" style={{ color: isSelected ? colors.interactive : colors.textPrimary }}>
                            {opt.label}
                          </h4>
                          <p className="text-[10px] leading-relaxed font-medium" style={{ color: colors.textMuted }}>
                            {opt.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right Box: Voice Calibration */}
            <div className="md:col-span-5 space-y-6">
              <Card className="p-6 space-y-6 shadow-app-sm text-left"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: colors.border }}>
                  <Volume2 className="w-4 h-4" style={{ color: colors.interactive }} />
                  <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: colors.textPrimary }}>
                    {uiLanguage === "vi" ? "Cân Chỉnh Giọng Nói" : "Vocal Calibration"}
                  </h3>
                </div>

                {/* Voice Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-wider uppercase" style={{ color: colors.textMuted }}>
                    {uiLanguage === "vi" ? "GIỌNG PHÁT THANH" : "VOICE SELECTION"}
                  </label>
                  <select
                    value={preferences.voice || "Kore"}
                    onChange={(e) => updatePreference("voice", e.target.value)}
                    className="w-full p-2.5 border rounded-app-xl text-xs font-bold focus:outline-none cursor-pointer"
                    style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border, color: colors.textPrimary }}
                  >
                    {voicesList.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speed Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black tracking-wider uppercase"
                       style={{ color: colors.textMuted }}>
                    <span>{uiLanguage === "vi" ? "TỐC ĐỘ ĐỌC" : "READING SPEED"}</span>
                    <Badge variant="outline" className="font-mono text-[10px]"
                           style={{ borderColor: colors.interactive, color: colors.interactive, backgroundColor: `${colors.interactive}0d` }}>
                      {preferences.rate || 1.0}x
                    </Badge>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.3"
                    step="0.05"
                    value={preferences.rate || 1.0}
                    onChange={(e) => updatePreference("rate", parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-full cursor-pointer accent-current"
                    style={{ backgroundColor: colors.surfaceRaised, color: colors.interactive }}
                  />
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter" style={{ color: colors.textMuted }}>
                    <span>{uiLanguage === "vi" ? "CHẬM" : "SLOW"} (0.8x)</span>
                    <span>{uiLanguage === "vi" ? "NHANH" : "FAST"} (1.3x)</span>
                  </div>
                </div>

                {/* Pitch Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black tracking-wider uppercase"
                       style={{ color: colors.textMuted }}>
                    <span>{uiLanguage === "vi" ? "ĐỘ CAO GIỌNG" : "VOCAL PITCH"}</span>
                    <Badge variant="outline" className="font-mono text-[10px]"
                           style={{ borderColor: colors.interactive, color: colors.interactive, backgroundColor: `${colors.interactive}0d` }}>
                      {preferences.pitch || 1.0}x
                    </Badge>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.2"
                    step="0.05"
                    value={preferences.pitch || 1.0}
                    onChange={(e) => updatePreference("pitch", parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-full cursor-pointer accent-current"
                    style={{ backgroundColor: colors.surfaceRaised, color: colors.interactive }}
                  />
                  <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter" style={{ color: colors.textMuted }}>
                    <span>{uiLanguage === "vi" ? "TRẦM" : "DEEP"} (0.8x)</span>
                    <span>{uiLanguage === "vi" ? "CAO" : "HIGH"} (1.2x)</span>
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: colors.border }}>
                  <label className="text-[10px] font-black tracking-wider uppercase" style={{ color: colors.textMuted }}>
                    {uiLanguage === "vi" ? "CHỈ THỊ RIÊNG CHO AI" : "SPECIAL DIRECTIVES"}
                  </label>
                  <textarea
                    rows={3}
                    value={preferences.customInstructions || ""}
                    onChange={(e) => updatePreference("customInstructions", e.target.value)}
                    placeholder={uiLanguage === "vi" ? "ví dụ: Luôn chào bằng tên Nam, đọc chậm các thuật ngữ kỹ thuật..." : "e.g., Always address me as Mark, pause longer on financial figures..."}
                    className="w-full p-3 border rounded-app-xl text-xs font-medium focus:outline-none leading-relaxed placeholder-current opacity-70 resize-none"
                    style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border, color: colors.textPrimary }}
                  />
                </div>
              </Card>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="snapshot"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8"
          >
            {/* Left box: Snapshot Selector */}
            <div className="md:col-span-4 space-y-4">
              <Card className="p-5 space-y-4 shadow-app-sm text-left"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <div className="flex items-center gap-2 border-b pb-2.5" style={{ borderColor: colors.border }}>
                  <Layers className="w-4 h-4" style={{ color: colors.interactive }} />
                  <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: colors.textPrimary }}>
                    {uiLanguage === "vi" ? "Phiên bản tri thức" : "Knowledge Snapshots"}
                  </h3>
                </div>

                <div className="flex flex-col gap-2">
                  {KNOWLEDGE_SNAPSHOTS.map((snap) => {
                    const isSelected = snap.snapshot.id === selectedSnapshotId;
                    
                    return (
                      <div
                        key={snap.snapshot.id}
                        onClick={() => setSelectedSnapshotId(snap.snapshot.id)}
                        className="p-3.5 border rounded-app-xl cursor-pointer transition-all flex flex-col gap-2"
                        style={isSelected
                          ? { backgroundColor: `${colors.interactive}0d`, borderColor: colors.interactive }
                          : { backgroundColor: colors.surfaceOverlay, borderColor: colors.border }
                        }
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] font-mono font-black" style={{ color: isSelected ? colors.interactive : colors.textPrimary }}>
                            {snap.snapshot.id}
                          </span>
                          <Badge 
                            variant={snap.lifecycle.state === SnapshotLifecycleState.PRODUCTION ? "accent" : "outline"}
                            className="text-[8px] font-black uppercase px-2 py-0.5"
                          >
                            {snap.lifecycle.state}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold" style={{ color: colors.textMuted }}>
                          <Clock className="w-3 h-3" />
                          <span>{new Date(snap.snapshot.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right box: Snapshot Details */}
            <Card className="md:col-span-8 p-0 shadow-app-md overflow-hidden flex flex-col"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              {/* Header */}
              <div className="px-5 py-4 border-b flex justify-between items-center shrink-0"
                   style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border }}>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" style={{ color: colors.interactive }} />
                  <span className="text-xs font-black uppercase tracking-wide" style={{ color: colors.textPrimary }}>
                    {uiLanguage === "vi" ? "Chi tiết phiên bản tri thức" : "Snapshot Detailed Data"}
                  </span>
                </div>
                <Badge variant="outline" className="font-mono text-[10px]" style={{ borderColor: colors.border, color: colors.textMuted }}>
                  ID: {selectedSnapshotId}
                </Badge>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[500px]">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: colors.textMuted }}>Snapshot Trace ID</p>
                    <p className="text-xs font-black font-mono" style={{ color: colors.textPrimary }}>{activeSnapshot.snapshot.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: colors.textMuted }}>Engine Compatibility</p>
                    <p className="text-xs font-black font-mono" style={{ color: colors.interactive }}>v{activeSnapshot.snapshot.version}</p>
                  </div>
                </div>

                {/* Hypothesis */}
                <div className="space-y-2.5 p-4 rounded-app-xl border"
                     style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border }}>
                  <p className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: colors.textMuted }}>
                    <Sparkles className="w-3.5 h-3.5" style={{ color: colors.interactive }} />
                    <span>{uiLanguage === "vi" ? "Giả thuyết sản phẩm" : "Product Hypothesis"}</span>
                  </p>
                  <p className="text-[11px] leading-relaxed font-medium italic" style={{ color: colors.textPrimary }}>
                    "{activeSnapshot.product.hypothesis}"
                  </p>
                </div>

                {/* KPI Metrics */}
                <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: colors.textMuted }}>
                    <TrendingUp className="w-3.5 h-3.5" style={{ color: colors.success }} />
                    <span>{uiLanguage === "vi" ? "Tác động dự kiến (KPI)" : "Expected Impact (KPI)"}</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(activeSnapshot.product.expectedImpact).map(([k, v]) => (
                      <div key={k} className="p-3 border rounded-app-lg flex flex-col gap-1 shadow-app-sm"
                           style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
                        <span className="text-[8px] uppercase font-black truncate" style={{ color: colors.textMuted }}>{k.replace("Lift", " Rate Lift")}</span>
                        <span className="text-sm font-black font-mono mt-0.5" style={{ color: colors.success }}>+{v * 100}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Governance Reports */}
                <div className="space-y-3 p-4 rounded-app-xl border"
                     style={{ backgroundColor: `${colors.interactive}0d`, borderColor: colors.border }}>
                  <p className="text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: colors.textMuted }}>
                    <Activity className="w-3.5 h-3.5" style={{ color: colors.interactive }} />
                    <span>{uiLanguage === "vi" ? "Báo cáo kiểm định tự động" : "Automated Governance Reports"}</span>
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: colors.border }}>
                      <span className="text-[10px] font-bold" style={{ color: colors.textMuted }}>Replay Check</span>
                      <Badge variant="outline" className="text-[9px] font-black" style={{ borderColor: colors.success, color: colors.success }}>PASS</Badge>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b" style={{ borderColor: colors.border }}>
                      <span className="text-[10px] font-bold" style={{ color: colors.textMuted }}>Benchmark Test</span>
                      <Badge variant="outline" className="text-[9px] font-black" style={{ borderColor: colors.success, color: colors.success }}>SUCCESS</Badge>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[10px] font-bold" style={{ color: colors.textMuted }}>Editorial Quality</span>
                      <span className="text-[10px] font-black" style={{ color: colors.interactive }}>{activeSnapshot.validation.editorialScore}/10</span>
                    </div>
                  </div>
                </div>

                {/* Approval Meta */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t text-[10px]" style={{ borderColor: colors.border }}>
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: colors.textMuted }}>Derived From</p>
                    <div className="flex flex-wrap gap-1">
                      {activeSnapshot.lineage.derivedFrom.map((d, idx) => (
                        <Badge key={idx} variant="outline" className="text-[8px] font-mono">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: colors.textMuted }}>Approved By</p>
                    <p className="text-xs font-black" style={{ color: colors.textPrimary }}>{activeSnapshot.governance.approvedBy}</p>
                    <p className="text-[9px] mt-0.5 font-bold" style={{ color: colors.textMuted }}>{new Date(activeSnapshot.governance.approvalTime).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTemplate>
  );
}
