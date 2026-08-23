/**
 * SentenceChunker utility
 * Buffers text tokens and flushes sentences based on punctuation, timeout, or length.
 */

export interface SentenceChunkerOptions {
  timeoutMs?: number; // Timeout to flush if no punctuation
  maxLength?: number; // Max length before force flush
}

export class SentenceChunker {
  private buffer: string = "";
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly timeoutMs: number;
  private readonly maxLength: number;

  constructor(
    private onSentence: (sentence: string) => void,
    options: SentenceChunkerOptions = {}
  ) {
    this.timeoutMs = options.timeoutMs ?? 2000; // 2 seconds default
    this.maxLength = options.maxLength ?? 500; // 500 chars default
  }

  /**
   * Appends new text tokens to the buffer.
   */
  public append(text: string): void {
    this.buffer += text;
    this.startTimeout();

    // Check for max length limit
    if (this.buffer.length >= this.maxLength) {
      this.flush();
      return;
    }

    // Check for end-of-sentence punctuation
    if (this.containsPunctuation(this.buffer)) {
      this.flush();
    }
  }

  /**
   * Checks if the text ends with sentence-ending punctuation.
   */
  private containsPunctuation(text: string): boolean {
    // End-of-sentence punctuation: . ! ? \n : ;
    // We check the last character of the trimmed text to see if it's punctuation,
    // OR if the raw text ends with a newline.
    const trimmed = text.trim();
    if (trimmed.length === 0) return false;
    
    const lastChar = trimmed[trimmed.length - 1];
    const isPunctuation = /[.!?\n:;]/.test(lastChar);
    
    // Also check if the raw input ends with a newline which might have been trimmed
    const endsWithNewline = /\n$/.test(text);
    
    return isPunctuation || endsWithNewline;
  }

  /**
   * Starts or restarts the inactivity timeout.
   */
  private startTimeout(): void {
    this.clearTimeout();
    this.timeoutId = setTimeout(() => this.flush(), this.timeoutMs);
  }

  /**
   * Clears the active timeout.
   */
  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Flushes the buffer and triggers the onSentence callback.
   */
  public flush(): void {
    this.clearTimeout();
    const sentence = this.buffer.trim();
    if (sentence.length > 0) {
      this.onSentence(sentence);
      this.buffer = "";
    }
  }

  /**
   * Forcefully flushes current buffer.
   */
  public forceFlush(): void {
    this.flush();
  }

  /**
   * Clears buffer and stops timeouts.
   */
  public reset(): void {
    this.clearTimeout();
    this.buffer = "";
  }
}
