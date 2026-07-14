/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, act, screen } from "@testing-library/react";
import ManualPcmPlayer from "../src/components/ManualPcmPlayer";
import { UserPreferencesProvider } from "../src/components/UserPreferencesProvider";

// Hoisted variables for use in mocks
const mocks = vi.hoisted(() => ({
  mockSetTargetAtTime: vi.fn(),
  mockPreferences: {
    isDrivingMode: true,
    audioNormalize: false,
    audioMusicVolume: 0.5,
    audioMusicGenre: "lofi",
    language: "en" as const
  },
  captured: {
    onDuckingChange: null as ((isDucked: boolean) => void) | null,
    onPlayPause: null as (() => void) | null
  }
}));

// Mock AudioContext
const mockAudioContextInstance = {
  createGain: vi.fn(() => ({
    gain: {
      value: 1,
      setTargetAtTime: mocks.mockSetTargetAtTime,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      cancelScheduledValues: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createOscillator: vi.fn(() => ({
    type: "sine",
    frequency: { setValueAtTime: vi.fn(), value: 440 },
    detune: { setValueAtTime: vi.fn(), value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createBufferSource: vi.fn(() => ({
    buffer: null,
    playbackRate: { value: 1 },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null,
  })),
  createAnalyser: vi.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
  createBuffer: vi.fn((channels, length, rate) => ({
    numberOfChannels: channels,
    length: length,
    sampleRate: rate,
    duration: length / rate,
    getChannelData: vi.fn(() => new Float32Array(length)),
    copyToChannel: vi.fn(),
    copyFromChannel: vi.fn(),
  })),
  decodeAudioData: vi.fn().mockResolvedValue({ 
    duration: 10, 
    numberOfChannels: 1, 
    sampleRate: 24000, 
    length: 240000,
    getChannelData: vi.fn(() => new Float32Array(240000))
  }),
  resume: vi.fn().mockResolvedValue(undefined),
  suspend: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  currentTime: 123.45,
  destination: {},
  state: 'running' as const
};

vi.stubGlobal("AudioContext", vi.fn().mockImplementation(function() {
  return mockAudioContextInstance;
}));
vi.stubGlobal("webkitAudioContext", vi.fn().mockImplementation(function() {
  return mockAudioContextInstance;
}));
vi.stubGlobal("requestAnimationFrame", vi.fn());
vi.stubGlobal("cancelAnimationFrame", vi.fn());

// Mock UserPreferencesProvider
vi.mock("../src/components/UserPreferencesProvider", () => ({
  useUserPreferences: vi.fn(() => ({
    preferences: mocks.mockPreferences,
    updateDrivingMode: vi.fn(),
    updatePreferences: vi.fn()
  })),
  UserPreferencesProvider: ({ children }: any) => <>{children}</>
}));

// Mock useDrivingMode
vi.mock("../src/hooks/useDrivingMode", () => ({
  useDrivingMode: vi.fn(() => ({
    isListening: false,
    micError: "",
    startSpeechRecognition: vi.fn(),
    stopSpeechRecognition: vi.fn(),
    transcript: "",
    vibrate: vi.fn(),
    toast: { message: null, show: false },
    clearToast: vi.fn()
  })),
  matchAndStripWakeWord: vi.fn()
}));

// Mock DrivingMode
vi.mock("../src/components/DrivingMode", () => ({
  default: vi.fn((props: any) => {
    // Capture props when rendered
    mocks.captured.onDuckingChange = props.onDuckingChange;
    mocks.captured.onPlayPause = props.onPlayPause;
    return <div data-testid="driving-mode-mock" />;
  })
}));

// Mock telemetry
vi.mock("../src/services/telemetryService", () => ({
  telemetry: {
    track: vi.fn()
  }
}));

import { useDrivingMode } from "../src/hooks/useDrivingMode";

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    createPortal: (node: any) => node,
  };
});

describe("ManualPcmPlayer Ducking Pipeline", () => {
  const defaultProps = {
    payload: {
      title: "Test Briefing",
      introduction: "Intro text",
      chapters: [{ topic: "Topic 1", scriptText: "Body text", summaryBullets: [] }],
      conclusion: "Outro text"
    },
    audioChunks: ["UklGRg=="],
    title: "Test Briefing",
    uiLanguage: "en" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.captured.onDuckingChange = null;
    mocks.captured.onPlayPause = null;
    mocks.mockPreferences = {
      isDrivingMode: true,
      audioNormalize: false,
      audioMusicVolume: 0.5,
      audioMusicGenre: "lofi",
      language: "en" as const
    };
    
    vi.mocked(useDrivingMode).mockReturnValue({
      isListening: false,
      micError: "",
      startSpeechRecognition: vi.fn(),
      stopSpeechRecognition: vi.fn(),
      transcript: "",
      vibrate: vi.fn(),
      toast: { message: null, show: false },
      clearToast: vi.fn()
    } as any);
  });

  it("should update gain nodes correctly when isDucked changes", async () => {
    const { useUserPreferences } = await import("../src/components/UserPreferencesProvider");
    console.log("TEST: isDrivingMode pref:", vi.mocked(useUserPreferences)().preferences.isDrivingMode);

    render(
      <UserPreferencesProvider>
        <ManualPcmPlayer {...defaultProps} />
      </UserPreferencesProvider>
    );

    // Verify DrivingMode is rendered
    await vi.waitFor(() => {
      const el = screen.queryByTestId("driving-mode-mock");
      expect(el).not.toBeNull();
    }, { timeout: 5000 });

    // Wait for initAudio to finish
    await act(async () => {
      await new Promise(r => setTimeout(r, 500));
    });
    console.log("TEST after initAudio, isPlaying should be true, wait what is it?");
    
    // Ducking: false -> true
    await act(async () => {
      if (mocks.captured.onDuckingChange) mocks.captured.onDuckingChange(true);
    });

    // Verify gain updates are called
    await vi.waitFor(() => {
      const calls = mocks.mockSetTargetAtTime.mock.calls;
      console.log("mockSetTargetAtTime calls:", calls);
      const hasVoiceDucking = calls.some(c => c[0] === 0.135);
      const hasMusicDucking = calls.some(c => c[0] === 0.00036);
      
      expect(hasVoiceDucking).toBe(true);
      expect(hasMusicDucking).toBe(true);
    }, { timeout: 3000 });

    // Unducking: true -> false
    mocks.mockSetTargetAtTime.mockClear();
    await act(async () => {
      if (mocks.captured.onDuckingChange) mocks.captured.onDuckingChange(false);
    });

    // Voice unducked: volume (0.9)
    // Music unducked: userPref.audioMusicVolume (0.5) * volume (0.9) * 0.08 = ~0.036
    await vi.waitFor(() => {
      const calls = mocks.mockSetTargetAtTime.mock.calls;
      const hasVoiceUnducked = calls.some(c => Math.abs(c[0] - 0.9) < 0.001);
      const hasMusicUnducked = calls.some(c => Math.abs(c[0] - 0.036) < 0.001);
      
      expect(hasVoiceUnducked).toBe(true);
      expect(hasMusicUnducked).toBe(true);
    }, { timeout: 2000 });
  }, 15000);

  it("should sync ducking state with isListening in DrivingMode", async () => {
    const onDuckingChangeMock = vi.fn();
    
    const DrivingModeActual = (await vi.importActual<any>("../src/components/DrivingMode")).default;
    
    const { rerender } = render(
      <UserPreferencesProvider>
        <DrivingModeActual
          title="Test"
          isPlaying={true}
          currentTime={0}
          totalDuration={100}
          onPlayPause={vi.fn()}
          onSkip={vi.fn()}
          onScrubberChange={vi.fn()}
          onExit={vi.fn()}
          uiLanguage="en"
          savedBriefings={[]}
          onPlaySavedBriefing={vi.fn()}
          onNext={vi.fn()}
          onDuckingChange={onDuckingChangeMock}
        />
      </UserPreferencesProvider>
    );

    // Initial check (not listening)
    await vi.waitFor(() => {
      expect(onDuckingChangeMock).toHaveBeenCalledWith(false);
    });

    // Change to listening
    vi.mocked(useDrivingMode).mockReturnValue({
      isListening: true,
      micError: "",
      startSpeechRecognition: vi.fn(),
      stopSpeechRecognition: vi.fn(),
      transcript: "",
      vibrate: vi.fn(),
      toast: { message: null, show: false },
      clearToast: vi.fn()
    } as any);

    rerender(
      <UserPreferencesProvider>
        <DrivingModeActual
          title="Test"
          isPlaying={true}
          currentTime={0}
          totalDuration={100}
          onPlayPause={vi.fn()}
          onSkip={vi.fn()}
          onScrubberChange={vi.fn()}
          onExit={vi.fn()}
          uiLanguage="en"
          savedBriefings={[]}
          onPlaySavedBriefing={vi.fn()}
          onNext={vi.fn()}
          onDuckingChange={onDuckingChangeMock}
        />
      </UserPreferencesProvider>
    );

    await vi.waitFor(() => {
      expect(onDuckingChangeMock).toHaveBeenCalledWith(true);
    });
  });
});
