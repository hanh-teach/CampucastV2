// src/utils/speechPolyfill.ts
/**
 * Web Speech API Feature Detection & Normalization Polyfill Layer
 * Normalizes differences between Chromium variants (Chrome, Edge, Opera, Brave, etc.),
 * Safari (WebKit), and unsupported browsers.
 *
 * Normalization Coverage:
 * 1. Constructor detection & fallback resolution (SpeechRecognition vs webkitSpeechRecognition vs Polyfill)
 * 2. Event normalization:
 *    - Edge vs Chrome result structure variations (resultIndex indexing, isFinal vs interim ordering)
 *    - Empty transcript filtering and trim normalization
 *    - Speech recognition language tag normalization (e.g. 'vi' -> 'vi-VN', 'en' -> 'en-US')
 *    - Benign event dampening (e.g., 'no-speech' or 'aborted' during manual toggle)
 *    - Edge cases where Chrome crashes when calling start() consecutively without stop()
 * 3. Feature detection capabilities & environment diagnostics (e.g. isEdge, isChrome, isSafari, isHttps, hasMicPermission)
 */

export interface SpeechFeatureSupport {
  isSupported: boolean;
  hasNativeWebSpeech: boolean;
  hasMediaRecorder: boolean;
  hasAudioContext: boolean;
  isSecureContext: boolean;
  browser: "chrome" | "edge" | "safari" | "firefox" | "opera" | "other";
  supportsContinuous: boolean;
  recommendedEngine: "webspeech" | "ai_fallback";
}

/**
 * Detect browser engine and feature capabilities
 */
export function detectSpeechCapabilities(): SpeechFeatureSupport {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isEdge = /Edg\//i.test(ua);
  const isOpera = /OPR\//i.test(ua);
  const isChrome = /Chrome\//i.test(ua) && !isEdge && !isOpera;
  const isSafari = /Safari\//i.test(ua) && !isChrome && !isEdge && !isOpera;
  const isFirefox = /Firefox\//i.test(ua);

  let browser: SpeechFeatureSupport["browser"] = "other";
  if (isEdge) browser = "edge";
  else if (isChrome) browser = "chrome";
  else if (isSafari) browser = "safari";
  else if (isFirefox) browser = "firefox";
  else if (isOpera) browser = "opera";

  const hasNativeWebSpeech = typeof window !== "undefined" && Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );

  const hasMediaRecorder = typeof window !== "undefined" && typeof MediaRecorder !== "undefined";
  const hasAudioContext = typeof window !== "undefined" && Boolean(
    window.AudioContext || (window as any).webkitAudioContext
  );
  const isSecureContext = typeof window !== "undefined" ? Boolean(window.isSecureContext) : false;

  // On Edge, Microsoft Speech cognitive service works reliably with continuous mode.
  // On Chrome, continuous mode frequently triggers timeout disconnects after 5-10s.
  const supportsContinuous = isEdge || isSafari;

  return {
    isSupported: hasNativeWebSpeech || hasMediaRecorder,
    hasNativeWebSpeech,
    hasMediaRecorder,
    hasAudioContext,
    isSecureContext,
    browser,
    supportsContinuous,
    recommendedEngine: hasNativeWebSpeech ? "webspeech" : "ai_fallback"
  };
}

/**
 * Normalizes BCP 47 language codes across browser recognition engines
 */
export function normalizeSpeechLanguage(langOrUi: string): string {
  const clean = (langOrUi || "").toLowerCase().trim();
  if (clean === "vi" || clean === "vi-vn" || clean === "vietnamese") {
    return "vi-VN";
  }
  if (clean === "en" || clean === "en-us" || clean === "english") {
    return "en-US";
  }
  if (clean === "en-gb" || clean === "en-uk") {
    return "en-GB";
  }
  return langOrUi || "vi-VN";
}

/**
 * Normalized Speech Event & Result structure
 */
export interface NormalizedSpeechResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
  rawEvent: any;
}

/**
 * Extracts and normalizes speech transcript text across Chrome, Edge, and WebKit
 */
