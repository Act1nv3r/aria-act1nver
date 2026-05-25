/**
 * Motor E — Patrimonio neto, solvencia y apalancamiento.
 *
 * FIX-3: Índice de Solvencia usa activos_base (excluye esquemas_retiro y herencia).
 *        Fórmula Excel: (activos_base - pasivos) / activos_base
 *        Escala: >70% Excelente, 50-70% Alto, 30-50% Suficiente, <30% Bajo
 *
 * FIX-4: Potencial de Apalancamiento = activos_base × 0.5 − pasivos_total
 *
 * FIX-5: F11/F12 — Desglose del excedente de apalancamiento por tipo de activo
 *        Paso 1: fin_base = liquidez + inversiones (sin dotales, sin esquemas retiro)
 *                nofin_base = casa + inmuebles_renta + tierra (sin negocio, sin herencia)
 *                totales_f = fin_base + nofin_base
 *        Paso 2: pct_fin = fin_base / totales_f
 *                pct_nofin = nofin_base / totales_f
 *        Paso 3: potencial_fin   = pct_fin   × excedente_apalancamiento  (F11)
 *                potencial_nofin = pct_nofin × excedente_apalancamiento  (F12)
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
  activos_base: number;             // para referencia / auditoría
  esquemas_retiro: number;          // para referencia / auditoría
  indice_solvencia: number;
  clasificacion_solvencia: string;
  // Estructura de apalancamiento (Excel "Potencial del Balance")
  apalancamiento_actual: number;          // lo que ya se debe (= pasivos_total)
  apalancamiento_potencial_bruto: number; // capacidad total = activos_base × 0.5
  excedente_apalancamiento: number;       // max(potencial_bruto − pasivos_total, 0)
  // F11/F12: desglose del excedente por proporción de activos
  potencial_fin: number;                  // F11: excedente × (fin_base / totales_f)
  potencial_nofin: number;               // F12: excedente × (nofin_base / totales_f)
  pct_fin: number;                        // proporción activos financieros (liquidez+inv)
  pct_nofin: number;                      // proporción activos no financieros (casa+inmuebles+tierra)
  potencial_apalancamiento: number;       // @legacy: = excedente_apalancamiento (sin cambio en consumidores)
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

  // ─── FIX-4: Estructura de Apalancamiento ────────────────────────────────
  const apalancamiento_potencial_bruto = activos_base * 0.5;
  const excedente_apalancamiento = Math.max(0, apalancamiento_potencial_bruto - pasivos_total);

  // ─── FIX-5: F11/F12 — Desglose por proporción de activos (Excel) ────────
  // fin_base   = liquidez + inversiones (excluye dotales, esquemas retiro)
  // nofin_base = casa + inmuebles_renta + tierra (excluye negocio, herencia)
  // totales_f  = fin_base + nofin_base
  const fin_base   = input.liquidez + input.inversiones;
  const nofin_base = input.casa + input.inmuebles_renta + input.tierra;
  const totales_f  = fin_base + nofin_base;

  const pct_fin   = totales_f > 0 ? fin_base   / totales_f : 0;
  const pct_nofin = totales_f > 0 ? nofin_base / totales_f : 0;

  const potencial_fin   = pct_fin   * excedente_apalancamiento;
  const potencial_nofin = pct_nofin * excedente_apalancamiento;

  // @legacy — mantener para no romper consumidores existentes
  const potencial_apalancamiento = excedente_apalancamiento;

  return {
    activos_total,
    pasivos_total,
    patrimonio_neto,
    financiero,
    no_financiero,
    activos_base,
    esquemas_retiro,
    indice_solvencia:               Math.round(indice_solvencia * 10000) / 10000,
    clasificacion_solvencia,
    apalancamiento_actual:           Math.round(pasivos_total * 100) / 100,
    apalancamiento_potencial_bruto: Math.round(apalancamiento_potencial_bruto * 100) / 100,
    excedente_apalancamiento:       Math.round(excedente_apalancamiento * 100) / 100,
    potencial_fin:                  Math.round(potencial_fin * 100) / 100,
    potencial_nofin:                Math.round(potencial_nofin * 100) / 100,
    pct_fin:                        Math.round(pct_fin * 10000) / 10000,
    pct_nofin:                      Math.round(pct_nofin * 10000) / 10000,
    potencial_apalancamiento:       Math.round(potencial_apalancamiento * 100) / 100,
  };
}
