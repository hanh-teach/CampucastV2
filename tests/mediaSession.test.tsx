/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import ManualPcmPlayer from "../src/components/ManualPcmPlayer";
import { UserPreferencesProvider } from "../src/components/UserPreferencesProvider";

// Mock MediaMetadata
class MockMediaMetadata {
  title: string;
  artist: string;
  album: string;
  artwork: any[];
  constructor(init: any) {
    this.title = init.title;
    this.artist = init.artist;
    this.album = init.album;
    this.artwork = init.artwork;
  }
}

// Mock navigator.mediaSession
const mockSetActionHandler = vi.fn();
const mockMediaSession = {
  metadata: null,
  playbackState: 'none',
  setActionHandler: mockSetActionHandler,
};

describe("ManualPcmPlayer Media Session API (Prompt C9)", () => {
  beforeEach(() => {
    vi.stubGlobal("MediaMetadata", MockMediaMetadata);
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaSession: mockMediaSession,
    });
    mockSetActionHandler.mockClear();
    // Mock AudioContext
    vi.stubGlobal("AudioContext", vi.fn().mockImplementation(() => ({
      createAnalyser: vi.fn().mockReturnValue({ fftSize: 0, connect: vi.fn() }),
      createGain: vi.fn().mockReturnValue({ gain: { value: 0, setTargetAtTime: vi.fn() }, connect: vi.fn() }),
      destination: {},
      state: 'suspended',
      resume: vi.fn(),
      close: vi.fn(),
    })));
  });

  const defaultProps = {
    payload: {
      title: "Payload Title",
      introduction: "Intro",
      chapters: [{ topic: "Topic", scriptText: "Body", summaryBullets: [] }],
      conclusion: "Outro"
    },
    audioChunks: ["chunk1"],
    title: "Test Briefing",
    uiLanguage: "en" as const,
  };

  it("should register Media Session handlers and update metadata on mount", () => {
    render(
      <UserPreferencesProvider>
        <ManualPcmPlayer {...defaultProps} />
      </UserPreferencesProvider>
    );

    // Verify metadata set
    expect(mockMediaSession.metadata).toBeTruthy();
    expect((mockMediaSession.metadata as any).title).toBe("Test Briefing");

    // Verify handlers registered
    expect(mockSetActionHandler).toHaveBeenCalledWith('play', expect.any(Function));
    expect(mockSetActionHandler).toHaveBeenCalledWith('pause', expect.any(Function));
    expect(mockSetActionHandler).toHaveBeenCalledWith('seekbackward', expect.any(Function));
    expect(mockSetActionHandler).toHaveBeenCalledWith('seekforward', expect.any(Function));
  });

  it("should update playbackState when isPlaying changes", () => {
    render(
      <UserPreferencesProvider>
        <ManualPcmPlayer {...defaultProps} />
      </UserPreferencesProvider>
    );
    expect(mockMediaSession.playbackState).toBe('paused');
  });

  it("should cleanup handlers on unmount", () => {
    const { unmount } = render(
      <UserPreferencesProvider>
        <ManualPcmPlayer {...defaultProps} />
      </UserPreferencesProvider>
    );
    unmount();
    
    // Verify cleanup (called with null)
    expect(mockSetActionHandler).toHaveBeenCalledWith('play', null);
    expect(mockSetActionHandler).toHaveBeenCalledWith('pause', null);
  });
});
