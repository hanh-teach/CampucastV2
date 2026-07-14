import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { tts as runEdgeTTS } from "edge-tts";
import { COMMON_PROPER_NOUNS, ACRONYM_MAP_VI } from "../../utils/tts-dictionaries";
import { 
  callGeminiWithRotation, 
  parseGeminiError, 
  withTimeout,
  encodeWavHeaderNode,
  fetchWithTimeout,
  getSupabaseClient
} from "../shared";

const router = express.Router();

// ============================================================
// TTS CACHE - FILE SYSTEM (Hoàn chỉnh, an toàn)
// ============================================================

const TTS_CACHE_DIR = path.join(process.cwd(), 'tts_cache');
const TTS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút
const TTS_CACHE_MAX_FILES = 100;
const TTS_CACHE_MAX_FILE_SIZE_MB = 5; 
let ttsCacheEnabled = false;

function initTtsCache(): boolean {
  try {
    if (!fs.existsSync(TTS_CACHE_DIR)) {
      fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });
      console.log(`[TTS Cache] ✅ Created cache directory: ${TTS_CACHE_DIR}`);
    }
    fs.accessSync(TTS_CACHE_DIR, fs.constants.W_OK);
    console.log(`[TTS Cache] ✅ Cache directory is writable.`);
    ttsCacheEnabled = true;
    return true;
  } catch (err: any) {
    console.error(`[TTS Cache] ❌ Cannot write to cache directory: ${err.message}`);
    ttsCacheEnabled = false;
    return false;
  }
}

initTtsCache();

function getTtsCacheKey(text: string, voice: string, tone: string, emotion: string = ""): string {
  const hash = crypto.createHash('md5').update(`${text}_${voice}_${tone}_${emotion}`).digest('hex');
  return hash;
}

function getCachedTtsFile(key: string): Buffer | null {
  if (!ttsCacheEnabled) return null;
  const filePath = path.join(TTS_CACHE_DIR, `${key}.mp3`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const stats = fs.statSync(filePath);
    if (Date.now() - stats.mtimeMs > TTS_CACHE_TTL_MS) {
      fs.unlinkSync(filePath);
      console.log(`[TTS Cache] 🗑️ Removed expired cache: ${key}`);
      return null;
    }
    if (stats.size > TTS_CACHE_MAX_FILE_SIZE_MB * 1024 * 1024) {
      fs.unlinkSync(filePath);
      console.log(`[TTS Cache] 🗑️ Removed oversized cache: ${key} (${(stats.size/1024/1024).toFixed(2)}MB)`);
      return null;
    }
    console.log(`[TTS Cache] ✅ Cache hit: ${key}`);
    return fs.readFileSync(filePath);
  } catch (err) {
    console.warn(`[TTS Cache] ⚠️ Error reading cache file: ${err}`);
    return null;
  }
}

function setTtsCacheFile(key: string, buffer: Buffer): void {
  if (!ttsCacheEnabled) return;
  if (buffer.length > TTS_CACHE_MAX_FILE_SIZE_MB * 1024 * 1024) {
    console.log(`[TTS Cache] ⏭️ File too large (${(buffer.length/1024/1024).toFixed(2)}MB), skipping cache.`);
    return;
  }
  try {
    const files = fs.readdirSync(TTS_CACHE_DIR);
    if (files.length >= TTS_CACHE_MAX_FILES) {
      const sorted = files
        .map(f => ({ 
          name: f, 
          mtime: fs.statSync(path.join(TTS_CACHE_DIR, f)).mtimeMs 
        }))
        .sort((a, b) => a.mtime - b.mtime);
      const toDelete = sorted.slice(0, files.length - TTS_CACHE_MAX_FILES + 1);
      for (const file of toDelete) {
        try {
          fs.unlinkSync(path.join(TTS_CACHE_DIR, file.name));
        } catch (e) {}
      }
      console.log(`[TTS Cache] 🧹 Cleaned up ${toDelete.length} old cache files.`);
    }
    const filePath = path.join(TTS_CACHE_DIR, `${key}.mp3`);
    fs.writeFileSync(filePath, buffer);
    console.log(`[TTS Cache] 💾 Saved to cache: ${key} (${(buffer.length/1024).toFixed(1)}KB)`);
  } catch (err) {
    console.warn(`[TTS Cache] ⚠️ Error writing cache file: ${err}`);
  }
}

