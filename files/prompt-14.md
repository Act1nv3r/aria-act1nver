# PROMPT 14 - Consolidacion Hogar + Resultados Triple
# Sprint 5A | 1.5 dias

## /lib/motors/consolidacion.ts
consolidar(titular, pareja, ownership) -> hogar
- Flujo: sumar ambos (ahorro+ahorro, gastos+gastos, etc.)
- Patrimonio financiero: siempre individual (sumar ambos)
- Patrimonio no financiero: segun ownership (compartido=contar una vez, individual=sumar al respectivo)
- Pasivos: segun ownership
- Dependencia financiera: % ingreso hogar que aporta cada miembro
  titular_pct = ingreso_titular / (ingreso_titular + ingreso_pareja)
  dependiente = titular_pct > 0.6 ? pareja : pareja_pct > 0.6 ? titular : equilibrado

## Ejecucion triple de motores
Al completar cada paso en modo pareja:
1. Ejecutar motores con datos TITULAR -> outputs.titular
2. Ejecutar motores con datos PAREJA -> outputs.pareja
3. Consolidar -> Ejecutar motores con HOGAR -> outputs.hogar

## Vista resultados pareja
3 sub-tabs adicionales: Titular | Pareja | Hogar Consolidado (badge verde Consolidado)
Card extra: Dependencia financiera (barra horizontal %titular vs %pareja con colores azul-actinver vs sunset)
PDF: 3 descargables (Titular, Pareja, Hogar)
