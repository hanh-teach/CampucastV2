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
  Workflow,
  Bell,
  MapPin,
  Route,
  Radio,
  AlertTriangle,
  WifiOff,
  BatteryLow,
  Zap
} from "lucide-react";
import { useTheme, ThemeMode } from "../../components/ThemeProvider";
import { useUserPreferences } from "../../components/UserPreferencesProvider";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { BatteryDrainChart } from "../../components/BatteryDrainChart";
import { cn } from "../../lib/utils";

interface SettingsCenterProps {
  uiLanguage?: "vi" | "en";
  onClearAllCache?: () => void;
  onTestTrafficAlert?: () => void;
}

export function SettingsCenter({ uiLanguage = "vi", onClearAllCache, onTestTrafficAlert }: SettingsCenterProps) {
  const { theme, setTheme } = useTheme();
  const { preferences, updatePreferences } = useUserPreferences();
  
  // High-level Operator Intents (mapped under the hood to preferences)
  const [activeCommuteIntent, setActiveCommuteIntent] = useState<"driving" | "transit" | "active">("transit");
  const [activeTimeIntent, setActiveTimeIntent] = useState<"brief" | "standard" | "deep">("standard");
  const [activeVibeIntent, setActiveVibeIntent] = useState<"relax" | "energetic" | "focused">("relax");
  const [activeStorageIntent, setActiveStorageIntent] = useState<"budget" | "offline">("offline");

  const [cacheStatus, setCacheStatus] = useState<"idle" | "clearing" | "cleared">("idle");
  const [alarmTested, setAlarmTested] = useState<boolean>(false);

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

      {/* 2.4 OFFLINE MODE EXPLICIT TOGGLE CARD */}
      <Card className="p-6 border border-amber-500/30 bg-surface-subtle space-y-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20 shrink-0">
              <WifiOff className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase tracking-tight text-text-main">
                  {uiLanguage === "vi" ? "Chế độ Ngoại tuyến (Offline Mode)" : "Offline Mode Toggle"}
                </h3>
                {preferences.isOfflineMode && (
                  <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px] font-mono uppercase px-2.5 py-0.5">
                    {uiLanguage === "vi" ? "Đang bật" : "ACTIVE"}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                {uiLanguage === "vi"
                  ? "Khi bật, hệ thống khóa toàn bộ các truy vấn tải dữ liệu mạng. Tất cả bản tin và RSS sẽ được đọc trực tiếp từ bộ nhớ đệm local đệm sẵn."
                  : "When enabled, network fetching is strictly locked and all feeds/briefings read exclusively from local cached storage."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => updatePreferences({ isOfflineMode: !preferences.isOfflineMode })}
            className={cn(
              "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-start sm:self-auto",
              preferences.isOfflineMode ? "bg-amber-500" : "bg-surface-bg border-border-subtle"
            )}
            aria-pressed={Boolean(preferences.isOfflineMode)}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                preferences.isOfflineMode ? "translate-x-6" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </Card>

      {/* 2.4.5 LOW POWER MODE CARD */}
      <Card className="p-6 border border-emerald-500/30 bg-surface-subtle space-y-4 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 shrink-0">
              <BatteryLow className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black uppercase tracking-tight text-text-main">
                  {uiLanguage === "vi" ? "Chế độ Tiết kiệm Pin (Low Power Mode)" : "Low Power Mode"}
                </h3>
                {preferences.isLowPowerModeEnabled && (
                  <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px] font-mono uppercase px-2.5 py-0.5">
                    {uiLanguage === "vi" ? "Đã bật" : "ENABLED"}
                  </Badge>
                )}
                <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px] font-mono uppercase px-2 py-0.5">
                  {uiLanguage === "vi" ? "Tự động kích hoạt khi Pin < 20%" : "Auto-Trigger: Battery < 20%"}
                </Badge>
              </div>
              <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
                {uiLanguage === "vi"
                  ? "Giảm 80% tần suất gửi telemetry dữ liệu và tạm dừng hoàn toàn việc tự động kiểm tra RSS ngầm khi pin dưới 20% hoặc khi bật thủ công."
                  : "Reduces telemetry sampling frequency by 80% and pauses background RSS polling when device battery falls below 20%."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => updatePreferences({ isLowPowerModeEnabled: !preferences.isLowPowerModeEnabled })}
            className={cn(
              "relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-start sm:self-auto",
              preferences.isLowPowerModeEnabled ? "bg-emerald-500" : "bg-surface-bg border-border-subtle"
            )}
            aria-pressed={Boolean(preferences.isLowPowerModeEnabled)}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                preferences.isLowPowerModeEnabled ? "translate-x-6" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </Card>

      {/* 2.4.6 BATTERY DRAIN TELEMETRY CHART */}
      <BatteryDrainChart uiLanguage={uiLanguage} />

      {/* 2.5 SCHEDULED NEWS RADAR & COMMUTE ROUTE CONFIGURATION */}
      <Card className="p-6 border border-brand-accent/30 bg-surface-subtle space-y-6 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-brand-accent/20 text-brand-accent border-brand-accent/30 text-[10px] uppercase font-bold">
                {uiLanguage === "vi" ? "Tính năng Mới" : "New Feature"}
              </Badge>
              <h3 className="text-base font-black text-text-main flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-accent" />
                <span>{uiLanguage === "vi" ? "Rá-đa Bản Tin Cá Nhân Hóa Theo Lịch Trình Sáng" : "Scheduled Morning Briefing Radar"}</span>
              </h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              {uiLanguage === "vi"
                ? "Tự động tạo bản tin rảnh tay vào thời điểm đi làm dựa trên thời tiết, tình trạng giao thông thực tế tuyến đường và chủ đề yêu thích."
                : "Automatically generates hands-free radio briefing at commute time with real-time weather, route traffic & favorite topics."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-text-main">
              {uiLanguage === "vi" ? "Bật Tự Động 7:30" : "Enable 7:30 Alarm"}
            </span>
            <button
              type="button"
              onClick={() => updatePreferences({ scheduledBriefingEnabled: !preferences.scheduledBriefingEnabled })}
              className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                preferences.scheduledBriefingEnabled ? "bg-brand-accent" : "bg-surface-bg border-border-subtle"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  preferences.scheduledBriefingEnabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Scheduled Time Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-main flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-accent" />
              <span>{uiLanguage === "vi" ? "Giờ Đi Làm (Sáng)" : "Morning Commute Time"}</span>
            </label>
            <input
              type="time"
              value={preferences.scheduledBriefingTime || "07:30"}
              onChange={(e) => updatePreferences({ scheduledBriefingTime: e.target.value })}
              className="w-full px-3 py-2 bg-surface-bg border border-border-subtle rounded-xl text-xs font-mono font-bold text-text-main focus:outline-none focus:border-brand-accent"
            />
            <p className="text-[10px] text-text-muted">
              {uiLanguage === "vi" ? "Mặc định 7:30 sáng hàng ngày" : "Defaults to 07:30 AM daily"}
            </p>
          </div>

          {/* Location Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-main flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-accent" />
              <span>{uiLanguage === "vi" ? "Thành phố / Khu vực" : "City / Location"}</span>
            </label>
            <input
              type="text"
              value={preferences.locationName || "Hà Nội"}
              onChange={(e) => updatePreferences({ locationName: e.target.value })}
              placeholder={uiLanguage === "vi" ? "Ví dụ: Hà Nội, TP.HCM, Đà Nẵng" : "e.g., Hanoi, Saigon, Danang"}
              className="w-full px-3 py-2 bg-surface-bg border border-border-subtle rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-brand-accent"
            />
            <p className="text-[10px] text-text-muted">
              {uiLanguage === "vi" ? "Dùng để quét thời tiết thời gian thực" : "Used for real-time weather scanning"}
            </p>
          </div>

          {/* Commute Route */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-main flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5 text-brand-accent" />
              <span>{uiLanguage === "vi" ? "Tuyến đường đi làm" : "Commute Route"}</span>
            </label>
            <input
              type="text"
              value={preferences.commuteRoute || ""}
              onChange={(e) => updatePreferences({ commuteRoute: e.target.value })}
              placeholder={uiLanguage === "vi" ? "Ví dụ: Cầu Giấy -> Nguyễn Trãi" : "e.g. Times Square -> Wall Street"}
              className="w-full px-3 py-2 bg-surface-bg border border-border-subtle rounded-xl text-xs font-bold text-text-main focus:outline-none focus:border-brand-accent"
            />
            <p className="text-[10px] text-text-muted">
              {uiLanguage === "vi" ? "Gemini quét giao thông thực tế qua Google Search" : "Gemini scans route traffic via Search Grounding"}
            </p>
          </div>
        </div>

        {/* Traffic Break-In Alert Row */}
        <div className="pt-4 border-t border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>{uiLanguage === "vi" ? "Bản Tin Cắt Ngang Khẩn Cấp (Break-in Alert)" : "Break-in Emergency Traffic Alert"}</span>
            </h4>
            <p className="text-[11px] text-text-muted">
              {uiLanguage === "vi"
                ? "Tự động phát âm thanh cảnh báo ngắt đoạn bản tin khi có kẹt xe nghiêm trọng hoặc thời tiết xấu trên tuyến đường đã cài đặt."
                : "Automatically interrupts broadcast with urgent voice audio alert upon severe congestion or bad weather on your route."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-bold text-text-main">
              {uiLanguage === "vi" ? "Bật Cảnh Báo" : "Enable Break-in"}
            </span>
            <button
              type="button"
              onClick={() => updatePreferences({ trafficAlertsEnabled: !preferences.trafficAlertsEnabled })}
              className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                preferences.trafficAlertsEnabled ? "bg-amber-500" : "bg-surface-bg border-border-subtle"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  preferences.trafficAlertsEnabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle/50">
          <div className="flex items-center gap-2 text-[11px] text-text-muted">
            <Radio className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
            <span>
              {uiLanguage === "vi"
                ? `Đã cài đặt: ${preferences.scheduledBriefingTime || "07:30"} • ${preferences.locationName || "Hà Nội"} ${preferences.commuteRoute ? `(${preferences.commuteRoute})` : ""}`
                : `Scheduled: ${preferences.scheduledBriefingTime || "07:30"} • ${preferences.locationName || "Hanoi"} ${preferences.commuteRoute ? `(${preferences.commuteRoute})` : ""}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onTestTrafficAlert && (
              <Button
                size="sm"
                variant="outline"
                onClick={onTestTrafficAlert}
                className="text-[10px] font-bold uppercase tracking-wider h-8 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                {uiLanguage === "vi" ? "Thử Cắt Ngang Cảnh Báo" : "Test Break-In Alert"}
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAlarmTested(true);
                if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted") {
                  Notification.requestPermission();
                }
                setTimeout(() => setAlarmTested(false), 3000);
              }}
              className="text-[10px] font-bold uppercase tracking-wider h-8 border-brand-accent/30 text-brand-accent hover:bg-brand-accent/10"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {alarmTested
                ? (uiLanguage === "vi" ? "Đã Kích Hoạt Thử Báo Thức!" : "Alarm Test Triggered!")
                : (uiLanguage === "vi" ? "Thử Nghiệm Báo Thức 7:30 Ngay" : "Test 7:30 AM Radar Alarm")}
            </Button>
          </div>
        </div>
      </Card>

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
