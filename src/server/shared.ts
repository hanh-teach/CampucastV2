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
  const supabaseUrl = process.env.SUPABASE_URL || "https://lbmylmefqlirdfawbwpo.supabase.co";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_jKRkcYr1pPd1MBzcXvbH1w_5__H5N-6";
  if (!supabaseUrl || !supabaseKey) return null;
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

  const modelName = "llama-3.3-70b-versatile";

  let finalSystemPrompt = systemPrompt;
  if (responseFormatJson) {
    finalSystemPrompt += "\nCRITICAL: Your entire output must be one single valid JSON object strictly matching the requested JSON Schema structure. Do not output any markdown code blocks, surround with triple backticks, or write conversational surrounding wrapper text.";
  }

  const payload: any = {
    model: modelName,
    messages: [
      { role: "system", content: finalSystemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.3,
  };

  if (responseFormatJson) {
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
    throw new Error(`Groq API returned error status ${response.status}: ${errorText}`);
  }

  const data: any = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq API returned empty choices content.");
  }
  return content;
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
