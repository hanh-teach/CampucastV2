import { getApiUrl } from "../utils/apiUtils";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { telemetry } from "../services/telemetryService";
import { exportBriefingAsWav } from "../utils/audioExport";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Download, 
  Volume2, 
  Layers, 
  FileCheck,
  Sparkles,
  Headphones,
  Share2,
  Copy,
  Check,
  Radio,
  Sliders,
  MessageSquare,
  Facebook,
  ArrowRight,
  X
} from "lucide-react";
import { NewsChapter, SummaryPayload } from "../types";
import { base64ToArrayBuffer, pcmToFloat32, encodeWavHeader } from "../utils";
import { useUserPreferences } from "./UserPreferencesProvider";
import DrivingMode from "./DrivingMode";
import { motion, AnimatePresence } from "motion/react";
import ShareModal from "./ShareModal";
import { ClearDataButton } from './ClearDataButton';
import { cn } from "../lib/utils";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { colors } from "../foundation/tokens/colors";
import { createPortal } from "react-dom";

interface ManualPcmPlayerProps {
  payload: SummaryPayload;
  audioChunks: string[];
  title?: string;
  preferencesInfo?: string;
  uiLanguage?: "vi" | "en";
  briefingId?: string;
  onEnded?: () => void;
  savedBriefings?: any[];
  onPlaySavedBriefing?: (briefing: any) => void;
}

const playerTranslations = {
  vi: {
    systemTitle: "Hệ Thống Phát Thanh Tin Tức",
    poweredBy: "Vận hành bởi Gemini 3.1 TTS",
    speed: "Tốc độ",
    exportBtn: "Xuất file âm thanh (.wav)",
    scriptTitle: "Nội Dung Kịch Bản Bản Tin",
    scriptSub: "Nhấp phân đoạn bên dưới để nghe vị trí mong muốn",
    labelIntro: "📻 Chào Đầu Bản Tin",
    labelOutro: "🚗 Chào Kết & Giao Thông",
    labelTopic: "📚 Phân Đoạn Tin Tức Summary",
    studioCenter: "🎛️ Trung Tâm Studio & Chia Sẻ",
    studioDesc: "Hậu trường phát thanh: Tải file, sao chép kịch bản hoặc truyền thông trực tiếp.",
    onAirLabel: "PHÒNG THU LIVE",
    onAirBroadcasting: "ĐÀI ĐANG PHÁT SÓNG TRỰC TIẾP",
    onAirStandby: "MÁY CHỦ SẴN SÀNG - ĐANG CHỜ PHÁT",
    copyTranscript: "Sao chép tin tức",
    copySuccess: "Đã sao chép kịch bản!",
    shareZalo: "Chia sẻ lên Zalo",
    shareFacebook: "Chia sẻ lên Facebook",
    downloadTiktok: "Tải xuống Audio (Dùng cho TikTok/Reels)",
    studioEfx: "Giám Sát Tần Số Sóng & Âm Lượng Mixer",
    volumeLabel: "Âm lượng phòng thu",
  },
  en: {
    systemTitle: "Commute Audio System",
    poweredBy: "Powered by Gemini 3.1 TTS",
    speed: "Speed",
    exportBtn: "Export Audio",
    scriptTitle: "Interactive Commute Broadcast Script",
    scriptSub: "Click segments to jump audio",
    labelIntro: "📻 Welcome Greeting",
    labelOutro: "🚗 Traffic Outro",
    labelTopic: "📚 Broadcast Topic",
    studioCenter: "🎛️ Studio Suite & Sharing Center",
    studioDesc: "Backstage tools: download audio feed, export transcripts or stream direct.",
    onAirLabel: "LIVE STUDIO",
    onAirBroadcasting: "ON AIR - LIVE BROADCASTING",
    onAirStandby: "STANDBY - READY TO PLAY",
    copyTranscript: "Copy Transcript",
    copySuccess: "Transcript Copied!",
    shareZalo: "Share to Zalo",
    shareFacebook: "Share to Facebook",
    downloadTiktok: "Download Audio (for TikTok/Reels)",
    studioEfx: "Studio Frequency & Visual Level Mixer Monitor",
    volumeLabel: "Studio Monitor Volume",
  }
};

export default function ManualPcmPlayer({ 
  payload, 
  audioChunks, 
  title, 
  preferencesInfo, 
  uiLanguage: propUiLanguage = "vi", 
  briefingId,
  onEnded,
  savedBriefings = [],
  onPlaySavedBriefing
}: ManualPcmPlayerProps) {
  const { preferences: userPref, updateDrivingMode, updatePreferences } = useUserPreferences();
  
  // Local active tab for Audio Studio
  const [activeStudioTab, setActiveStudioTab] = useState<"mixer" | "music" | "lexicon">("mixer");

  // Local state for adding pronunciation entry
  const [newWord, setNewWord] = useState("");
  const [newReplace, setNewReplace] = useState("");

  // Local state for Voice Preview
  const [previewText, setPreviewText] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const getDefaultLanguage = (): "vi" | "en" => {
    if (propUiLanguage === "vi" || propUiLanguage === "en") return propUiLanguage;
    if (userPref?.language === "vi" || userPref?.language === "en") return userPref.language;
    const browserLang = navigator.language?.split('-')[0];
    if (browserLang === "vi") return "vi";
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam === "vi" || langParam === "en") return langParam;
    return "vi";
  };

  const [uiLanguage, setUiLanguage] = useState<"vi" | "en">(getDefaultLanguage());
  const pt = playerTranslations[uiLanguage];
  
  useEffect(() => {
    if (userPref?.language === "vi" || userPref?.language === "en") {
      setUiLanguage(userPref.language);
    }
  }, [userPref?.language]);

  useEffect(() => {
    if (!previewText) {
      setPreviewText(
        uiLanguage === "vi" 
          ? "Chào buổi sáng, chúc bạn một ngày lái xe an toàn!" 
          : "Good morning! Wishing you an incredibly safe commute today!"
      );
    }
  }, [uiLanguage]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(userPref.speed || 1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const activeSegmentIndexRef = useRef(0);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState(0);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setCurrentPlayingIndex(activeSegmentIndex);
  }, [activeSegmentIndex]);

  useEffect(() => {
    if (userPref.speed) {
      setPlaybackRate(userPref.speed);
    }
  }, [userPref.speed]);

  // Web Audio Variables
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Background Music & Jingle Variables
  const [isBgMusicEnabled, setIsBgMusicEnabled] = useState(userPref.audioMusicGenre !== 'none' && !!userPref.audioMusicGenre);
  const [bgMusicVolume, setBgMusicVolume] = useState<number>(0.15);
  const bgOscsRef = useRef<OscillatorNode[]>([]);
  const bgGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    setIsBgMusicEnabled(userPref.audioMusicGenre !== 'none' && !!userPref.audioMusicGenre);
  }, [userPref.audioMusicGenre]);

  const [volume, setVolume] = useState<number>(0.9);
  const [isDucked, setIsDucked] = useState<boolean>(false);
  const [isHighQualityVoice, setIsHighQualityVoice] = useState(true);
  const [frequencyData, setFrequencyData] = useState<number[]>(new Array(32).fill(12));
  const [copied, setCopied] = useState(false);
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);
  const [showRemaining, setShowRemaining] = useState(false);
  
  const startTimeCtxRef = useRef<number>(0);
  const elapsedOffsetRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  
  const [segmentOffsets, setSegmentOffsets] = useState<{ start: number; end: number }[]>([]);

  const allSegments = [
    { type: "intro", title: "Introduction", text: payload.introduction, bullets: [] as string[] },
    ...payload.chapters.map((ch, i) => ({ 
      type: "chapter", 
      title: `${i + 1}. ${ch.topic}`, 
      text: ch.scriptText, 
      bullets: ch.summaryBullets 
    })),
    { type: "outro", title: "Signing Off", text: payload.conclusion, bullets: [] as string[] }
  ];

  const getTimelineSegments = () => {
    if (!payload) return [];
    
    const introText = payload.introduction || "";
    const chapterTexts = payload.chapters?.map(c => c.scriptText || "") || [];
    const outroText = payload.conclusion || "";
    
    const introLen = introText.length;
    const chapLens = chapterTexts.map(t => t.length);
    const outroLen = outroText.length;
    
    const totalChars = introLen + chapLens.reduce((a, b) => a + b, 0) + outroLen;
    if (totalChars === 0) return [];
    
    const totalDur = totalDuration || 120; // fallback to 120s if not loaded yet
    
    const segments: Array<{ label: string; start: number; end: number; startPct: number; endPct: number }> = [];
    let currentPct = 0;
    
    // Intro
    const introPct = (introLen / totalChars) * 100;
    segments.push({
      label: uiLanguage === "vi" ? "Lời chào" : "Intro",
      start: (currentPct / 100) * totalDur,
      end: ((currentPct + introPct) / 100) * totalDur,
      startPct: currentPct,
      endPct: currentPct + introPct
    });
    currentPct += introPct;
    
    // Chapters
    payload.chapters?.forEach((chap, idx) => {
      const chapPct = (chapLens[idx] / totalChars) * 100;
      segments.push({
        label: chap.topic || `${uiLanguage === "vi" ? "Chương" : "Chapter"} ${idx + 1}`,
        start: (currentPct / 100) * totalDur,
        end: ((currentPct + chapPct) / 100) * totalDur,
        startPct: currentPct,
        endPct: currentPct + chapPct
      });
      currentPct += chapPct;
    });
    
    // Outro
    const outroPct = (outroLen / totalChars) * 100;
    segments.push({
      label: uiLanguage === "vi" ? "Kết bài" : "Outro",
      start: (currentPct / 100) * totalDur,
      end: ((currentPct + outroPct) / 100) * totalDur,
      startPct: currentPct,
      endPct: currentPct + outroPct
    });
    
    return segments;
  };

  const handleAddPronunciation = () => {
    if (!newWord.trim() || !newReplace.trim()) return;
    const currentDict = userPref.audioPronunciationDict || [];
    if (currentDict.some(e => e.word.toLowerCase() === newWord.trim().toLowerCase())) {
      return;
    }
    const updated = [...currentDict, { word: newWord.trim(), replace: newReplace.trim() }];
    updatePreferences({ audioPronunciationDict: updated });
    setNewWord("");
    setNewReplace("");
  };

  const handleRemovePronunciation = (word: string) => {
    const currentDict = userPref.audioPronunciationDict || [];
    const updated = currentDict.filter(e => e.word !== word);
    updatePreferences({ audioPronunciationDict: updated });
  };

  const handlePlayVoicePreview = async () => {
    if (!previewText.trim()) return;
    setIsPreviewing(true);
    setPreviewError("");
    try {
      let processedPreview = previewText;
      const dict = userPref.audioPronunciationDict || [];
      const sortedDict = [...dict].sort((a, b) => b.word.length - a.word.length);
      for (const entry of sortedDict) {
        if (!entry.word.trim()) continue;
        const escaped = entry.word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        processedPreview = processedPreview.replace(regex, entry.replace);
      }

      const res = await fetch(getApiUrl("/api/tts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: processedPreview,
          voice: userPref.voice,
          tone: userPref.tone,
          emotion: userPref.audioEmotion,
          languageMode: userPref.languageMode
        })
      });

      if (!res.ok) {
        throw new Error(uiLanguage === "vi" ? "Lỗi tổng hợp bản xem trước." : "Synthesis preview error.");
      }

      const data = await res.json();
      if (!data.base64Audio) {
        throw new Error("No base64 audio data");
      }

       const isWav = data.base64Audio.startsWith("UklGR");
      const mimeType = isWav ? "audio/wav" : "audio/mp3";
      const audioSrc = `data:${mimeType};base64,${data.base64Audio}`;
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(audioSrc);
      audio.onerror = () => {
        console.error("[ManualPcmPlayer] Audio decoding or load failed");
        setIsPreviewing(false);
        setPreviewError("Failed to decode or play preview audio.");
      };
      previewAudioRef.current = audio;
      audio.play().catch(e => {
        console.error("[ManualPcmPlayer] Play failed:", e);
        setIsPreviewing(false);
        setPreviewError(e.message || "Failed to play preview audio.");
      });
      audio.onended = () => {
        setIsPreviewing(false);
      };
    } catch (err: any) {
      console.error(err);
      setPreviewError(err.message || "Failed to preview");
      setIsPreviewing(false);
    }
  };

