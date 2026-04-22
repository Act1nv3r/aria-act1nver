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
  // optional per-source breakdown for esquemas
  saldo_esquemas_pension?: number;    // AFORE portion
  saldo_esquemas_voluntarios?: number; // PPR + plan_privado + seguros_retiro
  ingresos_negocio?: number;          // monthly business income
}

export interface CurvaPunto {
  mes: number;
  edad: number;
  saldo: number;
  pension_mensual: number;      // ley_73 + AFORE annuity
  voluntarios_mensual: number;  // PPR/plan_privado annuity
  rentas_mensual: number;       // passive rental income
  negocio_mensual: number;      // business income
  patrimonio_retiro: number;    // withdrawal from financial patrimony
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
  curva: CurvaPunto[];
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

  // Annuity from pension schemes (AFORE/ley73) at retirement
  const saldo_pension = input.saldo_esquemas_pension ?? input.saldo_esquemas * 0.7;
  const saldo_voluntarios = input.saldo_esquemas_voluntarios ?? input.saldo_esquemas * 0.3;

  const saldo_pension_al_retiro = saldo_pension * Math.pow(1 + tasa_mensual, meses_acumulacion);
  const saldo_voluntarios_al_retiro = saldo_voluntarios * Math.pow(1 + tasa_mensual, meses_acumulacion);

  function annuity(saldo: number): number {
    if (saldo <= 0 || meses_jubilacion <= 0) return 0;
    if (tasa_mensual > 0) {
      return (saldo * tasa_mensual) / (1 - Math.pow(1 + tasa_mensual, -meses_jubilacion));
    }
    return saldo / meses_jubilacion;
  }

  const mensualidad_pension = annuity(saldo_pension_al_retiro);
  const mensualidad_voluntarios = annuity(saldo_voluntarios_al_retiro);
  const mensualidad_esquemas = mensualidad_pension + mensualidad_voluntarios;

  const pension_total_mensual =
    (input.ley_73 || 0) + input.rentas + mensualidad_esquemas;

  const total_mensual = pension_total_mensual + mensualidad_posible;
  const grado_avance =
    input.mensualidad_deseada > 0
      ? total_mensual / input.mensualidad_deseada
      : 1;

  const deficit_mensual = input.mensualidad_deseada - total_mensual;

  // Calculate aportacion_necesaria via PMT if there's a deficit
  let aportacion_necesaria: number | null = null;
  if (deficit_mensual > 0 && meses_acumulacion > 0 && tasa_mensual > 0) {
    // Target additional saldo needed at retirement to cover deficit
    const target_saldo_adicional =
      (deficit_mensual * (1 - Math.pow(1 + tasa_mensual, -meses_jubilacion))) / tasa_mensual;
    // PMT to accumulate that saldo
    aportacion_necesaria =
      (target_saldo_adicional * tasa_mensual) /
      (Math.pow(1 + tasa_mensual, meses_acumulacion) - 1);
  }

  const pension_ley73_mensual = input.ley_73 || 0;

  const curva: CurvaPunto[] = [];
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
        pension_mensual: pension_ley73_mensual + mensualidad_pension,
        voluntarios_mensual: mensualidad_voluntarios,
        rentas_mensual: input.rentas,
        negocio_mensual: input.ingresos_negocio ?? 0,
        patrimonio_retiro: saldo_actual > 0 ? mensualidad_posible : 0,
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
    aportacion_necesaria,
    curva,
    fuentes_ingreso: {
      rentas: input.rentas,
      pension: (input.ley_73 || 0) + mensualidad_esquemas,
      patrimonio: mensualidad_posible,
    },
  };
}

export function calcularCapitalHumano(
  ingresos_mensuales: number,
  edad: number,
  edad_retiro: number,
  tasa_anual = 0.065
): number {
  const n = (edad_retiro - edad) * 12;
  if (n <= 0 || ingresos_mensuales <= 0) return 0;
  const r = tasa_anual / 12;
  return (ingresos_mensuales * (1 - Math.pow(1 + r, -n))) / r;
}
