import { useState, useEffect, useCallback, useRef } from "react";
import { z } from "zod";
import { getRSSFeeds } from "../services/storageService";
import { fetchRSSArticles, formatArticlesForPrompt } from "../services/rssService";
import { getTopPreferences } from "../services/preferenceService";
import { useSpeechRecognition } from "./useSpeechRecognition";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Array<{ title: string; uri: string }>;
  suggestedTopics?: Array<{ topic: string; reason: string }>;
  isActionExecuted?: boolean;
  actions?: Array<{ type: string; label: string; payload?: any }>;
}

interface UseAssistantProps {
  uiLanguage: "vi" | "en";
  getApiUrl: (path: string) => string;
  handleCreateNews: (topic: string) => Promise<void> | void;
  newsContent: string;
  setNewsContent: (content: string) => void;
  activeTab: string;
  step?: string;
  isDrivingMode?: boolean;
  onAction?: (action: string, param: any) => void;
  preferences: any;
}

// Zod validation schema for safe parsing of model responses
const AssistantResponseSchema = z.object({
  speechResponse: z.string().default(""),
  suggestedTopics: z.array(
    z.object({
      topic: z.string(),
      reason: z.string(),
    })
  ).default([]),
  action: z.object({
    type: z.string().default("none"),
    param: z.string().optional().default(""),
  }).optional().default({ type: "none", param: "" }),
});

export type AssistantResponse = z.infer<typeof AssistantResponseSchema>;

/**
 * Safely parses the JSON output from the Gemini/Groq language model.
 * Handles code fences, removes leading/trailing noise, maps legacy fields, and validates using Zod.
 */
export function parseAssistantResponse(rawText: string): AssistantResponse {
  try {
    let cleaned = rawText.trim();
    
    // 1. Strip markdown code blocks if any
    if (cleaned.startsWith("```")) {
      const firstNewline = cleaned.indexOf("\n");
      if (firstNewline !== -1) {
        cleaned = cleaned.substring(firstNewline + 1);
      } else {
        cleaned = cleaned.substring(3);
      }
      
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trim();
    }

    // 2. Locate first '{' and last '}' to extract the pure JSON object
    const startIdx = cleaned.indexOf("{");
    const endIdx = cleaned.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }

    const parsed = JSON.parse(cleaned);

    // Legacy "answer" field compatibility mapping
    if (!parsed.speechResponse && parsed.answer) {
      parsed.speechResponse = parsed.answer;
    }

    return AssistantResponseSchema.parse(parsed);
  } catch (error) {
    console.warn("[parseAssistantResponse] Safe JSON parsing failed. Returning robust fallback:", error, rawText);
    return {
      speechResponse: "I am unable to generate recommendations right now. Please try again later.",
      suggestedTopics: [],
      action: { type: "none", param: "" },
    };
  }
}

