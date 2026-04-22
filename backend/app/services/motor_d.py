"""Motor D — Viabilidad de objetivos financieros."""
from typing import Any

TASA_REAL_ANUAL = 0.01


def calcular_motor_d(
    aportacion_inicial: float,
    aportacion_mensual: float,
    lista: list[dict],
    patrimonio_financiero: float,
    edad: int,
    edad_retiro: int,
    edad_defuncion: int,
) -> dict[str, Any]:
    tasa_mensual = TASA_REAL_ANUAL / 12
    meses_acumulacion = (edad_retiro - edad) * 12
    meses_jubilacion = (edad_defuncion - edad_retiro) * 12

    saldo = aportacion_inicial
    resultados: list[dict] = []

    objetivos_ordenados = sorted(lista, key=lambda x: x["plazo"])
    mes_actual = 0

    for obj in objetivos_ordenados:
        meses_objetivo = int(obj["plazo"]) * 12
        while mes_actual < meses_objetivo and mes_actual < meses_acumulacion:
            saldo = saldo + aportacion_mensual + saldo * tasa_mensual
            mes_actual += 1
        viable = saldo >= obj["monto"]
        if viable:
            saldo -= obj["monto"]
        resultados.append({
            "nombre": obj["nombre"],
            "monto": obj["monto"],
            "plazo": obj["plazo"],
            "viable": viable,
        })

    while mes_actual < meses_acumulacion:
        saldo = saldo + aportacion_mensual + saldo * tasa_mensual
        mes_actual += 1

    extra_meses = max(0, meses_acumulacion - mes_actual)
    saldo_retiro = saldo + patrimonio_financiero * ((1 + tasa_mensual) ** extra_meses)
    legado = max(0.0, saldo_retiro * ((1 + tasa_mensual) ** meses_jubilacion))

    return {
        "resultados": resultados,
        "saldo_retiro": saldo_retiro,
        "legado": legado,
    }