function clearTtsCache(): number {
  if (!ttsCacheEnabled) return 0;
  try {
    const files = fs.readdirSync(TTS_CACHE_DIR);
    let count = 0;
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(TTS_CACHE_DIR, file));
        count++;
      } catch (e) {}
    }
    console.log(`[TTS Cache] 🗑️ Cleared ${count} cache files.`);
    return count;
  } catch (err) {
    console.error(`[TTS Cache] ❌ Error clearing cache: ${err}`);
    return 0;
  }
}

// ===== TTS GLOBAL STATE =====
let globalGeminiTtsDisabledUntil = 0;
let globalEdgeTtsDisabledUntil = 0;
let globalGCloudTtsDisabledUntil = 0;
let lastSuccessfulEngine: string | null = null;

// ===== BROADCAST SPEECH ENGINE =====
let BroadcastSpeechEngine: any = null;
let broadcastEngineLoaded = false;

export async function loadBroadcastSpeechEngine() {
  if (broadcastEngineLoaded) return;
  try {
    const module: any = await import("../../services/broadcastSpeechEngine");
    BroadcastSpeechEngine = module.BroadcastSpeechEngine;
    console.log("[TTS Route] BroadcastSpeechEngine loaded successfully.");
  } catch (err: any) {
    console.warn("[TTS Route] Failed to load BroadcastSpeechEngine, using fallback mock:", err.message);
    BroadcastSpeechEngine = {
      process: async (text: string, voice: string, tone: string, ai?: any) => {
        return text;
      }
    };
  }
  broadcastEngineLoaded = true;
}

// ===== TTS HELPER FUNCTIONS =====

function cleanMarkdownAndEmojis(str: string): string {
  if (!str) return "";
  return str
    .replace(/[*_#`~>]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");
}

function replaceUrls(str: string): string {
  if (!str) return "";
  return str.replace(/https?:\/\/[^\s]+/g, "liên kết");
}

function cleanBroadcastArtifacts(text: string): string {
  if (!text) return "";
  return text
    .replace(/\[Tiêu đề\]:?\s*/gi, "")
    .replace(/\[Nội dung\]:?\s*/gi, "")
    .replace(/\[Kết thúc\]:?\s*/gi, "")
    .replace(/\(Ảnh:.*?\)/gi, "")
    .replace(/\(Video:.*?\)/gi, "");
}

function normalizeAcronyms(text: string, lang: "vi" | "en"): string {
  if (!text) return "";
  let normalized = text;
  if (lang === "vi") {
    // 1. Dùng ACRONYM_MAP_VI
    for (const [acronym, spoken] of Object.entries(ACRONYM_MAP_VI)) {
      const escaped = acronym.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'g');
      normalized = normalized.replace(regex, spoken);
    }
    // 2. Dùng COMMON_PROPER_NOUNS (cho phép lowercase check để linh hoạt)
    for (const [acronym, spoken] of Object.entries(COMMON_PROPER_NOUNS)) {
      const escaped = acronym.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'g');
      normalized = normalized.replace(regex, spoken);
    }
  }
  return normalized;
}

