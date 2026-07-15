export type Action = 
  | { type: "SWITCH_VIEW"; view: "youtube" | "briefing" }
  | { type: "SEARCH"; query: string }
  | { type: "PLAY" } | { type: "PAUSE" }
  | { type: "NEXT" } | { type: "FORWARD"; seconds: number } | { type: "REWIND"; seconds: number }
  | { type: "EXIT" }
  | { type: "UNRECOGNIZED"; raw: string };

/**
 * Parses a voice command text into a structured Action.
 */
export function parseVoiceCommand(text: string, lang: "vi" | "en"): Action {
  const normalizedText = text.toLowerCase().trim();

  if (!normalizedText) {
    return { type: "UNRECOGNIZED", raw: text };
  }

  // 1. EXIT (High Priority)
  const exitPhrases = [
    "thoát", "đóng", "exit", "close", "quit", 
    "về nhà", "nghỉ lái", "tắt hud", "xong rồi", 
    "trang chủ", "quay về trang chủ", "quay lại trang chủ"
  ];
  if (exitPhrases.includes(normalizedText) || normalizedText === "về" || normalizedText === "quay về") {
    return { type: "EXIT" };
  }

  // 2. NEXT
  const nextPhrases = [
    "qua bài", "tiếp theo", "bài khác", "next", "skip", 
    "bỏ qua", "tới luôn", "bài mới", "kế tiếp"
  ];
  if (nextPhrases.includes(normalizedText)) {
    return { type: "NEXT" };
  }

  // 3. FORWARD
  const forwardPhrases = [
    "tua nhanh", "tua tới", "forward", "fast forward", 
    "nhích lên", "tới chút", "tua đi"
  ];
  if (forwardPhrases.includes(normalizedText)) {
    return { type: "FORWARD", seconds: 15 };
  }

  // 4. REWIND
  const rewindPhrases = [
    "tua lại", "lùi", "quay lại", "rewind", "back", 
    "lùi lại", "hồi nãy", "nghe lại"
  ];
  if (rewindPhrases.includes(normalizedText)) {
    return { type: "REWIND", seconds: 15 };
  }

  // 5. SWITCH_VIEW - BRIEFING (NEWS)
  const briefingPhrases = ["bản tin", "nghe tin", "briefing", "news", "tin tức", "mở tin", "mở news"];
  const matchesBriefing = briefingPhrases.some(phrase => {
    if (normalizedText === phrase) return true;
    const regex = new RegExp(`\\b(mở|vào|chuyển|sang|nghe)\\s+${phrase}\\b`, "i");
    return regex.test(normalizedText);
  });
  if (matchesBriefing) {
    return { type: "SWITCH_VIEW", view: "briefing" };
  }

  // 6. SWITCH_VIEW - YOUTUBE
  const youtubePhrases = ["youtube", "entertainment", "giải trí", "xem youtube", "mở youtube", "chuyển giải trí"];
  const matchesYoutube = youtubePhrases.some(phrase => {
    if (normalizedText === phrase) return true;
    const regex = new RegExp(`\\b(mở|vào|chuyển|sang|xem)\\s+${phrase}\\b`, "i");
    return regex.test(normalizedText);
  });
  if (matchesYoutube) {
    return { type: "SWITCH_VIEW", view: "youtube" };
  }

  // 7. SEARCH (Starts with check, must extract remaining part)
  const searchPrefixes = ["tìm kiếm", "search for", "mở bài", "tìm bài", "tìm", "search"];
  for (const prefix of searchPrefixes) {
    if (normalizedText.startsWith(prefix)) {
      const query = normalizedText.substring(prefix.length).trim();
      if (query) {
        return { type: "SEARCH", query };
      } else {
        // If they said only the search keyword like "tìm kiếm" with no query, return UNRECOGNIZED
        return { type: "UNRECOGNIZED", raw: text };
      }
    }
  }

  // 8. PLAY
  const playPhrases = [
    "phát", "chạy", "tiếp", "nghe", "mở", "bật", "vào", 
    "play", "resume", "go", "continue", "đọc", "đọc tiếp", 
    "tiếp đi", "mở giùm", "mở hộ", "chạy tiếp", "mở nhạc"
  ];
  if (playPhrases.includes(normalizedText) || playPhrases.some(p => normalizedText === p)) {
    return { type: "PLAY" };
  }

  // 9. PAUSE
  const pausePhrases = [
    "tạm dừng", "dừng", "ngừng", "ngưng", "tắt", "thôi", 
    "pause", "stop", "halt", "nghỉ", "im", "im lặng", 
    "dừng lại", "dừng giùm"
  ];
  if (pausePhrases.includes(normalizedText)) {
    return { type: "PAUSE" };
  }

  // If no specific match was found, return UNRECOGNIZED
  return { type: "UNRECOGNIZED", raw: text };
}
