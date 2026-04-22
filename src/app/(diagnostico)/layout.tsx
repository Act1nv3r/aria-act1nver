"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, Mic } from "lucide-react";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { useUIFeedbackStore } from "@/stores/ui-feedback-store";
import { DiagnosticoProvider } from "@/contexts/diagnostico-context";
import { VoiceButton } from "@/components/voz/voice-button";
import { ListeningIndicator } from "@/components/voz/listening-indicator";

const steps = [
  {
    id: 1,
    label: "Perfil",
    sublabel: "Datos personales",
    title: "Conoce a tu cliente",
    desc: "Información básica del perfil",
  },
  {
    id: 2,
    label: "Flujo",
    sublabel: "Ingresos y gastos",
    title: "Flujo mensual",
    desc: "Ingresos, gastos y capacidad de ahorro",
  },
  {
    id: 3,
    label: "Patrimonio",
    sublabel: "Activos y pasivos",
    title: "Patrimonio",
    desc: "Activos financieros, inmuebles y deudas",
  },
  {
    id: 4,
    label: "Retiro",
    sublabel: "Plan de jubilación",
    title: "Plan de retiro",
    desc: "Proyección hacia la jubilación",
  },
  {
    id: 5,
    label: "Objetivos",
    sublabel: "Metas financieras",
    title: "Objetivos financieros",
    desc: "Metas a corto y largo plazo",
  },
  {
    id: 6,
    label: "Protección",
    sublabel: "Seguros y cobertura",
    title: "Protección patrimonial",
    desc: "Seguros y cobertura de riesgos",
  },
];