function normalizeTextForLanguage(text: string, lang: "vi" | "en"): string {
  if (!text) return "";
  let normalized = text;
  if (lang === "vi") {
    normalized = normalizeAcronyms(normalized, "vi");
    normalized = normalized
      .replace(/\b100%/g, "một trăm phần trăm")
      .replace(/\b50%/g, "năm mươi phần trăm")
      .replace(/\b(\d+)\s*%/g, "$1 phần trăm")
      .replace(/\b(\d+)\s*km/gi, "$1 ki-lô-mét")
      .replace(/\b(\d+)\s*m\b/gi, "$1 mét")
      .replace(/\b(\d+)\s*kg/gi, "$1 ki-lô-gam")
      .replace(/\b(\d+)\s*°C/g, "$1 độ C")
      .replace(/\b(\d+)\s*°F/g, "$1 độ F")
      .replace(/\b(\d+)\s*USD/gi, "$1 đô-la Mỹ")
      .replace(/\b(\d+)\s*EUR/gi, "$1 ơ-rô")
      .replace(/\b(\d+)\s*VND/gi, "$1 Việt Nam Đồng")
      .replace(/\b(\d+)\s*-\s*(\d+)\b/g, "$1 $2")
      .replace(/\bvs\b/gi, "đối đầu với")
      .replace(/\b&\b/g, "và")
      .replace(/\b@\b/g, "a còng");
    return normalized;
  } else {
    normalized = normalized
      .replace(/\b(\d+)\s*%/g, "$1 percent")
      .replace(/\b(\d+)\s*km\b/gi, "$1 kilometers")
      .replace(/\b(\d+)\s*m\b/gi, "$1 meters")
      .replace(/\b(\d+)\s*kg\b/gi, "$1 kilograms")
      .replace(/\b(\d+)\s*USD\b/gi, "$1 dollars")
      .replace(/\b(\d+)\s*VND\b/gi, "$1 Vietnamese Dong")
      .replace(/\b&\b/g, "and");
    return normalized;
  }
}

function detectLanguageWithConfidence(text: string): { lang: "vi" | "en", confidence: number } {
  if (!text || text.trim() === "") return { lang: "vi", confidence: 0 };
  const viChars = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  const enWords = /\b(the|and|is|in|it|you|to|for|with|on|at|by|from|this|that|of|are|was|were|be|been|being|have|has|had|do|does|did|will|would|shall|should|can|could|may|might|must)\b/i;
  let viConfidence = 0;
  let enConfidence = 0;
  if (viChars.test(text)) viConfidence += 0.8;
  const words = text.toLowerCase().split(/\s+/);
  let enWordCount = 0;
  for (const w of words) { if (enWords.test(w)) enWordCount++; }
  if (enWordCount > 0) enConfidence += 0.5 + (enWordCount / words.length) * 0.4;
  if (viConfidence >= enConfidence) return { lang: "vi", confidence: Math.max(0.6, viConfidence) };
  else return { lang: "en", confidence: Math.max(0.6, enConfidence) };
}

function detectLanguage(text: string): "vi" | "en" {
  return detectLanguageWithConfidence(text).lang;
}

interface LanguageBlock {
  lang: "vi" | "en";
  text: string;
}

function segmentTextByLanguage(text: string, languageMode: string): LanguageBlock[] {
  if (!text || text.trim() === "") return [];
  const cleanedText = replaceUrls(cleanBroadcastArtifacts(cleanMarkdownAndEmojis(text)));
  const paragraphs = cleanedText.split("\n");
  const rawSegments: LanguageBlock[] = [];
  let lastDetectedLang: "vi" | "en" = "vi";
  for (const paragraph of paragraphs) {
    const trimmedPara = paragraph.trim();
    if (!trimmedPara) continue;
    let subParts: string[] = [];
    if (trimmedPara.includes("/")) {
      const rawParts = trimmedPara.split(/\s*\/\s*/);
      let tempParts: string[] = [];
      let currentGroup = "";
      for (const part of rawParts) {
        if (!currentGroup) {
          currentGroup = part;
        } else {
          const lastChar = currentGroup.trim().slice(-1);
          const firstChar = part.trim().charAt(0);
          if (/\d/.test(lastChar) && /\d/.test(firstChar)) {
            currentGroup += "/" + part;
          } else if (currentGroup.length <= 3 && part.length <= 3) {
            currentGroup += "/" + part;
          } else {
            tempParts.push(currentGroup);
            currentGroup = part;
          }
        }
      }
      if (currentGroup) tempParts.push(currentGroup);
      subParts = tempParts.map(p => p.trim()).filter(p => p.length > 0);
    } else {
      subParts = [trimmedPara];
    }
    for (const part of subParts) {
      const sentences = part.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 0);
      for (const sentence of sentences) {
        let lang: "vi" | "en";
        const detection = detectLanguageWithConfidence(sentence);
        if (!/[a-z]/i.test(sentence) || detection.confidence < 0.5) lang = lastDetectedLang;
        else {
          lang = detection.lang;
          lastDetectedLang = lang;
        }
        rawSegments.push({ lang, text: sentence });
      }
    }
  }
  let filteredSegments = rawSegments;
  if (languageMode === "VN_ONLY") filteredSegments = rawSegments.filter(seg => seg.lang === "vi");
  else if (languageMode === "EN_ONLY") filteredSegments = rawSegments.filter(seg => seg.lang === "en");
  if (filteredSegments.length === 0 && rawSegments.length > 0) filteredSegments = rawSegments;
  const groupedSegments: LanguageBlock[] = [];
  for (const seg of filteredSegments) {
    if (groupedSegments.length === 0) groupedSegments.push({ ...seg });
    else {
      const last = groupedSegments[groupedSegments.length - 1];
      if (last.lang === seg.lang) {
        const needsSpace = last.text.length > 0 && !last.text.endsWith(" ");
        last.text = last.text + (needsSpace ? " " : "") + seg.text;
      } else {
        groupedSegments.push({ ...seg });
      }
    }
  }
  return groupedSegments;
}

