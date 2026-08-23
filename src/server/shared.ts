import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Storage } from "@google-cloud/storage";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

export const LOCAL_AUDIO_DIR = path.join(process.cwd(), "local_podcasts");

if (!fs.existsSync(LOCAL_AUDIO_DIR)) {
  fs.mkdirSync(LOCAL_AUDIO_DIR, { recursive: true });
}

export function getGcsClient(): Storage | null {
  const projectId = process.env.GCS_PROJECT_ID;
  const clientEmail = process.env.GCS_CLIENT_EMAIL;
  const privateKey = process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  try {
    return new Storage({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    });
  } catch (err) {
    console.error("GCS Client init error:", err);
    return null;
  }
}

export const SUPABASE_BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME || "CampucasV2_audio";

export function getSupabaseClient() {
  const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
  const supabaseKey = (process.env.SUPABASE_ANON_KEY || "").trim();

  const isInvalidUrl = 
    !supabaseUrl || 
    supabaseUrl.includes("your-project") || 
    supabaseUrl.includes("your-project-ref") || 
    supabaseUrl.includes("example.supabase.co") || 
    supabaseUrl.includes("placeholder") || 
    supabaseUrl.includes("dummy");

  const isInvalidKey = 
    !supabaseKey || 
    supabaseKey.includes("your-anon-key") || 
    supabaseKey.includes("placeholder") || 
    supabaseKey.includes("dummy");

  if (isInvalidUrl || isInvalidKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export function encodeWavHeaderNode(pcmBuffer: Buffer, sampleRate: number = 24000): Buffer {
  const headerBuffer = Buffer.alloc(44);
  headerBuffer.write("RIFF", 0);
  headerBuffer.writeUInt32LE(36 + pcmBuffer.length, 4);
  headerBuffer.write("WAVE", 8);
  headerBuffer.write("fmt ", 12);
  headerBuffer.writeUInt32LE(16, 16);
  headerBuffer.writeUInt16LE(1, 20);
  headerBuffer.writeUInt16LE(1, 22);
  headerBuffer.writeUInt32LE(sampleRate, 24);
  headerBuffer.writeUInt32LE(sampleRate * 1 * 2, 28);
  headerBuffer.writeUInt16LE(2, 32);
  headerBuffer.writeUInt16LE(16, 34);
  headerBuffer.write("data", 36);
  headerBuffer.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([headerBuffer, pcmBuffer]);
}

export function stripWavHeaderIfNeeded(buf: Buffer): Buffer {
  if (buf.length >= 44 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) {
    let offset = 12;
    while (offset + 8 <= buf.length) {
      const subchunkId = buf.toString('ascii', offset, offset + 4);
      const subchunkSize = buf.readUInt32LE(offset + 4);
      if (subchunkId === 'data') {
        return buf.subarray(offset + 8, Math.min(buf.length, offset + 8 + subchunkSize));
      }
      offset += 8 + subchunkSize;
    }
    return buf.subarray(44);
  }
  return buf;
}

export function isMp3Buffer(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) return false;
  // ID3v2 tag identifier
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) return true;
  // MPEG Audio Sync Word
  if (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0 && (buffer[1] & 0x18) !== 0x08) return true;
  return false;
}

// MPEG Audio Bitrate & Sample Rate Tables for frame size calculation
const MPEG1_L3_BITRATES = [0, 32000, 40000, 48000, 56000, 64000, 80000, 96000, 112000, 128000, 160000, 192000, 224000, 256000, 320000];
const MPEG2_L3_BITRATES = [0, 8000, 16000, 24000, 32000, 40000, 48000, 56000, 64000, 80000, 96000, 112000, 128000, 144000, 160000];
const MPEG1_SAMPLERATES = [44100, 48000, 32000];
const MPEG2_SAMPLERATES = [22050, 24000, 16000];
const MPEG25_SAMPLERATES = [11025, 12000, 8000];

