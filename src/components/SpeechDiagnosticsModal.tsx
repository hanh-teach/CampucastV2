// src/components/SpeechDiagnosticsModal.tsx
import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  Mic, 
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
  X
} from "lucide-react";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";
import { colors } from "../foundation/tokens/colors";
import { detectSpeechCapabilities, SpeechFeatureSupport } from "../utils/speechPolyfill";

export interface DiagnosticLogEntry {
  id: string;
  timestamp: number;
  type: "init" | "start" | "audiostart" | "speechstart" | "result" | "speechend" | "audioend" | "end" | "error" | "ai_fallback" | "info";
  message: string;
  elapsedMs: number;
  data?: any;
}

interface SpeechDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLanguage: "vi" | "en";
}

export function SpeechDiagnosticsModal({
  isOpen,
  onClose,
  uiLanguage
}: SpeechDiagnosticsModalProps) {
  const [capabilities, setCapabilities] = useState<SpeechFeatureSupport>(() => detectSpeechCapabilities());
  const [logs, setLogs] = useState<DiagnosticLogEntry[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testTranscript, setTestTranscript] = useState("");
  const [testInterim, setTestInterim] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedLang, setSelectedLang] = useState<"vi-VN" | "en-US">("vi-VN");
  const [copied, setCopied] = useState(false);

  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCapabilities(detectSpeechCapabilities());
  }, [isOpen]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (
    type: DiagnosticLogEntry["type"],
    message: string,
    data?: any
  ) => {
    const elapsed = startTimeRef.current ? Math.round(performance.now() - startTimeRef.current) : 0;
    const newEntry: DiagnosticLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      type,
      message,
      elapsedMs: elapsed,
      data
    };
    setLogs((prev) => [...prev, newEntry]);
  };

  const clearLogs = () => {
    setLogs([]);
    setTestTranscript("");
    setTestInterim("");
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

      recognition.lang = selectedLang;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      addLog("init", `Initialized SpeechRecognition instance with lang='${selectedLang}', continuous=false, interimResults=true`);

      recognition.onstart = () => {
        addLog("start", "Event: onstart fired — Speech recognition service session established.");
      };

      recognition.onaudiostart = () => {
        addLog("audiostart", "Event: onaudiostart fired — User agent began capturing audio.");
      };

      recognition.onspeechstart = () => {
        addLog("speechstart", "Event: onspeechstart fired — Sound recognized as human speech has begun.");
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
          details
        });
      };

      recognition.onspeechend = () => {
        addLog("speechend", "Event: onspeechend fired — Speech has stopped being detected.");
      };

      recognition.onaudioend = () => {
        addLog("audioend", "Event: onaudioend fired — User agent audio capture ended.");
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight" style={{ color: colors.textPrimary }}>
                {uiLanguage === "vi" ? "Chẩn Đoán Web Speech API & Độ Trễ Sự Kiện" : "Web Speech API Event Diagnostics & Chrome Analyzer"}
              </h2>
              <p className="text-[11px] font-medium" style={{ color: colors.textMuted }}>
                {uiLanguage === "vi" ? "Phân tích nguyên nhân lỗi trên Chrome vs Edge và kiểm tra thời gian thực" : "Isolate Chrome network socket errors vs Edge native engine with live event timeline"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-surface-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Section 1: Capabilities Diagnostic Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl border bg-surface-subtle flex flex-col justify-between" style={{ borderColor: colors.border }}>
              <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                {uiLanguage === "vi" ? "Trình Duyệt Đang Chạy" : "Active Browser"}
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono tracking-widest",
                  capabilities.browser === "edge" ? "bg-emerald-500/20 text-emerald-400" :
                  capabilities.browser === "chrome" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
                )}>
                  {capabilities.browser.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border bg-surface-subtle flex flex-col justify-between" style={{ borderColor: colors.border }}>
              <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                Native WebSpeech
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                {capabilities.hasNativeWebSpeech ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">Available</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-red-400">Missing</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border bg-surface-subtle flex flex-col justify-between" style={{ borderColor: colors.border }}>
              <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                AI MediaRecorder Fallback
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                {capabilities.hasMediaRecorder ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">Ready</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-bold text-red-400">Missing</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl border bg-surface-subtle flex flex-col justify-between" style={{ borderColor: colors.border }}>
              <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                Secure Context (HTTPS)
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                {capabilities.isSecureContext ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">HTTPS Valid</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">Non-Secure</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Chrome vs Edge Analysis Insight */}
          <div className="p-4 rounded-2xl border bg-blue-500/5 space-y-2 border-blue-500/20">
            <div className="flex items-center gap-2 text-blue-400">
              <Info className="w-4 h-4" />
              <h4 className="text-xs font-black uppercase tracking-wider">
                {uiLanguage === "vi" ? "Kiến Thức Cốt Lõi: Tại Sao Chrome Gặp Lỗi Còn Edge Thành Công?" : "Technical Root Cause: Why Chrome Fails while Edge Succeeds"}
              </h4>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              {uiLanguage === "vi" ? (
                <>
                  <strong>Google Chrome:</strong> Sử dụng dịch vụ nhận diện giọng nói đám mây của Google qua WebSocket kết nối đến <code className="text-blue-400 font-mono text-[11px]">speech.googleapis.com</code>. Khi chạy trên môi trường iFrame sandbox, mạng doanh nghiệp chặn socket hoặc Chrome bị hạn chế tài khoản Google, WebSpeech API lập tức ném lỗi <code className="text-red-400 font-mono text-[11px]">network</code> hoặc <code className="text-red-400 font-mono text-[11px]">service-not-allowed</code>.<br/>
                  <strong>Microsoft Edge:</strong> Tích hợp trực tiếp với Microsoft Speech Platform trên Windows OS hoặc Azure Cognitive Services với cơ chế socket riêng biệt không bị phụ thuộc vào Google Cloud, do đó hoạt động ổn định hơn trên môi trường web.
                </>
              ) : (
                <>
                  <strong>Google Chrome:</strong> Relies on Google Cloud Speech services through a proprietary socket connection to <code className="text-blue-400 font-mono text-[11px]">speech.googleapis.com</code>. Inside sandboxed iFrames or restricted networks, this socket fails immediately with <code className="text-red-400 font-mono text-[11px]">network</code> or <code className="text-red-400 font-mono text-[11px]">service-not-allowed</code>.<br/>
                  <strong>Microsoft Edge:</strong> Directly hooks into Windows OS native Speech Platform or Azure cognitive endpoints with a resilient socket architecture that does not depend on Google's cloud server.
                </>
              )}
            </p>
          </div>

          {/* Section 3: Interactive Live Diagnostic Test Suite */}
          <div className="p-5 rounded-2xl border space-y-4" style={{ borderColor: colors.border, backgroundColor: colors.surfaceRaised }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-text-muted">
                  {uiLanguage === "vi" ? "Ngôn ngữ thử nghiệm:" : "Test Language:"}
                </span>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value as any)}
                  disabled={isTestRunning}
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="flex items-center gap-2"
                >
                  <Mic className={cn("w-4 h-4", isTestRunning && "animate-pulse")} />
                  <span>
                    {isTestRunning 
                      ? (uiLanguage === "vi" ? "Dừng & Hủy Thử Nghiệm" : "Stop Diagnostic")
                      : (uiLanguage === "vi" ? "Chạy Kiểm Tra Web Speech" : "Run Web Speech Diagnostic")
                    }
                  </span>
                </Button>
                
                <Button
                  onClick={clearLogs}
                  variant="outline"
                  size="sm"
                  disabled={logs.length === 0 || isTestRunning}
                  title="Clear Log History"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={copyDiagnosticReport}
                  variant="outline"
                  size="sm"
                  disabled={logs.length === 0}
                  title="Copy Diagnostic JSON Report"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-text-muted" />}
                </Button>
              </div>
            </div>

            {/* Live Audio Visualizer Bar */}
            {isTestRunning && (
              <div className="p-3 rounded-xl border bg-black/20 space-y-2" style={{ borderColor: colors.border }}>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    {uiLanguage === "vi" ? "Microphone đang thu âm..." : "Capturing microphone..."}
                  </span>
                  <span className="text-text-muted">
                    Audio Level: {Math.round(audioLevel * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
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

            {/* Event Timeline Console */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-text-muted px-1">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5" />
                  {uiLanguage === "vi" ? "Nhật Ký Sự Kiện Thời Gian Thực (ms)" : "Real-Time Event Stream (ms)"}
                </span>
                <span>{logs.length} events logged</span>
              </div>

              <div 
                ref={logContainerRef}
                className="w-full h-64 p-3 rounded-xl border bg-neutral-950 font-mono text-[11px] overflow-y-auto space-y-1.5 custom-scrollbar"
                style={{ borderColor: colors.border }}
              >
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-neutral-500 italic">
                    {uiLanguage === "vi" 
                      ? "Nhấn 'Chạy Kiểm Tra Web Speech' để bắt đầu ghi nhận chu kỳ sự kiện (onstart, onresult, onerror)..." 
                      : "Click 'Run Web Speech Diagnostic' to start logging event lifecycle transitions..."
                    }
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
                            "px-1 rounded text-[9px] font-black uppercase tracking-wider select-none",
                            log.type === "error" ? "bg-red-500 text-white" :
                            log.type === "result" ? "bg-emerald-500 text-black" :
                            log.type === "start" ? "bg-blue-500 text-white" : "bg-neutral-800 text-neutral-400"
                          )}>
                            {log.type}
                          </span>
                          <span className="font-medium">{log.message}</span>
                        </div>

                        {log.data && (
                          <pre className="text-[10px] text-neutral-400 pl-16 mt-0.5 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between shrink-0" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
          <div className="flex items-center gap-2 text-[11px] text-text-muted">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>CommuteCast Dual-Engine Fallback Active</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            {uiLanguage === "vi" ? "Đóng Cửa Sổ" : "Close"}
          </Button>
        </div>

      </div>
    </div>
  );
}
