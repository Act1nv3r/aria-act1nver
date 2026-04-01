"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Mic, MessageSquare, User, Briefcase, Wallet, Building2, Palmtree, Target, Shield } from "lucide-react";
import type { TranscriptLine } from "@/hooks/use-deepgram";
import type { ExtractedField } from "@/stores/diagnostico-store";
import { DataHighlight } from "./data-highlight";

interface TranscriptionLiveProps {
  transcript: TranscriptLine[];
  extractedFields: ExtractedField[];
  isRecording: boolean;
  clienteNombre: string;
  clienteEdad: number;
  onAcceptField: (campo: string) => void;
  onEditField: (campo: string, valor: string | number | boolean) => void;
  onDismissField: (campo: string) => void;
  onStartSession?: () => void;
}

const ROADMAP = [
  { label: "Perfil", icon: User },
  { label: "Flujo", icon: Wallet },
  { label: "Patrimonio", icon: Building2 },
  { label: "Retiro", icon: Palmtree },
  { label: "Objetivos", icon: Target },
  { label: "Protección", icon: Shield },
];

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return "ahora";
  if (diff < 60) return `hace ${diff}s`;
  const min = Math.floor(diff / 60);
  return `hace ${min} min`;
}

export function TranscriptionLive({
  transcript,
  extractedFields,
  isRecording,
  clienteNombre,
  clienteEdad,
  onAcceptField,
  onEditField,
  onDismissField,
  onStartSession,
}: TranscriptionLiveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const isAutoScrollRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      isAutoScrollRef.current = true;
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    if (!userScrolledUp) scrollToBottom();
  }, [transcript, userScrolledUp, scrollToBottom]);

  const handleScroll = () => {
    if (isAutoScrollRef.current) {
      isAutoScrollRef.current = false;
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setUserScrolledUp(!isAtBottom);
  };

  const getFieldForLine = (line: TranscriptLine): ExtractedField | undefined => {
    const lower = line.text.toLowerCase();
    return extractedFields.find((f) => {
      const src = f.texto_fuente?.toLowerCase() || "";
      return lower.includes(src) || src.includes(lower.slice(0, 20));
    });
  };

  const initials = clienteNombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /** Deepgram diarize often assigns only speaker 0 with one mic / mixed room audio — then UI wrongly showed "Asesor" for everyone and hid data highlights (they required speaker === 1). */
  const diarizationHasMultipleSpeakers = useMemo(() => {
    const finals = transcript.filter((l) => l.isFinal);
    const ids = new Set(finals.map((l) => l.speaker));
    return ids.size >= 2;
  }, [transcript]);

  // Pre-session empty state
  if (transcript.length === 0 && !isRecording) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-sm mx-auto space-y-6">
          {/* Client avatar */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 border-2 border-[#C9A84C]/30 flex items-center justify-center shadow-[0_0_40px_rgba(201,168,76,0.1)]">
              <span className="text-[#C9A84C] font-bold text-2xl">{initials}</span>
            </div>
          </div>
          <div>
            <p className="text-[#F0F4FA] font-semibold text-lg">{clienteNombre}</p>
            {clienteEdad > 0 && (
              <p className="text-[#8B9BB4] text-sm mt-0.5">{clienteEdad} años</p>
            )}
          </div>

          {/* Conversation roadmap */}
          <div className="flex items-center justify-center gap-1 flex-wrap">
            {ROADMAP.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#1A3154]/50 border border-white/[0.06]">
                    <Icon className="w-3 h-3 text-[#8B9BB4]" />
                    <span className="text-[11px] text-[#8B9BB4] font-medium">{step.label}</span>
                  </div>
                  {idx < ROADMAP.length - 1 && (
                    <div className="w-2 h-px bg-[#1A3154] mx-0.5" />
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onStartSession}
              className="group flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#E8C872] flex items-center justify-center shadow-[0_0_32px_rgba(201,168,76,0.25)] group-hover:shadow-[0_0_48px_rgba(201,168,76,0.35)] group-hover:scale-105 active:scale-95 transition-all animate-pulse-glow">
                <Mic className="w-7 h-7 text-[#060D1A]" />
              </div>
              <span className="text-sm text-[#C9A84C] font-semibold">
                Iniciar sesión con {clienteNombre.split(" ")[0]}
              </span>
            </button>
          </div>

          <p className="text-[11px] text-[#4A5A72] leading-relaxed">
            ArIA escuchará la conversación y extraerá datos automáticamente.
            <br />El audio se procesa en tiempo real y no se almacena.
          </p>
        </div>
      </div>
    );
  }

  // Listening state (recording but no transcript yet)
  if (transcript.length === 0 && isRecording) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="flex gap-1.5 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#C9A84C] animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <p className="text-sm text-[#8B9BB4]">Escuchando la conversación...</p>
          <p className="text-[11px] text-[#4A5A72]">Habla con naturalidad, ArIA capturará los datos</p>
        </div>
      </div>
    );
  }

  // Active transcription
  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {transcript.map((line, idx) => {
          const extractedField = getFieldForLine(line);
          const isCliente =
            !diarizationHasMultipleSpeakers || line.speaker === 1;
          const roleLabel = !diarizationHasMultipleSpeakers
            ? "Conversación"
            : line.speaker === 1
              ? "Cliente"
              : "Asesor";
          const isInterim = !line.isFinal;

          if (isInterim) {
            return (
              <div key={idx} className="flex items-center gap-2 pl-1">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#4A5A72] animate-bounce"
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#4A5A72] italic truncate">{line.text}</span>
              </div>
            );
          }

          return (
            <div key={idx} className="animate-fade-in">
              <div
                className={`rounded-xl p-3 max-w-[90%] ${
                  isCliente
                    ? "border-l-[3px] border-l-[#C9A84C] bg-[#C9A84C]/[0.04]"
                    : "bg-[#0C1829]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[11px] font-semibold ${
                      isCliente ? "text-[#C9A84C]" : "text-[#5A6A85]"
                    }`}
                  >
                    {roleLabel}
                  </span>
                  {line.timestamp && (
                    <span className="text-[10px] text-[#3E4E60]">
                      {relativeTime(line.timestamp)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#F0F4FA] leading-relaxed font-[family-name:var(--font-open-sans)]">
                  {line.text}
                </p>
              </div>

              {extractedField && (
                <div className="mt-2 ml-1">
                  <DataHighlight
                    campo={extractedField.campo}
                    valor={extractedField.valor}
                    confianza={extractedField.confianza}
                    textoFuente={extractedField.texto_fuente}
                    aceptado={extractedField.aceptado}
                    onAccept={() => onAcceptField(extractedField.campo)}
                    onEdit={(val) => onEditField(extractedField.campo, val)}
                    onDismiss={() => onDismissField(extractedField.campo)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scroll to bottom pill */}
      {userScrolledUp && transcript.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setUserScrolledUp(false);
            scrollToBottom();
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#C9A84C] text-[#060D1A] text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform z-10 flex items-center gap-1.5"
        >
          <MessageSquare className="w-3 h-3" />
          Nuevo
        </button>
      )}
    </div>
  );
}
