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

export interface MotorBOutput {
  patrimonio_financiero_total: number;
  gasto_anual: number;
  ratio: number;
  nivel_riqueza: (typeof NIVELES)[number];
  benchmark_para_edad: number;
  longevidad_recursos: number;
  meses_cubiertos: number;
}

export function calcularMotorB(input: MotorBInput): MotorBOutput {
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

  const ratio =
    gasto_anual > 0 ? patrimonio_financiero_total / gasto_anual : 0;

  const meses_cubiertos =
    input.gastos_basicos > 0 ? input.liquidez / input.gastos_basicos : 0;

  let row = BENCHMARK_RIQUEZA[BENCHMARK_RIQUEZA.length - 1];
  for (let i = BENCHMARK_RIQUEZA.length - 1; i >= 0; i--) {
    if (input.edad >= BENCHMARK_RIQUEZA[i][0]) {
      row = BENCHMARK_RIQUEZA[i];
      break;
    }
  }

  const benchmark_para_edad = row[1];
  let nivel_riqueza: (typeof NIVELES)[number] = "suficiente";
  for (let i = NIVELES.length - 1; i >= 0; i--) {
    if (ratio >= row[i + 1]) {
      nivel_riqueza = NIVELES[i];
      break;
    }
  }

  const longevidad_recursos =
    gasto_mensual > 0
      ? input.edad + patrimonio_financiero_total / gasto_mensual / 12
      : input.edad;

  return {
    patrimonio_financiero_total,
    gasto_anual,
    ratio,
    nivel_riqueza,
    benchmark_para_edad,
    longevidad_recursos,
    meses_cubiertos,
  };
}
