import express from "express";
import { Type } from "@google/genai";
import {
  callGeminiWithRotation,
  generateWithGroq,
  parseGeminiError
} from "../shared";

const router = express.Router();

router.post("/voice-query", async (req, res): Promise<any> => {
  const { text, language } = req.body;
  const isVi = language === "vi" || language === "vi-VN" || language === "bilingual";

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: isVi ? "Chưa cấu hình GEMINI_API_KEY trên server." : "GEMINI_API_KEY is not configured on the server." });
  }

  try {
    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "No text provided." });
    }

    const systemPrompt = `
You are a helpful broadcast assistant that processes voice commands and queries. 
The user is talking to a smart news radio application. They spoke a query or made a statement.
Determine if the user is asking for information (a query/question) or just making a simple statement.

CRITICAL LANGUAGE REQUIREMENT:
You MUST output your response in the EXACT same language as the user's spoken input.
- If the user speaks/asks in Vietnamese (or if the input contains Vietnamese characters, diacritics, or looks like Vietnamese), your complete answer MUST be in high-quality, fluent, natural Vietnamese (Tiếng Việt standard). Under NO circumstances should you return an English or Chinese (Chữ Hán, "是在", etc.) answer or mix random foreign words for a Vietnamese query! This is extremely important to the user.
- If the user speaks/asks in English, write the answer in English.
- Avoid introducing any raw foreign/machine-translated phrases. Ensure 100% human-like phrasing. Do NOT use literal translations, Chinese helper verbs, or transliterated characters.

If it is a query/question (e.g., asking about weather, tech, news, details about anything, or requesting a summary/explanation of some topics), use Google Search grounding results to provide an engaging, clear, concise, and highly accurate answer. Keep the answer brief and natural to read out loud (max 3-4 sentences), written in high-quality spoken phrasing.
If it is not a query/question (e.g., a greeting, a simple statement, empty or random words), indicate it is not a query (isQuery: false) and give a simple friendly closing/greeting reply in the same language.

Your response must be a JSON object with the following structure:
{
  "isQuery": boolean, // true if user asks a question or requests info
  "answer": string    // accurate concise answer derived from search results, or friendly statement response
}
`;

    const userPrompt = `User said: "${text}"`;

    const hasGroq = !!process.env.GROQ_API_KEY;
    let result: { isQuery: boolean; answer: string; sources?: Array<{ title: string; uri: string }> };

    try {
      const response = await callGeminiWithRotation((ai) =>
        ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isQuery: { type: Type.BOOLEAN },
                answer: { type: Type.STRING }
              },
              required: ["isQuery", "answer"]
            }
          }
        })
      );

      const parsed = JSON.parse(response.text || '{"isQuery": false, "answer": ""}');
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sourcesList = chunks
        .map((c: any) => c.web)
        .filter((w: any) => w && w.uri)
        .map((w: any) => ({
          title: w.title || w.uri,
          uri: w.uri
        }));

      const uniqueSources = sourcesList.filter((src: any, idx: number, self: any[]) =>
        self.findIndex((s) => s.uri === src.uri) === idx
      );

      result = {
        isQuery: !!parsed.isQuery,
        answer: parsed.answer || "",
        sources: uniqueSources
      };
    } catch (geminiError: any) {
      console.error("[Voice Query] Gemini rotation failed. Attempting fallback if possible:", geminiError);
      if (hasGroq) {
        try {
          console.log("[Voice Query] Routing fallback to Groq...");
          const groqResponse = await generateWithGroq(systemPrompt, userPrompt, true);
          const parsed = JSON.parse(groqResponse || '{"isQuery": false, "answer": ""}');
          result = {
            isQuery: !!parsed.isQuery,
            answer: parsed.answer || "",
            sources: []
          };
        } catch (groqError: any) {
          console.error("[Voice Query] Groq fallback also failed:", groqError);
          const friendlyError = parseGeminiError(geminiError, isVi, false);
          return res.status(500).json({ error: friendlyError });
        }
      } else {
        const friendlyError = parseGeminiError(geminiError, isVi, false);
        return res.status(500).json({ error: friendlyError });
      }
    }

    return res.json(result);
  } catch (error: any) {
    console.error("Voice Query error:", error);
    const isVi = language === "vi" || language === "vi-VN" || language === "bilingual";
    const friendlyError = parseGeminiError(error, isVi, false);
    return res.status(500).json({ error: friendlyError });
  }
});

