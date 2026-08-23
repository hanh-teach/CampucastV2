/**
 * Web Audio Dynamic Crossfader & Background Audio Ducking Engine
 * Creates a Spotify-grade continuous broadcast experience by balancing
 * voice synthesis stream with dynamic ambient background soundscapes and stingers.
 */
export class AudioCrossfaderEngine {
  private audioCtx: AudioContext | null = null;
  private voiceGainNode: GainNode | null = null;
  private musicGainNode: GainNode | null = null;
  private masterGainNode: GainNode | null = null;
  private isDucked: boolean = false;
  private defaultMusicVolume: number = 0.45;
  private duckedMusicVolume: number = 0.12;

  /**
   * Initializes the audio graph with dedicated Voice and Music buses
   */
  public initGraph(audioContext: AudioContext): {
    voiceGain: GainNode;
    musicGain: GainNode;
    masterGain: GainNode;
  } {
    this.cleanup();
    this.audioCtx = audioContext;

    this.masterGainNode = audioContext.createGain();
    this.masterGainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
    this.masterGainNode.connect(audioContext.destination);

    this.voiceGainNode = audioContext.createGain();
    this.voiceGainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
    this.voiceGainNode.connect(this.masterGainNode);

    this.musicGainNode = audioContext.createGain();
    this.musicGainNode.gain.setValueAtTime(this.defaultMusicVolume, audioContext.currentTime);
    this.musicGainNode.connect(this.masterGainNode);

    return {
      voiceGain: this.voiceGainNode,
      musicGain: this.musicGainNode,
      masterGain: this.masterGainNode,
    };
  }

  /**
   * Smoothly ducks the background music when AI MC speaks
   */
  public duckMusic(fadeDurationMs: number = 350): void {
    if (!this.musicGainNode || !this.audioCtx || this.isDucked) return;
    try {
      const now = this.audioCtx.currentTime;
      this.musicGainNode.gain.cancelScheduledValues(now);
      this.musicGainNode.gain.setValueAtTime(this.musicGainNode.gain.value, now);
      this.musicGainNode.gain.linearRampToValueAtTime(
        this.duckedMusicVolume,
        now + fadeDurationMs / 1000
      );
      this.isDucked = true;
    } catch (err) {
      console.warn("[AudioCrossfader] Ducking error:", err);
    }
  }

  /**
   * Smoothly restores background music volume when speech pauses or transitions
   */
  public unduckMusic(fadeDurationMs: number = 600): void {
    if (!this.musicGainNode || !this.audioCtx || !this.isDucked) return;
    try {
      const now = this.audioCtx.currentTime;
      this.musicGainNode.gain.cancelScheduledValues(now);
      this.musicGainNode.gain.setValueAtTime(this.musicGainNode.gain.value, now);
      this.musicGainNode.gain.linearRampToValueAtTime(
        this.defaultMusicVolume,
        now + fadeDurationMs / 1000
      );
      this.isDucked = false;
    } catch (err) {
      console.warn("[AudioCrossfader] Unducking error:", err);
    }
  }

  /**
   * Plays a subtle synthesized transitional acoustic jingle / stinger between news topics
   */
  public playTransitionChime(): void {
    if (!this.audioCtx || !this.musicGainNode) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const filter = this.audioCtx.createBiquadFilter();
      const stingerGain = this.audioCtx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";

      // Gentle broadcast ambient harmonic intervals (D5 - A5)
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.3);

      osc2.frequency.setValueAtTime(440.0, now);
      osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.3);

      // Lowpass filter to shave harsh high harmonics
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(600, now + 0.5);

      stingerGain.gain.setValueAtTime(0.0, now);
      stingerGain.gain.linearRampToValueAtTime(0.06, now + 0.08);
      stingerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(stingerGain);
      stingerGain.connect(this.musicGainNode);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch (err) {
      console.warn("[AudioCrossfader] Chime generation error:", err);
    }
  }

  /**
   * Disconnects and cleans up audio nodes on unmount
   */
  public cleanup(): void {
    try {
      if (this.voiceGainNode) this.voiceGainNode.disconnect();
      if (this.musicGainNode) this.musicGainNode.disconnect();
      if (this.masterGainNode) this.masterGainNode.disconnect();
    } catch (err) {
      console.warn("[AudioCrossfader] Cleanup error:", err);
    }
  }
}

export const audioCrossfaderEngine = new AudioCrossfaderEngine();
