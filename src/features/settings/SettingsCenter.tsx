import { colors } from "../../foundation/tokens/colors";
import React, { useState } from "react";
import { 
  Heart,
  Car,
  Compass,
  Clock,
  Music,
  Trash2,
  HardDrive,
  Sun,
  Moon,
  Laptop,
  Check,
  ShieldCheck,
  Coffee,
  BatteryCharging,
  Sliders,
  Sparkles,
  Layers,
  Activity,
  User,
  Workflow
} from "lucide-react";
import { useTheme, ThemeMode } from "../../components/ThemeProvider";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { cn } from "../../lib/utils";

interface SettingsCenterProps {
  uiLanguage?: "vi" | "en";
  onClearAllCache?: () => void;
}

export function SettingsCenter({ uiLanguage = "vi", onClearAllCache }: SettingsCenterProps) {
  const { theme, setTheme } = useTheme();
  
  // High-level Operator Intents (mapped under the hood to preferences)
  const [activeCommuteIntent, setActiveCommuteIntent] = useState<"driving" | "transit" | "active">("transit");
  const [activeTimeIntent, setActiveTimeIntent] = useState<"brief" | "standard" | "deep">("standard");
  const [activeVibeIntent, setActiveVibeIntent] = useState<"relax" | "energetic" | "focused">("relax");
  const [activeStorageIntent, setActiveStorageIntent] = useState<"budget" | "offline">("offline");

  const [cacheStatus, setCacheStatus] = useState<"idle" | "clearing" | "cleared">("idle");

  const t = {
    vi: {
      title: "Cài đặt & Hành trình của bạn",
      subtitle: "Thiết lập cấu hình dựa trên nhu cầu thực tế của bạn, không có biệt ngữ kỹ thuật.",
      commuteTitle: "Hành trình của tôi hôm nay",
      commuteDesc: "Hệ thống sẽ tự động điều chỉnh tốc độ, độ dài và các cảnh báo an toàn phù hợp với phương tiện.",
      timeTitle: "Tôi có bao nhiêu thời gian?",
      timeDesc: "Gemini tự động cô đọng kịch bản vừa vặn với quỹ thời gian di chuyển thực tế của bạn.",
      vibeTitle: "Tôi muốn bắt đầu buổi sáng thế nào?",
      vibeDesc: "Điều chỉnh ngữ điệu, âm thanh nền và năng lượng của người dẫn chương trình AI.",
      storageTitle: "Quản lý dung lượng lưu trữ",
      storageDesc: "Lựa chọn phương thức tối ưu bộ nhớ đệm cho thiết bị của bạn khi đi vào vùng sóng yếu.",
      visualTitle: "Giao diện hiển thị",
      visualDesc: "Chọn chủ đề sáng hoặc tối phù hợp với mắt của bạn khi di chuyển.",
      purgeButton: "Giải phóng bộ nhớ ngoại tuyến",
      purging: "Đang xóa bộ nhớ đệm...",
      purged: "Đã dọn sạch bộ nhớ!"
    },
    en: {
      title: "My Commute Settings",
      subtitle: "Configure your briefing based on real-world needs, fully stripped of developer jargon.",
      commuteTitle: "How am I traveling today?",
      commuteDesc: "System automatically fine-tunes spoken pace, briefing duration, and safety alerts.",
      timeTitle: "How much time do I have?",
      timeDesc: "Gemini automatically compresses or expands the news feed to match your commute duration.",
      vibeTitle: "How do I want to start my day?",
      vibeDesc: "Calibrate the vocal energy, background music style, and tone of your AI Host.",
      storageTitle: "Offline storage model",
      storageDesc: "Select how much offline audio cache is staged for tunnels and signal-free subway rides.",
      visualTitle: "Visual environment",
      visualDesc: "Choose comfortable contrast for reading in cars or during transit.",
      purgeButton: "Purge offline memory cache",
      purging: "Clearing cache memory...",
      purged: "Memory cache cleared!"
    }
  }[uiLanguage];

  const handleClearCache = () => {
    setCacheStatus("clearing");
    setTimeout(() => {
      if (onClearAllCache) onClearAllCache();
      setCacheStatus("cleared");
      setTimeout(() => setCacheStatus("idle"), 2000);
    }, 1200);
  };

  return (
    <div className="space-y-10 animate-fade-in text-left" id="settings-center-root">
      
      {/* 1. HERO CONTEXT BLOCK */}
      <header 
        className="relative rounded-3xl overflow-hidden border p-8 md:p-12"
        style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-brand-accent/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-3 relative z-10">
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-brand-accent border-brand-accent/20">
            {uiLanguage === "vi" ? "Cài đặt cá nhân" : "Operator Persona"}
          </Badge>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
            {t.title}
          </h1>
          <p className="text-xs md:text-sm text-text-muted max-w-xl leading-relaxed">
            {t.subtitle}
          </p>
        </div>
      </header>

      {/* 2. INTENT-FIRST CONFIGURATION MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* INTENT 1: COMMUTE VEHICLE */}
        <Card className="p-6 border border-border-subtle bg-surface-subtle flex flex-col justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-text-main uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-brand-accent" />
              <span>{t.commuteTitle}</span>
            </h3>
            <p className="text-[11px] text-text-muted leading-relaxed">{t.commuteDesc}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "driving", icon: Car, labelVi: "Lái xe", labelEn: "Driving" },
              { id: "transit", icon: Compass, labelVi: "Xe bus/Tàu", labelEn: "Transit" },
              { id: "active", icon: Heart, labelVi: "Vận động", labelEn: "Active" }
            ].map((btn) => {
              const Icon = btn.icon;
              const isSelected = activeCommuteIntent === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setActiveCommuteIntent(btn.id as any)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center gap-1.5 cursor-pointer",
                    isSelected
                      ? "bg-brand-accent/10 border-brand-accent text-brand-accent shadow-sm"
                      : "bg-surface-bg border-border-subtle text-text-muted hover:border-brand-accent/20 hover:text-text-main"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {uiLanguage === "vi" ? btn.labelVi : btn.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* INTENT 2: COMMUTE DURATION */}
        <Card className="p-6 border border-border-subtle bg-surface-subtle flex flex-col justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-text-main uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-accent" />
              <span>{t.timeTitle}</span>
            </h3>
            <p className="text-[11px] text-text-muted leading-relaxed">{t.timeDesc}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "brief", icon: Clock, labelVi: "Tin nhanh", labelEn: "5 Mins" },
              { id: "standard", icon: Workflow, labelVi: "Đầy đủ", labelEn: "15 Mins" },
              { id: "deep", icon: Layers, labelVi: "Chuyên sâu", labelEn: "30 Mins" }
            ].map((btn) => {
              const Icon = btn.icon;
              const isSelected = activeTimeIntent === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setActiveTimeIntent(btn.id as any)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center gap-1.5 cursor-pointer",
                    isSelected
                      ? "bg-brand-accent/10 border-brand-accent text-brand-accent shadow-sm"
                      : "bg-surface-bg border-border-subtle text-text-muted hover:border-brand-accent/20 hover:text-text-main"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {uiLanguage === "vi" ? btn.labelVi : btn.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* INTENT 3: MORNING VIBE */}
        <Card className="p-6 border border-border-subtle bg-surface-subtle flex flex-col justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-text-main uppercase tracking-wider flex items-center gap-2">
              <Coffee className="w-4 h-4 text-brand-accent" />
              <span>{t.vibeTitle}</span>
            </h3>
            <p className="text-[11px] text-text-muted leading-relaxed">{t.vibeDesc}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "relax", icon: Coffee, labelVi: "Thư thái", labelEn: "Gentle" },
              { id: "energetic", icon: BatteryCharging, labelVi: "Sôi nổi", labelEn: "Upbeat" },
              { id: "focused", icon: Activity, labelVi: "Phân tích", labelEn: "Analytical" }
            ].map((btn) => {
              const Icon = btn.icon;
              const isSelected = activeVibeIntent === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setActiveVibeIntent(btn.id as any)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center gap-1.5 cursor-pointer",
                    isSelected
                      ? "bg-brand-accent/10 border-brand-accent text-brand-accent shadow-sm"
                      : "bg-surface-bg border-border-subtle text-text-muted hover:border-brand-accent/20 hover:text-text-main"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {uiLanguage === "vi" ? btn.labelVi : btn.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* INTENT 4: OFFLINE PRELOAD */}
        <Card className="p-6 border border-border-subtle bg-surface-subtle flex flex-col justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-text-main uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-brand-accent" />
              <span>{t.storageTitle}</span>
            </h3>
            <p className="text-[11px] text-text-muted leading-relaxed">{t.storageDesc}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "budget", icon: BatteryCharging, labelVi: "Tiết kiệm dữ liệu", labelEn: "Data Saver" },
              { id: "offline", icon: HardDrive, labelVi: "Sẵn sàng Ngoại tuyến", labelEn: "Lossless Offline" }
            ].map((btn) => {
              const Icon = btn.icon;
              const isSelected = activeStorageIntent === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setActiveStorageIntent(btn.id as any)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center gap-1.5 cursor-pointer",
                    isSelected
                      ? "bg-brand-accent/10 border-brand-accent text-brand-accent shadow-sm"
                      : "bg-surface-bg border-border-subtle text-text-muted hover:border-brand-accent/20 hover:text-text-main"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {uiLanguage === "vi" ? btn.labelVi : btn.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

      </div>

      {/* 3. VISUAL THEME SELECTION & SYSTEM DUSTING */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* VISUAL THEME SELECTOR */}
        <Card className="p-5 border border-border-subtle bg-surface-subtle space-y-4 md:col-span-2 text-left">
          <div className="space-y-1">
            <h4 className="text-xs font-black text-text-main uppercase tracking-wider">{t.visualTitle}</h4>
            <p className="text-[10px] text-text-muted">{t.visualDesc}</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "light", icon: Sun, label: "Light" },
              { id: "dark", icon: Moon, label: "Dark" },
              { id: "auto", icon: Laptop, label: "Auto" }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = theme === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTheme(item.id as ThemeMode)}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all cursor-pointer text-xs font-bold",
                    isActive 
                      ? "bg-brand-accent/10 border-brand-accent text-brand-accent" 
                      : "bg-surface-bg border-border-subtle text-text-muted hover:text-text-main"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* LOCAL AUDIO PURGING */}
        <Card className="p-5 border border-border-subtle bg-surface-subtle flex flex-col justify-between gap-4 text-left">
          <div className="space-y-1">
            <h4 className="text-xs font-black text-text-main uppercase tracking-wider">Cache Operations</h4>
            <p className="text-[9px] text-text-muted leading-normal">
              Purges local index databases to free up storage space. All text is safe.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleClearCache}
            disabled={cacheStatus === "clearing"}
            className="w-full h-10 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 border transition-colors"
            style={{ 
              color: colors.critical, 
              borderColor: `color-mix(in srgb, ${colors.critical}, transparent 80%)` 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${colors.critical}, transparent 90%)`;
              e.currentTarget.style.borderColor = colors.critical;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = `color-mix(in srgb, ${colors.critical}, transparent 80%)`;
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              {cacheStatus === "clearing" && t.purging}
              {cacheStatus === "cleared" && t.purged}
              {cacheStatus === "idle" && t.purgeButton}
            </span>
          </Button>
        </Card>

      </div>

    </div>
  );
}
