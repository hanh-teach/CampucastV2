export type Action = 
  | { type: "SWITCH_VIEW"; view: "youtube" | "briefing" }
  | { type: "SEARCH"; query: string }
  | { type: "PLAY" } | { type: "PAUSE" }
  | { type: "NEXT" } | { type: "PREVIOUS" }
  | { type: "FORWARD"; seconds: number } | { type: "REWIND"; seconds: number }
  | { type: "VOLUME_UP" } | { type: "VOLUME_DOWN" } | { type: "MUTE" } | { type: "UNMUTE" }
  | { type: "TRAFFIC_ALERT" }
  | { type: "ASSISTANT"; prompt?: string }
  | { type: "EXIT" }
  | { type: "UNRECOGNIZED"; raw: string };

/**
 * Normalizes string by lowering case, replacing punctuation with spaces,
 * and stripping Vietnamese diacritics/accents to make phonetic comparison extremely resilient.
 */
export function cleanString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritics/tone marks
    .replace(/[đĐ]/g, "d")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, " ") // Replace punctuation with space
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

/**
 * Computes Levenshtein Distance for fuzzy matching noisy speech transcriptions.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Checks if target string fuzzy matches clean input text within acceptable max edit distance.
 */
function fuzzyMatch(input: string, target: string, maxDistance = 2): boolean {
  if (input === target || input.includes(target)) return true;
  const words = input.split(" ");
  const targetWords = target.split(" ");
  if (targetWords.length === 1) {
    return words.some(w => Math.abs(w.length - target.length) <= maxDistance && levenshteinDistance(w, target) <= maxDistance);
  }
  return levenshteinDistance(input, target) <= maxDistance;
}

/**
 * Parses a voice command text into a structured Action.
 */
