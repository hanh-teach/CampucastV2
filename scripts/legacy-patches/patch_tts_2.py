import re

with open("src/server/routes/tts.routes.ts", "r") as f:
    content = f.read()

replacement = """
router.post("/tts/preview", async (req, res): Promise<any> => {
  const { voice, lang } = req.body;
  
  if (!voice) {
    return res.status(400).json({ success: false, error: "Missing voice parameter" });
  }

  const text = lang === "vi" 
    ? "Đây là giọng đọc thử nghiệm cho bản tin của bạn." 
    : "This is a preview of your news briefing voice.";

  try {
    const audioBase64 = await callGeminiTTSForChunk(text, voice, "normal");
    return res.json({ success: true, audioBase64 });
  } catch (err: any) {
    console.error("[TTS Preview] Error:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to generate preview" });
  }
});

export default router;
"""

content = content.replace("export default router;", replacement)

with open("src/server/routes/tts.routes.ts", "w") as f:
    f.write(content)
