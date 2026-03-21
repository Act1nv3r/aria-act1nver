import { PARAMS } from "../constants";

export interface MotorAInput {
  ahorro: number;
  rentas: number;
  otros: number;
  gastos_basicos: number;
  obligaciones: number;
  creditos: number;
  liquidez?: number;
}

export interface MotorAOutput {
  ingresos_totales: number;
  gastos_totales: number;
  distribucion: {
    obligaciones_pct: number;
    gastos_pct: number;
    ahorro_pct: number;
  };
  benchmark_reserva: number;
  meses_cubiertos: number | null;
  resultado_reserva: "Cubierta" | "Insuficiente" | "Pendiente";
  remanente: number;
}

export function calcularMotorA(input: MotorAInput): MotorAOutput {
  const ingresos_totales = input.ahorro + input.rentas + input.otros;
  const gastos_totales =
    input.gastos_basicos + input.obligaciones + input.creditos;

  const distribucion = {
    obligaciones_pct:
      ingresos_totales > 0 ? input.obligaciones / ingresos_totales : 0,
    gastos_pct:
      ingresos_totales > 0 ? input.gastos_basicos / ingresos_totales : 0,
    ahorro_pct: ingresos_totales > 0 ? input.ahorro / ingresos_totales : 0,
  };

  const benchmark_reserva =
    PARAMS.BENCHMARK_RESERVA_MESES * input.gastos_basicos;

  let meses_cubiertos: number | null = null;
  if (
    input.liquidez !== undefined &&
    input.gastos_basicos > 0
  ) {
    meses_cubiertos = input.liquidez / input.gastos_basicos;
  }

  let resultado_reserva: "Cubierta" | "Insuficiente" | "Pendiente" = "Pendiente";
  if (meses_cubiertos !== null) {
    resultado_reserva = meses_cubiertos >= 3 ? "Cubierta" : "Insuficiente";
  }

  return {
    ingresos_totales,
    gastos_totales,
    distribucion,
    benchmark_reserva,
    meses_cubiertos,
    resultado_reserva,
    remanente: input.ahorro,
  };
}
