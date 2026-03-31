"use client";

import { useEffect, useRef } from "react";
import type { TranscriptLine } from "@/hooks/use-deepgram";
import type { ExtractedField } from "@/stores/diagnostico-store";
import { DataHighlight } from "./data-highlight";

interface TranscriptionLiveProps {
  transcript: TranscriptLine[];
  extractedFields: ExtractedField[];
  isRecording: boolean;
  onAcceptField: (campo: string) => void;
  onEditField: (campo: string, valor: string | number | boolean) => void;
  onDismissField: (campo: string) => void;
}

export function TranscriptionLive({
  transcript,
  extractedFields,
  isRecording,
  onAcceptField,
  onEditField,
  onDismissField,
}: TranscriptionLiveProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript]);

  const getFieldForLine = (line: TranscriptLine): ExtractedField | undefined => {
    const lower = line.text.toLowerCase();
    return extractedFields.find((f) => {
      const src = f.texto_fuente?.toLowerCase() || "";
      return lower.includes(src) || src.includes(lower.slice(0, 20));
    });
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-3"
    >
      {transcript.length === 0 && isRecording && (
        <div className="flex items-center justify-center h-full text-[#4A5A72] text-sm">
          <div className="text-center">
            <div className="flex gap-1 justify-center mb-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
            <p>Escuchando la conversación...</p>
          </div>
        </div>
      )}

      {transcript.length === 0 && !isRecording && (
        <div className="flex items-center justify-center h-full text-[#4A5A72] text-sm">
          Presiona &ldquo;Iniciar sesión&rdquo; para comenzar a escuchar
        </div>
      )}

      {transcript.map((line, idx) => {
        const extractedField = getFieldForLine(line);
        const isCliente = line.speaker === 1;

        return (
          <div key={idx} className="group">
            <div className="flex items-start gap-2">
              <span
                className={`text-[10px] font-semibold shrink-0 mt-0.5 ${
                  isCliente ? "text-[#C9A84C]" : "text-[#8B9BB4]"
                }`}
              >
                {isCliente ? "[cliente]" : "[asesor]"}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-relaxed ${
                    line.isFinal ? "text-[#F0F4FA]" : "text-[#8B9BB4] italic"
                  }`}
                >
                  {line.text}
                </p>
                {extractedField && isCliente && (
                  <div className="mt-1">
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
