/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import React from "react";
import { YouTubeEntertainmentTab } from "../src/components/YouTubeEntertainmentTab";

// Mock motion/react completely
vi.mock("motion/react", () => ({
  __esModule: true,
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => <div {...props} ref={ref}>{children}</div>),
    span: React.forwardRef(({ children, ...props }: any, ref: any) => <span {...props} ref={ref}>{children}</span>),
    button: React.forwardRef(({ children, ...props }: any, ref: any) => <button {...props} ref={ref}>{children}</button>),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: vi.fn(),
  useMotionValue: vi.fn(),
  useTransform: vi.fn(),
  useSpring: vi.fn(),
}));

// Mock FeedOrchestrator & recordInteraction to decouple tests from dynamic execution layers
vi.mock("../src/services/feedOrchestrator", () => ({
  FeedOrchestrator: {
    getFeed: vi.fn().mockResolvedValue({
      videos: [
        {
          id: "test-video-id",
          title: "Test Music Video",
          channelTitle: "Test Channel",
          thumbnailUrl: "https://example.com/thumb.jpg",
          viewCount: 1000,
          likeCount: 100,
          publishedAt: "2026-07-14T00:00:00Z",
          hotScore: 90,
          recommendationScore: 85
        }
      ],
      nextPageToken: undefined
    })
  }
}));

vi.mock("../src/services/interactionService", () => ({
  recordInteraction: vi.fn().mockResolvedValue(undefined)
}));

describe("YouTubeEntertainmentTab", () => {
  let mockPlayer: any;
  let onReadyCallback: () => void;

  beforeEach(() => {
    mockPlayer = {
      getVolume: vi.fn().mockReturnValue(100),
      setVolume: vi.fn(),
      destroy: vi.fn(),
      loadVideoById: vi.fn(),
    };

    // Mock window.YT
    const YT = {
      Player: function(elementId: string, config: any) {
        onReadyCallback = config.events.onReady;
        return mockPlayer;
      },
      PlayerState: {
        PLAYING: 1,
        PAUSED: 2,
        ENDED: 0,
      },
    };

    (window as any).YT = YT;
    vi.stubGlobal("YT", YT);
  });

  it("should trigger volume change on isDucked toggle", async () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <YouTubeEntertainmentTab
        isDucked={false}
        uiLanguage="en"
        voiceSearchQuery={undefined}
        onClearSearch={vi.fn()}
      />
    );

    // Flush promises so fetchFeed finishes, sets state, and triggers player initialization
    await act(async () => {
      await Promise.resolve();
    });

    // Simulate player ready
    act(() => {
      if (typeof onReadyCallback === "function") {
        onReadyCallback();
      }
    });

    // Trigger ducking
    act(() => {
      rerender(
        <YouTubeEntertainmentTab
          isDucked={true}
          uiLanguage="en"
          voiceSearchQuery={undefined}
          onClearSearch={vi.fn()}
        />
      );
    });

    // Fast-forward timers for ramping
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Assert setVolume called
    expect(mockPlayer.setVolume).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
