process.env.TZ = 'Asia/Ho_Chi_Minh';
import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import crypto from 'crypto';
import http from "http";
import { WebSocketServer } from "ws";

// ===== THÊM CÁC IMPORT CÒN THIẾU =====
import { GoogleGenAI, Type, LiveServerMessage, Modality } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import podcastRouter from "./src/server/routes/podcast.routes";
import ttsRouter, { loadBroadcastSpeechEngine } from "./src/server/routes/tts.routes";
import newsRouter from "./src/server/routes/news.routes";
import assistantRouter from "./src/server/routes/assistant.routes";
import missionRouter from "./src/server/routes/mission.routes"; // <-- THÊM DÒNG NÀY
import { 
  LOCAL_AUDIO_DIR, 
  getGcsClient, 
  getSupabaseClient, 
  encodeWavHeaderNode,
  callGeminiWithRotation,
  generateWithGroq,
  parseGeminiError,
  fetchWithTimeout,
  SUPABASE_BUCKET_NAME
} from "./src/server/shared";
// import { GoogleGenAI, Type, LiveServerMessage, Modality } from "@google/genai";

// Let me see the file again.


dotenv.config();

export const app = express();
app.set("trust proxy", 1);
const PORT = 3000;

// Whitelist CORS configuration using APP_URL
const allowedOrigins = new Set([
  process.env.APP_URL?.trim(),
  "https://campucastv.onrender.com",
  "https://campucastv2.onrender.com",
  "https://campucastv1.up.railway.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
].filter(Boolean) as string[]);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1") || origin.includes("::1");
    const isWhitelisted = allowedOrigins.has(origin) || allowedOrigins.has(origin + "/");
    if (!isWhitelisted && !isLocalhost && process.env.NODE_ENV === "production") {
       console.log(`[CORS] Rejected origin: ${origin}`);
    }
    if (isLocalhost || isWhitelisted || process.env.NODE_ENV !== "production" || process.env.VITEST) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Integrate helmet security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Ensure we don't break complex SPA media/scripts
  crossOriginEmbedderPolicy: false,
  frameguard: false, // Must be false to allow AI Studio preview iframe to load
}));

// Create rate limiters
const resourceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500,
  message: { error: "Too many API requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiters to resource-intensive routes
app.use("/api/summarize", resourceLimiter);
app.use("/api/voice-query", resourceLimiter);
app.use("/api/assistant-chat", resourceLimiter);
app.use("/api/voice-token", resourceLimiter);

// Apply moderate rate limiter generally to all other /api/* routes
app.use("/api/", apiLimiter);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ===== CACHE VARIABLES =====
let cachedBriefingsInMem: any[] | null = null;
let lastBriefingCacheSyncTime = 0;

// (Gemini/Groq logic moved to shared.ts)

// ==================== SHARING SYSTEM SERVICE ====================
const SHARED_BRIEFINGS_JSON_PATH = path.join(process.cwd(), "shared-briefings.json");
let cachedSharedBriefingsInMem: any[] | null = null;

async function loadSharedBriefingsFromSupabaseAsync(): Promise<any[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return [];
  }
  try {
    let rawData: any = null;
    let downloadErr: any = null;

    try {
      const { data, error } = await supabase.storage.from(SUPABASE_BUCKET_NAME).download("metadata/shared-briefings.json");
      if (!error && data) {
        rawData = data;
      } else {
        downloadErr = error;
      }
    } catch (err: any) {
      downloadErr = err;
    }

    if (rawData) {
      const text = await rawData.text();
      const briefings = JSON.parse(text);
      if (Array.isArray(briefings)) {
        console.log(`[Share - Supabase] Successfully fetched shared briefings from Supabase Storage.`);
        try {
          fs.writeFileSync(SHARED_BRIEFINGS_JSON_PATH, JSON.stringify(briefings, null, 2));
        } catch (e) {}
        return briefings;
      }
    }
    console.log("[Share - Supabase] No shared briefings found or failed to load. Returning empty.");
    return [];
  } catch (err: any) {
    console.error("[Share - Supabase] Failed to download shared briefings:", err.message || err);
    return [];
  }
}

async function saveSharedBriefingsToSupabaseAsync(briefings: any[]) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    console.log("[Share - Supabase] Syncing shared briefings to Supabase Cloud Storage...");
    const fileBuffer = Buffer.from(JSON.stringify(briefings, null, 2));

    const uploadResult = await supabase.storage.from(SUPABASE_BUCKET_NAME).upload("metadata/shared-briefings.json", fileBuffer, {
      contentType: "application/json",
      upsert: true
    });

    if (uploadResult.error) {
      console.warn(`[Share - Supabase] Sync failed: ${uploadResult.error.message}.`);
    } else {
      console.log("[Share - Supabase] Shared briefings synchronized successfully.");
    }
  } catch (err: any) {
    console.error("[Share - Supabase] Unexpected error uploading shared briefings:", err.message || err);
  }
}

async function getSharedBriefings(): Promise<any[]> {
  if (cachedSharedBriefingsInMem) {
    return cachedSharedBriefingsInMem;
  }

  // Try local first
  if (fs.existsSync(SHARED_BRIEFINGS_JSON_PATH)) {
    try {
      const data = fs.readFileSync(SHARED_BRIEFINGS_JSON_PATH, "utf-8");
      cachedSharedBriefingsInMem = JSON.parse(data);
      // Background sync from Supabase
      loadSharedBriefingsFromSupabaseAsync().then((cloudBrefs) => {
        if (cloudBrefs && cloudBrefs.length > 0) {
          cachedSharedBriefingsInMem = cloudBrefs;
        }
      });
      return cachedSharedBriefingsInMem || [];
    } catch (e) {
      console.error("Failed to parse local shared-briefings.json:", e);
    }
  }

  // Try Supabase if local not exists
  const cloudBrefs = await loadSharedBriefingsFromSupabaseAsync();
  cachedSharedBriefingsInMem = cloudBrefs;
  return cloudBrefs;
}

// Share endpoints
app.post("/api/share", async (req, res): Promise<any> => {
  try {
    const { briefing } = req.body;
    if (!briefing || !briefing.id) {
      return res.status(400).json({ error: "No valid briefing provided." });
    }

    const id = briefing.id;
    const briefingsList = await getSharedBriefings();
    
    // Check if it already exists
    const existingIndex = briefingsList.findIndex((item) => item.id === id);
    if (existingIndex > -1) {
      briefingsList[existingIndex] = briefing;
    } else {
      briefingsList.push(briefing);
    }

    // Save locally
    fs.writeFileSync(SHARED_BRIEFINGS_JSON_PATH, JSON.stringify(briefingsList, null, 2));

    // Sync in background to Supabase
    saveSharedBriefingsToSupabaseAsync(briefingsList).catch(err => {
      console.error("Failed to sync shared briefings to Supabase in background:", err);
    });

    return res.json({ success: true, briefingId: id });
  } catch (error: any) {
    console.error("Failed to save shared briefing:", error);
    return res.status(500).json({ error: "Failed to save shared briefing." });
  }
});