export function getMpegFrameSize(buf: Buffer, offset: number): number {
  if (offset + 4 > buf.length) return 0;
  const b0 = buf[offset];
  const b1 = buf[offset + 1];
  const b2 = buf[offset + 2];

  if (b0 !== 0xFF || (b1 & 0xE0) !== 0xE0) return 0;

  const versionBits = (b1 >> 3) & 0x03; // 00=2.5, 01=reserved, 10=2, 11=1
  const layerBits = (b1 >> 1) & 0x03;   // 00=reserved, 01=L3, 10=L2, 11=L1
  if (versionBits === 1 || layerBits === 0) return 0;

  const isMpeg1 = versionBits === 3;
  const isMpeg2 = versionBits === 2;
  const isMpeg25 = versionBits === 0;

  const bitrateIdx = (b2 >> 4) & 0x0F;
  const sampleRateIdx = (b2 >> 2) & 0x03;
  const paddingBit = (b2 >> 1) & 0x01;

  if (bitrateIdx === 0x0F || sampleRateIdx === 0x03) return 0;

  let bitrate = 0;
  if (isMpeg1) {
    bitrate = MPEG1_L3_BITRATES[bitrateIdx] || 0;
  } else {
    bitrate = MPEG2_L3_BITRATES[bitrateIdx] || 0;
  }

  let sampleRate = 0;
  if (isMpeg1) sampleRate = MPEG1_SAMPLERATES[sampleRateIdx] || 0;
  else if (isMpeg2) sampleRate = MPEG2_SAMPLERATES[sampleRateIdx] || 0;
  else if (isMpeg25) sampleRate = MPEG25_SAMPLERATES[sampleRateIdx] || 0;

  if (!bitrate || !sampleRate) return 0;

  if (layerBits === 1) { // Layer III
    const multiplier = isMpeg1 ? 144 : 72;
    return Math.floor((multiplier * bitrate) / sampleRate) + paddingBit;
  } else if (layerBits === 2) { // Layer II
    return Math.floor((144 * bitrate) / sampleRate) + paddingBit;
  } else if (layerBits === 3) { // Layer I
    return Math.floor((12 * bitrate / sampleRate) + paddingBit) * 4;
  }

  return 0;
}

/**
 * Strips ID3v2, ID3v1, Xing header frames, and corrupted trailing partial bytes from an MP3 buffer.
 * Returns a clean, frame-aligned MPEG Audio stream.
 */
export function stripMp3Metadata(buf: Buffer, stripXingHeader: boolean = false): Buffer {
  if (!buf || buf.length < 4) return buf;

  let startOffset = 0;

  // 1. Check & Skip ID3v2 Header
  if (buf.length >= 10 && buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    const flags = buf[5];
    const tagSize = ((buf[6] & 0x7F) << 21) | ((buf[7] & 0x7F) << 14) | ((buf[8] & 0x7F) << 7) | (buf[9] & 0x7F);
    startOffset = 10 + tagSize;
    if ((flags & 0x10) !== 0) {
      startOffset += 10; // Extended footer present
    }
  }

  // 2. Scan forward to find first valid MPEG Sync Word
  let firstFrameOffset = -1;
  for (let i = startOffset; i < buf.length - 4; i++) {
    if (buf[i] === 0xFF && (buf[i + 1] & 0xE0) === 0xE0) {
      const frameSize = getMpegFrameSize(buf, i);
      if (frameSize > 0 && i + frameSize <= buf.length) {
        firstFrameOffset = i;
        break;
      }
    }
  }

  if (firstFrameOffset === -1) {
    return buf.subarray(startOffset);
  }

  // 3. Optional: Skip Xing / Info / VBRI header frame if requested
  if (stripXingHeader) {
    const frameSize = getMpegFrameSize(buf, firstFrameOffset);
    if (frameSize > 0 && firstFrameOffset + frameSize < buf.length) {
      const frameData = buf.subarray(firstFrameOffset, firstFrameOffset + frameSize);
      const frameStr = frameData.toString('ascii');
      if (frameStr.includes('Xing') || frameStr.includes('Info') || frameStr.includes('VBRI')) {
        firstFrameOffset += frameSize;
      }
    }
  }

  // 4. Check & Strip ID3v1 Tag from end (128 bytes starting with 'TAG')
  let endOffset = buf.length;
  if (endOffset >= 128) {
    const possibleTag = buf.toString('ascii', endOffset - 128, endOffset - 125);
    if (possibleTag === 'TAG') {
      endOffset -= 128;
    }
  }

  // 5. Check & Strip APE Tag from end
  if (endOffset >= 32) {
    const possibleApe = buf.toString('ascii', endOffset - 32, endOffset - 24);
    if (possibleApe === 'APETAGEX') {
      endOffset -= 32;
    }
  }

  // 6. Frame boundary alignment: Walk through frames from firstFrameOffset to endOffset
  let curr = firstFrameOffset;
  let lastValidEnd = firstFrameOffset;
  while (curr < endOffset) {
    const size = getMpegFrameSize(buf, curr);
    if (size > 0 && curr + size <= endOffset) {
      curr += size;
      lastValidEnd = curr;
    } else {
      break;
    }
  }

  if (lastValidEnd > firstFrameOffset) {
    return buf.subarray(firstFrameOffset, lastValidEnd);
  }

  return buf.subarray(firstFrameOffset, endOffset);
}

