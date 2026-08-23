// src/hooks/useVoiceSearch.ts
/**
 * Unified Web Speech API Normalization Hook
 * 
 * Wraps the browser's native 'SpeechRecognition' or 'webkitSpeechRecognition' constructor
 * to normalize runtime behaviors and prevent initialization divergence between Google Chrome
 * (Google Cloud Speech WebSocket pipeline) and Microsoft Edge (Windows OS/Azure Cognitive Speech).
 *
 * Core Normalizations:
 * 1. Safe Constructor Detection: Gracefully falls back across window.SpeechRecognition, window.webkitSpeechRecognition, and custom factories.
 * 2. Consistent Language (lang) Normalization: Enforces canonical BCP 47 language tags ('vi-VN', 'en-US', etc.) across speech engine types.
 * 3. Consistent interimResults & continuous Handling: Accurately handles partial vs finalized transcripts, indexing offsets, and confidence values.
 * 4. Error Normalization: Suppresses benign abort/user cancel exceptions, categorizes network socket failures, and provides unified error feedback.
 * 5. Lifecycle & State Protection: Guards against Chrome's InvalidStateError on overlapping start/stop calls and ensures proper audio cleanups.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { syncSaveVoiceHistoryAsync } from "../services/syncService";
import {
  detectSpeechCapabilities,
  normalizeSpeechLanguage,
  extractNormalizedTranscript,
  NormalizedSpeechRecognitionWrapper,
  SpeechFeatureSupport
} from "../utils/speechPolyfill";

export interface VoiceSearchHookOptions {
  getApiUrl?: (path: string) => string;
  translations?: any;
  uiLanguage?: "vi" | "en";
  initialLanguage?: "vi-VN" | "en-US";
  interimResults?: boolean;
  continuous?: boolean;
  maxAlternatives?: number;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (errorType: string, message: string) => void;
}

export interface VoiceQueryResult {
  answer: string;
  sources?: Array<{ title: string; uri: string }>;
  confidence?: number;
}

export function useVoiceSearch(
  getApiUrlOrOptions?: ((path: string) => string) | VoiceSearchHookOptions,
  legacyTranslations?: any,
  legacyUiLanguage?: string
) {
  // Support both overloaded signatures: (getApiUrl, t, uiLanguage) and options object
  const options: VoiceSearchHookOptions = typeof getApiUrlOrOptions === "function"
    ? {
        getApiUrl: getApiUrlOrOptions,
        translations: legacyTranslations,
        uiLanguage: (legacyUiLanguage as "vi" | "en") || "vi"
      }
    : (getApiUrlOrOptions || {});

  const uiLanguage: "vi" | "en" = options.uiLanguage || "vi";
  const defaultApiResolver = (path: string) => path;
  const getApiUrl = options.getApiUrl || defaultApiResolver;

  // Language state: 'vi-VN' or 'en-US' (normalized BCP 47)
  const [voiceInputLanguage, setVoiceInputLanguage] = useState<"vi-VN" | "en-US">(
    options.initialLanguage || (uiLanguage === "vi" ? "vi-VN" : "en-US")
  );

  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [voiceQueryStatus, setVoiceQueryStatus] = useState<string>("");
  const [voiceQueryResult, setVoiceQueryResult] = useState<VoiceQueryResult | null>(null);
  const [voiceQuerySources, setVoiceQuerySources] = useState<Array<{ title: string; uri: string }>>([]);
  const [showVoiceAddPrompt, setShowVoiceAddPrompt] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string>("");
  const [speechErrorType, setSpeechErrorType] = useState<string | null>(null);
  const [isProcessingVoiceQuery, setIsProcessingVoiceQuery] = useState<boolean>(false);
  const [capabilities, setCapabilities] = useState<SpeechFeatureSupport>(() => detectSpeechCapabilities());

  // Recognition wrapper reference
  const recognitionRef = useRef<NormalizedSpeechRecognitionWrapper | null>(null);
  const isStartedRef = useRef<boolean>(false);
  const isManualAbortRef = useRef<boolean>(false);
  const currentLangRef = useRef<string>(voiceInputLanguage);
  currentLangRef.current = voiceInputLanguage;

  // Sync capabilities on mount
  useEffect(() => {
    setCapabilities(detectSpeechCapabilities());
  }, []);

  // Update language if UI language changes and not explicitly set
  useEffect(() => {
    if (!options.initialLanguage) {
      setVoiceInputLanguage(uiLanguage === "vi" ? "vi-VN" : "en-US");
    }
  }, [uiLanguage, options.initialLanguage]);

  // Localized string dictionary helper
  const getMessages = useCallback(() => {
    const t = options.translations;
    return {
      listening: t?.btnListening || (uiLanguage === "vi" ? "Đang nghe... nói đi nào" : "Listening... speak now"),
      processing: t?.queryProcessing || t?.processing || (uiLanguage === "vi" ? "Đang suy nghĩ xử lý..." : "Thinking and processing..."),
      success: t?.querySuccess || t?.success || (uiLanguage === "vi" ? "Đã tìm kiếm thành công!" : "Query answered successfully!"),
      noSpeech: t?.speechErrorNotFound || (uiLanguage === "vi" ? "Không nhận diện được giọng nói hoặc micro bị tắt." : "Speech not recognized or mic disabled."),
      unsupported: t?.speechNotSupported || (uiLanguage === "vi" ? "Trình duyệt chưa hỗ trợ Web Speech API." : "Speech recognition not supported on this browser."),
      chromeSocketNotice: uiLanguage === "vi"
        ? "Kết nối Web Speech API trên Chrome bị gián đoạn. Đang kết nối lại..."
        : "Web Speech network socket interrupted on Chrome. Retrying...",
      genericError: uiLanguage === "vi" ? "Lỗi nhận diện giọng nói. Vui lòng thử lại." : "Voice recognition error. Please try again."
    };
  }, [options.translations, uiLanguage]);

  // Process completed voice query via backend AI API
  const handleQueryText = useCallback(async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery) {
      const msgs = getMessages();
      setVoiceError(msgs.noSpeech);
      setSpeechErrorType("no-speech");
      return;
    }

    try {
      setIsProcessingVoiceQuery(true);
      const msgs = getMessages();
      setVoiceQueryStatus(msgs.processing);
      setVoiceError("");

      const response = await fetch(getApiUrl("/api/voice-query"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanQuery,
          language: voiceInputLanguage.startsWith("vi") ? "vi" : "en"
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Query request failed");
      }

      const data = await response.json();
      if (data.answer) {
        setVoiceQueryResult({
          answer: data.answer,
          sources: data.sources || [],
          confidence: data.confidence
        });
        setVoiceQuerySources(data.sources || []);
        setShowVoiceAddPrompt(true);
        setVoiceQueryStatus(msgs.success);

        // Async sync save voice intelligence history
        try {
          await syncSaveVoiceHistoryAsync({
            query: cleanQuery,
            answer: data.answer,
            language: voiceInputLanguage.startsWith("vi") ? "vi" : "en",
            sources: data.sources || []
          });
        } catch (historyErr) {
          console.warn("[useVoiceSearch] Failed to save synced voice history:", historyErr);
        }
      } else {
        setVoiceError(
          uiLanguage === "vi"
            ? "Trợ lý không tìm được câu trả lời phù hợp. Hãy thử hỏi lại nhé!"
            : "Could not find a relevant answer. Try asking again!"
        );
      }
    } catch (err: any) {
      console.error("[useVoiceSearch] Voice query processing error:", err);
      setVoiceError(err.message || "Failed to process voice query");
      setSpeechErrorType("query-error");
    } finally {
      setIsProcessingVoiceQuery(false);
    }
  }, [getApiUrl, getMessages, voiceInputLanguage, uiLanguage]);

  // Clean up and abort active recognition instance
  const cleanupRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Suppress abort errors
      }
      recognitionRef.current = null;
    }
    isStartedRef.current = false;
    setIsListening(false);
  }, []);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      cleanupRecognition();
    };
  }, [cleanupRecognition]);

  // Stop listening gracefully
  const stopListening = useCallback(() => {
    isManualAbortRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.debug("[useVoiceSearch] Stop call suppressed:", err);
      }
    }
    isStartedRef.current = false;
    setIsListening(false);
  }, []);

  // Initialize and start normalized SpeechRecognition
  const startListening = useCallback(() => {
    const msgs = getMessages();
    setVoiceError("");
    setSpeechErrorType(null);
    setVoiceQueryStatus("");
    setVoiceQueryResult(null);
    setVoiceQuerySources([]);
    setShowVoiceAddPrompt(false);
    setTranscript("");
    setInterimTranscript("");

    // Detect capabilities
    const caps = detectSpeechCapabilities();
    setCapabilities(caps);

    const SpeechClass = typeof window !== "undefined"
      ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
      : null;

    if (!SpeechClass) {
      setVoiceError(msgs.unsupported);
      setSpeechErrorType("unsupported");
      if (options.onError) {
        options.onError("unsupported", msgs.unsupported);
      }
      return;
    }

    // Stop existing instance if running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    try {
      const normalizedLang = normalizeSpeechLanguage(currentLangRef.current);
      const wrapper = new NormalizedSpeechRecognitionWrapper();

      // Configure unified properties
      wrapper.lang = normalizedLang;
      wrapper.continuous = Boolean(options.continuous ?? false);
      wrapper.interimResults = Boolean(options.interimResults ?? true);
      wrapper.maxAlternatives = options.maxAlternatives || 1;

      isManualAbortRef.current = false;

      wrapper.onstart = () => {
        isStartedRef.current = true;
        setIsListening(true);
        setVoiceQueryStatus(msgs.listening);
      };

      wrapper.onresult = (data) => {
        const finalTxt = data.finalTranscript || "";
        const interimTxt = data.interimTranscript || "";

        if (interimTxt) {
          setInterimTranscript(interimTxt);
          if (options.onTranscript) {
            options.onTranscript(interimTxt, false);
          }
        }

        if (finalTxt) {
          setTranscript(finalTxt);
          setInterimTranscript("");
          if (options.onTranscript) {
            options.onTranscript(finalTxt, true);
          }
          // Query backend with finalized text
          handleQueryText(finalTxt);
        }
      };

      wrapper.onerror = (event) => {
        const err = event.error;
        console.warn(`[useVoiceSearch] Normalized speech error: ${err}`);

        if (err === "aborted" && isManualAbortRef.current) {
          // Benign user stop, ignore error
          return;
        }

        let userMsg = msgs.genericError;
        if (err === "network") {
          userMsg = caps.browser === "chrome" ? msgs.chromeSocketNotice : msgs.genericError;
        } else if (err === "not-allowed" || err === "service-not-allowed") {
          userMsg = uiLanguage === "vi" 
            ? "Quyền sử dụng Microphone bị từ chối. Vui lòng cấp quyền truy cập." 
            : "Microphone permission denied. Please grant microphone access.";
        } else if (err === "no-speech") {
          userMsg = msgs.noSpeech;
        }

        setVoiceError(userMsg);
        setSpeechErrorType(err);

        if (options.onError) {
          options.onError(err, userMsg);
        }
      };

      wrapper.onend = () => {
        isStartedRef.current = false;
        setIsListening(false);
      };

      recognitionRef.current = wrapper;
      wrapper.start();

    } catch (startErr: any) {
      console.error("[useVoiceSearch] Error during recognition start:", startErr);
      isStartedRef.current = false;
      setIsListening(false);
      const errMsg = startErr?.message || msgs.genericError;
      setVoiceError(errMsg);
      setSpeechErrorType("init-error");
      if (options.onError) {
        options.onError("init-error", errMsg);
      }
    }
  }, [getMessages, handleQueryText, options, uiLanguage]);

  // Toggle voice search
  const toggleVoiceSearch = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Alias startVoiceSearch to match existing component callers
  const startVoiceSearch = startListening;

  // Append voice query result to news briefing script
  const handleVoiceAddToBriefing = useCallback((setNewsContent: React.Dispatch<React.SetStateAction<string>>) => {
    if (voiceQueryResult && voiceQueryResult.answer) {
      setNewsContent((prev) => {
        const separator = prev ? "\n\n---\n\n" : "";
        return prev + separator + voiceQueryResult.answer;
      });
      setShowVoiceAddPrompt(false);
      setVoiceQueryResult(null);
      setVoiceQuerySources([]);
      setVoiceQueryStatus("");
    }
  }, [voiceQueryResult]);

  return {
    // State
    isListening,
    transcript,
    interimTranscript,
    voiceInputLanguage,
    setVoiceInputLanguage,
    voiceQueryStatus,
    setVoiceQueryStatus,
    voiceQueryResult,
    setVoiceQueryResult,
    voiceQuerySources,
    setVoiceQuerySources,
    showVoiceAddPrompt,
    setShowVoiceAddPrompt,
    voiceError,
    setVoiceError,
    speechErrorType,
    isProcessingVoiceQuery,
    capabilities,

    // Actions
    startListening,
    stopListening,
    startVoiceSearch,
    toggleVoiceSearch,
    handleVoiceAddToBriefing
  };
}