app.get("/api/share/:id", async (req, res): Promise<any> => {
  try {
    const { id } = req.params;
    const briefingsList = await getSharedBriefings();
    const briefing = briefingsList.find((item) => item.id === id);
    if (!briefing) {
      return res.status(404).json({ error: "Shared briefing not found." });
    }
    return res.json({ success: true, briefing });
  } catch (error: any) {
    console.error("Failed to get shared briefing:", error);
    return res.status(500).json({ error: "Failed to load shared briefing." });
  }
});

app.get("/api/youtube", async (req, res) => {
  const { q, chart, order, pageToken } = req.query;
  const cookieHeader = req.headers.cookie;
  const sessionId = cookieHeader?.split('; ').find(row => row.startsWith('sessionId='))?.split('=')[1];
  const accessToken = sessionId ? oauthTokens.get(sessionId) : null;
  const apiKey = process.env.YOUTUBE_API_KEY;

  try {
    let url = "https://www.googleapis.com/youtube/v3/";
    if (chart === "mostPopular") {
      url += `videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=VN&maxResults=10`;
    } else if (q) {
      url += `search?part=snippet&q=${encodeURIComponent(q as string)}&type=video&maxResults=10`;
      if (order) {
        url += `&order=${order}`;
      }
    } else {
      return res.status(400).json({ error: "Invalid parameters." });
    }

    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    if (accessToken) {
      url += `&access_token=${accessToken}`;
    } else if (apiKey) {
      url += `&key=${apiKey}`;
    } else {
      return res.status(500).json({ error: "YouTube API not configured." });
    }

    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("YouTube API error:", error);
    res.status(500).json({ error: "Failed to fetch from YouTube API." });
  }
});

// ===== WS VOICE SHORT-LIVED TOKENS & RATE LIMITING =====
const voiceTokens = new Map<string, number>(); // token -> expiryTimestamp
const wsConnectionTracker = new Map<string, { count: number; resetTime: number }>();

// ===== OAUTH ROUTES =====
// In-memory store for tokens (not persistent, for demonstration)
const oauthTokens = new Map<string, string>(); // sessionId -> accessToken

app.get('/api/auth/url', (req, res) => {
  const redirectUri = `${req.protocol}://${req.get('host')}/auth/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    access_type: 'offline',
    prompt: 'consent'
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  res.json({ url: authUrl });
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("No code provided.");
  }
  
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${req.protocol}://${req.get('host')}/auth/callback`,
        grant_type: 'authorization_code'
      })
    });
    
    const tokens = await tokenResponse.json();
    const sessionId = Math.random().toString(36).substring(7); // Simple session ID
    oauthTokens.set(sessionId, tokens.access_token);

    res.cookie('sessionId', sessionId, { httpOnly: true, secure: true, sameSite: 'none' });
    
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).send("Authentication failed.");
  }
});


function isWsRateLimited(ip: string): boolean {
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute
  const maxConnections = 20;

  const record = wsConnectionTracker.get(ip);
  if (!record || now > record.resetTime) {
    wsConnectionTracker.set(ip, { count: 1, resetTime: now + limitWindow });
    return false;
  }

  if (record.count >= maxConnections) {
    return true;
  }

  record.count++;
  return false;
}

// Periodically clean up expired tokens to prevent memory leaks
if (typeof global !== "undefined" && !process.env.VITEST) {
  setInterval(() => {
    const now = Date.now();
    for (const [tok, expiry] of voiceTokens.entries()) {
      if (now > expiry) {
        voiceTokens.delete(tok);
      }
    }
  }, 60 * 1000);
}

// REST endpoint to retrieve a short-lived voice connection token
app.post("/api/voice-token", (req, res) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiry = Date.now() + 5 * 60 * 1000; // valid for 5 minutes
  voiceTokens.set(token, expiry);
  res.json({ token });
});

