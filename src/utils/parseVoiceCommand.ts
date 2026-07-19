export type Action = 
  | { type: "SWITCH_VIEW"; view: "youtube" | "briefing" }
  | { type: "SEARCH"; query: string }
  | { type: "PLAY" } | { type: "PAUSE" }
  | { type: "NEXT" } | { type: "FORWARD"; seconds: number } | { type: "REWIND"; seconds: number }
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
    "ve", "quay ve", "quay lai"
  ];
  if (exitPhrases.some(p => cleaned === p || cleaned.includes(p))) {
    return { type: "EXIT" };
  }

  // 2. NEXT
  const nextPhrases = [
    "qua bai", "tiep theo", "bai khac", "next", "skip", 
    "bo qua", "toi luon", "bai moi", "ke tiep", "chuyen bai"
  ];
  if (nextPhrases.some(p => cleaned.includes(p))) {
    return { type: "NEXT" };
  }

  // 3. FORWARD
  const forwardPhrases = [
    "tua nhanh", "tua toi", "forward", "fast forward", 
    "nhich len", "toi chut", "tua di"
  ];
  if (forwardPhrases.some(p => cleaned.includes(p))) {
    return { type: "FORWARD", seconds: 15 };
  }

  // 4. REWIND
  const rewindPhrases = [
    "tua lai", "lui", "quay lai", "rewind", "back", 
    "lui lai", "hoi nay", "nghe lai"
  ];
  if (rewindPhrases.some(p => cleaned.includes(p))) {
    return { type: "REWIND", seconds: 15 };
  }

  // 5. SWITCH_VIEW - BRIEFING (NEWS)
  const briefingPhrases = ["ban tin", "nghe tin", "briefing", "news", "tin tuc", "mo tin", "mo news"];
  const matchesBriefing = briefingPhrases.some(phrase => {
    if (cleaned === phrase) return true;
    const regex = new RegExp(`\\b(mo|vao|chuyen|sang|nghe)\\s+${phrase}\\b`, "i");
    return regex.test(cleaned);
  });
  if (matchesBriefing) {
    return { type: "SWITCH_VIEW", view: "briefing" };
  }

  // 6. SWITCH_VIEW - YOUTUBE
  const youtubePhrases = ["youtube", "entertainment", "giai tri", "xem youtube", "mo youtube", "chuyen giai tri"];
  const matchesYoutube = youtubePhrases.some(phrase => {
    if (cleaned === phrase) return true;
    const regex = new RegExp(`\\b(mo|vao|chuyen|sang|xem)\\s+${phrase}\\b`, "i");
    return regex.test(cleaned);
  });
  if (youtubePhrases.some(p => cleaned === p) || matchesYoutube) {
    return { type: "SWITCH_VIEW", view: "youtube" };
  }

  // 7. SEARCH (Starts with check, must extract remaining part)
  const searchPrefixes = ["tim kiem", "search for", "mo bai", "tim bai", "tim", "search"];
  for (const prefix of searchPrefixes) {
    const prefixCleaned = cleanString(prefix);
    if (cleaned.startsWith(prefixCleaned)) {
      // Find the remaining search query in normalized text to preserve case
      const originalIndex = normalizedText.indexOf(prefix);
      let query = "";
      if (originalIndex !== -1) {
        query = normalizedText.substring(originalIndex + prefix.length).trim();
      } else {
        query = normalizedText.substring(prefixCleaned.length).trim();
      }
      if (query) {
        return { type: "SEARCH", query };
      } else {
        return { type: "UNRECOGNIZED", raw: text };
      }
    }
  }

  // 8. PLAY ("Hây, phát" / "Hey Play" with wide phonetic variants)
  const playStarters = ["hay", "hey", "he", "he_y", "ay", "oi", "cat", "ket", "nay", "hi", "alo", "o", "ơi"];
  const playActions = ["phat", "phac", "bat", "chay", "play", "tiep", "nghe", "mo", "resume", "go", "continue", "doc"];
  
  // Direct matches
  const playDirectPhrases = [
    "hay phat", "hey phat", "he phat", "hay phac", "hey phac", "he phac",
    "hey play", "hay play", "he play", "hay bat", "hey bat", "he bat", "hi play", "ay phat"
  ];
  
  const hasDirectPlay = playDirectPhrases.some(p => cleaned.includes(p));
  
  // Combo starter + action
  const hasComboPlay = playStarters.some(s => cleaned.startsWith(s + " ")) && 
                       playActions.some(a => cleaned.endsWith(" " + a) || cleaned.includes(" " + a));
                       
  // Solo matches
  const playPhrases = [
    "phat", "chay", "tiep", "nghe", "mo", "bat", "vao", 
    "play", "resume", "go", "continue", "doc", "doc tiep", 
    "tiep di", "mo gium", "mo ho", "chay tiep", "mo nhac", "tiep tuc",
    "phac", "phat di", "bat len", "bat nhac", "bạt"
  ];
  const hasSoloPlay = playPhrases.some(p => {
    const cleanP = cleanString(p);
    return cleaned === cleanP || cleaned.endsWith(" " + cleanP);
  });

  if (hasDirectPlay || hasComboPlay || hasSoloPlay) {
    return { type: "PLAY" };
  }

  // 9. PAUSE ("Hây, dừng" / "Hey, Stop" with wide phonetic variants)
  const pauseStarters = ["hay", "hey", "he", "he_y", "ay", "oi", "cat", "ket", "nay", "hi", "alo", "o"];
  const pauseActions = ["dung", "rung", "stop", "stopp", "ngung", "tat", "thoi", "pause", "giam", "ho", "gium"];
  
  // Direct matches
  const pauseDirectPhrases = [
    "hay dung", "hey dung", "he dung", "hay dung", "hey dung", "he dung",
    "hey stop", "hay stop", "he stop", "hay tat", "hey tat", "he tat", "hay rung", "hey rung"
  ];
  
  const hasDirectPause = pauseDirectPhrases.some(p => cleaned.includes(p));
  
  // Combo starter + action
  const hasComboPause = pauseStarters.some(s => cleaned.startsWith(s + " ")) && 
                        pauseActions.some(a => cleaned.endsWith(" " + a) || cleaned.includes(" " + a));
                        
  // Solo matches
  const pausePhrases = [
    "tam dung", "dung", "ngung", "tat", "thoi", 
    "pause", "stop", "halt", "nghi", "im", "im lang", 
    "dung lai", "dung gium", "rung", "tat di"
  ];
  const hasSoloPause = pausePhrases.some(p => {
    const cleanP = cleanString(p);
    return cleaned === cleanP || cleaned.endsWith(" " + cleanP);
  });

  if (hasDirectPause || hasComboPause || hasSoloPause) {
    return { type: "PAUSE" };
  }

  // If no specific match was found, return UNRECOGNIZED
  return { type: "UNRECOGNIZED", raw: text };
}

