import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Home,
  Newspaper,
  Library,
  Mic,
  BarChart3,
  Settings, BrainCircuit, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  AudioLines,
  FolderOpen,
  Zap,
  Pin
} from "lucide-react";
import { cn } from "../lib/utils";
import { Badge } from "./ui/Badge";
import { TabType } from "../types";
import { colors } from "../foundation/tokens/colors";

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  uiLanguage: "vi" | "en";
  unreadQueueCount?: number;
  unreadRssCount?: number;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  uiLanguage,
  unreadQueueCount = 0,
  unreadRssCount = 0
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("commutecast_sidebar_collapsed") === "true";
    }
    return false;
  });

  const [windowWidth, setWindowWidth] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth;
    }
    return 1280;
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("commutecast_sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isCurrentlyExpanded = !isCollapsed;

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Labels based on language
  const labels = {
    vi: {
      workspace: "Bàn làm việc",
      mission_studio: "Studio Nhiệm vụ",
      library: "Thư viện",
      ai_center: "Trung tâm AI",
      settings: "Cài đặt",
      expand: "Mở rộng",
      collapse: "Thu gọn",
      menu: "Danh mục",
      edition: "PHIÊN BẢN CÁ NHÂN",
      pin: "Ghim mở",
      unpin: "Bỏ ghim"
    },
    en: {
      workspace: "Workspace",
      mission_studio: "Mission Studio",
      library: "Library",
      ai_center: "AI Center",
      settings: "Settings",
      expand: "Expand",
      collapse: "Collapse",
      menu: "Menu",
      edition: "PERSONAL EDITION",
      pin: "Pin Open",
      unpin: "Unpin"
    }
  }[uiLanguage];

  const menuItems = [
    { id: "workspace", label: labels.workspace, icon: Home, badge: null },
    { id: "mission_studio", label: labels.mission_studio, icon: Mic, badge: unreadRssCount > 0 ? unreadRssCount : null },
    { id: "library", label: labels.library, icon: Library, badge: unreadQueueCount > 0 ? unreadQueueCount : null },
    { id: "ai_center", label: labels.ai_center, icon: BrainCircuit, badge: null },
    { id: "settings", label: labels.settings, icon: Settings, badge: null }
  ] as const;

  const APP_VERSION = "4.23.0";

  return (
    <>
      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar-bg/95 backdrop-blur-md border-t border-border-primary z-50 px-2 py-2 flex justify-around items-center shadow-lg">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileOpen(false);
              }}
              className={cn(
                "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative",
                isActive 
                  ? "text-brand-accent"
                  : "text-text-muted hover:text-text-main"
              )}
              style={{ minWidth: "60px" }}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "scale-100")} 
                      style={{ color: isActive ? colors.interactive : colors.textMuted }} />
                {item.badge !== null && (
                  <span className="absolute -top-1.5 -right-2 text-[8px] font-black px-1 rounded-full border transition-colors"
                        style={{ backgroundColor: colors.interactive, color: colors.onAccent, borderColor: colors.surface }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={cn("text-[9px] tracking-widest text-center uppercase font-black", isActive ? "text-text-main" : "text-text-muted")}>
                {item.id === "workspace" ? (uiLanguage === "vi" ? "Tổng quan" : "Home") :
                 item.id === "mission_studio" ? (uiLanguage === "vi" ? "Studio" : "Studio") :
                 item.id === "library" ? (uiLanguage === "vi" ? "Thư viện" : "Library") :
                 item.id === "ai_center" ? (uiLanguage === "vi" ? "AI" : "AI") :
                 (uiLanguage === "vi" ? "Cài đặt" : "Settings")}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeMobileDot" 
                  className="w-1 h-1 bg-brand-accent rounded-full absolute -bottom-1"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* MOBILE DRAWER */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity animate-fade-in" onClick={() => setIsMobileOpen(false)}>
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="w-4/5 max-w-[280px] h-full bg-sidebar-bg border-r border-border-primary p-8 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-10">
              <div className="flex justify-between items-center pb-6 border-b border-border-primary">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0"
                       style={{ background: `linear-gradient(135deg, ${colors.interactive}, ${colors.interactive}99)` }}>
                    <AudioLines className="w-6 h-6" style={{ color: colors.onAccent }} />
                  </div>
                  <div>
                    <span className="font-black text-sm tracking-tight text-text-main">CommuteCast</span>
                    <p className="text-[8px] font-black text-text-muted mt-0.5 tracking-widest uppercase">{labels.edition}</p>
                  </div>
                </div>
                <button onClick={() => setIsMobileOpen(false)} className="p-1 hover:bg-surface-subtle rounded-lg">
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              <div className="space-y-3">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-4 rounded-xl font-black text-xs transition cursor-pointer relative",
                        isActive 
                          ? "bg-brand-accent text-white pl-6"
                          : "text-text-muted hover:bg-surface-subtle hover:text-text-main"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <Icon className={cn("w-4.5 h-4.5 transition-transform", isActive ? "text-white scale-110" : "text-text-muted")} />
                        <span className={cn("uppercase tracking-widest font-black", isActive ? "text-white" : "text-text-muted")}>{item.label}</span>
                      </div>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r bg-brand-accent-hover" />
                      )}
                      {item.badge !== null && (
                        <Badge variant="accent" className="text-[9px] font-black px-2 py-0.5">
                          {item.badge}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pb-8 text-[10px] text-text-muted font-black font-mono space-y-2">
              <p className="tracking-widest">v{APP_VERSION}</p>
              <p className="opacity-50">© 2026 COMMUTECAST ENT.</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <div 
        className={cn(
          "hidden md:block shrink-0 transition-all duration-300 relative z-20 h-full",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <aside 
          className={cn(
            "flex flex-col justify-between bg-sidebar-bg border-r border-border-primary transition-all duration-300 h-full overflow-y-auto custom-scrollbar",
            !isCollapsed ? "w-64" : "w-20"
          )}
        >
          <div className="p-4 space-y-10">
            {/* Header Brand */}
            <div className="flex items-center justify-between pb-6 border-b border-border-primary">
              <div className={cn("flex items-center gap-4 overflow-hidden transition-all", !isCurrentlyExpanded ? "justify-center w-full" : "flex-1")}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0"
                     style={{ background: `linear-gradient(135deg, ${colors.interactive}, ${colors.interactive}99)` }}>
                  <AudioLines className="w-6 h-6" style={{ color: colors.onAccent }} />
                </div>
                {isCurrentlyExpanded && (
                  <div className="animate-fade-in text-left flex-1 flex items-center justify-between">
                    <div>
                      <span className="font-black text-sm tracking-tight text-text-main">CommuteCast</span>
                      <p className="text-[8px] font-black tracking-widest text-text-muted uppercase mt-0.5">{labels.edition}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nav Menu Items */}
            <nav className="space-y-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center rounded-xl transition-all duration-200 relative cursor-pointer select-none",
                      isActive 
                        ? "bg-brand-accent/10 text-brand-accent font-black shadow-sm pl-6 pr-5 py-4" 
                        : "text-text-muted hover:bg-surface-subtle hover:text-text-main px-5 py-4",
                      !isCurrentlyExpanded ? "justify-center p-4" : "justify-between"
                    )}
                    title={!isCurrentlyExpanded ? item.label : undefined}
                  >
                    <div className="flex items-center gap-4">
                      <Icon className={cn("shrink-0 transition-transform", isActive ? "w-5.5 h-5.5 text-brand-accent scale-110" : "w-5 h-5 text-text-muted scale-100")} />
                      {isCurrentlyExpanded && (
                        <span className={cn("text-[11.5px] tracking-widest animate-fade-in uppercase font-black transition-colors", isActive ? "text-text-main" : "text-text-muted")}>{item.label}</span>
                      )}
                    </div>

                    {item.badge !== null && (
                      <Badge variant="accent" className="font-black"
                             style={isActive 
                               ? { backgroundColor: colors.surfaceOverlay, color: colors.textPrimary } 
                               : { backgroundColor: colors.interactive, color: colors.onAccent }}>
                        {item.badge}
                      </Badge>
                    )}

                    {isCurrentlyExpanded && isActive && (
                      <motion.div 
                        layoutId="activeDeskDot" 
                        className="w-1 h-6 rounded-r bg-brand-accent absolute left-0 top-1/2 -translate-y-1/2"
                        initial={{ height: 0 }}
                        animate={{ height: 24 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Collapse Controls */}
          <div className="p-4 border-t border-border-primary flex flex-col gap-2">
            <button
              onClick={handleToggleCollapse}
              className="w-full flex items-center justify-center gap-2 py-3 bg-surface-subtle hover:bg-border-primary border border-border-primary rounded-xl text-text-muted hover:text-text-main text-[10px] transition cursor-pointer select-none font-black uppercase tracking-widest"
              title={isCurrentlyExpanded ? labels.collapse : labels.expand}
            >
              {isCurrentlyExpanded ? (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>{labels.collapse}</span>
                </>
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </aside>
      </div>
    </>
  );
}
