import { 
  base64ToArrayBuffer, 
  encodeWavHeader, 
  stripWavHeaderInBrowser, 
  pcmToFloat32, 
  float32ToInt16Pcm, 
  applyHannMicroFade, 
  isMp3ArrayBuffer 
} from "../utils";

export interface AudioNormalizationOptions {
  /** Target RMS level in linear amplitude (default: 0.12, approx -18.4 dBFS) */
  targetRms?: number;
  /** Maximum allowed peak amplitude after soft-limiting (default: 0.95, approx -0.45 dBFS) */
  peakCeiling?: number;
  /** Minimum gate threshold for active speech RMS calculation (default: 0.008, approx -42 dBFS) */
  gateThreshold?: number;
  /** Maximum linear gain boost factor (default: 3.5, approx +10.8 dB) */
  maxGainBoost?: number;
  /** Minimum linear gain factor / max attenuation (default: 0.25, approx -12 dB) */
  minGain?: number;
  /** Duration in seconds of clean silence between segments (default: 0.35s) */
  interSegmentSilenceSec?: number;
  /** Target unified sample rate for exported audio (default: 24000Hz) */
  targetSampleRate?: number;
  /** Whether to apply zero-crossing tail alignment on each segment (default: true) */
  alignZeroCrossing?: boolean;
}

export interface AudioLoudnessMetrics {
  /** Gated active speech RMS level in linear amplitude */
  gatedRms: number;
  /** Peak linear amplitude [-1.0, 1.0] */
  peak: number;
  /** DC Offset (bias mean value) */
  dcOffset: number;
  /** True if peak exceeds 0.999 */
  isClipping: boolean;
  /** Calculated gain scalar to reach target RMS */
  suggestedGain: number;
}

/**
 * Remove DC Offset (bias) by subtracting the arithmetic mean of all samples.
 */
export function removeDcOffset(samples: Float32Array): void {
  const len = samples.length;
  if (len === 0) return;
  let sum = 0;
  for (let i = 0; i < len; i++) {
    sum += samples[i];
  }
  const mean = sum / len;
  if (Math.abs(mean) > 1e-6) {
    for (let i = 0; i < len; i++) {
      samples[i] -= mean;
    }
  }
}

/**
 * Calculate active gated RMS energy of audio samples, ignoring sub-threshold pauses/silence.
 */
export function calculateGatedRms(samples: Float32Array, gateThreshold: number = 0.008): number {
  const len = samples.length;
  if (len === 0) return 0;

  let sumSquares = 0;
  let activeCount = 0;

  for (let i = 0; i < len; i++) {
    const val = samples[i];
    if (Math.abs(val) >= gateThreshold) {
      sumSquares += val * val;
      activeCount++;
    }
  }

  // If mostly silence, fall back to global RMS
  if (activeCount < Math.min(100, Math.floor(len * 0.05))) {
    let globalSum = 0;
    for (let i = 0; i < len; i++) {
      globalSum += samples[i] * samples[i];
    }
    return Math.sqrt(globalSum / Math.max(1, len));
  }

  return Math.sqrt(sumSquares / activeCount);
}

/**
 * Scans audio samples (Float32Array or AudioBuffer) to extract detailed loudness and peak metrics.
 */
export function scanAudioLoudness(
  input: Float32Array | AudioBuffer,
  options?: AudioNormalizationOptions
): AudioLoudnessMetrics {
  const targetRms = options?.targetRms ?? 0.12;
  const gateThreshold = options?.gateThreshold ?? 0.008;

  let samples: Float32Array;
  if (typeof (input as AudioBuffer).getChannelData === 'function') {
    const buf = input as AudioBuffer;
    samples = buf.getChannelData(0);
  } else {
    samples = input as Float32Array;
  }

  if (!samples || samples.length === 0) {
    return { gatedRms: 0, peak: 0, dcOffset: 0, isClipping: false, suggestedGain: 1.0 };
  }

  let sum = 0;
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    sum += s;
    const abs = Math.abs(s);
    if (abs > peak) peak = abs;
  }
  const dcOffset = sum / samples.length;
  const gatedRms = calculateGatedRms(samples, gateThreshold);
  const suggestedGain = gatedRms > 1e-4 ? targetRms / gatedRms : 1.0;

  return {
    gatedRms,
    peak,
    dcOffset,
    isClipping: peak >= 0.999,
    suggestedGain: Math.max(options?.minGain ?? 0.25, Math.min(options?.maxGainBoost ?? 3.5, suggestedGain))
  };
}

/**
 * Applies a smooth soft-knee tanh limiter to ensure peak amplitudes do not exceed the ceiling.
 */
