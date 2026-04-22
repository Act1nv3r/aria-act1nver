"""Motor C — Proyección de retiro y curva de desacumulación."""
from typing import Any

TASA_REAL_ANUAL = 0.01


def calcular_motor_c(
    patrimonio_financiero_total: float,
    saldo_esquemas: float,
    ley_73: float | None,
    rentas: float,
    edad: int,
    edad_retiro: int,
    edad_defuncion: int,
    mensualidad_deseada: float,
    tasa_real_anual: float | None = None,
) -> dict[str, Any]:
    tasa_anual = tasa_real_anual if tasa_real_anual is not None else TASA_REAL_ANUAL
    tasa_mensual = tasa_anual / 12
    meses_acumulacion = (edad_retiro - edad) * 12
    meses_jubilacion = (edad_defuncion - edad_retiro) * 12

    saldo_inicio_jubilacion = patrimonio_financiero_total * ((1 + tasa_mensual) ** meses_acumulacion)

    if tasa_mensual > 0 and meses_jubilacion > 0:
        mensualidad_posible = (saldo_inicio_jubilacion * tasa_mensual) / (
            1 - (1 + tasa_mensual) ** (-meses_jubilacion)
        )
    elif meses_jubilacion > 0:
        mensualidad_posible = saldo_inicio_jubilacion / meses_jubilacion
    else:
        mensualidad_posible = 0.0

    saldo_esquemas_al_retiro = saldo_esquemas * ((1 + tasa_mensual) ** meses_acumulacion)
    mensualidad_esquemas = 0.0
    if saldo_esquemas_al_retiro > 0 and meses_jubilacion > 0:
        if tasa_mensual > 0:
            mensualidad_esquemas = (saldo_esquemas_al_retiro * tasa_mensual) / (
                1 - (1 + tasa_mensual) ** (-meses_jubilacion)
            )
        else:
            mensualidad_esquemas = saldo_esquemas_al_retiro / meses_jubilacion

    pension_total_mensual = (ley_73 or 0.0) + rentas + mensualidad_esquemas
    total_mensual = pension_total_mensual + mensualidad_posible
    grado_avance = total_mensual / mensualidad_deseada if mensualidad_deseada > 0 else 1.0
    deficit_mensual = mensualidad_deseada - total_mensual

    # Build annual curva snapshots during retirement phase
    curva: list[dict] = []
    saldo_actual = saldo_inicio_jubilacion
    for mes in range(0, meses_jubilacion + 1):
        if mes > 0:
            interes = saldo_actual * tasa_mensual
            saldo_actual = max(0.0, saldo_actual + interes - mensualidad_posible)
        if mes % 12 == 0 or mes == meses_jubilacion:
            curva.append({
                "mes": mes,
                "edad": round(edad_retiro + mes / 12, 2),
                "saldo": round(saldo_actual, 2),
            })

    return {
        "saldo_inicio_jubilacion": saldo_inicio_jubilacion,
        "meses_acumulacion": meses_acumulacion,
        "meses_jubilacion": meses_jubilacion,
        "mensualidad_posible": mensualidad_posible,
        "pension_total_mensual": pension_total_mensual,
        "grado_avance": grado_avance,
        "deficit_mensual": deficit_mensual,
        "aportacion_necesaria": None,
        "curva": curva,
        "fuentes_ingreso": {
            "rentas": rentas,
            "pension": (ley_73 or 0.0) + mensualidad_esquemas,
            "patrimonio": mensualidad_posible,
        },
    }
