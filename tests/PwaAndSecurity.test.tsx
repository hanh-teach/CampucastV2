/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { useAuthActions } from "../src/hooks/useAuthActions";
import { usePwaStatus } from "../src/hooks/usePwaStatus";
import SettingsTabView from "../src/components/views/SettingsTabView";
import { DeviceType, LayoutVariant } from "../src/types";

// Mock the services
vi.mock("../src/services/supabaseClient", () => ({
  getSupabaseClientAsync: vi.fn().mockResolvedValue({
    auth: {
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null })
    }
  })
}));

vi.mock("../src/services/storageService", () => ({
  getStorageEstimate: vi.fn().mockResolvedValue({ usedMB: 12.34, totalMB: 512 })
}));

vi.mock("../src/components/ThemeProvider", () => ({
  useTheme: vi.fn(() => ({
    theme: "light",
    setTheme: vi.fn()
  }))
}));

vi.mock("../src/layouts/AdaptiveContext", () => ({
  useAdaptive: vi.fn(() => ({
    device: DeviceType.Desktop,
    variant: LayoutVariant.Regular
  }))
}));

describe("useAuthActions hook", () => {
  it("should change password successfully", async () => {
    const { result } = renderHook(() => useAuthActions());
    const response = await result.current.changePassword("newSecretPassword123");
    expect(response.error).toBeNull();
  });

  it("should sign out successfully", async () => {
    const { result } = renderHook(() => useAuthActions());
    await result.current.signOutCurrentDevice();
    // Verify it doesn't crash and runs cleanly
    expect(result.current.signOutCurrentDevice).toBeTypeOf("function");
  });
});

describe("usePwaStatus hook", () => {
  it("should return the correct cache version", () => {
    const { result } = renderHook(() => usePwaStatus());
    expect(result.current.cacheVersion).toBe("commutecast-v2");
  });

  it("should check for updates", async () => {
    const { result } = renderHook(() => usePwaStatus());
    expect(result.current.checkForUpdate).toBeTypeOf("function");
  });
});

describe("SettingsTabView with Security and PWA Categories", () => {
  const defaultProps = {
    uiLanguage: "vi" as const,
    activeCategory: "security" as const,
    onCategoryChange: vi.fn(),
    preferences: {
      voice: "Seraph-1",
      speed: 1.0
    },
    setPreferences: vi.fn(),
    onClearAllCache: vi.fn().mockResolvedValue(undefined),
    storageUsage: { usedMB: 20, totalMB: 512 },
    user: { email: "test@example.com" }
  };

  beforeAll(() => {
    Object.defineProperty(window, "location", {
      value: new URL("http://localhost:3000"),
      writable: true
    });
  });

  it("renders Security category and elements correctly when user is logged in", async () => {
    render(<SettingsTabView {...defaultProps} />);
    
    // Check that security card has "Đổi mật khẩu"
    expect(await screen.findByText(/Đổi mật khẩu/i)).toBeTruthy();
    
    // Check that we have password inputs
    const passwordInputs = screen.getAllByPlaceholderText(/mật khẩu mới/i);
    expect(passwordInputs.length).toBeGreaterThanOrEqual(1);

    // Check that "Phiên đăng nhập" exists
    expect(screen.getByText(/Phiên đăng nhập/i)).toBeTruthy();
    expect(screen.getByText(/Đăng xuất khỏi thiết bị này/i)).toBeTruthy();
  });

  it("renders PWA category correctly", async () => {
    render(<SettingsTabView {...defaultProps} activeCategory="pwa" />);
    
    // Check that app status is shown
    expect(await screen.findByText(/Trạng thái ứng dụng/i)).toBeTruthy();
    
    // Check for cache version display
    expect(screen.getByText(/Phiên bản Cache/i)).toBeTruthy();
    expect(screen.getByText(/commutecast-v2/i)).toBeTruthy();

    // Check for update button
    expect(screen.getByText(/Kiểm tra cập nhật/i)).toBeTruthy();

    // Check for custom storage estimate display label
    expect(screen.getByText(/Dung lượng ứng dụng \(bao gồm cache offline\)/i)).toBeTruthy();
  });
});
