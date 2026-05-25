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
  activos_base: number;             // para referencia / auditoría
  esquemas_retiro: number;          // para referencia / auditoría
  indice_solvencia: number;
  clasificacion_solvencia: string;
  // Estructura de apalancamiento (Excel "Potencial del Balance")
  apalancamiento_actual: number;          // lo que ya se debe (= pasivos_total)
  apalancamiento_potencial_bruto: number; // capacidad total = activos_base × 0.5
  excedente_apalancamiento: number;       // max(potencial_bruto − pasivos_total, 0)
  potencial_fin: number;                  // F11: respaldado por activos financieros libres
  potencial_nofin: number;               // F12: respaldado por activos no financieros (inmuebles)
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

  // ─── Estructura de Apalancamiento (Excel "Potencial del Balance") ────────
  // apalancamiento_actual    = pasivos_total (lo que ya se debe hoy)
  // potencial_bruto          = activos_base × 0.5 (capacidad máxima de endeudamiento)
  // excedente                = max(potencial_bruto − pasivos_total, 0) — cuánto más puede endeudarse
  // F11: respaldo financiero = financiero_libre × 0.5 (créditos de inversión / prendarios)
  // F12: respaldo inmobiliario = no_financiero_operativo × 0.5 (hipotecas / crédito puente)
  const apalancamiento_potencial_bruto = activos_base * 0.5;
  const excedente_apalancamiento = Math.max(0, apalancamiento_potencial_bruto - pasivos_total);
  const potencial_fin    = financiero_libre * 0.5;
  const potencial_nofin  = no_financiero_operativo * 0.5;

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
    potencial_apalancamiento:       Math.round(potencial_apalancamiento * 100) / 100,
  };
}
