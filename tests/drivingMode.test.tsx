/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DrivingMode from "../src/components/DrivingMode";
import { useDrivingMode, matchAndStripWakeWord } from "../src/hooks/useDrivingMode";

// Stub global navigator and vibrate
if (typeof navigator !== "undefined") {
  (navigator as any).vibrate = vi.fn();
}

// Stub global SpeechSynthesis
const mockSpeak = vi.fn();
const mockCancel = vi.fn();
vi.stubGlobal("speechSynthesis", {
  speak: mockSpeak,
  cancel: mockCancel
});

vi.stubGlobal("SpeechSynthesisUtterance", vi.fn().mockImplementation((text) => ({
  text,
  lang: ""
})));

// Mock useDrivingMode hook
vi.mock("../src/hooks/useDrivingMode", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/hooks/useDrivingMode")>();
  return {
    ...actual,
    useDrivingMode: vi.fn(() => ({
      isListening: false,
      isContinuous: false,
      setIsContinuous: vi.fn(),
      micError: "",
      startSpeechRecognition: vi.fn(),
      stopSpeechRecognition: vi.fn(),
      transcript: "",
      toast: { message: null, show: false },
      clearToast: vi.fn()
    }))
  };
});

// Mock UserPreferencesProvider to prevent context errors
vi.mock("../src/components/UserPreferencesProvider", () => ({
  useUserPreferences: () => ({
    preferences: { hapticFeedbackEnabled: true, wakeWordEnabled: true },
    updatePreferences: vi.fn()
  }),
  UserPreferencesProvider: ({ children }: any) => <>{children}</>
}));

// Mock audio context to prevent error outputs
vi.stubGlobal("AudioContext", vi.fn().mockImplementation(() => ({
  createOscillator: () => ({
    connect: vi.fn(),
    frequency: { setValueAtTime: vi.fn() },
    start: vi.fn(),
    stop: vi.fn()
  }),
  createGain: () => ({
    connect: vi.fn(),
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
  }),
  destination: {},
  currentTime: 0
})));

