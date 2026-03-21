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
  noFinanciero: number;
  indice_solvencia: number;
  clasificacion_solvencia: string;
  potencial_apalancamiento: number;
}

export function calcularMotorE(input: MotorEInput): MotorEOutput {
  const financiero =
    input.liquidez +
    input.inversiones +
    input.dotales +
    input.afore +
    input.ppr +
    input.plan_privado +
    input.seguros_retiro;

  const noFinanciero =
    input.casa +
    input.inmuebles_renta +
    input.tierra +
    input.negocio +
    input.herencia;

  const activos_total = financiero + noFinanciero;
  const pasivos_total =
    input.hipoteca + input.saldo_planes + input.compromisos;
  const patrimonio_neto = activos_total - pasivos_total;

  const indice_solvencia =
    activos_total > 0 ? 1 - pasivos_total / activos_total : 0;

  const ratio =
    activos_total > 0 ? pasivos_total / activos_total : 0;

  let clasificacion_solvencia = "Muy saludable";
  if (ratio > 0.5) clasificacion_solvencia = "Crítico";
  else if (ratio > 0.4) clasificacion_solvencia = "Elevado";
  else if (ratio > 0.3) clasificacion_solvencia = "Aceptable";
  else if (ratio > 0.1) clasificacion_solvencia = "Recomendable";

  const potencial_credito_liquidos =
    (input.liquidez + input.inversiones) * 0.6;
  const potencial_credito_inmuebles =
    (input.casa + input.inmuebles_renta + input.tierra) * 0.5;
  const potencial_apalancamiento =
    potencial_credito_liquidos + potencial_credito_inmuebles;

  return {
    activos_total,
    pasivos_total,
    patrimonio_neto,
    financiero,
    noFinanciero,
    indice_solvencia,
    clasificacion_solvencia,
    potencial_apalancamiento,
  };
}
