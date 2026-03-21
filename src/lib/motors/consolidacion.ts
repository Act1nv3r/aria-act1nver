export type OwnershipValue = "titular" | "pareja" | "compartido";

interface FlujoMensual {
  ahorro: number;
  rentas: number;
  otros: number;
  gastos_basicos: number;
  obligaciones: number;
  creditos: number;
}

interface Patrimonio {
  liquidez: number;
  inversiones: number;
  dotales: number;
  afore: number;
  ppr: number;
  plan_privado: number;
  seguros_retiro: number;
  ley_73: number | null;
  casa: number;
  inmuebles_renta: number;
  tierra: number;
  negocio: number;
  herencia: number;
  hipoteca: number;
  saldo_planes: number;
  compromisos: number;
}

interface Retiro {
  edad_retiro: number;
  mensualidad_deseada: number;
  edad_defuncion: number;
}

interface Objetivo {
  nombre: string;
  monto: number;
  plazo: number;
}

interface Objetivos {
  aportacion_inicial: number;
  aportacion_mensual: number;
  lista: Objetivo[];
}

interface Proteccion {
  seguro_vida: boolean;
  propiedades_aseguradas: boolean | null;
  sgmm: boolean;
}

export interface HogarConsolidado {
  flujo: FlujoMensual;
  patrimonio: Patrimonio;
  retiro: { edad_retiro: number; mensualidad_deseada: number; edad_defuncion: number };
  objetivos: Objetivos;
  proteccion: Proteccion;
  dependencia_financiera: {
    titular_pct: number;
    pareja_pct: number;
    dependiente: "titular" | "pareja" | "equilibrado";
  };
}

function getOwnership(
  ownership: Record<string, OwnershipValue>,
  asset: string
): OwnershipValue {
  return ownership[asset] ?? "titular";
}

