"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Square, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Toggle } from "@/components/ui/toggle";
import { TranscriptionLive } from "@/components/sesion/transcription-live";
import { SessionProgress } from "@/components/sesion/session-progress";
import { NaviPanel } from "@/components/navi/navi-panel";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { useDeepgram, type TranscriptLine } from "@/hooks/use-deepgram";
import { extraerEntidadesContinuo, shouldAutoAccept } from "@/lib/voz-nlu";
import { getDatosFaltantes } from "@/lib/navi-engine";

export default function SesionPage() {
  const params = useParams();
  const router = useRouter();
  const diagnosticoId = params.id as string;

  const store = useDiagnosticoStore();
  const {
    perfil,
    flujoMensual,
    patrimonio,
    retiro,
    proteccion,
    completitud_pct,
    extracted_fields,
    sesion_inicio,
    setSesionInicio,
    setDatosFuente,
    updateCompletitud,
    addExtractedField,
    acceptExtractedField,
    updateExtractedFieldValue,
    applyExtractedField,
  } = store;

  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [sesionMinutos, setSesionMinutos] = useState(0);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const extractionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onTranscript = useCallback((lines: TranscriptLine[]) => {
    void lines;
  }, []);

  const {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    error,
  } = useDeepgram(onTranscript);

  const hasConsent =
    typeof window !== "undefined" &&
    sessionStorage.getItem("voice_consent") === "true";

  // Session timer
  useEffect(() => {
    if (!sesion_inicio) return;
    const interval = setInterval(() => {
      setSesionMinutos((Date.now() - sesion_inicio) / 60_000);
    }, 1000);
    return () => clearInterval(interval);
  }, [sesion_inicio]);

  // Auto-update completitud when store changes
  useEffect(() => {
    updateCompletitud();
  }, [perfil, flujoMensual, patrimonio, retiro, proteccion, updateCompletitud]);

  // Continuous NLU extraction every 10 seconds
  useEffect(() => {
    if (!isRecording) {
      if (extractionTimerRef.current) clearInterval(extractionTimerRef.current);
      return;
    }

    const runExtraction = async () => {
      const clientLines = transcript
        .filter((l) => l.speaker === 1 && l.isFinal)
        .slice(-5);
      if (clientLines.length === 0) return;

      const recentText = clientLines.map((l) => l.text).join(" ");
      const faltantes = getDatosFaltantes({
        perfil,
        flujoMensual,
        patrimonio,
        retiro,
        proteccion,
      });

      if (faltantes.length === 0) return;

      const sugerencias = await extraerEntidadesContinuo(recentText, faltantes);

      for (const s of sugerencias) {
        const action = shouldAutoAccept(s.confianza);
        if (action === "ignore") continue;

        const field = {
          campo: s.campo,
          valor: s.valor,
          confianza: s.confianza,
          texto_fuente: s.texto_fuente,
          aceptado: action === "auto",
        };

        addExtractedField(field);

        if (action === "auto") {
          applyExtractedField({ ...field, timestamp: Date.now() });
          setDatosFuente("voz");
        }
      }
    };

    extractionTimerRef.current = setInterval(runExtraction, 10_000);
    return () => {
      if (extractionTimerRef.current) clearInterval(extractionTimerRef.current);
    };
  }, [
    isRecording,
    transcript,
    perfil,
    flujoMensual,
    patrimonio,
    retiro,
    proteccion,
    addExtractedField,
    applyExtractedField,
    setDatosFuente,
  ]);

  const handleStart = async () => {
    if (!hasConsent) {
      setConsentModalOpen(true);
      return;
    }
    setSesionInicio();
    setDatosFuente("voz");
    await startRecording();
  };

  const handleStop = () => {
    stopRecording();
  };

  const handleConsentActivate = async () => {
    if (consent) {
      sessionStorage.setItem("voice_consent", "true");
      setConsentModalOpen(false);
      setSesionInicio();
      setDatosFuente("voz");
      await startRecording();
    }
  };

  const handleAcceptField = (campo: string) => {
    acceptExtractedField(campo);
    const field = extracted_fields.find((f) => f.campo === campo);
    if (field) applyExtractedField(field);
  };

  const handleEditField = (campo: string, valor: string | number | boolean) => {
    updateExtractedFieldValue(campo, valor);
    const field = extracted_fields.find((f) => f.campo === campo);
    if (field) applyExtractedField({ ...field, valor });
  };

  const handleDismissField = (campo: string) => {
    addExtractedField({
      campo,
      valor: "",
      confianza: 0,
      texto_fuente: "",
      aceptado: false,
    });
  };

  const handleGenerarBalance = () => {
    if (completitud_pct < 60) {
      setCompletionModalOpen(true);
      return;
    }
    if (isRecording) stopRecording();
    router.push(`/diagnosticos/${diagnosticoId}/presentacion`);
  };

  const datosFaltantes = getDatosFaltantes({
    perfil,
    flujoMensual,
    patrimonio,
    retiro,
    proteccion,
  });

  const nombre = perfil?.nombre || "Cliente";
  const edad = perfil?.edad || 0;
  const nombreInitials = nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const fullTranscriptText = transcript
    .filter((l) => l.isFinal)
    .map((l) => l.text)
    .join(" ");

  return (
    <div className="h-screen flex flex-col bg-[#060D1A]">
      {/* Top bar */}
      <header
        className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]"
        style={{
          background: "rgba(12,24,41,0.95)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/crm" className="text-[#8B9BB4] hover:text-[#F0F4FA] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#1A3154] border border-[#C9A84C]/20 flex items-center justify-center">
            <span className="text-[#C9A84C] font-bold text-xs">{nombreInitials}</span>
          </div>
          <div>
            <p className="text-[#F0F4FA] font-semibold text-sm">{nombre}{edad > 0 ? `, ${edad} años` : ""}</p>
            <p className="text-[10px] text-[#8B9BB4]">
              {sesionMinutos > 0 ? `${Math.floor(sesionMinutos)}:${String(Math.floor((sesionMinutos % 1) * 60)).padStart(2, "0")} min` : "Sesión no iniciada"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/10">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[10px] text-[#10B981] font-semibold">ArIA escuchando</span>
            </div>
          )}
          {!isRecording && !error && (
            <Button
              variant="accent"
              size="sm"
              onClick={handleStart}
            >
              <Mic className="w-3.5 h-3.5" />
              Iniciar sesión
            </Button>
          )}
          {isRecording && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleStop}
            >
              <Square className="w-3 h-3" />
              Detener
            </Button>
          )}
          {error && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EF4444]/10">
              <MicOff className="w-3 h-3 text-[#EF4444]" />
              <span className="text-[10px] text-[#EF4444]">Error de voz</span>
            </div>
          )}
        </div>
      </header>

      {/* Main content: two panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel — Transcription (60%) */}
        <div className="w-[60%] flex flex-col border-r border-white/[0.06]">
          <TranscriptionLive
            transcript={transcript}
            extractedFields={extracted_fields}
            isRecording={isRecording}
            onAcceptField={handleAcceptField}
            onEditField={handleEditField}
            onDismissField={handleDismissField}
          />
        </div>

        {/* Right panel — Navi (40%) */}
        <div className="w-[40%] flex flex-col bg-[#0A1628]">
          <NaviPanel
            transcripcion={fullTranscriptText}
            sesionMinutos={sesionMinutos}
          />
        </div>
      </div>

      {/* Bottom progress bar */}
      <SessionProgress
        completitudPct={completitud_pct}
        categoriasFaltantes={
          datosFaltantes.length > 5
            ? ["Múltiples categorías pendientes"]
            : datosFaltantes
        }
        sesionMinutos={sesionMinutos}
        diagnosticoId={diagnosticoId}
        onGenerarBalance={handleGenerarBalance}
      />

      {/* Consent Modal */}
      <Modal
        open={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        title="Captura por voz"
      >
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
              <Mic className="h-6 w-6 text-[#C9A84C]" />
            </div>
          </div>
          <p className="text-sm text-[#F0F4FA]">
            ArIA escuchará la conversación para extraer datos automáticamente. El audio se procesa en tiempo real y no se almacena.
          </p>
          <div className="flex justify-center">
            <Toggle
              label="Acepto el procesamiento de voz para esta sesión"
              checked={consent}
              onChange={setConsent}
            />
          </div>
          <div className="flex gap-4 justify-center">
            <Button variant="ghost" onClick={() => setConsentModalOpen(false)}>
              No gracias
            </Button>
            <Button variant="accent" onClick={handleConsentActivate} disabled={!consent}>
              Activar voz
            </Button>
          </div>
        </div>
      </Modal>

      {/* Completion warning modal */}
      <Modal
        open={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        title="Datos insuficientes"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#8B9BB4]">
            Solo tienes {completitud_pct}% de datos recopilados. Se necesita al menos 60% para generar un balance confiable.
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setCompletionModalOpen(false);
                router.push(`/diagnosticos/${diagnosticoId}/paso/1`);
              }}
              className="flex-1"
            >
              Completar manualmente
            </Button>
            <Button
              variant="accent"
              onClick={() => {
                setCompletionModalOpen(false);
                if (isRecording) stopRecording();
                router.push(`/diagnosticos/${diagnosticoId}/presentacion`);
              }}
              className="flex-1"
            >
              Generar con lo que tenemos
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
