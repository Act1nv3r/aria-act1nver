"use client";

import { useEffect, useRef } from "react";
import type { TranscriptLine } from "@/hooks/use-deepgram";

interface TranscriptionPanelProps {
  transcript: TranscriptLine[];
  isRecording: boolean;
  error?: string | null;
  onClose?: () => void;
}

export function TranscriptionPanel({
  transcript,
  isRecording,
  error,
  onClose,
}: TranscriptionPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  if (!isRecording) return null;

  return (
    <div
      className={`
        fixed right-0 top-[60px] w-[320px] max-h-[calc(100vh-80px)] z-[100]
        bg-[#1A2433] border-l-2 border-[#E6C78A]/40 shadow-2xl
        flex flex-col transition-all duration-300
        ${isRecording ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
    >
      <div className="flex items-center justify-between p-4 border-b border-[#5A6A85]/20">
        <h3 className="font-bold font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">
          Transcripción en vivo
        </h3>
        {isRecording && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8B3A3A] animate-pulse" />
            <span className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
              REC
            </span>
          </span>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[120px]"
      >
        {error && (
          <div className="rounded-lg bg-[#8B3A3A]/20 border border-[#8B3A3A]/40 p-3 mb-3">
            <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#E6C78A]">
              {error}
            </p>
            <p className="font-[family-name:var(--font-open-sans)] text-[11px] text-[#5A6A85] mt-1">
              Verifica que el backend esté corriendo y DEEPGRAM_API_KEY esté configurada.
            </p>
          </div>
        )}
        {transcript.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <div className="flex items-center gap-1 h-6" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-1.5 bg-[#E6C78A]/60 rounded-full origin-bottom animate-[listening_0.6s_ease-in-out_infinite]"
                  style={{ animationDelay: `${i * 0.1}s`, height: "16px" }}
                />
              ))}
            </div>
            <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
              Escuchando... Habla para ver la transcripción
            </p>
          </div>
        )}
        {transcript.map((line, i) => (
          <div
            key={`${line.timestamp}-${i}`}
            className="animate-[fadeIn_0.2s_ease-out]"
          >
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${
                line.speaker === 0
                  ? "bg-[#5A6A85]/20 text-[#5A6A85]"
                  : "bg-[#E6C78A]/20 text-[#E6C78A]"
              }`}
            >
              {line.speaker === 0 ? "Asesor" : "Cliente"}
            </span>
            <p
              className={`font-[family-name:var(--font-open-sans)] text-sm text-white ${
                !line.isFinal ? "opacity-60" : ""
              }`}
            >
              {line.text}
            </p>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-[#5A6A85]/20">
        <p className="font-[family-name:var(--font-open-sans)] text-[11px] text-[#5A6A85]">
          Solo respuestas del cliente alimentan los campos
        </p>
      </div>
    </div>
  );
}
