"""Motor E — Patrimonio neto, solvencia y apalancamiento.

FIX-3: Índice de Solvencia usa activos_base (excluye esquemas_retiro y herencia).
        Fórmula Excel: (activos_base - pasivos) / activos_base
        Escala: >70% Excelente, 50-70% Alto, 30-50% Suficiente, <30% Bajo

FIX-4: Potencial de Apalancamiento = activos_base × 0.5 − pasivos_total
"""
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

    # ─── Activos por cubeta ──────────────────────────────────────────────────
    # Cubeta financiera libre (base del ratio de solvencia)
    financiero_libre = liquidez + inversiones + dotales

    # Esquemas de retiro (SE EXCLUYEN del índice de solvencia)
    esquemas_retiro = afore + ppr + plan_privado + seguros_retiro

    # Total financiero (para balance patrimonial)
    financiero = financiero_libre + esquemas_retiro

    # Activos no financieros sin herencia (SE INCLUYEN en índice de solvencia)
    no_financiero_operativo = casa + inmuebles_renta + tierra + negocio

    # Herencia (SE EXCLUYE del índice de solvencia)
    # Total no financiero (para balance patrimonial)
    no_financiero = no_financiero_operativo + herencia

    # Activos totales (para balance / patrimonio neto)
    activos_total = financiero + no_financiero

    # ─── Pasivos ─────────────────────────────────────────────────────────────
    pasivos_total = hipoteca + saldo_planes + compromisos

    # ─── Patrimonio neto ─────────────────────────────────────────────────────
    patrimonio_neto = activos_total - pasivos_total

    # ─── FIX-3: Índice de Solvencia (Excel) ─────────────────────────────────
    # activos_base = todos los activos EXCEPTO esquemas_retiro y herencia
    # Verif. Juan Pérez: activos_base = 2.3M + 2.7M = 5M (sin AFORE $1M, sin herencia)
    activos_base = financiero_libre + no_financiero_operativo

    indice_solvencia = (
        (activos_base - pasivos_total) / activos_base if activos_base > 0 else 0.0
    )

    if indice_solvencia > 0.70:
        clasificacion_solvencia = "Excelente"
    elif indice_solvencia > 0.50:
        clasificacion_solvencia = "Alto"
    elif indice_solvencia > 0.30:
        clasificacion_solvencia = "Suficiente"
    else:
        clasificacion_solvencia = "Bajo"

    # ─── FIX-4: Potencial de Apalancamiento (Excel) ──────────────────────────
    # Excel: activos_disponibles × 0.5 − pasivos_total
    # activos_disponibles = activos_base (misma base que solvencia)
    potencial_apalancamiento = activos_base * 0.5 - pasivos_total

    return {
        "activos_total":              activos_total,
        "pasivos_total":              pasivos_total,
        "patrimonio_neto":            patrimonio_neto,
        "financiero":                 financiero,
        "no_financiero":              no_financiero,
        "activos_base":               activos_base,          # para referencia / auditoría
        "esquemas_retiro":            esquemas_retiro,        # para referencia / auditoría
        "indice_solvencia":           round(indice_solvencia, 4),
        "clasificacion_solvencia":    clasificacion_solvencia,
        "potencial_apalancamiento":   round(potencial_apalancamiento, 2),
    }
