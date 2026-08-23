/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "./renderHook";
import { useMotionDetection } from "../src/hooks/useMotionDetection";

// Mock UserPreferencesProvider to control the preference opt-in state
let mockPreferences = {
  autoSuggestDrivingModeEnabled: false,
};

vi.mock("../src/components/UserPreferencesProvider", () => ({
  useUserPreferences: () => ({
    preferences: mockPreferences,
    updatePreferences: vi.fn(),
  }),
  UserPreferencesProvider: ({ children }: any) => children,
}));

describe("useMotionDetection Hook", () => {
  let successHandler: ((pos: any) => void) | null = null;
  let errorHandler: ((err: any) => void) | null = null;
  const mockWatchId = 999;

  beforeEach(() => {
    mockPreferences.autoSuggestDrivingModeEnabled = false;
    successHandler = null;
    errorHandler = null;

    // Setup standard mock for geolocation
    const mockGeolocation = {
      watchPosition: vi.fn().mockImplementation((success, error) => {
        successHandler = success;
        errorHandler = error;
        return mockWatchId;
      }),
      clearWatch: vi.fn().mockImplementation((id) => {
        if (id === mockWatchId) {
          successHandler = null;
          errorHandler = null;
        }
      }),
    };

    vi.stubGlobal("navigator", {
      geolocation: mockGeolocation,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not activate geolocation watchPosition if autoSuggestDrivingModeEnabled is false", () => {
    mockPreferences.autoSuggestDrivingModeEnabled = false;
    
    const { result } = renderHook(() => useMotionDetection());
    
    expect(navigator.geolocation.watchPosition).not.toHaveBeenCalled();
    expect(result.current.speed).toBe(0);
    expect(result.current.suggestDrivingMode).toBe(false);
  });

  it("should activate geolocation watchPosition if autoSuggestDrivingModeEnabled is true", () => {
    mockPreferences.autoSuggestDrivingModeEnabled = true;

    const { result } = renderHook(() => useMotionDetection());

    expect(navigator.geolocation.watchPosition).toHaveBeenCalled();
    expect(result.current.speed).toBe(0);
    expect(result.current.suggestDrivingMode).toBe(false);
  });

  it("should capture speed directly from GeolocationCoordinates.speed if supported", () => {
    mockPreferences.autoSuggestDrivingModeEnabled = true;

    const { result } = renderHook(() => useMotionDetection());

    // Simulate position update with speed of 10 m/s (36 km/h)
    act(() => {
      if (successHandler) {
        successHandler({
          coords: {
            latitude: 21.0,
            longitude: 105.0,
            speed: 10, // 10 m/s = 36 km/h
          },
          timestamp: Date.now(),
        });
      }
    });

    expect(result.current.speed).toBe(36);
  });

  it("should compute speed from distance difference if coordinates.speed is null", () => {
    mockPreferences.autoSuggestDrivingModeEnabled = true;

    const { result } = renderHook(() => useMotionDetection());

    const now = Date.now();

    // First coordinate update
    act(() => {
      if (successHandler) {
        successHandler({
          coords: {
            latitude: 21.0,
            longitude: 105.0,
            speed: null,
          },
          timestamp: now,
        });
      }
    });

    // Second coordinate update (latitude difference of 0.005 degrees ~ 0.556 km in 10 seconds)
    // 0.556 km / (10/3600 hours) ≈ 200 km/h
    act(() => {
      if (successHandler) {
        successHandler({
          coords: {
            latitude: 21.005,
            longitude: 105.0,
            speed: null,
          },
          timestamp: now + 10000, // +10s
        });
      }
    });

    // Speed should be calculated as substantial speed (>15 km/h)
    expect(result.current.speed).toBeGreaterThan(15);
  });

  it("should trigger suggestion when speed > 15 km/h is sustained for 30 seconds", () => {
    mockPreferences.autoSuggestDrivingModeEnabled = true;

    const { result } = renderHook(() => useMotionDetection());

    const now = Date.now();

    // Send first position update above 15km/h (say 20 m/s = 72 km/h)
    act(() => {
      if (successHandler) {
        successHandler({
          coords: {
            latitude: 21.0,
            longitude: 105.0,
            speed: 20,
          },
          timestamp: now,
        });
      }
    });

    // Suggestion shouldn't be active immediately
    expect(result.current.suggestDrivingMode).toBe(false);

    // Send update after 15 seconds (still above 15 km/h)
    act(() => {
      if (successHandler) {
        successHandler({
          coords: {
            latitude: 21.0,
            longitude: 105.0,
            speed: 20,
          },
          timestamp: now + 15000,
        });
      }
    });

    expect(result.current.suggestDrivingMode).toBe(false);

    // Send update after 30 seconds (still above 15 km/h)
    act(() => {
      if (successHandler) {
        successHandler({
          coords: {
            latitude: 21.0,
            longitude: 105.0,
            speed: 20,
          },
          timestamp: now + 30000,
        });
      }
    });

    // Suggestion should now be active
    expect(result.current.suggestDrivingMode).toBe(true);
  });

  it("should reset high speed tracking timer if speed drops below 15 km/h", () => {
    mockPreferences.autoSuggestDrivingModeEnabled = true;

    const { result } = renderHook(() => useMotionDetection());

    const now = Date.now();

    // Start high speed tracking
    act(() => {
      if (successHandler) {
        successHandler({
          coords: {
            latitude: 21.0,
            longitude: 105.0,
            speed: 20, // >15 km/h
          },
          timestamp: now,
        });
      }
    });

    // Speed drops below threshold
    act(() => {
      if (successHandler) {
        successHandler({
          coords: {
            latitude: 21.0,
            longitude: 105.0,
            speed: 2, // <15 km/h
          },
          timestamp: now + 10000,
        });
      }
    });

    // Send high speed update again at +35 seconds (relative to start)
    act(() => {
      if (successHandler) {
        successHandler({
          coords: {
            latitude: 21.0,
            longitude: 105.0,
            speed: 20, // >15 km/h
          },
          timestamp: now + 35000,
        });
      }
    });

    // Expect no driving suggestion since the continuous tracking reset
    expect(result.current.suggestDrivingMode).toBe(false);
  });

  it("should clear error and close watch cleanly when disabled", () => {
    mockPreferences.autoSuggestDrivingModeEnabled = true;

    const { result, rerender } = renderHook(() => useMotionDetection());

    expect(navigator.geolocation.watchPosition).toHaveBeenCalled();

    // Now toggle option to disabled
    mockPreferences.autoSuggestDrivingModeEnabled = false;
    rerender();

    expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(mockWatchId);
    expect(result.current.speed).toBe(0);
    expect(result.current.suggestDrivingMode).toBe(false);
  });
});
