import { ThreePanelLayout } from "../../layouts/ThreePanelLayout";
import React, { useState, useEffect } from "react";
import { PERSONALAS } from "../../utils/personaData";
import { 
  User, 
  Settings2, 
  Volume2, 
  Sparkles, 
  Cloud, 
  HardDrive, 
  HelpCircle,
  Smartphone,
  CheckCircle,
  Mic,
  Activity,
  Database,
  Trash2,
  Cpu,
  BookOpen,
  Globe,
  MessageSquare,
  ShieldCheck,
  Rss,
  Sun,
  Moon,
  Laptop,
  Leaf,
  Pin,
  Play,
  Loader2,
  LogOut
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useTheme } from "../ThemeProvider";
import type { ThemeMode } from "../ThemeProvider";
import { useAdaptive } from "../../layouts/AdaptiveContext";
import { DeviceType, SettingsSubTab } from "../../types";
import { PageTemplate } from "../../foundation/PageTemplate";
import { AdaptiveGrid } from "../../foundation/AdaptiveGrid";
import { colors } from "../../foundation/tokens/colors";
import { getTopPreferences } from "../../services/preferenceService";
import { UserPreference } from "../../types/preference";
import { SyncStatus } from "../../hooks/useSync";
import { getLastSyncTimestamp } from "../../services/syncService";
import LoginModal from "../LoginModal";
import HelpCenterModal from "../HelpCenterModal";
import { getSupabaseClientAsync } from "../../services/supabaseClient";
import { useAuthActions } from "../../hooks/useAuthActions";
import { usePwaStatus } from "../../hooks/usePwaStatus";
import { getStorageEstimate } from "../../services/storageService";

interface SettingsViewProps {
  uiLanguage: "vi" | "en";
  setUiLanguage?: (lang: "vi" | "en") => void;
  preferences: any;
  setPreferences: (prefs: any) => void;
  onClearAllCache: (options: { clearCloud: boolean }) => Promise<any>;
  storageUsage?: { usedMB: number; totalMB: number };
  syncStatus?: SyncStatus;
  isOnline?: boolean;
  triggerSync?: () => Promise<void>;
  abortSync?: () => void;
  user?: any;
  onNavigateToChat?: () => void;
  onOpenLogin?: () => void;
  activeCategory: SettingsSubTab;
  onCategoryChange: (category: SettingsSubTab) => void;
}

type SettingsCategory = "personal" | "listening" | "content" | "interests" | "sync" | "system" | "help";

