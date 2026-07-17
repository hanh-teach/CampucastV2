import { useState, useRef, useEffect, useCallback } from 'react';
import { createVoiceActivityDetector, VoiceActivityDetector } from '../lib/vad';
import { SentenceChunker } from '../utils/sentenceChunker';

export type VoiceState = 
  | 'idle' 
  | 'connecting' 
  | 'listening' 
  | 'speech_detected' 
  | 'streaming' 
  | 'thinking' 
  | 'speaking' 
  | 'interrupted' 
  | 'reconnect' 
  | 'error';

export type VoiceEvent =
  | { type: 'SPEECH_START' }
  | { type: 'SPEECH_STREAMING' }
  | { type: 'SPEECH_END' }
  | { type: 'MicStarted' }
  | { type: 'ServerConnected' }
  | { type: 'SpeechStarted' }
  | { type: 'SpeechEnded' }
  | { type: 'AUDIO_BUFFERED' }
  | { type: 'PLAYBACK_STARTED' }
  | { type: 'PLAYBACK_FINISHED' }
  | { type: 'STT_FINISHED' }
  | { type: 'LLM_PROCESSING_STARTED' }
  | { type: 'Interrupted' }
  | { type: 'Reconnect' }
  | { type: 'ServerError'; error: string }
  | { type: 'Stop' }
  | { type: 'WS_OPEN' }
  | { type: 'WS_CLOSE' }
  | { type: 'WS_ERROR' }
  | { type: 'WS_RECONNECT' };

// Strict State Transition Table for Event-Driven Voice States
const TRANSITION_TABLE: Record<VoiceState, Partial<Record<VoiceEvent['type'], VoiceState>>> = {
  idle: {
    MicStarted: 'connecting',
    Reconnect: 'reconnect',
    WS_RECONNECT: 'reconnect',
    Stop: 'idle',
    WS_CLOSE: 'idle',
  },
  connecting: {
    ServerConnected: 'listening',
    WS_OPEN: 'listening',
    ServerError: 'error',
    WS_ERROR: 'error',
    Stop: 'idle',
    WS_CLOSE: 'idle',
  },
  listening: {
    SpeechStarted: 'speech_detected',
    AUDIO_BUFFERED: 'listening',
    PLAYBACK_STARTED: 'speaking',
    Interrupted: 'interrupted',
    Reconnect: 'reconnect',
    WS_RECONNECT: 'reconnect',
    ServerError: 'error',
    WS_ERROR: 'error',
    Stop: 'idle',
    WS_CLOSE: 'idle',
  },
  speech_detected: {
    SPEECH_STREAMING: 'speech_detected',
    SPEECH_END: 'thinking', // Assuming transition to thinking on speech end per sprint goals (Wait, step 6 says SpeechEnded -> no longer audio -> Thinking). Actually let's just map to current state logic.
    SpeechEnded: 'speech_detected', 
    STT_FINISHED: 'thinking',
    LLM_PROCESSING_STARTED: 'thinking',
    AUDIO_BUFFERED: 'speech_detected',
    PLAYBACK_STARTED: 'speaking',
    Interrupted: 'interrupted',
    Reconnect: 'reconnect',
    WS_RECONNECT: 'reconnect',
    ServerError: 'error',
    WS_ERROR: 'error',
    Stop: 'idle',
    WS_CLOSE: 'idle',
  },
  streaming: {
    SPEECH_START: 'speech_detected',
    SPEECH_STREAMING: 'streaming',
    SPEECH_END: 'thinking',
    SpeechStarted: 'speech_detected',
    SpeechEnded: 'streaming', // Does not transition to thinking
    STT_FINISHED: 'thinking',
    LLM_PROCESSING_STARTED: 'thinking',
    AUDIO_BUFFERED: 'streaming',
    PLAYBACK_STARTED: 'speaking',
    Interrupted: 'interrupted',
    Reconnect: 'reconnect',
    WS_RECONNECT: 'reconnect',
    ServerError: 'error',
    WS_ERROR: 'error',
    Stop: 'idle',
    WS_CLOSE: 'idle',
  },
  thinking: {
    AUDIO_BUFFERED: 'thinking',
    PLAYBACK_STARTED: 'speaking',
    Interrupted: 'interrupted',
    Reconnect: 'reconnect',
    WS_RECONNECT: 'reconnect',
    ServerError: 'error',
    WS_ERROR: 'error',
    Stop: 'idle',
    WS_CLOSE: 'idle',
  },
  speaking: {
    PLAYBACK_FINISHED: 'listening',
    Interrupted: 'interrupted',
    Reconnect: 'reconnect',
    WS_RECONNECT: 'reconnect',
    ServerError: 'error',
    WS_ERROR: 'error',
    Stop: 'idle',
    WS_CLOSE: 'idle',
  },
  interrupted: {
    ServerConnected: 'listening',
    WS_OPEN: 'listening',
    Stop: 'idle',
    WS_CLOSE: 'idle',
    ServerError: 'error',
    WS_ERROR: 'error',
    Reconnect: 'reconnect',
    WS_RECONNECT: 'reconnect',
  },
  reconnect: {
    ServerConnected: 'listening',
    WS_OPEN: 'listening',
    ServerError: 'error',
    WS_ERROR: 'error',
    Stop: 'idle',
    WS_CLOSE: 'idle',
  },
  error: {
    MicStarted: 'connecting',
    Stop: 'idle',
    WS_CLOSE: 'idle',
  }
};

