import { PARAMS } from "../constants";

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface MotorCInput {
  // ─── Cubeta A: Acumulación libre (base de la curva de desacumulación) ─────
  liquidez: number;
  inversiones: number;
  dotales: number;
  // ─── Cubeta B: Esquemas de pensión (se convierten a mensualidad PMT) ──────
  afore: number;
  ppr: number;
  plan_privado: number;
  seguros_retiro: number;
  // ─── Ingresos fijos en retiro ─────────────────────────────────────────────
  ley_73: number | null;
  rentas: number;
  // ─── Parámetros de retiro ─────────────────────────────────────────────────
  edad: number;
  edad_retiro: number;
  edad_defuncion: number;
  mensualidad_deseada: number;
  tasa_real_anual?: number;
}

export interface CurvaPunto {
  mes: number;
  edad: number;
  saldo: number;
  // Ingresos mensuales desglosados por fuente en ese punto del retiro
  pension_mensual: number;
  voluntarios_mensual: number;
  rentas_mensual: number;
  negocio_mensual: number;
  patrimonio_retiro: number;
}

export interface MotorCOutput {
  // Saldos
  saldo_inicio_jubilacion: number;
  patrimonio_acum_libre: number;
  // Tiempos
  meses_acumulacion: number;
  meses_jubilacion: number;
  // Mensualidades
  mensualidad_posible: number;
  mensualidad_afore: number;
  mensualidad_voluntarios: number;
  mensualidad_esquemas: number;
  // Ingresos en retiro
  pension_fija_total: number;
  ingresos_fijos_retiro: number;
  total_mensual: number;
  // Indicadores clave
  grado_avance: number;
  pendiente_mensual: number;
  deficit_mensual: number;
  pasivo_vf: number;
  pasivo_vp: number;
  aportacion_necesaria: number | null;
  // Curva y fuentes
  curva: CurvaPunto[];
  fuentes_ingreso: {
    rentas: number;
    afore: number;
    voluntarios: number;
    ley_73: number;
    pension: number;
    patrimonio: number;
  };
}

// ─── Helpers PMT ───────────────────────────────────────────────────────────────

/**
 * PMT tipo=0 — pago al FIN del período.
 * Equivale a Excel PMT(tasa, n, saldo, 0, 0) × -1
 * Verif: PMT(1%/12, 360, 2,541,787.26) = $8,175.39 ✓
 */
function pmtTipo0(saldo: number, tasa: number, n: number): number {
  if (n <= 0) return 0;
  if (tasa <= 0) return saldo / n;
  return (saldo * tasa) / (1 - Math.pow(1 + tasa, -n));
}

/**
 * PMT tipo=1 — pago al INICIO del período.
 * Equivale a Excel PMT(tasa, n, saldo, 0, 1) × -1
 * Verif: PMT(1%/12, 360, Afore_al_retiro, 0, 1) = $3,551.56 ✓
 */
function pmtTipo1(saldo: number, tasa: number, n: number): number {
  if (tasa > 0) return pmtTipo0(saldo, tasa, n) / (1 + tasa);
  return pmtTipo0(saldo, tasa, n);
}

// ─── Motor C ───────────────────────────────────────────────────────────────────

