/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

import * as React from "react";
console.log("React.act type:", typeof (React as any).act);
import { render, screen, fireEvent } from "@testing-library/react";
import TopicSuggestions from "../src/components/TopicSuggestions";
import MissionTabView from "../src/components/views/MissionTabView";
import { AdaptiveProvider } from "../src/layouts/AdaptiveContext";

// Mock usePreferences hook
const mockUsePreferences = vi.fn();
vi.mock("../src/hooks/usePreferences", () => ({
  usePreferences: () => mockUsePreferences(),
  default: () => mockUsePreferences()
}));

// Mock simple subcomponents or context if needed
vi.mock("../src/components/RSSManager", () => ({
  default: () => <div data-testid="rss-manager">RSS Manager Mock</div>
}));

describe("TopicSuggestions Component & MissionTabView Integration", () => {
  const mockOnSelectTopic = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Loading Skeleton state when usePreferences returns isLoading: true", () => {
    mockUsePreferences.mockReturnValue({
      topTopics: [],
      isLoading: true,
      error: null,
      refresh: vi.fn()
    });

    const { container } = render(
      <TopicSuggestions
        uiLanguage="vi"
        onSelectTopic={mockOnSelectTopic}
        isGenerating={false}
      />
    );

    const skeleton = container.querySelector("#suggestions-skeleton");
    expect(skeleton).toBeTruthy();
  });

  it("renders empty state with default Vietnamese topics when topTopics is empty", () => {
    mockUsePreferences.mockReturnValue({
      topTopics: [],
      isLoading: false,
      error: null,
      refresh: vi.fn()
    });

    render(
      <TopicSuggestions
        uiLanguage="vi"
        onSelectTopic={mockOnSelectTopic}
        isGenerating={false}
      />
    );

    // Verify fallback Vietnamese instruction message is shown
    expect(screen.getByText(/Chưa có đủ lịch sử để gợi ý riêng/i)).toBeTruthy();

    // Verify Vietnamese default topics are listed
    const vietnameseDefaults = ["Trí tuệ nhân tạo", "Công nghệ", "Kinh tế", "Giao thông", "Thời tiết"];
    vietnameseDefaults.forEach((topic) => {
      expect(screen.getByText(topic)).toBeTruthy();
    });
  });

  it("renders empty state with default English topics when uiLanguage is en and topTopics is empty", () => {
    mockUsePreferences.mockReturnValue({
      topTopics: [],
      isLoading: false,
      error: null,
      refresh: vi.fn()
    });

    render(
      <TopicSuggestions
        uiLanguage="en"
        onSelectTopic={mockOnSelectTopic}
        isGenerating={false}
      />
    );

    // Verify English text
    expect(screen.getByText(/Not enough history for personalized topics yet/i)).toBeTruthy();
    
    const englishDefaults = ["AI", "Technology", "Finance", "Traffic", "Weather"];
    englishDefaults.forEach((topic) => {
      expect(screen.getByText(topic)).toBeTruthy();
    });
  });

  it("renders personalized topics with scores and invokes onSelectTopic on click", () => {
    mockUsePreferences.mockReturnValue({
      topTopics: [
        { topic: "Y tế số", score: 45.2, lastInteractedAt: "2026-07-09T00:00:00Z" },
        { topic: "Bóng đá Việt Nam", score: 12.0, lastInteractedAt: "2026-07-09T00:00:00Z" }
      ],
      isLoading: false,
      error: null,
      refresh: vi.fn()
    });

    render(
      <TopicSuggestions
        uiLanguage="vi"
        onSelectTopic={mockOnSelectTopic}
        isGenerating={false}
      />
    );

    // Verify topics are rendered
    expect(screen.getByText("Y tế số")).toBeTruthy();
    expect(screen.getByText("Bóng đá Việt Nam")).toBeTruthy();

    // Click a topic
    fireEvent.click(screen.getByText("Y tế số"));
    expect(mockOnSelectTopic).toHaveBeenCalledWith("Y tế số");
  });

  it("does not trigger onSelectTopic when isGenerating is true", () => {
    mockUsePreferences.mockReturnValue({
      topTopics: [{ topic: "Y tế số", score: 45.2, lastInteractedAt: "2026-07-09T00:00:00Z" }],
      isLoading: false,
      error: null,
      refresh: vi.fn()
    });

    render(
      <TopicSuggestions
        uiLanguage="vi"
        onSelectTopic={mockOnSelectTopic}
        isGenerating={true}
      />
    );

    fireEvent.click(screen.getByText("Y tế số"));
    expect(mockOnSelectTopic).not.toHaveBeenCalled();
  });

  it("integrates and renders within MissionTabView at Stage 1", () => {
    mockUsePreferences.mockReturnValue({
      topTopics: [{ topic: "Chủ đề AI mẫu", score: 15.0, lastInteractedAt: "2026-07-09T00:00:00Z" }],
      isLoading: false,
      error: null,
      refresh: vi.fn()
    });

    const mockHandleCreateNews = vi.fn();

    // Minimally compliant props for MissionTabView
    const defaultProps: any = {
      uiLanguage: "vi" as const,
      newsContent: "",
      setNewsContent: vi.fn(),
      selectedNewsCategory: "general",
      setSelectedNewsCategory: vi.fn(),
      isGeneratingNews: false,
      handleCreateNews: mockHandleCreateNews,
      newsGenerationError: "",
      isListening: false,
      voiceInputLanguage: "vi-VN" as const,
      setVoiceInputLanguage: vi.fn(),
      isProcessingVoiceQuery: false,
      startVoiceSearch: vi.fn(),
      voiceQueryStatus: "",
      voiceError: "",
      showVoiceAddPrompt: false,
      setShowVoiceAddPrompt: vi.fn(),
      voiceQueryResult: null,
      setVoiceQueryResult: vi.fn(),
      voiceQuerySources: [],
      setVoiceQuerySources: vi.fn(),
      handleVoiceAddToBriefing: vi.fn(),
      handleApplyPreset: vi.fn(),
      handleClearInput: vi.fn(),
      wordCount: 0,
      charLength: 0,
      t: {
        sourceTitle: "Nguồn tin bản tin",
        sourcePlaceholder: "Nhập nội dung...",
        clearCta: "Xoá",
        btnExecute: "Bắt đầu",
        btnNext: "Tiếp tục"
      },
      getApiUrl: (path: string) => `http://localhost:3000${path}`,
      step: "idle" as const,
      executionState: null,
      generationProgress: "",
      handleGenerateBriefing: vi.fn(),
      isRssBasedGeneration: false,
      setIsRssBasedGeneration: vi.fn(),
      setActiveTab: vi.fn(),
      preferences: {
        customInstructions: ""
      },
      setPreferences: vi.fn(),
      errorMessage: "",
      btnReset: vi.fn(),
      activePayload: null,
      activeAudioChunks: [],
      activeTitle: "",
      selectedBriefId: "",
      handlePlayerEnded: vi.fn(),
      autosaveStatus: "idle" as const
    };

    render(
      <AdaptiveProvider>
        <MissionTabView {...defaultProps} />
      </AdaptiveProvider>
    );

    // Verify TopicSuggestions renders its container
    const container = screen.getByText("Chủ đề gợi ý cho bạn");
    expect(container).toBeTruthy();

    // Verify our mocked top topics render inside MissionTabView
    expect(screen.getByText("Chủ đề AI mẫu")).toBeTruthy();

    // Verify interaction triggers handleCreateNews
    fireEvent.click(screen.getByText("Chủ đề AI mẫu"));
    expect(mockHandleCreateNews).toHaveBeenCalledWith("Chủ đề AI mẫu");
  });
});