describe("DrivingMode Upgrade Test Suite", () => {
  const defaultProps = {
    title: "Morning Commute Briefing",
    isPlaying: false,
    currentTime: 30,
    totalDuration: 180,
    onPlayPause: vi.fn(),
    onSkip: vi.fn(),
    onScrubberChange: vi.fn(),
    onExit: vi.fn(),
    uiLanguage: "vi" as const,
    savedBriefings: [
      {
        id: "cached-1",
        title: "Saved Offline Episode 1",
        payload: { title: "Saved Offline Episode 1", subtitle: "National Politics Summary" }
      },
      {
        id: "cached-2",
        title: "Saved Offline Episode 2",
        payload: { title: "Saved Offline Episode 2", subtitle: "Global Tech Digest" }
      }
    ],
    onPlaySavedBriefing: vi.fn(),
    onRetryGeneration: vi.fn(),
    onNext: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render active title and core control deck", () => {
    render(<DrivingMode {...defaultProps} />);
    
    // Check title rendering
    expect(screen.getByText("Morning Commute Briefing")).toBeTruthy();
    
    // Check safety warning
    expect(screen.getByText(/Tập trung lái xe an toàn/i)).toBeTruthy();
    
    // Check exit button
    expect(screen.getByText("Thoát HUD")).toBeTruthy();
  });

  it("should handle offline connection warning when offline", () => {
    // Mock navigator.onLine as false
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    
    render(<DrivingMode {...defaultProps} />);
    
    // Trigger offline event manually to ensure state update in test environment
    fireEvent(window, new Event("offline"));
    
    expect(screen.getAllByText(/MẤT KẾT NỐI/i).length).toBeGreaterThan(0);
  });

  it("should render premium quota limit fallback displays and local listings", () => {
    render(
      <DrivingMode 
        {...defaultProps} 
        error="QUOTA_LIMIT: Out of TTS characters" 
      />
    );

    // Verify limit alert (Hardcoded in new HUD)
    expect(screen.getByText(/QUOTA LIMIT/i)).toBeTruthy();
    
    // Verify suggestions header
    expect(screen.getAllByText(/Bản tin lưu trữ/i).length).toBeGreaterThan(0);
    
    // Verify cached items list
    expect(screen.getByText("Saved Offline Episode 1")).toBeTruthy();
    expect(screen.getByText("Saved Offline Episode 2")).toBeTruthy();

    // Verify play interaction triggers callback
    const playButtons = screen.getAllByText("Phát Ngoại Tuyến");
    expect(playButtons.length).toBe(2);
    
    fireEvent.click(playButtons[0]);
    expect(defaultProps.onPlaySavedBriefing).toHaveBeenCalledWith(defaultProps.savedBriefings[0]);
  });

  it("should render English locale strings correctly", () => {
    render(<DrivingMode {...defaultProps} uiLanguage="en" />);
    
    expect(screen.getAllByText("DRIVING HUD ACTIVE").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Exit HUD").length).toBeGreaterThan(0);
  });

  describe("Hands-free Audio, Speech, and Haptic Feedback Upgrades", () => {
    it("should correctly match and strip wake-word using the matchAndStripWakeWord helper", () => {
      // Vietnamese tests
      const viResult1 = matchAndStripWakeWord("cast ơi tạm dừng", "vi");
      expect(viResult1.matched).toBe(true);
      expect(viResult1.stripped).toBe("tạm dừng");

      const viResult2 = matchAndStripWakeWord("này cast mở bài hát", "vi");
      expect(viResult2.matched).toBe(true);
      expect(viResult2.stripped).toBe("mở bài hát");

      const viResultNoMatch = matchAndStripWakeWord("bác tài ơi tạm dừng", "vi");
      expect(viResultNoMatch.matched).toBe(false);

      // English tests
      const enResult1 = matchAndStripWakeWord("hey cast play briefing", "en");
      expect(enResult1.matched).toBe(true);
      expect(enResult1.stripped).toBe("play briefing");

      const enResult2 = matchAndStripWakeWord("ok cast fast forward", "en");
      expect(enResult2.matched).toBe(true);
      expect(enResult2.stripped).toBe("fast forward");

      const enResultNoMatch = matchAndStripWakeWord("assistant play briefing", "en");
      expect(enResultNoMatch.matched).toBe(false);
    });
  });

  describe("Offline Fallback Logic (Prompt B6)", () => {
    it("should hide voice control and show offline status message when connection is lost", () => {
      render(<DrivingMode {...defaultProps} />);
      
      // Simulate going offline
      fireEvent(window, new Event("offline"));
      
      // Voice button should be hidden
      expect(screen.queryByText(/VOICE ON|VOICE OFF/i)).toBeNull();
      
      // Offline voice status should be visible
      expect(screen.getByText(/Điều khiển giọng nói tạm ngưng/i)).toBeTruthy();
    });

    it("should apply larger classes to media controls when offline", () => {
      const { container } = render(<DrivingMode {...defaultProps} />);
      
      // Simulate going offline
      fireEvent(window, new Event("offline"));
      
      // Check play button size (w-18 h-18 md:w-24 md:h-24 when offline)
      const playBtn = container.querySelector('svg.lucide-play, svg.lucide-pause')?.parentElement;
      expect(playBtn?.className).toContain("w-18");
      
      // Check skip button size (w-14 h-14 md:w-16 md:h-16 when offline)
      const skipBackBtn = container.querySelector('svg.lucide-rotate-ccw')?.parentElement;
      expect(skipBackBtn?.className).toContain("w-14");
    });

    it("should automatically stop speech recognition and disable continuous mode when falling offline during an active session", () => {
      const mockSetIsContinuous = vi.fn();
      const mockStopSpeechRecognition = vi.fn();
      
      // Mock useDrivingMode specifically for this test
      vi.mocked(useDrivingMode).mockReturnValue({
        isListening: false,
        isContinuous: true, // Start with it ON
        setIsContinuous: mockSetIsContinuous,
        micError: "",
        startSpeechRecognition: vi.fn(),
        stopSpeechRecognition: mockStopSpeechRecognition,
        transcript: "",
        toast: { message: null, show: false },
        clearToast: vi.fn()
      } as any);

      render(<DrivingMode {...defaultProps} />);
      
      // Trigger offline
      fireEvent(window, new Event("offline"));
      
      // Should have disabled continuous mode
      expect(mockSetIsContinuous).toHaveBeenCalledWith(false);
      // Should have stopped recognition
      expect(mockStopSpeechRecognition).toHaveBeenCalled();
      // Should show feedback
      expect(screen.getByText(/Mất mạng: Đã tắt giọng nói/i)).toBeTruthy();
    });
  });
});
