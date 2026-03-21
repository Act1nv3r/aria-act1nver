"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { extraerEntidades, type Sugerencia } from "@/lib/voz-nlu";
import type { TranscriptLine } from "./use-deepgram";

export function useVoiceSuggestions(
  transcript: TranscriptLine[],
  isRecording: boolean,
  pasoActual: number,
  setValue: (campo: string, valor: unknown) => void,
  onToast?: (msg: string) => void
) {
  const [sugerencias, setSugerencias] = useState<Map<string, Sugerencia>>(new Map());
  const lastExtractRef = useRef(0);
  const extractTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const aceptarSugerencia = useCallback(
    (campo: string) => {
      const s = sugerencias.get(campo);
      if (s) {
        setValue(campo, s.valor);
        setSugerencias((m) => {
          const next = new Map(m);
          next.delete(campo);
          return next;
        });
        onToast?.("Campo actualizado");
      }
    },
    [sugerencias, setValue, onToast]
  );

  const rechazarSugerencia = useCallback((campo: string) => {
    setSugerencias((m) => {
      const next = new Map(m);
      next.delete(campo);
      return next;
    });
  }, []);

  const triggerExtraccion = useCallback(
    async (lines: TranscriptLine[]) => {
      // Incluir todo el transcript: con un solo hablante Deepgram suele asignar speaker 0,
      // y la IA extrae correctamente nombre/edad/etc de cualquier frase.
      const lines30s = lines
        .filter((l) => l.timestamp > Date.now() - 30000)
        .map((l) => l.text)
        .join(" ");
      if (!lines30s.trim()) return;

      const entidades = await extraerEntidades(lines30s, pasoActual);
      setSugerencias((m) => {
        const next = new Map(m);
        for (const e of entidades) {
          if (e.confianza >= 0.7) next.set(e.campo, e);
        }
        return next;
      });
    },
    [pasoActual]
  );

  useEffect(() => {
    if (!isRecording || transcript.length === 0) return;
    if (extractTimeoutRef.current) clearTimeout(extractTimeoutRef.current);
    extractTimeoutRef.current = setTimeout(() => {
      triggerExtraccion(transcript);
      lastExtractRef.current = Date.now();
      extractTimeoutRef.current = null;
    }, 2000);
    return () => {
      if (extractTimeoutRef.current) clearTimeout(extractTimeoutRef.current);
    };
  }, [transcript, isRecording, triggerExtraccion]);

  useEffect(() => {
    if (!isRecording) return;
    const now = Date.now();
    if (now - lastExtractRef.current >= 10000 && transcript.length > 0) {
      triggerExtraccion(transcript);
      lastExtractRef.current = now;
    }
  }, [transcript, isRecording, triggerExtraccion]);

  return { sugerencias, aceptarSugerencia, rechazarSugerencia };
}
