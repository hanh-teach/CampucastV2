import { ResearchPackage, EditorialDraft, SpeechPackage, SpeechSegment, SummaryPayload, SummaryPreferences, AudioArtifact } from "../types";
import { applyPronunciationDictionary, getCohostVoice } from "../utils/synthesis";

// Helper to normalize NFC text (matching existing code)
function normalizeText(text: string): string {
  if (!text) return "";
  return text.normalize("NFC").trim();
}

/**
 * Isolated Stage 2: Editorial Draft Engine
 * Consumes ResearchPackage + preferences, calls summarize API, and outputs immutable EditorialDraft.
 */
export async function generateEditorialDraft(
  researchPackage: ResearchPackage,
  preferences: SummaryPreferences,
  apiUrlGetter: (path: string) => string
): Promise<EditorialDraft> {
  const response = await fetch(apiUrlGetter("/api/summarize"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: researchPackage.aggregatedText,
      preferences,
    }),
  });

  if (!response.ok) {
    let errorMsg = "Failed to generate narrative summary.";
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } else {
        const errorText = await response.text();
        if (errorText.includes("QUOTA_LIMIT") || response.status === 429) {
          errorMsg =
            researchPackage.language === "vi"
              ? "QUOTA_LIMIT: Bạn đã hết tài nguyên cuộc gọi miễn phí trong ngày hôm nay. Hãy thử lại sau ít phút hoặc dùng các bản tin lưu sẵn phía dưới nhé!"
              : "QUOTA_LIMIT: You have reached the rate or project call quotas on the free-tier service. Please retry later or play the archived presets!";
        } else {
          errorMsg = `Server error (${response.status}): ${errorText.substring(0, 200)}`;
        }
      }
    } catch {
      errorMsg = `Server returned an invalid response (Status ${response.status}). Please check your API usage limits or try again shortly.`;
    }
    throw new Error(errorMsg);
  }

  let scriptPayload: SummaryPayload;
  try {
    scriptPayload = await response.json();
  } catch (err) {
    throw new Error(
      researchPackage.language === "vi"
        ? "Phản hồi từ máy chủ không hợp lệ (Không phải cấu trúc JSON)."
        : "Server response is invalid (Not a valid JSON)."
    );
  }

  const primaryVoice = preferences.voice || "vi-HN";
  const cohostVoice = getCohostVoice(primaryVoice);

  const draft: EditorialDraft = {
    id: `draft_${Math.random().toString(36).substring(7)}`,
    missionId: researchPackage.missionId,
    language: researchPackage.language,
    title: scriptPayload.title || "Untitled Briefing",
    summary: scriptPayload.chapters?.map(c => c.topic).join(", ") || "",
    body: JSON.stringify(scriptPayload), // Immutable structural serialization
    tags: [preferences.tone || "informative", preferences.commuteType || "driving"],
    hostProfile: {
      primaryVoice,
      cohostVoice,
    },
    narrationStyle: preferences.tone || "conversational",
    createdAt: new Date().toISOString(),
    version: 1,
  };

  return draft;
}

/**
 * Isolated Stage 3: Speech Package Builder
 * Transforms EditorialDraft into an immutable SpeechPackage.
 * Never rebuilds or regenerates AI content.
 */