export default function DiagnosticoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    pasoActual,
    pasosCompletados,
    setPaso,
    perfil,
    sesion_inicio,
    completitud_pct,
    datos_fuente,
    setDatosFuente,
  } = useDiagnosticoStore();

  useEffect(() => {
    const match = pathname?.match(/\/paso\/(\d+)/);
    if (match) {
      const step = parseInt(match[1], 10);
      if (step >= 1 && step <= 6) {
        setPaso(step);
      }
      if (sesion_inicio && datos_fuente === "voz") {
        setDatosFuente("mixto");
      }
    }
  }, [pathname, setPaso, sesion_inicio, datos_fuente, setDatosFuente]);

  const handleStepClick = (paso: number) => {
    const id = pathname?.split("/diagnosticos/")[1]?.split("/")[0] || "demo";
    router.push(`/diagnosticos/${id}/paso/${paso}`);
  };

  const nombre = perfil?.nombre ?? "Cliente";
  const edad = perfil?.edad ?? 0;
  const lastSavedAt = useUIFeedbackStore((s) => s.lastSavedAt);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!lastSavedAt) return;
    setShowSaved(true);
    const t = setTimeout(() => setShowSaved(false), 2500);
    return () => clearTimeout(t);
  }, [lastSavedAt]);

  const isCompletado = pathname?.includes("/completado") ?? false;
  const isSesion = pathname?.includes("/sesion") ?? false;
  const isPresentacion = pathname?.includes("/presentacion") ?? false;
  const isSimulador = pathname?.includes("/simulador") ?? false;
  const isWrapped = pathname?.includes("/wrapped") ?? false;
  const isFullScreenPage = isCompletado || isSesion || isPresentacion || isSimulador || isWrapped;
  const currentStep = steps.find((s) => s.id === pasoActual);

  const nombreInitials = nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (isFullScreenPage) {
    return (
      <DiagnosticoProvider>
        <div className="min-h-screen bg-[#060D1A]">
          {children}
        </div>
      </DiagnosticoProvider>
    );
  }

  return (
    <DiagnosticoProvider>
      <div className="min-h-screen bg-[#060D1A] flex">

        {/* LEFT SIDEBAR — fixed 280px, desktop only */}
        <aside className="hidden lg:flex flex-col w-[280px] shrink-0 sticky top-0 h-screen bg-[#0C1829] border-r border-white/[0.06] overflow-y-auto">

          {/* Sidebar header / logo */}
          <div className="px-6 py-5 border-b border-white/[0.06]">
            <Link href="/crm" className="flex items-center gap-3 group">
              <div className="w-8 h-8 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-[8px] flex items-center justify-center">
                <span className="text-[#C9A84C] font-bold text-sm">A</span>
              </div>
              <div>
                <p className="text-[#F0F4FA] font-bold text-sm leading-none">Actinver</p>
                <p className="text-[#C9A84C] text-[10px] tracking-[3px] uppercase leading-none mt-0.5">ArIA</p>
              </div>
            </Link>
          </div>

          {/* Client info */}
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1A3154] border border-[#C9A84C]/20 flex items-center justify-center shrink-0">
                <span className="text-[#C9A84C] font-bold text-sm">{nombreInitials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[#F0F4FA] font-semibold text-sm truncate">{nombre}</p>
                {edad > 0 && (
                  <p className="text-[#8B9BB4] text-xs">{edad} años</p>
                )}
              </div>
            </div>

            {/* Voice button */}
            <div className="mt-3">
              <VoiceButton />
            </div>

            {/* ListeningIndicator */}
            <ListeningIndicator />

            {/* Saved indicator */}
            <div
              className={`mt-2 flex items-center gap-1.5 text-[#10B981] text-xs transition-opacity duration-300 ${
                showSaved ? "opacity-100" : "opacity-0"
              }`}
              id="saved-indicator"
              role="status"
              aria-live="polite"
            >
              <Check className="w-3 h-3" />
              <span>Guardado</span>
            </div>
          </div>

          {/* Voice session link — shown when a voice session has been started */}
          {sesion_inicio && !isCompletado && (
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  const id = pathname?.split("/diagnosticos/")[1]?.split("/")[0] || "demo";
                  router.push(`/diagnosticos/${id}/sesion`);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] bg-[#C9A84C]/[0.08] border border-[#C9A84C]/20 hover:bg-[#C9A84C]/15 transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded-full bg-[#C9A84C]/20 flex items-center justify-center shrink-0">
                  <Mic className="w-3.5 h-3.5 text-[#C9A84C]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#C9A84C]">Sesión de voz</p>
                  <p className="text-[10px] text-[#8B9BB4] mt-0.5">{Math.round(completitud_pct)}% capturado</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#C9A84C]/50 group-hover:text-[#C9A84C] transition-colors" />
              </button>
            </div>
          )}

          {/* Progress overview */}
          {!isCompletado && (
            <div className="px-6 py-3 border-b border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#8B9BB4] text-xs">Progreso</span>
                <span className="text-[#C9A84C] text-xs font-semibold">
                  {Math.round((pasosCompletados.length / 6) * 100)}%
                </span>
              </div>
              <div className="h-1.5 bg-[#1A3154] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#C9A84C] to-[#E8C872] rounded-full transition-all duration-500"
                  style={{ width: `${(pasosCompletados.length / 6) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Stepper nav */}
          {!isCompletado && (
            <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Pasos del diagnóstico">
              {steps.map((step) => {
                const isCurrent = pasoActual === step.id;
                const isCompleted = pasosCompletados.includes(step.id);
                const isFuture = !isCurrent && !isCompleted;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => isCompleted && handleStepClick(step.id)}
                    disabled={isFuture}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={`${step.label}${isCurrent ? " (actual)" : isCompleted ? " (completado)" : ""}`}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left
                      transition-all duration-200
                      ${isCurrent ? "bg-[#1A3154] border border-[#C9A84C]/30" : ""}
                      ${isCompleted ? "hover:bg-[#1A3154]/50 cursor-pointer" : ""}
                      ${isFuture ? "opacity-40 cursor-not-allowed" : ""}
                    `}
                  >
                    {/* Step indicator */}
                    <div
                      className={`
                        w-7 h-7 rounded-full flex items-center justify-center shrink-0
                        ${isCurrent ? "bg-[#C9A84C] text-[#060D1A]" : ""}
                        ${isCompleted ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30" : ""}
                        ${isFuture ? "bg-[#1A3154] text-[#4A5A72]" : ""}
                      `}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-xs font-bold">{step.id}</span>
                      )}
                    </div>

                    {/* Step labels */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`
                          text-xs font-semibold
                          ${isCurrent ? "text-[#F0F4FA]" : ""}
                          ${isCompleted ? "text-[#10B981]" : ""}
                          ${isFuture ? "text-[#4A5A72]" : ""}
                        `}
                      >
                        {step.label}
                      </p>
                      <p className="text-[10px] text-[#4A5A72] mt-0.5">{step.sublabel}</p>
                    </div>

                    {isCurrent && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Back to dashboard */}
          <div className="px-4 py-4 border-t border-white/[0.06]">
            <Link
              href="/crm"
              className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[#8B9BB4] hover:text-[#F0F4FA] hover:bg-[#1A3154]/50 transition-colors text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a Mis Clientes
            </Link>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 overflow-y-auto">

          {/* Mobile header */}
          {!isCompletado && (
            <div className="lg:hidden sticky top-0 z-[60] bg-[#0C1829]/95 border-b border-white/[0.06]"
                 style={{ backdropFilter: "blur(16px)" }}>
              <div className="flex items-center justify-between px-4 py-3">
                <Link href="/crm" className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-[6px] flex items-center justify-center">
                    <span className="text-[#C9A84C] font-bold text-xs">A</span>
                  </div>
                  <span className="text-[#F0F4FA] font-bold text-sm">ArIA</span>
                </Link>
                <VoiceButton />
              </div>

              {/* Mobile stepper with step labels */}
              <div className="flex items-start justify-center gap-0 pb-3 px-2 overflow-x-auto">
                {steps.map((step, idx) => {
                  const isCurrent = pasoActual === step.id;
                  const isCompleted = pasosCompletados.includes(step.id);
                  return (
                    <div key={step.id} className="flex items-start">
                      <div className="flex flex-col items-center gap-1 min-w-[44px]">
                        <div
                          className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                            transition-all duration-200
                            ${isCurrent ? "bg-[#C9A84C] text-[#060D1A]" : ""}
                            ${isCompleted ? "bg-[#10B981]/20 text-[#10B981]" : ""}
                            ${!isCurrent && !isCompleted ? "bg-[#1A3154] text-[#4A5A72]" : ""}
                          `}
                        >
                          {isCompleted ? <Check className="w-3 h-3" /> : step.id}
                        </div>
                        <span className={`text-[9px] font-medium text-center leading-tight px-0.5
                          ${isCurrent ? "text-[#C9A84C]" : isCompleted ? "text-[#10B981]" : "text-[#4A5A72]"}
                        `}>
                          {step.label}
                        </span>
                      </div>
                      {idx < steps.length - 1 && (
                        <div
                          className={`w-3 h-px mt-3 shrink-0 ${
                            isCompleted ? "bg-[#10B981]/40" : "bg-[#1A3154]"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Page header — sticky, desktop + mobile */}
          {!isCompletado && currentStep && (
            <div
              className="sticky lg:top-0 top-0 z-[50] px-6 py-4 lg:px-8 border-b border-white/[0.06]"
              style={{
                background: "rgba(6,13,26,0.8)",
                backdropFilter: "blur(20px)",
              }}
            >
              <h1 className="text-[#F0F4FA] font-bold text-lg">{currentStep.title}</h1>
              <p className="text-[#8B9BB4] text-sm mt-0.5">{currentStep.desc}</p>
            </div>
          )}

          {/* Voice session banner — visible when coming from voice capture */}
          {sesion_inicio && !isCompletado && (
            <div className="mx-6 lg:mx-12 mt-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#C9A84C]/[0.06] border border-[#C9A84C]/15">
              <div className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse shrink-0" />
              <p className="text-xs text-[#8B9BB4] flex-1">
                Sesión de voz activa — los datos capturados por voz ya están precargados.
                Puedes editar libremente aquí y volver a la sesión de voz en cualquier momento.
              </p>
              <button
                type="button"
                onClick={() => {
                  const id = pathname?.split("/diagnosticos/")[1]?.split("/")[0] || "demo";
                  router.push(`/diagnosticos/${id}/sesion`);
                }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#C9A84C] border border-[#C9A84C]/20 hover:bg-[#C9A84C]/10 transition-colors"
              >
                <Mic className="w-3 h-3" />
                Volver a voz
              </button>
            </div>
          )}

          {/* Content wrapper */}
          <div
            className={`${
              isCompletado
                ? "px-0"
                : "px-6 py-8 lg:px-12 max-w-[960px]"
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </DiagnosticoProvider>
  );
}
