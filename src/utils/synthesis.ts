export interface PronunciationEntry {
  word: string;
  replace: string;
}

/**
 * Returns the complementary co-host voice for a given primary voice.
 * This guarantees a balanced dual-anchor dialogue (Male & Female or Northern & Southern accents).
 */
export function getCohostVoice(primaryVoice: string): string {
  const voice = (primaryVoice || "").toLowerCase();
  
  // English / Multi-Speaker prebuilt voices (Symmetric Pairs)
  const englishPairs: Record<string, string> = {
    "charles": "seraphina",
    "seraphina": "charles",
    "dante": "elara",
    "elara": "dante",
    "puck": "charon",
    "charon": "puck",
    "kore": "zephyr",
    "zephyr": "kore",
    "fenrir": "fenrir"
  };
  
  if (englishPairs[voice]) return englishPairs[voice];
  
  // Vietnamese Northern vs Southern voices
  if (voice.includes("hn") || voice.includes("north") || (voice.includes("female") && !voice.includes("hcm"))) {
    return "vi-hcm-male";
  }
  if (voice.includes("hcm") || voice.includes("south")) {
    return "vi-hn-female";
  }

  // Fallbacks for standard Vietnamese models
  if (voice === "vi-hn-female") return "vi-hcm-male";
  if (voice === "vi-hn-male") return "vi-hcm-female";
  if (voice === "vi-hcm-female") return "vi-hn-male";
  if (voice === "vi-hcm-male") return "vi-hn-female";
  
  return primaryVoice; // Default fallback
}

/**
 * Prepares the narrative audio segment timeline, splitting by co-host turns if segments are present.
 */
export function prepareSynthesisTimeline(
  scriptPayload: any,
  primaryVoice: string,
  uiLanguage: "vi" | "en"
): Array<{ label: string; text: string; voice: string }> {
  const timeline: Array<{ label: string; text: string; voice: string }> = [];
  const cohostVoice = getCohostVoice(primaryVoice);

  const safePush = (label: string, text: string, voice: string) => {
    if (text.trim().length > 0) {
      timeline.push({ label, text, voice });
    } else {
      console.warn(`[Synthesis] Skipped empty segment: ${label}`);
    }
  };

  // 1. Welcome Greeting / Introduction
  safePush(
    uiLanguage === "vi" ? "Lời chào buổi sáng" : "Welcome Greeting",
    scriptPayload.introduction || "",
    primaryVoice
  );

  // 2. Chapters & Segments
  if (scriptPayload.chapters && Array.isArray(scriptPayload.chapters)) {
    scriptPayload.chapters.forEach((ch: any, idx: number) => {
      const chapterLabel = uiLanguage === "vi" ? `Chương ${idx + 1}` : `Chapter ${idx + 1}`;
      
      if (ch.segments && Array.isArray(ch.segments) && ch.segments.length > 0) {
        // Multi-host co-host segments
        ch.segments.forEach((seg: any, sIdx: number) => {
          const isHostB = seg.speakerId === "host_b";
          const isHostA = seg.speakerId === "host_a";
          
          if (!isHostA && !isHostB) {
            console.warn(`[Synthesis Warning] Unknown speakerId: ${seg.speakerId}. Defaulting to primary voice.`);
          }
          
          const speakerName = isHostB ? "Host B" : "Host A";
          const assignedVoice = isHostB ? cohostVoice : primaryVoice;
          
          safePush(
            `${chapterLabel} [${speakerName}] - ${ch.topic}`,
            seg.text || "",
            assignedVoice
          );
        });
      } else {
        // Single speaker fallback
        safePush(
          `${chapterLabel}: ${ch.topic}`,
          ch.scriptText || "",
          primaryVoice
        );
      }
    });
  }

  // 3. Sign-off Outro / Conclusion
  safePush(
    uiLanguage === "vi" ? "Phần kết và giao thông" : "Sign-off Outro",
    scriptPayload.conclusion || "",
    primaryVoice
  );

  if (timeline.length === 0) {
    throw new Error(
      uiLanguage === "vi"
        ? "Nội dung kịch bản trống hoàn toàn, không thể tổng hợp giọng nói."
        : "Script content is completely empty, cannot synthesize audio."
    );
  }

  return timeline;
}

/**
 * Applies the pronunciation replacements defined in the user's custom dictionary.
 */
export function applyPronunciationDictionary(
  text: string,
  dictionary: PronunciationEntry[]
): string {
  if (!text || !dictionary || dictionary.length === 0) return text;
  
  let processedText = text;
  // Sort dictionary by word length descending so longer words match first
  const sortedDict = [...dictionary].sort((a, b) => b.word.length - a.word.length);
  
  for (const entry of sortedDict) {
    if (!entry.word.trim()) continue;
    try {
      const escaped = entry.word.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      processedText = processedText.replace(regex, entry.replace);
      // Double replace for non-boundary matches (e.g. abbreviations)
      processedText = processedText.split(entry.word).join(entry.replace);
    } catch (e) {
      console.warn("Error replacing custom pronunciation word", entry.word, e);
    }
  }
  
  return processedText;
}