function chunkTextForTTS(text: string, maxChars = 200): string[] {
  if (!text) return [];
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  let currentText = text;
  while (currentText.length > 0) {
    if (currentText.length <= maxChars) {
      chunks.push(currentText);
      break;
    }
    let splitPos = currentText.lastIndexOf(". ", maxChars);
    if (splitPos === -1) splitPos = currentText.lastIndexOf("? ", maxChars);
    if (splitPos === -1) splitPos = currentText.lastIndexOf("! ", maxChars);
    if (splitPos === -1) splitPos = currentText.lastIndexOf(", ", maxChars);
    if (splitPos === -1) splitPos = currentText.lastIndexOf(" ", maxChars);
    if (splitPos === -1 || splitPos < maxChars / 2) splitPos = maxChars;
    chunks.push(currentText.substring(0, splitPos).trim());
    currentText = currentText.substring(splitPos).trim();
  }
  return chunks;
}

const EDGE_VOICE_MAP: Record<string, string> = {
  "vi-HN": "vi-VN-HoaiMyNeural",     // Female Northern - 2024, chất lượng xuất sắc
  "vi-HCM": "vi-VN-NamMinhNeural",   // Male Southern - tự nhiên, ấm áp
  "vi": "vi-VN-HoaiMyNeural",        // Default Vietnamese
  "en-US": "en-US-JennyNeural",      // Female US - rất tự nhiên
  "en-UK": "en-GB-SoniaNeural",      // Female UK - RP accent
  "en": "en-US-JennyNeural"         // Default English
};

async function callEdgeTTSForChunk(chunk: string, voice: string, rate: string): Promise<string> {
  const edgeVoice = EDGE_VOICE_MAP[voice] || voice || "en-US-JennyNeural";
  // Thêm pitch cho tiếng Anh (tăng 5% để giọng sáng hơn, tự nhiên hơn)
  let pitch = "0%";
  if (voice === "en-US" || voice === "en-UK" || voice === "en" || edgeVoice.startsWith("en-")) {
    pitch = "+5%";
  }
  try {
    const audioBuffer = await runEdgeTTS(chunk, {
      voice: edgeVoice,
      rate: rate,
      pitch: pitch
    });
    if (audioBuffer && audioBuffer.length > 0) {
      return audioBuffer.toString("base64");
    }
    throw new Error("Edge TTS returned empty response.");
  } catch (err: any) {
    if (err.message.includes("403")) {
      throw new Error("EDGE_TTS_UNAVAILABLE");
    }
    throw new Error(`Edge TTS API error: ${err.message || err}`);
  }
}

const VOICE_MAP: Record<string, string> = {
  alloy: "Aoede",
  echo: "Charon",
  fable: "Fenrir",
  onyx: "Kore",
  nova: "Leda",
  shimmer: "Orus",
};

