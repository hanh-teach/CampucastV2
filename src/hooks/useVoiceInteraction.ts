import { useState, useRef, useEffect, useCallback } from 'react';

export type VoiceState = 'idle' | 'listening' | 'speaking' | 'processing' | 'error';

const resampleTo16k = (inputBuffer: Float32Array, inputSampleRate: number): Float32Array => {
  if (inputSampleRate === 16000) {
    return inputBuffer;
  }
  
  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(inputBuffer.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    const position = i * ratio;
    const index = Math.floor(position);
    const fraction = position - index;
    
    if (index + 1 < inputBuffer.length) {
      result[i] = inputBuffer[index] * (1 - fraction) + inputBuffer[index + 1] * fraction;
    } else {
      result[i] = inputBuffer[index];
    }
  }
  
  return result;
};

export const useVoiceInteraction = () => {
  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const receivedFirstMessageRef = useRef<boolean>(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextPlaybackTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    nextPlaybackTimeRef.current = 0;
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(err => console.error("Error closing AudioContext:", err));
      audioContextRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const pcmToBase64 = (pcm: Float32Array) => {
    const buffer = new Int16Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) {
        buffer[i] = Math.max(-1, Math.min(1, pcm[i])) * 0x7FFF;
    }
    return btoa(String.fromCharCode(...new Uint8Array(buffer.buffer)));
  }

  const playAudioChunk = async (audioCtx: AudioContext, base64: string) => {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const pcm = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm.length);
      for (let i = 0; i < pcm.length; i++) float32[i] = pcm[i] / 0x7FFF;

      // Gemini Live API returns mono PCM at 24000Hz (24kHz).
      // Playing it at 16000Hz makes the voice pitch slow, deep, and heavily distorted.
      // Playing it at 24000Hz restores the clean, high-fidelity native voice quality.
      const sampleRate = 24000;
      const buffer = audioCtx.createBuffer(1, float32.length, sampleRate);
      buffer.copyToChannel(float32, 0);

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      // If the scheduled time has already passed, catch up immediately to minimize latency
      if (nextPlaybackTimeRef.current < now) {
        nextPlaybackTimeRef.current = now;
      }

      // Schedule the start at the next available queue slot
      source.start(nextPlaybackTimeRef.current);
      // Advance the schedule pointer by the duration of this audio segment
      nextPlaybackTimeRef.current += buffer.duration;
    } catch (err) {
      console.error("Error in playAudioChunk:", err);
    }
  };

  const startListening = async () => {
    setState('listening');
    setError(null);
    receivedFirstMessageRef.current = false;

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập micro.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      // Do not force 16000Hz on audioCtx creation to preserve Android/iOS hardware native speed
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      nextPlaybackTimeRef.current = audioCtx.currentTime;

      // Register the AudioWorklet module
      try {
        await audioCtx.audioWorklet.addModule('/audio-processor-worklet.js');
      } catch (workletErr) {
        console.error('Failed to register AudioWorklet module:', workletErr);
        throw new Error('Không thể tải bộ xử lý âm thanh AudioWorklet.');
      }

      let token = "";
      try {
        const tokenRes = await fetch("/api/voice-token", { method: "POST" });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          token = tokenData.token || "";
        }
      } catch (err) {
        console.error("Failed to generate voice interaction session token:", err);
      }

      const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = token 
        ? `${wsProtocol}//${location.host}/ws/voice?token=${encodeURIComponent(token)}`
        : `${wsProtocol}//${location.host}/ws/voice`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const source = audioCtx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioCtx, 'audio-processor');
      
      // Route input processor into a GainNode set to 0 and connect it to destination
      // to satisfy browser AudioWorklet execution context constraints without playing mic back out
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      
      source.connect(workletNode);
      workletNode.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      workletNode.port.onmessage = (e) => {
        const float32 = e.data; // Float32Array from worklet (4096 samples)
        const resampled = resampleTo16k(float32, audioCtx.sampleRate);
        if (ws.readyState === WebSocket.OPEN) {
            const base64 = pcmToBase64(resampled);
            ws.send(JSON.stringify({ audio: base64 }));
        }
      };

      // Set timeout for the first response from server (8 seconds)
      connectionTimeoutRef.current = setTimeout(() => {
        if (!receivedFirstMessageRef.current) {
          console.warn('[WS-VOICE] Timeout waiting for first server message');
          setError('Không kết nối được máy chủ giọng nói, vui lòng thử lại.');
          setState('error');
          cleanup();
        }
      }, 8000);

      ws.onmessage = (event) => {
        receivedFirstMessageRef.current = true;
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }

        try {
          const msg = JSON.parse(event.data);
          if (msg.error === 'voice_realtime_not_available') {
            setError('Tính năng đàm thoại giọng nói thời gian thực hiện đang bảo trì, vui lòng thử lại sau.');
            setState('error');
            cleanup();
            return;
          }
          if (msg.error) {
            setError(msg.message || msg.error);
            setState('error');
            cleanup();
            return;
          }
          if (msg.audio) {
            setState('speaking');
            playAudioChunk(audioCtx, msg.audio);
          }
        } catch (e) {
          console.error("Error parsing voice WebSocket message:", e);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket Voice Error:', e);
        if (!receivedFirstMessageRef.current) {
          setError('Không kết nối được máy chủ giọng nói, vui lòng thử lại.');
          setState('error');
          cleanup();
        }
      };

      ws.onclose = () => {
        console.log('Voice WebSocket connection closed.');
        setState((current) => {
          if (current === 'error') return current;
          return 'idle';
        });
      };

    } catch (err: any) {
      console.error('Voice Interaction Error:', err);
      let errorMsg = 'Lỗi không xác định.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('Permission denied')) {
        errorMsg = 'Quyền truy cập micro bị từ chối. Vui lòng cấp quyền truy cập micro trong Cài đặt (Settings) của trình duyệt hoặc hệ điều hành để sử dụng tính năng này.';
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      setState('error');
      cleanup();
    }
  };

  const stopListening = useCallback(() => {
    cleanup();
    setState('idle');
  }, [cleanup]);

  return { state, error, startListening, stopListening };
};