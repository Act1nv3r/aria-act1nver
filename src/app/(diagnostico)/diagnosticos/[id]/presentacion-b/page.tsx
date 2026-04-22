"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Download, FileText } from "lucide-react";
import confetti from "canvas-confetti";
import { WealthStoryScreen } from "@/components/diagnostico/wealth-story-screen";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { useDiagnosticoId } from "@/contexts/diagnostico-context";
import { generarBalancePDF } from "@/lib/pdf-generator";
import { getAccessToken } from "@/lib/api-client";
import { BalancePDFTemplate } from "@/components/pdf/balance-pdf-template";
import { detectarOportunidades } from "@/lib/navi-opportunities";
import { bulkCreateOportunidades } from "@/lib/crm-api";
import { api } from "@/lib/api-client";

export default function PresentacionBPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const { isApiMode } = useDiagnosticoId();
  const perfil = useDiagnosticoStore((s) => s.perfil);
  const flujoMensual = useDiagnosticoStore((s) => s.flujoMensual);
  const patrimonio = useDiagnosticoStore((s) => s.patrimonio);
  const retiro = useDiagnosticoStore((s) => s.retiro);
  const proteccion = useDiagnosticoStore((s) => s.proteccion);
  const sesion_insights = useDiagnosticoStore((s) => s.sesion_insights);
  const addSessionInsight = useDiagnosticoStore((s) => s.addSessionInsight);
  const agregarOportunidadesSnapshot = useDiagnosticoStore((s) => s.agregarOportunidadesSnapshot);
  const currentClienteId = useDiagnosticoStore((s) => s.currentClienteId);

  const clienteId = searchParams.get("clienteId") ?? currentClienteId;

  const reporteTecnicoHref = useMemo(
    () =>
      `/diagnosticos/${id}/presentacion${clienteId ? `?clienteId=${encodeURIComponent(clienteId)}` : ""}`,
    [id, clienteId]
  );

  // ── Reconstruct store from backend snapshot if local state was cleared ──────
  useEffect(() => {
    const needsHydration = !perfil?.nombre || !flujoMensual || !patrimonio;
    if (!needsHydration || !isApiMode) return;

    api.diagnosticos.get(id).then((diag) => {
      const snap = (diag as Record<string, unknown>)?.parametros_snapshot as Record<string, unknown> | null;

      const backendPerfil = (diag as Record<string, unknown>).perfil as Record<string, unknown> | undefined;
      const backendFlujo = (diag as Record<string, unknown>).flujoMensual as Record<string, unknown> | undefined;
      const backendPatrimonio = (diag as Record<string, unknown>).patrimonio as Record<string, unknown> | undefined;
      const backendRetiro = (diag as Record<string, unknown>).retiro as Record<string, unknown> | undefined;
      const backendProteccion = (diag as Record<string, unknown>).proteccion as Record<string, unknown> | undefined;

      const { updatePerfil, updateFlujoMensual, updatePatrimonio, updateRetiro, updateProteccion,
              updateParejaPerfil, updateParejaFlujoMensual, updateParejaPatrimonio, updateParejaRetiro, updateParejaProteccion,
              updateCriteriosTrayectoria, addSessionInsight: addInsight, setModo } = useDiagnosticoStore.getState();

      if (backendPerfil) updatePerfil(backendPerfil as Parameters<typeof updatePerfil>[0]);
      if (backendFlujo) updateFlujoMensual(backendFlujo as Parameters<typeof updateFlujoMensual>[0]);
      if (backendPatrimonio) updatePatrimonio(backendPatrimonio as Parameters<typeof updatePatrimonio>[0]);
      if (backendRetiro) updateRetiro(backendRetiro as Parameters<typeof updateRetiro>[0]);
      if (backendProteccion) updateProteccion(backendProteccion as Parameters<typeof updateProteccion>[0]);

      if (!snap) return;

      if (snap.modo) setModo(snap.modo as "individual" | "pareja");
      if (snap.criterios_trayectoria) updateCriteriosTrayectoria(snap.criterios_trayectoria as Parameters<typeof updateCriteriosTrayectoria>[0]);
      if (snap.pareja_perfil) updateParejaPerfil(snap.pareja_perfil as Parameters<typeof updateParejaPerfil>[0]);
      if (snap.pareja_flujoMensual) updateParejaFlujoMensual(snap.pareja_flujoMensual as Parameters<typeof updateParejaFlujoMensual>[0]);
      if (snap.pareja_patrimonio) updateParejaPatrimonio(snap.pareja_patrimonio as Parameters<typeof updateParejaPatrimonio>[0]);
      if (snap.pareja_retiro) updateParejaRetiro(snap.pareja_retiro as Parameters<typeof updateParejaRetiro>[0]);
      if (snap.pareja_proteccion) updateParejaProteccion(snap.pareja_proteccion as Parameters<typeof updateParejaProteccion>[0]);

      if (Array.isArray(snap.sesion_insights)) {
        const currentInsights = useDiagnosticoStore.getState().sesion_insights;
        for (const ins of snap.sesion_insights as Array<Record<string, unknown>>) {
          const already = currentInsights.some((ci) => ci.id === ins.id);
          if (!already) {
            addInsight({
              tipo: ins.tipo as "oportunidad" | "insight" | "contexto" | "seguimiento",
              texto: ins.texto as string,
              producto_sugerido: ins.producto_sugerido as string | undefined,
              confianza: (ins.confianza as number) ?? 0,
              fase: ins.fase as "conversacion" | "simulacion" | "presentacion",
              señal_detectada: ins.señal_detectada as string | undefined,
              contexto_seguimiento: ins.contexto_seguimiento as string | undefined,
              accion_sugerida: ins.accion_sugerida as string | undefined,
            });
          }
        }
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const duration = 2500;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: ["#C9A84C", "#E8C872", "#1A3154"],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: ["#C9A84C", "#E8C872", "#1A3154"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  // Misma lógica que en /presentacion: detectar oportunidades y persistir en CRM al llegar aquí primero
  useEffect(() => {
    const storeSnapshot = { perfil, flujoMensual, patrimonio, retiro, proteccion };
    const transcriptInsights = sesion_insights
      .filter((i) => i.tipo === "oportunidad")
      .map((i) => i.texto)
      .join(" ");

    void detectarOportunidades(transcriptInsights, [], storeSnapshot).then((combined) => {
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
            clienteId: clienteId ?? undefined,
          });
        }
      }

      if (clienteId && combined.length > 0) {
        agregarOportunidadesSnapshot(
          clienteId,
          combined.map((op) => ({
            id: op.id,
            titulo: op.oportunidad,
            descripcion: op.razon,
            producto_sugerido: op.producto_sugerido,
            categoria: op.categoria,
            prioridad: op.prioridad,
            confianza: op.confianza,
            estado: "pendiente" as const,
            created_at: op.detected_at,
          }))
        );
      }

      if (clienteId && combined.length > 0) {
        void bulkCreateOportunidades(
          clienteId,
          combined.map((op) => ({
            tipo: "oportunidad" as const,
            categoria: op.categoria,
            prioridad: op.prioridad,
            fuente: op.fuente ?? "datos",
            titulo: op.oportunidad,
            descripcion: op.razon,
            producto_sugerido: op.producto_sugerido,
            señal_detectada: op.señal_detectada,
            contexto_seguimiento: op.contexto_seguimiento,
            accion_sugerida: op.accion_sugerida,
            confianza: op.confianza,
          })),
          id
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadPDF = () => {
    generarBalancePDF(
      perfil?.nombre ?? "Cliente",
      isApiMode && id ? { diagnosticoId: id, token: getAccessToken() ?? undefined } : undefined
    );
  };

  return (
    <div className="min-h-screen bg-[#060D1A]">
      {/* Floating top bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 flex items-center justify-between gap-2"
        style={{
          background: "rgba(6,13,26,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <Link
          href={reporteTecnicoHref}
          className="flex items-center gap-2 text-sm text-[#5A6A85] hover:text-[#C9A84C] transition-colors shrink-0 min-w-0"
        >
          <FileText size={16} className="shrink-0" />
          <span className="truncate hidden sm:inline">Reporte técnico</span>
          <span className="truncate sm:hidden">Técnico</span>
        </Link>

        <p className="text-[10px] sm:text-xs font-bold text-[#C9A84C]/60 uppercase tracking-widest text-center truncate px-1">
          Presentación Patrimonial Premium
        </p>

        <button
          type="button"
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl border transition-colors shrink-0"
          style={{
            borderColor: "rgba(201,168,76,0.3)",
            color: "#C9A84C",
            background: "rgba(201,168,76,0.07)",
          }}
        >
          <Download size={14} />
          <span className="hidden sm:inline">Descargar PDF</span>
        </button>
      </div>

      {/* Top padding for fixed bar */}
      <div className="pt-14 sm:pt-12" />

      {/* Main content */}
      <WealthStoryScreen onDownloadPDF={handleDownloadPDF} />

      {/* Hidden PDF template for html2canvas capture */}
      <div
        aria-hidden="true"
        style={{ position: "fixed", top: "-9999px", left: "-9999px", pointerEvents: "none", opacity: 0, zIndex: -1 }}
      >
        <BalancePDFTemplate />
      </div>
    </div>
  );
}
