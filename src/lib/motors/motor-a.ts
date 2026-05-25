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
    gastos_pct: number;
    obligaciones_pct: number;
    creditos_pct: number;
    ahorro_pct: number;
  };
  benchmark_reserva: number;
  meses_cubiertos: number | null;
  resultado_reserva: "Excedida" | "Insuficiente" | "Pendiente";
  pendiente_reserva: number;
  meses_para_cubrir: number;
  remanente: number;
  // Desglose activo vs pasivo de la capacidad de ahorro (Excel fuente de verdad)
  // ingreso_disponible_pasivo = min(rentas + otros, ahorro)  — de cuánto ahorro viene de ingresos pasivos
  // ingreso_disponible_activo = ahorro − ingreso_disponible_pasivo — lo que viene de trabajo activo
  ingreso_disponible_pasivo: number;
  ingreso_disponible_activo: number;
}

export function calcularMotorA(input: MotorAInput): MotorAOutput {
  // ─── Ingresos Totales ───────────────────────────────────────────────────
  // Ingresos totales = gastos_basicos + obligaciones + créditos + ahorro mensual
  // Representa todo lo que el cliente percibe y distribuye cada mes.
  const ingresos_totales =
    input.gastos_basicos + input.obligaciones + input.creditos + input.ahorro;
  const gastos_totales =
    input.gastos_basicos + input.obligaciones + input.creditos;

  // Distribución coherente: los 4 componentes suman 100% del ingreso total
  const distribucion = {
    gastos_pct:       ingresos_totales > 0 ? input.gastos_basicos / ingresos_totales : 0,
    obligaciones_pct: ingresos_totales > 0 ? input.obligaciones   / ingresos_totales : 0,
    creditos_pct:     ingresos_totales > 0 ? input.creditos        / ingresos_totales : 0,
    ahorro_pct:       ingresos_totales > 0 ? input.ahorro          / ingresos_totales : 0,
  };

  // ─── Reserva de Emergencia ──────────────────────────────────────────────
  const benchmark_reserva = PARAMS.BENCHMARK_RESERVA_MESES * input.gastos_basicos;

  let meses_cubiertos: number | null = null;
  if (input.liquidez !== undefined && input.gastos_basicos > 0) {
    meses_cubiertos = input.liquidez / input.gastos_basicos;
  }

  let resultado_reserva: "Excedida" | "Insuficiente" | "Pendiente" = "Pendiente";
  if (meses_cubiertos !== null) {
    resultado_reserva = meses_cubiertos >= 3 ? "Excedida" : "Insuficiente";
  }

  // ─── FIX ADD-1: Remanente real para objetivos ───────────────────────────
  // Si hay déficit en reserva, parte del ahorro mensual se destina a cubrirlo.
  let pendiente_reserva = 0;
  let meses_para_cubrir = 0;
  if (meses_cubiertos !== null && meses_cubiertos < 3 && input.liquidez !== undefined) {
    pendiente_reserva = benchmark_reserva - (input.liquidez ?? 0);
    meses_para_cubrir = input.ahorro > 0 ? pendiente_reserva / input.ahorro : 0;
  }

  const remanente =
    meses_para_cubrir > 0
      ? Math.max(0, input.ahorro * (1 - Math.min(meses_para_cubrir / 12, 1)))
      : input.ahorro;

  // ─── Desglose ingreso disponible activo vs pasivo ────────────────────────
  // Ingreso pasivo disponible: de tu capacidad de ahorro, cuánto proviene de
  // fuentes pasivas (rentas + negocios). Tope: no puede superar el ahorro total.
  // Ingreso activo disponible: lo que resta, proveniente de tu trabajo activo.
  const ingreso_disponible_pasivo = Math.min(input.rentas + input.otros, input.ahorro);
  const ingreso_disponible_activo = Math.max(0, input.ahorro - ingreso_disponible_pasivo);

  return {
    ingresos_totales,
    gastos_totales,
    distribucion,
    benchmark_reserva,
    meses_cubiertos,
    resultado_reserva,
    pendiente_reserva,
    meses_para_cubrir: Math.round(meses_para_cubrir * 100) / 100,
    remanente,
    ingreso_disponible_pasivo: Math.round(ingreso_disponible_pasivo * 100) / 100,
    ingreso_disponible_activo: Math.round(ingreso_disponible_activo * 100) / 100,
  };
}