export default function SettingsTabView({
  uiLanguage,
  setUiLanguage,
  preferences,
  setPreferences,
  onClearAllCache,
  storageUsage = { usedMB: 14.2, totalMB: 512 },
  syncStatus = "unauthenticated",
  isOnline = true,
  triggerSync = async () => {},
  abortSync = () => {},
  user = null,
  onNavigateToChat = () => {},
  onOpenLogin = () => {},
  activeCategory,
  onCategoryChange
}: SettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const { device } = useAdaptive();
  const isMobile = device === DeviceType.Mobile;
  const [isClearing, setIsClearing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [topInterests, setTopInterests] = useState<UserPreference[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearCloud, setClearCloud] = useState(false);
  const [clearSuccess, setClearSuccess] = useState<boolean | null>(null);
  const [availableVoices, setAvailableVoices] = useState<Array<{ id: string; name: string; lang: string }>>([
    { id: "vi-HN", name: "Giọng Miền Bắc (Nữ - Hoài My)", lang: "vi" },
    { id: "vi-HCM", name: "Giọng Miền Nam (Nam - Nam Minh)", lang: "vi" },
    { id: "en-US", name: "English (Jenny)", lang: "en" },
    { id: "en-UK", name: "English (Sonia)", lang: "en" }
  ]);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  // Auth & PWA status hooks
  const { changePassword, signOutCurrentDevice } = useAuthActions();
  const { isInstalled, canInstall, promptInstall, cacheVersion, checkForUpdate } = usePwaStatus();

  // State for security (password change)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // State for PWA
  const [pwaStorageUsed, setPwaStorageUsed] = useState<number | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);

  const isPasswordValid = newPassword.length >= 8 && newPassword === confirmPassword;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;
    setIsChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    
    const { error } = await changePassword(newPassword);
    if (error) {
      setPasswordError(uiLanguage === "vi" ? `Lỗi: ${error}` : `Error: ${error}`);
    } else {
      setPasswordSuccess(
        uiLanguage === "vi" 
          ? "Đã cập nhật mật khẩu thành công!" 
          : "Password updated successfully!"
      );
      setNewPassword("");
      setConfirmPassword("");
    }
    setIsChangingPassword(false);
  };

  const handleSignOut = async () => {
    await signOutCurrentDevice();
    window.location.reload();
  };

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    try {
      await checkForUpdate();
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setLastCheckTime(`${hours}:${minutes}`);
    } catch (err) {
      console.error("Check update error:", err);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  useEffect(() => {
    if (activeCategory === "pwa") {
      getStorageEstimate()
        .then((estimate) => {
          setPwaStorageUsed(estimate.usedMB);
        })
        .catch((err) => {
          console.error("Failed to load storage estimate:", err);
        });
    }
  }, [activeCategory]);

  useEffect(() => {
    fetch("/api/voices")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableVoices(data);
        }
      })
      .catch(err => console.error("Failed to load voices:", err));
  }, []);

  const playVoicePreview = async (voiceId: string, lang: string) => {
    if (previewingVoice) return;
    setPreviewingVoice(voiceId);
    try {
      const response = await fetch("/api/tts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice: voiceId, lang })
      });
      const data = await response.json();
      if (data.success && data.audioBase64) {
        const audioSrc = `data:audio/mp3;base64,${data.audioBase64}`;
        const audio = new Audio(audioSrc);
        audio.onended = () => setPreviewingVoice(null);
        audio.onerror = () => setPreviewingVoice(null);
        await audio.play();
      } else {
        throw new Error(data.error || "Preview failed");
      }
    } catch (err) {
      console.error("Preview error:", err);
      setPreviewingVoice(null);
    }
  };

  const handleComprehensiveClear = async (deleteCloudData: boolean) => {
    setIsClearing(true);
    setConfirmOpen(false);
    try {
      const result = await onClearAllCache({ clearCloud: deleteCloudData });
      if (result) {
        setClearSuccess(true);
      } else {
        setClearSuccess(false);
      }
    } catch (err) {
      console.error("Comprehensive clear failed:", err);
      setClearSuccess(false);
    } finally {
      setIsClearing(false);
      setTimeout(() => setClearSuccess(null), 5000);
    }
  };

  useEffect(() => {
    setLastSyncTime(getLastSyncTimestamp());
  }, [syncStatus]);

  // Pin state for Quick Help panel
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    return localStorage.getItem("settings_panel_c_pinned") === "true";
  });

  useEffect(() => {
    localStorage.setItem("settings_panel_c_pinned", String(isPinned));
  }, [isPinned]);


  const t = {
    vi: {
      title: "Cài đặt hệ thống",
      subtitle: "Cấu hình trung tâm điều hành và cá nhân hóa trải nghiệm AI Host",
      general: "Chung",
      appearance: "Giao diện",
      storage: "Lưu trữ",
      sync: "Đồng bộ",
      security: "Bảo mật",
      pwa: "Ứng dụng PWA",
      about: "Giới thiệu",
      themeLabel: "Giao diện hiển thị",
      languageLabel: "Ngôn ngữ giao diện",
      voiceLabel: "Giọng đọc AI Host",
      speedLabel: "Tốc độ truyền tin",
      pitchLabel: "Sắc thái giọng đọc",
      storageLabel: "Bộ nhớ ngoại tuyến",
      cacheDesc: "Xóa toàn bộ bản ghi âm thanh cục bộ, lịch sử giọng nói và dọn sạch bộ nhớ đệm server (giữ lại phiên đăng nhập).",
      purgeButton: "Dọn dẹp hệ thống",
      versionLabel: "Phiên bản hệ thống",
      autoSync: "Tự động đồng bộ đám mây",
      helpCenter: "Trung tâm trợ giúp",
      feedback: "Gửi phản hồi"
    },
    en: {
      title: "System Settings",
      subtitle: "Configure operator desk and personalize AI Host experience",
      general: "General",
      appearance: "Appearance",
      storage: "Storage",
      sync: "Sync",
      security: "Security",
      pwa: "PWA",
      about: "About",
      themeLabel: "Visual Theme",
      languageLabel: "UI Language",
      voiceLabel: "AI Host Voice",
      speedLabel: "Delivery Speed",
      pitchLabel: "Vocal Tone",
      storageLabel: "Offline Storage",
      cacheDesc: "Purge all local recordings, voice query history, and clear server TTS cache (login sessions preserved).",
      purgeButton: "Purge System",
      versionLabel: "System Version",
      autoSync: "Auto Cloud Sync",
      helpCenter: "Help Center",
      feedback: "Send Feedback"
    }
  }[uiLanguage];

  const updatePreference = (key: string, value: any) => {
    setPreferences({ [key]: value });
  };

  const categories: { id: SettingsSubTab; label: string; icon: any }[] = [
    { id: "general", label: t.general, icon: User },
    { id: "appearance", label: t.appearance, icon: Settings2 },
    { id: "storage", label: t.storage, icon: HardDrive },
    { id: "sync", label: t.sync, icon: Cloud },
    { id: "security", label: t.security, icon: ShieldCheck },
    { id: "pwa", label: t.pwa, icon: Smartphone },
    { id: "about", label: t.about, icon: HelpCircle }
  ];

  return (
    <PageTemplate
      className="h-[calc(100vh-4rem)] min-h-0 bg-surface-bg text-left animate-fade-in flex flex-col overflow-hidden"
      id="settings-view-root"
      header={
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full">
          <div>
            <h1 className="text-2xl font-black text-text-main tracking-tight uppercase flex items-center gap-3">
              <Settings2 className="w-6 h-6 text-brand-accent" />
              <span>{t.title}</span>
            </h1>
            <p className="text-[10px] text-text-muted font-mono tracking-wider mt-1 uppercase opacity-60">
              {t.subtitle}
            </p>
          </div>
        </div>
      }
    >
      
      <ThreePanelLayout
        leftPanelClassName={cn("p-6 flex flex-col", isMobile ? "w-full border-b border-border-subtle" : "w-72 border-r border-border-subtle justify-between")}
        mainPanelClassName="bg-surface-bg border-r border-border-subtle overflow-y-auto custom-scrollbar p-10"
        rightPanelClassName={cn(
            "border-l border-border-subtle bg-surface-subtle p-8 space-y-10 transition-all",
            isMobile && !isPinned ? "hidden" : (isPinned || isHovered ? "w-80" : "w-16")
        )}
        leftPanel={
          <div className={cn("space-y-1.5", isMobile ? "grid grid-cols-3 gap-2" : "space-y-1.5")}>
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-black transition-all group relative",
                    isMobile ? "justify-center" : "w-full",
                    isActive 
                      ? "bg-brand-accent shadow-sm translate-x-1" 
                      : "text-text-muted hover:bg-surface-bg hover:text-text-main"
                  )}
                  style={isActive ? { color: colors.onAccent } : {}}
                >
                  <Icon 
                    className={cn("w-4 h-4", isActive ? "" : "text-text-muted group-hover:text-brand-accent")} 
                    style={isActive ? { color: colors.onAccent } : {}}
                  />
                  {!isMobile && <span className="uppercase tracking-widest">{cat.label}</span>}
                </button>
              );
            })}
          </div>
        }
        mainPanel={
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="text-2xl font-black text-text-main uppercase tracking-tight border-b border-border-subtle pb-6">
              {categories.find(c => c.id === activeCategory)?.label}
            </h2>

            {/* CATEGORY CONTENT */}
            <div className="space-y-10">
              {activeCategory === "general" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                  <section className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-3xl bg-brand-accent flex items-center justify-center shadow-lg">
                        <User className="w-10 h-10" style={{ color: colors.onAccent }} />
                      </div>
                      <div>
                        {user ? (
                          <>
                            <h3 className="text-xl font-black text-text-main uppercase tracking-tight break-all" title={user.email}>{user.email}</h3>
                            <p className="text-sm text-text-muted font-medium mt-1">
                              {uiLanguage === "vi" ? "Đã đăng nhập" : "Signed In"}
                            </p>
                            <Button 
                              variant="outline" 
                              className="mt-4 text-xs font-bold" 
                              onClick={async () => {
                                const supabase = await getSupabaseClientAsync();
                                if (supabase) {
                                  await supabase.auth.signOut();
                                  window.location.reload();
                                }
                              }}
                            >
                              <LogOut className="w-3.5 h-3.5 mr-2" />
                              {uiLanguage === "vi" ? "Đăng xuất" : "Sign Out"}
                            </Button>
                          </>
                        ) : (
                          <>
                            <h3 className="text-xl font-black text-text-main uppercase tracking-tight">
                              {uiLanguage === "vi" ? "Chưa đăng nhập" : "Not Logged In"}
                            </h3>
                            <p className="text-sm text-text-muted font-medium mt-1">
                              {uiLanguage === "vi" ? "Đăng nhập để đồng bộ dữ liệu" : "Sign in to sync your data"}
                            </p>
                            <Button 
                              className="mt-4 text-xs font-bold bg-brand-accent text-on-accent" 
                              onClick={onOpenLogin}
                            >
                              {uiLanguage === "vi" ? "Đăng nhập ngay" : "Sign In Now"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeCategory === "appearance" && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
                  <section className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block">{t.themeLabel}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: "light" as ThemeMode, icon: Sun, label: uiLanguage === "vi" ? "Sáng" : "Light" },
                        { id: "dark" as ThemeMode, icon: Moon, label: uiLanguage === "vi" ? "Tối" : "Dark" },
                        { id: "eyecare" as ThemeMode, icon: Leaf, label: uiLanguage === "vi" ? "Dịu mắt" : "Soft" },
                        { id: "auto" as ThemeMode, icon: Laptop, label: uiLanguage === "vi" ? "Hệ thống" : "System" }
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setTheme(m.id)}
                          className={cn(
                            "flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all",
                            theme === m.id 
                              ? "bg-brand-accent border-brand-accent" 
                              : "border-border-subtle hover:border-brand-accent/50 text-text-muted"
                          )}
                          style={theme === m.id ? { color: colors.onAccent } : {}}
                        >
                          <m.icon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block">{t.languageLabel}</label>
                    <div className="flex gap-3">
                      {[
                        { id: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
                        { id: "en", label: "English", flag: "🇺🇸" }
                      ].map((l) => (
                        <button
                          key={l.id}
                          onClick={() => setUiLanguage?.(l.id as "vi" | "en")}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all font-black text-xs uppercase tracking-widest",
                            uiLanguage === l.id 
                              ? "bg-brand-accent border-brand-accent" 
                              : "border-border-subtle hover:border-brand-accent/50 text-text-muted"
                          )}
                          style={uiLanguage === l.id ? { color: colors.onAccent } : {}}
                        >
                          <span>{l.flag}</span>
                          <span>{l.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                  <Card className="p-8 space-y-8 bg-surface-subtle border-none">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                        <Mic className="w-3 h-3" /> {t.voiceLabel}
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableVoices.map(v => {
                          const isSelected = preferences.voice === v.id;
                          const isPreviewing = previewingVoice === v.id;
                          return (
                            <div 
                              key={v.id}
                              className={cn(
                                "flex items-center justify-between p-4 rounded-xl border transition-all",
                                isSelected ? "bg-brand-accent/10 border-brand-accent" : "border-border-subtle hover:border-brand-accent/40 bg-surface-main/30"
                              )}
                            >
                              <button 
                                onClick={() => updatePreference("voice", v.id)}
                                className="flex-1 text-left"
                              >
                                <span className={cn(
                                  "block text-sm font-black uppercase tracking-tight",
                                  isSelected ? "text-brand-accent" : "text-text-main"
                                )}>
                                  {v.name}
                                </span>
                                <span className="block text-[10px] font-mono text-text-muted mt-0.5">
                                  ID: {v.id} • Language: {v.lang.toUpperCase()}
                                </span>
                              </button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playVoicePreview(v.id, v.lang);
                                }}
                                className={cn(
                                  "w-10 h-10 rounded-full p-0 flex items-center justify-center transition-all shrink-0 ml-2 border",
                                  isPreviewing 
                                    ? "bg-brand-accent border-brand-accent text-white animate-pulse" 
                                    : "border-border-subtle hover:border-brand-accent hover:text-brand-accent"
                                )}
                                disabled={previewingVoice !== null && !isPreviewing}
                              >
                                {isPreviewing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                )}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">{t.speedLabel}</label>
                          <span className="font-mono text-xs text-brand-accent">{preferences.speed}x</span>
                        </div>
                        <input 
                          type="range" min="0.5" max="2" step="0.1" 
                          value={preferences.speed} 
                          onChange={(e) => updatePreference("speed", parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-border-subtle rounded-lg appearance-none cursor-pointer accent-brand-accent"
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              )}



              {activeCategory === "storage" && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
                  {clearSuccess !== null && (
                    <div className="p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border text-xs font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: clearSuccess ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        borderColor: clearSuccess ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        color: clearSuccess ? "#10b981" : "#ef4444"
                      }}
                    >
                      {clearSuccess ? (
                        <>
                          <CheckCircle className="w-5 h-5 shrink-0" />
                          <span>
                            {uiLanguage === "vi"
                              ? "Đã dọn dẹp hệ thống thành công!"
                              : "System successfully purged!"}
                          </span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-5 h-5 shrink-0" />
                          <span>
                            {uiLanguage === "vi"
                              ? "Dọn dẹp thất bại hoặc hoàn thành có lỗi."
                              : "Purge completed with errors or failed."}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  <Card className="p-8 border-border-subtle space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-surface-subtle rounded-2xl">
                        <Database className="w-6 h-6 text-brand-accent" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight">{t.storageLabel}</h4>
                        <p className="text-xs text-text-muted mt-1">{t.cacheDesc}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-text-muted">Usage</span>
                        <span className="text-brand-accent">{storageUsage.usedMB} MB / {storageUsage.totalMB} MB</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-bg rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-accent" 
                          style={{ width: `${(storageUsage.usedMB / storageUsage.totalMB) * 100}%` }}
                        />
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase text-[10px] font-black tracking-widest h-12"
                      onClick={() => {
                        setConfirmOpen(true);
                      }}
                      disabled={isClearing}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isClearing ? "PURGING..." : t.purgeButton}
                    </Button>
                  </Card>
                </div>
              )}

              {activeCategory === "sync" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                  <Card className="p-8 border-border-subtle space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-surface-subtle rounded-2xl">
                        <Cloud className="w-6 h-6 text-brand-accent" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight">{t.autoSync}</h4>
                        <p className="text-xs text-text-muted mt-1">
                          {uiLanguage === "vi" 
                            ? "Tự động đồng bộ các thay đổi mới nhất lên đám mây" 
                            : "Automatically sync latest changes to the cloud"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-surface-subtle p-5 rounded-2xl border border-border-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1 text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                          {uiLanguage === "vi" ? "Trạng thái hiện tại" : "Current Status"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2.5 h-2.5 rounded-full animate-pulse",
                            syncStatus === "synced" && "bg-green-500",
                            syncStatus === "syncing" && "bg-blue-500",
                            syncStatus === "offline" && "bg-gray-500",
                            syncStatus === "error" && "bg-red-500",
                            syncStatus === "unauthenticated" && "bg-amber-500"
                          )} />
                          <h5 className="text-sm font-bold uppercase tracking-tight">
                            {
                              {
                                synced: uiLanguage === "vi" ? "Đã đồng bộ thành công" : "Synced Successfully",
                                syncing: uiLanguage === "vi" ? "Đang tiến hành đồng bộ..." : "Syncing in progress...",
                                offline: uiLanguage === "vi" ? "Ngoại tuyến (Offline)" : "Offline",
                                error: uiLanguage === "vi" ? "Lỗi đồng bộ đám mây" : "Cloud Sync Error",
                                unauthenticated: uiLanguage === "vi" ? "Chưa đăng nhập tài khoản" : "Unauthenticated"
                              }[syncStatus]
                            }
                          </h5>
                        </div>
                      </div>

                      <div className="text-left sm:text-right space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                          {uiLanguage === "vi" ? "Đồng bộ gần nhất" : "Last Synchronized"}
                        </span>
                        <p className="text-xs font-mono text-text-main">
                          {lastSyncTime ? new Date(lastSyncTime).toLocaleString(uiLanguage === "vi" ? "vi-VN" : "en-US") : (uiLanguage === "vi" ? "Chưa từng đồng bộ" : "Never Synced")}
                        </p>
                      </div>
                    </div>

                    {!user ? (
                      <Button 
                        className="w-full h-12 uppercase text-[10px] font-black tracking-widest"
                        onClick={onOpenLogin}
                      >
                        {uiLanguage === "vi" ? "Đăng nhập để đồng bộ" : "Log In to Sync"}
                      </Button>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                           className="flex-1 h-12 uppercase text-[10px] font-black tracking-widest"
                          onClick={triggerSync}
                          disabled={syncStatus === "syncing" || !isOnline}
                        >
                          {syncStatus === "syncing" 
                            ? (uiLanguage === "vi" ? "Đang tiến hành đồng bộ..." : "Syncing...") 
                            : (uiLanguage === "vi" ? "Bắt đầu đồng bộ" : "Start Sync")}
                        </Button>
                        
                        {syncStatus === "syncing" && (
                          <Button
                            variant="outline"
                            className="h-12 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase text-[10px] font-black tracking-widest px-6"
                            onClick={() => {
                              if (window.confirm(uiLanguage === "vi" ? "Bạn có chắc muốn hủy đồng bộ?" : "Are you sure you want to abort sync?")) {
                                abortSync();
                              }
                            }}
                          >
                            {uiLanguage === "vi" ? "Hủy" : "Abort"}
                          </Button>
                        )}
                      </div>
                    )}

                  </Card>
                </div>
              )}

              {activeCategory === "security" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                  {/* Khối 1: Đổi mật khẩu */}
                  <Card className="p-8 border-border-subtle space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-surface-subtle rounded-2xl">
                        <ShieldCheck className="w-6 h-6 text-brand-accent" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight">
                          {uiLanguage === "vi" ? "Đổi mật khẩu" : "Change Password"}
                        </h4>
                        <p className="text-xs text-text-muted mt-1">
                          {uiLanguage === "vi" 
                            ? "Cập nhật mật khẩu mới cho tài khoản của bạn (tối thiểu 8 ký tự)" 
                            : "Update a new password for your account (minimum 8 characters)"}
                        </p>
                      </div>
                    </div>

                    {!user ? (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-xs text-amber-500 font-bold uppercase tracking-wider text-center">
                        {uiLanguage === "vi" 
                          ? "Vui lòng đăng nhập để đổi mật khẩu" 
                          : "Please sign in to change your password"}
                      </div>
                    ) : (
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block">
                            {uiLanguage === "vi" ? "Mật khẩu mới" : "New Password"}
                          </label>
                          <input
                            type="password"
                            placeholder={uiLanguage === "vi" ? "Nhập mật khẩu mới..." : "Enter new password..."}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm focus:outline-none focus:border-brand-accent text-text-main transition-colors"
                            disabled={isChangingPassword}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block">
                            {uiLanguage === "vi" ? "Xác nhận mật khẩu" : "Confirm Password"}
                          </label>
                          <input
                            type="password"
                            placeholder={uiLanguage === "vi" ? "Xác nhận mật khẩu mới..." : "Confirm new password..."}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm focus:outline-none focus:border-brand-accent text-text-main transition-colors"
                            disabled={isChangingPassword}
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={!isPasswordValid || isChangingPassword}
                          className="w-full h-12 uppercase text-[10px] font-black tracking-widest bg-brand-accent text-on-accent"
                        >
                          {isChangingPassword 
                            ? (uiLanguage === "vi" ? "ĐANG CẬP NHẬT..." : "UPDATING...") 
                            : (uiLanguage === "vi" ? "Cập nhật mật khẩu" : "Update Password")}
                        </Button>

                        {passwordError && (
                          <p className="text-xs font-bold text-red-500 mt-2">{passwordError}</p>
                        )}
                        {passwordSuccess && (
                          <p className="text-xs font-bold text-green-500 mt-2">{passwordSuccess}</p>
                        )}
                      </form>
                    )}
                  </Card>

                  {/* Khối 2: Phiên đăng nhập */}
                  <Card className="p-8 border-border-subtle space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-surface-subtle rounded-2xl">
                        <User className="w-6 h-6 text-brand-accent" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight">
                          {uiLanguage === "vi" ? "Phiên đăng nhập" : "Login Session"}
                        </h4>
                        <p className="text-xs text-text-muted mt-1">
                          {uiLanguage === "vi"
                            ? "Quản lý kết nối tài khoản trên thiết bị hiện tại"
                            : "Manage your account connection on this current device"}
                        </p>
                      </div>
                    </div>

                    {!user ? (
                      <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-xs text-amber-500 font-bold uppercase tracking-wider text-center">
                        {uiLanguage === "vi" 
                          ? "Bạn chưa đăng nhập" 
                          : "You are not logged in"}
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={handleSignOut}
                        className="w-full h-12 uppercase text-[10px] font-black tracking-widest border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        {uiLanguage === "vi" ? "Đăng xuất khỏi thiết bị này" : "Sign Out of This Device"}
                      </Button>
                    )}
                  </Card>
                </div>
              )}

              {activeCategory === "pwa" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                  {/* Khối 1: Trạng thái cài đặt */}
                  <Card className="p-8 border-border-subtle space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-surface-subtle rounded-2xl">
                          <Smartphone className="w-6 h-6 text-brand-accent" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-tight">
                            {uiLanguage === "vi" ? "Trạng thái ứng dụng" : "App Status"}
                          </h4>
                          <p className="text-xs text-text-muted mt-1">
                            {uiLanguage === "vi" 
                              ? "Kiểm tra tình trạng cài đặt PWA" 
                              : "Check PWA installation status"}
                          </p>
                        </div>
                      </div>
                      <Badge className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                        isInstalled 
                          ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      )}>
                        {isInstalled 
                          ? (uiLanguage === "vi" ? "Đã cài đặt" : "Installed") 
                          : (uiLanguage === "vi" ? "Chưa cài đặt" : "Not Installed")}
                      </Badge>
                    </div>

                    <div className="pt-4 border-t border-border-subtle flex justify-between items-center text-xs">
                      <span className="text-text-muted font-medium">
                        {uiLanguage === "vi" 
                          ? "Dung lượng ứng dụng (bao gồm cache offline)" 
                          : "Application Storage (includes offline cache)"}
                      </span>
                      <span className="font-mono font-bold text-brand-accent">
                        {pwaStorageUsed !== null ? `${pwaStorageUsed.toFixed(2)} MB` : "..."}
                      </span>
                    </div>
                  </Card>

                  {/* Khối 2: Cài đặt ứng dụng - Ẩn hoàn toàn nếu canInstall === false */}
                  {canInstall && (
                    <Card className="p-8 border-border-subtle space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-surface-subtle rounded-2xl">
                          <Sparkles className="w-6 h-6 text-brand-accent" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-tight">
                            {uiLanguage === "vi" ? "Cài đặt CommuteCast" : "Install CommuteCast"}
                          </h4>
                          <p className="text-xs text-text-muted mt-1">
                            {uiLanguage === "vi"
                              ? "Trải nghiệm ứng dụng mượt mà không cần trình duyệt"
                              : "Experience the app seamlessly without browser navigation"}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={promptInstall}
                        className="w-full h-12 uppercase text-[10px] font-black tracking-widest bg-brand-accent text-on-accent"
                      >
                        {uiLanguage === "vi" ? "Cài đặt ứng dụng" : "Install App"}
                      </Button>
                    </Card>
                  )}

                  {/* Khối 3: Phiên bản cache */}
                  <Card className="p-8 border-border-subtle space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-surface-subtle rounded-2xl">
                        <Activity className="w-6 h-6 text-brand-accent" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight">
                          {uiLanguage === "vi" ? "Phiên bản Cache" : "Cache Version"}
                        </h4>
                        <p className="text-xs text-text-muted mt-1">
                          {uiLanguage === "vi"
                            ? "Phiên bản dữ liệu và mã nguồn lưu ngoại tuyến"
                            : "Offline assets and data container version"}
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border-subtle flex justify-between items-center text-xs">
                      <span className="text-text-muted font-medium">
                        {uiLanguage === "vi" ? "Phiên bản hiện tại" : "Current Version"}
                      </span>
                      <span className="font-mono font-bold text-text-main">
                        {cacheVersion}
                      </span>
                    </div>
                  </Card>

                  {/* Khối 4: Kiểm tra cập nhật */}
                  <Card className="p-8 border-border-subtle space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-surface-subtle rounded-2xl">
                        <Cpu className="w-6 h-6 text-brand-accent" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight">
                          {uiLanguage === "vi" ? "Cập nhật ứng dụng" : "App Updates"}
                        </h4>
                        <p className="text-xs text-text-muted mt-1">
                          {uiLanguage === "vi"
                            ? "Yêu cầu Service Worker kiểm tra phiên bản mới nhất từ server"
                            : "Trigger service worker to check for the latest update from server"}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={handleCheckUpdate}
                      disabled={isCheckingUpdate}
                      className="w-full h-12 uppercase text-[10px] font-black tracking-widest bg-brand-accent text-on-accent flex items-center justify-center gap-2"
                    >
                      {isCheckingUpdate ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{uiLanguage === "vi" ? "ĐANG KIỂM TRA..." : "CHECKING..."}</span>
                        </>
                      ) : (
                        <span>{uiLanguage === "vi" ? "Kiểm tra cập nhật" : "Check for Updates"}</span>
                      )}
                    </Button>

                    {lastCheckTime && (
                      <p className="text-xs text-center text-text-muted font-medium">
                        {uiLanguage === "vi" 
                          ? `Đã kiểm tra lúc ${lastCheckTime}` 
                          : `Last checked at ${lastCheckTime}`}
                      </p>
                    )}
                  </Card>
                </div>
              )}



              {activeCategory === "about" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { q: uiLanguage === "vi" ? "Cách tạo bản tin?" : "How to create a briefing?", a: uiLanguage === "vi" ? "Chọn nguồn RSS và nhấn 'Tổng hợp'." : "Select RSS sources and click 'Synthesize'." },
                      { q: uiLanguage === "vi" ? "Dùng mic thế nào?" : "How to use mic?", a: uiLanguage === "vi" ? "Nhấn biểu tượng micro và đặt câu hỏi." : "Click the mic icon and ask your question." },
                      { q: uiLanguage === "vi" ? "Thêm nguồn RSS?" : "Add RSS source?", a: uiLanguage === "vi" ? "Trong tab RSS, nhập link và thêm." : "In RSS tab, enter link and add." },
                      { q: uiLanguage === "vi" ? "Đồng bộ đám mây?" : "Cloud sync?", a: uiLanguage === "vi" ? "Cài đặt > Đồng bộ > Bắt đầu." : "Settings > Sync > Start." },
                      { q: uiLanguage === "vi" ? "Dọn dẹp hệ thống?" : "System purge?", a: uiLanguage === "vi" ? "Cài đặt > Hệ thống > Dọn dẹp." : "Settings > System > Purge." },
                      { q: uiLanguage === "vi" ? "Thay đổi giao diện?" : "Change theme?", a: uiLanguage === "vi" ? "Cài đặt > Hệ thống > Giao diện." : "Settings > System > Theme." },
                    ].map((item, idx) => (
                      <Card key={idx} className="p-5 border-border-subtle">
                        <h4 className="text-xs font-black uppercase text-text-main mb-1">{item.q}</h4>
                        <p className="text-[10px] text-text-muted">{item.a}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        }
        rightPanel={
          <div 
            className="space-y-8 h-full flex flex-col"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1 opacity-50 block">Quick Help</span>
              <button 
                onClick={() => setIsPinned(!isPinned)}
                className={cn("p-1 rounded-md transition-colors", isPinned ? "text-brand-accent" : "text-text-muted hover:text-text-main")}
              >
                <Pin className={cn("w-4 h-4", isPinned && "fill-current")} />
              </button>
            </div>

            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start text-[10px] font-black uppercase tracking-widest h-12 border-border-subtle hover:bg-surface-bg"
                onClick={() => setIsHelpOpen(true)}
              >
                <BookOpen className="w-4 h-4 mr-3 text-brand-accent" />
                {uiLanguage === "vi" ? "Hướng dẫn sử dụng" : "User Manual"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-[10px] font-black uppercase tracking-widest h-12 border-border-subtle hover:bg-surface-bg opacity-50 cursor-not-allowed"
                title="Sắp ra mắt"
              >
                <Globe className="w-4 h-4 mr-3 text-brand-accent" />
                {uiLanguage === "vi" ? "Cộng đồng (Sắp ra mắt)" : "Community (Soon)"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-[10px] font-black uppercase tracking-widest h-12 border-border-subtle hover:bg-surface-bg"
                onClick={onNavigateToChat}
              >
                <MessageSquare className="w-4 h-4 mr-3 text-brand-accent" />
                {uiLanguage === "vi" ? "Chat hỗ trợ" : "Support Chat"}
              </Button>
            </div>

            <div className="mt-auto pt-8">
              <Card className="p-6 bg-brand-accent/5 border-brand-accent/20 border-dashed relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-brand-accent/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <h5 className="text-[10px] font-black uppercase tracking-widest text-brand-accent mb-3 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Pro Tip
                </h5>
                <p className="text-xs text-text-main font-medium leading-relaxed italic">
                  "Hold Shift while clicking 'Dọn dẹp' to bypass safety confirmation and perform a deep systemic purge."
                </p>
              </Card>
            </div>
          </div>
        }
      />

      {confirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999] animate-fade-in bg-black/60 backdrop-blur-sm">
          <div 
            className="border rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl p-6 space-y-6"
            style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border }}
            id="confirm-clear-modal"
          >
            <div className="flex items-center gap-3 text-red-500">
              <Trash2 className="w-6 h-6 animate-pulse" />
              <h3 className="text-base font-black uppercase tracking-tight">
                {uiLanguage === "vi" ? "Dọn Dẹp Hệ Thống" : "System Purge"}
              </h3>
            </div>

            <div className="space-y-3 text-xs text-text-main leading-relaxed">
              <p className="font-bold">
                {uiLanguage === "vi" 
                  ? "Hành động này cực kỳ nghiêm trọng và sẽ thực hiện các bước sau:" 
                  : "This action is highly critical and will execute the following steps:"}
              </p>
              <ul className="list-disc pl-5 space-y-1.5 opacity-90">
                <li>
                  {uiLanguage === "vi"
                    ? "Hủy tất cả tiến trình đồng bộ dữ liệu đang hoạt động."
                    : "Abort any active data synchronization processes."}
                </li>
                <li>
                  {uiLanguage === "vi"
                    ? "Xóa toàn bộ các bản tin lưu cục bộ trong trình duyệt."
                    : "Purge all locally saved briefings from this browser."}
                </li>
                <li>
                  {uiLanguage === "vi"
                    ? "Xóa lịch sử khẩu lệnh/truy vấn giọng nói cục bộ."
                    : "Clear local voice command/query history."}
                </li>
                <li>
                  {uiLanguage === "vi"
                    ? "Xóa các tệp âm thanh (.mp3, .wav) lưu tạm thời trên Server."
                    : "Purge temporary audio files (.mp3, .wav) from Server cache."}
                </li>
                <li>
                  <span className="text-amber-500 font-bold">
                    {uiLanguage === "vi"
                      ? "Giữ nguyên phiên đăng nhập và cài đặt giao diện của bạn."
                      : "Keep your login session and visual theme preferences intact."}
                  </span>
                </li>
              </ul>

              {user ? (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-3 mt-4">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={clearCloud} 
                      onChange={(e) => setClearCloud(e.target.checked)}
                      className="mt-0.5 rounded border-border-subtle bg-surface text-brand-accent focus:ring-brand-accent/50 w-4 h-4 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="font-bold text-red-400">
                        {uiLanguage === "vi"
                          ? "Đồng thời xóa sạch dữ liệu trên Đám mây (Cloud)"
                          : "Also permanently delete all data from Cloud Backup"}
                      </span>
                      <p className="text-[10px] text-text-muted">
                        {uiLanguage === "vi"
                          ? "Xóa vĩnh viễn các bản tin và lịch sử giọng nói đã đồng bộ trên Supabase."
                          : "Permanently delete synchronized briefings and voice records on Supabase."}
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <p className="text-[10px] text-text-muted mt-2 italic">
                  {uiLanguage === "vi"
                    ? "* Bạn đang sử dụng ngoại tuyến. Chỉ xóa dữ liệu cục bộ trên thiết bị này."
                    : "* Operating in offline mode. Only local data on this device will be purged."}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-11 border-border-subtle hover:bg-surface-bg text-[10px] font-black uppercase tracking-widest"
                onClick={() => {
                  setConfirmOpen(false);
                  setClearCloud(false);
                }}
              >
                {uiLanguage === "vi" ? "Hủy bỏ" : "Cancel"}
              </Button>
              <Button
                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white border-none text-[10px] font-black uppercase tracking-widest"
                onClick={() => handleComprehensiveClear(clearCloud)}
              >
                {uiLanguage === "vi" ? "Xác nhận xóa" : "Confirm Purge"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <HelpCenterModal 
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        uiLanguage={uiLanguage}
      />

    </PageTemplate>
  );
}