// 1. Summarize
app.post("/api/summarize", async (req, res): Promise<any> => {
  const { content, preferences } = req.body;
  const language = preferences?.language || req.body?.language || "en";
  const isVi = language === "vi" || language === "bilingual";

  console.log("[Summarize] ==== LANGUAGE DEBUG ====");
  console.log("[Summarize] language received:", language);
  console.log("[Summarize] isVi:", isVi);
  console.log("[Summarize] Full preferences:", JSON.stringify(preferences, null, 2));

  try {
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: "No news articles content provided." });
    }

    const targetDuration = preferences?.targetDuration || "medium";
    const tone = preferences?.tone || "conversational";
    const focus = preferences?.focus || "general overview";
    const commuteType = preferences?.commuteType || "driving";
    const customInstructions = preferences?.customInstructions || "";
    const aiMode = preferences?.aiMode || "rewrite";

    let aiModeInstructions = "";
    if (language === "vi") {
      if (aiMode === "rewrite") {
        aiModeInstructions = `
[AI MODE: REWRITE]
- Mục tiêu chính: Viết lại (Rewrite) toàn bộ tin tức một cách mạch lạc, lôi cuốn và mượt mà nhất. Đảm bảo ngôn từ lưu loát, tự nhiên như lời nói trực tiếp.
- Hãy tập trung vào việc làm cho câu từ trở nên hấp dẫn, sử dụng các phép liên kết câu uyển chuyển và từ vựng lôi cuốn người nghe.`;
      } else if (aiMode === "fact_check") {
        aiModeInstructions = `
[AI MODE: FACT CHECK]
- Mục tiêu chính: Vừa tổng hợp tin tức vừa thực hiện nhiệm vụ kiểm chứng sự thật (fact-checking). 
- Trong mỗi chương, nếu có bất kỳ thông tin nào còn mơ hồ, phóng đại, gây tranh cãi hoặc cần làm rõ, bạn PHẢI phân tích, kiểm chứng và nêu rõ sự thật dựa trên kiến thức của bạn, đính chính hoặc cung cấp thêm thông tin cập nhật một cách khách quan và lịch sự trong lời bình kịch bản ('scriptText').`;
      } else if (aiMode === "detect_duplicate") {
        aiModeInstructions = `
[AI MODE: DETECT DUPLICATE]
- Mục tiêu chính: Phân tích kỹ các nguồn tin và phát hiện các chi tiết hoặc sự kiện trùng lặp.
- Hãy gom nhóm chúng lại và loại bỏ hoàn toàn các thông tin thừa thãi hoặc trùng lặp giữa các bài báo thô. Tập trung biên kịch ('scriptText') độc quyền vào việc tổng hợp và trình bày các khía cạnh độc nhất, mới mẻ nhất của từng câu chuyện để người nghe không bị nghe lặp lại một sự việc.`;
      } else if (aiMode === "podcast_style") {
        aiModeInstructions = `
[AI MODE: PODCAST STYLE]
- Mục tiêu chính: Biên soạn kịch bản theo phong cách hai người dẫn chương trình đối thoại (Podcast Co-hosts) cực kỳ sống động và tự nhiên.
- Bạn BẮT BUỘC phải tạo ra kịch bản đối thoại bằng cách trả về mảng 'segments' trong từng chapter.
- Mỗi segment có 'speakerId' nhận giá trị "host_a" (cho người dẫn chương trình chính) hoặc "host_b" (cho người dẫn cùng) và 'text' là câu thoại nói ra của người đó.
- Trường 'scriptText' của chapter vẫn cần chứa toàn bộ văn bản đối thoại gộp lại để hiển thị đầy đủ kịch bản, nhưng 'segments' sẽ được tách riêng để tổng hợp giọng đọc khác nhau cho từng host.
- Sử dụng các cụm từ tương tác qua lại thân mật (ví dụ: "Chào người bạn đồng hành", "Bạn có biết điều này không?", "Đúng vậy, tôi nghĩ rằng..."), đưa ra bình luận hóm hỉnh cá nhân và đặt câu hỏi mở để thảo luận tin tức giữa hai người, tạo cảm giác như một buổi nói chuyện podcast trực tiếp thực sự.`;
      } else if (aiMode === "morning_style") {
        aiModeInstructions = `
[AI MODE: MORNING STYLE]
- Mục tiêu chính: Phong cách chào buổi sáng ngập tràn năng lượng tích cực, truyền động lực mạnh mẽ đầu ngày.
- Hãy tích hợp các lời chúc buổi sáng tươi đẹp, nhắc nhở thời tiết nhẹ nhàng và khơi dậy hứng khởi, nụ cười vui tươi cho ngày làm việc mới của người nghe. Giữ nhịp điệu rạng rỡ, phấn khởi xuyên suốt bản tin.`;
      } else if (aiMode === "driving_style") {
        aiModeInstructions = `
[AI MODE: DRIVING STYLE]
- Mục tiêu chính: Chế độ Lái xe tập trung cao độ. Ngắn gọn, súc tích, đi thẳng vào ý chính và cực kỳ dễ hiểu khi người nghe đang bận tay lái trên đường.
- Hãy lồng ghép tinh tế các lời nhắc nhở an toàn giao thông thiết thực (ví dụ: khuyên lái xe tập trung nhìn đường, chú ý gương chiếu hậu, giữ khoảng cách an toàn, không sử dụng điện thoại...) phù hợp với tuyến đường di chuyển của họ.`;
      } else if (aiMode === "student_mode") {
        aiModeInstructions = `
[AI MODE: STUDENT MODE]
- Mục tiêu chính: Chế độ Học sinh/Sinh viên - Đóng vai người thầy hoặc người bạn học thông thái, tận tâm.
- Với mỗi chương tin tức, hãy chủ động giải thích sâu thêm các thuật ngữ khoa học, kinh tế, công nghệ phức tạp hoặc khái niệm học thuật xuất hiện trong bài viết bằng ngôn ngữ cực kỳ bình dân, dễ hiểu, giúp mở rộng kiến thức bổ trợ bổ ích cho người nghe trẻ tuổi.`;
      } else if (aiMode === "executive_mode") {
        aiModeInstructions = `
[AI MODE: EXECUTIVE MODE]
- Mục tiêu chính: Chế độ Giám đốc/Lãnh đạo. Báo cáo vĩ mô cô đọng, đi thẳng vào các con số, số liệu chính, chỉ số tài chính/kinh tế quan trọng và tác động chiến lược của tin tức đối với doanh nghiệp và thị trường toàn cầu.
- Loại bỏ hoàn toàn các yếu tố rườm rà, kể chuyện dông dài hay từ ngữ cảm xúc thái quá. Giữ phong cách chuyên nghiệp, phân tích sắc bén và trực diện.`;
      } else if (aiMode === "english_learning_mode") {
        aiModeInstructions = `
[AI MODE: ENGLISH LEARNING MODE]
- Mục tiêu chính: Chế độ học tiếng Anh dành cho người học ngoại ngữ.
- Ở CUỐI MỖI CHƯƠNG trong kịch bản 'scriptText', bạn bắt buộc phải tạo riêng một phần nhỏ có tiêu đề rực rỡ "English Corner" hoặc "Góc Tiếng Anh". Hãy chọn ra 2-3 từ vựng hoặc mẫu câu tiếng Anh cốt lõi, hữu ích vừa xuất hiện trong bản tin để giải nghĩa, kèm theo ví dụ đặt câu thực tế bằng cả tiếng Anh và tiếng Việt để người nghe học tập ngay trên đường đi làm.`;
      }
    } else if (language === "bilingual") {
      if (aiMode === "rewrite") {
        aiModeInstructions = `
[AI MODE: REWRITE]
- Primary goal: Seamlessly rewrite (Rewrite) the entire news in a beautiful, natural bilingual layout. Ensure highly fluent transitions, cohesive structure, and expressive bilingual pairing using the slash (/) format.`;
      } else if (aiMode === "fact_check") {
        aiModeInstructions = `
[AI MODE: FACT CHECK]
- Primary goal: Conduct rigorous, objective bilingual fact-checking on the raw material. 
- In each chapter, if any claim or detail seems exaggerated, controversial, or vague, make sure to address, analyze, and clarify it in bilingual pairs in the 'scriptText', presenting accurate information neutrally for the listener.`;
      } else if (aiMode === "detect_duplicate") {
        aiModeInstructions = `
[AI MODE: DETECT DUPLICATE]
- Primary goal: Detect and filter duplicate events or redundant descriptions among the raw news feeds.
- Consolidate similar news into a single, clean chapter, and present unique facts only in bilingual format. Avoid repetitive sentence structures.`;
      } else if (aiMode === "podcast_style") {
        aiModeInstructions = `
[AI MODE: PODCAST STYLE]
- Primary goal: Compose the script as a charming dialogue between two bilingual podcast co-hosts.
- You MUST generate co-host dialogue by populating the 'segments' array in each chapter.
- Each segment has 'speakerId' ("host_a" or "host_b") and 'text' as the spoken text.
- The 'scriptText' of the chapter should still contain the full merged conversation for UI rendering, but 'segments' are split for multi-speaker TTS synthesis.
- Use cozy, casual back-and-forth remarks, clever jokes, and conversational cues (e.g., "What's your take on this? / Bạn nghĩ sao về điều này?", "That's mind-blowing! / Thật là kinh ngạc!") in standard bilingual slash formatting to keep it super interactive.`;
      } else if (aiMode === "morning_style") {
        aiModeInstructions = `
[AI MODE: MORNING STYLE]
- Primary goal: Upbeat, warm, and highly motivational morning-show energy.
- Integrate delightful morning greetings, friendly weather-related comments, and positive bilingual wishes to give the listener an exceptional and radiant start to their day.`;
      } else if (aiMode === "driving_style") {
        aiModeInstructions = `
[AI MODE: DRIVING STYLE]
- Primary goal: Dedicated driving mode. Focus on clear, highly scannable, and compact bilingual expressions.
- Weave in thoughtful bilingual road safety warnings (e.g., "Keep your eyes on the road. / Hãy luôn tập trung nhìn đường.", "Stay safe. / Hãy luôn lái xe an toàn.") tailored to their current commute route.`;
      } else if (aiMode === "student_mode") {
        aiModeInstructions = `
[AI MODE: STUDENT MODE]
- Primary goal: High-value educational student mode.
- In each chapter, act as a friendly bilingual mentor, explaining complex economic, scientific, or technical terms in simple bilingual pairs, ensuring that student listeners expand their vocabulary and general knowledge effortlessly.`;
      } else if (aiMode === "executive_mode") {
        aiModeInstructions = `
[AI MODE: EXECUTIVE MODE]
- Primary goal: High-level corporate/macro executive briefing in bilingual format.
- Cut straight to key figures, business metrics, and structural/strategic impacts. Maintain an extremely professional, executive, and direct tone without any emotional fluff or unnecessary storytelling.`;
      } else if (aiMode === "english_learning_mode") {
        aiModeInstructions = `
[AI MODE: ENGLISH LEARNING MODE]
- Primary goal: Highly specialized English Learning Mode.
- In this bilingual mode, at the end of every chapter's 'scriptText', you must include a specific, engaging 'English Corner / Góc Học Tiếng Anh' section. Pick 2-3 essential English terms or key idiomatic expressions used in the chapter, detail their definitions in Vietnamese, and provide practical bilingual examples.`;
      }
    } else { // English
      if (aiMode === "rewrite") {
        aiModeInstructions = `
[AI MODE: REWRITE]
- Primary goal: Elegantly rewrite (Rewrite) the entire news script to be highly engaging, eloquent, cohesive, and perfectly optimized for smooth spoken audio narration. Avoid stiff or repetitive phrases.`;
      } else if (aiMode === "fact_check") {
        aiModeInstructions = `
[AI MODE: FACT CHECK]
- Primary goal: Carry out objective and professional fact-checking of the source text.
- In each chapter, point out any claims or statistics that are controversial, unverified, or misleading, and offer accurate background context, verified details, or neutral corrections within the spoken 'scriptText'.`;
      } else if (aiMode === "detect_duplicate") {
        aiModeInstructions = `
[AI MODE: DETECT DUPLICATE]
- Primary goal: Analyze news feeds for repetitive events or duplicated articles.
- Group similar topics together and eliminate any redundant or wordy sentences. Focus solely on presenting the most distinct, unique, and up-to-date angles of each story in the final script.`;
      } else if (aiMode === "podcast_style") {
        aiModeInstructions = `
[AI MODE: PODCAST STYLE]
- Primary goal: Craft the script as a natural, engaging conversation between two friendly podcast co-hosts.
- You MUST generate co-host dialogue by populating the 'segments' array in each chapter.
- Each segment has 'speakerId' ("host_a" or "host_b") and 'text' as the spoken text.
- The 'scriptText' of the chapter should still contain the full merged conversation for UI rendering, but 'segments' are split for multi-speaker TTS synthesis.
- Include organic dialogue transitions, polite agreements or witty banter, casual side-narratives, and thought-provoking questions to make the audio feel 100% like a real live-recorded podcast talk.`;
      } else if (aiMode === "morning_style") {
        aiModeInstructions = `
[AI MODE: MORNING STYLE]
- Primary goal: Radiant, high-energy morning radio show style.
- Start with bright morning greetings, enthusiastic weather tie-ins, and highly motivating remarks to lift the listener's spirits and energize them for the workday ahead.`;
      } else if (aiMode === "driving_style") {
        aiModeInstructions = `
[AI MODE: DRIVING STYLE]
- Primary goal: Premium hands-free driving mode. Write short, crystal-clear, and punchy sentences.
- Weave in helpful road safety recommendations (e.g., stay focused, keep a safe distance, stay alert on your specific commute route) seamlessly into the spoken kịch bản.`;
      } else if (aiMode === "student_mode") {
        aiModeInstructions = `
[AI MODE: STUDENT MODE]
- Primary goal: Interactive and helpful student learning mode.
- In each news story, act as an educational companion. Clearly unpack and explain any complex terms, scientific concepts, or technical vocabulary in highly accessible, simple English, making the commute educational.`;
      } else if (aiMode === "executive_mode") {
        aiModeInstructions = `
[AI MODE: EXECUTIVE MODE]
- Primary goal: Polished, concise executive-level macroeconomic briefing.
- Focus strictly on key stats, quantitative metrics, market implications, and strategic outcomes. Keep the delivery formal, objective, and entirely devoid of fluff, fillers, or elaborate narratives.`;
      } else if (aiMode === "english_learning_mode") {
        aiModeInstructions = `
[AI MODE: ENGLISH LEARNING MODE]
- Primary goal: English language learning focus for ESL or general learners.
- At the end of every chapter's spoken 'scriptText', create an explicit 'English Vocabulary Highlight' segment. Call out 2-3 advanced words or useful expressions from the news text, explaining their exact meanings clearly, and giving practical example sentences.`;
      }
    }

    const lengthGuidelines =
      targetDuration === "short"
        ? "Keep it brief. Write an introduction, exactly 1-2 concise chapters with 200-300 characters each, and a short outro. Total length should be around 1-2 minutes of speech."
        : targetDuration === "long"
        ? "Deep dive. Write an introduction, 4-5 core chapters with 350-450 characters each, and an outro. Total length should be deep and rich, around 5-7 minutes of speech."
        : "Standard. Write an introduction, 2-3 core chapters with 300-400 characters each, and an outro. Total length should be around 3-4 minutes of speech.";

    let languageInstructions = "";
    if (language === "vi") {
      languageInstructions = `
LANGUAGE RULE: The entire report MUST be generated in VIETNAMESE (Tiếng Việt).
- Provide warm greetings, friendly transitions, and professional sign-offs in natural, elegant, standard spoken Vietnamese.
- For English technical acronyms or terms, explain them naturally in Vietnamese or spell out how they are pronounced if necessary.
- Ensure titles, topics, scriptText, summaryBullets, and conclusion are 100% in Vietnamese.`;
    } else if (language === "bilingual") {
      languageInstructions = `
LANGUAGE RULE: The entire report MUST be written in a graceful, engaging BILINGUAL (English / Vietnamese) format.
- In 'introduction', 'scriptText' of each chapter, and 'conclusion': Every main concept or sentence should first be spoken in English and then immediately followed by its friendly, natural translation in Vietnamese separated by a slash (/) (for example: "Good morning dynamic commuters! Today looks like a rainy day in Hanoi, so drive safely. / Chào buổi sáng quý thính giả năng động! Hôm nay dự báo sẽ là một ngày mưa tại Hà Nội, vì vậy hãy lái xe thật an toàn nhé.").
- Keep the alternating flow extremely smooth and natural for speech synthesis.
- Each chapter's 'topic' and the main 'title' should use bilingual slash/pipe formatting (e.g. "Tech Breakthroughs / Những đột phá Công nghệ" or "Space Discovery / Khám phá Không gian").
- The 'summaryBullets' list items should also be presented in bilingual pairs (e.g. "Quantum chip uses 40 percent less power. / Chip lượng tử sử dụng ít năng lượng hơn 40 phần trăm.").`;
    } else {
      languageInstructions = `
LANGUAGE RULE: The entire report MUST be generated in ENGLISH.
- Maintain native, polished English phrasing throughout all fields.
- Avoid any Vietnamese words, Vietnamese phrases, or Vietnamese characters in the output.`;
    }

    // ===== LOG 2: Kiểm tra languageInstructions =====
    console.log("[Summarize] languageInstructions (first 150 chars):", languageInstructions.substring(0, 150));
    console.log("[Summarize] languageInstructions contains 'VIETNAMESE'? :", languageInstructions.includes("VIETNAMESE"));

    let systemPrompt = "";
    if (language === "vi") {
      systemPrompt = `You are an elite, highly professional veteran radio broadcast host, a smart route assistant, and the premium personal briefing anchor for CommuteCast. 
Your tone must reflect a warm, authoritative, and deeply engaging broadcast anchor who naturally connects with listeners, rather than a robotic or flat text-to-speech engine. 

${languageInstructions}

[AI MODE INSTRUCTION]
${aiModeInstructions}

IMPORTANT GUIDELINES & SCRIPT STRUCTURE:
1. The script fields MUST be written EXACTLY as they should be spoken out loud by a seasoned news anchor.
2. NHÂN VẬT & PHONG THÁI PHÁT THANH VIÊN KỲ CỰU (VIETNAMESE ANCHOR ROLE):
   - Ngôn từ tự nhiên, lưu loát, lôi cuốn, mang phong thái của một biên tập viên thời sự cao cấp dẫn bản tin trực tiếp.
   - Tránh cách hành văn khô khan, rập khuôn hay máy móc. Hãy sử dụng từ ngữ kết nối tự nhiên giữa các câu (như "Thưa quý vị", "Tiếp tục bản tin", "Đáng chú ý", "Quay trở lại với", "Kính chúc quý vị một ngày mới").
   - Cách sắp xếp câu từ rõ ràng, rành mạch để khi đọc lên tạo cảm giác trò chuyện thân thiện, đáng tin cậy nhưng vẫn đầy cuốn hút, giữ chân người nghe suốt hành trình di chuyển.
3. KHỬ TẠP ÂM & KHÔNG GIAN THỞ (PUNCTUATION & PACING FOR STUDIO QUALITY):
   - Viết các câu ngắn, rõ nghĩa, súc tích (tối đa 15-20 từ mỗi câu).
   - Sử dụng dấu phẩy (,), dấu chấm phẩy (;) và dấu chấm (.) một cách có tính toán nghệ thuật để định hình nhịp điệu ngắt nghỉ tự nhiên cho giọng đọc, giúp người nghe dễ tiếp thu thông tin mà không cảm thấy dồn dập hay hụt hơi.
   - Tuyệt đối KHÔNG sử dụng ký tự đặc biệt, dấu sao (*), dấu gạch ngang (-) hay định dạng markdown trong các trường "introduction", "scriptText", và "conclusion". Hãy viết hẳn bằng chữ chữ số hoặc ký hiệu nếu muốn đọc chuẩn (ví dụ: dùng "phần trăm" thay cho "%", "đô la" thay cho "$", "và" thay cho "&").
4. "introduction": Lời chào mừng nồng ấm, lôi cuốn chuẩn phong cách phát thanh. Bạn PHẢI tích hợp mượt mà thông tin thời tiết thực tế/giả định và tình trạng giao thông thời gian thực tùy theo loại hình di chuyển (${commuteType}) để đưa ra những lời cảnh báo giao thông an toàn và hữu ích trước khi bắt đầu hành trình.
5. "chapters": Danh sách các chương nội dung hấp dẫn dựa trên tin tức thô.
   - "topic": Tiêu đề chương ngắn gọn, giật gân, cuốn hút.
   - "scriptText": Kịch bản nói chi tiết, truyền cảm, nhịp điệu nhả chữ linh hoạt, nhấn nhá chuyên nghiệp.
   - "summaryBullets": 2-3 ý tóm tắt ngắn gọn, trực quan để hiển thị trên màn hình ứng dụng.
6. "conclusion": Lời kết đầy cảm xúc, chúc thượng lộ bình an, kết hợp các mẹo an toàn giao thông thông minh phù hợp với phong cách (${tone}) và loại hình di chuyển (${commuteType}).
7. Tùy chỉnh nội dung tóm tắt theo yêu cầu tiêu điểm: "${focus}".
8. Tuân thủ độ dài hướng dẫn: ${lengthGuidelines}
9. Áp dụng hướng dẫn riêng từ người dùng nếu có: "${customInstructions}"`;
    } else if (language === "bilingual") {
      systemPrompt = `You are an elite, highly professional veteran radio broadcast host, a smart route assistant, and the premium personal briefing anchor for CommuteCast. 
Your tone must reflect a warm, authoritative, and deeply engaging broadcast anchor who naturally connects with listeners, rather than a robotic or flat text-to-speech engine. 

${languageInstructions}

[AI MODE INSTRUCTION]
${aiModeInstructions}

IMPORTANT GUIDELINES & SCRIPT STRUCTURE:
1. The script fields MUST be written EXACTLY as they should be spoken out loud by a seasoned news anchor.
2. BILINGUAL RADIO ANCHOR ROLE:
   - Act as an elite, bilingual radio anchor. Ensure a high-quality, professional, and engaging delivery.
   - Smoothly transition between English and Vietnamese using natural phrases (e.g., "And now, moving on to...", "Tiếp tục chương trình...", "Now let's dive into...", "Quay trở lại với...").
   - The rhythm must feel like a friendly, conversational co-host who is presenting content in English and immediately explaining it in Vietnamese for language learners and international commuters.
3. KHỬ TẠP ÂM & KHÔNG GIAN THỞ (PUNCTUATION & PACING FOR STUDIO QUALITY):
   - Viết các câu ngắn, rõ nghĩa, súc tích (tối đa 15-20 từ mỗi câu).
   - Sử dụng dấu phẩy (,), dấu chấm phẩy (;) và dấu chấm (.) một cách có tính toán nghệ thuật để định hình nhịp điệu ngắt nghỉ tự nhiên cho giọng đọc, giúp người nghe dễ tiếp thu thông tin mà không cảm thấy dồn dập hay hụt hơi.
   - Tuyệt đối KHÔNG sử dụng ký tự đặc biệt, dấu sao (*), dấu gạch ngang (-) hay định dạng markdown trong các trường "introduction", "scriptText", và "conclusion". Hãy viết hẳn bằng chữ chữ số hoặc ký hiệu nếu muốn đọc chuẩn (ví dụ: dùng "phần trăm" thay cho "%", "đô la" thay cho "$", "và" thay cho "&").
4. "introduction": Lời chào mừng nồng ấm, lôi cuốn chuẩn phong cách phát thanh song ngữ. Bạn PHẢI tích hợp mượt mà thông tin thời tiết thực tế/giả định và tình trạng giao thông thời gian thực tùy theo loại hình di chuyển (${commuteType}) để đưa ra những lời cảnh báo giao thông an toàn và hữu ích trước khi bắt đầu hành trình.
5. "chapters": Danh sách các chương nội dung hấp dẫn dựa trên tin tức thô.
   - "topic": Tiêu đề chương ngắn gọn, giật gân, cuốn hút (sử dụng định dạng song ngữ, ví dụ "Tech Breakthroughs / Đột phá Công nghệ").
   - "scriptText": Kịch bản nói chi tiết bằng định dạng song ngữ (Mỗi câu Tiếng Anh đi kèm Tiếng Việt qua dấu gạch chéo /).
   - "summaryBullets": 2-3 ý tóm tắt ngắn gọn bằng định dạng song ngữ.
6. "conclusion": Lời kết đầy cảm xúc bằng định dạng song ngữ, chúc thượng lộ bình an, kết hợp các mẹo an toàn giao thông thông minh phù hợp với phong cách (${tone}) và loại hình di chuyển (${commuteType}).
7. Tùy chỉnh nội dung tóm tắt theo yêu cầu tiêu điểm: "${focus}".
8. Tuân thủ độ dài hướng dẫn: ${lengthGuidelines}
9. Áp dụng hướng dẫn riêng từ người dùng nếu có: "${customInstructions}"`;
    } else {
      systemPrompt = `You are an elite, highly professional veteran radio broadcast host, a smart route assistant, and the premium personal briefing anchor for CommuteCast. 
Your tone must reflect a warm, authoritative, and deeply engaging broadcast anchor who naturally connects with listeners, rather than a robotic or flat text-to-speech engine. 

${languageInstructions}

[AI MODE INSTRUCTION]
${aiModeInstructions}

IMPORTANT GUIDELINES & SCRIPT STRUCTURE:
1. The script fields MUST be written EXACTLY as they should be spoken out loud by a seasoned news anchor.
2. ELITE ENGLISH RADIO ANCHOR ROLE:
   - Act as an elite, highly professional veteran radio broadcaster or podcast host.
   - Use natural, fluid, and engaging spoken English phrases (e.g., "Good morning folks", "Moving on to our next story", "In other news", "That's all for today, stay safe on the road").
   - Write in a friendly yet authoritative manner that keeps listeners engaged throughout their commute.
3. PUNCTUATION & PACING FOR STUDIO QUALITY:
   - Write short, clear, and concise sentences (max 15-20 words per sentence).
   - Use commas (,), semicolons (;), and periods (.) intentionally to format natural pauses and breathing room for speech synthesis.
   - Strictly DO NOT use any special characters, asterisks (*), hyphens (-), or markdown formatting inside the "introduction", "scriptText", and "conclusion" fields. Spell out symbols or numbers to ensure clean reading (e.g., use "percent" instead of "%", "dollars" instead of "$", "and" instead of "&").
4. "introduction": A warm, engaging radio-style welcome greeting. You MUST seamlessly integrate real/hypothetical weather data and real-time traffic updates based on the commute style (${commuteType}) to provide helpful road safety advice before starting the journey.
5. "chapters": A list of engaging chapters derived from the raw news content.
   - "topic": Snappy, headline-style chapter title in English.
   - "scriptText": Detailed, highly expressive spoken script with professional pacing and emotional depth.
   - "summaryBullets": 2-3 concise bullet points summarizing the main facts to display on-screen.
6. "conclusion": A heartfelt sign-off and outro wishing safe travels, incorporating smart traffic safety tips appropriate for the tone (${tone}) and commute type (${commuteType}).
7. Tailor the content focus according to: "${focus}".
8. Adhere to the duration guidelines: ${lengthGuidelines}
9. Apply any custom user instructions if provided: "${customInstructions}"`;
    }

    // ===== LOG 3: Kiểm tra systemPrompt =====
    console.log("[Summarize] systemPrompt (first 400 chars):", systemPrompt.substring(0, 400));
    console.log("[Summarize] systemPrompt includes 'VIETNAMESE'? :", systemPrompt.includes("VIETNAMESE"));

    const promptText = `Generate a news broadcast report from the following raw news materials:\n\n${content}`;

    // 1. LẤY THỜI TIẾT MIỄN PHÍ
    let weatherData = "No weather data available.";
    if (preferences?.locationName) {
      try {
        const weatherRes = await fetchWithTimeout(`https://wttr.in/${encodeURIComponent(preferences.locationName)}?format=3`, {}, 4000);
        if (weatherRes.ok) {
          weatherData = await weatherRes.text();
          weatherData = weatherData.trim();
        }
      } catch (e) {
        console.warn("Weather fetch failed, skipping...", e);
      }
    }

    // 2. CHÈN THÔNG TIN VÀO PROMPT
    let systemPromptEnhanced = "";
    if (language === "vi" || language === "bilingual") {
      systemPromptEnhanced = `${systemPrompt}\nThông tin thời tiết hiện tại: ${weatherData}. \nTuyến đường người dùng di chuyển: ${preferences?.commuteRoute || "Không rõ"}. Hãy chủ động dùng công cụ tìm kiếm tích hợp (Google Search Tool) để quét tình trạng giao thông thực tế tại tuyến đường này nếu có tin tức mới.`;
    } else {
      systemPromptEnhanced = `${systemPrompt}\nCurrent weather information: ${weatherData}. \nUser commute route: ${preferences?.commuteRoute || "Unknown"}. Please proactively use the integrated Google Search Tool to scan for real-time traffic updates along this route if there is breaking news.`;
    }

    const hasGroq = !!process.env.GROQ_API_KEY;
    let outputText = "";

    // BACKDOOR FOR E2E TESTING
    if (customInstructions === 'MOCK_QUOTA_ERROR') {
      const err = new Error('429 Resource Exhausted: Quota exceeded.');
      (err as any).status = 429;
      throw err;
    }

    if (hasGroq) {
      console.log("[CommuteCast] Groq API setup detected! Routing text summarization to Llama 3.3...");
      const schemaPrompt = `
You must respond with a JSON object containing these keys exactly:
- "title" (string): A catchy report title
- "introduction" (string): A warm, speaker-ready welcome message. Keeps the user hooked.
- "chapters" (array): array of chapter objects. Each chapter must have:
    - "topic" (string): snappy chapter theme title
    - "scriptText" (string): continuous spoken script written only with read-out-loud standard phrasing. No asterisks, stars, blocks, or lists.
    - "summaryBullets" (array of strings): 2-3 short, punchy bullet points to display in the UI as visual takeaways.
    - "segments" (array, optional): only for PODCAST STYLE, an array of objects:
        - "speakerId" (string): "host_a" or "host_b"
        - "text" (string): literal speech of this turn
- "conclusion" (string): A charming, friendly closing remark with safe-travel wishes suited for their commute.

Keep scriptText very natural for speaking. Do not include markdown bold or headers inside fields.`;
      outputText = await generateWithGroq(systemPromptEnhanced + "\n" + schemaPrompt, promptText, true);
    } else {
      console.log("[CommuteCast] GROQ_API_KEY not found. Using standard Gemini model for summarization.");
      const response = await callGeminiWithRotation((ai) =>
        ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptText,
          config: {
            systemInstruction: systemPromptEnhanced,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "A catchy report title" },
                introduction: { type: Type.STRING, description: "A warm, speaker-ready welcome message. Keeps the user hooked." },
                chapters: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      topic: { type: Type.STRING, description: "Snappy chapter theme title" },
                      scriptText: { type: Type.STRING, description: "Continuous spoken script written only with read-out-loud standard phrasing. No asterisks, stars, blocks, or lists." },
                      summaryBullets: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 short, punchy, bullet points to display in the UI as visual takeaways." },
                      segments: {
                        type: Type.ARRAY,
                        description: "Optional conversational dialog segments between co-hosts (Host A and Host B). Only generate this when AI MODE is PODCAST STYLE.",
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            speakerId: { type: Type.STRING, description: "speaker identifier: host_a or host_b" },
                            text: { type: Type.STRING, description: "Literal speech text of this speaker turn" }
                          },
                          required: ["speakerId", "text"]
                        }
                      }
                    },
                    required: ["topic", "scriptText", "summaryBullets"]
                  }
                },
                conclusion: { type: Type.STRING, description: "A charming, friendly closing remark with safe-travel wishes suited for their commute." }
              },
              required: ["title", "introduction", "chapters", "conclusion"]
            }
          }
        })
      );
      outputText = response.text || "";
    }

    // ===== LOG 4: Kiểm tra kết quả từ model =====
    console.log("[Summarize] outputText (first 500 chars):", outputText.substring(0, 500));
    console.log("[Summarize] outputText contains Vietnamese diacritics? (check 200 chars):", outputText.substring(0, 200));

    if (!outputText || outputText.trim() === "") {
      throw new Error("Empty response received from content generation model.");
    }

    const payload = JSON.parse(outputText);
    return res.json(payload);
  } catch (error: any) {
    console.error("Summarization error:", error);
    const friendlyError = parseGeminiError(error, isVi, false);
    return res.status(500).json({ error: friendlyError });
  }
});


