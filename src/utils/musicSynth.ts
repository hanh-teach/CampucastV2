/**
 * A highly robust, offline-ready client-side synthesizer using Web Audio API.
 * This class plays ambient, lofi, and corporate background music previews in real-time,
 * bypassing the need to fetch external static mp3 files.
 */
export class PreviewMusicSynth {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;
  private volume: number = 50;
  private masterGain: GainNode | null = null;
  private type: string = "none";
  private isPlaying: boolean = false;

  constructor(type: string, volume: number = 50) {
    this.type = type;
    this.volume = volume;
  }

  public setVolume(volumePercent: number) {
    this.volume = volumePercent;
    if (this.masterGain && this.ctx && this.ctx.state !== "closed") {
      const targetGain = 0.12 * (Math.max(0, Math.min(100, volumePercent)) / 100);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.1);
    }
  }

  public start() {
    if (this.type === "none" || this.isPlaying) return;
    
    // Create AudioContext safely supporting cross-browser prefixes
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("[MusicSynth] Web Audio API not supported in this browser.");
      return;
    }
    
    try {
      this.ctx = new AudioContextClass();
      this.isPlaying = true;
    } catch (err) {
      console.error("[MusicSynth] Failed to initialize AudioContext:", err);
      return;
    }
    
    const ctx = this.ctx;
    const type = this.type;
    
    // Master volume - kept low for a comfortable, balanced preview volume
    const masterGain = ctx.createGain();
    this.masterGain = masterGain;
    const initialGain = 0.12 * (Math.max(0, Math.min(100, this.volume)) / 100);
    masterGain.gain.setValueAtTime(initialGain, ctx.currentTime);
    masterGain.connect(ctx.destination);
    
    let step = 0;
    
    const scheduleNextNotes = () => {
      if (!ctx || ctx.state === "closed") return;
      const now = ctx.currentTime;
      
      if (type === "ambient") {
        if (step % 16 === 0) {
          const chords = [
            [130.81, 196.00, 261.63, 329.63], // C3, G3, C4, E4 (C Major Pad)
            [146.83, 220.00, 293.66, 349.23], // D3, A3, D4, F4 (D minor Pad)
            [164.81, 246.94, 329.63, 392.00], // E3, B3, E4, G4 (E minor Pad)
            [130.81, 196.00, 261.63, 349.23], // C3, G3, C4, F4 (C sus4 Pad)
          ];
          const chord = chords[Math.floor(step / 16) % chords.length];
          chord.forEach((freq) => {
            const osc = oscRefConnect(freq);
            function oscRefConnect(f: number) {
              const oscNode = ctx.createOscillator();
              const gainNode = ctx.createGain();
              oscNode.type = "triangle";
              oscNode.frequency.setValueAtTime(f, now);
              
              gainNode.gain.setValueAtTime(0, now);
              gainNode.gain.linearRampToValueAtTime(0.03, now + 1.5);
              gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 4);
              
              const filterNode = ctx.createBiquadFilter();
              filterNode.type = "lowpass";
              filterNode.frequency.setValueAtTime(500, now);
              filterNode.frequency.exponentialRampToValueAtTime(250, now + 4);
              
              oscNode.connect(gainNode);
              gainNode.connect(filterNode);
              filterNode.connect(masterGain);
              
              oscNode.start(now);
              oscNode.stop(now + 4);
              return oscNode;
            }
          });
        }
        
        // Random cozy bell chime
        if (Math.random() < 0.25) {
          const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00]; // C5, D5, E5, G5, A5
          const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);
          
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.02, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
          
          const delay = ctx.createDelay();
          delay.delayTime.setValueAtTime(0.4, now);
          const feedback = ctx.createGain();
          feedback.gain.setValueAtTime(0.35, now);
          
          osc.connect(gain);
          gain.connect(masterGain);
          
          gain.connect(delay);
          delay.connect(feedback);
          feedback.connect(delay);
          delay.connect(masterGain);
          
          osc.start(now);
          osc.stop(now + 3);
        }
      } 
      else if (type === "lofi") {
        // LOFI: Warm electric piano chords, subtle vinyl noise, and soft snare/brush
        if (step % 8 === 0) {
          const chords = [
            [146.83, 220.00, 261.63, 311.13, 392.00], // Dmin9 chord
            [130.81, 196.00, 246.94, 293.66, 349.23], // Cmaj9 chord
            [146.83, 220.00, 261.63, 329.63, 392.00], // Fmaj7/G chord
            [130.81, 196.00, 246.94, 293.66, 392.00], // Cmaj9 variant
          ];
          const chord = chords[Math.floor(step / 8) % chords.length];
          chord.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            // Flutter LFO to emulate vintage analog wow/flutter
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.setValueAtTime(4.2 + Math.random() * 0.6, now);
            lfoGain.gain.setValueAtTime(1.8, now);
            
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, now);
            
            gain.gain.setValueAtTime(0, now + idx * 0.04); // subtle strum arpeggiation
            gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.04 + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);
            
            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(420, now);
            
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            
            osc.connect(gain);
            gain.connect(filter);
            filter.connect(masterGain);
            
            lfo.start(now);
            osc.start(now + idx * 0.04);
            lfo.stop(now + 4);
            osc.stop(now + 4);
          });
        }
        
        // Cozy vinyl crackle background (triggered once on step 0)
        if (step === 0) {
          const duration = 60; 
          const bufferSize = ctx.sampleRate * duration;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            let val = (Math.random() * 2 - 1) * 0.0015;
            if (Math.random() < 0.00015) {
              val += (Math.random() > 0.5 ? 1 : -1) * 0.035;
            }
            data[i] = val;
          }
          const crackle = ctx.createBufferSource();
          crackle.buffer = buffer;
          crackle.loop = true;
          const crackleGain = ctx.createGain();
          crackleGain.gain.setValueAtTime(0.02, now);
          crackle.connect(crackleGain);
          crackleGain.connect(masterGain);
          crackle.start(now);
        }
      } 
      else if (type === "news") {
        // NEWS: Short, crisp, serious news jingle style, with distinct rhythm
        if (step % 8 === 0 || step % 8 === 3 || step % 8 === 6) {
           const notes = [440.00, 523.25, 659.25]; // A4, C5, E5
           const freq = notes[(step % 8) % notes.length];
           const osc = ctx.createOscillator();
           const gain = ctx.createGain();
           osc.type = "square";
           osc.frequency.setValueAtTime(freq, now);
           
           gain.gain.setValueAtTime(0, now);
           gain.gain.linearRampToValueAtTime(0.04, now + 0.05);
           gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
           
           const filter = ctx.createBiquadFilter();
           filter.type = "lowpass";
           filter.frequency.setValueAtTime(1200, now);
           
           osc.connect(gain);
           gain.connect(filter);
           filter.connect(masterGain);
           
           osc.start(now);
           osc.stop(now + 0.6);
        }
      }
      else if (type === "electronic") {
        // ELECTRONIC: Upbeat, bright inspiring plucks and a rhythmic bounce
        const notes = [
          261.63, 293.66, 329.63, 392.00, // C, D, E, G
          329.63, 392.00, 440.00, 523.25, // E, G, A, C5
        ];
        const melSeq = [
          [2, 4, 3, 5, 2, 4, 3, 5], 
          [3, 5, 4, 6, 3, 5, 4, 6], 
          [1, 3, 2, 4, 1, 3, 2, 4], 
          [3, 5, 4, 7, 3, 5, 4, 7]  
        ];
        const chordIdx = Math.floor(step / 8) % melSeq.length;
        const seq = melSeq[chordIdx];
        const noteIdx = seq[step % 8];
        const freq = notes[noteIdx];
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
        
        const delay = ctx.createDelay();
        delay.delayTime.setValueAtTime(0.1875, now); // dotted-eighth feedback delay
        const feedback = ctx.createGain();
        feedback.gain.setValueAtTime(0.28, now);
        
        osc.connect(gain);
        gain.connect(masterGain);
        
        gain.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(masterGain);
        
        osc.start(now);
        osc.stop(now + 0.4);
      }
      
      step++;
    };
    
    const intervalMs = type === "electronic" ? 250 : type === "lofi" ? 500 : 250;
    
    const startScheduling = () => {
      if (!this.isPlaying || !this.ctx || this.ctx.state === "closed") return;
      scheduleNextNotes();
      this.intervalId = setInterval(scheduleNextNotes, intervalMs);
    };

    console.log(`[MusicSynth] AudioContext initial state: ${ctx.state}`);
    if (ctx.state === "suspended") {
      ctx.resume()
        .then(() => {
          console.log(`[MusicSynth] AudioContext resumed, state: ${this.ctx?.state}`);
          startScheduling();
        })
        .catch(err => {
          console.warn("[MusicSynth] Failed to resume AudioContext:", err);
          startScheduling(); // Fallback to schedule anyway
        });
    } else {
      startScheduling();
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (err) {
        console.error("[MusicSynth] Error closing AudioContext:", err);
      }
      this.ctx = null;
      this.masterGain = null;
    }
  }
}
