from decimal import Decimal
from typing import Any

PARAMS = {"BENCHMARK_RESERVA_MESES": 3}


def calcular_motor_a(
    ahorro: float,
    rentas: float,
    otros: float,
    gastos_basicos: float,
    obligaciones: float,
    creditos: float,
    liquidez: float | None = None,
) -> dict[str, Any]:
    # ─── FIX-1: Ingresos Totales ────────────────────────────────────────────
    # El Excel trata `ahorro` como la CAPACIDAD DE AHORRO NETA ya neteada de
    # rentas y otros ingresos. El ingreso laboral se reconstruye sustrayendo
    # rentas y otros del ahorro:
    #   ingreso_laboral = gastos_basicos + obligaciones + creditos + ahorro − rentas − otros
    #   ingresos_totales = ingreso_laboral + rentas + otros
    #                    = gastos_basicos + obligaciones + creditos + ahorro
    # Verificación Juan Pérez:
    #   ingreso_laboral = (40K+20K+0+50K) − 10K − 0 = $100,000  ← Excel C16 ✓
    #   ingresos_totales = 100K + 10K + 0 = $110,000              ← Excel total ✓
    ingreso_laboral = (
        Decimal(str(gastos_basicos)) + Decimal(str(obligaciones)) + Decimal(str(creditos))
        + Decimal(str(ahorro)) - Decimal(str(rentas)) - Decimal(str(otros))
    )
    ingresos_totales = ingreso_laboral + Decimal(str(rentas)) + Decimal(str(otros))

    gastos_totales = (
        Decimal(str(gastos_basicos)) + Decimal(str(obligaciones)) + Decimal(str(creditos))
    )
    ingresos_val = float(ingresos_totales)

    # Distribución coherente (los 4 componentes suman 100% del ingreso total)
    distribucion = {
        "gastos_pct":      float(gastos_basicos / ingresos_val) if ingresos_val > 0 else 0,
        "obligaciones_pct": float(obligaciones   / ingresos_val) if ingresos_val > 0 else 0,
        "creditos_pct":    float(creditos        / ingresos_val) if ingresos_val > 0 else 0,
        "ahorro_pct":      float(ahorro          / ingresos_val) if ingresos_val > 0 else 0,
    }

    # ─── Reserva de Emergencia ──────────────────────────────────────────────
    benchmark_reserva = PARAMS["BENCHMARK_RESERVA_MESES"] * gastos_basicos
    meses_cubiertos = None
    if liquidez is not None and gastos_basicos > 0:
        meses_cubiertos = liquidez / gastos_basicos

    resultado_reserva = "Pendiente"
    if meses_cubiertos is not None:
        resultado_reserva = "Excedida" if meses_cubiertos >= 3 else "Insuficiente"

    # ─── FIX ADD-1: Remanente real para objetivos ───────────────────────────
    # Si la reserva está cubierta, el remanente = ahorro completo.
    # Si hay déficit de reserva, el remanente se reduce por lo que falta cubrir.
    pendiente_reserva = 0.0
    meses_para_cubrir = 0.0
    if liquidez is not None and meses_cubiertos is not None and meses_cubiertos < 3:
        pendiente_reserva = benchmark_reserva - (liquidez or 0)
        meses_para_cubrir = (pendiente_reserva / ahorro) if ahorro > 0 else 0.0

    remanente = max(0.0, ahorro * (1 - min(meses_para_cubrir / 12, 1)) if meses_para_cubrir > 0 else ahorro)

    return {
        "ingresos_totales":   float(ingresos_totales),
        "gastos_totales":     float(gastos_totales),
        "distribucion":       distribucion,
        "benchmark_reserva":  benchmark_reserva,
        "meses_cubiertos":    meses_cubiertos,
        "resultado_reserva":  resultado_reserva,
        "pendiente_reserva":  pendiente_reserva,
        "meses_para_cubrir":  round(meses_para_cubrir, 2),
        "remanente":          remanente,
    }