export function calcularMotorC(input: MotorCInput): MotorCOutput {
  const tasa_anual    = input.tasa_real_anual ?? PARAMS.TASA_REAL_ANUAL;
  const tasa_mensual  = tasa_anual / 12;
  const meses_acumulacion = Math.max(0, (input.edad_retiro - input.edad) * 12);
  const meses_jubilacion  = Math.max(0, (input.edad_defuncion - input.edad_retiro) * 12);
  const factor_acum = Math.pow(1 + tasa_mensual, meses_acumulacion);

  // ─── Cubeta A: Patrimonio de acumulación libre al inicio del retiro ───────
  // Excel D5 Desacumulación = C29 + C30 + C35 = liquidez + inversiones + dotales
  // Verif. Juan Pérez: 2,300,000 × 1.10512 = 2,541,787.26 ✓
  const patrimonio_acum_libre = input.liquidez + input.inversiones + input.dotales;
  const saldo_inicio_jubilacion = patrimonio_acum_libre * factor_acum;

  // FIX-8: PMT tipo=0 para el patrimonio libre (Excel I8, tipo=0)
  const mensualidad_posible = pmtTipo0(saldo_inicio_jubilacion, tasa_mensual, meses_jubilacion);
  // Verif. Juan Pérez: $8,175.39 ✓

  // ─── Cubeta B: Mensualidad de esquemas de pensión via PMT tipo=1 ──────────
  // FIX-8: PMT tipo=1 para AFORE y voluntarios (Excel G30/G31, tipo=1)
  // Verif. Juan Pérez: Afore $1M → saldo_retiro $1,105,116 → mensualidad $3,551.56 ✓
  const saldo_afore_retiro      = input.afore * factor_acum;
  const saldo_voluntarios_retiro =
    (input.ppr + input.plan_privado + input.seguros_retiro) * factor_acum;

  const mensualidad_afore       = pmtTipo1(saldo_afore_retiro,      tasa_mensual, meses_jubilacion);
  const mensualidad_voluntarios = pmtTipo1(saldo_voluntarios_retiro, tasa_mensual, meses_jubilacion);
  const mensualidad_esquemas    = mensualidad_afore + mensualidad_voluntarios;
  // Verif. Juan Pérez: $3,551.56 + $0 = $3,551.56 ✓

  // ─── Grado de Avance = SOLO esquemas fijos / mensualidad deseada ──────────
  // El Excel NO incluye mensualidad_posible en el grado de avance.
  // Grado de avance = pensión fija / meta (77.10% para Juan Pérez)
  const pension_fija_total =
    (input.ley_73 || 0) + mensualidad_esquemas;
  const grado_avance =
    input.mensualidad_deseada > 0
      ? pension_fija_total / input.mensualidad_deseada
      : 1.0;
  // Verif. Juan Pérez: 38,551.56 / 50,000 = 0.7710 = 77.10% ✓

  // Pendiente mensual que necesita cubrirse con el patrimonio
  // Fuentes de ingreso en retiro = pensión fija + rentas (Excel G44)
  const ingresos_fijos_retiro = pension_fija_total + input.rentas;
  const pendiente_mensual = Math.max(0, input.mensualidad_deseada - ingresos_fijos_retiro);
  // Verif. Juan Pérez: max(0, 50,000 - 48,551.56) = $1,448.44 ✓

  // Déficit/superávit respecto al total incluyendo patrimonio
  const total_mensual   = ingresos_fijos_retiro + mensualidad_posible;
  const deficit_mensual = input.mensualidad_deseada - total_mensual;

  // ─── ADD-2: Pasivo del Retiro en VP (Excel G49) ───────────────────────────
  let pasivo_vf = 0;
  let pasivo_vp = 0;
  if (pendiente_mensual > 0 && tasa_mensual > 0 && meses_jubilacion > 0) {
    pasivo_vf =
      (pendiente_mensual * (1 - Math.pow(1 + tasa_mensual, -meses_jubilacion))) /
      tasa_mensual;
    pasivo_vp = pasivo_vf / Math.pow(1 + tasa_mensual, meses_acumulacion);
  }

  // ─── ADD-3: Aportación mensual para cubrir déficit (Excel G54 / C71) ──────
  let aportacion_necesaria: number | null = null;
  if (pasivo_vf > 0 && meses_acumulacion > 0 && tasa_mensual > 0) {
    // PMT para acumular `pasivo_vf` partiendo del patrimonio libre actual
    // Excel: MAX(-PMT(tasa, n_acum, -PatrimAccum, PasivoVF, tipo=0), 0)
    const pago_bruto =
      (pasivo_vf -
        patrimonio_acum_libre * Math.pow(1 + tasa_mensual, meses_acumulacion)) *
      tasa_mensual /
      (Math.pow(1 + tasa_mensual, meses_acumulacion) - 1);
    aportacion_necesaria = Math.max(0, Math.round(pago_bruto * 100) / 100);
  }

  // ─── Curva de desacumulación (anual, solo patrimonio libre) ───────────────
  const curva: CurvaPunto[] = [];
  let saldo_actual = saldo_inicio_jubilacion;
  for (let mes = 0; mes <= meses_jubilacion; mes++) {
    if (mes > 0) {
      const interes = saldo_actual * tasa_mensual;
      saldo_actual = Math.max(0, saldo_actual + interes - mensualidad_posible);
    }
    if (mes % 12 === 0 || mes === meses_jubilacion) {
      curva.push({
        mes,
        edad: Math.round((input.edad_retiro + mes / 12) * 100) / 100,
        saldo: Math.round(saldo_actual * 100) / 100,
        pension_mensual:      Math.round(pension_fija_total * 100) / 100,
        voluntarios_mensual:  Math.round(mensualidad_voluntarios * 100) / 100,
        rentas_mensual:       input.rentas,
        negocio_mensual:      0,
        patrimonio_retiro:    saldo_actual > 0 ? Math.round(mensualidad_posible * 100) / 100 : 0,
      });
    }
  }

  return {
    saldo_inicio_jubilacion: Math.round(saldo_inicio_jubilacion * 100) / 100,
    patrimonio_acum_libre:   Math.round(patrimonio_acum_libre * 100) / 100,
    meses_acumulacion,
    meses_jubilacion,
    mensualidad_posible:     Math.round(mensualidad_posible * 100) / 100,
    mensualidad_afore:       Math.round(mensualidad_afore * 100) / 100,
    mensualidad_voluntarios: Math.round(mensualidad_voluntarios * 100) / 100,
    mensualidad_esquemas:    Math.round(mensualidad_esquemas * 100) / 100,
    pension_fija_total:      Math.round(pension_fija_total * 100) / 100,
    ingresos_fijos_retiro:   Math.round(ingresos_fijos_retiro * 100) / 100,
    total_mensual:           Math.round(total_mensual * 100) / 100,
    grado_avance:            Math.round(grado_avance * 10000) / 10000,
    pendiente_mensual:       Math.round(pendiente_mensual * 100) / 100,
    deficit_mensual:         Math.round(deficit_mensual * 100) / 100,
    pasivo_vf:               Math.round(pasivo_vf * 100) / 100,
    pasivo_vp:               Math.round(pasivo_vp * 100) / 100,
    aportacion_necesaria,
    curva,
    fuentes_ingreso: {
      rentas:      input.rentas,
      afore:       Math.round(mensualidad_afore * 100) / 100,
      voluntarios: Math.round(mensualidad_voluntarios * 100) / 100,
      ley_73:      input.ley_73 || 0,
      pension:     Math.round(pension_fija_total * 100) / 100,
      patrimonio:  Math.round(mensualidad_posible * 100) / 100,
    },
  };
}

// ─── Capital Humano (sin cambios) ──────────────────────────────────────────────

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
