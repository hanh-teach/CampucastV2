import re

with open("src/utils/musicSynth.ts", "r") as f:
    content = f.read()

# Add volume and masterGain props
content = re.sub(
    r'private intervalId: any = null;',
    r'private intervalId: any = null;\n  private volume: number = 50;\n  private masterGain: GainNode | null = null;',
    content
)

# Update constructor
content = re.sub(
    r'constructor\(type: string\) \{\s*this\.type = type;\s*\}',
    r'constructor(type: string, volume: number = 50) {\n    this.type = type;\n    this.volume = volume;\n  }',
    content
)

# Add setVolume method
content = re.sub(
    r'public start\(\) \{',
    r'public setVolume(volumePercent: number) {\n    this.volume = volumePercent;\n    if (this.masterGain && this.ctx && this.ctx.state !== "closed") {\n      const targetGain = 0.12 * (Math.max(0, Math.min(100, volumePercent)) / 100);\n      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.1);\n    }\n  }\n\n  public start() {',
    content
)

# Replace master volume setup
content = re.sub(
    r'const masterGain = ctx\.createGain\(\);\s*masterGain\.gain\.setValueAtTime\(0\.12, ctx\.currentTime\);\s*masterGain\.connect\(ctx\.destination\);',
    r'const masterGain = ctx.createGain();\n    this.masterGain = masterGain;\n    const initialGain = 0.12 * (Math.max(0, Math.min(100, this.volume)) / 100);\n    masterGain.gain.setValueAtTime(initialGain, ctx.currentTime);\n    masterGain.connect(ctx.destination);',
    content
)

# Replace corporate with electronic
content = content.replace('type === "corporate"', 'type === "electronic"')
content = content.replace('// CORPORATE:', '// ELECTRONIC:')

# Add news branch
news_branch = r'''      else if (type === "news") {
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
      else if (type === "electronic") {'''

content = content.replace('else if (type === "electronic") {', news_branch)

# Update interval cleanup
content = re.sub(
    r'this\.ctx = null;\s*\}',
    r'this.ctx = null;\n      this.masterGain = null;\n    }',
    content
)

with open("src/utils/musicSynth.ts", "w") as f:
    f.write(content)
