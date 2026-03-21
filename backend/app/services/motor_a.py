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
    ingresos_totales = Decimal(str(ahorro)) + Decimal(str(rentas)) + Decimal(str(otros))
    gastos_totales = (
        Decimal(str(gastos_basicos)) + Decimal(str(obligaciones)) + Decimal(str(creditos))
    )
    ingresos_val = float(ingresos_totales)
    distribucion = {
        "obligaciones_pct": float(obligaciones / ingresos_val) if ingresos_val > 0 else 0,
        "gastos_pct": float(gastos_basicos / ingresos_val) if ingresos_val > 0 else 0,
        "ahorro_pct": float(ahorro / ingresos_val) if ingresos_val > 0 else 0,
    }
    benchmark_reserva = PARAMS["BENCHMARK_RESERVA_MESES"] * gastos_basicos
    meses_cubiertos = None
    if liquidez is not None and gastos_basicos > 0:
        meses_cubiertos = liquidez / gastos_basicos
    resultado_reserva = "Pendiente"
    if meses_cubiertos is not None:
        resultado_reserva = "Cubierta" if meses_cubiertos >= 3 else "Insuficiente"
    return {
        "ingresos_totales": float(ingresos_totales),
        "gastos_totales": float(gastos_totales),
        "distribucion": distribucion,
        "benchmark_reserva": benchmark_reserva,
        "meses_cubiertos": meses_cubiertos,
        "resultado_reserva": resultado_reserva,
        "remanente": float(ahorro),
    }
