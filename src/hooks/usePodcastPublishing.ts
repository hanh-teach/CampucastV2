import { useState, useEffect, useCallback } from "react";
import { PublishedEpisode, SavedSummary } from "../types";

interface UsePodcastPublishingProps {
  getApiUrl: (path: string) => string;
  uiLanguage: "vi" | "en";
  getFullBriefing: (id: string) => Promise<SavedSummary | null>;
  saveNewBriefing: (briefing: SavedSummary) => Promise<void>;
}

export function usePodcastPublishing({
  getApiUrl,
  uiLanguage,
  getFullBriefing,
  saveNewBriefing,
}: UsePodcastPublishingProps) {
  const [podcastEpisodes, setPodcastEpisodes] = useState<PublishedEpisode[]>([]);
  const [selectedBriefId, setSelectedBriefId] = useState<string>("");
  const [isPublishingPodcast, setIsPublishingPodcast] = useState<boolean>(false);
  const [podcastError, setPodcastError] = useState<string>("");
  const [isAutoPublish, setIsAutoPublish] = useState<boolean>(() => {
    return localStorage.getItem("commutecast_auto_publish") === "true";
  });

  useEffect(() => {
    localStorage.setItem("commutecast_auto_publish", String(isAutoPublish));
  }, [isAutoPublish]);

  const loadLocalOnlyEpisodes = useCallback(() => {
    const localSavedRaw = localStorage.getItem("commutecast_local_published_episodes");
    if (localSavedRaw) {
      try {
        const localEps = JSON.parse(localSavedRaw);
        if (Array.isArray(localEps)) {
          localEps.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
          setPodcastEpisodes(localEps);
          return;
        }
      } catch (e) {}
    }
    setPodcastEpisodes([]);
  }, []);

  const loadPodcastEpisodes = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl("/api/podcast/episodes"));
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          const serverEps: PublishedEpisode[] = data || [];

          // Merge server episodes with local storage backup episodes
          const localSavedRaw = localStorage.getItem("commutecast_local_published_episodes");
          let localEps: PublishedEpisode[] = [];
          if (localSavedRaw) {
            try { localEps = JSON.parse(localSavedRaw); } catch (e) {}
          }

          const merged = [...serverEps];
          if (Array.isArray(localEps)) {
            localEps.forEach((localEp) => {
              if (!merged.some((ep) => ep.id === localEp.id)) {
                merged.push(localEp);
              }
            });
          }

          // Sort descending by date/pubDate
          merged.sort((a, b) => {
            const dateA = new Date(a.pubDate).getTime();
            const dateB = new Date(b.pubDate).getTime();
            // Fallback to lexicographical compare if date is invalid
            if (isNaN(dateA) || isNaN(dateB)) {
              return b.pubDate.localeCompare(a.pubDate);
            }
            return dateB - dateA;
          });

          setPodcastEpisodes(merged);
        } else {
          console.warn("Expected JSON response but received different Content-Type:", contentType);
          loadLocalOnlyEpisodes();
        }
      } else {
        console.warn("Could not load podcast episodes, response status:", res.status);
        loadLocalOnlyEpisodes();
      }
    } catch (err: any) {
      console.warn("Could not retrieve podcast episodes gracefully:", err.message || err);
      loadLocalOnlyEpisodes();
    }
  }, [getApiUrl, loadLocalOnlyEpisodes]);

  useEffect(() => {
    loadPodcastEpisodes();
  }, []);

  const handlePublishPodcast = async (targetBriefId?: string, silentSuccess: boolean = false) => {
    const briefId = targetBriefId || selectedBriefId;
    if (!briefId) {
      if (!silentSuccess) {
        alert(uiLanguage === "vi" ? "Vui lòng chọn một bản tin để xuất bản." : "Please select a briefing to publish.");
      }
      return;
    }

    const rawBriefing = await getFullBriefing(briefId);
    if (!rawBriefing) {
      if (!silentSuccess) {
        alert(uiLanguage === "vi" ? "Không tìm thấy bản tin cần xuất bản." : "Selected briefing could not be found.");
      }
      return;
    }

    const getSafeReplacer = () => {
      const seen = new WeakSet();
      return (key: string, value: any) => {
        if (key.startsWith('__reactFiber') || key === 'stateNode' || key === '_owner' || key.startsWith('__reactProps')) {
          return undefined;
        }
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) return undefined;
          seen.add(value);
        }
        return value;
      };
    };

    let targetBriefing: any;
    try {
      targetBriefing = JSON.parse(JSON.stringify(rawBriefing, getSafeReplacer()));
    } catch (cloneErr) {
      console.error("Deep purge failed, fallback to manual strip", cloneErr);
      targetBriefing = rawBriefing;
    }

    if (!targetBriefing.audioChunks || targetBriefing.audioChunks.length === 0) {
      if (!silentSuccess) {
        alert(uiLanguage === "vi"
          ? "Bản tin này chưa được dệt giọng nói phát thanh (hoặc bản tin cũ đã lưu không còn giữ dữ liệu âm thanh).\n\nHãy bấm nút Đọc bản tin / Dệt phát thanh trước để nghe thử và tạo giọng nói, sau đó bạn sẽ xuất bản được podcast này ngay lập tức!"
          : "This briefing does not contain generated voice broadcast audio.\n\nPlease click the Read/Generate voice button to synthesize and preview the broadcast audio, after which you can publish it as a podcast instantly!");
      }
      return;
    }

    setIsPublishingPodcast(true);
    setPodcastError("");

    try {
      const cleanBriefing = {
        id: targetBriefing.id,
        timestamp: targetBriefing.timestamp,
        preferences: targetBriefing.preferences ? {
          targetDuration: targetBriefing.preferences.targetDuration,
          tone: targetBriefing.preferences.tone,
          voice: targetBriefing.preferences.voice,
          focus: targetBriefing.preferences.focus,
          commuteType: targetBriefing.preferences.commuteType,
          customInstructions: targetBriefing.preferences.customInstructions,
          language: targetBriefing.preferences.language
        } : undefined,
        payload: targetBriefing.payload ? {
          title: targetBriefing.payload.title,
          introduction: targetBriefing.payload.introduction,
          chapters: targetBriefing.payload.chapters?.map((ch: any) => ({
            topic: ch.topic,
            scriptText: ch.scriptText
          })) || [],
          conclusion: targetBriefing.payload.conclusion
        } : undefined,
        audioChunks: targetBriefing.audioChunks
      };

      const res = await fetch(getApiUrl("/api/podcast/publish"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefId: briefId,
          briefing: cleanBriefing
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updatedBriefing = { ...cleanBriefing, audioUrl: data.audioUrl };
        await saveNewBriefing(updatedBriefing as any);

        // --- ALSO SAVE TO LOCAL CLIENT STORAGE FOR ROBUST PERSISTENCE ---
        try {
          const localSavedRaw = localStorage.getItem("commutecast_local_published_episodes") || "[]";
          let localEps: PublishedEpisode[] = [];
          try { localEps = JSON.parse(localSavedRaw); } catch (e) {}
          if (!Array.isArray(localEps)) localEps = [];

          const newLocalEp: PublishedEpisode = {
            id: briefId,
            title: cleanBriefing.payload?.title || "Bản tin không tên",
            description: (cleanBriefing.payload?.introduction || "Bản tin phát thanh CommuteCast").substring(0, 400) + "...",
            pubDate: cleanBriefing.timestamp || new Date().toISOString(),
            audioUrl: data.audioUrl,
            duration: cleanBriefing.audioChunks ? Math.round(cleanBriefing.audioChunks.length) : 120
          };

          localEps = localEps.filter((ep) => ep.id !== briefId);
          localEps.unshift(newLocalEp);
          localStorage.setItem("commutecast_local_published_episodes", JSON.stringify(localEps));
        } catch (lsErr) {
          console.error("Failed to sync published episode to client local storage:", lsErr);
        }

        if (!silentSuccess) {
          if (data.storageType === "local") {
            const warnMsg = uiLanguage === "vi"
              ? `⚠️ Đã xuất bản podcast thành công, nhưng hiện tại tệp đang được lưu tạm trên Máy chủ Local do lỗi tải lên Supabase Storage.\n\nChi tiết lỗi: ${data.supabaseError || "Không rõ"}\n\n👉 Vui lòng truy cập trang quản lý Supabase Storage và đảm bảo bạn đã tạo Bucket tên là "CampucasV2_audio" ở chế độ Public và cấu hình RLS Policy cho phép INSERT/Upload công khai.`
              : `⚠️ Podcast published successfully, but the audio file is hosted on the Local server backup due to a Supabase upload issue.\n\nError details: ${data.supabaseError || "Unknown"}\n\n👉 Please check that your "CampucasV2_audio" Supabase Storage bucket is set to Public, and that you have enabled an Insert RLS Policy.`;
            alert(warnMsg);
          } else {
            alert(uiLanguage === "vi" ? "🎉 Xuất bản podcast thành công lên Supabase Storage!" : "🎉 Podcast episode published successfully to Supabase Storage!");
          }
        }
        if (targetBriefId === undefined) {
          setSelectedBriefId("");
        }
        loadPodcastEpisodes();
      } else {
        const errText = data.error || "Failed to publish.";
        setPodcastError(errText);
        if (!silentSuccess) {
          alert(uiLanguage === "vi" ? `Xuất bản thất bại: ${errText}` : `Publishing failed: ${errText}`);
        }
      }
    } catch (err: any) {
      console.error("Failed to publish podcast:", err);
      setPodcastError(err.message || "Network error");
    } finally {
      setIsPublishingPodcast(false);
    }
  };

  const handleDeletePodcastEpisode = async (id: string, t: any) => {
    const confirmation = window.confirm(t.podcastDeleteConfirm);
    if (!confirmation) return;

    try {
      const res = await fetch(getApiUrl(`/api/podcast/episodes/${id}`), {
        method: "DELETE"
      });

      if (res.ok) {
        const targetBriefing = await getFullBriefing(id);
        if (targetBriefing) {
          const { audioUrl, ...rest } = targetBriefing as any;
          await saveNewBriefing(rest as SavedSummary);
        }

        // --- ALSO DELETE FROM LOCAL CLIENT STORAGE ---
        try {
          const localSavedRaw = localStorage.getItem("commutecast_local_published_episodes");
          if (localSavedRaw) {
            let localEps: PublishedEpisode[] = JSON.parse(localSavedRaw);
            if (Array.isArray(localEps)) {
              localEps = localEps.filter((ep) => ep.id !== id);
              localStorage.setItem("commutecast_local_published_episodes", JSON.stringify(localEps));
            }
          }
        } catch (lsErr) {
          console.error("Failed to delete episode from client local storage:", lsErr);
        }

        loadPodcastEpisodes();
      } else {
        alert(uiLanguage === "vi" ? "Không thể xóa tập podcast này." : "Failed to delete podcast.");
      }
    } catch (err) {
      console.error("Failed to delete podcast:", err);
    }
  };

  return {
    podcastEpisodes,
    selectedBriefId,
    setSelectedBriefId,
    isPublishingPodcast,
    podcastError,
    setPodcastError,
    isAutoPublish,
    setIsAutoPublish,
    loadPodcastEpisodes,
    handlePublishPodcast,
    handleDeletePodcastEpisode
  };
}
