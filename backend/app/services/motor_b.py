"""Motor B — Nivel de riqueza y longevidad de recursos."""
from typing import Any

BENCHMARK_RIQUEZA = [
    [25, 0, 0.1, 0.25, 0.4, 0.6],
    [30, 0.5, 0.75, 1, 1.5, 2],
    [35, 1, 2, 3, 4, 6],
    [40, 2, 4, 6, 8, 10],
    [45, 3, 6, 8, 10, 12],
    [50, 4, 7, 9, 12, 15],
    [55, 5, 8, 11, 14, 18],
    [60, 6, 9, 13, 16, 20],
]
NIVELES = ["suficiente", "mejor", "bien", "genial", "on-fire"]


def calcular_motor_b(
    liquidez: float,
    inversiones: float,
    dotales: float,
    afore: float,
    ppr: float,
    plan_privado: float,
    seguros_retiro: float,
    edad: int,
    gastos_basicos: float,
    obligaciones: float,
    creditos: float,
) -> dict[str, Any]:
    patrimonio_financiero_total = liquidez + inversiones + dotales + afore + ppr + plan_privado + seguros_retiro
    gasto_mensual = gastos_basicos + obligaciones + creditos
    gasto_anual = gasto_mensual * 12
    ratio = patrimonio_financiero_total / gasto_anual if gasto_anual > 0 else 0.0
    meses_cubiertos = liquidez / gastos_basicos if gastos_basicos > 0 else 0.0

    # Find benchmark row for age (last row where edad >= row[0])
    row = BENCHMARK_RIQUEZA[-1]
    for i in range(len(BENCHMARK_RIQUEZA) - 1, -1, -1):
        if edad >= BENCHMARK_RIQUEZA[i][0]:
            row = BENCHMARK_RIQUEZA[i]
            break

    benchmark_para_edad = row[1]
    nivel_riqueza = "suficiente"
    for i in range(len(NIVELES) - 1, -1, -1):
        if ratio >= row[i + 1]:
            nivel_riqueza = NIVELES[i]
            break

    longevidad_recursos = (
        edad + patrimonio_financiero_total / gasto_mensual / 12
        if gasto_mensual > 0
        else float(edad)
    )

    return {
        "patrimonio_financiero_total": patrimonio_financiero_total,
        "gasto_anual": gasto_anual,
        "ratio": ratio,
        "nivel_riqueza": nivel_riqueza,
        "benchmark_para_edad": benchmark_para_edad,
        "longevidad_recursos": longevidad_recursos,
        "meses_cubiertos": meses_cubiertos,
    }
