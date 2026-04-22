/**
 * guardarSesionEnCRM
 * ─────────────────────────────────────────────────────────────────────────────
 * Persists everything captured during a voice/manual session to the backend:
 *
 *  1. Saves all diagnostic sections to the API (perfil, flujo mensual,
 *     patrimonio, retiro, protección) via `api.diagnosticos.put*`.
 *  2. Marks the diagnostic as "completado", saving the FULL session snapshot
 *     (sesion_insights, criterios, outputs, pareja, etc.) into
 *     `Diagnostico.parametros_snapshot` (PostgreSQL JSONB — survives reloads
 *     and device switches).
 *  3. If a clienteId is available:
 *     a. Syncs the computed CRM profile (patrimonio_total, etc.) via syncPerfil.
 *     b. Logs the session as a "diagnostico" activity (historial timeline).
 *     c. Creates a "nota" activity (Documentos tab entry with Descargar button).
 *
 * Failures are caught per-section with Promise.allSettled so a single
 * network error never blocks navigation to the results screen.
 */

import { api } from "./api-client";
import { createActividad, syncPerfil } from "./crm-api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SesionPayload {
  diagnosticoId: string;
  clienteId: string | null;
  transcriptText: string;
  sesionMinutos: number;
  completitud_pct: number;
  datos_fuente: "voz" | "manual" | "mixto";

  // Titular
  perfil: Record<string, unknown> | null;
  flujoMensual: Record<string, unknown> | null;
  patrimonio: Record<string, unknown> | null;
  retiro: Record<string, unknown> | null;
  proteccion: Record<string, unknown> | null;

  // Pareja (nivel 3 — may be null for individual mode)
  pareja_perfil: Record<string, unknown> | null;
  pareja_flujoMensual: Record<string, unknown> | null;
  pareja_patrimonio: Record<string, unknown> | null;
  pareja_retiro: Record<string, unknown> | null;
  pareja_proteccion: Record<string, unknown> | null;

  // Motor outputs (already computed client-side)
  outputs: Record<string, unknown> | null;

  // Session intelligence
  sesion_insights: Array<{
    id: string;
    tipo: string;
    texto: string;
    producto_sugerido?: string;
    confianza: number;
    fase: string;
    created_at: number;
    señal_detectada?: string;
    contexto_seguimiento?: string;
    accion_sugerida?: string;
  }>;

  // Trayectoria criteria (affects motor calculations)
  criterios_trayectoria: Record<string, unknown> | null;

  // Session mode
  modo: "individual" | "pareja";
}

export interface GuardarResult {
  ok: boolean;
  savedSections: string[];
  errors: string[];
}

// ─── Main function ────────────────────────────────────────────────────────────

