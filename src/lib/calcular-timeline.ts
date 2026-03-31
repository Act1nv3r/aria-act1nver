import { PARAMS } from "./constants";

export interface EventoVida {
  edad: number;
  monto: number;
  label: string;
  tipo: "positivo" | "negativo";
}

export interface TimelinePoint {
  edad: number;
  saldo: number;
  fase: "acumulacion" | "retiro";
  evento?: EventoVida;
  ingresoRetiro?: number;
}

export interface TimelineInput {
  edadActual: number;
  edadRetiro: number;
  edadDefuncion: number;
  patrimonioActual: number;
  ahorroMensual: number;
  tasaReal?: number;
  pensionMensual: number;
  rentasMensuales: number;
  mensualidadDeseada: number;
  eventos?: EventoVida[];
}

export interface TimelineOutput {
  puntos: TimelinePoint[];
  pico: number;
  edadPico: number;
  legado: number;
  edadAgotamiento: number | null;
  gradoAvance: number;
  mensualidadPosible: number;
  deficit: number;
  saldoRetiro: number;
}

export function calcularTimeline(input: TimelineInput): TimelineOutput {
  const tasa = (input.tasaReal ?? PARAMS.TASA_REAL_ANUAL) / 12;
  const eventos = input.eventos ?? [];

  const puntos: TimelinePoint[] = [];
  let saldo = input.patrimonioActual;
  let pico = saldo;
  let edadPico = input.edadActual;
  let saldoRetiro = 0;
  let edadAgotamiento: number | null = null;

  const totalMeses = Math.round((input.edadDefuncion - input.edadActual) * 12);

  for (let mes = 0; mes <= totalMeses; mes++) {
    const edadExacta = input.edadActual + mes / 12;
    const edadAnno = Math.round(edadExacta * 100) / 100;
    const esRetiro = edadExacta >= input.edadRetiro;

    if (mes > 0) {
      const interes = saldo * tasa;
      if (!esRetiro) {
        saldo = saldo + interes + input.ahorroMensual;
      } else {
        const gastoNeto = Math.max(
          input.mensualidadDeseada - input.pensionMensual - input.rentasMensuales,
          0
        );
        saldo = saldo + interes - gastoNeto;
      }
    }

    // Apply events at matching age (integer check)
    for (const ev of eventos) {
      if (Math.abs(edadExacta - ev.edad) < 1 / 24) {
        saldo += ev.monto;
      }
    }

    if (saldo < 0 && edadAgotamiento === null) {
      edadAgotamiento = edadAnno;
    }
    saldo = Math.max(saldo, 0);

    if (saldo > pico) {
      pico = saldo;
      edadPico = edadAnno;
    }

    // Capture at retirement boundary
    if (mes > 0 && Math.abs(edadExacta - input.edadRetiro) < 1 / 24) {
      saldoRetiro = saldo;
    }

    // Store one point per year + event points
    const isYearBoundary = mes % 12 === 0;
    const isEvent = eventos.some(
      (ev) => Math.abs(edadExacta - ev.edad) < 1 / 24
    );

    if (isYearBoundary || isEvent || mes === totalMeses) {
      const matchedEvento = eventos.find(
        (ev) => Math.abs(edadExacta - ev.edad) < 1 / 24
      );

      const ingresoRetiro = esRetiro
        ? input.pensionMensual + input.rentasMensuales
        : undefined;

      puntos.push({
        edad: Math.round(edadExacta),
        saldo: Math.round(saldo),
        fase: esRetiro ? "retiro" : "acumulacion",
        evento: matchedEvento,
        ingresoRetiro: ingresoRetiro ? Math.round(ingresoRetiro * 12) : undefined,
      });
    }
  }

  if (saldoRetiro === 0 && puntos.length > 0) {
    const retiroPt = puntos.find((p) => p.edad >= input.edadRetiro);
    saldoRetiro = retiroPt?.saldo ?? pico;
  }

  const mesesJub = (input.edadDefuncion - input.edadRetiro) * 12;
  let mensualidadPosible: number;
  if (tasa > 0 && mesesJub > 0) {
    mensualidadPosible =
      (saldoRetiro * tasa) / (1 - Math.pow(1 + tasa, -mesesJub));
  } else {
    mensualidadPosible = mesesJub > 0 ? saldoRetiro / mesesJub : 0;
  }

  const totalMensual =
    mensualidadPosible + input.pensionMensual + input.rentasMensuales;
  const gradoAvance =
    input.mensualidadDeseada > 0 ? totalMensual / input.mensualidadDeseada : 1;
  const deficit = input.mensualidadDeseada - totalMensual;

  const legado = puntos.length > 0 ? puntos[puntos.length - 1].saldo : 0;

  return {
    puntos,
    pico,
    edadPico,
    legado,
    edadAgotamiento,
    gradoAvance,
    mensualidadPosible,
    deficit,
    saldoRetiro,
  };
}
