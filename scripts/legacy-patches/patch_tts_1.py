import re

with open("src/server/routes/tts.routes.ts", "r") as f:
    content = f.read()

replacement = """const VOICE_MAP: Record<string, string> = {
  alloy: "Aoede",
  echo: "Charon",
  fable: "Fenrir",
  onyx: "Kore",
  nova: "Leda",
  shimmer: "Orus",
};

async function callGeminiTTSForChunk(chunk: string, voice: string, tone: string, emotion?: string): Promise<string> {
  let voiceName = "Kore";
  let systemInstructionText = "";
  if (VOICE_MAP[voice]) {
    voiceName = VOICE_MAP[voice];
    systemInstructionText = `ROLE & STYLE: You are a professional voice talent giving a preview of your voice capabilities...`;
  } else if (voice === "vi-HN" || voice === "vi") {
    voiceName = "Kore";
    systemInstructionText = `ROLE & STYLE: Bạn là một phát thanh viên truyền hình và đài tiếng nói quốc gia kỳ cựu nói giọng Bắc (Hà Nội)...`;
  } else if (voice === "vi-HCM") {
    voiceName = "Zephyr";
    systemInstructionText = `ROLE & STYLE: Bạn là một phát thanh viên truyền hình miền Nam cực kỳ duyên dáng và chuyên nghiệp...`;
  } else if (voice === "en-UK" || voice === "Puck") {
    voiceName = "Puck";
    systemInstructionText = `ROLE & STYLE: You are a premium, highly professional British radio presenter and news anchor...`;
  } else {
    voiceName = "Zephyr";
    systemInstructionText = `ROLE & STYLE: You are an elite, highly professional American podcast host and premium news anchor...`;
  }"""

content = re.sub(
    r'async function callGeminiTTSForChunk\(chunk: string, voice: string, tone: string, emotion\?: string\): Promise<string> \{\s*let voiceName = "Kore";\s*let systemInstructionText = "";\s*if \(voice === "vi-HN" \|\| voice === "vi"\) \{\s*voiceName = "Kore";\s*systemInstructionText = `ROLE & STYLE: Bạn là một phát thanh viên truyền hình và đài tiếng nói quốc gia kỳ cựu nói giọng Bắc \(Hà Nội\)\.\.\.`;\s*\} else if \(voice === "vi-HCM"\) \{\s*voiceName = "Zephyr";\s*systemInstructionText = `ROLE & STYLE: Bạn là một phát thanh viên truyền hình miền Nam cực kỳ duyên dáng và chuyên nghiệp\.\.\.`;\s*\} else if \(voice === "en-UK" \|\| voice === "Puck"\) \{\s*voiceName = "Puck";\s*systemInstructionText = `ROLE & STYLE: You are a premium, highly professional British radio presenter and news anchor\.\.\.`;\s*\} else \{\s*voiceName = "Zephyr";\s*systemInstructionText = `ROLE & STYLE: You are an elite, highly professional American podcast host and premium news anchor\.\.\.`;\s*\}',
    replacement,
    content
)

with open("src/server/routes/tts.routes.ts", "w") as f:
    f.write(content)
