export interface VoiceActivityDetector {
  start(): void;
  stop(): void;
  reset(): void;
  process(frame: Float32Array): void;
  destroy(): void;
}

export type SpeechEvent =
  | 'SpeechStarted'
  | 'SpeechEnded'
  | 'SpeechContinuing'
  | 'VoiceEnergyUpdated';

export type SpeechEventHandler = (event: SpeechEvent, payload?: any) => void;

export class DummyVadAdapter implements VoiceActivityDetector {
  private handler?: SpeechEventHandler;

  constructor(onEvent?: SpeechEventHandler) {
    this.handler = onEvent;
  }

  start(): void {
    console.log('[DummyVadAdapter] VAD started.');
  }

  stop(): void {
    console.log('[DummyVadAdapter] VAD stopped.');
  }

  reset(): void {
    console.log('[DummyVadAdapter] VAD reset.');
  }

  process(frame: Float32Array): void {
    // Dummy implementation: non-operational placeholder (Step 6)
    // TODO: Implement actual voice activity detection algorithm here in future sprints if needed.
  }

  destroy(): void {
    console.log('[DummyVadAdapter] VAD destroyed.');
    this.handler = undefined;
  }
}

// Optional dynamic import for 'webrtc-vad-wasm' to support future module installation without breaking current compilation
// @ts-ignore
const moduleName = ['webrtc', 'vad', 'wasm'].join('-');
const loadVadPromise = import(/* @vite-ignore */ moduleName)
  .then((m) => {
    return m.default || m;
  })
  .catch(() => {
    return null;
  });

export class WebRtcVadAdapter implements VoiceActivityDetector {
  private handler?: SpeechEventHandler;
  private vadEngine: any = null;
  private isSpeechActive = false;
  private int16Buffer: Int16Array | null = null;
  private isRunning = false;
  private sampleRate = 16000;
  private speechCounter = 0;
  private silenceCounter = 0;

  // WebRTC VAD parameters
  private readonly mode = 3; // Mode 3 is the most aggressive noise filtering level

  constructor(onEvent?: SpeechEventHandler) {
    this.handler = onEvent;
    
    // Resolve dynamic WASM loader promise
    loadVadPromise.then((VadClass) => {
      if (VadClass) {
        try {
          this.vadEngine = new VadClass(this.sampleRate, this.mode);
          console.log('[WebRtcVadAdapter] WebRTC VAD WASM initialized successfully.');
        } catch (e) {
          console.error('[WebRtcVadAdapter] Failed to instantiate WebRTC VAD WASM:', e);
        }
      } else {
        console.log('[WebRtcVadAdapter] webrtc-vad-wasm library not loaded. Running in emulation/fallback mode.');
      }
    });
  }

  start(): void {
    this.isRunning = true;
    this.isSpeechActive = false;
    this.speechCounter = 0;
    this.silenceCounter = 0;
    console.log('[WebRtcVadAdapter] VAD started.');
  }

  stop(): void {
    this.isRunning = false;
    console.log('[WebRtcVadAdapter] VAD stopped.');
  }

  reset(): void {
    this.isSpeechActive = false;
    this.speechCounter = 0;
    this.silenceCounter = 0;
    console.log('[WebRtcVadAdapter] VAD reset.');
  }

