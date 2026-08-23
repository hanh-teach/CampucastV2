// src/components/SpeechDiagnosticsPanel.tsx
/**
 * SpeechDiagnosticsPanel (BÀN LÀM VIỆC / Workspace Embedded Panel)
 * 
 * Captures and displays granular state transitions of the Web Speech API
 * (init, start, audiostart, speechstart, result, speechend, audioend, end, error)
 * and logs every state change with millisecond-precision timestamps to the browser console.
 * 
 * Helps developers and users determine exactly where initialization divergence between
 * Google Chrome (proprietary WebSocket cloud speech socket) and Microsoft Edge
 * (native Windows OS/Azure cognitive speech engine) occurs during voice search & speech recognition.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Activity, 
  Mic, 
  MicOff,
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Trash2, 
  Copy, 
  Check, 
  Radio, 
  Terminal, 
  Sparkles, 
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock
} from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";
import { colors } from "../foundation/tokens/colors";
import { detectSpeechCapabilities, SpeechFeatureSupport, normalizeSpeechLanguage } from "../utils/speechPolyfill";

export interface SpeechEventLog {
  id: string;
  timestamp: number;
  type: "init" | "start" | "audiostart" | "speechstart" | "result" | "speechend" | "audioend" | "end" | "error" | "ai_fallback" | "info";
  message: string;
  elapsedMs: number;
  data?: any;
}

interface SpeechDiagnosticsPanelProps {
  uiLanguage: "vi" | "en";
  className?: string;
  defaultExpanded?: boolean;
}

export function SpeechDiagnosticsPanel({
  uiLanguage,
  className,
  defaultExpanded = false
}: SpeechDiagnosticsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [capabilities, setCapabilities] = useState<SpeechFeatureSupport>(() => detectSpeechCapabilities());
  const [logs, setLogs] = useState<SpeechEventLog[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testTranscript, setTestTranscript] = useState("");
  const [testInterim, setTestInterim] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedLang, setSelectedLang] = useState<"vi-VN" | "en-US">("vi-VN");
  const [copied, setCopied] = useState(false);
  const [lastStateTransition, setLastStateTransition] = useState<string>("IDLE");

  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // Re-detect on mount
  useEffect(() => {
    setCapabilities(detectSpeechCapabilities());
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Log transition to state + browser console
  const addLog = useCallback((
    type: SpeechEventLog["type"],
    message: string,
    data?: any
  ) => {
    const elapsed = startTimeRef.current ? Math.round(performance.now() - startTimeRef.current) : 0;
    const newEntry: SpeechEventLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      type,
      message,
      elapsedMs: elapsed,
      data
    };

    // Update state badge
    setLastStateTransition(type.toUpperCase());

    // Granular formatted logging to browser console for immediate devtools inspection
    const prefix = `[WebSpeech:${capabilities.browser.toUpperCase()}] +${elapsed}ms [${type.toUpperCase()}]`;
    if (type === "error") {
      console.error(prefix, message, data || "");
    } else if (type === "result") {
      console.log(`%c${prefix} ${message}`, "color: #10b981; font-weight: bold;", data || "");
    } else if (type === "speechstart" || type === "start") {
      console.log(`%c${prefix} ${message}`, "color: #3b82f6; font-weight: bold;", data || "");
    } else {
      console.log(prefix, message, data || "");
    }

    setLogs((prev) => [...prev, newEntry]);
  }, [capabilities.browser]);

  const clearLogs = () => {
    setLogs([]);
    setTestTranscript("");
    setTestInterim("");
    setLastStateTransition("IDLE");
    console.log(`[WebSpeech:${capabilities.browser.toUpperCase()}] Diagnostic logs cleared.`);
  };

  const stopAudioTracking = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const startAudioTracking = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        const dataArr = new Uint8Array(analyser.frequencyBinCount);

        const track = () => {
          analyser.getByteFrequencyData(dataArr);
          let sum = 0;
          for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
          const avg = sum / dataArr.length;
          setAudioLevel(Math.min(1.0, Math.max(0.05, avg / 70)));
          animFrameRef.current = requestAnimationFrame(track);
        };
        track();
      }
    } catch (e: any) {
      addLog("info", `Microphone volume track notice: ${e?.message || e}`);
    }
  };

  const runDiagnosticTest = () => {
    if (isTestRunning) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      setIsTestRunning(false);
      stopAudioTracking();
      addLog("end", "Diagnostic test manually aborted by user.");
      return;
    }

    clearLogs();
    setIsTestRunning(true);
    startTimeRef.current = performance.now();

    const caps = detectSpeechCapabilities();
    setCapabilities(caps);

    addLog("init", `Starting Web Speech API diagnostics for browser: ${caps.browser.toUpperCase()}`, {
      userAgent: navigator.userAgent,
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      hasNativeWebSpeech: caps.hasNativeWebSpeech,
      hasMediaRecorder: caps.hasMediaRecorder,
      hasAudioContext: caps.hasAudioContext
    });

    startAudioTracking();

    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechClass) {
      addLog("error", "Native SpeechRecognition / webkitSpeechRecognition is undefined in this browser environment.", {
        cause: "Browser engine does not expose WebSpeech API interface (e.g. Firefox, non-standard WebView)."
      });
      setIsTestRunning(false);
      stopAudioTracking();
      return;
    }

    try {
      const recognition = new SpeechClass();
      recognitionRef.current = recognition;

      recognition.lang = normalizeSpeechLanguage(selectedLang);
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      addLog("init", `Initialized SpeechRecognition instance with lang='${recognition.lang}', continuous=false, interimResults=true`);

      recognition.onstart = () => {
        addLog("start", "Event: onstart fired — Speech recognition session active.");
      };

      recognition.onaudiostart = () => {
        addLog("audiostart", "Event: onaudiostart fired — User agent began audio stream capture.");
      };

      recognition.onspeechstart = () => {
        addLog("speechstart", "Event: onspeechstart fired — Sound recognized as human speech has started.");
      };

      recognition.onresult = (event: any) => {
        let finalStr = "";
        let interimStr = "";
        const details: any[] = [];

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const text = res[0]?.transcript || "";
          const conf = res[0]?.confidence || 0;
          details.push({ index: i, isFinal: res.isFinal, transcript: text, confidence: conf });

          if (res.isFinal) {
            finalStr += text;
          } else {
            interimStr += text;
          }
        }

        setTestTranscript(finalStr);
        setTestInterim(interimStr);

        addLog("result", `Event: onresult fired — "${finalStr || interimStr}"`, {
          resultIndex: event.resultIndex,
          length: event.results.length,
          isFinal: event.results[event.results.length - 1]?.isFinal,
          details
        });
      };

      recognition.onspeechend = () => {
        addLog("speechend", "Event: onspeechend fired — Speech detection ended.");
      };

      recognition.onaudioend = () => {
        addLog("audioend", "Event: onaudioend fired — User agent audio capture finished.");
      };

      recognition.onerror = (event: any) => {
        const errType = event.error;
        let diagnosis = "";

        if (errType === "network") {
          diagnosis = "CHROME_SOCKET_FAILURE: Google Chrome uses a proprietary Google Cloud Speech socket (speech.googleapis.com) for WebSpeech API. On sandboxed iFrames, restricted network domains, or corporate firewalls, this socket connection fails while Microsoft Edge succeeds because Edge uses local Windows OS speech services or Microsoft cognitive endpoints.";
        } else if (errType === "not-allowed" || errType === "service-not-allowed") {
          diagnosis = "PERMISSION_BLOCKED: Microphone permission was rejected, or the host policy blocked SpeechRecognition service.";
        } else if (errType === "no-speech") {
          diagnosis = "NO_SPEECH_TIMEOUT: No audible speech detected before timeout window.";
        } else if (errType === "audio-capture") {
          diagnosis = "AUDIO_CAPTURE_ERROR: No microphone hardware available or device is exclusively locked by another process.";
        }

        addLog("error", `Event: onerror fired with code='${errType}'`, {
          error: errType,
          message: event.message || "Unknown error",
          rootCauseDiagnosis: diagnosis
        });
      };

      recognition.onend = () => {
        addLog("end", "Event: onend fired — Speech recognition connection closed.");
        setIsTestRunning(false);
        stopAudioTracking();
      };

      recognition.start();

    } catch (err: any) {
      addLog("error", `Exception caught during recognition.start(): ${err?.message || err}`, {
        name: err?.name,
        stack: err?.stack
      });
      setIsTestRunning(false);
      stopAudioTracking();
    }
  };

  const copyDiagnosticReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      capabilities,
      environment: {
        userAgent: navigator.userAgent,
        protocol: window.location.protocol,
        isSecureContext: window.isSecureContext,
        online: navigator.onLine,
        language: navigator.language
      },
      logs
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card 
      className={cn("border bg-surface-subtle overflow-hidden rounded-3xl transition-all", className)}
      style={{ borderColor: colors.border }}
    >
      {/* Header */}
      <div 
        className="px-5 py-4 flex items-center justify-between cursor-pointer select-none bg-surface/50 border-b"
        style={{ borderColor: colors.border }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black tracking-wider uppercase" style={{ color: colors.textPrimary }}>
                {uiLanguage === "vi" ? "Chẩn Đoán Trạng Thái Web Speech API" : "Web Speech API State Diagnostics"}
              </h3>
              <span className={cn(
                "px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-widest",
                capabilities.browser === "edge" ? "bg-emerald-500/20 text-emerald-400" :
                capabilities.browser === "chrome" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
              )}>
                {capabilities.browser.toUpperCase()}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-widest",
                lastStateTransition === "ERROR" ? "bg-red-500/20 text-red-400" :
                lastStateTransition === "RESULT" ? "bg-emerald-500/20 text-emerald-400" :
                lastStateTransition === "SPEECHSTART" || lastStateTransition === "START" ? "bg-blue-500/20 text-blue-400" :
                "bg-surface text-text-muted"
              )}>
                {lastStateTransition}
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              {uiLanguage === "vi" 
                ? "Ghi nhận chu kỳ sự kiện (speechstart, result, end, error) & ghi log trực tiếp vào DevTools Console"
                : "Captures speechstart, result, end, error lifecycle & logs to DevTools Console"
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            className="p-1.5 rounded-lg text-text-muted hover:text-text-main transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Diagnostic Body */}
      {isExpanded && (
        <div className="p-5 space-y-4 animate-fade-in">
          
          {/* Top Capability Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl border bg-surface/40 flex items-center justify-between" style={{ borderColor: colors.border }}>
              <span className="text-[10px] font-bold text-text-muted uppercase">Native Speech</span>
              {capabilities.hasNativeWebSpeech ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-400" />
              )}
            </div>

            <div className="p-2.5 rounded-xl border bg-surface/40 flex items-center justify-between" style={{ borderColor: colors.border }}>
              <span className="text-[10px] font-bold text-text-muted uppercase">AI Fallback</span>
              {capabilities.hasMediaRecorder ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-400" />
              )}
            </div>

            <div className="p-2.5 rounded-xl border bg-surface/40 flex items-center justify-between" style={{ borderColor: colors.border }}>
              <span className="text-[10px] font-bold text-text-muted uppercase">HTTPS Context</span>
              {capabilities.isSecureContext ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>

            <div className="p-2.5 rounded-xl border bg-surface/40 flex items-center justify-between" style={{ borderColor: colors.border }}>
              <span className="text-[10px] font-bold text-text-muted uppercase">AudioContext</span>
              {capabilities.hasAudioContext ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-400" />
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2.5 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-text-muted">
                {uiLanguage === "vi" ? "Ngôn ngữ:" : "Lang:"}
              </span>
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value as any)}
                disabled={isTestRunning}
                className="px-2.5 py-1 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
              >
                <option value="vi-VN">Tiếng Việt (vi-VN)</option>
                <option value="en-US">English (en-US)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={runDiagnosticTest}
                variant={isTestRunning ? "destructive" : "primary"}
                size="sm"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
              >
                <Mic className={cn("w-3.5 h-3.5", isTestRunning && "animate-pulse")} />
                <span>
                  {isTestRunning 
                    ? (uiLanguage === "vi" ? "Dừng Thử Nghiệm" : "Stop Test") 
                    : (uiLanguage === "vi" ? "Chạy Chẩn Đoán" : "Run Diagnostic")
                  }
                </span>
              </Button>

              <Button
                onClick={clearLogs}
                variant="outline"
                size="sm"
                disabled={logs.length === 0 || isTestRunning}
                className="text-xs px-2.5 py-1.5 rounded-xl"
                title="Clear Logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>

              <Button
                onClick={copyDiagnosticReport}
                variant="outline"
                size="sm"
                disabled={logs.length === 0}
                className="text-xs px-2.5 py-1.5 rounded-xl"
                title="Copy JSON Report"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          {/* Live Audio & Transcript Preview */}
          {isTestRunning && (
            <div className="p-3 rounded-xl border bg-black/20 space-y-2 border-border-subtle animate-fade-in">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  {uiLanguage === "vi" ? "Microphone đang thu âm..." : "Capturing microphone..."}
                </span>
                <span className="text-text-muted">
                  Audio Level: {Math.round(audioLevel * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 transition-all duration-75"
                  style={{ width: `${Math.max(5, audioLevel * 100)}%` }}
                />
              </div>
              {(testTranscript || testInterim) && (
                <div className="p-2 rounded-lg bg-surface border text-xs" style={{ borderColor: colors.border }}>
                  <span className="text-text-muted font-bold mr-2">Transcript:</span>
                  <span className="text-text-main font-semibold">{testTranscript} </span>
                  <span className="text-blue-400 italic">{testInterim}</span>
                </div>
              )}
            </div>
          )}

          {/* Console Output Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-text-muted px-1">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <Terminal className="w-3 h-3 text-blue-400" />
                {uiLanguage === "vi" ? "Nhật Ký Chuyển Đổi Trạng Thái (Console Output)" : "State Transition Log (Console Output)"}
              </span>
              <span>{logs.length} events</span>
            </div>

            <div 
              ref={logContainerRef}
              className="w-full h-48 p-3 rounded-xl border bg-neutral-950 font-mono text-[10px] overflow-y-auto space-y-1.5 custom-scrollbar"
              style={{ borderColor: colors.border }}
            >
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500 italic space-y-1">
                  <span>{uiLanguage === "vi" ? "Chưa có sự kiện. Nhấn 'Chạy Chẩn Đoán' để kiểm tra." : "No events. Click 'Run Diagnostic' to test."}</span>
                  <span className="text-[9px] text-neutral-600">Events are also logged directly to browser Developer Tools (F12)</span>
                </div>
              ) : (
                logs.map((log) => {
                  const isError = log.type === "error";
                  const isStart = log.type === "start" || log.type === "speechstart";
                  const isResult = log.type === "result";

                  return (
                    <div 
                      key={log.id} 
                      className={cn(
                        "p-1.5 rounded flex flex-col gap-0.5 leading-relaxed",
                        isError ? "bg-red-500/10 text-red-300 border border-red-500/20" :
                        isResult ? "bg-emerald-500/10 text-emerald-300" :
                        isStart ? "bg-blue-500/10 text-blue-300" : "text-neutral-300"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 font-mono select-none">
                          +{log.elapsedMs.toString().padStart(5, " ")}ms
                        </span>
                        <span className={cn(
                          "px-1 rounded text-[8px] font-black uppercase tracking-wider select-none",
                          log.type === "error" ? "bg-red-500 text-white" :
                          log.type === "result" ? "bg-emerald-500 text-black" :
                          log.type === "start" ? "bg-blue-500 text-white" : "bg-neutral-800 text-neutral-400"
                        )}>
                          {log.type}
                        </span>
                        <span className="font-medium truncate">{log.message}</span>
                      </div>

                      {log.data && (
                        <pre className="text-[9px] text-neutral-400 pl-14 mt-0.5 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Root cause footer callout */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl border bg-blue-500/5 text-[11px] text-text-secondary border-blue-500/20">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <p className="leading-tight">
              {uiLanguage === "vi" 
                ? "Chrome sử dụng kết nối socket đám mây (speech.googleapis.com), trong khi Edge dùng dịch vụ native OS/Azure. Kiểm tra Console (F12) để xem chi tiết socket timeline."
                : "Chrome uses a cloud socket (speech.googleapis.com), while Edge uses native OS/Azure speech. Check DevTools Console (F12) for detailed socket timing."
              }
            </p>
          </div>

        </div>
      )}
    </Card>
  );
}
