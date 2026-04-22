import type { MotorAOutput } from "./motor-a";
import type { MotorBOutput } from "./motor-b";
import type { MotorEOutput } from "./motor-e";
import type { MotorFOutput } from "./motor-f";

export type Urgencia = "Bajo" | "Medio" | "Alto" | "Muy Alto";

export interface AreaScore {
  area: string;         // display name
  key: string;          // slug for radar axis
  score: number;        // 0–100
  urgencia: Urgencia;
  situacion: string;    // short description of current state
  recomendacion: string; // actionable recommendation
  icono: string;        // emoji
  valor_clave: string;  // e.g. "4.2 meses", "71% ingresos"
}

export interface SaludFinancieraResult {
  areas: AreaScore[];
  score_total: number; // weighted average 0–100
}

interface SaludInput {
  motorA: MotorAOutput | null;
  motorB: MotorBOutput | null;
  motorC: { grado_avance: number; deficit_mensual: number } | null;
  motorE: MotorEOutput | null;
  motorF: MotorFOutput | null;
  patrimonio: {
    casa: number; inmuebles_renta: number; tierra: number;
    negocio: number; herencia: number;
  } | null;
  proteccion: {
    seguro_vida: boolean | null;
    propiedades_aseguradas: boolean | null;
    sgmm: boolean | null;
  } | null;
  perfil: { dependientes: boolean | null } | null;
}

function toUrgencia(score: number): Urgencia {
  if (score >= 75) return "Bajo";
  if (score >= 50) return "Medio";
  if (score >= 25) return "Alto";
  return "Muy Alto";
}