export function applySoftLimiter(samples: Float32Array, ceiling: number = 0.95, kneeThreshold: number = 0.82): void {
  const len = samples.length;
  for (let i = 0; i < len; i++) {
    const val = samples[i];
    const absVal = Math.abs(val);
    if (absVal > kneeThreshold) {
      const sign = val < 0 ? -1 : 1;
      const over = absVal - kneeThreshold;
      const range = 1.0 - kneeThreshold;
      // Soft saturation curve via hyperbolic tangent
      const compressed = kneeThreshold + (ceiling - kneeThreshold) * Math.tanh(over / range);
      samples[i] = sign * Math.min(ceiling, compressed);
    }
  }
}

/**
 * Find the nearest natural zero-crossing near the end of an audio segment to avoid DC step clicks.
 */
export function findZeroCrossingNearEnd(samples: Float32Array, searchWindowSamples: number = 360): number {
  const len = samples.length;
  if (len < searchWindowSamples + 2) return len;

  let bestIdx = len;
  let minAbs = Infinity;
  const startSearch = len - searchWindowSamples;

  for (let i = startSearch; i < len - 1; i++) {
    if ((samples[i] <= 0 && samples[i + 1] >= 0) || (samples[i] >= 0 && samples[i + 1] <= 0)) {
      return i;
    }
    const absVal = Math.abs(samples[i]);
    if (absVal < minAbs) {
      minAbs = absVal;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Scans and levels the RMS amplitude of a single audio segment (Float32Array or AudioBuffer),
 * removing DC bias, equalizing loudness, and applying soft-knee peak limiting.
 */
export function normalizeAudioBuffer<T extends Float32Array | AudioBuffer>(
  input: T,
  options?: AudioNormalizationOptions
): T {
  const opts: Required<AudioNormalizationOptions> = {
    targetRms: 0.12,
    peakCeiling: 0.95,
    gateThreshold: 0.008,
    maxGainBoost: 3.5,
    minGain: 0.25,
    interSegmentSilenceSec: 0.35,
    targetSampleRate: 24000,
    alignZeroCrossing: true,
    ...options
  };

  if (!input) return input;

  if (typeof (input as AudioBuffer).getChannelData === 'function') {
    const audioBuf = input as AudioBuffer;
    for (let ch = 0; ch < audioBuf.numberOfChannels; ch++) {
      const data = audioBuf.getChannelData(ch);
      normalizeAudioBuffer(data, opts);
    }
    return input;
  }

  const samples = input as Float32Array;
  if (samples.length === 0) return input;

  // 1. Remove DC bias
  removeDcOffset(samples);

  // 2. Measure active gated RMS
  const currentRms = calculateGatedRms(samples, opts.gateThreshold);

  // 3. Compute gain scalar if valid signal is present
  if (currentRms > 1e-4) {
    const rawGain = opts.targetRms / currentRms;
    const clampedGain = Math.max(opts.minGain, Math.min(opts.maxGainBoost, rawGain));

    for (let i = 0; i < samples.length; i++) {
      samples[i] *= clampedGain;
    }
  }

  // 4. Soft-limiting to prevent clipping & distortion
  applySoftLimiter(samples, opts.peakCeiling);

  // 5. Zero-crossing tail alignment & boundary fading
  if (opts.alignZeroCrossing) {
    const zeroCrossIdx = findZeroCrossingNearEnd(samples, Math.min(480, Math.floor(samples.length * 0.1)));
    if (zeroCrossIdx < samples.length) {
      for (let j = zeroCrossIdx; j < samples.length; j++) {
        samples[j] = 0;
      }
    }
  }

  const fadeSamples = Math.round(opts.targetSampleRate * 0.012); // 12ms Hann micro-fade
  applyHannMicroFade(samples, fadeSamples);

  return input;
}

/**
 * Scans and levels a list of audio segments before playback or export to ensure uniform loudness.
 */
export function normalizeAudioSegments<T extends Float32Array | AudioBuffer>(
  segments: T[],
  options?: AudioNormalizationOptions
): T[] {
  return segments.map(seg => normalizeAudioBuffer(seg, options));
}

/**
 * Decodes and levels a list of base64 or URL audio chunks into normalized AudioBuffers
 * ready for seamless Web Audio playback.
 */
export async function levelAudioChunks(
  audioChunks: string[],
  audioCtx?: AudioContext,
  options?: AudioNormalizationOptions
): Promise<AudioBuffer[]> {
  if (!audioChunks || audioChunks.length === 0) return [];
  const ctx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
  const normalizedBuffers: AudioBuffer[] = [];

  for (let i = 0; i < audioChunks.length; i++) {
    const chunk = audioChunks[i];
    let arrayBuffer: ArrayBuffer;

    if (chunk.startsWith("http")) {
      try {
        const res = await fetch(chunk);
        arrayBuffer = await res.arrayBuffer();
      } catch (err) {
        console.error(`[AudioExport] Failed to fetch chunk ${i}:`, err);
        continue;
      }
    } else {
      arrayBuffer = base64ToArrayBuffer(chunk);
    }

    try {
      const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
      normalizeAudioBuffer(decoded, options);
      normalizedBuffers.push(decoded);
    } catch (err) {
      console.warn(`[AudioExport] Decoding error for chunk ${i}:`, err);
    }
  }

  return normalizedBuffers;
}

/**
 * Export a list of base64 or HTTP audio chunks as a single, studio-grade WAV file download.
 * Features full audio normalization (RMS matching, DC offset stripping, soft-knee limiting,
 * zero-crossing alignment, and smooth inter-segment silence).
 */
export async function exportBriefingAsWav(
  audioChunks: string[],
  title: string,
  options?: AudioNormalizationOptions
): Promise<void> {
  if (!audioChunks || audioChunks.length === 0) return;

  const targetSampleRate = options?.targetSampleRate ?? 24000;
  const silenceSec = options?.interSegmentSilenceSec ?? 0.35;
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: targetSampleRate });
  const decodedChannels: Float32Array[] = [];

  try {
    for (let i = 0; i < audioChunks.length; i++) {
      const chunk = audioChunks[i];
      let arrayBuffer: ArrayBuffer;

      if (chunk.startsWith("http")) {
        try {
          const res = await fetch(chunk);
          arrayBuffer = await res.arrayBuffer();
        } catch (fetchErr) {
          console.error(`[AudioExport] Failed to fetch chunk ${i}:`, fetchErr);
          continue;
        }
      } else {
        arrayBuffer = base64ToArrayBuffer(chunk);
      }

      const isWav = arrayBuffer.byteLength >= 44 && 
        new Uint8Array(arrayBuffer, 0, 4).every((val, idx) => val === [0x52, 0x49, 0x46, 0x46][idx]);
      const isMp3 = isMp3ArrayBuffer(arrayBuffer);

      let floatSamples: Float32Array;

      if (isMp3 || isWav) {
        try {
          // Native Web Audio decoder
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
          // Downmix to mono float array
          const mono = new Float32Array(audioBuffer.length);
          for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            const chData = audioBuffer.getChannelData(ch);
            for (let j = 0; j < audioBuffer.length; j++) {
              mono[j] += chData[j] / audioBuffer.numberOfChannels;
            }
          }
          floatSamples = mono;
        } catch (decErr) {
          console.warn(`[AudioExport] Native decoding failed for chunk ${i}, fallback to PCM:`, decErr);
          floatSamples = pcmToFloat32(stripWavHeaderInBrowser(arrayBuffer));
        }
      } else {
        floatSamples = pcmToFloat32(stripWavHeaderInBrowser(arrayBuffer));
      }

      // Apply studio normalization to each individual segment to equalize loudness
      normalizeAudioBuffer(floatSamples, { ...options, targetSampleRate });
      decodedChannels.push(floatSamples);
    }

    if (decodedChannels.length === 0) {
      throw new Error("No audio could be decoded for export.");
    }

    // Insert clean silence buffer between segments
    const silenceLength = Math.round(targetSampleRate * silenceSec);
    const silenceBuffer = new Float32Array(silenceLength);

    const totalLength = decodedChannels.reduce(
      (acc, chan, idx) => acc + chan.length + (idx < decodedChannels.length - 1 ? silenceLength : 0),
      0
    );

    const unifiedFloatArray = new Float32Array(totalLength);
    let writePos = 0;

    decodedChannels.forEach((chan, idx) => {
      unifiedFloatArray.set(chan, writePos);
      writePos += chan.length;
      if (idx < decodedChannels.length - 1) {
        unifiedFloatArray.set(silenceBuffer, writePos);
        writePos += silenceLength;
      }
    });

    // Master bus pass: DC offset check and final soft peak safety
    removeDcOffset(unifiedFloatArray);
    applySoftLimiter(unifiedFloatArray, options?.peakCeiling ?? 0.95);

    const pcmBuffer = float32ToInt16Pcm(unifiedFloatArray);
    const wavBlob = encodeWavHeader(pcmBuffer, targetSampleRate);
    const url = URL.createObjectURL(wavBlob);
    
    const sanitizedTitle = (title || "CommuteSummary").replace(/[^a-zA-Z0-9_-]/g, "_");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizedTitle}_Studio_24khz.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } finally {
    audioCtx.close().catch(() => {});
  }
}