export function extractNormalizedTranscript(event: any): {
  finalTranscript: string;
  interimTranscript: string;
  results: NormalizedSpeechResult[];
} {
  let finalTranscript = "";
  let interimTranscript = "";
  const results: NormalizedSpeechResult[] = [];

  if (!event || !event.results) {
    return { finalTranscript: "", interimTranscript: "", results: [] };
  }

  const resultIndex = typeof event.resultIndex === "number" ? event.resultIndex : 0;

  for (let i = 0; i < event.results.length; ++i) {
    const resultItem = event.results[i];
    if (!resultItem || !resultItem[0]) continue;

    const piece = resultItem[0];
    const text = (piece.transcript || "").trim();
    const confidence = typeof piece.confidence === "number" ? piece.confidence : 1.0;
    const isFinal = Boolean(resultItem.isFinal);

    if (text.length > 0) {
      results.push({
        transcript: text,
        isFinal,
        confidence,
        rawEvent: event
      });

      if (isFinal) {
        finalTranscript += (finalTranscript ? " " : "") + text;
      } else if (i >= resultIndex) {
        interimTranscript += (interimTranscript ? " " : "") + text;
      }
    }
  }

  return {
    finalTranscript: finalTranscript.trim(),
    interimTranscript: interimTranscript.trim(),
    results
  };
}

/**
 * Safe Speech Recognition Wrapper (Normalizer Polyfill)
 * Wraps SpeechRecognition to shield application from:
 * - Calling start() when already started (InvalidStateError in Chrome)
 * - Rapid start/stop race conditions
 * - Uncaught network errors
 */
export class NormalizedSpeechRecognitionWrapper {
  private instance: any = null;
  private isStarted = false;
  private isAborted = false;
  private capabilities = detectSpeechCapabilities();

  public lang = "vi-VN";
  public continuous = false;
  public interimResults = true;
  public maxAlternatives = 1;

  public onstart: (() => void) | null = null;
  public onend: (() => void) | null = null;
  public onerror: ((event: { error: string; message?: string }) => void) | null = null;
  public onresult: ((data: { finalTranscript: string; interimTranscript: string; results: NormalizedSpeechResult[] }) => void) | null = null;
  public onspeechend: (() => void) | null = null;

  constructor(customFactory?: any) {
    const RecognitionClass = customFactory || (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
    if (RecognitionClass) {
      try {
        this.instance = new RecognitionClass();
        this.bindEvents();
      } catch (err) {
        console.warn("[SpeechPolyfill] Failed to instantiate native SpeechRecognition:", err);
      }
    }
  }

  public get isSupported(): boolean {
    return Boolean(this.instance);
  }

  private bindEvents() {
    if (!this.instance) return;

    this.instance.onstart = () => {
      this.isStarted = true;
      this.isAborted = false;
      if (this.onstart) this.onstart();
    };

    this.instance.onend = () => {
      this.isStarted = false;
      if (this.onend && !this.isAborted) {
        this.onend();
      }
    };

    this.instance.onerror = (event: any) => {
      const err = event?.error || "unknown";
      // Suppress benign aborted events on user-initiated stops
      if (err === "aborted" && this.isAborted) {
        return;
      }
      if (this.onerror) {
        this.onerror({
          error: err,
          message: event?.message || `Speech recognition error: ${err}`
        });
      }
    };

    this.instance.onresult = (event: any) => {
      const normalized = extractNormalizedTranscript(event);
      if (this.onresult) {
        this.onresult(normalized);
      }
    };

    this.instance.onspeechend = () => {
      if (this.onspeechend) {
        this.onspeechend();
      }
    };
  }

  public start() {
    if (!this.instance) {
      throw new Error("SPEECH_NOT_SUPPORTED");
    }

    if (this.isStarted) {
      console.debug("[SpeechPolyfill] Recognition already running. Ignoring duplicate start call.");
      return;
    }

    try {
      this.instance.lang = normalizeSpeechLanguage(this.lang);
      this.instance.continuous = this.continuous;
      this.instance.interimResults = this.interimResults;
      this.instance.maxAlternatives = this.maxAlternatives;
      this.isAborted = false;
      this.instance.start();
    } catch (err: any) {
      // Chrome InvalidStateError prevention
      if (err.name === "InvalidStateError" || err.message?.includes("already started")) {
        console.debug("[SpeechPolyfill] Handled InvalidStateError on start().");
        this.isStarted = true;
        return;
      }
      throw err;
    }
  }

  public stop() {
    if (!this.instance || !this.isStarted) return;
    try {
      this.instance.stop();
    } catch (err) {
      console.debug("[SpeechPolyfill] Stop error suppressed:", err);
    } finally {
      this.isStarted = false;
    }
  }

  public abort() {
    if (!this.instance) return;
    this.isAborted = true;
    try {
      this.instance.abort();
    } catch (err) {
      console.debug("[SpeechPolyfill] Abort error suppressed:", err);
    } finally {
      this.isStarted = false;
    }
  }
}
