"use client";

import { useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import { BalanceResultsScreenV2 } from "@/components/diagnostico/balance-results-screen-v2";
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

  const hubHref = useMemo(
    () => `/diagnosticos/${id}/resultados${clienteId ? `?clienteId=${encodeURIComponent(clienteId)}` : ""}`,
    [id, clienteId]
  );

  // ── Reconstruct store from backend snapshot if local state was cleared ──────
  useEffect(() => {
    if (!isApiMode || !id) return;

    api.diagnosticos.get(id).then((diag) => {
      const snap = (diag as Record<string, unknown>)?.parametros_snapshot as Record<string, unknown> | null;

      const { updatePerfil, updateFlujoMensual, updatePatrimonio, updateRetiro, updateProteccion,
              updateParejaPerfil, updateParejaFlujoMensual, updateParejaPatrimonio, updateParejaRetiro, updateParejaProteccion,
              updateCriteriosTrayectoria, addSessionInsight: addInsight, setModo } = useDiagnosticoStore.getState();

      // Primary source: parametros_snapshot (where guardarSesionEnCRM saves all data)
      if (snap) {
        if (snap.perfil)        updatePerfil(snap.perfil as Parameters<typeof updatePerfil>[0]);
        if (snap.flujoMensual)  updateFlujoMensual(snap.flujoMensual as Parameters<typeof updateFlujoMensual>[0]);
        if (snap.patrimonio)    updatePatrimonio(snap.patrimonio as Parameters<typeof updatePatrimonio>[0]);
        if (snap.retiro)        updateRetiro(snap.retiro as Parameters<typeof updateRetiro>[0]);
        if (snap.proteccion)    updateProteccion(snap.proteccion as Parameters<typeof updateProteccion>[0]);
        if (snap.modo)          setModo(snap.modo as "individual" | "pareja");
        if (snap.criterios_trayectoria) updateCriteriosTrayectoria(snap.criterios_trayectoria as Parameters<typeof updateCriteriosTrayectoria>[0]);
        if (snap.pareja_perfil)       updateParejaPerfil(snap.pareja_perfil as Parameters<typeof updateParejaPerfil>[0]);
        if (snap.pareja_flujoMensual) updateParejaFlujoMensual(snap.pareja_flujoMensual as Parameters<typeof updateParejaFlujoMensual>[0]);
        if (snap.pareja_patrimonio)   updateParejaPatrimonio(snap.pareja_patrimonio as Parameters<typeof updateParejaPatrimonio>[0]);
        if (snap.pareja_retiro)       updateParejaRetiro(snap.pareja_retiro as Parameters<typeof updateParejaRetiro>[0]);
        if (snap.pareja_proteccion)   updateParejaProteccion(snap.pareja_proteccion as Parameters<typeof updateParejaProteccion>[0]);

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
      }

      // Fallback: individual section fields if no snapshot (older diagnostics)
      const state = useDiagnosticoStore.getState();
      const diagR = diag as Record<string, unknown>;
      if (!state.perfil?.nombre && diagR.perfil)      updatePerfil(diagR.perfil as Parameters<typeof updatePerfil>[0]);
      if (!state.flujoMensual && diagR.flujoMensual)  updateFlujoMensual(diagR.flujoMensual as Parameters<typeof updateFlujoMensual>[0]);
      if (!state.patrimonio && diagR.patrimonio)       updatePatrimonio(diagR.patrimonio as Parameters<typeof updatePatrimonio>[0]);
      if (!state.retiro && diagR.retiro)               updateRetiro(diagR.retiro as Parameters<typeof updateRetiro>[0]);
      if (!state.proteccion && diagR.proteccion)       updateProteccion(diagR.proteccion as Parameters<typeof updateProteccion>[0]);

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
    <>
      {/* New full-page design — replaces WealthStoryScreen */}
      <BalanceResultsScreenV2
        nombre={perfil?.nombre ?? undefined}
        backHref={clienteId ? `/customers/${clienteId}` : "/dashboard"}
        onDownloadBalance={handleDownloadPDF}
      />

      {/* Hidden PDF template for html2canvas capture */}
      <div
        aria-hidden="true"
        style={{ position: "fixed", top: "-9999px", left: "-9999px", pointerEvents: "none", opacity: 0, zIndex: -1 }}
      >
        <BalancePDFTemplate />
      </div>
    </>
  );
}
