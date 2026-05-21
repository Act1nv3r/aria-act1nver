"""Motor C — Proyección de retiro y curva de desacumulación.

Arquitectura de 3 cubetas (alineada con Excel):
  Cubeta A: liquidez + inversiones + dotales  → desacumulación libre
  Cubeta B: afore + ppr + plan_privado + seguros_retiro  → mensualidad PMT
  Cubeta C: ley_73, rentas, negocio  → ingresos fijos en retiro
"""
from typing import Any

TASA_REAL_ANUAL = 0.01


def _pmt_tipo0(saldo: float, tasa: float, n: int) -> float:
    """PMT tipo=0 — pago al FIN del período (para mensualidad_posible del patrimonio).
    Equivale a Excel PMT(tasa, n, saldo, 0, 0) × -1
    Verif: PMT(1%/12, 360, 2,541,787.26) = $8,175.39 ✓
    """
    if n <= 0:
        return 0.0
    if tasa <= 0:
        return saldo / n
    return saldo * tasa / (1 - (1 + tasa) ** (-n))


def _pmt_tipo1(saldo: float, tasa: float, n: int) -> float:
    """PMT tipo=1 — pago al INICIO del período (para mensualidades de esquemas/AFORE).
    Equivale a Excel PMT(tasa, n, saldo, 0, 1) × -1
    Verif: PMT(1%/12, 360, Afore_al_retiro, 0, 1) = $3,551.56 ✓
    """
    return _pmt_tipo0(saldo, tasa, n) / (1 + tasa) if tasa > 0 else _pmt_tipo0(saldo, tasa, n)