export function consolidar(
  titular: {
    flujo: FlujoMensual;
    patrimonio: Patrimonio;
    retiro: Retiro;
    objetivos: Objetivos;
    proteccion: Proteccion;
  },
  pareja: {
    flujo: FlujoMensual;
    patrimonio: Patrimonio;
    retiro: Retiro;
    objetivos: Objetivos;
    proteccion: Proteccion;
  },
  ownership: Record<string, OwnershipValue>
): HogarConsolidado {
  const ingresoTitular =
    titular.flujo.ahorro + titular.flujo.rentas + titular.flujo.otros;
  const ingresoPareja =
    pareja.flujo.ahorro + pareja.flujo.rentas + pareja.flujo.otros;
  const ingresoTotal = ingresoTitular + ingresoPareja;
  const titular_pct = ingresoTotal > 0 ? ingresoTitular / ingresoTotal : 0.5;
  const pareja_pct = ingresoTotal > 0 ? ingresoPareja / ingresoTotal : 0.5;
  const dependiente: "titular" | "pareja" | "equilibrado" =
    titular_pct > 0.6 ? "pareja" : pareja_pct > 0.6 ? "titular" : "equilibrado";

  const flujo: FlujoMensual = {
    ahorro: titular.flujo.ahorro + pareja.flujo.ahorro,
    rentas: titular.flujo.rentas + pareja.flujo.rentas,
    otros: titular.flujo.otros + pareja.flujo.otros,
    gastos_basicos: titular.flujo.gastos_basicos + pareja.flujo.gastos_basicos,
    obligaciones: titular.flujo.obligaciones + pareja.flujo.obligaciones,
    creditos: titular.flujo.creditos + pareja.flujo.creditos,
  };

  const patrimonioFinanciero =
    titular.patrimonio.liquidez +
    titular.patrimonio.inversiones +
    titular.patrimonio.dotales +
    pareja.patrimonio.liquidez +
    pareja.patrimonio.inversiones +
    pareja.patrimonio.dotales;

  const noFinancieroAssets = [
    "casa",
    "inmuebles_renta",
    "tierra",
    "negocio",
    "herencia",
  ] as const;
  let noFinancieroTotal = 0;
  for (const asset of noFinancieroAssets) {
    const own = getOwnership(ownership, asset);
    const tVal = (titular.patrimonio as unknown as Record<string, number>)[asset] ?? 0;
    const pVal = (pareja.patrimonio as unknown as Record<string, number>)[asset] ?? 0;
    if (own === "compartido") {
      noFinancieroTotal += Math.max(tVal, pVal);
    } else {
      noFinancieroTotal += own === "titular" ? tVal : pVal;
    }
  }

  const pasivosAssets = ["hipoteca", "saldo_planes", "compromisos"] as const;
  let pasivosTotal = 0;
  for (const asset of pasivosAssets) {
    const own = getOwnership(ownership, asset);
    const tVal = (titular.patrimonio as unknown as Record<string, number>)[asset] ?? 0;
    const pVal = (pareja.patrimonio as unknown as Record<string, number>)[asset] ?? 0;
    if (own === "compartido") {
      pasivosTotal += Math.max(tVal, pVal);
    } else {
      pasivosTotal += own === "titular" ? tVal : pVal;
    }
  }

  const patrimonio: Patrimonio = {
    liquidez: titular.patrimonio.liquidez + pareja.patrimonio.liquidez,
    inversiones: titular.patrimonio.inversiones + pareja.patrimonio.inversiones,
    dotales: titular.patrimonio.dotales + pareja.patrimonio.dotales,
    afore: titular.patrimonio.afore + pareja.patrimonio.afore,
    ppr: titular.patrimonio.ppr + pareja.patrimonio.ppr,
    plan_privado:
      titular.patrimonio.plan_privado + pareja.patrimonio.plan_privado,
    seguros_retiro:
      titular.patrimonio.seguros_retiro + pareja.patrimonio.seguros_retiro,
    ley_73:
      titular.patrimonio.ley_73 != null && pareja.patrimonio.ley_73 != null
        ? titular.patrimonio.ley_73 + pareja.patrimonio.ley_73
        : titular.patrimonio.ley_73 ?? pareja.patrimonio.ley_73,
    casa: 0,
    inmuebles_renta: 0,
    tierra: 0,
    negocio: 0,
    herencia: 0,
    hipoteca: 0,
    saldo_planes: 0,
    compromisos: 0,
  };

  const casaOwn = getOwnership(ownership, "casa");
  const casaT = titular.patrimonio.casa;
  const casaP = pareja.patrimonio.casa;
  patrimonio.casa =
    casaOwn === "compartido" ? Math.max(casaT, casaP) : casaOwn === "titular" ? casaT : casaP;

  const invRentaOwn = getOwnership(ownership, "inmuebles_renta");
  const invRentaT = titular.patrimonio.inmuebles_renta;
  const invRentaP = pareja.patrimonio.inmuebles_renta;
  patrimonio.inmuebles_renta =
    invRentaOwn === "compartido"
      ? Math.max(invRentaT, invRentaP)
      : invRentaOwn === "titular"
        ? invRentaT
        : invRentaP;

  const tierraOwn = getOwnership(ownership, "tierra");
  patrimonio.tierra =
    tierraOwn === "compartido"
      ? Math.max(titular.patrimonio.tierra, pareja.patrimonio.tierra)
      : tierraOwn === "titular"
        ? titular.patrimonio.tierra
        : pareja.patrimonio.tierra;

  const negOwn = getOwnership(ownership, "negocio");
  patrimonio.negocio =
    negOwn === "compartido"
      ? Math.max(titular.patrimonio.negocio, pareja.patrimonio.negocio)
      : negOwn === "titular"
        ? titular.patrimonio.negocio
        : pareja.patrimonio.negocio;

  const herOwn = getOwnership(ownership, "herencia");
  patrimonio.herencia =
    herOwn === "compartido"
      ? Math.max(titular.patrimonio.herencia, pareja.patrimonio.herencia)
      : herOwn === "titular"
        ? titular.patrimonio.herencia
        : pareja.patrimonio.herencia;

  const hipOwn = getOwnership(ownership, "hipoteca");
  patrimonio.hipoteca =
    hipOwn === "compartido"
      ? Math.max(titular.patrimonio.hipoteca, pareja.patrimonio.hipoteca)
      : hipOwn === "titular"
        ? titular.patrimonio.hipoteca
        : pareja.patrimonio.hipoteca;

  const saldoOwn = getOwnership(ownership, "saldo_planes");
  patrimonio.saldo_planes =
    saldoOwn === "compartido"
      ? Math.max(titular.patrimonio.saldo_planes, pareja.patrimonio.saldo_planes)
      : saldoOwn === "titular"
        ? titular.patrimonio.saldo_planes
        : pareja.patrimonio.saldo_planes;

  const compOwn = getOwnership(ownership, "compromisos");
  patrimonio.compromisos =
    compOwn === "compartido"
      ? Math.max(titular.patrimonio.compromisos, pareja.patrimonio.compromisos)
      : compOwn === "titular"
        ? titular.patrimonio.compromisos
        : pareja.patrimonio.compromisos;

  const retiroPromedio = {
    edad_retiro: Math.round((titular.retiro.edad_retiro + pareja.retiro.edad_retiro) / 2),
    mensualidad_deseada: titular.retiro.mensualidad_deseada + pareja.retiro.mensualidad_deseada,
    edad_defuncion: Math.max(titular.retiro.edad_defuncion, pareja.retiro.edad_defuncion),
  };

  const objetivos: Objetivos = {
    aportacion_inicial:
      titular.objetivos.aportacion_inicial + pareja.objetivos.aportacion_inicial,
    aportacion_mensual:
      titular.objetivos.aportacion_mensual + pareja.objetivos.aportacion_mensual,
    lista: [...titular.objetivos.lista, ...pareja.objetivos.lista].slice(0, 5),
  };

  const proteccion: Proteccion = {
    seguro_vida: titular.proteccion.seguro_vida || pareja.proteccion.seguro_vida,
    propiedades_aseguradas:
      titular.proteccion.propiedades_aseguradas ?? pareja.proteccion.propiedades_aseguradas,
    sgmm: titular.proteccion.sgmm || pareja.proteccion.sgmm,
  };

  return {
    flujo,
    patrimonio,
    retiro: retiroPromedio,
    objetivos,
    proteccion,
    dependencia_financiera: {
      titular_pct,
      pareja_pct,
      dependiente,
    },
  };
}
