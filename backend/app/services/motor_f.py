"""Motor F — Recomendaciones de protección patrimonial."""
from typing import Any

COSTO_SEGURO_POR_MILLON = 7000


def calcular_motor_f(
    seguro_vida: bool,
    propiedades_aseguradas: bool | None,
    sgmm: bool,
    dependientes: bool,
    patrimonio_neto: float,
    inmuebles_total: float,
    edad: int,
) -> dict[str, Any]:
    recomendaciones: list[str] = []
    result: dict[str, Any] = {"recomendaciones": recomendaciones}

    if dependientes and not seguro_vida:
        suma_asegurada = patrimonio_neto * 0.7
        costo_prima = (suma_asegurada / 1_000_000) * COSTO_SEGURO_POR_MILLON
        recomendaciones.append(
            f"Seguro de vida con suma asegurada de ${suma_asegurada:,.0f} MXN"
        )
        result["suma_asegurada_vida"] = suma_asegurada
        result["costo_prima_vida"] = costo_prima
        return result

    if inmuebles_total > 0 and not propiedades_aseguradas:
        seguro_hogar = inmuebles_total
        costo_hogar = seguro_hogar * 0.003
        recomendaciones.append(
            f"Asegura tus propiedades por ${seguro_hogar:,.0f} MXN"
        )
        result["seguro_hogar_sugerido"] = seguro_hogar
        result["costo_hogar_anual"] = costo_hogar
        return result

    if not sgmm:
        sgmm_estimado = 30000 if edad >= 50 else 15000
        recomendaciones.append("SGMM recomendado: $15,000–$30,000/año según edad")
        result["sgmm_estimado"] = sgmm_estimado
        return result

    return result