export function parseVoiceCommand(text: string, lang: "vi" | "en"): Action {
  const normalizedText = text.toLowerCase().trim();

  if (!normalizedText) {
    return { type: "UNRECOGNIZED", raw: text };
  }

  const cleaned = cleanString(text);

  // 1. EXIT (High Priority)
  const exitPhrases = [
    "thoat", "dong", "exit", "close", "quit", 
    "ve nha", "nghi lai", "tat hud", "xong roi", 
    "trang chu", "quay ve trang chu", "quay lai trang chu",
    "ve", "quay ve", "quay lai", "tat che do lai xe", "dong hud"
  ];
  if (exitPhrases.some(p => cleaned === p || cleaned.includes(p) || fuzzyMatch(cleaned, p, 1))) {
    return { type: "EXIT" };
  }

  // 2. ASSISTANT / AI HOST
  const assistantPhrases = [
    "tro ly", "hey tro ly", "goi tro ly", "hoi tro ly", "tro ly oi",
    "hey ai", "hoi ai", "gemini", "assistant", "cho hoi", "he tro ly"
  ];
  if (assistantPhrases.some(p => cleaned.includes(p) || fuzzyMatch(cleaned, p, 1))) {
    const prompt = cleaned.replace(/tro ly|hey tro ly|goi tro ly|hoi tro ly|tro ly oi|hey ai|hoi ai|gemini|assistant/g, "").trim();
    return { type: "ASSISTANT", prompt: prompt || undefined };
  }

  // 3. TRAFFIC ALERT / EMERGENCY
  const trafficPhrases = [
    "giao thong", "canh bao", "tac duong", "ket xe", "traffic", "tinh trang duong", "bao tac duong", "canh bao giao thong"
  ];
  if (trafficPhrases.some(p => cleaned.includes(p) || fuzzyMatch(cleaned, p, 2))) {
    return { type: "TRAFFIC_ALERT" };
  }

  // 4. VOLUME CONTROL
  const volumeUpPhrases = ["to len", "tang am", "cho to", "lon hon", "volume up", "bat to", "tang tieng", "to hon", "tang am luong"];
  if (volumeUpPhrases.some(p => cleaned.includes(p) || fuzzyMatch(cleaned, p, 2))) {
    return { type: "VOLUME_UP" };
  }

  const volumeDownPhrases = ["nho xuong", "giam am", "cho nho", "be hon", "volume down", "giam tieng", "nho hon", "giam am luong"];
  if (volumeDownPhrases.some(p => cleaned.includes(p) || fuzzyMatch(cleaned, p, 2))) {
    return { type: "VOLUME_DOWN" };
  }

  const mutePhrases = ["tat tieng", "im lang", "mute", "ngat am", "tat tieng di", "tat am"];
  if (mutePhrases.some(p => cleaned.includes(p) || fuzzyMatch(cleaned, p, 1))) {
    return { type: "MUTE" };
  }

  const unmutePhrases = ["bat tieng", "unmute", "mo am", "bat am", "mo tieng"];
  if (unmutePhrases.some(p => cleaned.includes(p) || fuzzyMatch(cleaned, p, 1))) {
    return { type: "UNMUTE" };
  }

  // 5. NEXT & PREVIOUS
  const nextPhrases = [
    "qua bai", "tiep theo", "bai khac", "next", "skip", 
    "bo qua", "toi luon", "bai moi", "ke tiep", "chuyen bai", "bai tiep", "nex bai", "bai sau"
  ];
  if (nextPhrases.some(p => cleaned.includes(p) || fuzzyMatch(cleaned, p, 2))) {
    return { type: "NEXT" };
  }

  const prevPhrases = [
    "bai truo", "bai truoc", "quay lai", "lui bai", "previous", "prev", "bai cu", "tro lai"
  ];
  if (prevPhrases.some(p => cleaned.includes(p) || fuzzyMatch(cleaned, p, 2))) {
    return { type: "PREVIOUS" };
  }

  // 6. FORWARD & REWIND
  const forwardPhrases = [
    "tua nhanh", "tua toi", "forward", "fast forward", 
    "nhich len", "toi chut", "tua di", "tua 15s", "tua len"
  ];
  if (forwardPhrases.some(p => cleaned.includes(p) || fuzzyMatch(cleaned, p, 2))) {
    return { type: "FORWARD", seconds: 15 };
  }

  const rewindPhrases = [
    "tua lai", "lui", "rewind", "back", 
    "lui lai", "hoi nay", "nghe lai", "tua lùi"
  ];
  if (rewindPhrases.some(p => cleaned.includes(p) || fuzzyMatch(cleaned, p, 2))) {
    return { type: "REWIND", seconds: 15 };
  }

  // 7. SWITCH_VIEW - BRIEFING (NEWS)
  const briefingPhrases = ["ban tin", "nghe tin", "briefing", "news", "tin tuc", "mo tin", "mo news"];
  const matchesBriefing = briefingPhrases.some(phrase => {
    if (cleaned === phrase) return true;
    const regex = new RegExp(`\\b(mo|vao|chuyen|sang|nghe)\\s+${phrase}\\b`, "i");
    return regex.test(cleaned) || fuzzyMatch(cleaned, phrase, 2);
  });
  if (matchesBriefing) {
    return { type: "SWITCH_VIEW", view: "briefing" };
  }

  // 8. SWITCH_VIEW - YOUTUBE
  const youtubePhrases = ["youtube", "entertainment", "giai tri", "xem youtube", "mo youtube", "chuyen giai tri"];
  const matchesYoutube = youtubePhrases.some(phrase => {
    if (cleaned === phrase) return true;
    const regex = new RegExp(`\\b(mo|vao|chuyen|sang|xem)\\s+${phrase}\\b`, "i");
    return regex.test(cleaned) || fuzzyMatch(cleaned, phrase, 2);
  });
  if (youtubePhrases.some(p => cleaned === p) || matchesYoutube) {
    return { type: "SWITCH_VIEW", view: "youtube" };
  }

  // 9. SEARCH (Supports rich Vietnamese & English music/video query prefixes)
  const searchPrefixes = [
    "tim kiem", "tim bai hat", "tim bai", "tim nhac", "tim video", "tim youtube", "search for",
    "mo bai hat", "mo bai", "mo nhac", "mo video", "mo youtube",
    "phat bai hat", "phat bai", "phat nhac", "phat video",
    "nghe bai hat", "nghe bai", "nghe nhac",
    "xem video", "xem youtube", "bat nhac", "bat bai", "search", "tim"
  ];
  for (const prefix of searchPrefixes) {
    const prefixCleaned = cleanString(prefix);
    if (cleaned.startsWith(prefixCleaned) || cleaned.includes(prefixCleaned + " ")) {
      const matchIndex = cleaned.indexOf(prefixCleaned);
      let rawQuery = text.substring(matchIndex + prefixCleaned.length).trim();
      // Clean up common leading prepositions like "bai", "nhac", "cau"
      rawQuery = rawQuery.replace(/^(bai|nhac|video|chu de|ve|hat)\s+/i, "").trim();
      if (rawQuery.length >= 2) {
        return { type: "SEARCH", query: rawQuery };
      }
    }
  }

  // 10. PLAY
  const playPhrases = [
    "phat", "chay", "tiep", "nghe", "mo", "bat", "play", "resume", "go", "continue",
    "doc", "doc tiep", "tiep di", "chay tiep", "phat di", "bat len", "bat nhac", "tiep tuc",
    "phac", "he phat", "hey play", "hay phat", "mo nhac", "mo ho", "mo gium"
  ];
  if (playPhrases.some(p => cleaned === p || cleaned.includes(p) || fuzzyMatch(cleaned, p, 1))) {
    return { type: "PLAY" };
  }

  // 11. PAUSE
  const pausePhrases = [
    "tam dung", "dung", "ngung", "tat", "thoi", "pause", "stop", "halt", "nghi", "im",
    "im lang", "dung lai", "dung gium", "rung", "tat di", "he dung", "hey stop", "hay dung", "dung lai đi"
  ];
  if (pausePhrases.some(p => cleaned === p || cleaned.includes(p) || fuzzyMatch(cleaned, p, 1))) {
    return { type: "PAUSE" };
  }

  return { type: "UNRECOGNIZED", raw: text };
}

