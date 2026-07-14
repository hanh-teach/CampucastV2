// src/hooks/useSpeechRecognition.ts
import { useState, useEffect, useCallback, useRef } from "react";

export type SpeechRecognitionErrorType = "unsupported" | "offline" | "error" | null;

interface UseSpeechRecognitionProps {
  uiLanguage: "vi" | "en";
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onTranscript?: (transcript: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (type: SpeechRecognitionErrorType, message: string, detail?: string) => void;
  /** Optional factory for testing or mobile platforms */
  speechRecognitionFactory?: any;
}

export function useSpeechRecognition({
  uiLanguage,
  lang,
  continuous = false,
  interimResults = false,
  onTranscript,
  onStart,
  onEnd,
  onError,
  speechRecognitionFactory
}: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<SpeechRecognitionErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const recognitionRef = useRef<any>(null);
  const activeListeningRef = useRef<boolean>(false);
  const manualStopRef = useRef<boolean>(false);
  const lastEndTimeRef = useRef<number>(0);

  // Helper to get localized messages
  const getLocalizedMessages = useCallback(() => {
    return {
      offline: uiLanguage === "vi"
        ? "Mất kết nối mạng. Vui lòng kiểm tra lại kết nối và thử lại."
        : "Network connection lost. Please check your connection and try again.",
      unsupported: uiLanguage === "vi"
        ? "Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Hãy sử dụng Google Chrome hoặc Microsoft Edge, hoặc gõ tay câu hỏi."
        : "Speech recognition is not supported on this browser. Please use Google Chrome, Microsoft Edge, or type your query manually.",
      micDenied: uiLanguage === "vi"
        ? "Quyền sử dụng Microphone bị từ chối. Vui lòng cấp quyền truy cập mic."
        : "Microphone access was denied. Please grant microphone permissions.",
      noSpeech: uiLanguage === "vi"
        ? "Không nghe thấy giọng nói hoặc micro bị tắt."
        : "No speech detected or microphone is disabled.",
      generalError: uiLanguage === "vi"
        ? "Lỗi nhận diện giọng nói. Vui lòng thử lại."
        : "Speech recognition error. Please try again."
    };
  }, [uiLanguage]);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    activeListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null; // Prevent loops
        recognitionRef.current.abort();
      } catch (err) {
        console.warn("Error aborting recognition:", err);
      }
      recognitionRef.current = null;
    }
    if (onEnd) {
      onEnd();
    }
  }, [onEnd]);

  // Handle offline event during active recording
  useEffect(() => {
    const handleOffline = () => {
      if (activeListeningRef.current) {
        const msgs = getLocalizedMessages();
        setErrorType("offline");
        setErrorMessage(msgs.offline);
        stopListening();
        if (onError) {
          onError("offline", msgs.offline, "network-offline");
        }
      }
    };

    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("offline", handleOffline);
    };
  }, [getLocalizedMessages, stopListening, onError]);

  const startListening = useCallback(() => {
    manualStopRef.current = false;
    setErrorType(null);
    setErrorMessage("");

    const msgs = getLocalizedMessages();

    // 1. Check network connection first
    if (!navigator.onLine) {
      setErrorType("offline");
      setErrorMessage(msgs.offline);
      if (onError) {
        onError("offline", msgs.offline, "start-offline");
      }
      return;
    }

    // 2. Check browser support
    const SpeechRecognitionClass =
      speechRecognitionFactory || (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setErrorType("unsupported");
      setErrorMessage(msgs.unsupported);
      if (onError) {
        onError("unsupported", msgs.unsupported, "api-missing");
      }
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognitionClass();
      recognition.lang = lang || (uiLanguage === "vi" ? "vi-VN" : "en-US");
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;

      recognition.onstart = () => {
        if (lastEndTimeRef.current > 0) {
          const gap = performance.now() - lastEndTimeRef.current;
          console.debug(`[SpeechRecognition] Gap between sessions: ${gap.toFixed(2)}ms`);
        }
        setIsListening(true);
        activeListeningRef.current = true;
        if (onStart) {
          onStart();
        }
      };

      recognition.onerror = (event: any) => {
        // Suppress console.error for benign/expected events
        if (event.error === "aborted" || event.error === "no-speech") {
          console.debug(`[SpeechRecognition] Benign event: ${event.error}`);
          setIsListening(false);
          activeListeningRef.current = false;
          return;
        }

        console.error("Speech Recognition runtime error:", event.error);
        
        let type: SpeechRecognitionErrorType = "error";
        let msg = msgs.generalError;

        if (event.error === "not-allowed") {
          msg = msgs.micDenied;
        } else if (event.error === "network") {
          type = "offline";
          msg = msgs.offline;
        }

        setErrorType(type);
        setErrorMessage(msg);
        setIsListening(false);
        activeListeningRef.current = false;

        if (onError) {
          onError(type, msg, event.error);
        }
      };

      recognition.onend = () => {
        lastEndTimeRef.current = performance.now();
        setIsListening(false);
        activeListeningRef.current = false;
        
        // If not manually stopped, it means browser auto-ended (e.g. 60s timeout in continuous mode)
        if (onEnd) {
          onEnd();
        }
      };

      recognition.onresult = (event: any) => {
        // In continuous mode, we loop through all new results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            const transcript = result[0].transcript;
            if (onTranscript && transcript && transcript.trim() !== "") {
              onTranscript(transcript);
            }
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (err: any) {
      console.error("Speech Recognition startup exception:", err);
      setErrorType("error");
      setErrorMessage(msgs.generalError);
      setIsListening(false);
      activeListeningRef.current = false;
      if (onError) {
        onError("error", msgs.generalError, err.message || "startup-failed");
      }
    }
  }, [uiLanguage, lang, continuous, interimResults, getLocalizedMessages, onTranscript, onStart, onEnd, onError]);

  useEffect(() => {
    return () => {
      activeListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isListening,
    errorType,
    errorMessage,
    startListening,
    stopListening,
    clearError: () => {
      setErrorType(null);
      setErrorMessage("");
    }
  };
}