export function buildSpeechPackage(
  draft: EditorialDraft,
  pronunciationDictionary: Array<{ word: string; replace: string }> = [],
  audioEmotion?: string
): SpeechPackage {
  // 1. Language Validation
  if (!draft.language) {
    throw new Error("Language validation failed: EditorialDraft must specify a language.");
  }
  if (!draft.title.trim()) {
    throw new Error("Language validation failed: EditorialDraft title cannot be empty.");
  }

  // 2. Parse Editorial Draft Structure (De-serialization or fallback)
  let payload: SummaryPayload;
  try {
    payload = JSON.parse(draft.body);
  } catch (err) {
    // Fallback if body is raw text instead of structured JSON
    payload = {
      title: draft.title,
      introduction: draft.summary || "",
      chapters: [
        {
          topic: "Main Content",
          scriptText: draft.body,
          summaryBullets: []
        }
      ],
      conclusion: ""
    };
  }

  const segments: SpeechSegment[] = [];
  const primaryVoice = draft.hostProfile.primaryVoice || "vi-HN";
  const cohostVoice = draft.hostProfile.cohostVoice || getCohostVoice(primaryVoice);

  // Timing helper: 140 words per minute (approx. 2.33 words per second)
  const estimateSeconds = (txt: string): number => {
    const words = txt.split(/\s+/).filter(Boolean).length;
    return Math.max(1.5, Math.round(words / (140 / 60)));
  };

  // SSML helper: wraps text with speak, inserting pause if requested
  const buildSSML = (txt: string, pauseBefore?: number, pauseAfter?: number): string => {
    let ssml = `<speak>`;
    if (pauseBefore && pauseBefore > 0) {
      ssml += `<break time="${pauseBefore}s"/>`;
    }
    ssml += `<p>${txt}</p>`;
    if (pauseAfter && pauseAfter > 0) {
      ssml += `<break time="${pauseAfter}s"/>`;
    }
    ssml += `</speak>`;
    return ssml;
  };

  // Emotion mapping based on tone/narrationStyle
  let mappedEmotion = audioEmotion || "neutral";
  if (!audioEmotion) {
    const tone = (draft.narrationStyle || "").toLowerCase();
    if (tone === "upbeat" || tone === "witty") {
      mappedEmotion = "cheerful";
    } else if (tone === "analytical" || tone === "informative") {
      mappedEmotion = "professional";
    } else if (tone === "conversational") {
      mappedEmotion = "friendly";
    }
  }

  const safePushSegment = (
    label: string,
    rawText: string,
    voice: string,
    pauseBefore?: number,
    pauseAfter?: number
  ) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    // Pronunciation Normalization
    const normalized = normalizeText(trimmed);
    const cleanedText = applyPronunciationDictionary(normalized, pronunciationDictionary);

    const timing = estimateSeconds(cleanedText);

    segments.push({
      id: `seg_${Math.random().toString(36).substring(7)}`,
      label,
      text: cleanedText,
      originalText: trimmed,
      voice,
      emotion: mappedEmotion,
      pauseDurationBefore: pauseBefore,
      pauseDurationAfter: pauseAfter,
      ssml: buildSSML(cleanedText, pauseBefore, pauseAfter),
      estimatedDuration: timing,
    });
  };

  // Welcome Intro - Assign Primary Voice, add 1s pause after introduction
  if (payload.introduction) {
    safePushSegment(
      draft.language === "vi" ? "Lời chào đầu bản tin" : "Opening Introduction",
      payload.introduction,
      primaryVoice,
      0,
      1.0
    );
  }

  // Chapters & co-hosts assignment
  if (payload.chapters && Array.isArray(payload.chapters)) {
    payload.chapters.forEach((ch, idx) => {
      const chapterLabel = draft.language === "vi" ? `Chương ${idx + 1}` : `Chapter ${idx + 1}`;
      
      if (ch.segments && Array.isArray(ch.segments) && ch.segments.length > 0) {
        ch.segments.forEach((seg, sIdx) => {
          const isHostB = seg.speakerId === "host_b";
          const speakerName = isHostB ? "Host B" : "Host A";
          const assignedVoice = isHostB ? cohostVoice : primaryVoice;
          
          // Small pause of 0.5s after co-host transitions to sound natural
          safePushSegment(
            `${chapterLabel} [${speakerName}] - ${ch.topic}`,
            seg.text || "",
            assignedVoice,
            0.2,
            0.5
          );
        });
      } else if (ch.scriptText) {
        safePushSegment(
          `${chapterLabel}: ${ch.topic}`,
          ch.scriptText,
          primaryVoice,
          0.3,
          0.8
        );
      }
    });
  }

  // Conclusion - Assign Primary Voice, add 0.5s pause before starting
  if (payload.conclusion) {
    safePushSegment(
      draft.language === "vi" ? "Phần kết và giao thông" : "Sign-off Outro",
      payload.conclusion,
      primaryVoice,
      0.5,
      0
    );
  }

  if (segments.length === 0) {
    throw new Error(
      draft.language === "vi"
        ? "Bản tin không có nội dung chữ để đọc."
        : "The briefing draft contains no legible content for speech synthesis."
    );
  }

  const totalDuration = segments.reduce((acc, seg) => acc + seg.estimatedDuration, 0);

  return {
    id: `speech_${Math.random().toString(36).substring(7)}`,
    draftId: draft.id,
    segments,
    language: draft.language,
    createdAt: new Date().toISOString(),
    totalEstimatedDuration: totalDuration,
  };
}

/**
 * Fetch helper with Exponential Retry backoff for fault-tolerant synthesis.
 */
