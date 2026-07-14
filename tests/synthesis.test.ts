import { describe, it, expect } from 'vitest';
import { getCohostVoice, prepareSynthesisTimeline } from "../src/utils/synthesis";

describe('Synthesis', () => {
  it('should pass getCohostVoice symmetry', () => {
    const voices = ["charles", "seraphina", "dante", "elara", "puck", "charon", "kore", "zephyr", "fenrir"];
    for (const v of voices) {
      const cohost = getCohostVoice(v);
      const backToPrimary = getCohostVoice(cohost);
      expect(backToPrimary).toBe(v);
    }
  });

  it('should fallback properly for invalid speaker', () => {
    const payload = {
      introduction: "intro",
      chapters: [{ topic: "topic1", segments: [
        { speakerId: "host_a", text: "text1" },
        { speakerId: "host_b", text: "text2" },
        { speakerId: "host_c", text: "text3" } // Invalid speaker
      ]}]
    };
    const timeline = prepareSynthesisTimeline(payload, "puck", "en");
    
    expect(timeline[1].voice).toBe("puck");
    expect(timeline[2].voice).toBe("charon");
    expect(timeline[3].voice).toBe("puck");
  });
});