router.post("/assistant-chat", async (req, res): Promise<any> => {
  const { history = [], message, language, userPreferences = [] } = req.body;
  const isVi = language === "vi" || language === "vi-VN" || language === "bilingual";

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: isVi ? "Chưa cấu hình GEMINI_API_KEY trên server." : "GEMINI_API_KEY is not configured on the server." });
  }

  try {
    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "No message provided." });
    }

    const userPreferencesText = Array.isArray(userPreferences) && userPreferences.length > 0
      ? userPreferences.map((p: string, idx: number) => `${idx + 1}. ${p}`).join("\n")
      : "No user preferences recorded yet.";

    const systemPrompt = `
You are CommuteCast Virtual Assistant - a professional, highly helpful, and engaging companion in a smart personalized news radio application.
Your name is CommuteCast Assistant.

CRITICAL LANGUAGE REQUIREMENT:
You MUST respond in the EXACT same language as the user's latest query or conversation context.
- If the user talks/queries in Vietnamese (or if the input contains Vietnamese characters/diacritics), you MUST answer in standard, fluent, natural, human-like Vietnamese (Tiếng Việt). Under no circumstances should you return an English answer for a Vietnamese query!
- If the user talks in English, answer in English.

FUNCTIONAL CAPABILITIES & INTENT DETECTION (ACTIONS):
You have access to several actions in the application. Analyze the user's input carefully to detect if they want you to perform any of these actions. Your JSON response MUST identify the action.

1. Create a news briefing:
   - User intent: requests to create/write/generate a new broadcast/news about a topic (e.g., "Tạo bản tin về trí tuệ nhân tạo", "Tạo bản tin thời tiết Hà Nội", "Write a news draft about tech").
   - Action JSON: {"type": "create_news", "param": "<the exact topic or subject to write about>"}

2. Add last answer to the news briefing:
   - User intent: requests to insert or add the assistant's previous/current answer, or some content, into the current briefing/script (e.g., "Thêm vào kịch bản", "Thêm vào bản tin", "Add this to news", "Chèn vào bản tin", "Lưu nội dung này vào bản tin").
   - Action JSON: {"type": "add_to_news", "param": ""}

3. Read/Summarize RSS news:
   - User intent: requests to compile, fetch, or summarize latest RSS feeds/articles (e.g., "Tổng hợp tin RSS", "Tóm tắt nguồn tin RSS", "Tóm tắt RSS", "Summarize RSS", "Fetch RSS").
   - Action JSON: {"type": "read_rss", "param": ""}
   - Note: If the user simply asks to "Đọc RSS" or "Đọc tin RSS" (without asking to summarize or fetch), do NOT trigger this action. Instead, ask "Bạn muốn đọc chủ đề gì?" or offer suggestions, and return action "none".

4. Normal conversation/general query:
   - User intent: general conversation, greeting, "Đọc RSS" (just asking what topic to read), asking a question, search query, explaining a concept.
   - Action JSON: {"type": "none", "param": ""}

USER PREFERENCE CONTEXT (HISTORICAL INTERESTS):
The user has expressed strong interest in these topics based on their offline commute news reading history:
${userPreferencesText}

Proactively recommend news or direct subjects aligned with these interests if the user asks for suggestions or recommendations (e.g., "What should I read today?", "Tôi nên đọc gì hôm nay?", "Recommend news", "Give me something interesting").

RESPONSE FORMAT MANDATE (STRICT JSON ONLY):
You MUST respond with a single JSON object. Do NOT include any markdown code fences, do NOT include any prefix or suffix, do NOT write any explanation outside the JSON.
Response Schema:
{
  "speechResponse": string, // Your conversational reply or explanation, kept highly natural, friendly, easy to read aloud (max 3-5 sentences).
  "suggestedTopics": [      // Proactively suggest 1 to 3 relevant topics to read today
    {
      "topic": string,      // A short, specific recommended topic name (e.g. "AI", "Finance", "Electric Vehicles")
      "reason": string      // A brief, personalized explanation of why you recommended it based on their interests
    }
  ],
  "action": {
    "type": "create_news" | "add_to_news" | "read_rss" | "none",
    "param": string         // Parameter for the action
  }
}
`;

    // Map history to Google GenAI contents format
    const contents = history.map((h: any) => ({
      role: h.role === "assistant" || h.role === "model" ? "model" : "user",
      parts: [{ text: h.content || h.text || "" }]
    }));

    // Append current message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    let result: { speechResponse: string; answer: string; suggestedTopics: any[]; action: { type: string; param?: string }; sources?: Array<{ title: string; uri: string }> } | null = null;
    let lastGeminiError: any = null;

    // List of models to try in descending order (Avoiding deprecated models causing key exhaustion)
    const candidateModels = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];

    for (const modelName of candidateModels) {
      try {
        console.log(`[Assistant Chat] Attempting generation with model: ${modelName}...`);
        const response = await callGeminiWithRotation((ai) =>
          ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: {
              systemInstruction: systemPrompt,
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  speechResponse: { type: Type.STRING },
                  suggestedTopics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        topic: { type: Type.STRING },
                        reason: { type: Type.STRING }
                      },
                      required: ["topic", "reason"]
                    }
                  },
                  action: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING },
                      param: { type: Type.STRING }
                    },
                    required: ["type"]
                  }
                },
                required: ["speechResponse", "suggestedTopics", "action"]
              }
            }
          })
        );

        const parsed = JSON.parse(response.text || '{"speechResponse": "", "suggestedTopics": [], "action": {"type": "none", "param": ""}}');
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sourcesList = chunks
          .map((c: any) => c.web)
          .filter((w: any) => w && w.uri)
          .map((w: any) => ({
            title: w.title || w.uri,
            uri: w.uri
          }));

        const uniqueSources = sourcesList.filter((src: any, idx: number, self: any[]) =>
          self.findIndex((s) => s.uri === src.uri) === idx
        );

        result = {
          speechResponse: parsed.speechResponse || parsed.answer || "",
          answer: parsed.speechResponse || parsed.answer || "",
          suggestedTopics: parsed.suggestedTopics || [],
          action: parsed.action || { type: "none", param: "" },
          sources: uniqueSources
        };

        break; // Successfully completed
      } catch (err: any) {
        console.warn(`[Assistant Chat] Model ${modelName} failed or was rate limited:`, err.message || err);
        lastGeminiError = err;
      }
    }

    // If Gemini models all failed, try Groq fallback if configured
    if (!result) {
      const hasGroq = !!process.env.GROQ_API_KEY;
      if (hasGroq) {
        try {
          console.log("[Assistant Chat] All Gemini models rate-limited. Trying Groq fallback...");
          const userPrompt = `History: ${JSON.stringify(history)}\\nLatest Message: "${message}"`;
          const groqResponse = await generateWithGroq(systemPrompt, userPrompt, true);
          const parsed = JSON.parse(groqResponse || '{"speechResponse": "", "suggestedTopics": [], "action": {"type": "none", "param": ""}}');
          result = {
            speechResponse: parsed.speechResponse || parsed.answer || "",
            answer: parsed.speechResponse || parsed.answer || "",
            suggestedTopics: parsed.suggestedTopics || [],
            action: parsed.action || { type: "none", param: "" },
            sources: []
          };
        } catch (groqError: any) {
          console.error("[Assistant Chat] Groq fallback failed as well:", groqError);
        }
      }
    }

    // If everything failed, use the smart local rule-based fallback
    if (!result) {
      console.warn("[Assistant Chat] All AI endpoints failed or rate-limited. Launching local offline/rule-based backup controller...");
      const msgLower = message.toLowerCase();
      
      let localAction = { type: "none", param: "" };
      let localAnswer = "";

      // 1. Create news
      if (msgLower.includes("tạo bản tin về") || msgLower.includes("tạo bản tin") || msgLower.includes("viết bản tin về") || msgLower.includes("viết bản tin") || msgLower.includes("làm bản tin")) {
        let topic = message.replace(/tạo bản tin về/i, "").replace(/tạo bản tin/i, "").replace(/viết bản tin về/i, "").replace(/viết bản tin/i, "").trim();
        localAction = { type: "create_news", param: topic || "tin tức mới nhất" };
        localAnswer = isVi 
          ? `Đã tiếp nhận lệnh tạo bản tin của bạn! Tôi đang tiến hành soạn thảo kịch bản phát thanh thông minh về chủ đề: "${topic || "tin tức mới nhất"}".`
          : `I have received your request! I am compiling a dynamic broadcast script on: "${topic || "latest news"}".`;
      } else if (msgLower.includes("create news about") || msgLower.includes("create news") || msgLower.includes("write news") || msgLower.includes("write a news")) {
        let topic = message.replace(/create news about/i, "").replace(/create news/i, "").replace(/write news about/i, "").replace(/write news/i, "").trim();
        localAction = { type: "create_news", param: topic || "latest news" };
        localAnswer = `I have received your request! I am compiling a dynamic broadcast script on: "${topic || "latest news"}".`;
      }
      // 2. Add last response to news editor
      else if (msgLower.includes("thêm vào bản tin") || msgLower.includes("thêm vào kịch bản") || msgLower.includes("chèn vào bản tin") || msgLower.includes("lưu vào bản tin")) {
        localAction = { type: "add_to_news", param: "" };
        localAnswer = isVi
          ? "Đã hiểu! Tôi sẽ chèn trực tiếp nội dung thảo luận phía trên vào kịch bản bản tin của bạn ngay lập tức."
          : "Understood! I will append the conversational content above to your broadcast script editor.";
      } else if (msgLower.includes("add to news") || msgLower.includes("add to script") || msgLower.includes("append to news")) {
        localAction = { type: "add_to_news", param: "" };
        localAnswer = "Understood! I will append the conversational content above to your broadcast script editor.";
      }
      // 3. Read RSS feeds
      else if (msgLower.includes("tổng hợp rss") || msgLower.includes("tổng hợp tin rss") || msgLower.includes("tóm tắt rss") || msgLower.includes("tóm tắt nguồn tin rss")) {
        localAction = { type: "read_rss", param: "" };
        localAnswer = isVi
          ? "Đang tiến hành kết nối, đồng bộ và tổng hợp thông tin từ các nguồn tin RSS của bạn..."
          : "Connecting, syncing, and aggregating articles from your subscribed RSS channels...";
      } else if (msgLower.includes("đọc rss") || msgLower === "doc rss" || msgLower === "đọc mục rss" || msgLower === "đọc tin rss" || msgLower === "doc tin rss") {
        localAction = { type: "none", param: "" };
        localAnswer = isVi
          ? "Bạn muốn đọc chủ đề gì từ nguồn tin RSS hôm nay? Hãy chọn một trong các chủ đề gợi ý dưới đây hoặc gõ chủ đề bạn muốn:"
          : "What topic would you like to read from your RSS feeds today? Choose one of the suggested topics below or type your own:";
      } else if (msgLower.includes("read rss") || msgLower.includes("summarize rss") || msgLower.includes("fetch rss")) {
        localAction = { type: "read_rss", param: "" };
        localAnswer = "Connecting, syncing, and aggregating articles from your subscribed RSS channels...";
      }
      // 4. Navigation controls
      else if (msgLower.includes("bàn điều hành") || msgLower.includes("về trang chủ") || msgLower.includes("về home") || msgLower.includes("go to home") || msgLower.includes("navigate to home") || msgLower.includes("trang chủ")) {
        localAction = { type: "navigate", param: "home" };
        localAnswer = isVi 
          ? "Đang chuyển bạn về Bàn Điều Hành (Home Desk Ops) ngay lập tức."
          : "Navigating you to the Home Desk Ops workstation immediately.";
      } else if (msgLower.includes("trạm sản xuất") || msgLower.includes("soạn thảo") || msgLower.includes("tạo kịch bản") || msgLower.includes("go to create") || msgLower.includes("navigate to create") || msgLower.includes("mở create")) {
        localAction = { type: "navigate", param: "create" };
        localAnswer = isVi 
          ? "Đang chuyển bạn sang Trạm Sản Xuất (Production Flow) để biên soạn bản tin."
          : "Navigating you to the Production Flow workstation for script editing.";
      } else if (msgLower.includes("kho lưu trữ") || msgLower.includes("kho dữ liệu") || msgLower.includes("bản tin đã lưu") || msgLower.includes("go to assets") || msgLower.includes("navigate to assets") || msgLower.includes("mở assets")) {
        localAction = { type: "navigate", param: "assets" };
        localAnswer = isVi 
          ? "Đang chuyển bạn sang Trạm Kho Lưu Trữ (Asset Management) để xem lịch sử bản tin phát thanh."
          : "Navigating you to the Asset Management workstation to review files.";
      } else if (msgLower.includes("cài đặt") || msgLower.includes("cấu hình") || msgLower.includes("go to settings") || msgLower.includes("navigate to settings") || msgLower.includes("mở settings")) {
        localAction = { type: "navigate", param: "settings" };
        localAnswer = isVi 
          ? "Đang chuyển bạn sang mục Cấu Hình (System Config) để thiết lập thông số."
          : "Navigating you to the System Config station for preferences setup.";
      }
      // 5. Audio Playback Control
      else if (msgLower.includes("phát") || msgLower.includes("nghe") || msgLower.includes("play") || msgLower.includes("dừng") || msgLower.includes("pause") || msgLower.includes("tạm dừng") || msgLower.includes("mở bản tin")) {
        localAction = { type: "toggle_play", param: "" };
        localAnswer = isVi 
          ? "Đã kích hoạt lệnh điều khiển phát thanh! Đang chuyển đổi trạng thái phát/tạm dừng của trình phát nhạc."
          : "Audio control triggered! Toggling the play/pause state on the media player.";
      }
      // 6. Theme Switching
      else if (msgLower.includes("giao diện") || msgLower.includes("đổi màu") || msgLower.includes("sáng tối") || msgLower.includes("dark mode") || msgLower.includes("light mode") || msgLower.includes("theme")) {
        localAction = { type: "toggle_theme", param: "" };
        localAnswer = isVi 
          ? "Đang đổi chế độ màu giao diện sáng/tối để phù hợp với môi trường làm việc của bạn."
          : "Toggling light/dark theme to match your working environment.";
      }
      // 7. Driving Mode Control
      else if (msgLower.includes("lái xe") || msgLower.includes("ô tô") || msgLower.includes("driving mode") || msgLower.includes("car mode") || msgLower.includes("ô-tô")) {
        localAction = { type: "toggle_driving", param: "" };
        localAnswer = isVi 
          ? "Đang thay đổi trạng thái Chế Độ Lái Xe (Driving HUD) để tối ưu việc di chuyển."
          : "Toggling the Car Driving HUD mode for safe navigation during your commute.";
      }
      // 8. Cache Cleaning
      else if (msgLower.includes("xóa cache") || msgLower.includes("dọn dẹp") || msgLower.includes("clear cache") || msgLower.includes("xóa bộ nhớ đệm") || msgLower.includes("làm sạch")) {
        localAction = { type: "clear_cache", param: "" };
        localAnswer = isVi 
          ? "🧹 Đang tiến hành xóa sạch bộ nhớ đệm hệ thống và dọn dẹp các tệp tạm thời..."
          : "🧹 Purging system storage cache and cleaning up temporary files...";
      }
      // 9. Default conversation fallback explaining rate limits beautifully
      else {
        localAnswer = isVi
          ? `Chào bạn! Máy chủ AI hiện đang chịu tải lượng yêu cầu rất lớn từ các khóa API miễn phí (Rate Limit). Tôi đang tự động bật chế độ Dự phòng Thông minh (Smart Fallback Mode) để duy trì hoạt động tốt nhất.

Bạn hoàn toàn có thể tiếp tục ra lệnh trực tiếp bằng tiếng Việt với các cú pháp sau hoặc click các phím điều khiển tác vụ trực tiếp:
- "Tạo bản tin về [chủ đề]" (Ví dụ: Tạo bản tin về Công nghệ xanh)
- "Tổng hợp tin RSS" để quét và tổng hợp tự động các luồng RSS của bạn.
- "Phát bản tin" để bật/dừng trình nghe nhạc.
- "Về trạm sản xuất" để chuyển sang trang biên soạn kịch bản.
- "Đổi giao diện" hoặc "Lái xe".`
          : `Hi! The AI server is currently handling extreme traffic volumes on free API tiers (Rate Limit). I have entered Smart Fallback Mode to keep your assistant responsive.

You can continue driving actions directly with these quick text triggers or task buttons:
- "Create news about [topic]" (e.g., Create news about Space Exploration)
- "Summarize RSS" to aggregate and summarize your feed subscriptions.
- "Play audio" to toggle current playback.
- "Navigate to production" to change screens.
- "Toggle theme" or "Toggle driving mode".`;
      }

      result = {
        speechResponse: localAnswer,
        answer: localAnswer,
        suggestedTopics: (msgLower.includes("rss") || msgLower === "đọc rss") ? [
          { topic: "Công nghệ", reason: isVi ? "Cập nhật các tin tức công nghệ mới nhất" : "Update latest tech news" },
          { topic: "Kinh doanh", reason: isVi ? "Theo dõi chuyển động thị trường tài chính" : "Follow financial market trends" },
          { topic: "Khoa học", reason: isVi ? "Khám phá các nghiên cứu mới và không gian" : "Explore new research and space" }
        ] : [],
        action: localAction,
        sources: []
      };
    }

    return res.json(result);
  } catch (error: any) {
    console.error("Assistant Chat error:", error);
    const friendlyError = parseGeminiError(error, isVi, false);
    return res.status(500).json({ error: friendlyError });
  }
});

export default router;