export const voiceStateTransition = (currentState: VoiceState, event: VoiceEvent): VoiceState => {
  const nextState = TRANSITION_TABLE[currentState]?.[event.type];
  return nextState !== undefined ? nextState : currentState;
};

class AudioRingBuffer {
  private buffer: Float32Array[];
  private capacity: number;
  private head: number = 0;
  private tail: number = 0;
  private size: number = 0;

  // Metrics
  public droppedFrames: number = 0;
  public sentFrames: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  public enqueue(frame: Float32Array): void {
    if (this.size === this.capacity) {
      // Drop oldest frame (at head)
      this.head = (this.head + 1) % this.capacity;
      this.size--;
      this.droppedFrames++;
    }
    this.buffer[this.tail] = frame;
    this.tail = (this.tail + 1) % this.capacity;
    this.size++;
  }

  public dequeue(): Float32Array | null {
    if (this.size === 0) {
      return null;
    }
    const frame = this.buffer[this.head];
    this.buffer[this.head] = null as any; // clear reference
    this.head = (this.head + 1) % this.capacity;
    this.size--;
    return frame;
  }

  public getSize(): number {
    return this.size;
  }

  public getCapacity(): number {
    return this.capacity;
  }

  public clear(): void {
    this.buffer.fill(null as any);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }
}

const resampleTo16k = (inputBuffer: Float32Array, inputSampleRate: number): Float32Array => {
  if (inputSampleRate === 16000) {
    return inputBuffer;
  }
  
  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(inputBuffer.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const position = i * ratio;
    const index = Math.floor(position);
    const fraction = position - index;
    
    if (index + 1 < inputBuffer.length) {
      result[i] = inputBuffer[index] * (1 - fraction) + inputBuffer[index + 1] * fraction;
    } else {
      result[i] = inputBuffer[index];
    }
  }
  
  return result;
};

