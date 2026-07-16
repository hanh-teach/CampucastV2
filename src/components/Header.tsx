import React from "react";
import { 
  Bell,
  Car, 
  Search, 
  Menu, 
  User, 
  Sparkles, 
  ShieldCheck,
  Bot,
  Radio,
  Sun,
  Moon,
  Languages
} from "lucide-react";
import { User as UserType } from "@supabase/supabase-js";
import { cn } from "../lib/utils";
import { colors } from "../foundation/tokens/colors";
import { useSession } from "../hooks/useSession";
import { useI18n } from "../hooks/useI18n";

interface HeaderProps {
  uiLanguage?: "vi" | "en";
  activeTab: string;
  activeBriefingTitle?: string | null;
  onSearchClick: () => void;
  onDrivingModeToggle?: () => void;
  onNotificationClick: () => void;
  onProfileClick: () => void;
  onAssistantToggle: () => void;
  onLanguageToggle: () => void;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  onMenuToggle?: () => void;
  syncStatus?: string;
  user?: UserType | null;
}

export const Header: React.FC<HeaderProps> = ({
  uiLanguage: propLanguage,
  activeTab,
  activeBriefingTitle,
  onSearchClick,
  onDrivingModeToggle,
  onNotificationClick,
  onProfileClick,
  onAssistantToggle,
  onLanguageToggle,
  onThemeToggle,
  isDarkMode = true,
  onMenuToggle,
  syncStatus,
  user
}) => {
  const { mission } = useSession();
  const { t, lang: hookLanguage } = useI18n();
  const uiLanguage = propLanguage || hookLanguage;

  return (
    <header className="sticky top-0 z-40 w-full bg-header-bg border-b border-border-subtle shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] h-[68px]">
      <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between gap-6">
        
        {/* Left: Branding & Mission Identity */}
        <div className="flex items-center gap-6">
          {onMenuToggle && (
            <button 
              onClick={onMenuToggle}
              className="lg:hidden p-2 text-text-muted hover:bg-surface-subtle rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-md"
                 style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
              <Sparkles className="w-6 h-6 animate-pulse-slow" style={{ color: colors.interactive }} />
            </div>
            
            <div className="hidden sm:block">
              <h1 className="text-base font-black tracking-tight leading-none uppercase" style={{ color: colors.textPrimary }}>
                CommuteCast <span style={{ color: colors.interactive }}>Enterprise</span>
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: colors.success }} />
                <span className="text-[9px] font-black uppercase tracking-[0.15em] font-mono" style={{ color: colors.textMuted }}>
                  {mission?.name || "Mission Protocol 3.2"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Mission Context */}
        <div className="hidden md:flex flex-1 max-w-md justify-center">
           <div className="px-4 py-1.5 border rounded-full flex items-center gap-2 transition-all" 
                style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border }}>
              <div className="w-2 h-2 rounded-full animate-pulse" 
                   style={{ backgroundColor: activeBriefingTitle ? colors.interactive : colors.success }} />
              <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[200px]" 
                    style={{ color: colors.textPrimary }}>
                {activeBriefingTitle 
                  ? `${uiLanguage === "vi" ? "Đang phát" : "Playing"}: ${activeBriefingTitle}` 
                  : mission 
                    ? `${uiLanguage === "vi" ? "Nhiệm vụ" : "Mission"}: ${mission.name}`
                    : `Active Session: ${activeTab}`}
              </span>
           </div>
        </div>

        {/* Right: Actions & Identity */}
        <div className="flex items-center gap-1 sm:gap-2">
          {syncStatus && (
            <div className={cn(
              "hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest",
              syncStatus === "syncing" && "animate-pulse-slow"
            )}
            style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border, color: colors.textMuted }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: syncStatus === "synced" ? colors.success : colors.interactive }} />
              <span>{syncStatus}</span>
            </div>
          )}

          <div className="flex items-center gap-0.5">
            <button 
              onClick={onSearchClick}
              className="p-2.5 text-text-muted hover:bg-surface-subtle hover:text-text-main rounded-xl transition-all group"
              title="Search (Ctrl+K)"
            >
              <Search className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={onDrivingModeToggle}
              className="p-2.5 text-text-muted hover:bg-surface-subtle hover:text-text-main rounded-xl transition-all group"
              title={uiLanguage === "vi" ? "Bật HUD Lái Xe" : "Enable Driving HUD"}
            >
              <Car className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
            </button>

            <button 
              onClick={onAssistantToggle}
              className="p-2.5 text-text-muted hover:bg-surface-subtle hover:text-text-main rounded-xl transition-all group"
              title="CommuteCast Assistant"
            >
              <Bot className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
            </button>

            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg mx-1 border" 
                 style={{ backgroundColor: `${colors.success}1a`, borderColor: `${colors.success}33` }} title="Voice System Status">
              <Radio className="w-3.5 h-3.5 animate-pulse" style={{ color: colors.success }} />
              <span className="text-[9px] font-black uppercase tracking-tighter font-mono" style={{ color: colors.success }}>Voice: Live</span>
            </div>

            <button 
              onClick={onNotificationClick}
              className="relative p-2.5 text-text-muted hover:bg-surface-subtle hover:text-text-main rounded-xl transition-all group"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5 group-hover:scale-110 transition-transform" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full border" 
                    style={{ backgroundColor: colors.critical, borderColor: colors.surface }} />
            </button>

            <button 
              onClick={onThemeToggle}
              className="p-2.5 text-text-muted hover:bg-surface-subtle hover:text-text-main rounded-xl transition-all group"
              title="Switch Theme"
            >
              {isDarkMode ? <Sun className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" /> : <Moon className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />}
            </button>

            <button 
              onClick={onLanguageToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 text-text-muted hover:bg-surface-subtle hover:text-text-main rounded-xl transition-all group font-mono text-xs font-black uppercase tracking-wider"
              title={uiLanguage === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
            >
              <Languages className="w-4.5 h-4.5 text-text-muted group-hover:scale-110 transition-transform" />
              <span className="bg-surface-subtle border border-border-subtle px-1.5 py-0.5 rounded text-[10px] font-black group-hover:border-brand-accent transition-colors">
                {uiLanguage === "vi" ? "VI" : "EN"}
              </span>
            </button>
          </div>

          <div className="w-px h-6 bg-border-subtle mx-2" />

          <button 
            onClick={onProfileClick}
            className="flex items-center gap-3 p-1.5 hover:bg-surface-subtle rounded-xl transition-all group"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md border"
                 style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border, color: colors.onAccent }}>
              <User className="w-5 h-5" />
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-[10px] font-black leading-none uppercase tracking-tighter" style={{ color: colors.textPrimary }}>
                {user?.email || (uiLanguage === "vi" ? "Khách" : "Guest")}
              </p>
              <p className="text-[8px] font-bold uppercase tracking-widest mt-1" style={{ color: colors.textMuted }}>
                {user ? (uiLanguage === "vi" ? "Đã đăng nhập" : "Verified") : (uiLanguage === "vi" ? "Chưa đăng nhập" : "Not Logged In")}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
