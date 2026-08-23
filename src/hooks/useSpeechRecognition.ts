// src/hooks/useSpeechRecognition.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { getApiUrl } from "../utils/apiUtils";
import {
  detectSpeechCapabilities,
  normalizeSpeechLanguage,
  extractNormalizedTranscript,
  NormalizedSpeechRecognitionWrapper,
  SpeechFeatureSupport
} from "../utils/speechPolyfill";

export type SpeechRecognitionErrorType = "unsupported" | "offline" | "error" | null;
export type SpeechEngineType = "webspeech" | "ai_fallback";

interface UseSpeechRecognitionProps {
  uiLanguage: "vi" | "en";
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  autoRestart?: boolean;
  onTranscript?: (transcript: string) => void;
  onInterimTranscript?: (interim: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (type: SpeechRecognitionErrorType, message: string, detail?: string) => void;
  /** Optional factory for testing or mobile platforms */
  speechRecognitionFactory?: any;
}

// Global flag to remember if WebSpeech has network failure on current browser session (e.g. Google Chrome cloud speech blocked)
let hasWebSpeechNetworkFailed = false;

export function useSpeechRecognition({
  uiLanguage,
  lang,
  continuous = false,
  interimResults = true,
  autoRestart = false,
  onTranscript,
  onInterimTranscript,
  onStart,
  onEnd,
  onError,
  speechRecognitionFactory
}: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isAiTranscribing, setIsAiTranscribing] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [errorType, setErrorType] = useState<SpeechRecognitionErrorType>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [activeEngine, setActiveEngine] = useState<SpeechEngineType>("webspeech");
  const [capabilities, setCapabilities] = useState<SpeechFeatureSupport>(() => detectSpeechCapabilities());

  const recognitionRef = useRef<NormalizedSpeechRecognitionWrapper | null>(null);
  const activeListeningRef = useRef<boolean>(false);
  const manualStopRef = useRef<boolean>(false);
  const lastEndTimeRef = useRef<number>(0);
  const restartTimerRef = useRef<any>(null);

  // Audio Recorder (MediaRecorder fallback) state refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isFallbackActiveRef = useRef<boolean>(false);
  const autoStopTimeoutRef = useRef<any>(null);