/**
 * Applies a gentle Hann window fade-in and fade-out to 16-bit Mono/Stereo PCM data
 * to completely eliminate DC offset clicks and boundary pops.
 */
export function applyHannWindowPcm(pcmBuffer: Buffer, fadeSamples: number = 120): Buffer {
  if (pcmBuffer.length < fadeSamples * 4) return pcmBuffer;
  const out = Buffer.from(pcmBuffer);
  const totalSamples = Math.floor(out.length / 2);
  const actualFade = Math.min(fadeSamples, Math.floor(totalSamples / 2));

  // Fade-in
  for (let i = 0; i < actualFade; i++) {
    const val = out.readInt16LE(i * 2);
    const window = 0.5 * (1 - Math.cos((Math.PI * i) / actualFade));
    out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(val * window))), i * 2);
  }

  // Fade-out
  for (let i = 0; i < actualFade; i++) {
    const idx = totalSamples - actualFade + i;
    const val = out.readInt16LE(idx * 2);
    const window = 0.5 * (1 - Math.cos((Math.PI * (actualFade - 1 - i)) / actualFade));
    out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(val * window))), idx * 2);
  }

  return out;
}

/**
 * Concatenates multiple MP3 audio buffers into a single, seamless, glitch-free MP3 stream.
 * Strips all internal ID3 tags and metadata frames between chunks to prevent burst noise.
 */
export function joinMp3AudioBuffers(buffers: Buffer[]): Buffer {
  if (!buffers || buffers.length === 0) return Buffer.alloc(0);
  if (buffers.length === 1) return stripMp3Metadata(buffers[0]);

  const cleanChunks: Buffer[] = [];
  for (let i = 0; i < buffers.length; i++) {
    const raw = buffers[i];
    if (!raw || raw.length === 0) continue;
    // For chunks after the first, strip any Xing/Info headers to ensure bitstream continuity
    const cleaned = stripMp3Metadata(raw, i > 0);
    if (cleaned.length > 0) {
      cleanChunks.push(cleaned);
    }
  }

  return Buffer.concat(cleanChunks);
}

/**
 * Concatenates multiple Linear PCM / WAV buffers into a single smooth WAV audio buffer.
 * Applies Hann window boundary smoothing and inserts clean silence gaps between segments.
 */
export function joinPcmAudioBuffers(
  buffers: Buffer[], 
  sampleRate: number = 24000, 
  silenceMs: number = 350
): Buffer {
  if (!buffers || buffers.length === 0) return Buffer.alloc(0);

  const silenceSamples = Math.round(sampleRate * (silenceMs / 1000));
  const silenceBuffer = Buffer.alloc(silenceSamples * 2, 0); // 16-bit mono zero-silence
  const pcmSegments: Buffer[] = [];

  for (let i = 0; i < buffers.length; i++) {
    const raw = buffers[i];
    if (!raw || raw.length === 0) continue;
    const rawPcm = stripWavHeaderIfNeeded(raw);
    const smoothedPcm = applyHannWindowPcm(rawPcm, Math.round(sampleRate * 0.008)); // 8ms Hann fade
    pcmSegments.push(smoothedPcm);
    if (i < buffers.length - 1 && silenceMs > 0) {
      pcmSegments.push(silenceBuffer);
    }
  }

  const mergedPcm = Buffer.concat(pcmSegments);
  return encodeWavHeaderNode(mergedPcm, sampleRate);
}

/**
 * Automatically inspects, cleans, and joins audio buffers based on detected container format (MP3 vs PCM/WAV).
 */
export function joinAudioBuffersAuto(
  buffers: Buffer[],
  sampleRate: number = 24000
): { buffer: Buffer; contentType: string; fileExt: string } {
  if (!buffers || buffers.length === 0) {
    return { buffer: Buffer.alloc(0), contentType: "audio/mpeg", fileExt: "mp3" };
  }

  const isMp3 = isMp3Buffer(buffers[0]);
  if (isMp3) {
    const mergedMp3 = joinMp3AudioBuffers(buffers);
    return { buffer: mergedMp3, contentType: "audio/mpeg", fileExt: "mp3" };
  } else {
    const mergedWav = joinPcmAudioBuffers(buffers, sampleRate, 350);
    return { buffer: mergedWav, contentType: "audio/wav", fileExt: "wav" };
  }
}

