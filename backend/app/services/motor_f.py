"""Motor F — Recomendaciones de protección patrimonial.

FIX-5: Suma asegurada vida calculada según Excel:
    nivel_riqueza_ratio = (inversiones + dotales) / (gastos_mensuales × 12)
    cobertura = MAX((3 − nivel_riqueza_ratio) × dependientes × flag_<65, 0)
    suma_asegurada = cobertura × gastos_mensuales × 12

    Donde:
      - dependientes  = número de dependientes económicos (int)
      - flag_<65      = 1 si edad < 65, else 0
      - gastos_mensuales = gasto mensual total del cliente

FIX-5b: Seguro hogar usa cap rate cuando hay rentas disponibles:
    seguro_hogar = rentas_mensuales × 12 / CAP_RATE (= rentas × 240 con 5%)
    Si no hay rentas, seguro_hogar = inmuebles_total
"""
from typing import Any

CAP_RATE = 0.05
COSTO_SEGURO_POR_MILLON = 7_000


def calcular_motor_f(
    # ─── Cobertura vida ────────────────────────────────────────────────────
    seguro_vida: bool,
    dependientes: int,          # número de dependientes (antes era bool)
    inversiones: float,         # para calcular nivel_riqueza_ratio
    dotales: float,
    gastos_mensuales: float,    # gasto mensual total (gastos_basicos + obligaciones + creditos)
    edad: int,
    # ─── Cobertura hogar ───────────────────────────────────────────────────
    propiedades_aseguradas: bool | None,
    inmuebles_total: float,
    rentas_mensuales: float,    # ingresos por renta → para estimar valor vía cap rate
    # ─── Cobertura salud ───────────────────────────────────────────────────
    sgmm: bool,
) -> dict[str, Any]:
    recomendaciones: list[str] = []
    result: dict[str, Any] = {}

    # ─── Seguro de Vida (FIX-5) ───────────────────────────────────────────
    suma_asegurada_vida = 0.0
    costo_prima_vida    = 0.0
    if not seguro_vida and dependientes > 0:
        gasto_anual = gastos_mensuales * 12
        # Nivel de riqueza numérico (mismo denominador que Motor B)
        nivel_riqueza_ratio = (
            (inversiones + dotales) / gasto_anual if gasto_anual > 0 else 0.0
        )
        flag_menor_65 = 1 if edad < 65 else 0

        # Multiplicador de cobertura: MAX((3 − NR) × dep × flag, 0)
        cobertura = max((3.0 - nivel_riqueza_ratio) * dependientes * flag_menor_65, 0.0)
        suma_asegurada_vida = cobertura * gasto_anual
        costo_prima_vida    = (suma_asegurada_vida / 1_000_000) * COSTO_SEGURO_POR_MILLON

        if suma_asegurada_vida > 0:
            recomendaciones.append(
                f"Seguro de vida recomendado: ${suma_asegurada_vida:,.0f} MXN "
                f"(cobertura ×{cobertura:.1f} del gasto anual)"
            )

    result["suma_asegurada_vida"] = round(suma_asegurada_vida, 2)
    result["costo_prima_vida"]    = round(costo_prima_vida, 2)

    # ─── Seguro de Hogar (FIX-5b) ─────────────────────────────────────────
    seguro_hogar_sugerido = 0.0
    costo_hogar_anual     = 0.0
    if inmuebles_total > 0 and not propiedades_aseguradas:
        # Si hay rentas mensuales, usar cap rate para estimar valor
        if rentas_mensuales > 0:
            seguro_hogar_sugerido = rentas_mensuales * 12 / CAP_RATE
        else:
            seguro_hogar_sugerido = inmuebles_total
        costo_hogar_anual = seguro_hogar_sugerido * 0.003
        recomendaciones.append(
            f"Asegura tus propiedades por ${seguro_hogar_sugerido:,.0f} MXN"
        )

    result["seguro_hogar_sugerido"] = round(seguro_hogar_sugerido, 2)
    result["costo_hogar_anual"]     = round(costo_hogar_anual, 2)

    # ─── SGMM ─────────────────────────────────────────────────────────────
    sgmm_estimado = 0.0
    if not sgmm:
        sgmm_estimado = 30_000 if edad >= 50 else 15_000
        recomendaciones.append("SGMM recomendado: $15,000–$30,000/año según edad")

    result["sgmm_estimado"]    = sgmm_estimado
    result["recomendaciones"]  = recomendaciones

    return result