  process(frame: Float32Array): void {
    if (!this.isRunning) return;

    // Convert Float32Array to Int16Array for WebRTC VAD
    // Optimization (Step 7): Reuse pre-allocated buffer to eliminate garbage collection churn.
    if (!this.int16Buffer || this.int16Buffer.length !== frame.length) {
      this.int16Buffer = new Int16Array(frame.length);
    }

    for (let i = 0; i < frame.length; i++) {
      const s = Math.max(-1, Math.min(1, frame[i]));
      this.int16Buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    let isSpeechFrame = false;

    if (this.vadEngine) {
      try {
        // WebRTC VAD expects specific frame sizes (10ms, 20ms, or 30ms).
        // At 16000 Hz: 160, 320, or 480 samples.
        // If our resampled frame size matches, process directly. Otherwise, process in chunks of 320.
        const frameSize = 320; // 20ms frame size at 16000 Hz
        if (this.int16Buffer.length === frameSize) {
          const result = this.vadEngine.process(this.int16Buffer);
          isSpeechFrame = result === 1;
        } else {
          // Process in consecutive 320-sample chunks
          let speechChunks = 0;
          let totalChunks = 0;
          for (let offset = 0; offset + frameSize <= this.int16Buffer.length; offset += frameSize) {
            const subArray = this.int16Buffer.subarray(offset, offset + frameSize);
            const result = this.vadEngine.process(subArray);
            if (result === 1) {
              speechChunks++;
            }
            totalChunks++;
          }
          isSpeechFrame = totalChunks > 0 && (speechChunks / totalChunks) > 0.4;
        }
      } catch (err) {
        isSpeechFrame = false;
      }
    } else {
      // Fallback/emulation mode when library is not active.
      isSpeechFrame = false;
    }

    // Event notification (Step 5)
    if (this.vadEngine) {
      if (isSpeechFrame) {
        this.speechCounter++;
        this.silenceCounter = 0;

        if (this.speechCounter >= 2) { // Debounce speech start (2 consecutive active frames)
          if (!this.isSpeechActive) {
            this.isSpeechActive = true;
            if (this.handler) this.handler('SpeechStarted');
          } else {
            if (this.handler) this.handler('SpeechContinuing');
          }
        }
      } else {
        this.silenceCounter++;
        this.speechCounter = 0;

        if (this.silenceCounter >= 10) { // Debounce speech end (10 consecutive quiet frames)
          if (this.isSpeechActive) {
            this.isSpeechActive = false;
            if (this.handler) this.handler('SpeechEnded');
          }
        }
      }
    }
  }

  destroy(): void {
    console.log('[WebRtcVadAdapter] VAD destroyed.');
    this.handler = undefined;
    this.vadEngine = null;
    this.int16Buffer = null;
  }
}

export class SileroVadAdapter implements VoiceActivityDetector {
  private handler?: SpeechEventHandler;
  constructor(onEvent?: SpeechEventHandler) { this.handler = onEvent; }
  start(): void {}
  stop(): void {}
  reset(): void {}
  process(frame: Float32Array): void {}
  destroy(): void { this.handler = undefined; }
}

export class ServerVadAdapter implements VoiceActivityDetector {
  private handler?: SpeechEventHandler;
  constructor(onEvent?: SpeechEventHandler) { this.handler = onEvent; }
  start(): void {}
  stop(): void {}
  reset(): void {}
  process(frame: Float32Array): void {}
  destroy(): void { this.handler = undefined; }
}

export class GeminiVadAdapter implements VoiceActivityDetector {
  private handler?: SpeechEventHandler;
  constructor(onEvent?: SpeechEventHandler) { this.handler = onEvent; }
  start(): void {}
  stop(): void {}
  reset(): void {}
  process(frame: Float32Array): void {}
  destroy(): void { this.handler = undefined; }
}

export interface CreateVadOptions {
  engine?: 'dummy' | 'webrtc' | 'silero' | 'server' | 'gemini';
}

export const createVoiceActivityDetector = (
  onEvent?: SpeechEventHandler,
  options?: CreateVadOptions
): VoiceActivityDetector => {
  const engine = options?.engine || 'dummy';
  switch (engine) {
    case 'webrtc':
      return new WebRtcVadAdapter(onEvent);
    case 'silero':
      return new SileroVadAdapter(onEvent);
    case 'server':
      return new ServerVadAdapter(onEvent);
    case 'gemini':
      return new GeminiVadAdapter(onEvent);
    case 'dummy':
    default:
      return new DummyVadAdapter(onEvent);
  }
};
