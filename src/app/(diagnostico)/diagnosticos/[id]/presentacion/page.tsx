"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Share, SlidersHorizontal, Download, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OutputPanel } from "@/components/diagnostico/output-panel";
import { FinancialTimeline } from "@/components/outputs/financial-timeline";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { useDiagnosticoId } from "@/contexts/diagnostico-context";
import { generarBalancePDF } from "@/lib/pdf-generator";
import { getAccessToken } from "@/lib/api-client";
import { useDeepgram, type TranscriptLine } from "@/hooks/use-deepgram";
import { detectarOportunidades, type Oportunidad } from "@/lib/navi-opportunities";
import { BalancePDFTemplate } from "@/components/pdf/balance-pdf-template";
import { calcularMotorC } from "@/lib/motors";

export default function PresentacionPage() {
  const params = useParams();
  const router = useRouter();
  const diagnosticoId = params.id as string;
  const { isApiMode } = useDiagnosticoId();
  const store = useDiagnosticoStore();
  const { perfil, flujoMensual, patrimonio, retiro, addSessionInsight } = store;
  const [loading, setLoading] = useState(true);
  const opsRef = useRef<Oportunidad[]>([]);

  // Silent listening during presentation
  const onTranscript = useCallback(
    (lines: TranscriptLine[]) => {
      const recent = lines.filter((l) => l.isFinal && l.speaker === 1).slice(-3);
      if (recent.length === 0) return;

      const text = recent.map((l) => l.text).join(" ");
      void detectarOportunidades(text, opsRef.current).then((ops) => {
        const newOps = ops.filter(
          (o) => !opsRef.current.some((e) => e.producto_sugerido === o.producto_sugerido)
        );
        opsRef.current = ops;
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
    [addSessionInsight]
  );

  const { isRecording, startRecording, stopRecording } = useDeepgram(onTranscript);

  // Auto-start silent listening if consent was given
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

  // Simulate motor calculation loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const nombre = perfil?.nombre || "Cliente";

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
      {/* Top bar — minimal for presentation mode */}
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

      {/* Hero: Financial Timeline — full width */}
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
