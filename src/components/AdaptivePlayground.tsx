import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Laptop, Tablet as TabletIcon, Smartphone, CheckCircle, 
  HelpCircle, Shield, AlertTriangle, Layers, Zap, Palette, RefreshCw, Eye, Sparkles, Rss, Wand2, Mic, Share2
} from 'lucide-react';
import { useAdaptive } from '../layouts/AdaptiveContext';
import { DeviceType, LayoutVariant, Orientation } from '../types';
import { colors } from '../foundation/tokens/colors';
import { spacing } from '../foundation/tokens/spacing';
import { motion as motionTokens } from '../foundation/tokens/motion';
import { typography } from '../foundation/tokens/typography';
import { AdaptiveCard } from '../foundation/AdaptiveCard';
import { AdaptiveGrid } from '../foundation/AdaptiveGrid';
import { PageTemplate } from '../foundation/PageTemplate';
import { cn } from '../lib/utils';

export const AdaptivePlayground: React.FC<{ uiLanguage: "vi" | "en" }> = ({ uiLanguage }) => {
  const realEnv = useAdaptive();
  const [simulatedDevice, setSimulatedDevice] = useState<DeviceType | "real">("real");
  const [simulatedOrientation, setSimulatedOrientation] = useState<Orientation>(Orientation.Portrait);
  const [activeStage, setActiveStage] = useState<number>(1);
  const [isSimulatingProcessing, setIsSimulatingProcessing] = useState<boolean>(false);
  const [simulatedProgress, setSimulatedProgress] = useState<string>("Analyzing...");
  
  // Interactive Verification checklist state
  const [checklist, setChecklist] = useState({
    noHorizontalScroll: true,
    touchTargetMinSize: true,
    fontReadable: true,
    fabNoOverlap: true,
    navigationCorrect: true,
    colorContrastHigh: true,
  });

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Determine active env either from physical client size or simulator overrides
  const activeDevice = simulatedDevice === "real" ? realEnv.device : simulatedDevice;
  const activeVariant = activeDevice === DeviceType.Mobile 
    ? LayoutVariant.Compact 
    : activeDevice === DeviceType.Tablet 
      ? LayoutVariant.Regular 
      : LayoutVariant.Expanded;
  
  const activeOrientation = simulatedDevice === "real" ? realEnv.orientation : simulatedOrientation;

  const handleStartSimulatingProcess = () => {
    if (isSimulatingProcessing) return;
    setIsSimulatingProcessing(true);
    setSimulatedProgress("Analyzing RSS feeds...");
    
    setTimeout(() => {
      setSimulatedProgress("Generating prompt sequence...");
      setTimeout(() => {
        setSimulatedProgress("Summarizing with Gemini Flash...");
        setTimeout(() => {
          setSimulatedProgress("Synthesizing audio via TTS...");
          setTimeout(() => {
            setSimulatedProgress("Complete");
            setIsSimulatingProcessing(false);
          }, 1500);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  // Heuristic for active step based on progress
  const simulatedActiveStep = simulatedProgress.includes("audio") ? 3 :
                              simulatedProgress.includes("Summariz") ? 2 :
                              simulatedProgress.includes("prompt") ? 1 :
                              simulatedProgress.includes("Complete") ? 4 : 0;

  const t = {
    vi: {
      title: "Trung Tâm Nghiệm Thu & Khảo Sát Kiến Trúc",
      subtitle: "Sprint Platform-005.6C: Playground kiểm thử thiết bị, ma trận Design Tokens & Quy chuẩn hợp đồng Component",
      deviceSim: "Giả lập Thiết bị",
      orientation: "Hướng xoay",
      activeSpecs: "Thông số Môi trường Hiện tại",
      contracts: "Hợp đồng Component",
      tokens: "Hệ thống Design Tokens",
      regression: "Danh mục Visual Regression",
      realLabel: "Thiết bị Thật",
      desktopLabel: "Desktop (Máy tính)",
      tabletLabel: "Tablet (Máy tính bảng)",
      mobileLabel: "Mobile (Điện thoại)",
      progressiveWorkflow: "Mô hình Luồng Soạn Thảo v2 (Studio Workflow)",
      demoButton: "Chạy mô phỏng Progressive Feedback",
      analyzing: "Đang phân tích...",
      promptGen: "Đang tạo Prompt...",
      summarizing: "Đang tóm tắt...",
      audioGen: "Đang tạo Audio...",
      complete: "Hoàn tất"
    },
    en: {
      title: "Architecture Verification & Playground",
      subtitle: "Sprint Platform-005.6C: Device simulator, Design Tokens matrix & Component Contract verification",
      deviceSim: "Device Simulator",
      orientation: "Orientation",
      activeSpecs: "Active Environmental Metadata",
      contracts: "Component Contracts",
      tokens: "Design Tokens System",
      regression: "Visual Regression Checklist",
      realLabel: "Physical Device",
      desktopLabel: "Desktop Mode",
      tabletLabel: "Tablet Mode",
      mobileLabel: "Mobile Mode",
      progressiveWorkflow: "Studio Workflow v2 Blueprint",
      demoButton: "Run Simulated Progressive Feedback",
      analyzing: "Analyzing...",
      promptGen: "Generating Prompt...",
      summarizing: "Summarizing...",
      audioGen: "Synthesizing Audio...",
      complete: "Complete"
    }
  }[uiLanguage];

  return (
    <PageTemplate
      className="text-left"
      style={{ backgroundColor: colors.surface, color: colors.textPrimary }}
      header={
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-2" style={{ color: colors.textPrimary }}>
              <Zap className="w-6 h-6" style={{ color: colors.interactive }} />
              {t.title}
            </h1>
            <p className="text-xs font-mono mt-1" style={{ color: colors.textMuted }}>{t.subtitle}</p>
          </div>
          <div className="flex p-1.5 rounded-2xl gap-2 border" style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
            <button
              onClick={() => setSimulatedDevice("real")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                simulatedDevice === "real" ? "" : "opacity-50 hover:opacity-100"
              }`}
              style={simulatedDevice === "real" 
                ? { backgroundColor: colors.interactive, color: colors.onAccent } 
                : { color: colors.textPrimary }}
            >
              {t.realLabel}
            </button>
            <button
              onClick={() => setSimulatedDevice(DeviceType.Desktop)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                simulatedDevice === DeviceType.Desktop ? "" : "opacity-50 hover:opacity-100"
              }`}
              style={simulatedDevice === DeviceType.Desktop 
                ? { backgroundColor: colors.interactive, color: colors.onAccent } 
                : { color: colors.textPrimary }}
            >
              <Laptop className="w-3.5 h-3.5" />
              {t.desktopLabel}
            </button>
            <button
              onClick={() => setSimulatedDevice(DeviceType.Tablet)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                simulatedDevice === DeviceType.Tablet ? "" : "opacity-50 hover:opacity-100"
              }`}
              style={simulatedDevice === DeviceType.Tablet 
                ? { backgroundColor: colors.interactive, color: colors.onAccent } 
                : { color: colors.textPrimary }}
            >
              <TabletIcon className="w-3.5 h-3.5" />
              {t.tabletLabel}
            </button>
            <button
              onClick={() => setSimulatedDevice(DeviceType.Mobile)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                simulatedDevice === DeviceType.Mobile ? "" : "opacity-50 hover:opacity-100"
              }`}
              style={simulatedDevice === DeviceType.Mobile 
                ? { backgroundColor: colors.interactive, color: colors.onAccent } 
                : { color: colors.textPrimary }}
            >
              <Smartphone className="w-3.5 h-3.5" />
              {t.mobileLabel}
            </button>
          </div>
        </div>
      }
    >
      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
        
        {/* Environment Grid Info */}
        <AdaptiveGrid cols={{ compact: 1, regular: 2, expanded: 4 }}>
          <AdaptiveCard style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
            <span className="text-[10px] font-mono tracking-widest uppercase block" style={{ color: colors.textMuted }}>Active Device</span>
            <span className="text-xl font-black uppercase mt-1 block" style={{ color: colors.interactive }}>{activeDevice}</span>
            <p className="text-xs mt-2 font-mono" style={{ color: colors.textMuted }}>Simulated mode: {simulatedDevice !== "real" ? "Active" : "None"}</p>
          </AdaptiveCard>

          <AdaptiveCard style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
            <span className="text-[10px] font-mono tracking-widest uppercase block" style={{ color: colors.textMuted }}>Adaptive Layout Variant</span>
            <span className="text-xl font-black uppercase mt-1 block" style={{ color: colors.success }}>{activeVariant}</span>
            <p className="text-xs mt-2 font-mono" style={{ color: colors.textMuted }}>Padding: {activeVariant === LayoutVariant.Compact ? "16px" : activeVariant === LayoutVariant.Regular ? "32px" : "48px"}</p>
          </AdaptiveCard>

          <AdaptiveCard style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
            <span className="text-[10px] font-mono tracking-widest uppercase block" style={{ color: colors.textMuted }}>Orientation Mode</span>
            <span className="text-xl font-black uppercase mt-1 block" style={{ color: colors.warning }}>{activeOrientation}</span>
            <p className="text-xs mt-2 font-mono" style={{ color: colors.textMuted }}>Aspect Ratio: Responsive</p>
          </AdaptiveCard>

          <AdaptiveCard style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
            <span className="text-[10px] font-mono tracking-widest uppercase block" style={{ color: colors.textMuted }}>Pointers / Accessibility</span>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono border" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textSecondary }}>Pointer: {realEnv.pointer}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono border" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textSecondary }}>Density: {realEnv.density}</span>
              {realEnv.reducedMotion && <span className="px-2 py-0.5 rounded text-[10px] font-mono border" style={{ backgroundColor: `${colors.warning}1a`, borderColor: `${colors.warning}33`, color: colors.warning }}>Reduced Motion</span>}
              {realEnv.highContrast && <span className="px-2 py-0.5 rounded text-[10px] font-mono border" style={{ backgroundColor: `${colors.critical}1a`, borderColor: `${colors.critical}33`, color: colors.critical }}>High Contrast</span>}
            </div>
          </AdaptiveCard>
        </AdaptiveGrid>

        {/* Studio Workflow Blueprint Demonstration */}
        <AdaptiveCard className="p-6" style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-black tracking-tight uppercase flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <Layers className="w-5 h-5" style={{ color: colors.interactive }} />
                {t.progressiveWorkflow}
              </h2>
              <p className="text-xs font-mono mt-1" style={{ color: colors.textMuted }}>Simulated presentation demonstrating continuous, step-by-step progress metrics.</p>
            </div>
            <button
              onClick={handleStartSimulatingProcess}
              disabled={isSimulatingProcessing}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingProcessing ? "animate-spin" : ""}`} />
              {t.demoButton}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {[
              { id: 1, name: uiLanguage === "vi" ? "Phân tích RSS" : "RSS Analysis", icon: Rss, desc: "Scanning feeds..." },
              { id: 2, name: uiLanguage === "vi" ? "Biên soạn Prompt" : "Compile Prompt", icon: Wand2, desc: "Formatting instructions..." },
              { id: 3, name: uiLanguage === "vi" ? "Tóm tắt" : "Summarization", icon: Sparkles, desc: "Synthesizing content..." },
              { id: 4, name: uiLanguage === "vi" ? "Tạo Audio" : "Speech Synth", icon: Mic, desc: "Generating audio..." },
              { id: 5, name: uiLanguage === "vi" ? "Hoàn tất" : "Publish", icon: Share2, desc: "Writing files..." }
            ].map((stepItem, index) => {
              const isCurrent = simulatedActiveStep === index;
              const isDone = simulatedActiveStep > index || simulatedProgress === "Complete";
              
              return (
                <div key={stepItem.id} className={cn(
                  "p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[110px]",
                  isCurrent ? "shadow-md scale-[1.02]" : "opacity-70"
                )}
                style={{ 
                  backgroundColor: isCurrent ? `${colors.interactive}1a` : colors.surface, 
                  borderColor: isCurrent ? colors.interactive : colors.border
                }}>
                  <div className="flex justify-between items-center">
                    <div className="p-2 rounded-lg" style={isCurrent ? { backgroundColor: colors.interactive, color: colors.onAccent } : { backgroundColor: colors.surfaceOverlay, color: colors.textMuted }}>
                      <stepItem.icon className="w-4 h-4" />
                    </div>
                    {isDone ? (
                      <CheckCircle className="w-4 h-4" style={{ color: colors.success }} />
                    ) : (
                      <span className="text-[10px] font-mono" style={{ color: colors.textMuted }}>Stage {stepItem.id}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold tracking-tight mt-2" style={{ color: isCurrent ? colors.interactive : colors.textPrimary }}>
                      {stepItem.name}
                    </h3>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: colors.textMuted }}>{stepItem.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {isSimulatingProcessing && (
            <div className="mt-4 p-3 rounded-xl border flex items-center justify-between" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: colors.interactive }} />
                <span className="text-xs font-mono tracking-wider uppercase" style={{ color: colors.interactive }}>{simulatedProgress}</span>
              </div>
              <div className="w-48 rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: colors.surfaceOverlay }}>
                <div 
                  className="h-full transition-all duration-500 ease-out" 
                  style={{ width: `${(simulatedActiveStep + 1) * 20}%`, backgroundColor: colors.interactive }}
                />
              </div>
            </div>
          )}
        </AdaptiveCard>

        {/* Visual Regression Checklist */}
        <AdaptiveGrid cols={{ compact: 1, regular: 2, expanded: 2 }}>
          <AdaptiveCard className="p-6" style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
            <h2 className="text-lg font-black tracking-tight uppercase flex items-center gap-2 mb-4" style={{ color: colors.textPrimary }}>
              <Shield className="w-5 h-5" style={{ color: colors.interactive }} />
              {t.regression}
            </h2>
            <p className="text-xs font-mono mb-4" style={{ color: colors.textMuted }}>Interactive scorecard mapping to target metrics defined in QA Baseline.</p>
            
            <div className="space-y-3">
              {[
                { key: "noHorizontalScroll", label: "No horizontal scroll (zero overflow-x)", desc: "Guarantees layout fits strictly on devices as narrow as 320px." },
                { key: "touchTargetMinSize", label: "Touch targets minimum size (>= 44px)", desc: "Enforces tactile friendly UI components." },
                { key: "fontReadable", label: "Legible typography (Base >= 14px)", desc: "Eliminates squashed tiny text files." },
                { key: "fabNoOverlap", label: "FAB positioning overrides", desc: "Guarantees assistant launcher floating buttons do not overlay critical bottom navigation tabs." },
                { key: "navigationCorrect", label: "Platform Navigation Switcher active", desc: "Switches Sidebar to Bottom Nav seamlessly." },
                { key: "colorContrastHigh", label: "Semantic Color Contrast High (WCAG Level AA)", desc: "Contrast score remains safe under low lighting conditions." }
              ].map((item) => (
                <div 
                  key={item.key} 
                  onClick={() => toggleChecklist(item.key as keyof typeof checklist)}
                  className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:brightness-95"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                >
                  <div className={cn(
                    "mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all",
                    checklist[item.key as keyof typeof checklist] ? "" : "text-transparent"
                  )}
                  style={checklist[item.key as keyof typeof checklist] 
                    ? { backgroundColor: colors.interactive, borderColor: colors.interactive, color: colors.onAccent } 
                    : { borderColor: colors.border }}
                  >
                    <CheckCircle className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block" style={{ color: colors.textPrimary }}>{item.label}</span>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: colors.textMuted }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </AdaptiveCard>

          {/* Design System Token Table */}
          <AdaptiveCard className="p-6" style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
            <h2 className="text-lg font-black tracking-tight uppercase flex items-center gap-2 mb-4" style={{ color: colors.textPrimary }}>
              <Palette className="w-5 h-5" style={{ color: colors.interactive }} />
              {t.tokens}
            </h2>
            <p className="text-xs font-mono mb-4" style={{ color: colors.textMuted }}>Centralized tokens driving consistent presentation rules.</p>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs font-black uppercase block mb-2" style={{ color: colors.interactive }}>Semantic Colors Matrix</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl border flex items-center gap-2" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                    <div className="w-5 h-5 rounded-lg border" style={{ backgroundColor: colors.surface, borderColor: colors.border }} />
                    <div>
                      <span className="text-[10px] font-mono uppercase block" style={{ color: colors.textMuted }}>surface</span>
                      <span className="text-xs font-bold font-mono" style={{ color: colors.textPrimary }}>{colors.surface}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl border flex items-center gap-2" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                    <div className="w-5 h-5 rounded-lg border" style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border }} />
                    <div>
                      <span className="text-[10px] font-mono uppercase block" style={{ color: colors.textMuted }}>surfaceRaised</span>
                      <span className="text-xs font-bold font-mono" style={{ color: colors.textPrimary }}>{colors.surfaceRaised}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl border flex items-center gap-2" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                    <div className="w-5 h-5 rounded-lg border" style={{ backgroundColor: colors.interactive, borderColor: colors.border }} />
                    <div>
                      <span className="text-[10px] font-mono uppercase block" style={{ color: colors.textMuted }}>interactive</span>
                      <span className="text-xs font-bold font-mono" style={{ color: colors.textPrimary }}>{colors.interactive}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl border flex items-center gap-2" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                    <div className="w-5 h-5 rounded-lg border" style={{ backgroundColor: colors.critical, borderColor: colors.border }} />
                    <div>
                      <span className="text-[10px] font-mono uppercase block" style={{ color: colors.textMuted }}>critical</span>
                      <span className="text-xs font-bold font-mono" style={{ color: colors.textPrimary }}>{colors.critical}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-black uppercase block mb-2" style={{ color: colors.interactive }}>Spacing Scale Tokens</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(spacing).map(([key, val]) => (
                    <div key={key} className="px-3 py-1.5 rounded-xl border flex flex-col items-center" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                      <span className="text-[9px] font-mono uppercase" style={{ color: colors.textMuted }}>{key}</span>
                      <span className="text-xs font-black font-mono mt-0.5" style={{ color: colors.textPrimary }}>{val}px</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-black uppercase block mb-2" style={{ color: colors.interactive }}>Micro Animation Curve Preset</span>
                <div className="p-3 rounded-xl border flex justify-between items-center" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <div>
                    <span className="text-xs font-bold block" style={{ color: colors.textSecondary }}>Spring Physics Curve</span>
                    <span className="text-[10px] font-mono block" style={{ color: colors.textMuted }}>stiffness: 300, damping: 25</span>
                  </div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                      ease: "linear"
                    }}
                    className="w-6 h-6 border-2 border-dashed rounded-full"
                    style={{ borderColor: colors.interactive }}
                  />
                </div>
              </div>
            </div>
          </AdaptiveCard>
        </AdaptiveGrid>

        {/* Component Contract References */}
        <AdaptiveCard className="p-6" style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
          <h2 className="text-lg font-black tracking-tight uppercase flex items-center gap-2 mb-4" style={{ color: colors.textPrimary }}>
            <Layers className="w-5 h-5" style={{ color: colors.interactive }} />
            {t.contracts}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "AdaptiveLayout", desc: "Pads the outer frame depending on variant rules (px-4 compact, px-8 regular, px-16 expanded).", owner: "Platform Team", status: "Verified" },
              { name: "AdaptiveContainer", desc: "Forces a max-width limit on wide viewports (fluid mx-auto bounds).", owner: "Platform Team", status: "Verified" },
              { name: "AdaptiveNavigation", desc: "Dynamically swaps sidebar layout into a comfortable bottom touch bar on mobile.", owner: "Navigation Team", status: "Verified" }
            ].map((contract, idx) => (
              <div key={idx} className="p-4 rounded-2xl border flex flex-col justify-between" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold font-mono" style={{ color: colors.interactive }}>{contract.name}</span>
                    <span className="px-1.5 py-0.5 text-[9px] border font-bold uppercase rounded" style={{ backgroundColor: `${colors.success}1a`, color: colors.success, borderColor: `${colors.success}33` }}>{contract.status}</span>
                  </div>
                  <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>{contract.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t flex justify-between items-center text-[10px]" style={{ borderColor: colors.surfaceOverlay, color: colors.textMuted }}>
                  <span>Owner: {contract.owner}</span>
                </div>
              </div>
            ))}
          </div>
        </AdaptiveCard>

      </div>
    </PageTemplate>
  );
};