async function callGeminiTTSForChunk(chunk: string, voice: string, tone: string, emotion?: string): Promise<string> {
  let voiceName = "Kore";
  let systemInstructionText = "";
  if (VOICE_MAP[voice]) {
    voiceName = VOICE_MAP[voice];
    systemInstructionText = `ROLE & STYLE: You are a professional voice talent giving a preview of your voice capabilities...`;
  } else if (voice === "vi-HN" || voice === "vi") {
    voiceName = "Kore";
    systemInstructionText = `ROLE & STYLE: Bạn là một phát thanh viên truyền hình và đài tiếng nói quốc gia kỳ cựu nói giọng Bắc (Hà Nội)...`;
  } else if (voice === "vi-HCM") {
    voiceName = "Zephyr";
    systemInstructionText = `ROLE & STYLE: Bạn là một phát thanh viên truyền hình miền Nam cực kỳ duyên dáng và chuyên nghiệp...`;
  } else if (voice === "en-UK" || voice === "Puck") {
    voiceName = "Puck";
    systemInstructionText = `ROLE & STYLE: You are a premium, highly professional British radio presenter and news anchor...`;
  } else {
    voiceName = "Zephyr";
    systemInstructionText = `ROLE & STYLE: You are an elite, highly professional American podcast host and premium news anchor...`;
  }
  if (emotion) {
    const isViLang = voice === "vi-HN" || voice === "vi-HCM" || voice === "vi";
    if (emotion === "cheerful") {
      systemInstructionText += isViLang ? `\nEMOTION/STYLE: Hãy thể hiện phong cách VUI TƯƠI...` : `\nEMOTION/STYLE: Express a CHEERFUL vibe...`;
    } else if (emotion === "professional") {
      systemInstructionText += isViLang ? `\nEMOTION/STYLE: Hãy thể hiện phong cách CHUYÊN NGHIỆP...` : `\nEMOTION/STYLE: Express a PROFESSIONAL vibe...`;
    }
  }

  const response: any = await callGeminiWithRotation((ai) => 
    ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: chunk }] }],
      config: {
        responseModalities: ["AUDIO"],
        temperature: 0.3,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } }
        }
      }
    })
  );
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No inline audio data found in TTS model response.");
  return base64Audio;
}

