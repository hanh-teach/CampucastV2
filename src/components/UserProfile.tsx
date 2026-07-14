import { colors } from "../foundation/tokens/colors";
import React, { useState } from "react";
import { User, LogOut, Cloud, CloudOff, CloudLightning, RefreshCw, Key, XCircle } from "lucide-react";
import { getSupabaseClientAsync } from "../services/supabaseClient";
import { SyncStatus } from "../hooks/useSync";
import { performFullSyncAsync } from "../services/syncService";
import LoginModal from "./LoginModal";

interface UserProfileProps {
  user: any;
  syncStatus: SyncStatus;
  isOnline: boolean;
  onSync: () => void;
  onAbortSync?: () => void; // <-- Thêm prop này để hủy đồng bộ
  uiLanguage: "vi" | "en";
}

const uDict = {
  vi: {
    signInBtn: "Đồng bộ Cloud",
    signOutBtn: "Đăng xuất",
    syncStatusLabel: "Đồng bộ",
    synced: "Đã đồng bộ",
    syncing: "Đang đồng bộ...",
    offline: "Ngoại tuyến (Offline)",
    error: "Lỗi đồng bộ",
    unauthenticated: "Chưa đăng nhập",
    greeting: "Xin chào",
    syncNow: "Đồng bộ ngay",
    abortSync: "Hủy đồng bộ",
    abortConfirm: "Bạn có chắc muốn hủy đồng bộ?\nDữ liệu sẽ không được cập nhật lên cloud."
  },
  en: {
    signInBtn: "Cloud Sync",
    signOutBtn: "Sign Out",
    syncStatusLabel: "Sync",
    synced: "Synced",
    syncing: "Syncing...",
    offline: "Offline",
    error: "Sync error",
    unauthenticated: "Unauthenticated",
    greeting: "Hello",
    syncNow: "Sync Now",
    abortSync: "Abort Sync",
    abortConfirm: "Are you sure you want to abort sync?\nData will not be updated to cloud."
  }
};

export default function UserProfile({
  user,
  syncStatus,
  isOnline,
  onSync,
  onAbortSync,
  uiLanguage
}: UserProfileProps) {
  const u = uDict[uiLanguage];
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Hàm đăng xuất có đồng bộ trước khi logout
  const handleSignOut = async () => {
    try {
      console.log("[Logout] Syncing data before logout...");
      if (isOnline) {
        await performFullSyncAsync();
        console.log("[Logout] Sync completed successfully.");
      } else {
        console.warn("[Logout] Offline, skipping sync before logout.");
      }
    } catch (err) {
      console.error("[Logout] Sync failed, but continuing logout:", err);
    }

    const supabase = await getSupabaseClientAsync();
    if (supabase) {
      await supabase.auth.signOut();
      setDropdownOpen(false);
      window.location.href = '/';
    }
  };

  // Xử lý hủy đồng bộ với hộp thoại xác nhận
  const handleAbortSync = () => {
    if (!onAbortSync) return;
    const confirmed = window.confirm(u.abortConfirm);
    if (confirmed) {
      onAbortSync();
    }
  };

  const getSyncIcon = () => {
    switch (syncStatus) {
      case "synced":
        return <Cloud className="w-4 h-4" style={{ color: colors.success }} />;
      case "syncing":
        return <RefreshCw className="w-4 h-4 animate-spin" style={{ color: colors.interactive }} />;
      case "offline":
        return <CloudOff className="w-4 h-4" style={{ color: colors.textMuted }} />;
      case "error":
        return <CloudLightning className="w-4 h-4 animate-bounce" style={{ color: colors.critical }} />;
      default:
        return <CloudOff className="w-4 h-4" style={{ color: colors.textMuted }} />;
    }
  };

  const getSyncStyle = () => {
    switch (syncStatus) {
      case "synced":
        return { backgroundColor: `${colors.success}1a`, borderColor: `${colors.success}33`, color: colors.success };
      case "syncing":
        return { backgroundColor: `${colors.interactive}1a`, borderColor: `${colors.interactive}33`, color: colors.interactive };
      case "offline":
        return { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textMuted };
      case "error":
        return { backgroundColor: `${colors.critical}1a`, borderColor: `${colors.critical}33`, color: colors.critical };
      default:
        return { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textMuted };
    }
  };

  return (
    <div className="relative font-sans" id="user-profile-widget">
      {user ? (
        <div className="flex items-center gap-2">
          {/* Status Capsule Indicator */}
          <button
            onClick={() => onSync()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 border"
            style={getSyncStyle()}
            title={u.syncNow}
            disabled={syncStatus === "syncing"}
          >
            {getSyncIcon()}
            <span className="hidden sm:inline">{u[syncStatus]}</span>
          </button>

          {/* Nút Hủy đồng bộ - chỉ hiển thị khi đang đồng bộ */}
          {syncStatus === "syncing" && onAbortSync && (
            <button
              onClick={handleAbortSync}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border hover:opacity-90 transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: `${colors.critical}1a`, borderColor: `${colors.critical}33`, color: colors.critical }}
              title={u.abortSync}
            >
              <XCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{u.abortSync}</span>
            </button>
          )}

          {/* User Button */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textSecondary }}
          >
            <User className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-11 border rounded-2xl w-56 py-2 shadow-2xl z-50 animate-fade-in text-xs"
                   style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border, color: colors.textPrimary }}>
                <div className="px-4 py-2 border-b" style={{ borderColor: colors.border }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>{u.greeting}</p>
                  <p className="font-bold truncate mt-0.5" title={user.email}>{user.email}</p>
                </div>
                
                <button
                  onClick={() => { onSync(); setDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2.5 hover:brightness-95 flex items-center gap-2.5 transition cursor-pointer font-medium"
                  style={{ backgroundColor: "transparent", color: colors.textPrimary }}
                  disabled={syncStatus === "syncing"}
                >
                  <RefreshCw className="w-4 h-4" style={{ color: colors.interactive }} />
                  <span>{u.syncNow}</span>
                </button>

                {/* Nếu đang đồng bộ, hiển thị nút hủy trong dropdown (tùy chọn) */}
                {syncStatus === "syncing" && onAbortSync && (
                  <button
                    onClick={handleAbortSync}
                    className="w-full text-left px-4 py-2.5 hover:brightness-95 flex items-center gap-2.5 transition cursor-pointer font-bold border-t"
                    style={{ backgroundColor: "transparent", color: colors.critical, borderColor: colors.border }}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{u.abortSync}</span>
                  </button>
                )}

                <button
                  onClick={() => handleSignOut()}
                  className="w-full text-left px-4 py-2.5 hover:brightness-95 flex items-center gap-2.5 transition cursor-pointer font-bold border-t"
                  style={{ backgroundColor: "transparent", color: colors.critical, borderColor: colors.border }}
                >
                  <LogOut className="w-4 h-4" />
                  <span>{u.signOutBtn}</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsLoginOpen(true)}
          className="px-3 py-1.5 sm:px-3.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-sm active:scale-95 border hover:brightness-105"
          style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
          title={u.signInBtn}
        >
          <Key className="w-3.5 h-3.5" style={{ color: colors.interactive }} />
          <span className="hidden sm:inline">{u.signInBtn}</span>
        </button>
      )}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        uiLanguage={uiLanguage}
      />
    </div>
  );
}