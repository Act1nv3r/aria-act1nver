/**
 * Motor E — Patrimonio neto, solvencia y apalancamiento.
 *
 * FIX-3: Índice de Solvencia usa activos_base (excluye esquemas_retiro y herencia).
 *        Fórmula Excel: (activos_base - pasivos) / activos_base
 *        Escala: >70% Excelente, 50-70% Alto, 30-50% Suficiente, <30% Bajo
 *
 * FIX-4: Potencial de Apalancamiento = activos_base × 0.5 − pasivos_total
 */

export interface MotorEInput {
  liquidez: number;
  inversiones: number;
  dotales: number;
  afore: number;
  ppr: number;
  plan_privado: number;
  seguros_retiro: number;
  casa: number;
  inmuebles_renta: number;
  tierra: number;
  negocio: number;
  herencia: number;
  hipoteca: number;
  saldo_planes: number;
  compromisos: number;
}

export interface MotorEOutput {
  activos_total: number;
  pasivos_total: number;
  patrimonio_neto: number;
  financiero: number;
  no_financiero: number;
  activos_base: number;          // para referencia / auditoría
  esquemas_retiro: number;       // para referencia / auditoría
  indice_solvencia: number;
  clasificacion_solvencia: string;
  potencial_apalancamiento: number;
}

export function calcularMotorE(input: MotorEInput): MotorEOutput {
  // ─── Activos por cubeta ──────────────────────────────────────────────────
  // Financiero libre (base del índice de solvencia)
  const financiero_libre =
    input.liquidez + input.inversiones + input.dotales;

  // Esquemas de retiro (SE EXCLUYEN del índice de solvencia)
  const esquemas_retiro =
    input.afore + input.ppr + input.plan_privado + input.seguros_retiro;

  // Total financiero (para balance patrimonial)
  const financiero = financiero_libre + esquemas_retiro;

  // Activos no financieros sin herencia (SE INCLUYEN en índice de solvencia)
  const no_financiero_operativo =
    input.casa + input.inmuebles_renta + input.tierra + input.negocio;

  // Herencia SE EXCLUYE del índice de solvencia
  // Total no financiero (para balance patrimonial)
  const no_financiero = no_financiero_operativo + input.herencia;

  // Activos totales (para balance / patrimonio neto)
  const activos_total = financiero + no_financiero;

  // ─── Pasivos ─────────────────────────────────────────────────────────────
  const pasivos_total =
    input.hipoteca + input.saldo_planes + input.compromisos;

  // ─── Patrimonio neto ─────────────────────────────────────────────────────
  const patrimonio_neto = activos_total - pasivos_total;

  // ─── FIX-3: Índice de Solvencia (Excel) ─────────────────────────────────
  // activos_base = todos los activos EXCEPTO esquemas_retiro y herencia
  // Verif. Juan Pérez: activos_base = 2.3M + 2.7M = 5M (sin AFORE $1M, sin herencia)
  const activos_base = financiero_libre + no_financiero_operativo;

  const indice_solvencia =
    activos_base > 0 ? (activos_base - pasivos_total) / activos_base : 0;

  let clasificacion_solvencia: string;
  if (indice_solvencia > 0.7) {
    clasificacion_solvencia = "Excelente";
  } else if (indice_solvencia > 0.5) {
    clasificacion_solvencia = "Alto";
  } else if (indice_solvencia > 0.3) {
    clasificacion_solvencia = "Suficiente";
  } else {
    clasificacion_solvencia = "Bajo";
  }

  // ─── FIX-4: Potencial de Apalancamiento (Excel) ──────────────────────────
  // Excel: activos_disponibles × 0.5 − pasivos_total
  const potencial_apalancamiento = activos_base * 0.5 - pasivos_total;

  return {
    activos_total,
    pasivos_total,
    patrimonio_neto,
    financiero,
    no_financiero,
    activos_base,
    esquemas_retiro,
    indice_solvencia:         Math.round(indice_solvencia * 10000) / 10000,
    clasificacion_solvencia,
    potencial_apalancamiento: Math.round(potencial_apalancamiento * 100) / 100,
  };
}