export const useVoiceInteraction = () => {
  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sentenceChunkerRef = useRef<SentenceChunker | null>(null);
  const receivedFirstMessageRef = useRef<boolean>(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextPlaybackTimeRef = useRef<number>(0);
  
  // TODO: Implement Silence Detection / VAD Timer in Phase 5.
  const silenceStartRef = useRef<number | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const ringBufferRef = useRef<AudioRingBuffer | null>(null);
  const senderIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const useBinaryRef = useRef<boolean>(true);
  const vadRef = useRef<VoiceActivityDetector | null>(null);

  // The event-driven State Machine controller
  const sendEvent = useCallback((event: VoiceEvent) => {
    if (event.type === 'ServerError') {
      setError(event.error);
    }
    setState((current) => {
      const nextState = voiceStateTransition(current, event);
      if (nextState !== current) {
        console.log(`[VoiceState] ${current} -> ${nextState} via event ${event.type}`);
      }
      return nextState;
    });
  }, []);

  const cleanup = useCallback(() => {
    nextPlaybackTimeRef.current = 0;
    silenceStartRef.current = null;
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (senderIntervalRef.current) {
      clearInterval(senderIntervalRef.current);
      senderIntervalRef.current = null;
    }
    if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(err => console.error("Error closing AudioContext:", err));
      audioContextRef.current = null;
    }
    if (ringBufferRef.current) {
      console.log(`[AudioRingBuffer Metrics] Size: ${ringBufferRef.current.getSize()}, Max Size: ${ringBufferRef.current.getCapacity()}, Sent: ${ringBufferRef.current.sentFrames}, Dropped: ${ringBufferRef.current.droppedFrames}`);
      ringBufferRef.current.clear();
      ringBufferRef.current = null;
    }
    if (sentenceChunkerRef.current) {
      sentenceChunkerRef.current.reset();
      sentenceChunkerRef.current = null;
    }
    if (vadRef.current) {
      vadRef.current.stop();
      vadRef.current.destroy();
      vadRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const float32ToInt16 = (pcm: Float32Array): Int16Array => {
    const buffer = new Int16Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) {
        buffer[i] = Math.max(-1, Math.min(1, pcm[i])) * 0x7FFF;
    }
    return buffer;
  };

  const pcmToBase64 = (pcm: Float32Array) => {
    const int16 = float32ToInt16(pcm);
    return btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
  }

  const playAudioChunk = async (audioCtx: AudioContext, base64: string) => {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const pcm = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm.length);
      for (let i = 0; i < pcm.length; i++) float32[i] = pcm[i] / 0x7FFF;

      const sampleRate = 24000;
      const buffer = audioCtx.createBuffer(1, float32.length, sampleRate);
      buffer.copyToChannel(float32, 0);

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);

      activeSourcesRef.current.push(source);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
        if (activeSourcesRef.current.length === 0) {
          sendEvent({ type: 'PLAYBACK_FINISHED' });
        }
      };

      const now = audioCtx.currentTime;
      if (nextPlaybackTimeRef.current < now) {
        nextPlaybackTimeRef.current = now;
      }

      sendEvent({ type: 'PLAYBACK_STARTED' });
      source.start(nextPlaybackTimeRef.current);
      nextPlaybackTimeRef.current += buffer.duration;
    } catch (err) {
      console.error("Error in playAudioChunk:", err);
    }
  };

  const startListening = async () => {
    sendEvent({ type: 'MicStarted' });
    setError(null);
    receivedFirstMessageRef.current = false;
    silenceStartRef.current = null;

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }

    // Reset transport preference
    useBinaryRef.current = true;

    // Initialize Ring Buffer with 200 frames capacity
    ringBufferRef.current = new AudioRingBuffer(200);

    // Initialize SentenceChunker for text streaming
    sentenceChunkerRef.current = new SentenceChunker(
      (sentence) => {
        console.log('[SentenceChunker] Emitted sentence:', sentence);
        // Phase 7: Connect to TTSDispatcher pipeline here.
      },
      { timeoutMs: 1500, maxLength: 300 }
    );

    // Initialize VAD Architecture Layer (Step 8)
    vadRef.current = createVoiceActivityDetector((event) => {
      switch (event) {
        case 'SpeechStarted':
          sendEvent({ type: 'SPEECH_START' });
          break;
        case 'SpeechContinuing':
          sendEvent({ type: 'SPEECH_STREAMING' });
          break;
        case 'SpeechEnded':
          sendEvent({ type: 'SPEECH_END' });
          break;
      }
    }, { engine: 'webrtc' });
    vadRef.current.start();

    // Start Sender Loop
    senderIntervalRef.current = setInterval(() => {
      const buffer = ringBufferRef.current;
      const ws = wsRef.current;
      if (!buffer) return;

      if (ws && ws.readyState === WebSocket.OPEN) {
        while (buffer.getSize() > 0) {
          const frame = buffer.dequeue();
          if (frame) {
            if (useBinaryRef.current) {
              try {
                const int16 = float32ToInt16(frame);
                // Send raw binary PCM ArrayBuffer (preferred)
                ws.send(int16.buffer);
                buffer.sentFrames++;
              } catch (binErr) {
                console.warn('[WS-VOICE] Binary transport failed, falling back to Base64 Compatibility:', binErr);
                useBinaryRef.current = false;
                // Immediate fallback for this frame
                const base64 = pcmToBase64(frame);
                ws.send(JSON.stringify({ audio: base64 }));
                buffer.sentFrames++;
              }
            } else {
              // Base64 Compatibility (fallback)
              const base64 = pcmToBase64(frame);
              ws.send(JSON.stringify({ audio: base64 }));
              buffer.sentFrames++;
            }
          }
        }
      }
    }, 10);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập micro.');
      }

      // Build constraints dynamically using browser capability check (Step 3)
      let audioConstraints: MediaTrackConstraints | boolean = true;
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getSupportedConstraints === 'function') {
        const supported = navigator.mediaDevices.getSupportedConstraints();
        const constraints: MediaTrackConstraints = {};
        if (supported.echoCancellation) constraints.echoCancellation = true;
        if (supported.noiseSuppression) constraints.noiseSuppression = true;
        if (supported.autoGainControl) constraints.autoGainControl = true;
        
        if (Object.keys(constraints).length > 0) {
          audioConstraints = constraints;
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      mediaStreamRef.current = stream;

      // Query and log actual constraints, settings, and capabilities (Step 7)
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        console.log('[Microphone Capture Constraints / Settings / Capabilities]');
        if (typeof audioTrack.getSettings === 'function') {
          console.log('- Actual Track Settings:', audioTrack.getSettings());
        }
        if (typeof audioTrack.getConstraints === 'function') {
          console.log('- Requested/Actual Constraints:', audioTrack.getConstraints());
        }
        if (typeof audioTrack.getCapabilities === 'function') {
          console.log('- Hardware Capabilities:', audioTrack.getCapabilities());
        }
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      nextPlaybackTimeRef.current = audioCtx.currentTime;

      try {
        await audioCtx.audioWorklet.addModule('/audio-processor-worklet.js');
      } catch (workletErr) {
        console.error('Failed to register AudioWorklet module:', workletErr);
        throw new Error('Không thể tải bộ xử lý âm thanh AudioWorklet.');
      }

      let token = "";
      try {
        const tokenRes = await fetch("/api/voice-token", { method: "POST" });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          token = tokenData.token || "";
        }
      } catch (err) {
        console.error("Failed to generate voice interaction session token:", err);
      }

      const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = token 
        ? `${wsProtocol}//${location.host}/ws/voice?token=${encodeURIComponent(token)}`
        : `${wsProtocol}//${location.host}/ws/voice`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        sendEvent({ type: 'WS_OPEN' });
        sendEvent({ type: 'ServerConnected' });
      };

      const source = audioCtx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioCtx, 'audio-processor');
      
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      
      source.connect(workletNode);
      workletNode.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      workletNode.port.onmessage = (e) => {
        const float32 = e.data; // Float32Array from worklet (4096 samples)
        const resampled = resampleTo16k(float32, audioCtx.sampleRate);

        // Process VAD Architecture Layer injection point (Step 8)
        if (vadRef.current) {
          vadRef.current.process(resampled);
        }

        if (ringBufferRef.current) {
          ringBufferRef.current.enqueue(resampled);
        }
      };

      connectionTimeoutRef.current = setTimeout(() => {
        if (!receivedFirstMessageRef.current) {
          console.warn('[WS-VOICE] Timeout waiting for first server message');
          sendEvent({ type: 'WS_ERROR' });
          sendEvent({ type: 'ServerError', error: 'Không kết nối được máy chủ giọng nói, vui lòng thử lại.' });
          cleanup();
        }
      }, 8000);

      ws.onmessage = (event) => {
        receivedFirstMessageRef.current = true;
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        try {
          const msg = JSON.parse(event.data);
          if (msg.error === 'voice_realtime_not_available') {
            sendEvent({ type: 'ServerError', error: 'Tính năng đàm thoại giọng nói thời gian thực hiện đang bảo trì, vui lòng thử lại sau.' });
            cleanup();
            return;
          }
          if (msg.error) {
            sendEvent({ type: 'ServerError', error: msg.message || msg.error });
            cleanup();
            return;
          }
          if (msg.interrupted) {
            activeSourcesRef.current.forEach(src => {
              try { src.stop(); } catch (e) {}
            });
            activeSourcesRef.current = [];
            sendEvent({ type: 'Interrupted' });
            // TODO: Implement automatic or event-based exit from interrupted state without setTimeout in Phase 9.
            sentenceChunkerRef.current?.reset();
            return;
          }
          if (msg.type === 'gemini_chunk') {
            if (msg.text) {
              sentenceChunkerRef.current?.append(msg.text);
            }
            if (msg.audio) {
              sendEvent({ type: 'AUDIO_BUFFERED' });
              playAudioChunk(audioCtx, msg.audio);
            }
          } else if (msg.type === 'gemini_done') {
            sentenceChunkerRef.current?.forceFlush();
          } else if (msg.audio) {
            sendEvent({ type: 'AUDIO_BUFFERED' });
            playAudioChunk(audioCtx, msg.audio);
          }
        } catch (e) {
          console.error("Error parsing voice WebSocket message:", e);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket Voice Error:', e);
        sendEvent({ type: 'WS_ERROR' });
        if (!receivedFirstMessageRef.current) {
          sendEvent({ type: 'ServerError', error: 'Không kết nối được máy chủ giọng nói, vui lòng thử lại.' });
          cleanup();
        }
      };

      ws.onclose = () => {
        console.log('Voice WebSocket connection closed.');
        sendEvent({ type: 'WS_CLOSE' });
        sendEvent({ type: 'Stop' });
      };

    } catch (err: any) {
      console.error('Voice Interaction Error:', err);
      let errorMsg = 'Lỗi không xác định.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('Permission denied')) {
        errorMsg = 'Quyền truy cập micro bị từ chối. Vui lòng cấp quyền truy cập micro trong Cài đặt (Settings) của trình duyệt hoặc hệ điều hành để sử dụng tính năng này.';
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      sendEvent({ type: 'ServerError', error: errorMsg });
      cleanup();
    }
  };

  const stopListening = useCallback(() => {
    cleanup();
    sendEvent({ type: 'Stop' });
  }, [cleanup, sendEvent]);

  return { state, error, startListening, stopListening };
};