export function wrapAsWavIfRawPcmNode(buffer: Buffer, sampleRate: number = 24000): Buffer {
  if (buffer.length < 4) return buffer;
  const isWav = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
  const isMp3 = isMp3Buffer(buffer);
  if (isWav || isMp3) {
    return buffer;
  }
  return encodeWavHeaderNode(buffer, sampleRate);
}

// ===== GEMINI SHARED INFRASTRUCTURE =====

let currentKeyIndex = 0;
const keyCooldownMap = new Map<string, number>();
const COOLDOWN_DURATION = 60 * 1000;

export function getKeysList(): string[] {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY.trim());
  for (let i = 2; i <= 6; i++) {
    const key = process.env[`GEMINI_API_KEY${i}`];
    if (key) keys.push(key.trim());
  }
  return keys.filter(k => k !== "");
}

export function getGenAI(): GoogleGenAI {
  const keys = getKeysList();
  if (keys.length === 0) {
    throw new Error("GEMINI_API_KEY is not defined. Please check Settings -> Secrets.");
  }
  const idx = currentKeyIndex % keys.length;
  return new GoogleGenAI({
    apiKey: keys[idx],
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
}

export async function callGeminiWithRotation<T>(
  apiCall: (ai: GoogleGenAI) => Promise<T>
): Promise<T> {
  const keys = getKeysList();
  if (keys.length === 0) {
    throw new Error("No GEMINI_API_KEY is configured. Please set at least GEMINI_API_KEY in Settings -> Secrets.");
  }

  let lastError: any = null;
  const maxAttempts = keys.length * 2;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const keyIndex = currentKeyIndex % keys.length;
    const currentKey = keys[keyIndex];
    const now = Date.now();

    const cooldownExpiry = keyCooldownMap.get(currentKey) || 0;
    if (now < cooldownExpiry) {
      console.log(`[Gemini Rotation] Key #${keyIndex + 1} on cooldown until ${new Date(cooldownExpiry).toISOString()}. Skipping.`);
      currentKeyIndex = (currentKeyIndex + 1) % keys.length;
      continue;
    }

    const ai = new GoogleGenAI({
      apiKey: currentKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    try {
      console.log(`[Gemini Rotation] Attempting call using Key Index #${keyIndex + 1} of ${keys.length} (ending ...${currentKey.slice(-4)})`);
      const result = await apiCall(ai);
      keyCooldownMap.delete(currentKey);
      return result;
    } catch (error: any) {
      lastError = error;
      const errMsg = (error.message || "").toLowerCase();
      const isQuotaLimit =
        errMsg.includes("resource_exhausted") ||
        errMsg.includes("quota") ||
        errMsg.includes("limit") ||
        errMsg.includes("429") ||
        errMsg.includes("rate limit");

      if (isQuotaLimit && keys.length > 1) {
        const expiry = Date.now() + COOLDOWN_DURATION;
        keyCooldownMap.set(currentKey, expiry);
        console.warn(`[Gemini Rotation] Key #${keyIndex + 1} hit quota. Cooling down for ${COOLDOWN_DURATION/1000}s until ${new Date(expiry).toISOString()}`);
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        continue;
      } else if (
        errMsg.includes("api_key_invalid") ||
        errMsg.includes("api key not valid") ||
        errMsg.includes("invalid api key") ||
        errMsg.includes("key is invalid")
      ) {
        const expiry = Date.now() + 3600 * 1000;
        keyCooldownMap.set(currentKey, expiry);
        console.error(`[Gemini Rotation] Key #${keyIndex + 1} is invalid. Cooling down for 1 hour.`);
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        continue;
      } else {
        throw error;
      }
    }
  }

  if (lastError) {
    const errMsg = (lastError.message || "").toLowerCase();
    if (
      errMsg.includes("resource_exhausted") ||
      errMsg.includes("quota") ||
      errMsg.includes("limit") ||
      errMsg.includes("429")
    ) {
      throw new Error("All Gemini API keys are currently rate-limited. Please wait and try again.");
    }
    throw lastError;
  }

  throw new Error("All configured GEMINI_API_KEY entries exhausted or on cooldown.");
}

export function extractErrorMessage(error: any): string {
  if (!error) return "Unknown error";

  let details = "";
  if (error.response && error.response.data) {
    const data = error.response.data;
    if (typeof data === "string") {
      details = data;
    } else if (typeof data === "object") {
      if (data.error) {
        if (typeof data.error === "object") {
          details = data.error.message || JSON.stringify(data.error);
        } else {
          details = String(data.error);
        }
      } else {
        details = JSON.stringify(data);
      }
    }
  }

  const baseMsg = error.message || "";
  let fullMsg = baseMsg;
  if (details) {
    fullMsg += ` (Details: ${details})`;
  }

  if (error.status) {
    fullMsg = `[Status ${error.status}] ${fullMsg}`;
  }

  return fullMsg;
}

export function parseGeminiError(error: any, isVi: boolean = true, isTTS: boolean = false): string {
  const fullMsg = extractErrorMessage(error);
  const lowercaseMsg = fullMsg.toLowerCase();

  if (
    lowercaseMsg.includes("resource_exhausted") ||
    lowercaseMsg.includes("quota") ||
    lowercaseMsg.includes("limit") ||
    lowercaseMsg.includes("429")
  ) {
    return isVi 
      ? "Hệ thống đang quá tải hoặc hết hạn ngạch (Quota). Vui lòng thử lại sau giây lát." 
      : "System is overloaded or quota exhausted. Please try again in a moment.";
  }

  if (lowercaseMsg.includes("api_key_invalid") || lowercaseMsg.includes("key is invalid")) {
    return isVi 
      ? "Lỗi xác thực: API Key không hợp lệ hoặc đã hết hạn." 
      : "Authentication error: Invalid or expired API Key.";
  }

  if (lowercaseMsg.includes("safety") || lowercaseMsg.includes("blocked")) {
    return isVi 
      ? "Nội dung bị chặn bởi bộ lọc an toàn của AI." 
      : "Content was blocked by AI safety filters.";
  }

  if (isTTS && (lowercaseMsg.includes("timeout") || lowercaseMsg.includes("deadline"))) {
    return isVi
      ? "Yêu cầu tạo giọng nói bị quá hạn. Vui lòng thử lại."
      : "Voice synthesis request timed out. Please try again.";
  }

  return isVi 
    ? `Đã xảy ra lỗi hệ thống: ${fullMsg}` 
    : `A system error occurred: ${fullMsg}`;
}

// ===== GROQ SHARED INFRASTRUCTURE =====

export async function generateWithGroq(systemPrompt: string, userPrompt: string, responseFormatJson: boolean = false): Promise<string> {
  const gApiKey = process.env.GROQ_API_KEY;
  if (!gApiKey) {
    throw new Error("GROQ_API_KEY is not defined in system environment.");
  }

  const CANDIDATE_MODELS = [
    "openai/gpt-oss-120b",
    "groq/compound-mini",
    "groq/compound",
    "openai/gpt-oss-20b",
    "qwen/qwen3.6-27b",
    "allam-2-7b"
  ];

  let finalSystemPrompt = systemPrompt;
  if (responseFormatJson) {
    finalSystemPrompt += "\nCRITICAL: Your entire output must be a single valid JSON object strictly matching the requested structure. Do not output markdown code blocks or surrounding text.";
  }

  let lastError: Error | null = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const executeRequest = async (useJsonFormat: boolean) => {
        const payload: any = {
          model: modelName,
          messages: [
            { role: "system", content: finalSystemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
        };

        if (useJsonFormat) {
          payload.response_format = { type: "json_object" };
        }

        const response = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${gApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }, 15000);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`STATUS_${response.status}:${errorText}`);
        }

        const data: any = await response.json();
        return data.choices?.[0]?.message?.content || null;
      };

      let content: string | null = null;
      try {
        content = await executeRequest(responseFormatJson);
      } catch (reqErr: any) {
        // If strict JSON format validation failed on Groq, retry without response_format parameter
        if (responseFormatJson && reqErr?.message?.includes("json_validate_failed")) {
          console.warn(`[Groq] Model ${modelName} strict json_format failed. Retrying without response_format param...`);
          content = await executeRequest(false);
        } else {
          throw reqErr;
        }
      }

      if (!content) {
        console.warn(`[Groq] Model ${modelName} returned empty choices content. Trying next candidate...`);
        lastError = new Error(`Groq API model ${modelName} returned empty content.`);
        continue;
      }

      let cleanedContent = content.trim();
      if (responseFormatJson) {
        // Strip markdown backticks if present
        if (cleanedContent.startsWith("```")) {
          cleanedContent = cleanedContent.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        }
      }

      return cleanedContent;
    } catch (err: any) {
      console.warn(`[Groq] Candidate ${modelName} failed:`, err?.message || err);
      lastError = err;
      if (err?.message?.includes("timeout")) {
        break;
      }
    }
  }

  throw lastError || new Error("All Groq candidate models failed.");
}

// ===== UTILITIES =====

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
    )
  ]);
}

export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}
