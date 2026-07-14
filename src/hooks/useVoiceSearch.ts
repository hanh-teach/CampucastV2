import React, { useState } from "react";
import { syncSaveVoiceHistoryAsync } from "../services/syncService";
import { useSpeechRecognition } from "./useSpeechRecognition";

export function useVoiceSearch(getApiUrl: (path: string) => string, t: any, uiLanguage: string) {
  const [voiceInputLanguage, setVoiceInputLanguage] = useState<"vi-VN" | "en-US">("vi-VN");
  const [voiceQueryStatus, setVoiceQueryStatus] = useState<string>("");
  const [voiceQueryResult, setVoiceQueryResult] = useState<{ answer: string } | null>(null);
  const [voiceQuerySources, setVoiceQuerySources] = useState<Array<{ title: string; uri: string }>>([]);
  const [showVoiceAddPrompt, setShowVoiceAddPrompt] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string>("");
  const [isProcessingVoiceQuery, setIsProcessingVoiceQuery] = useState<boolean>(false);

  const handleTranscript = async (transcript: string) => {
    if (!transcript || transcript.trim() === "") {
      setVoiceError(t.speechErrorNotFound);
      return;
    }

    try {
      setIsProcessingVoiceQuery(true);
      setVoiceQueryStatus(t.queryProcessing);
      
      const response = await fetch(getApiUrl("/api/voice-query"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: transcript,
          language: voiceInputLanguage === "vi-VN" ? "vi" : "en"
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Query request failed");
      }

      const data = await response.json();
      if (data.answer) {
        setVoiceQueryResult({ answer: data.answer });
        setVoiceQuerySources(data.sources || []);
        setShowVoiceAddPrompt(true);
        setVoiceQueryStatus(t.querySuccess);

        // Sync query directly with voice intelligence
        try {
          await syncSaveVoiceHistoryAsync({
            query: transcript,
            answer: data.answer,
            language: voiceInputLanguage === "vi-VN" ? "vi" : "en",
            sources: data.sources || []
          });
        } catch (historyErr) {
          console.warn("Failed to save synced voice intelligence:", historyErr);
        }
      } else {
        setVoiceError(uiLanguage === "vi" ? "Trợ lý không tìm được câu trả lời phù hợp. Hãy thử hỏi lại nhé!" : "Could not find a relevant answer. Try asking again!");
      }
    } catch (err: any) {
      console.error("Voice processing error:", err);
      setVoiceError(err.message || "Failed to parse query");
    } finally {
      setIsProcessingVoiceQuery(false);
    }
  };

  const { isListening, startListening, stopListening, errorType } = useSpeechRecognition({
    uiLanguage: uiLanguage as "vi" | "en",
    lang: voiceInputLanguage,
    continuous: false,
    interimResults: false,
    onStart: () => {
      setVoiceQueryStatus(t.btnListening);
    },
    onError: (type, message) => {
      setVoiceError(message);
    },
    onTranscript: handleTranscript
  });

  const startVoiceSearch = () => {
    setVoiceError("");
    setVoiceQueryStatus("");
    setVoiceQueryResult(null);
    setVoiceQuerySources([]);
    setShowVoiceAddPrompt(false);
    startListening();
  };

  const handleVoiceAddToBriefing = (setNewsContent: React.Dispatch<React.SetStateAction<string>>) => {
    if (voiceQueryResult && voiceQueryResult.answer) {
      setNewsContent((prev) => {
        const separator = prev ? "\n\n---\n\n" : "";
        return prev + separator + voiceQueryResult.answer;
      });
      setShowVoiceAddPrompt(false);
      setVoiceQueryResult(null);
      setVoiceQuerySources([]);
      setVoiceQueryStatus("");
    }
  };

  return {
    isListening,
    voiceInputLanguage,
    setVoiceInputLanguage,
    voiceQueryStatus,
    voiceQueryResult,
    setVoiceQueryResult,
    voiceQuerySources,
    setVoiceQuerySources,
    showVoiceAddPrompt,
    setShowVoiceAddPrompt,
    voiceError,
    isProcessingVoiceQuery,
    startVoiceSearch,
    handleVoiceAddToBriefing,
    speechErrorType: errorType // expose to let UI components inspect error type
  };
}
