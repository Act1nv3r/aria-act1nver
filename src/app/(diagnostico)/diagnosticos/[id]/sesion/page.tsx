"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Mic, MicOff, Square, ArrowLeft, Check, Undo2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Toggle } from "@/components/ui/toggle";
import { TranscriptionLive } from "@/components/sesion/transcription-live";
import { SessionProgress } from "@/components/sesion/session-progress";
import { AudioWaveform } from "@/components/sesion/audio-waveform";
import { DataCommandCenter } from "@/components/sesion/data-command-center";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { useDeepgram, type TranscriptLine } from "@/hooks/use-deepgram";
import { extraerEntidadesLocal, extraerConHaiku, shouldAutoAccept } from "@/lib/voz-nlu";
import { getDatosFaltantes } from "@/lib/navi-engine";

interface ToastItem {
  id: string;
  campo: string;
  valor: string;
  visible: boolean;
}

function ProgressRing({
  pct,
  size = 40,
}: {
  pct: number;
  size?: number;
}) {
  const strokeW = 3;
  const r = (size - strokeW * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  const color = pct >= 60 ? "#10B981" : pct >= 40 ? "#C9A84C" : "#8B9BB4";

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      title={`${Math.round(pct)}% completado`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1A3154" strokeWidth={strokeW} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={strokeW}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[11px] font-bold"
        style={{ color }}
      >
        {Math.round(pct)}
      </span>
    </div>
  );
}

function AutoExtractToast({
  toast,
  onUndo,
  onDismiss,
}: {
  toast: ToastItem;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#0C1829] border-l-4 border-l-[#10B981] border border-white/[0.06] shadow-lg max-w-xs ${
        toast.visible ? "animate-toast-in" : "animate-toast-out"
      }`}
    >
      <Check className="w-4 h-4 text-[#10B981] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#F0F4FA] font-medium truncate">
          {toast.campo}: <span className="font-bold">{toast.valor}</span>
        </p>
        <p className="text-[10px] text-[#8B9BB4]">Capturado automáticamente</p>
      </div>
      <button
        type="button"
        onClick={onUndo}
        className="shrink-0 flex items-center gap-1 text-[10px] text-[#8B9BB4] hover:text-[#F0F4FA] transition-colors"
      >
        <Undo2 className="w-3 h-3" />
        Deshacer
      </button>
    </div>
  );
}

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
    datos_fuente,
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
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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

  useEffect(() => {
    if (!sesion_inicio) return;
    const interval = setInterval(() => {
      setSesionMinutos((Date.now() - sesion_inicio) / 60_000);
    }, 1000);
    return () => clearInterval(interval);
  }, [sesion_inicio]);

  useEffect(() => {
    updateCompletitud();
  }, [perfil, flujoMensual, patrimonio, retiro, proteccion, updateCompletitud]);

  const showToast = useCallback((campo: string, valor: string) => {
    const id = `${campo}-${Date.now()}`;
    setToasts((prev) => [...prev.slice(-2), { id, campo, valor, visible: true }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  // --- LAYER 1: Instant regex extraction on every new final transcript line ---
  const lastProcessedIdxRef = useRef(0);

  useEffect(() => {
    if (!isRecording) return;

    const finalLines = transcript.filter((l) => l.isFinal);
    if (finalLines.length <= lastProcessedIdxRef.current) return;

    const newLines = finalLines.slice(lastProcessedIdxRef.current);
    lastProcessedIdxRef.current = finalLines.length;

    const recentText = newLines.map((l) => l.text).join(" ");
    if (!recentText.trim()) return;

    const faltantes = getDatosFaltantes({
      perfil, flujoMensual, patrimonio, retiro, proteccion,
    });
    if (faltantes.length === 0) return;

    const sugerencias = extraerEntidadesLocal(recentText, faltantes);
    processExtractions(sugerencias);
  }, [
    isRecording, transcript, perfil, flujoMensual, patrimonio, retiro, proteccion,
  ]);

  // Shared extraction processor — uses refs to avoid stale closures in intervals
  const extractedFieldsRef = useRef(extracted_fields);
  extractedFieldsRef.current = extracted_fields;

  const processExtractions = useCallback((sugerencias: { campo: string; valor: string | number | boolean; confianza: number; texto_fuente: string }[]) => {
    for (const s of sugerencias) {
      const action = shouldAutoAccept(s.confianza);
      if (action === "ignore") continue;

      // Skip if this field was already accepted
      const currentFields = extractedFieldsRef.current;
      const existing = currentFields.find((f) => f.campo === s.campo && f.aceptado);
      if (existing) continue;

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
        showToast(s.campo, String(s.valor));
      }
    }
  }, [addExtractedField, applyExtractedField, setDatosFuente, showToast]);

  // --- LAYER 2: Claude Haiku deep analysis every ~8 seconds on ALL transcript text ---
  const haikuTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const haikuRunningRef = useRef(false);
  const lastHaikuTextLenRef = useRef(0);

  // Keep refs to latest values so the interval callback always sees fresh data
  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;
  const storeRef = useRef({ perfil, flujoMensual, patrimonio, retiro, proteccion });
  storeRef.current = { perfil, flujoMensual, patrimonio, retiro, proteccion };
  const processRef = useRef(processExtractions);
  processRef.current = processExtractions;

  useEffect(() => {
    if (!isRecording) {
      if (haikuTimerRef.current) clearInterval(haikuTimerRef.current);
      haikuTimerRef.current = null;
      return;
    }

    const runHaikuExtraction = async () => {
      if (haikuRunningRef.current) return;

      const currentTranscript = transcriptRef.current;
      const allText = currentTranscript.map((l) => l.text).join(" ");
      if (!allText.trim() || allText.length < 20) return;

      // Skip if text hasn't grown since last call
      if (allText.length <= lastHaikuTextLenRef.current) return;

      const { perfil: p, flujoMensual: f, patrimonio: pat, retiro: r, proteccion: pro } = storeRef.current;
      const faltantes = getDatosFaltantes({ perfil: p, flujoMensual: f, patrimonio: pat, retiro: r, proteccion: pro });
      if (faltantes.length === 0) return;

      haikuRunningRef.current = true;
      lastHaikuTextLenRef.current = allText.length;

      try {
        console.log(`[Haiku] Sending ${allText.length} chars, ${faltantes.length} missing fields...`);
        const sugerencias = await extraerConHaiku(allText, faltantes);
        console.log(`[Haiku] Got ${sugerencias.length} extractions:`, sugerencias.map((s) => `${s.campo}=${s.valor}`));
        processRef.current(sugerencias);
      } catch (err) {
        console.warn("[session] Haiku extraction failed:", err);
      } finally {
        haikuRunningRef.current = false;
      }
    };

    // First run after 3 seconds, then every 8 seconds
    const initialTimeout = setTimeout(runHaikuExtraction, 3_000);
    haikuTimerRef.current = setInterval(runHaikuExtraction, 8_000);

    return () => {
      clearTimeout(initialTimeout);
      if (haikuTimerRef.current) clearInterval(haikuTimerRef.current);
    };
  }, [isRecording]);

  const handleStart = async () => {
    if (!hasConsent) {
      setConsentModalOpen(true);
      return;
    }
    const isResuming = !!sesion_inicio;
    setSesionInicio();
    setDatosFuente(isResuming ? "mixto" : "voz");
    await startRecording();
  };

  const handleStop = () => stopRecording();

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
      campo, valor: "", confianza: 0, texto_fuente: "", aceptado: false,
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
    perfil, flujoMensual, patrimonio, retiro, proteccion,
  });

  const nombre = perfil?.nombre || "Cliente";
  const edad = perfil?.edad || 0;
  const nombreInitials = nombre
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const fullTranscriptText = transcript
    .filter((l) => l.isFinal).map((l) => l.text).join(" ");

  const totalDatosCapturados = extracted_fields.filter((f) => f.aceptado).length;

  const formatTime = (mins: number) => {
    const m = Math.floor(mins);
    const s = Math.floor((mins - m) * 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-screen flex flex-col bg-[#060D1A]">
      {/* Header */}
      <header
        className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]"
        style={{ background: "rgba(12,24,41,0.95)", backdropFilter: "blur(16px)" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/crm" className="text-[#8B9BB4] hover:text-[#F0F4FA] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-9 h-9 rounded-full bg-[#1A3154] border border-[#C9A84C]/20 flex items-center justify-center">
            <span className="text-[#C9A84C] font-bold text-xs">{nombreInitials}</span>
          </div>
          <div>
            <p className="text-[#F0F4FA] font-semibold text-sm leading-tight">
              {nombre}{edad > 0 ? `, ${edad} años` : ""}
            </p>
            <p className="text-[10px] text-[#8B9BB4]">
              {sesionMinutos > 0 ? `${formatTime(sesionMinutos)} min` : "Sesión no iniciada"}
              {datos_fuente === "mixto" && " · Datos voz + manual"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ProgressRing pct={completitud_pct} size={40} />

          {isRecording && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/20">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[11px] text-[#10B981] font-semibold">Escuchando</span>
            </div>
          )}
          {!isRecording && !error && sesion_inicio && (
            <Button variant="accent" size="sm" onClick={handleStart}>
              <Mic className="w-3.5 h-3.5" /> Reanudar
            </Button>
          )}
          {!isRecording && !error && !sesion_inicio && (
            <Button variant="accent" size="sm" onClick={handleStart}>
              <Mic className="w-3.5 h-3.5" /> Iniciar sesión
            </Button>
          )}
          {isRecording && (
            <Button variant="danger" size="sm" onClick={handleStop}>
              <Square className="w-3 h-3" /> Detener
            </Button>
          )}
          {error && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20">
              <MicOff className="w-3 h-3 text-[#EF4444]" />
              <span className="text-[11px] text-[#EF4444] font-medium">Error de voz</span>
            </div>
          )}
        </div>
      </header>

      {/* Audio waveform */}
      <AudioWaveform isRecording={isRecording} />

      {/* Main content: Command Center (left) + Transcription (right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Data Command Center (62%) */}
        <div className="w-[62%] flex flex-col border-r border-white/[0.06]">
          <DataCommandCenter
            transcripcion={fullTranscriptText}
            sesionMinutos={sesionMinutos}
            extractedFields={extracted_fields}
          />
        </div>

        {/* RIGHT — Transcription feed (38%) */}
        <div className="w-[38%] flex flex-col bg-[#0A1628]">
          {/* Panel header */}
          <div className="shrink-0 px-4 py-2.5 border-b border-white/[0.06]">
            <p className="text-[11px] uppercase tracking-widest text-[#5A6A85] font-semibold">
              Conversación en vivo
            </p>
          </div>
          <TranscriptionLive
            transcript={transcript}
            extractedFields={extracted_fields}
            isRecording={isRecording}
            clienteNombre={nombre}
            clienteEdad={edad}
            onAcceptField={handleAcceptField}
            onEditField={handleEditField}
            onDismissField={handleDismissField}
            onStartSession={handleStart}
          />
        </div>
      </div>

      {/* Bottom bar */}
      <SessionProgress
        completitudPct={completitud_pct}
        categoriasFaltantes={
          datosFaltantes.length > 5
            ? ["Múltiples categorías pendientes"]
            : datosFaltantes
        }
        sesionMinutos={sesionMinutos}
        diagnosticoId={diagnosticoId}
        totalDatos={totalDatosCapturados}
        onGenerarBalance={handleGenerarBalance}
        onStopRecording={isRecording ? handleStop : undefined}
      />

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <AutoExtractToast
            key={t.id}
            toast={t}
            onUndo={() => { handleDismissField(t.campo); dismissToast(t.id); }}
            onDismiss={() => dismissToast(t.id)}
          />
        ))}
      </div>

      {/* Consent Modal */}
      <Modal open={consentModalOpen} onClose={() => setConsentModalOpen(false)} title="Captura por voz">
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-[#C9A84C]/15 flex items-center justify-center">
              <Mic className="h-7 w-7 text-[#C9A84C]" />
            </div>
          </div>
          <p className="text-sm text-[#F0F4FA] leading-relaxed">
            ArIA escuchará la conversación para extraer datos automáticamente. El audio se procesa en tiempo real y no se almacena.
          </p>
          <div className="flex justify-center">
            <Toggle label="Acepto el procesamiento de voz para esta sesión" checked={consent} onChange={setConsent} />
          </div>
          <div className="flex gap-4 justify-center">
            <Button variant="ghost" onClick={() => setConsentModalOpen(false)}>No gracias</Button>
            <Button variant="accent" onClick={handleConsentActivate} disabled={!consent}>Activar voz</Button>
          </div>
        </div>
      </Modal>

      {/* Completion warning modal */}
      <Modal open={completionModalOpen} onClose={() => setCompletionModalOpen(false)} title="Datos insuficientes">
        <div className="space-y-4">
          <p className="text-sm text-[#8B9BB4]">
            Solo tienes {completitud_pct}% de datos recopilados. Se necesita al menos 60% para generar un balance confiable.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => { setCompletionModalOpen(false); router.push(`/diagnosticos/${diagnosticoId}/paso/1`); }} className="flex-1">
              Completar manualmente
            </Button>
            <Button variant="accent" onClick={() => { setCompletionModalOpen(false); if (isRecording) stopRecording(); router.push(`/diagnosticos/${diagnosticoId}/presentacion`); }} className="flex-1">
              Generar con lo que tenemos
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
