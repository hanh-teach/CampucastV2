/**
 * Utility for text normalization and sanitization.
 * Implements "QualityGate" logic to ensure consistent text input for LLM and TTS.
 */

export function normalizeText(text: string): string {
  if (!text) return "";

  return text
    // 1. Unicode Normalization (NFC) - essential for Vietnamese character consistency
    .normalize("NFC")
    // 2. Remove HTML tags if any leaked in (surgical regex to avoid stripping comparison operators)
    // We only strip valid HTML tags from a whitelist, ensuring they are not part of a comparison.
    // This matches: <p>, <br/>, <div class="...">, </div> etc.
    // It avoids matching: a<b, 10<T<20, if(a<b>c)
    .replace(/<(?:(?:(?:p|b|i|br|div|span|strong|em|header|footer|section|article|aside|h[1-6]|ul|ol|li|blockquote|a|img|hr)\b(?:\s+[a-zA-Z-]+(?:=(?:'[^']*'|"[^"]*"|[^\s>]+))?)*\s*\/?>)|(?:\/(?:p|b|i|br|div|span|strong|em|header|footer|section|article|aside|h[1-6]|ul|ol|li|blockquote|a|img|hr)\s*>))/gim, (match, offset, fullText) => {
      // Closing tags are always safe to strip if in whitelist
      if (match.startsWith("</")) return "";
      
      // For opening tags, if preceded by a word character, treat as a comparison (e.g. a<b)
      if (offset > 0 && /[a-zA-Z0-9]/.test(fullText[offset - 1])) {
        return match;
      }
      return "";
    })
    // 3. Collapse multiple spaces and tabs
    .replace(/[ \t]+/g, " ")
    // 4. Collapse multiple newlines (max 2 for paragraph separation)
    .replace(/\n{3,}/g, "\n\n")
    // 5. Trim whitespace from both ends
    .trim();
}
