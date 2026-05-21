"""Motor B — Nivel de riqueza y longevidad de recursos."""
from typing import Any

BENCHMARK_RIQUEZA = [
    [25, 0, 0.1, 0.25, 0.4, 0.6],
    [30, 0.5, 0.75, 1, 1.5, 2],
    [35, 1, 2, 3, 4, 6],
    [40, 2, 4, 6, 8, 10],
    [45, 3, 6, 8, 10, 13],  # on-fire corregido: 12→13 (auditoría Excel)
    [50, 4, 7, 9, 12, 15],
    [55, 5, 8, 11, 14, 17],  # on-fire corregido: 18→17 (auditoría Excel)
    [60, 6, 9, 13, 16, 20],
]
NIVELES = ["suficiente", "mejor", "bien", "genial", "on-fire"]


def _etiqueta_nivel_riqueza(ratio: float) -> str:
    """Etiqueta textual del Excel (hoja Auxiliar G14) basada en el ratio."""
    if ratio < 1:   return "POR DEBAJO DEL PROMEDIO"
    if ratio < 3:   return "POR ARRIBA DEL PROMEDIO"
    if ratio < 5:   return "RICO"
    return "ACAUDALADO"


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
    # ─── FIX-2: Separar cubetas de activos ──────────────────────────────────
    # Cubeta A — Acumulación libre (base del Nivel de Riqueza y desacumulación):
    #   inversiones + dotales  →  igual que Excel C30+C35
    # Cubeta B — Esquemas de pensión: afore + ppr + plan_privado + seguros_retiro
    # Cubeta C — Liquidez: solo para reserva de emergencia
    # TOTAL financiero: todas las cubetas (para Motor E / balance patrimonial)
    patrimonio_acumulacion_libre = inversiones + dotales
    patrimonio_esquemas = afore + ppr + plan_privado + seguros_retiro
    patrimonio_financiero_total  = liquidez + inversiones + dotales + afore + ppr + plan_privado + seguros_retiro

    gasto_mensual = gastos_basicos + obligaciones + creditos
    gasto_anual   = gasto_mensual * 12

    # ─── FIX-2: Ratio usa solo acumulación libre (no AFORE ni liquidez) ─────
    # Verif. Juan Pérez: (2M + 100K) / (60K × 12) = 2.9167 ✓
    ratio = patrimonio_acumulacion_libre / gasto_anual if gasto_anual > 0 else 0.0

    meses_cubiertos = liquidez / gastos_basicos if gastos_basicos > 0 else 0.0

    # Fila del benchmark por edad
    row = BENCHMARK_RIQUEZA[-1]
    for i in range(len(BENCHMARK_RIQUEZA) - 1, -1, -1):
        if edad >= BENCHMARK_RIQUEZA[i][0]:
            row = BENCHMARK_RIQUEZA[i]
            break

    benchmark_para_edad = row[1]

    # ─── FIX-7: Edge case — ratio por debajo del umbral mínimo ──────────────
    # Valor inicial "por_debajo" evita el falso "suficiente" cuando ratio < row[1]
    nivel_riqueza = "por_debajo"
    for i in range(len(NIVELES) - 1, -1, -1):
        if ratio >= row[i + 1]:
            nivel_riqueza = NIVELES[i]
            break

    # ADD-4: Longevidad basada en acumulación libre (igual que Excel G27)
    # Verif. Juan Pérez: 50 + 2,100,000/(60,000×12) = 52.92 años ✓
    longevidad_recursos = (
        edad + patrimonio_acumulacion_libre / gasto_anual
        if gasto_anual > 0
        else float(edad)
    )

    return {
        "patrimonio_financiero_total":   patrimonio_financiero_total,   # para Motor E
        "patrimonio_acumulacion_libre":  patrimonio_acumulacion_libre,  # para Motor C y F
        "patrimonio_esquemas":           patrimonio_esquemas,           # para Motor C
        "gasto_anual":                   gasto_anual,
        "ratio":                         round(ratio, 4),
        "nivel_riqueza":                 nivel_riqueza,
        "etiqueta_nivel":                _etiqueta_nivel_riqueza(ratio),
        "benchmark_para_edad":           benchmark_para_edad,
        "longevidad_recursos":           round(longevidad_recursos, 2),
        "meses_cubiertos":               meses_cubiertos,
    }
