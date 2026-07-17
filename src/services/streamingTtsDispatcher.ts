import { AudioChunk } from './broadcastSpeechEngine';

/**
 * StreamingTTSService Interface
 * Defines the contract for incremental TTS synthesis.
 */
export interface StreamingTTSService {
  synthesizeStream(
    text: string,
    voice: string,
    rate: number,
    pitch: number,
    signal?: AbortSignal
  ): AsyncIterable<Uint8Array>;
}

/**
 * StreamingTTSDispatcher Options
 * Callbacks for incremental audio delivery.
 */
export interface StreamingTTSDispatcherOptions {
  onChunk: (chunk: Uint8Array) => void;
  onDone: () => void;
  onError: (error: any) => void;
}

/**
 * StreamingTTSDispatcher
 * Orchestrates multiple streaming TTS services and handles abort logic.
 */
export class StreamingTTSDispatcher {
  private activeAbortController: AbortController | null = null;

  constructor(private services: Map<string, StreamingTTSService>) {}

  /**
   * Dispatches a text string to a streaming TTS service.
   * Consumes the AsyncIterable and forwards chunks via callbacks.
   */
  async dispatch(
    text: string,
    config: { voice: string; rate: number; pitch: number },
    options: StreamingTTSDispatcherOptions,
    externalSignal?: AbortSignal
  ): Promise<void> {
    // Abort any ongoing dispatch
    this.abort();

    this.activeAbortController = new AbortController();
    const signal = this.activeAbortController.signal;

    // Link external signal if provided
    const onExternalAbort = () => this.abort();
    if (externalSignal) {
      externalSignal.addEventListener('abort', onExternalAbort);
    }

    try {
      // Find suitable service (defaulting to first available for now)
      const service = Array.from(this.services.values())[0];
      if (!service) {
        throw new Error('[StreamingTTSDispatcher] No streaming services registered');
      }

      console.log(`[StreamingTTSDispatcher] Starting stream for: "${text.substring(0, 30)}..."`);

      const stream = service.synthesizeStream(
        text,
        config.voice,
        config.rate,
        config.pitch,
        signal
      );

      for await (const chunk of stream) {
        if (signal.aborted) {
          console.log('[StreamingTTSDispatcher] Stream aborted during iteration');
          break;
        }
        options.onChunk(chunk);
      }

      if (!signal.aborted) {
        console.log('[StreamingTTSDispatcher] Stream completed successfully');
        options.onDone();
      }
    } catch (error) {
      if (!signal.aborted) {
        console.error('[StreamingTTSDispatcher] Stream error:', error);
        options.onError(error);
      }
    } finally {
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
      if (this.activeAbortController?.signal === signal) {
        this.activeAbortController = null;
      }
    }
  }

  /**
   * Aborts the current streaming operation.
   */
  abort(): void {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
  }
}

/**
 * DummyStreamingTTSService
 * Mock implementation for Sprint 7G verification.
 */
export class DummyStreamingTTSService implements StreamingTTSService {
  async *synthesizeStream(
    text: string,
    voice: string,
    rate: number,
    pitch: number,
    signal?: AbortSignal
  ): AsyncIterable<Uint8Array> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const chunkSize = 32;

    for (let i = 0; i < data.length; i += chunkSize) {
      if (signal?.aborted) return;
      
      yield data.slice(i, i + chunkSize);
      
      // Simulate network latency (50ms per chunk)
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

/**
 * Factory function to create a StreamingTTSDispatcher.
 */
export function createStreamingTTSDispatcher(services: Map<string, StreamingTTSService>) {
  return new StreamingTTSDispatcher(services);
}
