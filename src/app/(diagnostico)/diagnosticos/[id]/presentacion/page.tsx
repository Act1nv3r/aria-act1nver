"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Share, SlidersHorizontal, Download, Mic, Lightbulb, ChevronRight, TrendingUp, Shield, PiggyBank, Target, CreditCard, Receipt, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OutputPanel } from "@/components/diagnostico/output-panel";
import { FinancialTimeline } from "@/components/outputs/financial-timeline";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { useDiagnosticoId } from "@/contexts/diagnostico-context";
import { generarBalancePDF } from "@/lib/pdf-generator";
import { getAccessToken } from "@/lib/api-client";
import { useDeepgram, type TranscriptLine } from "@/hooks/use-deepgram";
import { detectarOportunidades, detectarOportunidadesDesdeDatos, type Oportunidad } from "@/lib/navi-opportunities";
import { BalancePDFTemplate } from "@/components/pdf/balance-pdf-template";
import { calcularMotorC } from "@/lib/motors";

const CAT_ICONS: Record<string, typeof Shield> = {
  proteccion: Shield,
  ahorro: PiggyBank,
  retiro: Target,
  deuda: CreditCard,
  inversion: TrendingUp,
  fiscal: Receipt,
  patrimonio: Building2,
  seguimiento: Lightbulb,
};

const CAT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  proteccion: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
  ahorro: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" },
  retiro: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
  deuda: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
  inversion: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
  fiscal: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
  patrimonio: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400" },
  seguimiento: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400" },
};

