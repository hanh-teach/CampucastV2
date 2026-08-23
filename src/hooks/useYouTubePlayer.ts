import { useState, useEffect, useCallback, useRef } from 'react';
import { YouTubeVideo } from '../types';

export function useYouTubePlayer(
  currentVideo: YouTubeVideo | null,
  isDucked: boolean,
  onDuckingChange?: (isDucked: boolean) => void
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<any>(null);
  const isPlayerReadyRef = useRef<boolean>(false);
  const queuedVolumeRef = useRef<number | null>(null);
  const rampIntervalRef = useRef<any>(null);

  const rampVolume = useCallback((targetVolume: number) => {
    if (!playerRef.current || !isPlayerReadyRef.current) {
      queuedVolumeRef.current = targetVolume;
      return;
    }

    if (rampIntervalRef.current) {
      clearInterval(rampIntervalRef.current);
      rampIntervalRef.current = null;
    }

    try {
      if (typeof playerRef.current.getVolume !== 'function' || typeof playerRef.current.setVolume !== 'function') {
        return;
      }
      const startVolume = playerRef.current.getVolume();
      const duration = 200; // 200ms
      const stepTime = 20; // 20ms steps
      const totalSteps = duration / stepTime;
      const volumeDelta = (targetVolume - startVolume) / totalSteps;
      let currentStep = 0;

      rampIntervalRef.current = setInterval(() => {
        currentStep++;
        if (currentStep >= totalSteps) {
          if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
            playerRef.current.setVolume(targetVolume);
          }
          clearInterval(rampIntervalRef.current);
          rampIntervalRef.current = null;
        } else {
          const nextVolume = Math.round(startVolume + (volumeDelta * currentStep));
          if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
            playerRef.current.setVolume(nextVolume);
          }
        }
      }, stepTime);
    } catch (err) {
      console.warn("Volume ramp failed:", err);
      try {
        if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
          playerRef.current.setVolume(targetVolume);
        }
      } catch (e) {}
    }
  }, []);

  const initPlayer = useCallback(() => {
    if (!currentVideo) return;
    if (playerRef.current) return;

    try {
      const win = window as any;
      playerRef.current = new win.YT.Player('youtube-player-element', {
        height: '100%',
        width: '100%',
        videoId: currentVideo.id,
        playerVars: {
          autoplay: 1,
          mute: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          origin: typeof window !== 'undefined' && window.location ? window.location.origin : ""
        },
        events: {
          onReady: () => {
            isPlayerReadyRef.current = true;
            if (queuedVolumeRef.current !== null) {
              const targetVol = queuedVolumeRef.current;
              queuedVolumeRef.current = null;
              rampVolume(targetVol);
            }
          },
          onStateChange: (event: any) => {
            if (event.data === win.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (
              event.data === win.YT.PlayerState.PAUSED ||
              event.data === win.YT.PlayerState.ENDED
            ) {
              setIsPlaying(false);
            }
          }
        }
      });
    } catch (e) {
      console.error("Failed to initialize YT Player:", e);
    }
  }, [currentVideo, rampVolume]);

  useEffect(() => {
    const win = window as any;
    if (typeof window !== "undefined") {
      if (win.YT && win.YT.Player) {
        initPlayer();
      } else {
        if (!document.getElementById('youtube-iframe-api-script')) {
          const tag = document.createElement('script');
          tag.id = 'youtube-iframe-api-script';
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          if (firstScriptTag && firstScriptTag.parentNode) {
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
          } else {
            document.head.appendChild(tag);
          }
        }

        const prevCallback = win.onYouTubeIframeAPIReady;
        win.onYouTubeIframeAPIReady = () => {
          if (prevCallback) prevCallback();
          initPlayer();
        };

        const interval = setInterval(() => {
          if (win.YT && win.YT.Player) {
            initPlayer();
            clearInterval(interval);
          }
        }, 500);

        return () => {
          clearInterval(interval);
        };
      }
    }
  }, [initPlayer]);

  useEffect(() => {
    if (currentVideo && playerRef.current && isPlayerReadyRef.current) {
      try {
        if (typeof playerRef.current.loadVideoById === 'function') {
          playerRef.current.loadVideoById({
            videoId: currentVideo.id,
            suggestedQuality: 'default'
          });
        }
      } catch (err) {
        console.error("Error loading video in YT player:", err);
      }
    }
  }, [currentVideo]);

  useEffect(() => {
    const targetVolume = isDucked ? 15 : 100;
    rampVolume(targetVolume);
    if (onDuckingChange) {
      onDuckingChange(isDucked);
    }
  }, [isDucked, onDuckingChange, rampVolume]);

  useEffect(() => {
    return () => {
      if (rampIntervalRef.current) {
        clearInterval(rampIntervalRef.current);
      }
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy();
          }
        } catch (e) {
          console.warn("Error destroying YT player:", e);
        }
        playerRef.current = null;
        isPlayerReadyRef.current = false;
      }
    };
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!playerRef.current || !isPlayerReadyRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn("Failed to play/pause video:", e);
    }
  }, [isPlaying]);

  return {
    isPlaying,
    handlePlayPause,
    playerRef, // expose if necessary
  };
}
