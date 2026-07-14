export type Action = 
  | { type: "SWITCH_VIEW"; view: "youtube" | "briefing" }
  | { type: "SEARCH"; query: string }
  | { type: "PLAY" } | { type: "PAUSE" }
  | { type: "NEXT" } | { type: "FORWARD"; seconds: number } | { type: "REWIND"; seconds: number }
  | { type: "EXIT" }
  | { type: "UNRECOGNIZED"; raw: string };

/**
 * Parses a voice command text into a structured Action.
 * TODO: Use the `lang` parameter to specialize regex if needed in the future.
 * Currently both languages share the same regex set for simplicity as in the original code.
 */
export function parseVoiceCommand(text: string, lang: "vi" | "en"): Action {
  const normalizedText = text.toLowerCase().trim();

  // Switch view check (High priority)
  // TODO: These regexes overlap significantly (mở, vào, chuyển, sang are in both).
  // Currently, the first one (youtube) always wins if any of these keywords are present.
  if (/(mở|vào|chuyển|sang|giải trí|xem|youtube|entertainment)/i.test(normalizedText)) {
    return { type: "SWITCH_VIEW", view: "youtube" };
  }
  if (/(mở|vào|chuyển|sang|bản tin|nghe tin|briefing|news)/i.test(normalizedText)) {
    return { type: "SWITCH_VIEW", view: "briefing" };
  }

  const playRegex = /(phát|chạy|tiếp|nghe|mở|bật|vào|play|resume|go|continue|đọc|đọc tiếp|tiếp đi|mở giùm|mở hộ)/i;
  const pauseRegex = /(tạm\s*dừng|dừng|ngừng|ngưng|tắt|thôi|pause|stop|halt|nghỉ|im|im lặng|dừng lại|dừng giùm)/i;
  const nextRegex = /(qua\s*bài|tiếp\s*theo|bài\s*khác|next|skip|bỏ\s*qua|tới\s*luôn|bài\s*mới|kế tiếp)/i;
  const forwardRegex = /(tua\s*nhanh|tua\s*tới|forward|fast\s*forward|nhích\s*lên|tới\s*chút|tua\s*đi)/i;
  // TODO: rewindRegex and exitRegex both contain "quay\s*về". Rewind wins due to priority.
  const rewindRegex = /(tua\s*lại|lùi|quay\s*lại|rewind|back|lùi\s*lại|quay\s*về|hồi\s*nãy|nghe\s*lại)/i;
  const exitRegex = /(thoát|đóng|quay\s*về|exit|close|quit|về\s*nhà|nghỉ\s*lái|tắt\s*hud|xong\s*rồi)/i;
  const searchRegex = /(tìm\s*kiếm|search\s*for|mở\s*bài|tìm\s*bài)/i;

  // Search check
  // TODO: Commands like "mở bài..." will match the youtube view switch first.
  if (searchRegex.test(normalizedText)) {
    const query = normalizedText.replace(searchRegex, "").trim();
    if (query) {
      return { type: "SEARCH", query };
    }
  }

  // Media and system commands
  if (playRegex.test(normalizedText)) {
    return { type: "PLAY" };
  } else if (pauseRegex.test(normalizedText)) {
    return { type: "PAUSE" };
  } else if (nextRegex.test(normalizedText)) {
    return { type: "NEXT" };
  } else if (forwardRegex.test(normalizedText)) {
    return { type: "FORWARD", seconds: 15 };
  } else if (rewindRegex.test(normalizedText)) {
    return { type: "REWIND", seconds: 15 };
  } else if (exitRegex.test(normalizedText)) {
    return { type: "EXIT" };
  }

  return { type: "UNRECOGNIZED", raw: text };
}