// ================== ENDPOINT TTS CHÍNH (CẬP NHẬT) ==================
// (TTS routes removed)

// 3. Generate news
// (Moved to news.routes.ts)


// 5. Parse RSS Feed URL
// (Moved to news.routes.ts)

// ==================== PODCAST AND STORAGE ====================
// (Moved to podcast.routes.ts)

app.post("/api/prepare-wav", (req, res): any => {
  try {
    const { title, chunksJson } = req.body;
    if (!chunksJson) return res.status(400).send("No audio chunks provided.");
    const chunks: string[] = JSON.parse(chunksJson);
    if (!chunks || chunks.length === 0) return res.status(400).send("No audio chunks provided.");

    const arrayBuffers = chunks.map(chunk => Buffer.from(chunk, "base64"));
    
    const silenceBuffer = Buffer.alloc(48000);
    const finalChunks: Buffer[] = [];
    arrayBuffers.forEach((buf, idx) => {
      finalChunks.push(buf);
      if (idx < arrayBuffers.length - 1) {
        finalChunks.push(silenceBuffer);
      }
    });

    const concatenatedPCM = Buffer.concat(finalChunks);
    const wavBuffer = encodeWavHeaderNode(concatenatedPCM, 24000);

    const safeTitle = (title || "CommuteSummary").replace(/[^a-zA-Z0-9_-]/g, "_");
    const tempFilename = `temp_${Date.now()}_${uuidv4().substring(0, 8)}_${safeTitle}.wav`;
    const tempFilePath = path.join(LOCAL_AUDIO_DIR, tempFilename);
    fs.writeFileSync(tempFilePath, wavBuffer);

    try {
      const files = fs.readdirSync(LOCAL_AUDIO_DIR);
      const now = Date.now();
      for (const file of files) {
        if (file.startsWith("temp_") && file.endsWith(".wav")) {
          const filePath = path.join(LOCAL_AUDIO_DIR, file);
          const stat = fs.statSync(filePath);
          if (now - stat.mtimeMs > 10 * 60 * 1000) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (cleanupErr) {
      console.warn("Error cleaning up temp files:", cleanupErr);
    }

    return res.json({
      success: true,
      downloadUrl: `/api/local-podcasts/${tempFilename}?download=true`
    });
  } catch (err: any) {
    console.error("Error preparing WAV download:", err);
    res.status(500).send("Failed to prepare WAV download.");
  }
});

app.post("/api/download-wav-file", (req, res): any => {
  try {
    const { title, chunksJson } = req.body;
    if (!chunksJson) return res.status(400).send("No audio chunks provided.");
    const chunks: string[] = JSON.parse(chunksJson);
    if (!chunks || chunks.length === 0) return res.status(400).send("No audio chunks provided.");

    const arrayBuffers = chunks.map(chunk => Buffer.from(chunk, "base64"));
    
    const silenceBuffer = Buffer.alloc(48000);
    const finalChunks: Buffer[] = [];
    arrayBuffers.forEach((buf, idx) => {
      finalChunks.push(buf);
      if (idx < arrayBuffers.length - 1) {
        finalChunks.push(silenceBuffer);
      }
    });

    const concatenatedPCM = Buffer.concat(finalChunks);
    const wavBuffer = encodeWavHeaderNode(concatenatedPCM, 24000);

    const safeTitle = (title || "CommuteSummary").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${safeTitle}_Audio_24khz.wav`;

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", wavBuffer.length);
    res.send(wavBuffer);
  } catch (err: any) {
    console.error("Error generating WAV download:", err);
    res.status(500).send("Failed to generate WAV download.");
  }
});

// ==================== SUPABASE CONFIG ENDPOINT ====================
// Moved into serveApp()


// ==================== CRITICAL API ROUTES (Register early) ====================
app.use("/api", podcastRouter);
app.use("/api", ttsRouter);
app.use("/api", newsRouter);
app.use("/api", assistantRouter);
app.use("/api/missions", missionRouter); // <-- THÊM DÒNG NÀY
app.get("/api/health", (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    status: "healthy",
    database: "connected",
    supabase: "configured",
    version: "4.11.0-RC" // Increment version for Mission Continuity Platform
  });
});

app.get("/api/db-config", (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const rawUrl = (process.env.SUPABASE_URL || "").trim();
  const rawKey = (process.env.SUPABASE_ANON_KEY || "").trim();

  const DEFAULT_SUPABASE_URLS = [
    "https://your-project.supabase.co",
    "https://example.supabase.co",
    ""
  ];
  const DEFAULT_ANON_KEYS = [
    "your-anon-key",
    ""
  ];

  const isDefaultUrl = DEFAULT_SUPABASE_URLS.includes(rawUrl);
  const isDefaultKey = DEFAULT_ANON_KEYS.includes(rawKey);

  const isObviouslyFake =
    rawUrl.includes("placeholder") ||
    rawUrl.includes("dummy") ||
    rawKey.includes("placeholder") ||
    rawKey.includes("dummy");

  const isValid = !isDefaultUrl && !isDefaultKey && !isObviouslyFake && rawUrl.length > 0 && rawKey.length > 0;

  // Use the working user credentials as fallback if environment is unconfigured
  let url = isValid ? rawUrl : "https://lbmylmefqlirdfawbwpo.supabase.co";
  let anonKey = isValid ? rawKey : "sb_publishable_jKRkcYr1pPd1MBzcXvbH1w_5__H5N-6";

  if (url.includes("supabase.com/dashboard/project/")) {
    const parts = url.split("supabase.com/dashboard/project/");
    if (parts[1]) {
      const projectRef = parts[1].split("/")[0];
      if (projectRef) {
        url = `https://${projectRef}.supabase.co`;
      }
    }
  }

  res.json({
    configured: true,
    url: url,
    anonKey: anonKey,
    environment: process.env.NODE_ENV || "development"
  });
});

// ==================== SERVE FRONTEND ====================
async function serveApp() {
  // Load BroadcastSpeechEngine trước khi khởi động
  await loadBroadcastSpeechEngine();
  
  const distPath = path.join(process.cwd(), "dist");
  const indexPath = path.join(distPath, "index.html");
  const hasDist = fs.existsSync(indexPath);

  if (process.env.NODE_ENV !== "production" || !hasDist) {
    console.log("[CommuteCast Backend] Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false   // Tắt HMR để tránh WebSocket
      },
      appType: "spa",
    });
    
    app.use(vite.middlewares);

    // Fallback for SPA in development
    app.get("*", async (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith("/api/")) {
        return next();
      }
      
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    console.log("[CommuteCast Backend] Serving static files from dist...");
    
    // Serve static files from dist
    app.use(express.static(distPath, {
      maxAge: "1y",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        } else {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }));

    // Fallback for SPA in production
    app.get("*", (req, res) => {
      // Check if file exists to avoid ENOENT crashes
      if (fs.existsSync(indexPath)) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Application not initialized. Please run build.");
      }
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  
  // Requirement 4: Max connection limit
  const MAX_CONNECTIONS = 50;
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  server.on('upgrade', (request, socket, head) => {
    const reqUrl = request.url ? new URL(request.url, `http://${request.headers.host || 'localhost'}`) : null;
    const pathname = reqUrl ? reqUrl.pathname : '';
    
    if (pathname === '/ws/voice') {
      // 1. Authenticate using dynamic short-lived token
      const token = reqUrl ? reqUrl.searchParams.get('token') : null;
      let isAuthenticated = false;

      if (token) {
        const expiry = voiceTokens.get(token);
        if (expiry && Date.now() <= expiry) {
          isAuthenticated = true;
          // Single-use token: invalidate immediately after successful upgrade
          voiceTokens.delete(token);
        }
      }

      if (!isAuthenticated) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // 2. IP Rate Limiting for WebSocket connections (max 20 per minute)
      const ip = request.socket.remoteAddress || 'unknown';
      if (isWsRateLimited(ip)) {
        socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
        socket.destroy();
        return;
      }

      if (wss.clients.size >= MAX_CONNECTIONS) {
        socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', async (clientWs) => {
    console.log('Client connected to WebSocket for Live API (/ws/voice)');
    
    // Requirement 4: 30-second inactivity timeout
    let timeoutId = setTimeout(() => {
        console.log('[WS-VOICE] Inactivity timeout, closing.');
        clientWs.close();
    }, 30000);

    const resetTimeout = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            console.log('[WS-VOICE] Inactivity timeout, closing.');
            clientWs.close();
        }, 30000);
    };
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('[WS-VOICE] GEMINI_API_KEY is not configured on the server.');
      clientWs.send(JSON.stringify({ error: 'voice_realtime_not_available' }));
      clientWs.close();
      clearTimeout(timeoutId);
      return;
    }
    
    let session: any = null;
    try {
        session = await ai.live.connect({
            model: "gemini-3.1-flash-live-preview",
            callbacks: {
              onmessage: (message: LiveServerMessage) => {
                resetTimeout(); // Activity detected
                const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (audio) clientWs.send(JSON.stringify({ audio }));
                if (message.serverContent?.interrupted)
                  clientWs.send(JSON.stringify({ interrupted: true }));
              },
            },
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
              },
              systemInstruction: "You are a helpful CommuteCast assistant.",
            },
          });
        
        clientWs.on('message', (data) => {
          resetTimeout(); // Activity detected
          try {
            const { audio } = JSON.parse(data.toString());
            if (audio && session) {
                session.sendRealtimeInput({
                  audio: { data: audio, mimeType: "audio/pcm;rate=16000" },
                });
            }
          } catch (e) {
            console.error('[WS-VOICE] Error processing incoming client audio message:', e);
          }
        });

        clientWs.on('close', () => {
            clearTimeout(timeoutId);
            if (session) {
              session.close();
            }
            console.log('Client disconnected from Live API');
        });

        clientWs.on('error', (err) => {
            clearTimeout(timeoutId);
            console.error('[WS-VOICE] Client socket error:', err);
        });
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Failed to connect to Live API:', error);
        clientWs.send(JSON.stringify({ error: 'voice_realtime_not_available' }));
        clientWs.close();
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[CommuteCast Backend] running on http://localhost:${PORT}`);
  });
}

if (!process.env.VITEST) {
  serveApp();
}