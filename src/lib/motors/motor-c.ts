import { PARAMS } from "../constants";

export interface MotorCInput {
  patrimonio_financiero_total: number;
  saldo_esquemas: number;
  ley_73: number | null;
  rentas: number;
  edad: number;
  edad_retiro: number;
  edad_defuncion: number;
  mensualidad_deseada: number;
  tasa_real_anual?: number;
}

export interface MotorCOutput {
  saldo_inicio_jubilacion: number;
  meses_acumulacion: number;
  meses_jubilacion: number;
  mensualidad_posible: number;
  pension_total_mensual: number;
  grado_avance: number;
  deficit_mensual: number;
  aportacion_necesaria: number | null;
  curva: Array<{ mes: number; edad: number; saldo: number }>;
  fuentes_ingreso: { rentas: number; pension: number; patrimonio: number };
}

export function calcularMotorC(input: MotorCInput): MotorCOutput {
  const tasa_anual = input.tasa_real_anual ?? PARAMS.TASA_REAL_ANUAL;
  const tasa_mensual = tasa_anual / 12;
  const meses_acumulacion = (input.edad_retiro - input.edad) * 12;
  const meses_jubilacion = (input.edad_defuncion - input.edad_retiro) * 12;

  const saldo_inicio_jubilacion =
    input.patrimonio_financiero_total *
    Math.pow(1 + tasa_mensual, meses_acumulacion);

  let mensualidad_posible: number;
  if (tasa_mensual > 0) {
    mensualidad_posible =
      (saldo_inicio_jubilacion * tasa_mensual) /
      (1 - Math.pow(1 + tasa_mensual, -meses_jubilacion));
  } else {
    mensualidad_posible = saldo_inicio_jubilacion / meses_jubilacion;
  }

  // Mensualidad de esquemas (AFORE, PPR, etc.) al retiro (Excel: Mensualidad Afore + Voluntario)
  const saldo_esquemas_al_retiro =
    input.saldo_esquemas * Math.pow(1 + tasa_mensual, meses_acumulacion);
  let mensualidad_esquemas = 0;
  if (saldo_esquemas_al_retiro > 0 && meses_jubilacion > 0) {
    if (tasa_mensual > 0) {
      mensualidad_esquemas =
        (saldo_esquemas_al_retiro * tasa_mensual) /
        (1 - Math.pow(1 + tasa_mensual, -meses_jubilacion));
    } else {
      mensualidad_esquemas = saldo_esquemas_al_retiro / meses_jubilacion;
    }
  }

  const pension_total_mensual =
    (input.ley_73 || 0) + input.rentas + mensualidad_esquemas;

  const total_mensual = pension_total_mensual + mensualidad_posible;
  const grado_avance =
    input.mensualidad_deseada > 0
      ? total_mensual / input.mensualidad_deseada
      : 1;

  const deficit_mensual = input.mensualidad_deseada - total_mensual;

  const curva: Array<{ mes: number; edad: number; saldo: number }> = [];
  let saldo_actual = saldo_inicio_jubilacion;

  for (let mes = 0; mes <= meses_jubilacion; mes++) {
    if (mes > 0) {
      const interes = saldo_actual * tasa_mensual;
      saldo_actual = saldo_actual + interes - mensualidad_posible;
      saldo_actual = Math.max(saldo_actual, 0);
    }
    if (mes % 12 === 0 || mes === meses_jubilacion) {
      curva.push({
        mes,
        edad: input.edad_retiro + mes / 12,
        saldo: Math.round(saldo_actual * 100) / 100,
      });
    }
  }

  return {
    saldo_inicio_jubilacion,
    meses_acumulacion,
    meses_jubilacion,
    mensualidad_posible,
    pension_total_mensual,
    grado_avance,
    deficit_mensual,
    aportacion_necesaria: null,
    curva,
    fuentes_ingreso: {
      rentas: input.rentas,
      pension: (input.ley_73 || 0) + mensualidad_esquemas,
      patrimonio: mensualidad_posible,
    },
  };
}
