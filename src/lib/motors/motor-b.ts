import { BENCHMARK_RIQUEZA, NIVELES } from "../constants";

export interface MotorBInput {
  liquidez: number;
  inversiones: number;
  dotales: number;
  afore: number;
  ppr: number;
  plan_privado: number;
  seguros_retiro: number;
  edad: number;
  gastos_basicos: number;
  obligaciones: number;
  creditos: number;
}

export type NivelRiqueza = (typeof NIVELES)[number] | "por_debajo";

export interface MotorBOutput {
  patrimonio_financiero_total: number;   // todas las cubetas (para Motor E)
  patrimonio_acumulacion_libre: number;  // inversiones + dotales (para Motor C y F)
  patrimonio_esquemas: number;           // afore + ppr + plan_privado + seguros_retiro
  gasto_anual: number;
  ratio: number;
  nivel_riqueza: NivelRiqueza;
  etiqueta_nivel: string;
  benchmark_para_edad: number;
  longevidad_recursos: number;
  meses_cubiertos: number;
}

function etiquetaNivelRiqueza(ratio: number): string {
  if (ratio < 1) return "POR DEBAJO DEL PROMEDIO";
  if (ratio < 3) return "POR ARRIBA DEL PROMEDIO";
  if (ratio < 5) return "RICO";
  return "ACAUDALADO";
}

export function calcularMotorB(input: MotorBInput): MotorBOutput {
  // ─── FIX-2: Separar cubetas de activos ──────────────────────────────────
  // Cubeta A — Acumulación libre: inversiones + dotales  (base del ratio Excel C47)
  // Cubeta B — Esquemas pensión: afore + ppr + plan_privado + seguros_retiro
  // Total financiero: todas las cubetas (para Motor E / balance)
  const patrimonio_acumulacion_libre = input.inversiones + input.dotales;
  const patrimonio_esquemas =
    input.afore + input.ppr + input.plan_privado + input.seguros_retiro;
  const patrimonio_financiero_total =
    input.liquidez +
    input.inversiones +
    input.dotales +
    input.afore +
    input.ppr +
    input.plan_privado +
    input.seguros_retiro;

  const gasto_mensual =
    input.gastos_basicos + input.obligaciones + input.creditos;
  const gasto_anual = gasto_mensual * 12;

  // ─── FIX-2: Ratio usa solo acumulación libre (no AFORE ni liquidez) ─────
  // Verif. Juan Pérez: (2M + 100K) / (60K × 12) = 2.9167 ✓
  const ratio = gasto_anual > 0 ? patrimonio_acumulacion_libre / gasto_anual : 0;

  const meses_cubiertos =
    input.gastos_basicos > 0 ? input.liquidez / input.gastos_basicos : 0;

  let row = BENCHMARK_RIQUEZA[BENCHMARK_RIQUEZA.length - 1] as unknown as number[];
  for (let i = BENCHMARK_RIQUEZA.length - 1; i >= 0; i--) {
    if (input.edad >= BENCHMARK_RIQUEZA[i][0]) {
      row = BENCHMARK_RIQUEZA[i] as unknown as number[];
      break;
    }
  }

  const benchmark_para_edad = row[1];

  // ─── FIX-7: Edge case — valor por debajo del umbral mínimo ──────────────
  let nivel_riqueza: NivelRiqueza = "por_debajo";
  for (let i = NIVELES.length - 1; i >= 0; i--) {
    if (ratio >= row[i + 1]) {
      nivel_riqueza = NIVELES[i];
      break;
    }
  }

  // ADD-4: Longevidad basada en acumulación libre (Excel G27)
  // Verif. Juan Pérez: 50 + 2,100,000/(60,000×12) = 52.92 ✓
  const longevidad_recursos =
    gasto_anual > 0
      ? input.edad + patrimonio_acumulacion_libre / gasto_anual
      : input.edad;

  return {
    patrimonio_financiero_total,
    patrimonio_acumulacion_libre,
    patrimonio_esquemas,
    gasto_anual,
    ratio: Math.round(ratio * 10000) / 10000,
    nivel_riqueza,
    etiqueta_nivel: etiquetaNivelRiqueza(ratio),
    benchmark_para_edad,
    longevidad_recursos: Math.round(longevidad_recursos * 100) / 100,
    meses_cubiertos,
  };
}