const PRI_BADGE: Record<string, { label: string; cls: string }> = {
  alta: { label: "Alta", cls: "bg-red-500/20 text-red-300 border-red-500/30" },
  media: { label: "Media", cls: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  baja: { label: "Baja", cls: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
};

export default function PresentacionPage() {
  const params = useParams();
  const router = useRouter();
  const diagnosticoId = params.id as string;
  const { isApiMode } = useDiagnosticoId();
  const store = useDiagnosticoStore();
  const { perfil, flujoMensual, patrimonio, retiro, proteccion, addSessionInsight, sesion_insights } = store;
  const [loading, setLoading] = useState(true);
  const opsRef = useRef<Oportunidad[]>([]);
  const [opportunities, setOpportunities] = useState<Oportunidad[]>([]);

  // Generate opportunities from captured data on mount
  useEffect(() => {
    const storeSnapshot = { perfil, flujoMensual, patrimonio, retiro, proteccion };
    const dataOps = detectarOportunidadesDesdeDatos(storeSnapshot);

    // Also check session insights for transcript-based keywords
    const transcriptInsights = sesion_insights
      .filter((i) => i.tipo === "oportunidad")
      .map((i) => i.texto)
      .join(" ");

    void detectarOportunidades(transcriptInsights, [], storeSnapshot).then((combined) => {
      opsRef.current = combined;
      setOpportunities(combined);

      for (const op of combined) {
        const alreadyRecorded = sesion_insights.some(
          (si) => si.tipo === "oportunidad" && si.producto_sugerido === op.producto_sugerido
        );
        if (!alreadyRecorded) {
          addSessionInsight({
            tipo: "oportunidad",
            texto: `${op.oportunidad}: ${op.razon}`,
            producto_sugerido: op.producto_sugerido,
            confianza: op.confianza,
            fase: "presentacion",
          });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Silent listening during presentation for additional keyword opportunities
  const onTranscript = useCallback(
    (lines: TranscriptLine[]) => {
      const finals = lines.filter((l) => l.isFinal);
      if (finals.length === 0) return;
      const speakers = new Set(finals.map((l) => l.speaker));
      const recent =
        speakers.size >= 2
          ? finals.filter((l) => l.speaker === 1).slice(-3)
          : finals.slice(-3);
      if (recent.length === 0) return;

      const text = recent.map((l) => l.text).join(" ");
      const storeSnapshot = { perfil, flujoMensual, patrimonio, retiro, proteccion };
      void detectarOportunidades(text, opsRef.current, storeSnapshot).then((ops) => {
        const newOps = ops.filter(
          (o) => !opsRef.current.some((e) => e.oportunidad === o.oportunidad)
        );
        opsRef.current = ops;
        setOpportunities(ops);
        for (const op of newOps) {
          addSessionInsight({
            tipo: "oportunidad",
            texto: `${op.oportunidad}: ${op.razon}`,
            producto_sugerido: op.producto_sugerido,
            confianza: op.confianza,
            fase: "simulacion",
          });
        }
      });
    },
    [addSessionInsight, perfil, flujoMensual, patrimonio, retiro, proteccion]
  );

  const { isRecording, startRecording, stopRecording } = useDeepgram(onTranscript);

  useEffect(() => {
    const hasConsent =
      typeof window !== "undefined" &&
      sessionStorage.getItem("voice_consent") === "true";
    if (hasConsent) {
      startRecording();
    }
    return () => {
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const nombre = perfil?.nombre || "Cliente";

  const highPriOps = useMemo(() => opportunities.filter((o) => o.prioridad === "alta"), [opportunities]);
  const medPriOps = useMemo(() => opportunities.filter((o) => o.prioridad === "media"), [opportunities]);
  const lowPriOps = useMemo(() => opportunities.filter((o) => o.prioridad === "baja"), [opportunities]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060D1A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#E8C872] flex items-center justify-center animate-pulse">
            <span className="text-[#060D1A] text-xl font-bold">A</span>
          </div>
          <h2 className="text-xl font-bold text-[#F0F4FA] mb-2">
            ArIA está componiendo tu balance...
          </h2>
          <p className="text-sm text-[#8B9BB4]">
            Procesando datos de {nombre}
          </p>
          <div className="flex gap-1 justify-center mt-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#C9A84C] animate-bounce"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060D1A]">
      {/* Top bar */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b border-white/[0.06]"
        style={{
          background: "rgba(6,13,26,0.9)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/diagnosticos/${diagnosticoId}/sesion`}
            className="text-[#8B9BB4] hover:text-[#F0F4FA] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-[#F0F4FA] font-bold text-lg">
            Balance de {nombre}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#10B981]/10">
              <Mic className="w-2.5 h-2.5 text-[#10B981]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              generarBalancePDF(
                nombre,
                isApiMode && diagnosticoId
                  ? { diagnosticoId, token: getAccessToken() ?? undefined }
                  : undefined
              )
            }
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isRecording) stopRecording();
              router.push(`/diagnosticos/${diagnosticoId}/completado`);
            }}
          >
            <Share className="w-3.5 h-3.5" />
            Compartir
          </Button>
        </div>
      </header>

      {/* Hero: Financial Timeline */}
      {perfil && retiro && patrimonio && flujoMensual && (
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-8">
          <Card>
            <FinancialTimeline
              edadActual={perfil.edad}
              edadRetiro={retiro.edad_retiro}
              edadDefuncion={retiro.edad_defuncion}
              patrimonioActual={
                (patrimonio.liquidez ?? 0) +
                (patrimonio.inversiones ?? 0) +
                (patrimonio.dotales ?? 0)
              }
              ahorroMensual={flujoMensual.ahorro}
              pensionMensual={
                (() => {
                  const mc = calcularMotorC({
                    patrimonio_financiero_total:
                      (patrimonio.liquidez ?? 0) + (patrimonio.inversiones ?? 0) + (patrimonio.dotales ?? 0),
                    saldo_esquemas:
                      (patrimonio.afore ?? 0) + (patrimonio.ppr ?? 0) +
                      (patrimonio.plan_privado ?? 0) + (patrimonio.seguros_retiro ?? 0),
                    ley_73: patrimonio.ley_73,
                    rentas: flujoMensual.rentas,
                    edad: perfil.edad,
                    edad_retiro: retiro.edad_retiro,
                    edad_defuncion: retiro.edad_defuncion,
                    mensualidad_deseada: retiro.mensualidad_deseada,
                  });
                  return mc.pension_total_mensual;
                })()
              }
              rentasMensuales={flujoMensual.rentas}
              mensualidadDeseada={retiro.mensualidad_deseada}
              modo="presentacion"
              showMetrics={true}
            />
          </Card>
        </div>
      )}

      {/* OPORTUNIDADES SECTION */}
      {opportunities.length > 0 && (
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#E8C872] flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-[#060D1A]" />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-[#F0F4FA]">
                    Oportunidades detectadas
                  </h2>
                  <p className="text-sm text-[#8B9BB4]">
                    {opportunities.length} oportunidad{opportunities.length !== 1 ? "es" : ""} identificada{opportunities.length !== 1 ? "s" : ""} para {nombre}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {highPriOps.length > 0 && (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                    {highPriOps.length} alta prioridad
                  </span>
                )}
              </div>
            </div>

            {/* High priority */}
            {highPriOps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider">
                  Prioridad Alta
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {highPriOps.map((op) => (
                    <OpportunityCard key={op.id} op={op} />
                  ))}
                </div>
              </div>
            )}

            {/* Medium priority */}
            {medPriOps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
                  Prioridad Media
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {medPriOps.map((op) => (
                    <OpportunityCard key={op.id} op={op} />
                  ))}
                </div>
              </div>
            )}

            {/* Low priority */}
            {lowPriOps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Prioridad Baja
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {lowPriOps.map((op) => (
                    <OpportunityCard key={op.id} op={op} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content — command center layout */}
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <OutputPanel variant="full" />
      </div>

      {/* FAB: Open simulator */}
      <button
        type="button"
        onClick={() => {
          if (isRecording) stopRecording();
          router.push(`/diagnosticos/${diagnosticoId}/simulador`);
        }}
        className="
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-br from-[#C9A84C] to-[#E8C872]
          text-[#060D1A] shadow-[0_4px_24px_rgba(201,168,76,0.3)]
          hover:shadow-[0_8px_32px_rgba(201,168,76,0.4)]
          hover:scale-105
          active:scale-95
          transition-all duration-200
          flex items-center justify-center
        "
        title="Abrir simulador"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </button>

      {/* Hidden PDF template */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          pointerEvents: "none",
          opacity: 0,
          zIndex: -1,
        }}
      >
        <BalancePDFTemplate />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Opportunity Card Component                                         */
/* ------------------------------------------------------------------ */

function OpportunityCard({ op }: { op: Oportunidad }) {
  const colors = CAT_COLORS[op.categoria] ?? CAT_COLORS.proteccion;
  const pri = PRI_BADGE[op.prioridad] ?? PRI_BADGE.media;
  const Icon = CAT_ICONS[op.categoria] ?? Lightbulb;
  const isAI = op.fuente === "ai";

  return (
    <Card className="group hover:border-[#C9A84C]/30 transition-all duration-300">
      <div className="flex gap-4">
        {/* Icon */}
        <div className={`shrink-0 w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h4 className="font-bold text-[#F0F4FA] text-sm leading-tight truncate">
                {op.oportunidad}
              </h4>
              {isAI && (
                <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold rounded bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/20">
                  AI
                </span>
              )}
            </div>
            <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full border ${pri.cls}`}>
              {pri.label}
            </span>
          </div>

          <p className="text-xs text-[#8B9BB4] leading-relaxed">
            {op.razon}
          </p>

          {/* Signal detected — quote from client */}
          {op.señal_detectada && (
            <div className="rounded-lg bg-[#1A3154]/40 border-l-2 border-[#8B5CF6]/40 px-3 py-2">
              <p className="text-[10px] text-[#5A6A85] uppercase tracking-wider font-semibold mb-0.5">Señal detectada</p>
              <p className="text-[11px] text-[#B4BED0] italic leading-relaxed">
                &ldquo;{op.señal_detectada}&rdquo;
              </p>
            </div>
          )}

          {/* Suggested action */}
          {op.accion_sugerida && (
            <div className="flex items-start gap-2 py-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-[#10B981] mt-0.5 shrink-0" />
              <p className="text-[11px] text-[#10B981] font-medium leading-relaxed">
                {op.accion_sugerida}
              </p>
            </div>
          )}

          {/* Follow-up context */}
          {op.contexto_seguimiento && (
            <div className="rounded-lg bg-[#0C1829] border border-white/[0.04] px-3 py-2">
              <p className="text-[10px] text-[#5A6A85] uppercase tracking-wider font-semibold mb-0.5">Contexto para seguimiento</p>
              <p className="text-[11px] text-[#8B9BB4] leading-relaxed">
                {op.contexto_seguimiento}
              </p>
            </div>
          )}

          {/* Product suggestion */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-medium text-[#8B9BB4] uppercase tracking-wider">
              Producto sugerido
            </span>
          </div>
          <p className="text-xs font-semibold text-[#C9A84C]">
            {op.producto_sugerido}
          </p>
        </div>
      </div>
    </Card>
  );
}