export function calcularSaludFinanciera(input: SaludInput): SaludFinancieraResult {
  const areas: AreaScore[] = [];

  // ── 1. Liquidez ──────────────────────────────────────────────
  {
    const meses = input.motorA?.meses_cubiertos ?? null;
    let score = 30;
    let situacion = "Sin datos suficientes";
    let recomendacion = "Registra tu liquidez y gastos básicos para calcular tu reserva de emergencia.";
    let valor_clave = "—";
    if (meses !== null) {
      valor_clave = `${meses.toFixed(1)} meses`;
      if (meses >= 6) { score = 100; situacion = "Reserva óptima"; recomendacion = "Mantén tu reserva de emergencia y considera invertir el excedente en instrumentos de mayor rendimiento."; }
      else if (meses >= 3) { score = 70; situacion = "Reserva adecuada"; recomendacion = "Mantén la reserva de emergencia y optimiza el excedente hacia inversiones de corto plazo."; }
      else if (meses >= 1) { score = 40; situacion = "Reserva insuficiente"; recomendacion = "Incrementa tu reserva de emergencia a al menos 3 meses de gastos básicos antes de invertir."; }
      else { score = 15; situacion = "Reserva crítica"; recomendacion = "Prioriza construir una reserva de emergencia inmediata. Considera reducir gastos no esenciales y direccionar ese flujo a liquidez."; }
    }
    areas.push({ area: "Liquidez", key: "liquidez", score, urgencia: toUrgencia(score), situacion, recomendacion, icono: "💧", valor_clave });
  }

  // ── 2. Riqueza Financiera ─────────────────────────────────────
  {
    const ratio = input.motorB?.ratio ?? 0;
    const nivel = input.motorB?.nivel_riqueza ?? null;
    let score = 20;
    let situacion = "Sin patrimonio financiero registrado";
    let recomendacion = "Registra tus inversiones, fondos y cuentas de ahorro para calcular tu índice de riqueza.";
    let valor_clave = "—";
    if (input.motorB) {
      valor_clave = `Ratio ${ratio.toFixed(1)}x gastos anuales`;
      if (ratio >= 20) { score = 100; situacion = "Riqueza consolidada"; recomendacion = "Patrimonio financiero sólido. Diversifica en activos internacionales y optimiza la carga fiscal de tus rendimientos."; }
      else if (ratio >= 10) { score = 75; situacion = "Sólida y en crecimiento"; recomendacion = "Optimiza rendimientos y diversifica tu portafolio con fondos de mayor rentabilidad ajustada al riesgo."; }
      else if (ratio >= 5) { score = 50; situacion = "En construcción"; recomendacion = "Incrementa tus aportaciones periódicas. Considera instrumentos como CETES, fondos indexados o SIC para acelerar la acumulación."; }
      else { score = 25; situacion = "Patrimonio inicial"; recomendacion = "Establece una estrategia de ahorro e inversión mensual. Aprovecha el poder del interés compuesto comenzando hoy."; }
      if (nivel) situacion = nivel.charAt(0).toUpperCase() + nivel.slice(1);
    }
    areas.push({ area: "Riqueza Financiera", key: "riqueza", score, urgencia: toUrgencia(score), situacion, recomendacion, icono: "📈", valor_clave });
  }

  // ── 3. Inversión (tasa de ahorro) ────────────────────────────
  {
    const ahorroPct = input.motorA?.distribucion?.ahorro_pct ?? 0;
    const ingresos = input.motorA?.ingresos_totales ?? 0;
    let score = 20;
    let situacion = "Sin datos de flujo";
    let recomendacion = "Registra tus ingresos y gastos para calcular tu tasa de ahorro.";
    let valor_clave = "—";
    if (input.motorA && ingresos > 0) {
      const pct = ahorroPct * 100;
      valor_clave = `${pct.toFixed(0)}% de ingresos`;
      if (pct >= 25) { score = 100; situacion = "Ahorro excelente"; recomendacion = "Tasa de ahorro ejemplar. Incrementa Patrimonio Financiero con excedente e invierte en instrumentos de largo plazo."; }
      else if (pct >= 15) { score = 75; situacion = "Ahorro saludable"; recomendacion = "Buena tasa de ahorro. Considera aumentarla 5 puntos porcentuales destinando ese flujo a tu AFORE o fondos indexados."; }
      else if (pct >= 5) { score = 50; situacion = "Ahorro moderado"; recomendacion = "Revisa gastos prescindibles para incrementar tu tasa de ahorro hacia el 15-20% de tus ingresos."; }
      else { score = 20; situacion = "Ahorro bajo"; recomendacion = "Tasa de ahorro crítica. Elabora un presupuesto y busca reducir gastos o incrementar ingresos para ahorrar al menos el 10% mensual."; }
    }
    areas.push({ area: "Inversión", key: "inversion", score, urgencia: toUrgencia(score), situacion, recomendacion, icono: "💼", valor_clave });
  }

  // ── 4. Inmuebles ──────────────────────────────────────────────
  {
    const noFin = input.motorE?.noFinanciero ?? 0;
    const activos = input.motorE?.activos_total ?? 0;
    const noFinPct = activos > 0 ? noFin / activos : 0;
    let score = 40;
    let situacion = "Sin activos inmobiliarios registrados";
    let recomendacion = "Registra tus propiedades y activos no financieros para completar tu balance patrimonial.";
    let valor_clave = "—";
    if (input.motorE && activos > 0) {
      const pct = noFinPct * 100;
      valor_clave = `${pct.toFixed(0)}% del patrimonio`;
      if (pct > 70) { score = 55; situacion = "Alta concentración inmobiliaria"; recomendacion = "Patrimonio muy concentrado en activos ilíquidos. Considera diversificar hacia activos financieros para mejorar la liquidez."; }
      else if (pct >= 20) { score = 85; situacion = "Participación normal"; recomendacion = "Mantén y valoriza activos inmobiliarios. Evalúa si tu casa habitación está correctamente valuada y asegurada."; }
      else if (pct > 0) { score = 65; situacion = "Participación baja"; recomendacion = "Considera si tu perfil se beneficiaría de mayor exposición a bienes raíces como diversificación patrimonial."; }
      else { score = 40; situacion = "Sin activos inmobiliarios"; recomendacion = "No tienes activos inmobiliarios. Evalúa si adquirir casa o una propiedad de inversión se alinea con tus metas financieras."; }
    }
    areas.push({ area: "Inmuebles", key: "inmuebles", score, urgencia: toUrgencia(score), situacion, recomendacion, icono: "🏠", valor_clave });
  }

  // ── 5. Seguros ────────────────────────────────────────────────
  {
    const sv = input.proteccion?.seguro_vida;
    const sgmm = input.proteccion?.sgmm;
    const prop = input.proteccion?.propiedades_aseguradas;
    let covered = 0;
    let total = 0;
    let situacion = "Sin datos de protección";
    let recomendacion = "Registra tus coberturas de seguros para evaluar tu nivel de protección patrimonial.";
    let valor_clave = "—";
    if (sv !== null && sv !== undefined) { total++; if (sv) covered++; }
    if (sgmm !== null && sgmm !== undefined) { total++; if (sgmm) covered++; }
    if (prop !== null && prop !== undefined) { total++; if (prop) covered++; }
    let score = 30;
    if (total > 0) {
      const ratio = covered / total;
      valor_clave = `${covered}/${total} coberturas`;
      if (ratio >= 1) { score = 100; situacion = "Coberturas vigentes"; recomendacion = "Coberturas completas. Revisa sumas aseguradas anualmente y ajusta inflación para mantener cobertura real."; }
      else if (ratio >= 0.67) { score = 65; situacion = "Cobertura parcial"; recomendacion = "Faltan coberturas importantes. Prioriza el seguro de vida si tienes dependientes y el SGMM para todos los integrantes."; }
      else if (ratio >= 0.33) { score = 35; situacion = "Cobertura insuficiente"; recomendacion = "Cobertura muy limitada. Contrata de manera urgente SGMM y revisa la necesidad de seguro de vida."; }
      else { score = 10; situacion = "Sin cobertura"; recomendacion = "Sin protección. Un evento de salud o fallecimiento podría devastar el patrimonio familiar. Actúa de inmediato."; }
    }
    areas.push({ area: "Seguros", key: "seguros", score, urgencia: toUrgencia(score), situacion, recomendacion, icono: "🛡️", valor_clave });
  }

  // ── 6. Dependientes ───────────────────────────────────────────
  {
    const dep = input.perfil?.dependientes;
    const sv = input.proteccion?.seguro_vida;
    let score = 80;
    let situacion = "Sin dependientes económicos";
    let recomendacion = "No se requiere seguro de vida por dependientes económicos en este momento.";
    let valor_clave = "N/A";
    if (dep === true) {
      valor_clave = "Con dependientes";
      if (sv === true) {
        score = 80;
        situacion = "Cubiertos parcialmente";
        recomendacion = "Tienes seguro de vida. Verifica que la suma asegurada cubra al menos 3 años de gastos totales de tu familia.";
      } else {
        score = 10;
        situacion = "Sin cobertura para dependientes";
        recomendacion = "Tienes dependientes económicos sin seguro de vida. Esto representa un riesgo crítico. Contrata cobertura de forma urgente.";
      }
    } else if (dep === false) {
      score = 90;
      valor_clave = "Sin dependientes";
    }
    areas.push({ area: "Dependientes", key: "dependientes", score, urgencia: toUrgencia(score), situacion, recomendacion, icono: "👨‍👩‍👧", valor_clave });
  }

  // ── 7. Retiro ─────────────────────────────────────────────────
  {
    const grado = input.motorC?.grado_avance ?? 0;
    const deficit = input.motorC?.deficit_mensual ?? 0;
    const score = Math.round(Math.min(100, grado * 100));
    let situacion = "Sin proyección de retiro";
    let recomendacion = "Completa los datos de retiro y patrimonio financiero para generar tu proyección.";
    const valor_clave = `${score}% del objetivo`;
    if (input.motorC) {
      if (grado >= 1) { situacion = "Meta de retiro alcanzada"; recomendacion = "¡Felicidades! Tu patrimonio cubre tu meta de retiro. Mantén la estrategia y considera adelantar la fecha de retiro o aumentar la mensualidad deseada."; }
      else if (grado >= 0.7) { situacion = "En buen camino"; recomendacion = "Estás cerca de tu meta. Aporta adicionalmente para cerrar la brecha, especialmente en PPR (deducible de impuestos)."; }
      else if (grado >= 0.4) { situacion = "Insuficiente para meta deseada"; recomendacion = "Aporta plan de pensiones privado de manera urgente. Considera aumentar ahorro mensual o retrasar la edad de retiro."; }
      else { situacion = "Retiro en riesgo"; recomendacion = "Brecha crítica. Incrementa ahorro mensual, considera PPR deducible, y evalúa retrasar la edad de retiro para dar más tiempo de acumulación."; }
      if (deficit < 0) recomendacion += ` Déficit mensual estimado: ${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Math.abs(deficit))}.`;
    }
    areas.push({ area: "Retiro", key: "retiro", score, urgencia: toUrgencia(score), situacion, recomendacion, icono: "🎯", valor_clave });
  }

  // ── 8. Sucesión ───────────────────────────────────────────────
  {
    const noFin = input.motorE?.noFinanciero ?? 0;
    const negocio = input.patrimonio?.negocio ?? 0;
    const herencia = input.patrimonio?.herencia ?? 0;
    const patrimonioNeto = input.motorE?.patrimonio_neto ?? 0;
    let score = 50;
    let situacion = "Sin patrimonio complejo";
    let recomendacion = "Registra tu patrimonio completo para evaluar necesidades de planeación sucesoria.";
    let valor_clave = "—";
    if (input.motorE) {
      valor_clave = patrimonioNeto > 0 ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(patrimonioNeto) : "—";
      if (herencia > 0 && noFin > 0) {
        score = 85;
        situacion = "Bienes inmuebles y empresa";
        recomendacion = "Has previsto herencia. Complementa con un fideicomiso o testamento para proteger la transmisión de bienes inmuebles y empresa con eficiencia fiscal.";
      } else if (noFin > 0 || negocio > 0) {
        score = 55;
        situacion = "Activos sin planeación sucesoria";
        recomendacion = "Tienes activos importantes que requieren un plan de sucesión. Considera testamento y fideicomiso para evitar costos legales elevados a tus herederos.";
      } else if (patrimonioNeto > 500000) {
        score = 60;
        situacion = "Patrimonio sin plan sucesorio";
        recomendacion = "Con este nivel de patrimonio es recomendable establecer un testamento actualizado para facilitar la transmisión ordenada.";
      } else {
        score = 65;
        situacion = "Patrimonio en construcción";
        recomendacion = "Al ir acumulando patrimonio, considera elaborar un testamento básico para proteger a tus beneficiarios.";
      }
    }
    areas.push({ area: "Sucesión", key: "sucesion", score, urgencia: toUrgencia(score), situacion, recomendacion, icono: "📜", valor_clave });
  }

  // ── Weighted total ────────────────────────────────────────────
  const weights: Record<string, number> = {
    liquidez: 15, riqueza: 15, inversion: 15, inmuebles: 10,
    seguros: 10, dependientes: 10, retiro: 20, sucesion: 5,
  };
  const score_total = Math.round(
    areas.reduce((sum, a) => sum + a.score * (weights[a.key] ?? 10), 0) / 100
  );

  return { areas, score_total };
}
