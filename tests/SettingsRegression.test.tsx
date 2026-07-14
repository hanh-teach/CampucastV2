/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsTabView from "../src/components/views/SettingsTabView";
import { DeviceType, LayoutVariant } from "../src/types";

// Mock hooks and services
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

vi.mock("../src/services/preferenceService", () => ({
  getTopPreferences: vi.fn(() => Promise.resolve([
    { key: "Technology", score: 9.5 },
    { key: "Business", score: 8.2 }
  ]))
}));

describe("SettingsTabView Regression Test Suite", () => {
  const defaultProps = {
    uiLanguage: "vi" as const,
    activeCategory: "general" as const,
    onCategoryChange: vi.fn(),
    preferences: {
      voice: "Seraph-1",
      speed: 1.0
    },
    setPreferences: vi.fn(),
    onClearAllCache: vi.fn().mockResolvedValue(undefined),
    storageUsage: { usedMB: 20, totalMB: 512 }
  };

  
beforeAll(() => {
  // Mock window.location for undici fetch
  Object.defineProperty(window, 'location', {
    value: new URL('http://localhost:3000'),
    writable: true
  });
});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the settings view correctly", async () => {
    render(<SettingsTabView {...defaultProps} />);
    expect(await screen.findByText(/Cài đặt hệ thống/i)).toBeTruthy();
  });

  it("contains all category buttons in the sidebar", () => {
    render(<SettingsTabView {...defaultProps} />);
    const categoryLabels = ["Chung", "Giao diện", "Lưu trữ", "Đồng bộ", "Bảo mật", "Ứng dụng PWA", "Giới thiệu"];
    categoryLabels.forEach(label => {
      expect(screen.getAllByText(new RegExp(label, 'i')).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders Storage category content when clicked", async () => {
    let currentCategory = "general" as any;
    const { rerender } = render(<SettingsTabView {...defaultProps} activeCategory={currentCategory} onCategoryChange={(cat) => {
      currentCategory = cat;
    }} />);
    const storageBtn = screen.getAllByText(/Lưu trữ/i).find(el => el.closest('button'))?.closest('button');
    fireEvent.click(storageBtn!);
    
    rerender(<SettingsTabView {...defaultProps} activeCategory={currentCategory} />);
    
    // Check for some content in Storage
    await waitFor(() => {
      expect(screen.queryAllByText(/Dọn dẹp hệ thống/i).length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });

  it("triggers onClearAllCache when button is clicked in Storage category", async () => {
    render(<SettingsTabView {...defaultProps} activeCategory="storage" />);
    
    const clearBtn = await screen.findByText(/Dọn dẹp hệ thống/i);
    fireEvent.click(clearBtn.closest('button')!);
    
    // Now click the "Xác nhận xóa" button in the confirmation modal
    const confirmBtn = await screen.findByText(/Xác nhận xóa/i);
    fireEvent.click(confirmBtn.closest('button')!);
    
    expect(defaultProps.onClearAllCache).toHaveBeenCalled();
  });
});