export async function guardarSesionEnCRM(
  payload: SesionPayload
): Promise<GuardarResult> {
  const {
    diagnosticoId,
    clienteId,
    transcriptText,
    sesionMinutos,
    completitud_pct,
    datos_fuente,
    perfil,
    flujoMensual,
    patrimonio,
    retiro,
    proteccion,
    pareja_perfil,
    pareja_flujoMensual,
    pareja_patrimonio,
    pareja_retiro,
    pareja_proteccion,
    outputs,
    sesion_insights,
    criterios_trayectoria,
    modo,
  } = payload;

  const savedSections: string[] = [];
  const errors: string[] = [];

  // ── 1. Persist diagnostic sections ─────────────────────────────────────────
  const sectionJobs: Array<[string, Promise<unknown>]> = [
    ["perfil", perfil ? api.diagnosticos.putPerfil(diagnosticoId, perfil) : Promise.resolve(null)],
    ["flujoMensual", flujoMensual ? api.diagnosticos.putFlujoMensual(diagnosticoId, flujoMensual) : Promise.resolve(null)],
    ["patrimonio", patrimonio ? api.diagnosticos.putPatrimonio(diagnosticoId, patrimonio) : Promise.resolve(null)],
    ["retiro", retiro ? api.diagnosticos.putRetiro(diagnosticoId, retiro) : Promise.resolve(null)],
    ["proteccion", proteccion ? api.diagnosticos.putProteccion(diagnosticoId, proteccion) : Promise.resolve(null)],
  ];

  const sectionResults = await Promise.allSettled(sectionJobs.map(([, p]) => p));
  sectionJobs.forEach(([name], i) => {
    if (sectionResults[i].status === "fulfilled") {
      savedSections.push(name);
    } else {
      const reason = (sectionResults[i] as PromiseRejectedResult).reason;
      errors.push(`${name}: ${String(reason)}`);
    }
  });

  // ── 2. Mark diagnostic as completed + persist full session snapshot ─────────
  // The snapshot is the source of truth for reconstruction on any device/browser.
  const parametros_snapshot: Record<string, unknown> = {
    // Core diagnostic data
    perfil,
    flujoMensual,
    patrimonio,
    retiro,
    proteccion,

    // Pareja data (null for individual mode)
    pareja_perfil,
    pareja_flujoMensual,
    pareja_patrimonio,
    pareja_retiro,
    pareja_proteccion,

    // Motor outputs (computed client-side, stored for fast reconstruction)
    outputs,

    // Session intelligence — structured insights (oportunidades, contexto, etc.)
    sesion_insights,

    // Trayectoria criteria (affects motor C/E projections)
    criterios_trayectoria,

    // Session metadata
    modo,
    datos_fuente,
    completitud_pct,
    sesion_duracion_minutos: sesionMinutos,
    guardado_at: new Date().toISOString(),

    // Transcript preview (first 1000 chars — full transcript is in the actividad)
    transcript_preview: transcriptText ? transcriptText.slice(0, 1000) : null,
  };

  try {
    await api.diagnosticos.completar(diagnosticoId, parametros_snapshot);
    savedSections.push("completado+snapshot");
  } catch (err) {
    errors.push(`completar: ${String(err)}`);
  }

  // ── 3. CRM: sync profile + log session activity + register document ────────
  if (clienteId) {
    const fechaStr = new Date().toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const clienteNombre = (perfil?.nombre as string | undefined) ?? "Cliente";

    const transcriptPreview = transcriptText
      ? transcriptText.slice(0, 2000) + (transcriptText.length > 2000 ? "…" : "")
      : "Sin transcripción disponible.";

    const descripcionActividad = [
      `Fuente de datos: ${datos_fuente === "voz" ? "Entrevista por voz" : datos_fuente === "manual" ? "Captura manual" : "Mixto (voz + manual)"}.`,
      `Completitud alcanzada: ${Math.round(completitud_pct)}%.`,
      sesionMinutos > 0 ? `Duración de la sesión: ${Math.round(sesionMinutos)} min.` : null,
      modo === "pareja" ? "Diagnóstico en modo pareja." : null,
      "",
      transcriptText ? `Transcripción:\n${transcriptPreview}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const crmJobs = await Promise.allSettled([
      // 3a. Re-compute accumulated CRM profile from latest diagnostic data
      syncPerfil(clienteId),

      // 3b. Timeline activity (tipo diagnostico) — visible in Historial tab
      createActividad(clienteId, {
        tipo: "diagnostico",
        titulo: `Balance Patrimonial generado — ${fechaStr}`,
        descripcion: descripcionActividad,
        resultado: `Completitud ${Math.round(completitud_pct)}% · ${datos_fuente}`,
        diagnostico_id: diagnosticoId,
        duracion_minutos: Math.max(1, Math.round(sesionMinutos)),
        fecha_actividad: new Date().toISOString(),
        metadata_extra: {
          datos_fuente,
          completitud_pct,
          modo,
          tiene_transcripcion: !!transcriptText,
          caracteres_transcripcion: transcriptText.length,
          oportunidades_count: sesion_insights.filter((i) => i.tipo === "oportunidad").length,
        },
      }),

      // 3c. Document entry (tipo nota) — visible in Documentos tab via title filter
      createActividad(clienteId, {
        tipo: "nota",
        titulo: `Balance Patrimonial — ${clienteNombre}`,
        descripcion: `Reporte Balance Patrimonial generado el ${fechaStr}. Completitud: ${Math.round(completitud_pct)}%. Disponible para descargar en cualquier momento desde el reporte.`,
        resultado: "Documento generado",
        diagnostico_id: diagnosticoId,
        fecha_actividad: new Date().toISOString(),
        metadata_extra: {
          tipo_documento: "balance",
          cliente_nombre: clienteNombre,
          completitud_pct,
          datos_fuente,
        },
      }),
    ]);

    if (crmJobs[0].status === "fulfilled") savedSections.push("syncPerfil");
    else errors.push(`syncPerfil: ${String((crmJobs[0] as PromiseRejectedResult).reason)}`);

    if (crmJobs[1].status === "fulfilled") savedSections.push("actividad");
    else errors.push(`actividad: ${String((crmJobs[1] as PromiseRejectedResult).reason)}`);

    if (crmJobs[2].status === "fulfilled") savedSections.push("documento");
    else errors.push(`documento: ${String((crmJobs[2] as PromiseRejectedResult).reason)}`);
  }

  return { ok: errors.length === 0, savedSections, errors };
}

/**
 * Logs a "balance generado" activity in CRM when the advisor downloads/sends
 * the PDF so the interaction is recorded in the client timeline.
 */
export async function registrarBalanceGenerado(
  clienteId: string,
  diagnosticoId: string,
  formato: "pdf" | "compartido" = "pdf"
): Promise<void> {
  try {
    await createActividad(clienteId, {
      tipo: "nota",
      titulo: formato === "pdf" ? "Balance Patrimonial descargado en PDF" : "Balance Patrimonial compartido con cliente",
      descripcion: formato === "pdf"
        ? "El asesor descargó el Balance Patrimonial completo del cliente en formato PDF."
        : "El asesor compartió el Balance Patrimonial con el cliente vía enlace seguro.",
      resultado: "Documento generado",
      diagnostico_id: diagnosticoId,
      fecha_actividad: new Date().toISOString(),
      metadata_extra: { formato },
    });
  } catch {
    // fire-and-forget — PDF download should never block on this
  }
}