async function callGoogleTranslateTTSForChunk(chunk: string, voice: string): Promise<string> {
  const lang = voice.split("-")[0];
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${lang}&client=tw-ob`;
  const res = await fetchWithTimeout(url, {}, 6000);
  if (!res.ok) throw new Error("Google Translate TTS failed");
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

async function synthesizeSingleChunk(chunk: string, preferredVoice: string, tone: string, emotion?: string, preSegmentedLang?: "vi" | "en"): Promise<Buffer> {
  const lang = preSegmentedLang || detectLanguage(chunk);
  let voiceToUse = preferredVoice;
  if (lang === "vi") {
    if (!preferredVoice?.startsWith("vi")) {
      voiceToUse = (preferredVoice === "Puck" || preferredVoice === "Charon" || preferredVoice === "Fenrir" || preferredVoice === "en-UK") ? "vi-HCM" : "vi-HN";
    }
  } else {
    if (preferredVoice?.startsWith("vi")) {
      voiceToUse = (preferredVoice === "vi-HCM") ? "en-UK" : "en-US";
    }
  }
  const now = Date.now();
  let enginesToTry: Array<{ name: string; fn: () => Promise<string> }> = [];
  if (lang === "vi") {
    enginesToTry = [
      { name: "edge", fn: async () => await callEdgeTTSForChunk(chunk, voiceToUse, tone === "fast" ? "+20%" : tone === "slow" ? "-20%" : "0%") },
      { name: "gemini", fn: async () => { if (now < globalGeminiTtsDisabledUntil) throw new Error("Gemini disabled"); return await callGeminiTTSForChunk(chunk, voiceToUse, tone, emotion); } },
      { name: "translate", fn: async () => await callGoogleTranslateTTSForChunk(chunk, voiceToUse) }
    ];
  } else {
    enginesToTry = [
      { name: "gemini", fn: async () => { if (now < globalGeminiTtsDisabledUntil) throw new Error("Gemini disabled"); return await callGeminiTTSForChunk(chunk, voiceToUse, tone, emotion); } },
      { name: "edge", fn: async () => await callEdgeTTSForChunk(chunk, voiceToUse, tone === "fast" ? "+20%" : tone === "slow" ? "-20%" : "0%") },
      { name: "translate", fn: async () => await callGoogleTranslateTTSForChunk(chunk, voiceToUse) }
    ];
  }
  let base64Audio = "";
  let success = false;
  for (const engine of enginesToTry) {
    try {
      base64Audio = await withTimeout(engine.fn(), engine.name === "gemini" ? 20000 : 5000);
      if (base64Audio) { success = true; break; }
    } catch (err: any) {
      if (engine.name === "gemini") {
        const errMsg = (err.message || "").toUpperCase();
        if (!errMsg.includes("400") && !errMsg.includes("INVALID_ARGUMENT") && !errMsg.includes("API_KEY_INVALID")) {
          globalGeminiTtsDisabledUntil = Date.now() + 10 * 1000;
        }
      }
    }
  }
  if (!success || !base64Audio) return Buffer.alloc(48000, 0);
  return Buffer.from(base64Audio, "base64");
}

// ============================================================
// ROUTES
// ============================================================

router.get("/tts/cache-status", (req, res) => {
  if (!ttsCacheEnabled) return res.json({ enabled: false, message: "Cache is disabled." });
  try {
    const files = fs.readdirSync(TTS_CACHE_DIR);
    let totalSize = 0;
    const fileDetails = files.map(f => {
      const stats = fs.statSync(path.join(TTS_CACHE_DIR, f));
      totalSize += stats.size;
      return { name: f, sizeKB: (stats.size / 1024).toFixed(1), ageSeconds: ((Date.now() - stats.mtimeMs) / 1000).toFixed(0) };
    });
    res.json({ enabled: true, fileCount: files.length, totalSizeMB: (totalSize / 1024 / 1024).toFixed(2), files: fileDetails });
  } catch (err: any) { res.json({ enabled: false, error: err.message }); }
});

router.post("/tts/clear-cache", (req, res) => {
  const count = clearTtsCache();
  res.json({ success: true, cleared: count });
});

router.post("/tts", async (req, res): Promise<any> => {
  const { text, voice, tone, emotion, languageMode } = req.body;
  const isVi = voice?.startsWith("vi") || false;
  try {
    if (!text || text.trim() === "") return res.status(400).json({ error: "No text provided." });
    const voiceToUse = voice || "en-US";
    const toneToUse = tone || "conversational";
    const emotionToUse = emotion || "cheerful";
    const cacheKey = getTtsCacheKey(text, voiceToUse, toneToUse, emotionToUse);
    const cachedAudio = getCachedTtsFile(cacheKey);
    if (cachedAudio) return res.json({ base64Audio: cachedAudio.toString("base64"), engine: "cache", chunksCount: 1, fromCache: true, cacheKey });
    await loadBroadcastSpeechEngine();
    let engineeredText = text;
    if (BroadcastSpeechEngine && typeof BroadcastSpeechEngine.process === 'function') {
      try { engineeredText = await callGeminiWithRotation(async (ai) => await BroadcastSpeechEngine.process(text, voiceToUse, toneToUse, ai)); } catch (aiErr) {
        try { engineeredText = await BroadcastSpeechEngine.process(text, voiceToUse, toneToUse); } catch (e) {}
      }
    }
    const mode = languageMode || (voice?.startsWith("vi") ? "VN_ONLY" : "BILINGUAL");
    const segmentedBlocks = segmentTextByLanguage(engineeredText, mode);
    const chunks: { text: string; lang: "vi" | "en" }[] = [];
    for (const block of segmentedBlocks) {
      const normalizedText = normalizeTextForLanguage(block.text, block.lang);
      const subChunks = chunkTextForTTS(normalizedText, 250);
      for (const sub of subChunks) chunks.push({ text: sub, lang: block.lang });
    }
    if (chunks.length === 0) return res.status(400).json({ error: "No valid chunks." });
    const chunkPromises = chunks.map(async (item) => {
      try { return await synthesizeSingleChunk(item.text, voiceToUse, toneToUse, emotionToUse, item.lang); } catch (e) { return Buffer.alloc(0); }
    });
    const audioBuffers = await Promise.all(chunkPromises);
    const validBuffers = audioBuffers.filter(buf => buf && buf.length > 0);
    if (validBuffers.length === 0) throw new Error("Synthesis failed.");
    const mergedBuffer = Buffer.concat(validBuffers);
    setTtsCacheFile(cacheKey, mergedBuffer);
    const base64Chunks = validBuffers.map(buf => buf.toString("base64"));
    return res.json({ base64Audio: base64Chunks[0] || "", audioChunks: base64Chunks, engine: "hybrid-smart-tts", chunksCount: base64Chunks.length });
  } catch (error: any) {
    console.error("[TTS Route] Error:", error);
    return res.status(500).json({ error: parseGeminiError(error, isVi, true) });
  }
});

function wrapAsWavIfRawPcm(buffer: Buffer): Buffer {
  if (buffer.length < 4) return buffer;
  const isWav = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46; // RIFF
  const isMp3 = (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) || (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0); // ID3 or Sync Frame
  if (isWav || isMp3) {
    return buffer;
  }
  return encodeWavHeaderNode(buffer, 24000);
}

router.post("/test-tts", async (req, res) => {
  const { text, voice, tone } = req.body;
  try {
    const buffer = await synthesizeSingleChunk(text || "Hello test", voice || "en-US", tone || "normal");
    const wavBuffer = wrapAsWavIfRawPcm(buffer);
    res.json({ success: true, size: wavBuffer.length, base64Audio: wavBuffer.toString("base64") });
  } catch (err: any) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/music-preview/:type", (req, res) => {
  const { type } = req.params;
  const possiblePaths = [
    path.join(process.cwd(), "public", `${type}.mp3`),
    path.join(process.cwd(), "public", `${type}.wav`),
    path.join(process.cwd(), "public", "music", `${type}.mp3`),
    path.join(process.cwd(), "public", "music", `${type}.wav`),
    path.join(process.cwd(), "assets", `${type}.mp3`),
    path.join(process.cwd(), "assets", `${type}.wav`),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return res.sendFile(p);
    }
  }

  res.status(404).json({ success: false, error: "Music preview file not found", message: "Sắp ra mắt" });
});


router.get("/voices", (req, res) => {
  res.json([
    { id: "vi-HN", name: "Giọng Miền Bắc (Nữ - Hoài My)", lang: "vi" },
    { id: "vi-HCM", name: "Giọng Miền Nam (Nam - Nam Minh)", lang: "vi" },
    { id: "en-US", name: "English (Jenny - US)", lang: "en" },
    { id: "en-UK", name: "English (Sonia - UK)", lang: "en" }
  ]);
});

router.post("/tts/preview", async (req, res): Promise<any> => {
  const { voice, lang } = req.body;
  
  if (!voice) {
    return res.status(400).json({ success: false, error: "Missing voice parameter" });
  }

  const text = lang === "vi" 
    ? "Đây là giọng đọc thử nghiệm cho bản tin của bạn." 
    : "This is a preview of your news briefing voice.";

  try {
    const rawBuffer = await synthesizeSingleChunk(text, voice, "normal", "cheerful", lang);
    const wavBuffer = wrapAsWavIfRawPcm(rawBuffer);
    return res.json({ success: true, audioBase64: wavBuffer.toString("base64") });
  } catch (err: any) {
    console.error("[TTS Preview] Error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to generate preview" });
  }
});

router.post("/clear-tts-cache", async (req, res): Promise<any> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ success: false, error: "Supabase client not configured" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, error: "No authorization header" });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }

    // Auth OK! Clear tts_cache folder files ending with .mp3
    if (fs.existsSync(TTS_CACHE_DIR)) {
      const files = fs.readdirSync(TTS_CACHE_DIR);
      let deletedCount = 0;
      for (const file of files) {
        if (file.endsWith(".mp3") || file.endsWith(".wav")) {
          try {
            fs.unlinkSync(path.join(TTS_CACHE_DIR, file));
            deletedCount++;
          } catch (e: any) {
            console.warn(`[TTS Cache] Failed to delete file ${file}:`, e.message);
          }
        }
      }
      console.log(`[TTS Cache] Cleaned up ${deletedCount} cache files via user-initiated purge.`);
      return res.json({ success: true, message: `Successfully deleted ${deletedCount} cache files` });
    } else {
      return res.json({ success: true, message: "Cache directory does not exist, nothing to clear" });
    }
  } catch (err: any) {
    console.error("[TTS Cache] Clear cache error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to clear TTS cache" });
  }
});

export default router;