// Helper for API calls with basic retry mechanism
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (response.status === 429 && retries > 0) {
      console.warn(`[fetchWithRetry] Rate limited (429). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

export function useAssistant({
  uiLanguage,
  getApiUrl,
  handleCreateNews,
  newsContent,
  setNewsContent,
  activeTab,
  step,
  isDrivingMode = false,
  onAction,
  preferences
}: UseAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState("");

  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handleSendMessage = async (text: string) => {
    if (!text || text.trim() === "") return;
    setErrorMsg(null);
    setInputVal("");
    stopSpeaking();

    const userMessage: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setIsProcessing(true);

    const textLower = text.toLowerCase().trim();
    if (
      textLower === "tổng hợp tin rss" ||
      textLower === "tổng hợp rss" ||
      textLower === "tóm tắt rss" ||
      textLower === "tóm tắt nguồn tin rss" ||
      textLower === "summarize rss" ||
      textLower === "fetch rss"
    ) {
      await handleRssAction();
      return;
    }

    try {
      // Retrieve Top 5 preferences from IndexedDB in the background
      const topPrefs = await getTopPreferences(5);
      const preferencesPayload = topPrefs.map((pref) => pref.topic);

      const response = await fetchWithRetry(getApiUrl("/api/assistant-chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          workstationContext: activeTab,
          systemState: step,
          history: updatedHistory.slice(-6).map((msg) => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          })),
          language: uiLanguage,
          userPreferences: preferencesPayload,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Request failed");
      }

      const rawJson = await response.json();
      const validatedData = parseAssistantResponse(JSON.stringify(rawJson));

      // Map action type to action labels and types for rendering as quick action buttons
      const backendAction = validatedData.action || { type: "none", param: "" };
      const quickActions: Array<{ type: string; label: string; payload?: any }> = [];

      if (backendAction.type !== "none") {
        if (backendAction.type === "create_news") {
          quickActions.push({
            type: "create_news",
            label: uiLanguage === "vi" ? "🚀 Soạn kịch bản mẫu" : "🚀 Generate Script",
            payload: backendAction.param,
          });
        } else if (backendAction.type === "add_to_news") {
          quickActions.push({
            type: "add_to_news",
            label: uiLanguage === "vi" ? "📝 Lưu vào bản tin" : "📝 Add to Editor",
            payload: "",
          });
        } else if (backendAction.type === "read_rss") {
          quickActions.push({
            type: "read_rss",
            label: uiLanguage === "vi" ? "🔄 Tổng hợp RSS ngay" : "🔄 Sync RSS Now",
            payload: "",
          });
        } else if (backendAction.type === "navigate") {
          const tabLabel = backendAction.param === "home" ? (uiLanguage === "vi" ? "Bàn điều hành" : "Home Desk")
                         : backendAction.param === "create" ? (uiLanguage === "vi" ? "Trạm sản xuất" : "Production Flow")
                         : backendAction.param === "assets" ? (uiLanguage === "vi" ? "Kho lưu trữ" : "Asset Store")
                         : (uiLanguage === "vi" ? "Cấu hình hệ thống" : "System Config");
          quickActions.push({
            type: "navigate",
            label: uiLanguage === "vi" ? `🧭 Đi đến ${tabLabel}` : `🧭 Go to ${tabLabel}`,
            payload: backendAction.param,
          });
        } else if (backendAction.type === "toggle_play") {
          quickActions.push({
            type: "toggle_play",
            label: uiLanguage === "vi" ? "📻 Bật / Tắt máy phát" : "📻 Toggle Player",
            payload: "",
          });
        } else if (backendAction.type === "toggle_theme") {
          quickActions.push({
            type: "toggle_theme",
            label: uiLanguage === "vi" ? "🌓 Đổi chế độ Sáng/Tối" : "🌓 Change Theme",
            payload: "",
          });
        } else if (backendAction.type === "toggle_driving") {
          quickActions.push({
            type: "toggle_driving",
            label: uiLanguage === "vi" ? "🚗 Chế độ Lái xe HUD" : "🚗 Driving HUD Mode",
            payload: "",
          });
        } else if (backendAction.type === "clear_cache") {
          quickActions.push({
            type: "clear_cache",
            label: uiLanguage === "vi" ? "🧹 Dọn bộ nhớ đệm" : "🧹 Clear Storage Cache",
            payload: "",
          });
        }
      }

      const assistantMessage: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        content: validatedData.speechResponse,
        suggestedTopics: (validatedData.suggestedTopics || []).map(st => ({
          topic: st.topic || "",
          reason: st.reason || ""
        })),
        actions: quickActions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Speak & Handle Auto Speak in Driving Mode
      speakRecommendation(validatedData.speechResponse);
      handleAutoSpeak(validatedData.speechResponse);

      // Actions Processing
      const action = validatedData.action || { type: "none", param: "" };
      if (action.type !== "none") {
        const actionType = action.type;
        const actionParam = action.param || "";

        if (actionType === "create_news") {
          const topic = actionParam || text;
          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              role: "assistant",
              content:
                uiLanguage === "vi"
                  ? `🚀 Đang chuẩn bị kịch bản phát thanh về chủ đề: "${topic}"...`
                  : `🚀 Generating radio script for: "${topic}"...`,
              timestamp: new Date(),
              isActionExecuted: true,
            },
          ]);
          await handleCreateNews(topic);
        } else if (actionType === "add_to_news") {
          const separator = newsContent ? "\n\n---\n\n" : "";
          setNewsContent(newsContent + separator + validatedData.speechResponse);

          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              role: "assistant",
              content:
                uiLanguage === "vi"
                  ? "✅ Đã thêm phản hồi trên vào kịch bản bản tin của bạn!"
                  : "✅ Successfully added the response above to your broadcast script!",
              timestamp: new Date(),
              isActionExecuted: true,
            },
          ]);
        } else if (actionType === "read_rss") {
          await handleRssAction(assistantMessage.id);
        } else if (onAction) {
          // General purpose action dispatcher for specialized workstation tasks
          onAction(actionType, actionParam);
        }
      }
    } catch (err: any) {
      console.error("[useAssistant] API error:", err);
      let errMsg =
        uiLanguage === "vi"
          ? "Đã xảy ra lỗi khi kết nối với máy chủ trợ lý ảo. Vui lòng thử lại sau."
          : "An error occurred while connecting to the assistant server. Please try again.";

      if (err.message && err.message.includes("quota")) {
        errMsg =
          uiLanguage === "vi"
            ? "Hết hạn ngạch (Quota Limit) gọi API. Hãy thử lại sau nhé."
            : "API Quota Limit exceeded. Please retry later.";
      }

      setErrorMsg(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const { isListening, startListening, stopListening, errorType } = useSpeechRecognition({
    uiLanguage,
    lang: uiLanguage === "vi" ? "vi-VN" : "en-US",
    continuous: false,
    interimResults: false,
    onStart: () => {
      setErrorMsg(null);
    },
    onTranscript: (text) => {
      handleSendMessage(text);
    },
    onError: (type, message) => {
      setErrorMsg(message);
    }
  });

  const speakRecommendation = useCallback(
    (text: string) => {
      if (!ttsEnabled || typeof window === "undefined" || !window.speechSynthesis) {
        console.warn("[speakRecommendation] Speech Synthesis not supported or disabled.");
        return;
      }

      // Cancel any ongoing speaking task to prevent overlap
      window.speechSynthesis.cancel();

      // Clean text of markdown characters to ensure smooth speech
      const plainText = text
        .replace(/[\*\_~`#\-+>]/g, "")
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");

      const utterance = new SpeechSynthesisUtterance(plainText);
      utterance.lang = uiLanguage === "vi" ? "vi-VN" : "en-US";

      if (preferences) {
        utterance.rate = preferences.rate || 1.0;
        utterance.pitch = preferences.pitch || 1.0;
      }

      const voices = window.speechSynthesis.getVoices();
      const targetLang = uiLanguage === "vi" ? "vi" : "en";
      const voice = voices.find(
        (v) =>
          v.lang.toLowerCase().startsWith(targetLang) &&
          (v.name.includes("Google") || v.name.includes("Neural"))
      ) || voices.find((v) => v.lang.toLowerCase().startsWith(targetLang));

      if (voice) {
        utterance.voice = voice;
      }

      speechUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [ttsEnabled, uiLanguage]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Trigger auto-speak if in Driving Mode and window receives recommendations
  const handleAutoSpeak = useCallback((text: string) => {
    if (isDrivingMode) {
      speakRecommendation(text);
    }
  }, [isDrivingMode, speakRecommendation]);

  // Handle RSS actions
  const handleRssAction = useCallback(async (existingMessageId?: string) => {
    const loadingMessageId = existingMessageId || Math.random().toString();
    try {
      setIsProcessing(true);
      setErrorMsg(null);

      if (!existingMessageId) {
        setMessages((prev) => [
          ...prev,
          {
            id: loadingMessageId,
            role: "assistant",
            content:
              uiLanguage === "vi"
                ? "Đang quét các nguồn tin RSS của bạn..."
                : "Scanning your RSS feeds...",
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === existingMessageId
              ? {
                  ...msg,
                  content:
                    uiLanguage === "vi"
                      ? "Đang kết nối và đồng bộ các nguồn tin RSS..."
                      : "Connecting and syncing RSS feeds...",
                }
              : msg
          )
        );
      }

      const feeds = await getRSSFeeds();
      if (!feeds || feeds.length === 0) {
        const text =
          uiLanguage === "vi"
            ? "Bạn chưa đăng ký nguồn tin RSS nào. Hãy thêm nguồn tin ở mục RSS!"
            : "You haven't subscribed to any RSS feeds yet. Please add sources in the RSS section!";
        setMessages((prev) =>
          prev.map((msg) => (msg.id === loadingMessageId ? { ...msg, content: text } : msg))
        );
        setIsProcessing(false);
        speakRecommendation(text);
        return;
      }

      const articles = await fetchRSSArticles(feeds, getApiUrl);
      if (!articles || articles.length === 0) {
        const text =
          uiLanguage === "vi"
            ? "Không tìm thấy bài viết mới nào từ các nguồn RSS của bạn."
            : "No new articles found from your RSS sources.";
        setMessages((prev) =>
          prev.map((msg) => (msg.id === loadingMessageId ? { ...msg, content: text } : msg))
        );
        setIsProcessing(false);
        speakRecommendation(text);
        return;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                content:
                  uiLanguage === "vi"
                    ? "Đang tổng hợp nội dung các bài viết bằng AI..."
                    : "Synthesizing article content using AI...",
              }
            : msg
        )
      );

      const topArticles = articles.slice(0, 10);
      const formattedContext = formatArticlesForPrompt(topArticles, uiLanguage);

      const response = await fetchWithRetry(getApiUrl("/api/assistant-chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:
            uiLanguage === "vi"
              ? `Tóm tắt các bài viết RSS sau đây:\n\n${formattedContext}`
              : `Summarize the following RSS articles:\n\n${formattedContext}`,
          history: [],
          language: uiLanguage,
          userPreferences: [],
        }),
      });

      if (!response.ok) {
        throw new Error("RSS API call failed");
      }

      const rawData = await response.json();
      const validatedData = parseAssistantResponse(JSON.stringify(rawData));

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                content: validatedData.speechResponse,
                suggestedTopics: validatedData.suggestedTopics,
                timestamp: new Date(),
              }
            : msg
        )
      );

      speakRecommendation(validatedData.speechResponse);
      handleAutoSpeak(validatedData.speechResponse);
    } catch (err: any) {
      console.error("[useAssistant] RSS error:", err);
      const errorText =
        uiLanguage === "vi"
          ? "Không thể tóm tắt tin RSS vào lúc này. Vui lòng thử lại sau."
          : "Unable to summarize RSS feeds at this time. Please try again later.";
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessageId
            ? { ...msg, content: errorText }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
    }
  }, [uiLanguage, getApiUrl, speakRecommendation, handleAutoSpeak]);

  const clearChat = () => {
    stopSpeaking();
    setMessages([]);
    setErrorMsg(null);
  };

  return {
    isOpen,
    setIsOpen,
    messages,
    isListening,
    isProcessing,
    ttsEnabled,
    setTtsEnabled,
    errorMsg,
    inputVal,
    setInputVal,
    startListening,
    stopListening,
    sendMessage: handleSendMessage,
    clearChat,
    stopSpeaking,
    speakRecommendation,
  };
}
export default useAssistant;