// Initialize audio buffer
useEffect(() => {
  let active = true;

  const initAudio = async () => {
    if (!audioChunks || audioChunks.length === 0) {
      setSegmentOffsets([]);
      setTotalDuration(0);
      mainBufferRef.current = null;
      return;
    }

    // ===== LOẠI BỎ DUPLICATE CHUNKS =====
    const uniqueChunks: string[] = [];
    const seen = new Set<string>();
    for (const chunk of audioChunks) {
      if (!seen.has(chunk)) {
        seen.add(chunk);
        uniqueChunks.push(chunk);
      }
    }
    if (uniqueChunks.length !== audioChunks.length) {
      console.warn(
        `[ManualPcmPlayer] ⚠️ Found ${audioChunks.length - uniqueChunks.length} duplicate chunks. Original: ${audioChunks.length}, Unique: ${uniqueChunks.length}`
      );
    }
    
    const chunksToProcess = uniqueChunks;
     console.log(`[ManualPcmPlayer] Chunks to process: ${chunksToProcess.length}`);
    
    stopAudio();
    setIsPlaying(false);
    setCurrentTime(0);
    elapsedOffsetRef.current = 0;

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      const decodedBuffers: AudioBuffer[] = [];

      for (let i = 0; i < chunksToProcess.length; i++) {
        if (!active) return;
        const chunk = chunksToProcess[i];
        
        let arrayBuffer: ArrayBuffer;
        if (chunk.startsWith("http")) {
          try {
            const res = await fetch(chunk);
            arrayBuffer = await res.arrayBuffer();
          } catch (fetchErr) {
            console.error(`[ManualPcmPlayer] Failed to fetch cloud audio chunk ${i}:`, fetchErr);
            continue;
          }
        } else {
          arrayBuffer = base64ToArrayBuffer(chunk);
        }

        const chunkId = `CHUNK-${i + 1}`;
        const decodeStart = Date.now();
        
        // Header-based routing to avoid expected decodeAudioData failures on raw PCM
        const header = new Uint8Array(arrayBuffer.slice(0, 4));
        const isWav = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46; // RIFF
        const isMp3 = (header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33) || (header[0] === 0xFF && (header[1] & 0xE0) === 0xE0); // ID3 or Sync Frame
        
        const isKnownContainer = isWav || isMp3;

        if (isKnownContainer) {
          try {
            let decoded = await audioCtx.decodeAudioData(arrayBuffer);
            const decodeDuration = Date.now() - decodeStart;
            
            if (decoded.sampleRate !== 24000) {
              const targetRate = 24000;
              const ratio = targetRate / decoded.sampleRate;
              const newLength = Math.round(decoded.length * ratio);
              const newBuffer = audioCtx.createBuffer(
                decoded.numberOfChannels,
                newLength,
                targetRate
              );
              for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
                const srcData = decoded.getChannelData(ch);
                const dstData = newBuffer.getChannelData(ch);
                for (let j = 0; j < newLength; j++) {
                  const srcIdx = j / ratio;
                  const idx0 = Math.floor(srcIdx);
                  const idx1 = Math.min(idx0 + 1, srcData.length - 1);
                  const frac = srcIdx - idx0;
                  dstData[j] = srcData[idx0] * (1 - frac) + srcData[idx1] * frac;
                }
              }
              decoded = newBuffer;
            }
            
            if (decoded.numberOfChannels > 1) {
              const monoBuffer = audioCtx.createBuffer(1, decoded.length, decoded.sampleRate);
              const monoData = monoBuffer.getChannelData(0);
              for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
                const chData = decoded.getChannelData(ch);
                for (let j = 0; j < decoded.length; j++) {
                  monoData[j] += chData[j] / decoded.numberOfChannels;
                }
              }
              decoded = monoBuffer;
            }
            
            decodedBuffers.push(decoded);
            console.log(`[ManualPcmPlayer-AUDIT] ${chunkId} (${isWav ? "WAV" : "MP3"}) decoded natively in ${decodeDuration}ms. Duration: ${decoded.duration.toFixed(2)}s`);
            
          } catch (decodeErr) {
            const decodeDuration = Date.now() - decodeStart;
            console.warn(`[ManualPcmPlayer-AUDIT] ${chunkId} Native decoding failed after ${decodeDuration}ms despite header match. Falling back to PCM...`);
            await tryPcmFallback(arrayBuffer, i, decodedBuffers, chunkId, decodeStart);
          }
        } else {
          // No known container header, assume raw PCM16LE
          await tryPcmFallback(arrayBuffer, i, decodedBuffers, chunkId, decodeStart);
        }
      }

      async function tryPcmFallback(arrayBuffer: ArrayBuffer, i: number, decodedBuffers: AudioBuffer[], chunkId: string, decodeStart: number) {
        try {
          const fallbackStart = Date.now();
          const floatArray = pcmToFloat32(arrayBuffer);
          const fallbackBuf = audioCtx.createBuffer(1, floatArray.length, 24000);
          fallbackBuf.getChannelData(0).set(floatArray);
          decodedBuffers.push(fallbackBuf);
          const fallbackDuration = Date.now() - fallbackStart;
          console.log(`[ManualPcmPlayer-AUDIT] ${chunkId} (RAW PCM) decoded in ${fallbackDuration}ms. Duration: ${fallbackBuf.duration.toFixed(2)}s`);
        } catch (pcmErr) {
          console.error(`[ManualPcmPlayer] PCM decoding failed for chunk ${i + 1}:`, pcmErr);
        }
      }
      console.log(`[ManualPcmPlayer] Decoded buffers count: ${decodedBuffers.length}`);
      
      if (!active) return;
      if (decodedBuffers.length === 0) {
        throw new Error("No audio chunks could be decoded successfully.");
      }

      // Apply 5ms fade-in and 10ms fade-out to every decoded buffer to prevent starting/ending clicks and boundary noise
      decodedBuffers.forEach((buf) => {
        const fadeInSamples = Math.min(Math.round(buf.sampleRate * 0.005), buf.length);
        const fadeOutSamples = Math.min(Math.round(buf.sampleRate * 0.010), buf.length);
        for (let ch = 0; ch < buf.numberOfChannels; ch++) {
          const data = buf.getChannelData(ch);
          if (fadeInSamples > 0) {
            for (let j = 0; j < fadeInSamples; j++) {
              data[j] *= (j / fadeInSamples);
            }
          }
          if (fadeOutSamples > 0) {
            const startIdx = buf.length - fadeOutSamples;
            for (let j = 0; j < fadeOutSamples; j++) {
              data[startIdx + j] *= (1 - (j / fadeOutSamples));
            }
          }
        }
      });

      const sampleRate = decodedBuffers[0].sampleRate;
      const numberOfChannels = Math.max(...decodedBuffers.map(b => b.numberOfChannels));
      const pauseSamples = Math.round(sampleRate * (userPref.audioPauseDuration ?? 0.25)); // Đọc cấu hình khoảng lặng từ Audio Studio
      console.log(`[ManualPcmPlayer] Pause samples: ${pauseSamples}, pause duration: ${(pauseSamples / sampleRate).toFixed(2)}s`);
      
      let totalSamples = 0;
      const offsets: { start: number; end: number }[] = [];

      decodedBuffers.forEach((buf, idx) => {
        const startSec = totalSamples / sampleRate;
        const durationSamples = Math.round(buf.duration * sampleRate);
        totalSamples += durationSamples;
        const endSec = totalSamples / sampleRate;
        offsets.push({ start: startSec, end: endSec });
        
        if (idx < decodedBuffers.length - 1) {
          totalSamples += pauseSamples;
        }
      });

      if (!active) return;
      setSegmentOffsets(offsets);
      
      const calculatedDuration = totalSamples / sampleRate;
      setTotalDuration(calculatedDuration);
      console.log(`[ManualPcmPlayer] Total duration: ${calculatedDuration.toFixed(2)}s, Samples: ${totalSamples}, Rate: ${sampleRate}Hz`);

      const unifiedBuffer = audioCtx.createBuffer(numberOfChannels, totalSamples, sampleRate);
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const outputChannel = unifiedBuffer.getChannelData(channel);
        let writeOffset = 0;
        decodedBuffers.forEach((buf, idx) => {
          const bufSamples = Math.round(buf.duration * sampleRate);
          if (channel < buf.numberOfChannels) {
            const srcData = buf.getChannelData(channel);
            const copyLength = Math.min(srcData.length, bufSamples);
            outputChannel.set(srcData.subarray(0, copyLength), writeOffset);
          }
          writeOffset += bufSamples;
          if (idx < decodedBuffers.length - 1) {
            writeOffset += pauseSamples;
          }
        });
      }

      mainBufferRef.current = unifiedBuffer;
      playAudio(0);

    } catch (err) {
      console.error("Failed to construct audio buffer:", err);
    }
  };

  initAudio();

  return () => {
    active = false;
    stopAudio();
    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      if (ctx.state !== "closed") {
        ctx.close().catch(err => console.log("[ManualPcmPlayer] Error closing AudioContext:", err));
      }
      audioCtxRef.current = null;
    }
  };
}, [audioChunks, userPref.audioPauseDuration]);

  // ===== FIX: Cải thiện playAudio với timing chính xác =====
  const playAudio = (offset: number) => {
    if (!mainBufferRef.current || !audioCtxRef.current) return;

    stopAudio();

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    const audioCtx = audioCtxRef.current;
    const source = audioCtx.createBufferSource();
    source.buffer = mainBufferRef.current;
    
    // ===== FIX: Giới hạn rate để tránh biến dạng giọng quá nhiều =====
    const safeRate = Math.max(0.6, Math.min(2.5, playbackRate));
    source.playbackRate.value = safeRate;
    
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.75;
    analyserRef.current = analyser;

    let lastNode: AudioNode = source;

    // 1. Áp dụng Bộ lọc Giảm nhiễu (Noise Reduction)
    if (userPref.audioNoiseReduction) {
      const hpFilter = audioCtx.createBiquadFilter();
      hpFilter.type = "highpass";
      hpFilter.frequency.value = 85; // Cắt âm trầm ù nền nhiễu thiết bị

      const lpFilter = audioCtx.createBiquadFilter();
      lpFilter.type = "lowpass";
      lpFilter.frequency.value = 7500; // Cắt nhiễu xè rít tần số cao

      lastNode.connect(hpFilter);
      hpFilter.connect(lpFilter);
      lastNode = lpFilter;
    }

    // Kết nối đến Analyser vẽ phổ tần
    lastNode.connect(analyser);

    // 2. Chuẩn hóa âm lượng giọng nói (Normalize: Tự động nâng dải âm)
    const normVolume = userPref.audioNormalize ? volume * 1.35 : volume;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = normVolume;
    gainNodeRef.current = gainNode;
    analyser.connect(gainNode);

    // 3. Bộ giới hạn biên độ chống rè (Limiter)
    if (userPref.audioLimiter) {
      const limiter = audioCtx.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-1.5, audioCtx.currentTime);
      limiter.knee.setValueAtTime(0, audioCtx.currentTime);
      limiter.ratio.setValueAtTime(20, audioCtx.currentTime);
      limiter.attack.setValueAtTime(0.003, audioCtx.currentTime);
      limiter.release.setValueAtTime(0.08, audioCtx.currentTime);

      gainNode.connect(limiter);
      limiter.connect(audioCtx.destination);
    } else {
      gainNode.connect(audioCtx.destination);
    }

    const safeOffset = Math.max(0, Math.min(offset, totalDuration));
    
    // ===== FIX: Lưu timing chính xác =====
    const startTime = audioCtx.currentTime;
    source.start(0, safeOffset);
    sourceNodeRef.current = source;

    startTimeCtxRef.current = startTime;
    elapsedOffsetRef.current = safeOffset;
    setIsPlaying(true);
  };

  // ===== FIX: Cập nhật timing khi thay đổi playback rate =====
  useEffect(() => {
    if (sourceNodeRef.current && isPlaying) {
      // Lưu vị trí hiện tại và restart với rate mới
      const currentOffset = currentTime;
      stopAudio();
      playAudio(currentOffset);
    }
  }, [playbackRate]);

  // ===== FIX: Theo dõi progress với timing chính xác =====
  const startTrackingProgress = () => {
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);

    const updateProgress = () => {
      if (!audioCtxRef.current || !isPlaying) return;

      const now = audioCtxRef.current.currentTime;
      
      // ===== FIX: Tính elapsed với rate hiện tại =====
      let elapsedSeconds = elapsedOffsetRef.current + (now - startTimeCtxRef.current) * playbackRate;
      
      // Giới hạn trong khoảng hợp lệ
      elapsedSeconds = Math.max(0, Math.min(elapsedSeconds, totalDuration));

      if (elapsedSeconds >= totalDuration - 0.05) {
        setCurrentTime(totalDuration);
        setIsPlaying(false);
        stopAudio();
        elapsedOffsetRef.current = 0;
        setActiveSegmentIndex(0);
        activeSegmentIndexRef.current = 0;
        if (onEnded) {
          onEnded();
        }
        return;
      }

      setCurrentTime(elapsedSeconds);

      // Tìm segment active
      const activeIdx = segmentOffsets.findIndex(
        (offset) => elapsedSeconds >= offset.start && elapsedSeconds <= offset.end
      );
      if (activeIdx !== -1) {
        if (activeIdx !== activeSegmentIndexRef.current) {
          activeSegmentIndexRef.current = activeIdx;
          setActiveSegmentIndex(activeIdx);
        }
      }

      if (analyserRef.current) {
        const dataArr = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArr);
        const values: number[] = [];
        for (let i = 0; i < 32; i++) {
          const weight = i < 8 ? 1.0 : i < 16 ? 1.3 : 1.6;
          values.push(Math.min(255, (dataArr[i] || 0) * weight));
        }
        setFrequencyData(values);
      }

      animFrameIdRef.current = requestAnimationFrame(updateProgress);
    };

    animFrameIdRef.current = requestAnimationFrame(updateProgress);
  };

  const stopTrackingProgress = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
  };

  const stopAudio = () => {
    stopTrackingProgress();
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (err) {}
      sourceNodeRef.current = null;
    }
  };

  const playJingle = () => {
    if (!audioCtxRef.current) return;
    try {
      const now = audioCtxRef.current.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const noteDurations = [0.1, 0.1, 0.1, 0.3];

      notes.forEach((freq, idx) => {
        const osc = audioCtxRef.current!.createOscillator();
        const jingleGain = audioCtxRef.current!.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        jingleGain.gain.setValueAtTime(0, now + idx * 0.08);
        jingleGain.gain.linearRampToValueAtTime(volume * 0.08, now + idx * 0.08 + 0.01);
        jingleGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + noteDurations[idx]);

        osc.connect(jingleGain);
        jingleGain.connect(audioCtxRef.current!.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + noteDurations[idx]);
      });
    } catch (err) {
      console.warn("Failed to play transition jingle:", err);
    }
  };

  const startBgMusic = () => {
    console.log("[DEBUG] startBgMusic called, ctx:", !!audioCtxRef.current, "enabled:", isBgMusicEnabled);
    if (!audioCtxRef.current || !isBgMusicEnabled) return;
    const genre = userPref.audioMusicGenre ?? "lofi";
    console.log("[DEBUG] startBgMusic genre:", genre);
    if (genre === "none") return;

    try {
      stopBgMusic();
      console.log("[DEBUG] startBgMusic starting setup...");
      const now = audioCtxRef.current.currentTime;

      const masterGain = audioCtxRef.current.createGain();
      // Bắt đầu từ 0 để fade-in mượt mà
      masterGain.gain.setValueAtTime(0, now);
      const targetVol = (userPref.audioMusicVolume ?? bgMusicVolume) * volume * 0.08;
      const fadeDur = userPref.audioFadeDuration ?? 1.5;
      masterGain.gain.linearRampToValueAtTime(targetVol, now + fadeDur);
      
      masterGain.connect(audioCtxRef.current.destination);
      bgGainRef.current = masterGain;
      console.log("[DEBUG] ManualPcmPlayer set bgGainRef.current:", !!bgGainRef.current);

      // Chọn hợp âm & loại sóng dựa trên thể loại nhạc
      let baseFreqs = [130.81, 164.81, 196.00, 246.94]; // Mặc định: Lofi (Cmaj7)
      let type: OscillatorType = "sine";
      let detuneMultiplier = 1;

      if (genre === "acoustic") {
        baseFreqs = [261.63, 329.63, 392.00, 523.25]; // C Major
        type = "triangle";
        detuneMultiplier = 0.5;
      } else if (genre === "synthwave") {
        baseFreqs = [110.00, 165.00, 220.00, 330.00]; // Am pulse style
        type = "sawtooth";
        detuneMultiplier = 2.5;
      } else if (genre === "classical") {
        baseFreqs = [196.00, 293.66, 349.23, 440.00]; // G7 classical style
        type = "sine";
        detuneMultiplier = 0.2;
      }

      const oscs: OscillatorNode[] = [];

      baseFreqs.forEach((freq, idx) => {
        const osc = audioCtxRef.current!.createOscillator();
        osc.type = type;
        const detune = ((idx % 3) * 0.7 - 0.7) * detuneMultiplier;
        osc.frequency.setValueAtTime(freq + detune, now);
        osc.detune.setValueAtTime(detune * 2, now);

        const gain = audioCtxRef.current!.createGain();
        const vol = 0.025 + (idx * 0.005);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.linearRampToValueAtTime(vol * 0.6, now + 2.5);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + idx * 0.18);
        oscs.push(osc);
      });

      bgOscsRef.current = oscs;
    } catch (err) {
      console.warn("Failed to start background music:", err);
    }
  };

  const stopBgMusic = () => {
    if (bgGainRef.current && audioCtxRef.current) {
      try {
        const now = audioCtxRef.current.currentTime;
        const fadeDur = userPref.audioFadeDuration ?? 1.5;
        const currentGain = bgGainRef.current.gain;
        currentGain.cancelScheduledValues(now);
        currentGain.setValueAtTime(currentGain.value, now);
        currentGain.linearRampToValueAtTime(0, now + fadeDur);
        
        const oscs = bgOscsRef.current;
        const gainNode = bgGainRef.current;
        setTimeout(() => {
          oscs.forEach(osc => {
            try { osc.stop(); osc.disconnect(); } catch(e){}
          });
          try { gainNode.disconnect(); } catch(e){}
        }, fadeDur * 1000 + 100);
        
        bgOscsRef.current = [];
        bgGainRef.current = null;
        return;
      } catch (e) {
        console.warn("Failed to stop bg music with fade:", e);
      }
    }

    if (bgOscsRef.current.length > 0) {
      bgOscsRef.current.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {}
      });
      bgOscsRef.current = [];
    }
    if (bgGainRef.current) {
      try {
        bgGainRef.current.disconnect();
      } catch (e) {}
      bgGainRef.current = null;
    }
  };

  useEffect(() => {
    console.log("[DEBUG] ManualPcmPlayer isPlaying changed:", isPlaying);
    if (isPlaying && isBgMusicEnabled) {
      console.log("[DEBUG] ManualPcmPlayer calling startBgMusic");
      startBgMusic();
    } else {
      console.log("[DEBUG] ManualPcmPlayer calling stopBgMusic");
      stopBgMusic();
    }
    return () => {
      console.log("[DEBUG] ManualPcmPlayer cleaning up isPlaying effect");
      stopBgMusic();
    };
  }, [isPlaying, isBgMusicEnabled]);

  useEffect(() => {
    if (bgGainRef.current && audioCtxRef.current) {
      console.log("[DEBUG] Ducking Music firing. isDucked:", isDucked);
      const baseMusicVol = (userPref.audioMusicVolume ?? bgMusicVolume) * volume * 0.08;
      const activeBgVolume = isDucked ? baseMusicVol * 0.01 : baseMusicVol;
      bgGainRef.current.gain.setTargetAtTime(activeBgVolume, audioCtxRef.current.currentTime, 0.2);
    }
  }, [bgMusicVolume, volume, isDucked, userPref.audioMusicVolume]);

  useEffect(() => {
    if (isPlaying) {
      startTrackingProgress();
      window.dispatchEvent(new CustomEvent("commutecast-player-state", { detail: { isPlaying: true, id: briefingId } }));
    } else {
      stopTrackingProgress();
      window.dispatchEvent(new CustomEvent("commutecast-player-state", { detail: { isPlaying: false, id: briefingId } }));
    }
  }, [isPlaying, briefingId]);

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      const baseVol = userPref.audioNormalize ? volume * 1.35 : volume;
      const activeVolume = isDucked ? baseVol * 0.15 : baseVol;
      gainNodeRef.current.gain.setTargetAtTime(activeVolume, audioCtxRef.current.currentTime, 0.15);
    }
  }, [volume, isDucked, userPref.audioNormalize]);

  useEffect(() => {
    let interval: any;
    if (!isPlaying) {
      interval = setInterval(() => {
        setFrequencyData((prev) =>
          prev.map((_, i) => {
            const angle = (Date.now() * 0.002) + (i * 0.4);
            return Math.sin(angle) * 8 + 12;
          })
        );
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle global player control events from keyboard shortcuts
  useEffect(() => {
    const handleTogglePlayEvent = () => {
      handlePlayPause();
    };
    const handlePauseEvent = () => {
      if (isPlaying) {
        handlePlayPause();
      }
    };
    const handleSeekEvent = (e: Event) => {
      const direction = (e as CustomEvent).detail?.direction;
      if (direction === "forward") {
        handleSkip(10);
      } else if (direction === "backward") {
        handleSkip(-10);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handleSkip(-10);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleSkip(10);
      }
    };

    window.addEventListener("commutecast-toggle-play", handleTogglePlayEvent);
    window.addEventListener("commutecast-pause", handlePauseEvent);
    window.addEventListener("commutecast-seek", handleSeekEvent);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("commutecast-toggle-play", handleTogglePlayEvent);
      window.removeEventListener("commutecast-pause", handlePauseEvent);
      window.removeEventListener("commutecast-seek", handleSeekEvent);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlaying, currentTime, totalDuration, playbackRate, volume]);

  // ===== FIX: Xử lý rate change với giới hạn =====
  const handleRateChange = (rate: number) => {
    // Giới hạn rate để tránh biến dạng giọng quá nhiều
    if (rate < 0.6) {
      alert(uiLanguage === "vi" 
        ? "Tốc độ quá chậm có thể làm biến dạng giọng. Khuyến nghị từ 0.75x đến 2.0x." 
        : "Speed too slow may distort voice. Recommended 0.75x to 2.0x.");
      return;
    }
    if (rate > 2.5) {
      alert(uiLanguage === "vi" 
        ? "Tốc độ quá nhanh có thể làm biến dạng giọng. Khuyến nghị từ 0.75x đến 2.0x." 
        : "Speed too fast may distort voice. Recommended 0.75x to 2.0x.");
      return;
    }
    setPlaybackRate(rate);
  };

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      stopAudio();
    } else {
      const startPos = currentTime >= totalDuration ? 0 : currentTime;
      telemetry.track("audio_play_start", { currentTime: startPos });
      playAudio(startPos);
    }
  }, [isPlaying, currentTime, totalDuration, stopAudio, playAudio]);

  const handleSkip = useCallback((seconds: number) => {
    const newTime = Math.max(0, Math.min(currentTime + seconds, totalDuration));
    setCurrentTime(newTime);
    if (isPlaying) {
      playAudio(newTime);
    } else {
      elapsedOffsetRef.current = newTime;
      const activeIdx = segmentOffsets.findIndex(
        (offset) => newTime >= offset.start && newTime <= offset.end
      );
      if (activeIdx !== -1) {
        activeSegmentIndexRef.current = activeIdx;
        setActiveSegmentIndex(activeIdx);
      }
    }
  }, [isPlaying, currentTime, totalDuration, playAudio, segmentOffsets]);

  // Media Session API Integration
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    // Update metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || (uiLanguage === "vi" ? "Bản tin CommuteCast" : "CommuteCast Briefing"),
      artist: "CommuteCast Radio",
      album: uiLanguage === "vi" ? "Bản tin cá nhân hóa" : "Personalized Briefing",
      artwork: [
        { src: '/icon-192.jpg', sizes: '192x192', type: 'image/jpeg' },
        { src: '/icon-512.jpg', sizes: '512x512', type: 'image/jpeg' },
      ]
    });

    // Update playback state
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Set handlers
    navigator.mediaSession.setActionHandler('play', () => {
      if (!isPlaying) handlePlayPause();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      if (isPlaying) handlePlayPause();
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const skipTime = details.seekOffset || 10;
      handleSkip(-skipTime);
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skipTime = details.seekOffset || 10;
      handleSkip(skipTime);
    });
    
    // nexttrack calls onEnded to go to next briefing if available
    if (onEnded) {
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        onEnded();
      });
    } else {
      navigator.mediaSession.setActionHandler('nexttrack', null);
    }

    // previoustrack is NOT supported by our current logic, so we keep it null
    navigator.mediaSession.setActionHandler('previoustrack', null);

    return () => {
      // Cleanup handlers
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
      }
    };
  }, [isPlaying, title, uiLanguage, onEnded, handlePlayPause, handleSkip]);

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (isPlaying) {
      playAudio(newTime);
    } else {
      elapsedOffsetRef.current = newTime;
      const activeIdx = segmentOffsets.findIndex(
        (offset) => newTime >= offset.start && newTime <= offset.end
      );
      if (activeIdx !== -1) {
        activeSegmentIndexRef.current = activeIdx;
        setActiveSegmentIndex(activeIdx);
      }
    }
  };

  const handleChapterClick = (index: number) => {
    if (segmentOffsets[index]) {
      const targetTime = segmentOffsets[index].start;
      setCurrentTime(targetTime);
      playAudio(targetTime);
      activeSegmentIndexRef.current = index;
      setActiveSegmentIndex(index);
      setCurrentPlayingIndex(index);
    }
  };

  const handleDownloadWav = async () => {
    if (isPreparingDownload) return;
    setIsPreparingDownload(true);

    try {
      const response = await fetch(getApiUrl("/api/prepare-wav"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title || "CommuteSummary",
          chunksJson: JSON.stringify(audioChunks),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.downloadUrl) {
          const a = document.createElement("a");
          a.href = data.downloadUrl;
          a.download = `${title || "CommuteSummary"}_Audio_24khz.wav`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setIsPreparingDownload(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Server-side prepare failed, falling back to local packaging...", err);
    }

    try {
      await exportBriefingAsWav(audioChunks, title || "CommuteSummary");
    } catch (err) {
      alert(uiLanguage === "vi" ? "Tải xuống âm thanh thất bại." : "Failed to package WAV file for download.");
    } finally {
      setIsPreparingDownload(false);
    }
  };

  const handleCopyTranscript = () => {
    try {
      const fullTranscript = [
        `🎙️ BẢN TIN PHÁT THANH: ${title || "CommuteCast"}`,
        `==================================`,
        `[${pt.labelIntro}]`,
        payload.introduction,
        ...payload.chapters.map((ch, idx) => `\n[${idx + 1}. ${ch.topic}]\n${ch.scriptText}`),
        `\n[${pt.labelOutro}]`,
        payload.conclusion,
        `==================================`,
        `© 2026 CommuteCast Radio News | Vận hành bởi Gemini 3.5 & TTS`
      ].join("\n");
      
      let successful = false;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(fullTranscript);
        successful = true;
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = fullTranscript;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          successful = document.execCommand("copy");
        } catch (err) {
          console.error("Fallback copy failed", err);
        }
        document.body.removeChild(textArea);
      }

      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      } else {
        alert(uiLanguage === "vi" 
          ? "Thiết bị không hỗ trợ sao chép tự động. Bạn vui lòng tự bôi đen văn bản để sao chép." 
          : "Auto-copy not supported. Please select text manually to copy."
        );
      }
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleShareZalo = () => {
    const postTitle = title ? `Bản tin phát thanh CommuteCast: ${title}` : "Nghe Bản tin phát thanh cá nhân hóa của tôi!";
    const shareUrl = window.location.href;
    const encodedTitle = encodeURIComponent(postTitle);
    const encodedUrl = encodeURIComponent(shareUrl);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      const mobileShareLink = `zalo://app?action=share&url=${encodedUrl}&title=${encodedTitle}`;
      const backupWebLink = `https://zalo.me/share?url=${encodedUrl}&title=${encodedTitle}`;
      
      window.location.href = mobileShareLink;

      setTimeout(() => {
        if (!document.hidden) {
          window.location.href = backupWebLink;
        }
      }, 1500);
    } else {
      const webShareLink = `https://sp.zalo.me/share_to_zalo?url=${encodedUrl}&title=${encodedTitle}`;
      window.open(webShareLink, "_blank", "width=600,height=500,scrollbars=yes,resizable=yes");
    }
  };

  const handleShareFacebook = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(shareUrl, "_blank", "width=600,height=550,scrollbars=yes,resizable=yes");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const [showStudio, setShowStudio] = useState(false);

  return (
    <>
      <AnimatePresence>
        {userPref.isDrivingMode && typeof document !== "undefined" && createPortal(
          <DrivingMode
            key="driving-active"
            title={title || (uiLanguage === "vi" ? "Bản tin hành trình của bạn" : "Custom Commute Podcast")}
            isPlaying={isPlaying}
            currentTime={currentTime}
            totalDuration={totalDuration}
            onPlayPause={handlePlayPause}
            onSkip={handleSkip}
            onScrubberChange={handleScrubberChange}
            onExit={() => updateDrivingMode(false)}
            uiLanguage={uiLanguage}
            savedBriefings={savedBriefings}
            onPlaySavedBriefing={onPlaySavedBriefing}
            onNext={onEnded}
            onDuckingChange={setIsDucked}
          />,
          document.body
        )}
      </AnimatePresence>

      <div className={cn("flex flex-col gap-8 max-w-3xl mx-auto", userPref.isDrivingMode ? "hidden" : "")} id="pcm-commute-player">
        
        {/* PREMIUM PLAYER DECK */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-75 transition-opacity"
               style={{ backgroundColor: `${colors.interactive}33` }} />
          <div className="relative border rounded-[2rem] p-8 shadow-2xl overflow-hidden"
               style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-10"
                   style={{ backgroundColor: colors.interactive }} />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-10"
                   style={{ backgroundColor: colors.interactive }} />
            </div>

            {/* Top Status Bar */}
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md"
                     style={{ backgroundColor: `${colors.surface}80`, borderColor: colors.border }}>
                  <div className="relative flex h-2 w-2">
                    <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", isPlaying ? "animate-ping" : "")}
                          style={{ backgroundColor: isPlaying ? colors.interactive : colors.textMuted }} />
                    <span className={cn("relative inline-flex rounded-full h-2 w-2")}
                          style={{ backgroundColor: isPlaying ? colors.interactive : colors.textMuted }} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono"
                        style={{ color: colors.textSecondary }}>
                    {isPlaying ? (uiLanguage === "vi" ? "Đang Phát" : "On Air") : (uiLanguage === "vi" ? "Chế Độ Chờ" : "Standby")}
                  </span>
                </div>
                {isHighQualityVoice && (
                  <div className="px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-widest animate-pulse"
                       style={{ backgroundColor: `${colors.interactive}1a`, borderColor: `${colors.interactive}33`, color: colors.interactive }}>
                    Studio HD
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDownloadWav()}
                  disabled={isPreparingDownload}
                  className="p-2 rounded-full transition-all disabled:opacity-30"
                  style={{ color: colors.textMuted }}
                  title={pt.exportBtn}
                >
                  {isPreparingDownload ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: colors.textMuted }} /> : <Download className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="p-2 rounded-full transition-all"
                  style={{ color: colors.textMuted }}
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Media Info */}
            <div className="mb-10 relative z-10 text-center md:text-left">
              <h2 className="text-3xl font-black tracking-tight leading-tight mb-2"
                  style={{ color: colors.textPrimary }}>
                {title || (uiLanguage === "vi" ? "Bản tin không đề" : "Untitled Briefing")}
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <p className="text-sm font-medium" style={{ color: colors.textMuted }}>
                  {pt.poweredBy}
                </p>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: colors.border }} />
                <span className="text-xs font-mono uppercase tracking-widest" style={{ color: colors.textMuted }}>
                  {preferencesInfo || "Mono 24kHz"}
                </span>
              </div>
            </div>

            {/* Visualizer & Scrubber Area */}
            <div className="space-y-6 relative z-10">
              {/* Custom High-Fidelity Waveform */}
              <div className="h-16 flex items-end gap-1 px-2">
                {frequencyData.map((val, i) => {
                  const h = Math.max(4, (val / 255) * 64);
                  const active = (i / 32) <= (currentTime / (totalDuration || 1));
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "flex-1 rounded-full transition-all duration-150",
                        active ? "shadow-[0_0_15px_rgba(245,158,11,0.5)]" : ""
                      )}
                      style={{ 
                        height: `${h}px`,
                        backgroundColor: active ? colors.interactive : `${colors.interactive}1a` 
                      }}
                    />
                  );
                })}
              </div>

              {/* Enhanced Scrubber */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={0}
                  max={totalDuration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleScrubberChange}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer transition-all focus:outline-none"
                  style={{ backgroundColor: `${colors.interactive}1a` }}
                />
                <div className="flex justify-between text-[11px] font-black font-mono tracking-widest">
                  <span style={{ color: colors.textSecondary }}>{formatTime(currentTime)}</span>
                  <span onClick={() => setShowRemaining(!showRemaining)} 
                        className="cursor-pointer transition-colors"
                        style={{ color: colors.textSecondary }}>
                    {showRemaining ? `-${formatTime(totalDuration - currentTime)}` : formatTime(totalDuration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Master Controls */}
            <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <button onClick={() => handleSkip(-10)} 
                        className="p-3 transition-colors"
                        style={{ color: colors.textMuted }}>
                  <RotateCcw className="w-6 h-6" />
                </button>
                
                <button 
                  onClick={handlePlayPause}
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
                  style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
                >
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>

                <button onClick={() => handleSkip(10)} 
                        className="p-3 transition-colors"
                        style={{ color: colors.textMuted }}>
                  <RotateCw className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center gap-2 p-1 rounded-2xl border"
                   style={{ backgroundColor: `${colors.surface}80`, borderColor: colors.border }}>
                {[1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleRateChange(rate)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-black transition-all"
                    )}
                    style={playbackRate === rate 
                      ? { backgroundColor: colors.interactive, color: colors.onAccent } 
                      : { color: colors.textMuted }}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECONDARY PANELS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Audio Timeline Card */}
          <Card className="p-6 shadow-sm flex flex-col gap-6"
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"
                  style={{ color: colors.textMuted }}>
                <Layers className="w-4 h-4" style={{ color: colors.interactive }} />
                <span>{uiLanguage === "vi" ? "Lộ trình bản tin" : "Audio Timeline"}</span>
              </h3>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {getTimelineSegments().map((seg, i) => {
                const isActive = currentTime >= seg.start && currentTime <= seg.end;
                return (
                  <button
                    key={i}
                    onClick={() => handleChapterClick(i)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all flex items-center gap-4 group"
                    )}
                    style={isActive 
                      ? { backgroundColor: `${colors.interactive}1a`, borderColor: `${colors.interactive}4d` } 
                      : { backgroundColor: `${colors.surfaceOverlay}33`, borderColor: colors.border }}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                    )}
                    style={isActive 
                      ? { backgroundColor: colors.interactive, color: colors.onAccent } 
                      : { backgroundColor: `${colors.surfaceOverlay}66`, color: colors.textMuted }}>
                      {isActive ? <Play className="w-3 h-3 fill-current" /> : <span className="text-[10px] font-black">{i + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs font-bold truncate")}
                         style={{ color: isActive ? colors.textPrimary : colors.textSecondary }}>
                        {seg.label}
                      </p>
                      <p className="text-[10px] font-mono mt-0.5"
                         style={{ color: `${colors.textMuted}99` }}>
                        {formatTime(seg.start)} — {formatTime(seg.end)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Share & Tools Card */}
          <Card className="p-6 shadow-sm flex flex-col gap-6"
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
             <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"
                  style={{ color: colors.textMuted }}>
                <Share2 className="w-4 h-4" style={{ color: colors.interactive }} />
                <span>{uiLanguage === "vi" ? "Công cụ & Chia sẻ" : "Tools & Share"}</span>
              </h3>
              <button 
                onClick={() => setShowStudio(!showStudio)}
                className="text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1.5"
                style={{ color: colors.interactive }}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showStudio ? (uiLanguage === "vi" ? "Đóng Studio" : "Close Studio") : (uiLanguage === "vi" ? "Mở Studio" : "Open Studio")}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                onClick={handleCopyTranscript}
                className="h-auto py-4 flex flex-col gap-2 rounded-2xl"
                style={{ borderColor: colors.border }}
              >
                {copied ? <Check className="w-5 h-5" style={{ color: colors.success }} /> : <Copy className="w-5 h-5" style={{ color: colors.textMuted }} />}
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textPrimary }}>{copied ? pt.copySuccess : pt.copyTranscript}</span>
              </Button>
              <Button 
                variant="outline"
                onClick={handleShareZalo}
                className="h-auto py-4 flex flex-col gap-2 rounded-2xl"
                style={{ borderColor: colors.border }}
              >
                <MessageSquare className="w-5 h-5" style={{ color: colors.interactive }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textPrimary }}>{pt.shareZalo}</span>
              </Button>
              <Button 
                variant="outline"
                onClick={handleShareFacebook}
                className="h-auto py-4 flex flex-col gap-2 rounded-2xl"
                style={{ borderColor: colors.border }}
              >
                <Facebook className="w-5 h-5" style={{ color: colors.interactive }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textPrimary }}>{pt.shareFacebook}</span>
              </Button>
              <ClearDataButton />
            </div>

            <div className="mt-auto p-4 rounded-2xl border"
                 style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                     style={{ backgroundColor: colors.surface }}>
                  <Headphones className="w-5 h-5" style={{ color: colors.interactive }} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest"
                     style={{ color: colors.textMuted }}>
                    {uiLanguage === "vi" ? "Phát hành bởi" : "Published via"}
                  </p>
                  <p className="text-xs font-black" style={{ color: colors.textPrimary }}>CommuteCast Studio 4.0</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* COLLAPSIBLE STUDIO PANEL */}
        <AnimatePresence>
          {showStudio && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Card className="p-8 shadow-lg flex flex-col gap-8 mb-20"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <div className="flex items-center justify-between border-b pb-4"
                     style={{ borderColor: colors.border }}>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3"
                      style={{ color: colors.textPrimary }}>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.interactive}1a` }}>
                      <Sliders className="w-4 h-4" style={{ color: colors.interactive }} />
                    </div>
                    <span>{pt.studioCenter}</span>
                  </h3>
                </div>

                {/* Audio Studio Tabs Switcher */}
                <div className="flex gap-1 p-1 rounded-xl" role="tablist"
                     style={{ backgroundColor: colors.surfaceOverlay }}>
                  {(["mixer", "music", "lexicon"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveStudioTab(tab)}
                      role="tab"
                      aria-selected={activeStudioTab === tab}
                      className={cn(
                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                      )}
                      style={activeStudioTab === tab 
                        ? { backgroundColor: colors.surface, color: colors.textPrimary } 
                        : { color: colors.textMuted }}
                    >
                      {tab === "mixer" ? "🎛️ Mixer" : tab === "music" ? "🎵 Music" : "🗣️ Lexicon"}
                    </button>
                  ))}
                </div>

                {/* Tab Contents */}
                <div className="min-h-[240px]">
                  {/* TAB 1: MIXER & EFFECTS */}
                  {activeStudioTab === "mixer" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-in">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>{pt.volumeLabel}</label>
                            <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded" style={{ backgroundColor: `${colors.interactive}1a`, color: colors.interactive }}>{Math.round(volume * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                            style={{ backgroundColor: colors.surfaceOverlay }}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>{uiLanguage === "vi" ? "Cảm xúc giọng" : "Voice Emotion"}</label>
                          <select
                            value={userPref.audioEmotion || "cheerful"}
                            onChange={(e) => updatePreferences({ audioEmotion: e.target.value as any })}
                            className="w-full text-xs font-bold border-none rounded-xl px-4 py-3 focus:ring-2"
                            style={{ backgroundColor: colors.surfaceOverlay, color: colors.textPrimary }}
                          >
                            <option value="cheerful">☀️ {uiLanguage === "vi" ? "Vui tươi" : "Cheerful"}</option>
                            <option value="professional">💼 {uiLanguage === "vi" ? "Chuyên nghiệp" : "Professional"}</option>
                            <option value="calm">🧘 {uiLanguage === "vi" ? "Điềm tĩnh" : "Calm"}</option>
                            <option value="energetic">🔥 {uiLanguage === "vi" ? "Nhiệt huyết" : "Energetic"}</option>
                          </select>
                        </div>

                        <div className="p-4 rounded-2xl border space-y-3"
                             style={{ backgroundColor: `${colors.surfaceOverlay}40`, borderColor: colors.border }}>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: colors.textMuted }}>
                            {uiLanguage === "vi" ? "Trợ lý lái xe HUD" : "Driving Assistant"}
                          </span>
                          <div className="flex flex-col gap-2">
                            <label className="flex items-center justify-between p-2.5 border rounded-xl cursor-pointer group transition-colors"
                                   style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                              <span className="text-xs font-bold flex items-center gap-2.5" style={{ color: colors.textPrimary }}>
                                <span style={{ color: colors.interactive }}>📳</span>
                                {uiLanguage === "vi" ? "Phản hồi rung" : "Haptic Feedback"}
                              </span>
                              <input
                                type="checkbox"
                                id="haptic-feedback-checkbox"
                                checked={userPref.hapticFeedbackEnabled !== false}
                                onChange={(e) => updatePreferences({ hapticFeedbackEnabled: e.target.checked })}
                                className="w-4 h-4 rounded cursor-pointer"
                                style={{ borderColor: colors.border, color: colors.interactive }}
                              />
                            </label>

                            <label className="flex items-center justify-between p-2.5 border rounded-xl cursor-pointer group transition-colors"
                                   style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                              <span className="text-xs font-bold flex items-center gap-2.5" style={{ color: colors.textPrimary }}>
                                <span style={{ color: colors.success }}>🗣️</span>
                                {uiLanguage === "vi" ? "Từ khóa kích hoạt (Wake Word)" : "Require Wake Word"}
                              </span>
                              <input
                                type="checkbox"
                                id="wake-word-checkbox"
                                checked={userPref.wakeWordEnabled !== false}
                                onChange={(e) => updatePreferences({ wakeWordEnabled: e.target.checked })}
                                className="w-4 h-4 rounded cursor-pointer"
                                style={{ borderColor: colors.border, color: colors.interactive }}
                              />
                            </label>

                            <label className="flex items-center justify-between p-2.5 border rounded-xl cursor-pointer group transition-colors"
                                   style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                              <span className="text-xs font-bold flex items-center gap-2.5" style={{ color: colors.textPrimary }}>
                                <span style={{ color: colors.interactive || "#3b82f6" }}>🚗</span>
                                {uiLanguage === "vi" ? "Tự động gợi ý Chế độ lái xe" : "Auto-suggest Driving Mode"}
                              </span>
                              <input
                                type="checkbox"
                                id="auto-suggest-driving-mode-checkbox"
                                checked={!!userPref.autoSuggestDrivingModeEnabled}
                                onChange={(e) => updatePreferences({ autoSuggestDrivingModeEnabled: e.target.checked })}
                                className="w-4 h-4 rounded cursor-pointer"
                                style={{ borderColor: colors.border, color: colors.interactive }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl border space-y-4"
                           style={{ backgroundColor: `${colors.surfaceOverlay}80`, borderColor: colors.border }}>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: colors.textMuted }}>DSP Signal Processing</span>
                <div className="flex flex-col gap-3">
                  {[
                    { id: "audioNormalize", label: uiLanguage === "vi" ? "Chuẩn hóa giọng" : "Normalization", icon: "📈", color: colors.interactive },
                    { id: "audioLimiter", label: uiLanguage === "vi" ? "Chống rè (Limiter)" : "Peak Limiter", icon: "🛡️", color: colors.critical },
                    { id: "audioNoiseReduction", label: uiLanguage === "vi" ? "Giảm nhiễu nền" : "Noise Reduction", icon: "🍃", color: colors.success }
                  ].map((effect) => (
                    <label key={effect.id} className="flex items-center justify-between p-3 border rounded-xl cursor-pointer group transition-colors"
                           style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                      <span className="text-xs font-bold flex items-center gap-3" style={{ color: colors.textPrimary }}>
                        <span style={{ color: effect.color }}>{effect.icon}</span>
                        {effect.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={(userPref as any)[effect.id] || false}
                        onChange={(e) => updatePreferences({ [effect.id]: e.target.checked })}
                        className="w-4 h-4 rounded cursor-pointer"
                        style={{ borderColor: colors.border, color: colors.interactive }}
                      />
                    </label>
                  ))}
                </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: BACKGROUND MUSIC & FADE */}
                  {activeStudioTab === "music" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-fade-in">
                      <div className="space-y-8">
                        <div className="flex items-center justify-between p-4 rounded-2xl"
                             style={{ backgroundColor: colors.surfaceOverlay }}>
                          <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors")}
                                 style={isBgMusicEnabled 
                                   ? { backgroundColor: colors.interactive, color: colors.onAccent } 
                                   : { backgroundColor: colors.surface, color: colors.textMuted }}>
                              <Radio className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black" style={{ color: colors.textPrimary }}>{uiLanguage === "vi" ? "Nhạc nền" : "Background Music"}</p>
                              <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: colors.textMuted }}>{isBgMusicEnabled ? "Active" : "Disabled"}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsBgMusicEnabled(!isBgMusicEnabled)}
                            className={cn("w-12 h-6 rounded-full relative transition-colors")}
                            style={isBgMusicEnabled 
                              ? { backgroundColor: colors.interactive } 
                              : { backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
                          >
                            <div className={cn("absolute top-1 left-1 w-4 h-4 rounded-full transition-all")}
                                 style={{ backgroundColor: isBgMusicEnabled ? colors.onAccent : colors.textMuted, transform: isBgMusicEnabled ? 'translateX(24px)' : 'none' }} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>{uiLanguage === "vi" ? "Thể loại (Genre)" : "Music Genre"}</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: "lofi", label: "☕ Lofi", active: userPref.audioMusicGenre === "lofi" },
                              { id: "acoustic", label: "🎸 Acoustic", active: userPref.audioMusicGenre === "acoustic" },
                              { id: "synthwave", label: "🚀 Synth", active: userPref.audioMusicGenre === "synthwave" },
                              { id: "classical", label: "🎹 Piano", active: userPref.audioMusicGenre === "classical" }
                            ].map((g) => (
                              <button
                                key={g.id}
                                disabled={!isBgMusicEnabled}
                                onClick={() => updatePreferences({ audioMusicGenre: g.id as any })}
                                className={cn(
                                  "py-3 rounded-xl text-xs font-bold border transition-all"
                                )}
                                style={g.active 
                                  ? { backgroundColor: colors.interactive, borderColor: colors.interactive, color: colors.onAccent } 
                                  : { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textMuted }}
                              >
                                {g.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>{uiLanguage === "vi" ? "Âm lượng nhạc" : "BGM Volume"}</label>
                            <span className="text-[10px] font-black font-mono" style={{ color: colors.interactive }}>{Math.round((userPref.audioMusicVolume ?? bgMusicVolume) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min={0.02}
                            max={0.5}
                            step={0.02}
                            disabled={!isBgMusicEnabled}
                            value={userPref.audioMusicVolume ?? bgMusicVolume}
                            onChange={(e) => updatePreferences({ audioMusicVolume: parseFloat(e.target.value) })}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-30"
                            style={{ backgroundColor: colors.surfaceOverlay }}
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>Fade Duration</label>
                            <span className="text-[10px] font-black font-mono" style={{ color: colors.textPrimary }}>{(userPref.audioFadeDuration ?? 1.5).toFixed(1)}s</span>
                          </div>
                          <input
                            type="range"
                            min={0.5}
                            max={4.0}
                            step={0.1}
                            disabled={!isBgMusicEnabled}
                            value={userPref.audioFadeDuration ?? 1.5}
                            onChange={(e) => updatePreferences({ audioFadeDuration: parseFloat(e.target.value) })}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-30"
                            style={{ backgroundColor: colors.surfaceOverlay }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LEXICON & PREVIEW */}
                  {activeStudioTab === "lexicon" && (
                    <div className="space-y-8 animate-fade-in">
                       <div className="p-6 rounded-2xl border flex flex-col md:flex-row items-center gap-6"
                            style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
                         <div className="flex-1 space-y-2">
                           <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: colors.textPrimary }}>Voice Preview</h4>
                           <input
                            type="text"
                            value={previewText}
                            onChange={(e) => setPreviewText(e.target.value)}
                            placeholder="Type something to test..."
                            className="w-full text-sm font-bold rounded-xl px-4 py-3 focus:ring-2"
                            style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                          />
                         </div>
                         <Button 
                          onClick={handlePlayVoicePreview}
                          disabled={isPreviewing || !previewText.trim()}
                          className="h-14 px-8 rounded-xl flex items-center gap-2"
                          style={{ backgroundColor: colors.interactive, color: colors.onAccent }}
                         >
                            {isPreviewing ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: colors.onAccent }} /> : <Play className="w-4 h-4 fill-current" />}
                            <span className="font-black uppercase tracking-widest text-xs">Preview</span>
                         </Button>
                       </div>

                       <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>Pronunciation Lexicon</h4>
                          </div>
                          <div className="flex gap-2">
                          <input
                            type="text"
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            placeholder="Original Word"
                            className="flex-1 text-xs font-bold border-none rounded-xl px-4 py-3"
                            style={{ backgroundColor: colors.surfaceOverlay, color: colors.textPrimary }}
                          />
                          <input
                            type="text"
                            value={newReplace}
                            onChange={(e) => setNewReplace(e.target.value)}
                            placeholder="Read As..."
                            className="flex-1 text-xs font-bold border-none rounded-xl px-4 py-3"
                            style={{ backgroundColor: colors.surfaceOverlay, color: colors.textPrimary }}
                          />
                          <Button onClick={handleAddPronunciation} className="px-6 font-black uppercase text-xs tracking-widest" style={{ backgroundColor: colors.interactive, color: colors.onAccent }}>Add</Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {(userPref.audioPronunciationDict || []).map((entry) => (
                            <div key={entry.word} className="flex items-center justify-between p-3 rounded-xl border group"
                                 style={{ backgroundColor: colors.surfaceOverlay, borderColor: colors.border }}>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black" style={{ color: colors.textPrimary }}>{entry.word}</span>
                                <ArrowRight className="w-3 h-3" style={{ color: colors.textMuted }} />
                                <span className="text-[11px] font-black" style={{ color: colors.interactive }}>{entry.replace}</span>
                              </div>
                              <button 
                                onClick={() => handleRemovePronunciation(entry.word)} 
                                className="p-1 transition-colors opacity-0 group-hover:opacity-100 hover:scale-110" 
                                style={{ color: colors.textMuted }}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Read-Along Script Display (Full Width) */}
        <div className="rounded-[2rem] border shadow-sm p-8 flex flex-col gap-6"
             style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3"
                style={{ color: colors.textPrimary }}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors.interactive}1a` }}>
                <Layers className="w-4 h-4" style={{ color: colors.interactive }} />
              </div>
              <span>{pt.scriptTitle}</span>
            </h4>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: colors.textMuted }}>{pt.scriptSub}</span>
          </div>

          <div className="flex flex-col gap-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
            {allSegments.map((seg, sIdx) => {
              const isActive = currentPlayingIndex === sIdx;
              
              return (
                <div
                  key={sIdx}
                  ref={(el) => { segmentRefs.current[sIdx] = el; }}
                  onClick={() => handleChapterClick(sIdx)}
                  className={cn(
                    "text-left p-6 rounded-2xl border transition-all duration-500 cursor-pointer group relative"
                  )}
                  style={isActive 
                    ? { backgroundColor: `${colors.interactive}0d`, borderColor: colors.interactive, boxShadow: `0 0 15px ${colors.interactive}1a` } 
                    : { backgroundColor: `${colors.surfaceOverlay}33`, borderColor: colors.border, opacity: 0.6 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded"
                    )}
                    style={isActive 
                      ? { backgroundColor: colors.interactive, color: colors.onAccent } 
                      : { backgroundColor: `${colors.surface}80`, color: colors.textMuted }}>
                      {seg.type === "intro" ? pt.labelIntro : seg.type === "outro" ? pt.labelOutro : pt.labelTopic}
                    </span>
                    
                    <span className={cn(
                      "text-[10px] font-black"
                    )}
                    style={{ color: isActive ? colors.interactive : colors.textMuted }}>
                      {seg.title}
                    </span>
                  </div>

                  <p className={cn(
                    "text-sm leading-relaxed transition-all duration-500"
                  )}
                  style={{ color: isActive ? colors.textPrimary : colors.textMuted, fontWeight: isActive ? 700 : 400 }}>
                    {seg.text}
                  </p>

                  {seg.bullets && seg.bullets.length > 0 && (
                    <div className="mt-4 pl-4 border-l-2 flex flex-col gap-2"
                         style={{ borderColor: colors.border }}>
                      {seg.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="flex gap-3 items-start text-xs" style={{ color: colors.textMuted }}>
                          <Check className={cn("w-3.5 h-3.5 mt-0.5 shrink-0")} style={{ color: isActive ? colors.interactive : `${colors.textMuted}80` }} />
                          <span style={{ color: isActive ? colors.textPrimary : colors.textMuted, fontWeight: isActive ? 500 : 400 }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {briefingId && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          briefingId={briefingId}
          uiLanguage={uiLanguage}
        />
      )}
    </>
  );
}
