/**
 * Motor F — Recomendaciones de protección patrimonial.
 *
 * FIX-5: Suma asegurada vida calculada según Excel:
 *   nivel_riqueza_ratio = (inversiones + dotales) / (gastos_mensuales × 12)
 *   cobertura = MAX((3 − nivel_riqueza_ratio) × dependientes × flag_<65, 0)
 *   suma_asegurada = cobertura × gastos_mensuales × 12
 *
 * FIX-5b: Seguro hogar usa cap rate cuando hay rentas disponibles:
 *   seguro_hogar = rentas_mensuales × 12 / CAP_RATE (= rentas × 240 con 5%)
 */

import { PARAMS } from "../constants";

export interface MotorFInput {
  // ─── Cobertura vida ──────────────────────────────────────────────────────
  seguro_vida: boolean;
  dependientes: number;          // número de dependientes (antes era boolean)
  inversiones: number;           // para calcular nivel_riqueza_ratio
  dotales: number;
  gastos_mensuales: number;      // gasto mensual total
  edad: number;
  // ─── Cobertura hogar ─────────────────────────────────────────────────────
  propiedades_aseguradas: boolean | null;
  inmuebles_total: number;
  rentas_mensuales: number;      // ingresos por renta → estimar valor vía cap rate
  // ─── Cobertura salud ─────────────────────────────────────────────────────
  sgmm: boolean;
}

export interface MotorFOutput {
  recomendaciones: string[];
  suma_asegurada_vida: number;
  costo_prima_vida: number;
  seguro_hogar_sugerido: number;
  costo_hogar_anual: number;
  sgmm_estimado: number;
}

export function calcularMotorF(input: MotorFInput): MotorFOutput {
  const recomendaciones: string[] = [];

  // ─── Seguro de Vida (FIX-5) ───────────────────────────────────────────────
  let suma_asegurada_vida = 0;
  let costo_prima_vida    = 0;

  if (!input.seguro_vida && input.dependientes > 0) {
    const gasto_anual = input.gastos_mensuales * 12;

    // Nivel de riqueza numérico (mismo denominador que Motor B)
    const nivel_riqueza_ratio =
      gasto_anual > 0 ? (input.inversiones + input.dotales) / gasto_anual : 0;

    const flag_menor_65 = input.edad < 65 ? 1 : 0;

    // Multiplicador: MAX((3 − NR) × dep × flag, 0)
    const cobertura = Math.max(
      (3 - nivel_riqueza_ratio) * input.dependientes * flag_menor_65,
      0
    );

    suma_asegurada_vida = cobertura * gasto_anual;
    costo_prima_vida =
      (suma_asegurada_vida / 1_000_000) * PARAMS.COSTO_SEGURO_POR_MILLON;

    if (suma_asegurada_vida > 0) {
      recomendaciones.push(
        `Seguro de vida recomendado: ${new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
          maximumFractionDigits: 0,
        }).format(suma_asegurada_vida)} (cobertura ×${cobertura.toFixed(1)} del gasto anual)`
      );
    }
  }

  // ─── Seguro de Hogar (FIX-5b) ─────────────────────────────────────────────
  let seguro_hogar_sugerido = 0;
  let costo_hogar_anual     = 0;

  if (input.inmuebles_total > 0 && !input.propiedades_aseguradas) {
    // Cap rate si hay rentas; valor declarado si no
    if (input.rentas_mensuales > 0) {
      seguro_hogar_sugerido = (input.rentas_mensuales * 12) / PARAMS.CAP_RATE;
    } else {
      seguro_hogar_sugerido = input.inmuebles_total;
    }
    costo_hogar_anual = seguro_hogar_sugerido * 0.003;
    recomendaciones.push(
      `Asegura tus propiedades por ${new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
      }).format(seguro_hogar_sugerido)}`
    );
  }

  // ─── SGMM ─────────────────────────────────────────────────────────────────
  let sgmm_estimado = 0;
  if (!input.sgmm) {
    sgmm_estimado = input.edad >= 50 ? 30_000 : 15_000;
    recomendaciones.push("SGMM recomendado: $15,000–$30,000/año según edad");
  }

  return {
    recomendaciones,
    suma_asegurada_vida: Math.round(suma_asegurada_vida * 100) / 100,
    costo_prima_vida:    Math.round(costo_prima_vida * 100) / 100,
    seguro_hogar_sugerido: Math.round(seguro_hogar_sugerido * 100) / 100,
    costo_hogar_anual:   Math.round(costo_hogar_anual * 100) / 100,
    sgmm_estimado,
  };
}
