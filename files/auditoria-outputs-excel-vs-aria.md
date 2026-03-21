# Auditoría: Outputs Excel vs ArIA

Comparación de resultados/gráficas del prototipo Excel (`prototipo.balance.feb.20.2026 Herramienta (V2)Completa MKT.xlsx`) con la pantalla de resultados de ArIA.

---

## Pestañas del Excel

| Pestaña | Contenido principal |
|---------|----------------------|
| Entrevista Patrimonio F. | Inputs generales |
| Cálculos y Supuestos Edo.Res | Outputs 1-5, Regla 72 |
| Desacumulación | Curva desacumulación, Grado avance |
| Objetivos | Tabla viabilidad, Legado |
| Auxiliar | Datos auxiliares |
| Patrimonio Financiero | Valor dinero en el tiempo |
| Entrevista Balance | Inputs balance |
| Cálculos y Supuestos Balance | Cálculos |
| Balance | Patrimonio Neto, Nivel Riqueza |
| To do list | Tareas |
| Patrimonio Neto | Benchmark por edad |
| Potencial del balance | Potencial apalancamiento, Índice solvencia |

---

## Outputs del Excel vs Implementación ArIA

| Output Excel | Descripción | Ubicación ArIA | Estado |
|--------------|-------------|----------------|--------|
| **Output 1** | Análisis Ingreso/Gasto (Obligaciones, Gastos básicos, Ahorro) | `DonutChart` | ✅ Implementado |
| **Output 2** | Benchmark Reserva CP, Meses de Reserva CP, Resultado | `ReservaSemaforo` | ✅ Implementado |
| **Output 3** | Saldo Acumulación, Meses Reserva Acumulación, Remanente | — | ⚠️ Parcial (ReservaSemaforo cubre reserva CP) |
| **Output 4** | Pensión con Ahorro Financiero (Mensualidad Afore, Pension, Grado Avance) | `GradoAvanceBar`, `FuentesIngreso` | ✅ Implementado |
| **Output 5** | Integración fuentes de ingreso (Rentas, Propiedades, Negocio, Esquemas) | `FuentesIngreso` | ✅ Implementado |
| **Output 6** | Índice Patrimonial Retiro (Grado Avance, Deficit/Superavit) | `GradoAvanceBar`, `DeficitCard` | ✅ Implementado |
| **Output 7** | Seguros (Protección patrimonial) | Card `Protección` (motorF) | ✅ Implementado |

---

## Gráficas del Excel vs Implementación ArIA

| Gráfica Excel | Chart | Implementación ArIA | Estado |
|---------------|-------|---------------------|--------|
| Ingresos vs. Gastos | Chart1 (Donut) | `DonutChart` | ✅ Implementado |
| Nivel de Riqueza | Chart2 | `NivelRiquezaBadge` | ✅ Implementado |
| Esquemas de Pensión (Afore, Voluntario, Ley 73) | Chart3 | — | ⚠️ No hay gráfica específica de esquemas |
| Saldo Final / Desacumulación | Chart4 | `CurvaDesacumulacion` | ✅ Implementado |
| Regla del 72 (8%, 12%, 14%) | Chart5 | `Regla72Table` + `ValorDineroTiempoChart` | ✅ Implementado |
| Índice de Solvencia | Chart7 | `IndiceSolvencia` | ✅ Implementado |
| Fuentes de Ingreso Retiro | Chart8 | `FuentesIngreso` | ✅ Implementado |
| **Potencial Apalancamiento** | Gráfica Potencial | — | ❌ **No implementado** |
| Conformación Patrimonio Total | — | `PatrimonioNetoCard` | ✅ Implementado |
| Trayectoria al momento del retiro | — | `TrayectoriaRetiroChart` | ✅ Implementado |

---

## Resumen: Faltantes

### 1. Potencial de Apalancamiento
- **Excel**: Pestaña "Potencial del balance" — Potencial de Apalancamiento, Potencial Apalancamiento Total, Capacidad de Apalancamiento, Índice Deuda Activo
- **ArIA**: `motorE.potencial_apalancamiento` existe pero **no se muestra** en la pantalla de resultados
- **Acción**: Añadir card o componente que muestre el potencial de apalancamiento

### 2. Output 3 (Acumulación)
- **Excel**: Saldo Acumulación, Meses de Reserva Acumulación, Pendiente por Ahorrar, Remanente para otros objetivos
- **ArIA**: `ReservaSemaforo` cubre solo reserva CP. No hay visualización de "Saldo Acumulación" ni "Remanente para otros objetivos"
- **Acción**: Evaluar si es necesario añadir o si ya está cubierto por otros outputs

### 3. Gráfica Esquemas de Pensión
- **Excel**: Chart3 — Afore, Voluntario, Ley 73
- **ArIA**: No hay gráfica específica de esquemas de pensión
- **Acción**: Opcional — los datos están en FuentesIngreso (pensión)

---

## Implementación actual en OutputPanel (orden alineado con Excel)

```
1. Dependencia financiera (modo pareja)
2. Output 1 — Análisis Ingreso/Gasto (DonutChart)
3. Output 2 — Reserva de Emergencia (ReservaSemaforo)
4. Output 3 — Saldo Acumulación (SaldoAcumulacionCard)
5. Regla del 72 (Regla72Table)
6. Output 6 — Grado de Avance al Retiro
7. Output 5 — Fuentes de Ingreso en Retiro
8. Déficit/Superávit Retiro
9. Curva de Desacumulación
10. Trayectoria al momento del retiro
11. Viabilidad de Objetivos + Legado Estimado
12. Patrimonio Neto
13. Nivel de Riqueza
14. Potencial de Apalancamiento
15. Índice de Solvencia
16. Valor Dinero en el Tiempo
17. Esquemas de Pensión
18. Output 7 — Protección Patrimonial
```

---

## Conclusión

| Categoría | Implementados | Faltantes |
|-----------|---------------|-----------|
| Outputs | 6/7 | 1 (Output 3 parcial) |
| Gráficas | 8/10 | 2 (Potencial Apalancamiento, Esquemas Pensión) |
| **Principal**: Potencial de Apalancamiento no se visualiza. |
