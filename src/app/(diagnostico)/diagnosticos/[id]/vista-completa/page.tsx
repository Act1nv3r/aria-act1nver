"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Sparkles,
  SlidersHorizontal,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";
import { BalanceResultsScreen } from "@/components/diagnostico/balance-results-screen";
import { WealthStoryScreen } from "@/components/diagnostico/wealth-story-screen";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { useDiagnosticoId } from "@/contexts/diagnostico-context";
import { generarBalancePDF } from "@/lib/pdf-generator";
import { getAccessToken } from "@/lib/api-client";
import { BalancePDFTemplate } from "@/components/pdf/balance-pdf-template";

type Tab = "balance" | "narrativa" | "simulador";

const TABS: { id: Tab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { id: "balance",   label: "Balance Patrimonial",   shortLabel: "Balance",   icon: <BarChart3 className="w-4 h-4" /> },
  { id: "narrativa", label: "Presentación Premium",  shortLabel: "Narrativa", icon: <Sparkles className="w-4 h-4" /> },
  { id: "simulador", label: "Simulador",             shortLabel: "Simulador", icon: <SlidersHorizontal className="w-4 h-4" /> },
];

export default function VistaCompletaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const { isApiMode } = useDiagnosticoId();
  const perfil = useDiagnosticoStore((s) => s.perfil);
  const patrimonio = useDiagnosticoStore((s) => s.patrimonio);
  const currentClienteId = useDiagnosticoStore((s) => s.currentClienteId);
  const clienteId = searchParams.get("clienteId") ?? currentClienteId;
  const autoDownload = searchParams.get("autoDownload") === "true";

  const [activeTab, setActiveTab] = useState<Tab>("balance");
  const [preparingPDF, setPreparingPDF] = useState(false);
  const autoDownloadFiredRef = useRef(false);

  // Show "Preparando PDF..." banner as soon as autoDownload is active
  useEffect(() => {
    if (autoDownload) setPreparingPDF(true);
  }, [autoDownload]);

  // Auto-trigger PDF download when navigated here with ?autoDownload=true
  // Wait until the store has real data (patrimonio populated by DiagnosticoProvider)
  useEffect(() => {
    if (!autoDownload || autoDownloadFiredRef.current) return;
    // patrimonio being non-null means DiagnosticoProvider finished loading
    if (!patrimonio) return;
    autoDownloadFiredRef.current = true;
    const nombre = perfil?.nombre || "Cliente";
    generarBalancePDF(
      nombre,
      isApiMode && id ? { diagnosticoId: id, token: getAccessToken() ?? undefined } : undefined
    ).finally(() => setPreparingPDF(false));
  }, [autoDownload, patrimonio, perfil, isApiMode, id]);

  const qp = clienteId ? `?clienteId=${encodeURIComponent(clienteId)}` : "";
  const hubHref = `/diagnosticos/${id}/resultados${qp}`;
  const simuladorHref = `/diagnosticos/${id}/simulador${qp}`;

  return (
    <div className="min-h-screen bg-[#060D1A] flex flex-col">

      {/* Sticky tab bar */}
      <div
        className="sticky top-0 z-50 flex items-center gap-0 px-4 sm:px-6 border-b border-white/[0.06]"
        style={{
          background: "rgba(6,13,26,0.92)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Back to hub */}
        <Link
          href={hubHref}
          className="flex items-center gap-1.5 text-xs text-[#5A6A85] hover:text-[#8B9BB4] transition-colors py-4 shrink-0 mr-3"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Vistas</span>
        </Link>

        <div className="h-5 w-px bg-white/[0.08] mr-3 shrink-0" />

        {/* Tabs */}
        <div className="flex items-center flex-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-all shrink-0 ${
                activeTab === tab.id
                  ? "text-[#C9A84C] border-[#C9A84C]"
                  : "text-[#5A6A85] border-transparent hover:text-[#8B9BB4]"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Client name — right side */}
        {perfil?.nombre && (
          <span className="text-[11px] text-[#4A5A72] hidden lg:block shrink-0 ml-4 truncate max-w-[160px]">
            {perfil.nombre}
          </span>
        )}
      </div>

      {/* PDF preparing banner */}
      {preparingPDF && (
        <div className="sticky top-[53px] z-40 flex items-center justify-center gap-3 px-4 py-2.5 text-sm text-[#C9A84C] bg-[#0D1E33] border-b border-[#C9A84C]/20">
          <svg
            className="w-4 h-4 animate-spin shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Preparando Balance Patrimonial PDF…
        </div>
      )}

      {/* Tab content */}
      {activeTab === "balance" && (
        <div className="flex-1 max-w-[1600px] mx-auto w-full px-6 sm:px-8 lg:px-12 py-8">
          <BalanceResultsScreen />
        </div>
      )}

      {activeTab === "narrativa" && (
        <div className="flex-1">
          <WealthStoryScreen
            onDownloadPDF={() =>
              generarBalancePDF(
                perfil?.nombre ?? "Cliente",
                isApiMode && id
                  ? { diagnosticoId: id, token: getAccessToken() ?? undefined }
                  : undefined
              )
            }
          />
        </div>
      )}

      {activeTab === "simulador" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 mx-auto rounded-[20px] bg-[#1A3154] border border-white/[0.08] flex items-center justify-center mb-6">
              <SlidersHorizontal className="w-7 h-7 text-[#8B9BB4]" />
            </div>
            <h3 className="text-[#F0F4FA] font-bold text-lg mb-3">
              Simulador de escenarios
            </h3>
            <p className="text-[#8B9BB4] text-sm leading-relaxed mb-8">
              Ajusta ahorro mensual, edad de retiro, aportaciones extra y ve en tiempo real
              cómo cambia la trayectoria patrimonial.
            </p>
            <Link href={simuladorHref}>
              <button
                type="button"
                className="flex items-center gap-2 mx-auto px-6 py-3 rounded-[12px] bg-[#1A3154] border border-white/[0.12] text-[#F0F4FA] font-medium text-sm hover:border-[#C9A84C]/30 transition-all"
              >
                Abrir simulador completo
                <ExternalLink className="w-4 h-4 text-[#8B9BB4]" />
              </button>
            </Link>
          </div>
        </div>
      )}

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
