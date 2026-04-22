"""Motor E — Patrimonio neto, solvencia y apalancamiento."""
from typing import Any


def calcular_motor_e(
    liquidez: float,
    inversiones: float,
    dotales: float,
    afore: float,
    ppr: float,
    plan_privado: float,
    seguros_retiro: float,
    casa: float,
    inmuebles_renta: float,
    tierra: float,
    negocio: float,
    herencia: float,
    hipoteca: float,
    saldo_planes: float,
    compromisos: float,
) -> dict[str, Any]:
    financiero = liquidez + inversiones + dotales + afore + ppr + plan_privado + seguros_retiro
    no_financiero = casa + inmuebles_renta + tierra + negocio + herencia
    activos_total = financiero + no_financiero
    pasivos_total = hipoteca + saldo_planes + compromisos
    patrimonio_neto = activos_total - pasivos_total

    indice_solvencia = 1.0 - (pasivos_total / activos_total) if activos_total > 0 else 0.0
    ratio = pasivos_total / activos_total if activos_total > 0 else 0.0

    if ratio > 0.5:
        clasificacion_solvencia = "Crítico"
    elif ratio > 0.4:
        clasificacion_solvencia = "Elevado"
    elif ratio > 0.3:
        clasificacion_solvencia = "Aceptable"
    elif ratio > 0.1:
        clasificacion_solvencia = "Recomendable"
    else:
        clasificacion_solvencia = "Muy saludable"

    potencial_apalancamiento = (liquidez + inversiones) * 0.6 + (casa + inmuebles_renta + tierra) * 0.5

    return {
        "activos_total": activos_total,
        "pasivos_total": pasivos_total,
        "patrimonio_neto": patrimonio_neto,
        "financiero": financiero,
        "no_financiero": no_financiero,
        "indice_solvencia": indice_solvencia,
        "clasificacion_solvencia": clasificacion_solvencia,
        "potencial_apalancamiento": potencial_apalancamiento,
    }