def calcular_motor_c(
    # ─── Cubeta A: Acumulación libre (base de la curva de desacumulación) ───
    liquidez: float,
    inversiones: float,
    dotales: float,
    # ─── Cubeta B: Esquemas de pensión (se convierten a mensualidad PMT) ────
    afore: float,
    ppr: float,
    plan_privado: float,
    seguros_retiro: float,
    # ─── Ingresos fijos en retiro ────────────────────────────────────────────
    ley_73: float | None,
    rentas: float,
    # ─── Parámetros de retiro ────────────────────────────────────────────────
    edad: int,
    edad_retiro: int,
    edad_defuncion: int,
    mensualidad_deseada: float,
    tasa_real_anual: float | None = None,
) -> dict[str, Any]:
    tasa_anual   = tasa_real_anual if tasa_real_anual is not None else TASA_REAL_ANUAL
    tasa_mensual = tasa_anual / 12
    meses_acumulacion = max(0, (edad_retiro - edad) * 12)
    meses_jubilacion  = max(0, (edad_defuncion - edad_retiro) * 12)
    factor_acum = (1 + tasa_mensual) ** meses_acumulacion

    # ─── Cubeta A: Patrimonio de acumulación libre al inicio del retiro ──────
    # Excel D5 de Desacumulación = C29 + C30 + C35 = liquidez + inversiones + dotales
    # Verif. Juan Pérez: 2,300,000 × 1.10512 = 2,541,787.26 ✓
    patrimonio_acum_libre = liquidez + inversiones + dotales
    saldo_inicio_jubilacion = patrimonio_acum_libre * factor_acum

    # FIX-8: PMT tipo=0 para el patrimonio libre (Excel I8, tipo=0)
    mensualidad_posible = _pmt_tipo0(saldo_inicio_jubilacion, tasa_mensual, meses_jubilacion)
    # Verif. Juan Pérez: $8,175.39 ✓

    # ─── Cubeta B: Mensualidad de esquemas de pensión via PMT tipo=1 ─────────
    # FIX-8: PMT tipo=1 para AFORE y voluntarios (Excel G30/G31, tipo=1)
    # Verif. Juan Pérez: Afore $1M → saldo_retiro $1,105,116 → mensualidad $3,551.56 ✓
    saldo_afore_retiro      = afore       * factor_acum
    saldo_voluntarios_retiro = (ppr + plan_privado + seguros_retiro) * factor_acum

    mensualidad_afore       = _pmt_tipo1(saldo_afore_retiro,       tasa_mensual, meses_jubilacion)
    mensualidad_voluntarios = _pmt_tipo1(saldo_voluntarios_retiro,  tasa_mensual, meses_jubilacion)
    mensualidad_esquemas    = mensualidad_afore + mensualidad_voluntarios
    # Verif. Juan Pérez: $3,551.56 + $0 = $3,551.56 ✓

    # ─── Grado de Avance = SOLO esquemas fijos / mensualidad deseada ─────────
    # El Excel NO incluye mensualidad_posible en el grado de avance.
    # Grado de avance = pensión fija / meta (77.10% para Juan Pérez)
    pension_fija_total = (ley_73 or 0.0) + mensualidad_esquemas
    grado_avance = pension_fija_total / mensualidad_deseada if mensualidad_deseada > 0 else 1.0
    # Verif. Juan Pérez: 38,551.56 / 50,000 = 0.7710 = 77.10% ✓

    # Pendiente mensual que necesita cubrirse con el patrimonio
    # Fuentes de ingreso en retiro = pensión fija + rentas (Excel G44)
    ingresos_fijos_retiro = pension_fija_total + rentas
    pendiente_mensual = max(0.0, mensualidad_deseada - ingresos_fijos_retiro)
    # Verif. Juan Pérez: max(0, 50,000 - 48,551.56) = $1,448.44 ✓

    # deficit/superávit respecto al total incluyendo patrimonio
    total_mensual  = ingresos_fijos_retiro + mensualidad_posible
    deficit_mensual = mensualidad_deseada - total_mensual

    # ─── ADD-2: Pasivo del Retiro en VP (Excel G49) ───────────────────────────
    pasivo_vf = 0.0
    pasivo_vp = 0.0
    if pendiente_mensual > 0 and tasa_mensual > 0 and meses_jubilacion > 0:
        pasivo_vf = pendiente_mensual * (1 - (1 + tasa_mensual) ** (-meses_jubilacion)) / tasa_mensual
        pasivo_vp = pasivo_vf / ((1 + tasa_mensual) ** meses_acumulacion)

    # ─── ADD-3: Aportación mensual para cubrir déficit (Excel G54 / C71) ─────
    aportacion_necesaria: float | None = None
    if pasivo_vf > 0 and meses_acumulacion > 0 and tasa_mensual > 0:
        # PMT para acumular `pasivo_vf` partiendo del patrimonio libre actual
        # Excel: MAX(-PMT(tasa, n_acum, -PatrimAccum, PasivoVF, tipo=0), 0)
        pago_bruto = (
            (pasivo_vf - patrimonio_acum_libre * ((1 + tasa_mensual) ** meses_acumulacion))
            * tasa_mensual
            / ((1 + tasa_mensual) ** meses_acumulacion - 1)
        )
        aportacion_necesaria = max(0.0, round(pago_bruto, 2))

    # ─── Curva de desacumulación (anual, solo patrimonio libre) ──────────────
    curva: list[dict] = []
    saldo_actual = saldo_inicio_jubilacion
    for mes in range(0, meses_jubilacion + 1):
        if mes > 0:
            interes = saldo_actual * tasa_mensual
            saldo_actual = max(0.0, saldo_actual + interes - mensualidad_posible)
        if mes % 12 == 0 or mes == meses_jubilacion:
            curva.append({
                "mes":                round(mes, 2),
                "edad":               round(edad_retiro + mes / 12, 2),
                "saldo":              round(saldo_actual, 2),
                "pension_mensual":    round(pension_fija_total, 2),
                "voluntarios_mensual": round(mensualidad_voluntarios, 2),
                "rentas_mensual":     round(rentas, 2),
                "negocio_mensual":    0.0,
                "patrimonio_retiro":  round(mensualidad_posible, 2) if saldo_actual > 0 else 0.0,
            })

    return {
        # Saldos
        "saldo_inicio_jubilacion": round(saldo_inicio_jubilacion, 2),
        "patrimonio_acum_libre":   round(patrimonio_acum_libre, 2),
        # Tiempos
        "meses_acumulacion": meses_acumulacion,
        "meses_jubilacion":  meses_jubilacion,
        # Mensualidades
        "mensualidad_posible":      round(mensualidad_posible, 2),
        "mensualidad_afore":        round(mensualidad_afore, 2),
        "mensualidad_voluntarios":  round(mensualidad_voluntarios, 2),
        "mensualidad_esquemas":     round(mensualidad_esquemas, 2),
        # Ingresos en retiro
        "pension_fija_total":       round(pension_fija_total, 2),
        "ingresos_fijos_retiro":    round(ingresos_fijos_retiro, 2),
        "total_mensual":            round(total_mensual, 2),
        # Indicadores clave
        "grado_avance":             round(grado_avance, 4),
        "pendiente_mensual":        round(pendiente_mensual, 2),
        "deficit_mensual":          round(deficit_mensual, 2),
        "pasivo_vf":                round(pasivo_vf, 2),
        "pasivo_vp":                round(pasivo_vp, 2),
        "aportacion_necesaria":     aportacion_necesaria,
        # Curva y fuentes
        "curva": curva,
        "fuentes_ingreso": {
            "rentas":    rentas,
            "afore":     round(mensualidad_afore, 2),
            "voluntarios": round(mensualidad_voluntarios, 2),
            "ley_73":    ley_73 or 0.0,
            "pension":   round(pension_fija_total, 2),  # total pensión fija
            "patrimonio": round(mensualidad_posible, 2),
        },
    }
