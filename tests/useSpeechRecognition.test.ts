/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpeechRecognition } from "../src/hooks/useSpeechRecognition";

let lastInstance: any = null;

// Mock SpeechRecognition
class MockSpeechRecognition {
  lang = "";
  continuous = false;
  interimResults = false;
  onstart: any = null;
  onresult: any = null;
  onerror: any = null;
  onend: any = null;
  
  constructor() {
    lastInstance = this;
  }
  
  start = vi.fn(function(this: any) {
    if (this.onstart) setTimeout(this.onstart, 0);
  });
  
  abort = vi.fn(function(this: any) {
    if (this.onend) setTimeout(this.onend, 0);
  });

  stop = vi.fn(function(this: any) {
    if (this.onend) setTimeout(this.onend, 0);
  });
}

describe("useSpeechRecognition Hook (Prompt B8)", () => {
  beforeEach(() => {
    lastInstance = null;
    vi.stubGlobal("SpeechRecognition", MockSpeechRecognition);
    vi.stubGlobal("webkitSpeechRecognition", MockSpeechRecognition);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  });

  it("should process multiple final results in continuous mode", async () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({
      uiLanguage: "en",
      continuous: true,
      onTranscript
    }));

    await act(async () => {
      result.current.startListening();
    });

    expect(lastInstance).toBeTruthy();
    
    await act(async () => {
      // Simulate multiple results
      const event = {
        resultIndex: 0,
        results: [
          { isFinal: true, 0: { transcript: "hello" } },
          { isFinal: true, 0: { transcript: "world" } }
        ]
      };
      lastInstance.onresult(event);
    });

    expect(onTranscript).toHaveBeenCalledWith("hello");
    expect(onTranscript).toHaveBeenCalledWith("world");
    expect(onTranscript).toHaveBeenCalledTimes(2);
  });

  it("should ignore interim results and only process final ones", async () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({
      uiLanguage: "en",
      continuous: true,
      onTranscript
    }));

    await act(async () => {
      result.current.startListening();
    });

    await act(async () => {
      const event = {
        resultIndex: 0,
        results: [
          { isFinal: false, 0: { transcript: "hel" } },
          { isFinal: true, 0: { transcript: "hello" } }
        ]
      };
      lastInstance.onresult(event);
    });

    expect(onTranscript).toHaveBeenCalledWith("hello");
    expect(onTranscript).not.toHaveBeenCalledWith("hel");
    expect(onTranscript).toHaveBeenCalledTimes(1);
  });

  it("should correctly handle new results from resultIndex", async () => {
    const onTranscript = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({
      uiLanguage: "en",
      continuous: true,
      onTranscript
    }));

    await act(async () => {
      result.current.startListening();
    });

    // First result
    await act(async () => {
      const event1 = {
        resultIndex: 0,
        results: [
          { isFinal: true, 0: { transcript: "first" } }
        ]
      };
      lastInstance.onresult(event1);
    });

    // Second result (comes with the first one still in the array)
    await act(async () => {
      const event2 = {
        resultIndex: 1,
        results: [
          { isFinal: true, 0: { transcript: "first" } },
          { isFinal: true, 0: { transcript: "second" } }
        ]
      };
      lastInstance.onresult(event2);
    });

    expect(onTranscript).toHaveBeenCalledWith("first");
    expect(onTranscript).toHaveBeenCalledWith("second");
    expect(onTranscript).toHaveBeenCalledTimes(2);
  });

  it("should trigger onEnd and allow auto-restart when browser ends session", async () => {
    const onEnd = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({
      uiLanguage: "en",
      onEnd
    }));

    await act(async () => {
      result.current.startListening();
    });

    await act(async () => {
      lastInstance.onend();
    });

    // Wait for state updates to propagate
    await vi.waitFor(() => {
      expect(onEnd).toHaveBeenCalled();
      expect(result.current.isListening).toBe(false);
    });
  });

  it("should use injected speechRecognitionFactory if provided", async () => {
    const CustomMock = vi.fn().mockImplementation(function() {
      return {
        start: vi.fn(),
        abort: vi.fn(),
        stop: vi.fn(),
        onstart: null,
        onresult: null,
        onerror: null,
        onend: null
      };
    });

    const { result } = renderHook(() => useSpeechRecognition({
      uiLanguage: "en",
      speechRecognitionFactory: CustomMock as any
    }));

    await act(async () => {
      result.current.startListening();
    });

    expect(CustomMock).toHaveBeenCalled();
  });
});