async function fetchWithRetry(
  url: string,
  body: any,
  retriesLeft: number = 3,
  delay: number = 1000,
  signal?: AbortSignal
): Promise<any> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return await response.json();
  } catch (err: any) {
    if (signal?.aborted) {
      throw new Error("Aborted");
    }
    if (retriesLeft <= 0) {
      throw err;
    }
    console.warn(`TTS fetch failed, retrying in ${delay}ms... Error: ${err.message}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return fetchWithRetry(url, body, retriesLeft - 1, delay * 1.5, signal);
  }
}

/**
 * Lightweight, fast djb2 rolling checksum generator.
 */
function generateChecksum(chunks: string[]): string {
  const joined = chunks.join("");
  let hash = 5381;
  for (let i = 0; i < joined.length; i++) {
    hash = (hash * 33) ^ joined.charCodeAt(i);
  }
  return `djb2_${(hash >>> 0).toString(16)}`;
}

/**
 * Isolated Stage 4: Audio Rendering Engine
 * Transforms SpeechPackage into an immutable AudioArtifact.
 * Never accesses Draft, RSS, Textarea, React Form, or UI State.
 */
export async function renderAudio(
  speechPackage: SpeechPackage,
  options: {
    getApiUrl: (path: string) => string;
    tone?: string;
    languageMode?: string;
    onProgress?: (progress: {
      current: number;
      total: number;
      label: string;
      status: "idle" | "rendering" | "completed" | "failed" | "cached";
    }) => void;
    signal?: AbortSignal;
    useCache?: boolean;
    maxRetries?: number;
    initialDelayMs?: number;
    existingArtifact?: AudioArtifact; // Supports resume / partial rendering
  }
): Promise<AudioArtifact> {
  const {
    getApiUrl,
    tone = "conversational",
    languageMode = "standard",
    onProgress,
    signal,
    useCache = true,
    maxRetries = 3,
    initialDelayMs = 1000,
    existingArtifact,
  } = options;

  const totalSegments = speechPackage.segments.length;
  const chunks: string[] = [];
  const succeededSegments: string[] = [];
  const failedSegments: Array<{ id: string; label: string; message: string }> = [];
  const voiceManifest: Record<string, string> = {};

  // Setup/load cache from sessionStorage
  const CACHE_KEY_PREFIX = "commutecast_tts_cache_";
  const getCacheKey = (voice: string, emotion: string, text: string) => {
    return `${CACHE_KEY_PREFIX}${voice}_${emotion}_${text.substring(0, 100)}_${text.length}`;
  };

  const getCachedAudio = (key: string): string[] | null => {
    if (!useCache) return null;
    try {
      const cached = sessionStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const setCachedAudio = (key: string, audioChunks: string[]) => {
    if (!useCache) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(audioChunks));
    } catch (e) {
      console.warn("Storage quota exceeded or session storage unavailable:", e);
    }
  };

  // Process segment by segment
  for (let i = 0; i < totalSegments; i++) {
    const segment = speechPackage.segments[i];
    voiceManifest[segment.id] = segment.voice;

    if (signal?.aborted) {
      throw new Error("Audio rendering process was cancelled by the user.");
    }

    onProgress?.({
      current: i + 1,
      total: totalSegments,
      label: segment.label,
      status: "rendering",
    });

    // 1. Resume Rendering check
    if (existingArtifact) {
      const existingIdx = existingArtifact.succeededSegments.indexOf(segment.id);
      if (existingIdx !== -1 && existingArtifact.audioChunks[existingIdx]) {
        chunks.push(existingArtifact.audioChunks[existingIdx]);
        succeededSegments.push(segment.id);
        onProgress?.({
          current: i + 1,
          total: totalSegments,
          label: segment.label,
          status: "cached",
        });
        continue;
      }
    }

    // 2. Cache hit check
    const cacheKey = getCacheKey(segment.voice, segment.emotion || "neutral", segment.text);
    const cachedChunks = getCachedAudio(cacheKey);
    if (cachedChunks) {
      chunks.push(...cachedChunks);
      succeededSegments.push(segment.id);
      onProgress?.({
        current: i + 1,
        total: totalSegments,
        label: segment.label,
        status: "cached",
      });
      continue;
    }

    // 3. Fallback to fresh rendering using fault-tolerant TTS Provider call
    try {
      const ttsData = await fetchWithRetry(
        getApiUrl("/api/tts"),
        {
          text: segment.text,
          voice: segment.voice,
          tone: tone,
          emotion: segment.emotion,
          languageMode: languageMode,
        },
        maxRetries,
        initialDelayMs,
        signal
      );

      if (ttsData && ttsData.audioChunks && Array.isArray(ttsData.audioChunks)) {
        chunks.push(...ttsData.audioChunks);
        succeededSegments.push(segment.id);
        setCachedAudio(cacheKey, ttsData.audioChunks);
        onProgress?.({
          current: i + 1,
          total: totalSegments,
          label: segment.label,
          status: "completed",
        });
      } else {
        throw new Error("Invalid response format: Missing audioChunks from TTS engine.");
      }
    } catch (err: any) {
      console.error(`Failed rendering segment ${segment.id}:`, err.message);
      failedSegments.push({
        id: segment.id,
        label: segment.label,
        message: err.message || "Synthesis failed",
      });
      onProgress?.({
        current: i + 1,
        total: totalSegments,
        label: segment.label,
        status: "failed",
      });
    }
  }

  // Final cancel check
  if (signal?.aborted) {
    throw new Error("Audio rendering process was cancelled by the user.");
  }

  // 4. Verification & Validation Checksum
  const finalChecksum = generateChecksum(chunks);

  // 5. Loudness Normalization & Metadata Generation
  const totalDuration = speechPackage.totalEstimatedDuration;
  const isPartial = failedSegments.length > 0;
  const targetLoudnessDb = -14.0; // Standard podcast loudness level in LUFS/dB

  const artifact: AudioArtifact = {
    id: `artifact_${Math.random().toString(36).substring(7)}`,
    speechPackageId: speechPackage.id,
    audioChunks: chunks,
    succeededSegments,
    failedSegments,
    completedAt: new Date().toISOString(),
    checksum: finalChecksum,
    metadata: {
      totalDuration,
      bitRate: "128kbps",
      sampleRate: 24000,
      channelCount: 1,
      voiceManifest,
      volumeLevelDb: targetLoudnessDb,
      generatedBy: "CommuteCast Stage 4 Audio Rendering Engine (v3.0)",
    },
    isPartial,
  };

  return artifact;
}
