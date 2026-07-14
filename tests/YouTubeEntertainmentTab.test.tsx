/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
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

    vi.stubGlobal("YT", YT);
    vi.stubGlobal("window", {
        ...window,
        YT: YT
    });
  });

  it("should trigger volume change on isDucked toggle", async () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <YouTubeEntertainmentTab
        isDucked={false}
        uiLanguage="en"
        voiceSearchQuery={null}
        onClearSearch={vi.fn()}
      />
    );

    // Simulate player ready
    onReadyCallback();

    // Trigger ducking
    rerender(
      <YouTubeEntertainmentTab
        isDucked={true}
        uiLanguage="en"
        voiceSearchQuery={null}
        onClearSearch={vi.fn()}
      />
    );

    // Fast-forward timers for ramping
    vi.advanceTimersByTime(300);

    // Assert setVolume called
    expect(mockPlayer.setVolume).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
