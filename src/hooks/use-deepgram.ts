"use client";

import { useState, useCallback, useRef } from "react";
import { getAccessToken } from "@/lib/api-client";

export interface TranscriptLine {
  text: string;
  /** Deepgram diarization index (0, 1, …). With one mic or mixed audio often only 0 appears — UI must not assume 0=asesor. */
  speaker: number;
  timestamp: number;
  isFinal: boolean;
}

interface UseDeepgramResult {
  isRecording: boolean;
  transcript: TranscriptLine[];
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  error: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = API_URL.replace(/^http/, "ws");

export function useDeepgram(onTranscript?: (lines: TranscriptLine[]) => void): UseDeepgramResult {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript([]);
    setIsRecording(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000 },
      });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 16000 });
      mediaRecorderRef.current = recorder;

      const token = getAccessToken();
      const wsUrl = `${WS_BASE}/api/v1/voz/transcribir${token ? `?token=${encodeURIComponent(token)}` : ""}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(e.data);
          }
        };
        recorder.start(250);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const channel = data?.channel;
          const alternatives = channel?.alternatives?.[0];
          if (!alternatives?.transcript) return;
          const words = alternatives.words || [];
          const speaker = Number(words[0]?.speaker ?? 0);
          const line: TranscriptLine = {
            text: alternatives.transcript,
            speaker,
            timestamp: Date.now(),
            isFinal: !!data.is_final,
          };

          setTranscript((prev) => {
            // Only replace the last line if it was ALSO interim (not final).
            // This prevents destroying finalized lines from previous utterances.
            if (!data.is_final) {
              // Interim: replace last interim, or append if last was final
              const lastLine = prev[prev.length - 1];
              if (lastLine && !lastLine.isFinal) {
                const next = [...prev.slice(0, -1), line];
                onTranscript?.(next);
                return next;
              }
              // Last was final (or empty) — append this interim as new
              const next = [...prev, line];
              onTranscript?.(next);
              return next;
            }

            // Final result: replace the last interim for this segment, or append
            const lastLine = prev[prev.length - 1];
            if (lastLine && !lastLine.isFinal) {
              const next = [...prev.slice(0, -1), line];
              onTranscript?.(next);
              return next;
            }
            // No pending interim — just append the final line
            const next = [...prev, line];
            onTranscript?.(next);
            return next;
          });
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => setError("Error de conexión con el servidor de voz");
      ws.onclose = (ev) => {
        if (ev.code !== 1000 && ev.code !== 1001) {
          setError(ev.reason || "Conexión cerrada. Verifica que el backend esté corriendo en el puerto 8000.");
        }
      };
    } catch (err) {
      setIsRecording(false);
      setError(err instanceof Error ? err.message : "Error al acceder al micrófono");
    }
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    setIsRecording(false);
  }, []);

  return { isRecording, transcript, startRecording, stopRecording, error };
}
