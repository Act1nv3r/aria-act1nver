"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { OutputPanel } from "@/components/diagnostico/output-panel";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { useDiagnosticoId } from "@/contexts/diagnostico-context";
import { generarBalancePDF, generarDiagnosticoPDF } from "@/lib/pdf-generator";
import { getAccessToken } from "@/lib/api-client";
import { CompartirButton } from "./compartir-button";
import { BalancePDFTemplate } from "@/components/pdf/balance-pdf-template";
import { DiagnosticoPDFTemplate } from "@/components/pdf/diagnostico-pdf-template";

export default function CompletadoPage() {
  const params = useParams();
  const id = params?.id as string;
  const { isApiMode } = useDiagnosticoId();
  const perfil = useDiagnosticoStore((s) => s.perfil);

  useEffect(() => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#C9A84C", "#10B981", "#1A3154"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#C9A84C", "#10B981", "#1A3154"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  return (
    <div className="min-h-screen bg-[#060D1A]">

      {/* Hero section */}
      <div className="relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#C9A84C]/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative text-center py-16 px-6">
          {/* Celebration icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[24px] bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 border border-[#C9A84C]/30 mb-6">
            <CheckCircle className="w-10 h-10 text-[#C9A84C]" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-[#F0F4FA] mb-3">
            Diagnóstico completo
          </h1>
          <p className="text-[#8B9BB4] text-lg max-w-md mx-auto">
            {perfil?.nombre
              ? `${perfil.nombre}, aquí está tu análisis financiero integral.`
              : "Aquí está el análisis financiero integral."}
          </p>

          {/* Action buttons row */}
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            {/* PDF downloads — always on the same row */}
            <div className="flex gap-3">
              <Button
                variant="accent"
                size="lg"
                onClick={() =>
                  generarDiagnosticoPDF(
                    perfil?.nombre ?? "Cliente",
                    isApiMode && id
                      ? { diagnosticoId: id, token: getAccessToken() ?? undefined }
                      : undefined
                  )
                }
              >
                Descarga tu Diagnóstico Financiero
              </Button>

              <Button
                variant="accent"
                size="lg"
                onClick={() =>
                  generarBalancePDF(
                    perfil?.nombre ?? "Cliente",
                    isApiMode && id
                      ? { diagnosticoId: id, token: getAccessToken() ?? undefined }
                      : undefined
                  )
                }
              >
                Descarga tu Balance Financiero
              </Button>
            </div>

            {isApiMode && id && (
              <CompartirButton diagnosticoId={id} />
            )}

            <Link href={`/diagnosticos/${id}/simulador`}>
              <Button variant="secondary" size="lg">
                Simular escenarios
              </Button>
            </Link>

            <Link href={`/diagnosticos/${id}/wrapped`}>
              <Button
                variant="outline"
                size="lg"
                className="border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/50"
              >
                Financial Wrapped
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button variant="ghost" size="lg">
                Volver al Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Results panel */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-24">
        <OutputPanel variant="full" />
      </div>

      {/* Hidden PDF templates for html2canvas capture */}
      <div aria-hidden="true" style={{ position: 'fixed', top: '-9999px', left: '-9999px', pointerEvents: 'none', opacity: 0, zIndex: -1 }}>
        <BalancePDFTemplate />
        <DiagnosticoPDFTemplate />
      </div>

      {/* Sticky bottom bar */}
      <div
        className="sticky bottom-0 py-4 px-6 border-t border-white/[0.06]"
        style={{
          background: "rgba(6,13,26,0.9)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-[1200px] mx-auto flex flex-wrap gap-3 justify-end">
          <Button
            variant="accent"
            size="sm"
            onClick={() =>
              generarBalancePDF(
                perfil?.nombre ?? "Cliente",
                isApiMode && id
                  ? { diagnosticoId: id, token: getAccessToken() ?? undefined }
                  : undefined
              )
            }
          >
            Descarga tu Balance Financiero
          </Button>

          <Button
            variant="accent"
            size="sm"
            onClick={() =>
              generarDiagnosticoPDF(
                perfil?.nombre ?? "Cliente",
                isApiMode && id
                  ? { diagnosticoId: id, token: getAccessToken() ?? undefined }
                  : undefined
              )
            }
          >
            Descarga tu Diagnóstico Financiero
          </Button>

          <Link href={`/diagnosticos/${id}/simulador`}>
            <Button variant="secondary" size="sm">
              Simular escenarios
            </Button>
          </Link>

          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              ← Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
