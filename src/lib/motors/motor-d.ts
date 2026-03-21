import { PARAMS } from "../constants";

export interface ObjetivoInput {
  nombre: string;
  monto: number;
  plazo: number;
}

export interface MotorDInput {
  aportacion_inicial: number;
  aportacion_mensual: number;
  lista: ObjetivoInput[];
  patrimonio_financiero: number;
  edad: number;
  edad_retiro: number;
  edad_defuncion: number;
}

export interface ObjetivoResultado {
  nombre: string;
  monto: number;
  plazo: number;
  viable: boolean;
}

export interface MotorDOutput {
  resultados: ObjetivoResultado[];
  saldo_retiro: number;
  legado: number;
}

export function calcularMotorD(input: MotorDInput): MotorDOutput {
  const tasa_mensual = PARAMS.TASA_REAL_ANUAL / 12;
  const meses_acumulacion = (input.edad_retiro - input.edad) * 12;
  const meses_jubilacion = (input.edad_defuncion - input.edad_retiro) * 12;

  let saldo = input.aportacion_inicial;
  const resultados: ObjetivoResultado[] = [];

  const objetivosOrdenados = [...input.lista].sort((a, b) => a.plazo - b.plazo);
  let mesActual = 0;

  for (const obj of objetivosOrdenados) {
    const mesesObjetivo = obj.plazo * 12;
    while (mesActual < mesesObjetivo && mesActual < meses_acumulacion) {
      saldo = saldo + input.aportacion_mensual + saldo * tasa_mensual;
      mesActual++;
    }
    const viable = saldo >= obj.monto;
    if (viable) saldo -= obj.monto;
    resultados.push({
      nombre: obj.nombre,
      monto: obj.monto,
      plazo: obj.plazo,
      viable,
    });
  }

  while (mesActual < meses_acumulacion) {
    saldo = saldo + input.aportacion_mensual + saldo * tasa_mensual;
    mesActual++;
  }

  const saldo_retiro = saldo + input.patrimonio_financiero * Math.pow(1 + tasa_mensual, Math.max(0, meses_acumulacion - mesActual));
  const legado = saldo_retiro * Math.pow(1 + tasa_mensual, meses_jubilacion);

  return {
    resultados,
    saldo_retiro,
    legado: Math.max(0, legado),
  };
}