  // Latest Callback Refs Pattern to avoid stale closures
  const onTranscriptRef = useRef(onTranscript);
  const onInterimTranscriptRef = useRef(onInterimTranscript);
  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    onInterimTranscriptRef.current = onInterimTranscript;
  }, [onInterimTranscript]);

  useEffect(() => {
    onStartRef.current = onStart;
  }, [onStart]);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Helper to get localized messages
  const getLocalizedMessages = useCallback(() => {
    return {
      offline: uiLanguage === "vi"
        ? "Mất kết nối mạng. Vui lòng kiểm tra lại kết nối và thử lại."
        : "Network connection lost. Please check your connection and try again.",
      unsupported: uiLanguage === "vi"
        ? "Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Hệ thống đang chuyển sang AI Audio Voice..."
        : "Speech recognition is not supported on this browser. Switching to AI Audio Voice...",
      micDenied: uiLanguage === "vi"
        ? "Quyền sử dụng Microphone bị từ chối. Vui lòng cấp quyền truy cập mic."
        : "Microphone access was denied. Please grant microphone permissions.",
      noSpeech: uiLanguage === "vi"
        ? "Không nghe thấy giọng nói hoặc micro bị tắt."
        : "No speech detected or microphone is disabled.",
      generalError: uiLanguage === "vi"
        ? "Lỗi nhận diện giọng nói. Đang thử lại với AI Voice Engine..."
        : "Speech recognition error. Retrying with AI Voice Engine...",
      listeningAi: uiLanguage === "vi"
        ? "🎙️ Đang lắng nghe qua AI Voice Engine... (Nhấn micro lần nữa khi nói xong)"
        : "🎙️ Listening via AI Voice Engine... (Tap mic again when finished)",
      transcribingAi: uiLanguage === "vi"
        ? "⚡ Đang xử lý giọng nói với Gemini AI..."
        : "⚡ Processing speech with Gemini AI..."
    };
  }, [uiLanguage]);

  // Clean up Web Audio and MediaRecorder resources safely
  const cleanupMediaResources = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // Ignore inactive stop error
      }
      mediaRecorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // Ignore closed error
      }
      audioContextRef.current = null;
    }
  }, []);

  // Track Audio Level via AnalyserNode
  const startAudioLevelTracking = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!activeListeningRef.current || !analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1.0, Math.max(0.1, avg / 80));
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.debug("[SpeechRecognition] AudioContext level metering error:", err);
    }
  }, []);

  // Send Audio Chunks to Server Endpoint for Gemini Transcription
  const transcribeAudioBlob = useCallback(async (blob: Blob) => {
    const msgs = getLocalizedMessages();
    setIsAiTranscribing(true);
    setInterimTranscript(msgs.transcribingAi);

    try {
      // Convert Blob to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const audioBase64 = await base64Promise;

      const endpoint = getApiUrl("/api/assistant/transcribe");
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64,
          mimeType: blob.type || "audio/webm",
          language: uiLanguage === "vi" ? "vi" : "en"
        })
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Transcription request failed");
      }

      const data = await resp.json();
      const transcript = (data.transcript || "").trim();

      setIsAiTranscribing(false);
      setInterimTranscript("");

      if (transcript && transcript.length > 0) {
        if (onTranscriptRef.current) {
          onTranscriptRef.current(transcript);
        }
      } else {
        console.debug("[SpeechRecognition Fallback] Empty audio transcript received.");
      }
    } catch (transcribeErr: any) {
      console.error("[SpeechRecognition Fallback] Transcription failed:", transcribeErr);
      setIsAiTranscribing(false);
      setInterimTranscript("");
      setErrorType("error");
      setErrorMessage(transcribeErr.message || msgs.generalError);
      if (onErrorRef.current) {
        onErrorRef.current("error", transcribeErr.message || msgs.generalError, "gemini-transcribe-failed");
      }
    } finally {
      if (onEndRef.current) {
        onEndRef.current();
      }
    }
  }, [getLocalizedMessages, uiLanguage]);

  // Start MediaRecorder Fallback Engine
  const startMediaRecorderFallback = useCallback(async () => {
    const msgs = getLocalizedMessages();
    isFallbackActiveRef.current = true;
    setActiveEngine("ai_fallback");
    audioChunksRef.current = [];

    try {
      cleanupMediaResources();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;
      startAudioLevelTracking(stream);

      // Determine best supported MIME type
      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
          mimeType = "audio/ogg;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        cleanupMediaResources();
        if (!manualStopRef.current || audioBlob.size > 1000) {
          await transcribeAudioBlob(audioBlob);
        }
      };

      recorder.start(250); // Slice chunks every 250ms
      setIsListening(true);
      activeListeningRef.current = true;
      setInterimTranscript(msgs.listeningAi);

      if (onStartRef.current) {
        onStartRef.current();
      }

      // Auto-stop after 15 seconds to prevent accidental runaway recording
      autoStopTimeoutRef.current = setTimeout(() => {
        if (activeListeningRef.current && isFallbackActiveRef.current) {
          stopListening();
        }
      }, 15000);

    } catch (micErr: any) {
      console.error("[SpeechRecognition Fallback] Microphone access error:", micErr);
      isFallbackActiveRef.current = false;
      setIsListening(false);
      activeListeningRef.current = false;
      cleanupMediaResources();

      const isDenied = micErr.name === "NotAllowedError" || micErr.name === "PermissionDeniedError";
      const errorMsg = isDenied ? msgs.micDenied : msgs.generalError;
      setErrorType("error");
      setErrorMessage(errorMsg);

      if (onErrorRef.current) {
        onErrorRef.current("error", errorMsg, micErr.name);
      }
    }
  }, [cleanupMediaResources, getLocalizedMessages, startAudioLevelTracking, transcribeAudioBlob]);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    activeListeningRef.current = false;
    setIsListening(false);
    setAudioLevel(0);

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }

    // Stop MediaRecorder fallback if active
    if (isFallbackActiveRef.current && mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === "recording") {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.debug("[SpeechRecognition] Error stopping MediaRecorder:", e);
        }
      }
      isFallbackActiveRef.current = false;
      return;
    }

    // Stop Native Speech Recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null; // Prevent loops
        recognitionRef.current.abort();
      } catch (err) {
        console.warn("Error aborting recognition:", err);
      }
      recognitionRef.current = null;
    }

    setInterimTranscript("");
    if (onEndRef.current) {
      onEndRef.current();
    }
  }, []);

  // Handle offline event during active recording
  useEffect(() => {
    const handleOffline = () => {
      if (activeListeningRef.current) {
        const msgs = getLocalizedMessages();
        setErrorType("offline");
        setErrorMessage(msgs.offline);
        stopListening();
        if (onErrorRef.current) {
          onErrorRef.current("offline", msgs.offline, "network-offline");
        }
      }
    };

    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("offline", handleOffline);
    };
  }, [getLocalizedMessages, stopListening]);

  const startListening = useCallback(() => {
    manualStopRef.current = false;
    setErrorType(null);
    setErrorMessage("");
    setInterimTranscript("");

    const msgs = getLocalizedMessages();

    // 1. Check network connection first
    if (!navigator.onLine) {
      setErrorType("offline");
      setErrorMessage(msgs.offline);
      if (onErrorRef.current) {
        onErrorRef.current("offline", msgs.offline, "start-offline");
      }
      return;
    }

    // 2. If WebSpeech has already failed network check previously on this browser, jump straight to AI Audio Recorder
    if (hasWebSpeechNetworkFailed) {
      console.log("[SpeechRecognition] Using AI Audio Recorder (WebSpeech network failed on previous attempt)");
      startMediaRecorderFallback();
      return;
    }

    // 3. Instantiate normalized wrapper
    const recognition = new NormalizedSpeechRecognitionWrapper(speechRecognitionFactory);
    if (!recognition.isSupported) {
      console.log("[SpeechRecognition] Native WebSpeech not found on this browser. Falling back to AI Audio Recorder.");
      startMediaRecorderFallback();
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }

      recognition.lang = normalizeSpeechLanguage(lang || (uiLanguage === "vi" ? "vi-VN" : "en-US"));
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      setActiveEngine("webspeech");
      isFallbackActiveRef.current = false;

      recognition.onstart = () => {
        if (lastEndTimeRef.current > 0) {
          const gap = performance.now() - lastEndTimeRef.current;
          console.debug(`[SpeechRecognition] Gap between sessions: ${gap.toFixed(2)}ms`);
        }
        setIsListening(true);
        activeListeningRef.current = true;
        setAudioLevel(0.4); // Visual pulse
        if (onStartRef.current) {
          onStartRef.current();
        }
      };

      recognition.onerror = (event: { error: string; message?: string }) => {
        const errType = event.error;

        // Suppress console.error for benign/expected events
        if (errType === "aborted" || errType === "no-speech") {
          console.debug(`[SpeechRecognition] Benign event: ${errType}`);
          setIsListening(false);
          activeListeningRef.current = false;
          // Auto restart if continuous hands-free driving mode
          if (autoRestart && !manualStopRef.current) {
            restartTimerRef.current = setTimeout(() => {
              if (!manualStopRef.current) startListening();
            }, 300);
          }
          return;
        }

        console.warn("[SpeechRecognition] WebSpeech API error encountered:", errType);

        // In Google Chrome, "network" or "service-not-allowed" means Chrome cannot reach Google Speech servers.
        // Fall back seamlessly to AI Audio Recording!
        if (errType === "network" || errType === "service-not-allowed" || errType === "audio-capture") {
          hasWebSpeechNetworkFailed = true;
          console.log("[SpeechRecognition] Switching automatically to AI Audio Recorder Fallback...");
          try {
            recognition.onend = null;
            recognition.abort();
          } catch (e) {}
          recognitionRef.current = null;
          startMediaRecorderFallback();
          return;
        }

        let type: SpeechRecognitionErrorType = "error";
        let msg = msgs.generalError;

        if (errType === "not-allowed") {
          msg = msgs.micDenied;
        } else if (errType === "network") {
          type = "offline";
          msg = msgs.offline;
        }

        setErrorType(type);
        setErrorMessage(msg);
        setIsListening(false);
        activeListeningRef.current = false;

        if (onErrorRef.current) {
          onErrorRef.current(type, msg, errType);
        }
      };

      recognition.onend = () => {
        lastEndTimeRef.current = performance.now();
        setIsListening(false);
        activeListeningRef.current = false;
        setAudioLevel(0);

        if (autoRestart && !manualStopRef.current) {
          restartTimerRef.current = setTimeout(() => {
            if (!manualStopRef.current) startListening();
          }, 300);
        } else if (onEndRef.current) {
          onEndRef.current();
        }
      };

      recognition.onresult = ({ finalTranscript, interimTranscript: interimText }) => {
        if (interimText) {
          // Estimate audio power from transcript length
          const level = Math.min(1.0, 0.2 + interimText.length * 0.05);
          setAudioLevel(level);
          setInterimTranscript(interimText);
          if (onInterimTranscriptRef.current) {
            onInterimTranscriptRef.current(interimText);
          }
        }

        if (finalTranscript) {
          setInterimTranscript("");
          setAudioLevel(0.6);
          if (onTranscriptRef.current) {
            onTranscriptRef.current(finalTranscript);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (err: any) {
      console.warn("[SpeechRecognition] Native start exception, launching AI Audio fallback:", err);
      hasWebSpeechNetworkFailed = true;
      startMediaRecorderFallback();
    }
  }, [uiLanguage, lang, continuous, interimResults, autoRestart, getLocalizedMessages, speechRecognitionFactory, startMediaRecorderFallback]);

  useEffect(() => {
    return () => {
      activeListeningRef.current = false;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }
      cleanupMediaResources();
    };
  }, [cleanupMediaResources]);

  return {
    isListening,
    isAiTranscribing,
    activeEngine,
    interimTranscript,
    audioLevel,
    errorType,
    errorMessage,
    capabilities,
    startListening,
    stopListening,
    clearError: () => {
      setErrorType(null);
      setErrorMessage("");
    }
  };
}

