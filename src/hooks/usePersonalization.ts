import { useState, useEffect, useCallback } from 'react';
import { YouTubeVideo } from '../types';
import { recordInteraction } from '../services/interactionService';

export function usePersonalization(currentVideo: YouTubeVideo | null) {
  const [likedVideoIds, setLikedVideoIds] = useState<string[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<YouTubeVideo[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const liked = localStorage.getItem("commute_cast_liked_videos");
        if (liked) setLikedVideoIds(JSON.parse(liked));

        const recent = localStorage.getItem("commute_cast_recently_played");
        if (recent) setRecentlyPlayed(JSON.parse(recent));
      } catch (e) {
        console.warn("Failed to load personal state lists:", e);
      }
    }
  }, []);

  const trackPlayback = useCallback(async (video: YouTubeVideo) => {
    await recordInteraction(video.title, "click");
    setRecentlyPlayed(prev => {
      const filtered = prev.filter(v => v.id !== video.id);
      const updated = [video, ...filtered].slice(0, 10);
      try {
        localStorage.setItem("commute_cast_recently_played", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  useEffect(() => {
    if (currentVideo) {
      trackPlayback(currentVideo);
    }
  }, [currentVideo, trackPlayback]);

  const handleToggleLike = async () => {
    if (!currentVideo) return;
    const isLiked = likedVideoIds.includes(currentVideo.id);
    let updated: string[];

    if (isLiked) {
      updated = likedVideoIds.filter(id => id !== currentVideo.id);
    } else {
      updated = [...likedVideoIds, currentVideo.id];
      await recordInteraction(currentVideo.title, "like");
    }

    setLikedVideoIds(updated);
    try {
      localStorage.setItem("commute_cast_liked_videos", JSON.stringify(updated));
    } catch (e) {}
  };

  const isCurrentVideoLiked = currentVideo ? likedVideoIds.includes(currentVideo.id) : false;

  return {
    likedVideoIds,
    recentlyPlayed,
    handleToggleLike,
    isCurrentVideoLiked
  };
}
