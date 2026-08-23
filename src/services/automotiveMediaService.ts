import { AutomotiveMediaMeta } from "../types";

/**
 * Automotive Media Session Service
 * Provides deep integration with W3C MediaSession API for in-car steering wheel controls,
 * Bluetooth Headunit metadata, and Apple CarPlay / Android Auto lockscreens.
 */
export class AutomotiveMediaService {
  private static instance: AutomotiveMediaService;
  private isSupported: boolean = false;

  private constructor() {
    this.isSupported = typeof window !== "undefined" && "mediaSession" in navigator;
  }

  public static getInstance(): AutomotiveMediaService {
    if (!AutomotiveMediaService.instance) {
      AutomotiveMediaService.instance = new AutomotiveMediaService();
    }
    return AutomotiveMediaService.instance;
  }

  /**
   * Update automotive metadata (song/news title, hosts, album art)
   */
  public updateMetadata(meta: AutomotiveMediaMeta): void {
    if (!this.isSupported) return;

    try {
      const artwork = meta.artworkUrl
        ? [
            { src: meta.artworkUrl, sizes: "96x96", type: "image/png" },
            { src: meta.artworkUrl, sizes: "128x128", type: "image/png" },
            { src: meta.artworkUrl, sizes: "192x192", type: "image/png" },
            { src: meta.artworkUrl, sizes: "256x256", type: "image/png" },
            { src: meta.artworkUrl, sizes: "384x384", type: "image/png" },
            { src: meta.artworkUrl, sizes: "512x512", type: "image/png" },
          ]
        : [
            {
              src: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=512&q=80",
              sizes: "512x512",
              type: "image/jpeg",
            },
          ];

      navigator.mediaSession.metadata = new MediaMetadata({
        title: meta.title || "CommuteCast AI DJ",
        artist: meta.artist || "MC Minh & MC An (AI)",
        album: meta.album || "CommuteCast Automotive Intelligence",
        artwork,
      });

      console.log("[AutomotiveMediaService] Updated car metadata:", meta.title);
    } catch (err) {
      console.warn("[AutomotiveMediaService] Failed to set MediaMetadata:", err);
    }
  }

  /**
   * Update automotive playback state (playing, paused, none)
   */
  public updatePlaybackState(state: "playing" | "paused" | "none"): void {
    if (!this.isSupported) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch (err) {
      console.warn("[AutomotiveMediaService] Failed to set playbackState:", err);
    }
  }

  /**
   * Update position state for car scrub bar
   */
  public updatePositionState(duration: number, playbackRate: number, position: number): void {
    if (!this.isSupported || !("setPositionState" in navigator.mediaSession)) return;
    try {
      if (duration > 0 && !isNaN(duration) && !isNaN(position) && position <= duration) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: playbackRate || 1.0,
          position: Math.max(0, position),
        });
      }
    } catch (err) {
      console.warn("[AutomotiveMediaService] Failed to set position state:", err);
    }
  }

  /**
   * Register car hardware steering controls (Play, Pause, Next Track, Prev Track, Seek)
   */
  public registerAutomotiveControls(handlers: {
    onPlay?: () => void;
    onPause?: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    onSeekForward?: () => void;
    onSeekBackward?: () => void;
    onSeekTo?: (details: MediaSessionActionDetails) => void;
  }): void {
    if (!this.isSupported) return;

    try {
      if (handlers.onPlay) {
        navigator.mediaSession.setActionHandler("play", () => handlers.onPlay!());
      }
      if (handlers.onPause) {
        navigator.mediaSession.setActionHandler("pause", () => handlers.onPause!());
      }
      if (handlers.onNext) {
        navigator.mediaSession.setActionHandler("nexttrack", () => handlers.onNext!());
      }
      if (handlers.onPrevious) {
        navigator.mediaSession.setActionHandler("previoustrack", () => handlers.onPrevious!());
      }
      if (handlers.onSeekForward) {
        navigator.mediaSession.setActionHandler("seekforward", () => handlers.onSeekForward!());
      }
      if (handlers.onSeekBackward) {
        navigator.mediaSession.setActionHandler("seekbackward", () => handlers.onSeekBackward!());
      }
      if (handlers.onSeekTo) {
        navigator.mediaSession.setActionHandler("seekto", (details) => handlers.onSeekTo!(details));
      }
      console.log("[AutomotiveMediaService] Automotive steering & media controls registered.");
    } catch (err) {
      console.warn("[AutomotiveMediaService] Failed to bind action handlers:", err);
    }
  }
}

export const automotiveMediaService = AutomotiveMediaService.getInstance();
