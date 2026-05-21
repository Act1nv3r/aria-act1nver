# Auditoría de Fórmulas: Excel vs ArIA Plataforma
**Fecha:** Mayo 2026 | **Versión Excel:** prototipo.balance.feb.20.2026 (V2) Completa MKT

---

## PASO 1 — MAPA DE CÁLCULOS DEL EXCEL POR BLOQUE DE OUTPUT

### Fuentes del Excel (12 hojas)

| # | Hoja | Rol |
|---|------|-----|
| 1 | Entrevista Patrimonio F. | **Inputs** del diagnóstico de flujo |
| 2 | Cálculos y Supuestos Edo.Res | **Motor** principal: flujo, retiro, reserva, protección |
| 3 | Desacumulación | **Motor** curva mes a mes (hasta 360 columnas) |
| 4 | Objetivos | **Motor** viabilidad de objetivos |
| 5 | Auxiliar | Catálogos, textos dinámicos para gráficas |
| 6 | Patrimonio Financiero | Presentación visual del diagnóstico |
| 7 | Entrevista Balance | **Inputs** del balance patrimonial |
| 8 | Cálculos y Supuestos Balance | **Motor** balance, apalancamiento, fondo de retiro |
| 9 | Balance | Presentación visual del balance |
| 10 | To do list | Recomendaciones y resumen ejecutivo |
| 11 | Patrimonio Neto | Benchmark por edad, índice liquidez |
| 12 | Potencial del balance | Análisis de apalancamiento detallado |

### Supuestos globales del Excel

| Parámetro | Valor | Celda |
|-----------|-------|-------|
| Tasa real anual | **1%** | CyS Edo.Res C4 |
| Tasa crecimiento AFORE/esquemas | **1%/12 mensual (≈12% anual ef.)** | Implícita en PMT de G30 |
| Edad de defunción default | **90 años** | CyS Balance C4 |
| Cap rate propiedades | **5%** | CyS Balance C5 |
| Costo seguro de vida por millón | **$7,000 MXN** | CyS Balance C6 |
| Benchmark reserva emergencia | **3 meses** de gastos básicos | CyS Edo.Res G13 |
| Retiro mínimo (para pensión voluntaria) | **60 años** (`MAX(60, EdadRetiro)`) | CyS Balance C23 |

---

### OUTPUT 1 — Análisis de Ingreso / Gasto (Donut chart)

**Hoja:** Cálculos y Supuestos Edo.Res | **Cols:** C16–C26, D23–D25

```
Ingresos Totales = Gastos_Básicos_fuente + Rentas + Otros_Ingresos

Gastos Básicos              = Entrevista.P19
Obligaciones Totales        = Entrevista.P21 + Entrevista.P23
Gastos Totales              = Gastos_Básicos + Obligaciones

% Gastos Básicos            = Gastos_Básicos / Ingresos_Totales
% Obligaciones              = Obligaciones / Ingresos_Totales
% Ahorro (capacidad)        = Capacidad_Ahorro / Ingresos_Totales
```

---

### OUTPUT 2 — Reserva de Emergencia (Corto Plazo)

**Hoja:** Cálculos y Supuestos Edo.Res | **Cols:** G13–G19

```
Reserva Deseada CP          = Gastos_Básicos × 3
Meses de Reserva CP         = Saldo_Líquido / Gastos_Básicos
Resultado                   = "Excedida" si Meses >= 3, "Insuficiente" si < 3
Pendiente por ahorrar CP    = MAX(Reserva_Deseada - Saldo_Líquido, 0)
Meses para cubrir CP        = Pendiente / Capacidad_Ahorro_Mensual
Remanente para objetivos    = MAX(Capacidad_Ahorro × (1 - Meses_para_cubrir), 0)
```

> **Nota:** `Saldo_Líquido` = solo la celda de liquidez (L29 de la Entrevista), NO incluye inversiones.

---

### OUTPUT 3 — Saldo de Acumulación / Remanente

**Hoja:** Cálculos y Supuestos Edo.Res | **Cols:** G22–G27

```
Saldo Acumulación           = Otras_Inversiones + Seguros_Acumulación
                            = Entrevista.L31 + Entrevista.L33
                            [NO incluye liquidez/efectivo — esos son Reserva CP]

Meses de Reserva Acum       = (Saldo_Acumulación / Gastos_Totales) / 12
                            [resultado en AÑOS: cuántos años de gastos totales cubre]

Resultado                   = "Excedido" si >= 1 año, "Insuficiente" si < 1 año

Longevidad de recursos      = EdadActual + Meses_Reserva_Acum
                            [edad estimada hasta la que cubren los ahorros actuales]
```

---

### OUTPUT 4 — Nivel de Riqueza / Benchmark por Edad

**Hoja:** Cálculos y Supuestos Edo.Res C47 + hoja Patrimonio Neto

```
NivelRiqueza (ratio)        = (Saldo_Acumulación / Gastos_Totales) / 12
                            = mismo valor que "Meses de Reserva Acumulación"
                            [IMPORTANTE: usa solo inversiones+seguros, NO Afore ni liquidez]

Gasto Anual                 = Gastos_Totales × 12

Lookup de nivel (hoja Patrimonio Neto):
    Compara NivelRiqueza contra la tabla de múltiplos por rango de edad:

    Edad | Suficiente | Mejor | Bien  | Genial | On fire
    25   | 0x         | 0.1x  | 0.25x | 0.4x   | 0.6x
    30   | 0.5x       | 0.75x | 1x    | 1.5x   | 2x
    35   | 1x         | 2x    | 3x    | 4x     | 6x
    40   | 2x         | 4x    | 6x    | 8x     | 10x
    45   | 3x         | 6x    | 8x    | 10x    | 13x
    50   | 4x         | 7x    | 9x    | 12x    | 15x
    55   | 5x         | 8x    | 11x   | 14x    | 17x
    60+  | 6x         | 9x    | 13x   | 16x    | 20x

    Etiqueta en texto (hoja Auxiliar):
    < 1   → "POR DEBAJO DEL PROMEDIO"
    1–3   → "POR ARRIBA DEL PROMEDIO"
    3–5   → "RICO"
    > 5   → "ACAUDALADO"
```

---

### OUTPUT 5 — Regla del 72

**Hoja:** Cálculos y Supuestos Edo.Res | **Cols:** M5–O7, X3–Z43

```
Años para duplicar @ 8%     = 72 / 8  = 9 años
Años para duplicar @ 12%    = 72 / 12 = 6 años
Años para duplicar @ 14%    = 72 / 14 ≈ 5.1 años

Monto base                  = Saldo_Líquido + Otras_Inversiones
                            = Entrevista.L29 + Entrevista.L31

Serie de duplicaciones:
    Año 0  → 1× Monto
    Año 9  → 2× Monto  (a 8%)
    Año 18 → 4× Monto  (a 8%)  |  Año 12 → 4× (a 12%)  |  Año 10.2 → 4× (a 14%)
    ... hasta 1024× Monto en 17 períodos de duplicación
```

---

### OUTPUT 6 — Pensión y Grado de Avance al Retiro

**Hoja:** Cálculos y Supuestos Edo.Res | **Filas:** G30–G34

```
Mensualidad Afore =
    PMT(1%/12, (90 - EdadRetiro)×12,
        SaldoAfore × (1 + 1%/12)^((EdadRetiro - EdadActual)×12),
        0, tipo=1) × -1
    [proyecta Afore a la edad de retiro, luego calcula mensualidad durante (90-retiro) meses,
     pago al INICIO del período (tipo=1)]

Mensualidad Voluntaria (PPR + Plan Privado + Otros Seguros Retiro) =
    PMT(1%/12, (90 - EdadRetiro)×12,
        SUM(PPR, PlanPrivado, OtrosSeguros) × (1 + 1%/12)^((EdadRetiro - EdadActual)×12),
        0, tipo=1) × -1

Pensión Ley 73 = input directo del asesor (mensualidad ya definida)

Mensualidad Total Actual    = Afore + Voluntaria + Ley73

Grado de Avance             = Mensualidad_Total_Actual / Mensualidad_Deseada
```

---

### OUTPUT 7 — Fuentes de Ingreso en Retiro

**Hoja:** Cálculos y Supuestos Edo.Res | **Filas:** G39–G46

```
Calidad de Vida Retiro      = MensualidadDeseada (input)
Propiedades en Renta        = Entrevista.I21 (input)
Negocio / Dividendos        = Entrevista.I23 (input)
Esquemas de Pensión         = Mensualidad_Total_Actual (de OUTPUT 6)

Mensualidad Total Disponible = Rentas + Dividendos + Esquemas_Pensión
Pendiente (brecha)           = MAX(MensualidadDeseada - Total_Disponible, 0)
% pendiente                  = Pendiente / MensualidadDeseada
```

---

### OUTPUT 8 — Déficit / Superávit de Retiro

**Hoja:** Cálculos y Supuestos Edo.Res | **Filas:** G49–G54

```
Pasivo del Retiro VF =
    Pendiente_Mensual × (1 - (1 + TasaReal/12)^(-(90 - EdadRetiro)×12)) / (TasaReal/12)
    [VA de la anualidad del déficit mensual, calculada en el momento del retiro]

Pasivo del Retiro VP (hoy) =
    PV(TasaReal/12, (EdadRetiro - EdadActual)×12, 0, PasivoVF, tipo=1) × -1
    [descuenta el pasivo VF a valor presente de hoy]

Capital Humano VF =
    FV(TasaReal/12, (EdadRetiro - EdadActual)×12, -Capacidad_Ahorro, 0, tipo=0)
    [proyecta las aportaciones mensuales futuras al momento del retiro]

Capital Humano VP (hoy) =
    PV(TasaReal/12, (EdadRetiro - EdadActual)×12, 0, CapitalHumanoVF, tipo=1) × -1

Patrimonio Financiero de Acumulación =
    Saldo_Líquido + Otras_Inversiones + Seguros_Acumulación
    [excluye: AFORE, PPR, plan privado — esos son "esquemas"]

Activos + Capital Humano VP = Patrimonio_Acum_VP + CapitalHumano_VP

Déficit / Superávit VP      = (Patrimonio_Acum + CapitalHumano_VP) - PasivoRetiro_VP
    [positivo = superávit; negativo = déficit real]

Ahorro mensual para cubrir déficit =
    MAX(-PMT(TasaReal/12, (EdadRetiro-EdadActual)×12, -Patrimonio_Acum, PasivoVF, tipo=0), 0)
```

---

### OUTPUT 9 — Curva de Desacumulación / Mensualidad Posible

**Hoja:** Desacumulación | **Resumen:** I3–I8

```
Saldo al inicio de jubilación =
    SUMIFS de la curva: saldo acumulado en el mes 1 de EdadRetiro
    [incluye: Patrimonio_Acum proyectado + Esquemas_Pensión proyectados]

Años de Jubilación          = 90 - EdadRetiro
Meses de Jubilación         = Años × 12

MENSUALIDAD POSIBLE =
    PMT(TasaReal/12, MesesJubilación, SaldoInicioJubilación, 0, tipo=0) × -1
    [mensualidad máxima extraíble con tasa real durante todos los meses de jubilación]
    [tipo=0 = pagos al FIN del período]

Mecánica mes a mes:
    Saldo_Final[t] = (Saldo_Inicial[t] + Aportacion[t] - Mensualidad_Retiro[t])
                     × (1 + TasaReal/12)
    [fase acumulación: Mensualidad_Retiro = 0; fase desacumulación: Aportacion = 0]
```

> **OJO:** La hoja de Desacumulación usa `tipo=0` (pagos al final del período) para la mensualidad posible, pero `tipo=1` (inicio de período) para calcular las mensualidades de Afore y Voluntaria en OUTPUT 6.

---

### OUTPUT 10 — Patrimonio Neto

**Hoja:** Balance | **Celdas:** BD25 / CN25

```
Activos Financieros         = Reserva_CP + Acumulación + Seguros_Acumulación
                            + Afore + PPR + Plan_Privado + Otros_Seguros_Retiro

Activos No Financieros      = Casa + Inmuebles_Renta + Tierra + Negocio + Herencia

Obligaciones Totales        = Hipoteca + Saldo_Planes_Pendiente + Compromisos_Futuros

Patrimonio Neto             = Activos_Financieros + Activos_No_Financieros - Obligaciones

% Activos Financieros       = Activos_Fin / (Activos_Fin + Activos_No_Fin)
% Activos No Financieros    = Activos_No_Fin / (Activos_Fin + Activos_No_Fin)

Patrimonio Financiero Neto  = Activos_Financieros - Obligaciones
    [separa el patrimonio que "trabaja" del que está comprometido en activos reales]
```

---

### OUTPUT 11 — Índice de Solvencia

**Hoja:** Cálculos y Supuestos Balance | **Celda:** Z39

```
Base de cálculo del Excel:
    Numerador   = (Activos_Fin + Activos_No_Fin - Herencia - Activos_Retiro) - Obligaciones
    Denominador = (Activos_Fin + Activos_No_Fin - Herencia - Activos_Retiro)

    Índice Solvencia = Numerador / Denominador
                     = 1 - (Obligaciones / BaseActivos)
    [EXCLUYE del denominador: activos de retiro (AFORE+PPR+Plan+Otros) y Herencia]
    [mide qué % de los activos "disponibles" son libres de deuda]

Escala del Excel (Z39):
    0%  – 30%  → "Bajo"        → sugiere incrementar para apalancarse
    30% – 50%  → "Suficiente"
    50% – 70%  → "Alto"
    > 70%       → "Excelente"
```

---

### OUTPUT 12 — Potencial de Apalancamiento

**Hoja:** Balance Y74 + hoja Potencial del balance

```
Potencial Apalancamiento Total =
    ((Activos_Fin + Activos_No_Fin - Activos_Retiro - Herencia) × 0.5) - Obligaciones
    [50% del patrimonio neto disponible (excl. retiro y herencia), menos deuda actual]

Desglose por tipo de activo (hoja Potencial del balance):
    Crédito máx sobre activos líquidos  = Acumulación × 0.60
    Crédito máx sobre bienes inmuebles  = (Casa + Inmuebles + Tierra) × 0.50

    Crédito recomendado financiero      = % fin × Potencial_Apalancamiento
    Crédito recomendado inmobiliario    = % inmob × Potencial_Apalancamiento
    (% distribución = proporción de cada activo en el total)

Índice Deuda/Activo actual (D24):
    = Obligaciones / (Acumulación + Casa + Inmuebles_Renta + Tierra + Reserva)
    [excluye AFORE, Herencia, Negocio, Seguros Retiro de la base]

Clasificación Índice D/A:
    > 0.5   → "Elevado"
    0.4–0.5 → "Aceptable"
    0.3–0.4 → "Recomendable"
    < 0.3   → "Muy saludable"
```

---

### OUTPUT 13 — Valor del Dinero en el Tiempo

**Hoja:** Cálculos y Supuestos Edo.Res | **Cols X–Z** + hoja Patrimonio Financiero

```
Monto base                  = Saldo_Líquido + Otras_Inversiones

Serie de duplicaciones (Regla del 72):
    @ 8%:  duplica años 9, 18, 27, 36... 
    @ 12%: duplica años 6, 12, 18, 24...
    @ 14%: duplica años 5.14, 10.28, 15.43...

    Valor_año_k = Monto_base × 2^(k)
    donde k = número de duplicaciones al año t

[La tabla visual muestra el monto base en el eje Y en las filas donde ocurre cada duplicación,
 permitiendo ver visualmente cuándo se duplica en cada tasa]
```

---

### OUTPUT 14 — Suma Asegurada Sugerida (Protección Patrimonial)

**Hoja:** Cálculos y Supuestos Edo.Res | **Celdas:** C50–C53, G67–G71

```
Flag Activo (C50)           = SI(EdadActual < 65, 1, 0)
Flag Dependientes (C45)     = SI(DependientesEconómicos = "No", 0, 1)

NivelRiqueza                = mismo ratio del OUTPUT 4

Cobertura en múltiplos (C52) =
    MAX(SI(NivelRiqueza < 3, 3 - NivelRiqueza, 5 - NivelRiqueza), 0)
    × Flag_Dependientes × Flag_Activo

    [Lógica:
     - Si NivelRiqueza < 3: necesita cubrir la brecha hasta 3x, vía seguro de vida
     - Si NivelRiqueza >= 3: el múltiplo sugerido decrece (la riqueza es colchón)
     - Sin dependientes → cobertura = 0
     - Mayores de 65 → cobertura = 0]

Suma Asegurada Sugerida (C53) = Cobertura_Múltiplos × Gastos_Totales × 12
    [resultado en pesos MXN anuales de cobertura]

Costo Prima Anual (G67) = (Suma_Asegurada × $7,000) / 1,000,000

Seguro de Hogar (G70):
    = (Renta_Propiedad / 5%) × 12 × Flag_Sin_Seguro
    [estima valor de la propiedad vía cap rate, aplica si no tiene seguro]

SGMM estimado (G71):
    = EdadActual × (2,224,556 / 10,000)
    [estimación lineal proporcional a la edad]
```

---

### OUTPUT 15 — Viabilidad de Objetivos y Legado Estimado

**Hoja:** Objetivos + hoja Patrimonio Financiero

```
Flujo disponible para objetivos =
    MAX(Capacidad_Ahorro - Aportación_Retiro_Necesaria, 0)

Para cada objetivo (ordenados por plazo ascendente):
    Saldo[t+1] = Saldo[t] × (1 + TasaReal/12) + Flujo_Mensual
    Viable = (Saldo al plazo >= Meta_Objetivo)
    Si viable: Saldo -= Monto_Objetivo

Legado Estimado =
    Saldo_Final_Seguros_al_90 + Valor_activos_no_vendidos
    = Balance de cuentas financieras + Valor_residual_inmuebles_no_liquidados

Clasificación del producto de legado:
    $500K–$10M → "Blindaje Patrimonial"
    > $10M     → "Fideicomiso"
    < $500K    → "No aplica"
```

---

## PASO 2 — TABLA COMPARATIVA: EXCEL vs PLATAFORMA ArIA

> **Columnas:**
> - **Output:** nombre del bloque de resultado
> - **Fórmula Excel (exacta):** qué calcula el Excel y cómo
> - **Fórmula ArIA Plataforma:** qué calcula realmente el código (motors)
> - **¿Coincide?:** ✅ Igual / ⚠️ Diferente con justificación / ❌ Diferente sin justificación / 🔴 Crítico
> - **Notas / Impacto**

---

### BLOQUE 1: ANÁLISIS DE INGRESO / GASTO

| # | Output | Fórmula Excel | Fórmula ArIA (Motor A) | ¿Coincide? | Impacto |
|---|--------|---------------|------------------------|-----------|---------|
| 1.1 | Ingresos Totales | `ahorro + rentas + otros_ingresos` | `ahorro + rentas + otros` | ✅ Igual | — |
| 1.2 | Gastos Totales | `gastos_básicos + obligaciones_totales` | `gastos_basicos + obligaciones + creditos` | ⚠️ ArIA separa `obligaciones` y `creditos`; Excel los suma en `obligaciones_totales` | Diferencia de nomenclatura — si el frontend suma ambos, el resultado es igual |
| 1.3 | % Gastos Básicos | `gastos_básicos / ingresos_totales` | `gastos_basicos / ingresos_totales` | ✅ Igual | — |
| 1.4 | % Obligaciones | `obligaciones / ingresos_totales` | `obligaciones / ingresos_totales` | ✅ Igual | — |
| 1.5 | % Ahorro / Capacidad | `ahorro / ingresos_totales` | `ahorro / ingresos_totales` | ✅ Igual | — |

---

### BLOQUE 2: RESERVA DE EMERGENCIA

| # | Output | Fórmula Excel | Fórmula ArIA (Motor A) | ¿Coincide? | Impacto |
|---|--------|---------------|------------------------|-----------|---------|
| 2.1 | Reserva deseada | `gastos_básicos × 3` | `gastos_basicos × 3` | ✅ Igual | — |
| 2.2 | Meses cubiertos | `liquidez / gastos_básicos` | `liquidez / gastos_basicos` | ✅ Igual | — |
| 2.3 | Resultado semáforo | `"Cubierta" si meses ≥ 3` | `"Cubierta" si meses_cubiertos ≥ 3` | ✅ Igual | — |
| 2.4 | Remanente para objetivos | `MAX(capacidad_ahorro × (1 - meses_para_cubrir), 0)` | `remanente = ahorro` (input directo, sin calcular) | 🔴 **Crítico** | **El Excel calcula el remanente neto después de cubrir la reserva faltante. ArIA devuelve simplemente el valor `ahorro` sin descontar nada. Si hay déficit en reserva, el remanente debería ser menor.** |
| 2.5 | Meses para cubrir déficit | `pendiente / capacidad_ahorro` | No implementado | ❌ No existe en ArIA | Sin impacto visual si no se muestra, pero afecta el remanente |

---

### BLOQUE 3: SALDO DE ACUMULACIÓN

| # | Output | Fórmula Excel | Fórmula ArIA | ¿Coincide? | Impacto |
|---|--------|---------------|--------------|-----------|---------|
| 3.1 | Saldo Acumulación | `inversiones + seguros_acumulación` (excluye liquidez y retiro) | No tiene motor dedicado — usa `inversiones` en Motor B como parte del total | ⚠️ **Diferente lógica de agrupación** | Excel separa activos en 3 cubetas: (1) Liquidez→CP, (2) Inversiones+Seguros→Acumulación, (3) AFORE+PPR+etc→Retiro. ArIA mezcla todo en `patrimonio_financiero_total` |
| 3.2 | Años cubiertos (nivel riqueza base) | `(inversiones + seguros_acum) / (gastos_totales × 12)` | `patrimonio_financiero_total / gasto_anual` (incluye AFORE, PPR, liquidez) | 🔴 **Crítico** | Ver Bloque 4 |
| 3.3 | Longevidad de recursos | `EdadActual + años_cubiertos` | No está como output separado | ❌ No existe | Visual: podría mostrarse fácilmente |

---

### BLOQUE 4: NIVEL DE RIQUEZA / BENCHMARK

| # | Output | Fórmula Excel | Fórmula ArIA (Motor B) | ¿Coincide? | Impacto |
|---|--------|---------------|------------------------|-----------|---------|
| 4.1 | Base del ratio | `(inversiones + seguros_acumulación) / (gastos_totales × 12)` **— excluye liquidez, AFORE, PPR, Plan Privado** | `(liquidez + inversiones + dotales + afore + ppr + plan_privado + seguros_retiro) / gasto_anual` **— incluye TODO el patrimonio financiero** | 🔴 **Crítico — diferencia estructural** | **El Excel mide cuántos años de gasto cubre tu patrimonio de acumulación "disponible". ArIA mide el patrimonio financiero completo (incluyendo fondos ilíquidos de retiro). Esto sobreestima el nivel de riqueza en ArIA para perfiles con mucho AFORE/PPR y pocas inversiones liquidas.** |
| 4.2 | Tabla benchmark por edad | Tabla de 8 filas × 5 columnas (valores en múltiplos de gasto anual) | Misma tabla implementada en `BENCHMARK_RIQUEZA` | ✅ Igual en estructura | ⚠️ Los thresholds de la columna "genial" difieren: Excel muestra 13x para edad 45, ArIA tiene 12x (ver abajo) |
| 4.3 | Tabla benchmark — valores exactos | Edad 45: [3, 6, 8, **10**, **13**] | Motor B tiene: [3, 6, 8, **10**, **12**] | ⚠️ Diferencia en "on-fire" edad 45 | El Excel usa 13x y ArIA 12x para "on fire" a los 45 años |
| 4.4 | Tabla benchmark — valores exactos | Edad 55: [5, 8, 11, 14, **17**] | Motor B tiene: [5, 8, 11, 14, **18**] | ⚠️ Diferencia en "on-fire" edad 55 | Excel: 17x, ArIA: 18x |
| 4.5 | Etiqueta texto nivel | < 1 → "POR DEBAJO", 1–3 → "POR ARRIBA", 3–5 → "RICO", >5 → "ACAUDALADO" | Etiquetas: "suficiente", "mejor", "bien", "genial", "on-fire" | ⚠️ Diferente esquema de etiquetas | ArIA usa etiquetas directas de la tabla de benchmark; Excel usa una escala textual diferente |
| 4.6 | Edge case: ratio < umbral mínimo | Valor calculable (por debajo del mínimo de suficiente) | Si ratio < `row[1]`, `nivel_riqueza` queda en `"suficiente"` por valor inicial | ❌ **Bug en ArIA** | Un cliente con ratio 0 verá "suficiente" en lugar de "por debajo" |

---

### BLOQUE 5: REGLA DEL 72

| # | Output | Fórmula Excel | Fórmula ArIA | ¿Coincide? | Impacto |
|---|--------|---------------|--------------|-----------|---------|
| 5.1 | Años para duplicar | `72 / tasa_porcentual` | Mismo: `72 / tasa` | ✅ Igual | — |
| 5.2 | Monto base | `liquidez + otras_inversiones` (excluye AFORE, PPR) | No especificado — usa `inversiones + liquidez` del Motor A o B | ⚠️ Revisar | Si incluye AFORE, el monto base es mayor de lo que el Excel muestra |
| 5.3 | Serie de duplicaciones | Factores 1, 2, 4, 8, 16... con años según tasa | Misma lógica en `Regla72Table` | ✅ Igual | — |

---

### BLOQUE 6: PENSIÓN Y GRADO DE AVANCE

| # | Output | Fórmula Excel | Fórmula ArIA (Motor C) | ¿Coincide? | Impacto |
|---|--------|---------------|------------------------|-----------|---------|
| 6.1 | Mensualidad Afore | `PMT(1%/12, (90-retiro)×12, Afore × (1+1%/12)^n, 0, tipo=1) × -1` | `PMT(tasa, n, SaldoEsquemas × (1+tasa)^n, 0, tipo=0) × -1` (Python) / split 70/30 (TypeScript) | 🔴 **Doble diferencia crítica** | **(1) Excel usa `tipo=1` (pago inicio de período); ArIA usa `tipo=0` (fin de período) → diferencia del ~0.08% por período acumulada en 360 meses.** **(2) El Excel separa AFORE de voluntarios; Python los mezcla en un solo pool `saldo_esquemas`; TypeScript hace un split 70/30 arbitrario si no recibe los campos individuales.** |
| 6.2 | Mensualidad Voluntaria | `PMT(1%/12, (90-retiro)×12, (PPR+Plan+Otros) × (1+1%/12)^n, 0, tipo=1) × -1` | Incluida en el pool de `saldo_esquemas` (Python) o en el 30% arbitrario (TS) | 🔴 **Crítico cuando hay PPR/Plan sin AFORE** | Si un cliente tiene $500K en PPR y $0 en AFORE, ArIA (Python) lo trata igual que si fueran $350K AFORE + $150K PPR |
| 6.3 | Pensión Ley 73 | Input directo del asesor | `ley_73` campo directo | ✅ Igual | — |
| 6.4 | Mensualidad Total | `Afore + Voluntaria + Ley73` | `ley73 + rentas + mensualidad_esquemas` | ⚠️ ArIA incluye **rentas** en la mensualidad total; Excel las suma por separado en Fuentes de Ingreso | Leve: depende de cómo se muestre en UI — si rentas se suma aquí y también en Fuentes, se duplica |
| 6.5 | Grado de Avance | `Mensualidad_Total / Mensualidad_Deseada` | `total_mensual / mensualidad_deseada` | ✅ Mismo cociente | Impactado por diferencias en el numerador (6.1–6.4) |

---

### BLOQUE 7: FUENTES DE INGRESO EN RETIRO

| # | Output | Fórmula Excel | Fórmula ArIA (Motor C) | ¿Coincide? | Impacto |
|---|--------|---------------|------------------------|-----------|---------|
| 7.1 | Propiedades en renta | Input directo | `rentas` input | ✅ Igual | — |
| 7.2 | Negocio / Dividendos | Input directo | `ingresos_negocio` (solo TS) | ⚠️ Python no tiene este campo | Si el negocio es fuente de retiro, Python lo ignora |
| 7.3 | Esquemas de Pensión | Afore + Voluntaria + Ley73 (PMT tipo=1) | `mensualidad_esquemas` del Motor C | ⚠️ Heredada de 6.1–6.2 | Mismas discrepancias de tipo=0 vs tipo=1 |
| 7.4 | Mensualidad posible del patrimonio | No aparece en este bloque del Excel (es el OUTPUT 9) | ArIA incluye `mensualidad_posible` en `fuentes_ingreso` | ⚠️ El Excel separa: Fuentes (OUTPUT 7) muestra solo rentas+esquemas; el OUTPUT 9 (Desacumulación) calcula la mensualidad del patrimonio | Si ArIA suma mensualidad_posible al total de fuentes, el grado de avance se sobreestima |

---

### BLOQUE 8: DÉFICIT / SUPERÁVIT DE RETIRO

| # | Output | Fórmula Excel | Fórmula ArIA | ¿Coincide? | Impacto |
|---|--------|---------------|--------------|-----------|---------|
| 8.1 | Pasivo del Retiro VP | `PV(1%/12, n_acumulación, 0, PasivoVF, tipo=1) × -1` | No calculado en Motor C (retorna `deficit_mensual` directo) | ❌ **No implementado** | ArIA muestra el déficit mensual nominal, no el valor presente del pasivo total |
| 8.2 | Capital Humano VP | `PV(1%/12, n, 0, FV(1%/12, n, -ahorro, 0, 0), tipo=1) × -1` | `calcularCapitalHumano` solo en TS, usa tasa 6.5% (≠ 1%) | 🔴 **Crítico: tasa diferente** | El Excel descuenta el capital humano a 1% real. ArIA usa 6.5% — esto produce un VP de capital humano **mucho menor** en ArIA, haciendo que el déficit parezca mayor |
| 8.3 | Aportación mensual necesaria para cubrir déficit | `MAX(-PMT(1%/12, n, -Patrimonio, PasivoVF, tipo=0), 0)` | `aportacion_necesaria` calculado en TS; **Python siempre devuelve `None`** | ❌ **No disponible en backend Python** | El backend no puede calcular este valor — solo el frontend lo tiene |

---

### BLOQUE 9: CURVA DE DESACUMULACIÓN / MENSUALIDAD POSIBLE

| # | Output | Fórmula Excel | Fórmula ArIA (Motor C) | ¿Coincide? | Impacto |
|---|--------|---------------|------------------------|-----------|---------|
| 9.1 | Saldo al inicio de jubilación | Proyecta Patrimonio_Acum + Esquemas a EdadRetiro con tasa 1%/mes | `patrimonio_total × (1 + tasa)^meses_acumulacion` | ✅ Misma mecánica | — |
| 9.2 | Mensualidad posible | `PMT(1%/12, meses_jubilación, saldo_inicio, 0, tipo=0) × -1` | `saldo × tasa / (1 - (1+tasa)^(-n))` (equivalente a PMT tipo=0) | ✅ Igual matemáticamente | — |
| 9.3 | Curva mes a mes (acumulación) | `Saldo[t+1] = (Saldo[t] + Aportación) × (1 + tasa/12)` | `Saldo[t+1] = Saldo[t] × (1 + tasa) + aportacion` (aproximación final) | ✅ Equivalente | Diferencia de centavos por redondeo |
| 9.4 | Curva mes a mes (desacumulación) | `Saldo[t+1] = (Saldo[t] - Mensualidad) × (1 + tasa/12)` | `Saldo[t+1] = max(0, Saldo[t] × (1+tasa) - mensualidad_posible)` | ✅ Equivalente | — |
| 9.5 | Curva en frontend (calcularTimeline) | Mismo que Motor C | Usa `gastoNeto = mensualidad_deseada - pension - rentas` como retiro, **no** `mensualidad_posible` | ⚠️ **La curva del frontend y la del Motor C son inconsistentes** | Si el cliente tiene pensión, la curva del frontend dura más de lo que Motor C predice |

---

### BLOQUE 10: PATRIMONIO NETO

| # | Output | Fórmula Excel | Fórmula ArIA (Motor E) | ¿Coincide? | Impacto |
|---|--------|---------------|------------------------|-----------|---------|
| 10.1 | Activos Financieros | `liquidez + inversiones + dotales + afore + ppr + plan_privado + seguros_retiro` | `liquidez + inversiones + dotales + afore + ppr + plan_privado + seguros_retiro` | ✅ Igual | — |
| 10.2 | Activos No Financieros | `casa + inmuebles + tierra + negocio + herencia` | `casa + inmuebles_renta + tierra + negocio + herencia` | ✅ Igual | — |
| 10.3 | Obligaciones | `hipoteca + saldo_planes + compromisos` | `hipoteca + saldo_planes + compromisos` | ✅ Igual | — |
| 10.4 | Patrimonio Neto | `activos_fin + activos_no_fin - obligaciones` | `activos_total - pasivos_total` | ✅ Igual | — |
| 10.5 | % distribución activos | `financiero / total_activos` | No calculado como porcentaje en Motor E | ⚠️ Visual | Sin impacto en cálculos, solo en display |

---

### BLOQUE 11: ÍNDICE DE SOLVENCIA

| # | Output | Fórmula Excel | Fórmula ArIA (Motor E) | ¿Coincide? | Impacto |
|---|--------|---------------|------------------------|-----------|---------|
| 11.1 | Base del índice | `(Activos_Fin + Activos_No_Fin - Herencia - Activos_Retiro)` → **excluye herencia y activos de retiro** | `activos_total` → **incluye todo** | 🔴 **Crítico — base diferente** | **Un cliente con $5M en AFORE y $1M en bienes: Excel excluye el AFORE del cálculo de solvencia (es ilíquido, no garantiza deuda); ArIA lo incluye → el índice de ArIA será mayor (más "solvente") que el del Excel** |
| 11.2 | Fórmula del índice | `1 - (Obligaciones / BaseActivos_excl_retiro_herencia)` | `1 - (pasivos_total / activos_total)` | 🔴 **Diferente denominador** | Misma fórmula estructural pero denominador distinto — resultado diverge para perfiles con AFORE alto |
| 11.3 | Escala / clasificación | 0–30% = Bajo, 30–50% = Suficiente, 50–70% = Alto, >70% = Excelente | ratio (deuda/activo): >0.5→Crítico, >0.4→Elevado, >0.3→Aceptable, >0.1→Recomendable, else→Muy saludable | 🔴 **Escala completamente diferente** | **El Excel mide el % libre de deuda (índice solvencia positivo); ArIA mide el ratio de endeudamiento (índice deuda/activo). Son inversamente proporcionales, pero los rangos y etiquetas no corresponden. Un cliente con índice 0.25 en ArIA es "Recomendable"; en Excel ese mismo cliente tendría índice solvencia 75% = "Excelente"** |

---

### BLOQUE 12: POTENCIAL DE APALANCAMIENTO

| # | Output | Fórmula Excel | Fórmula ArIA (Motor E) | ¿Coincide? | Impacto |
|---|--------|---------------|------------------------|-----------|---------|
| 12.1 | Potencial total | `(Activos_excl_Retiro_Herencia × 0.5) - Obligaciones` → **50% de activos disponibles menos deuda** | `(liquidez + inversiones) × 0.60 + (casa + inmuebles + tierra) × 0.50` → **LTV diferenciado por tipo** | 🔴 **Fórmula completamente diferente** | **El Excel aplica un LTV global del 50% al patrimonio neto disponible. ArIA aplica LTV diferenciados: 60% para activos financieros líquidos y 50% para inmuebles, sin restar la deuda existente. Esto produce montos de "potencial" completamente diferentes — en ArIA el resultado siempre es positivo aunque el cliente esté muy endeudado.** |
| 12.2 | Crédito sobre activos líquidos | `Acumulación × 0.60` | `(liquidez + inversiones) × 0.60` | ⚠️ Diferencia menor | Excel usa solo "Acumulación" (una celda); ArIA usa liquidez+inversiones |
| 12.3 | Crédito sobre inmuebles | `(Casa + Inmuebles + Tierra) × 0.50` | `(casa + inmuebles_renta + tierra) × 0.50` | ✅ Igual | — |

---

### BLOQUE 13: VALOR DEL DINERO EN EL TIEMPO

| # | Output | Fórmula Excel | Fórmula ArIA | ¿Coincide? | Impacto |
|---|--------|---------------|--------------|-----------|---------|
| 13.1 | Monto base | `liquidez + otras_inversiones` (excluye AFORE) | `inversiones + liquidez` en Regla72Table | ✅ Sustancialmente igual | — |
| 13.2 | Duplicaciones | `Monto × 2^k` en los años según la tasa | `Monto × 2^k` | ✅ Igual | — |

---

### BLOQUE 14: PROTECCIÓN PATRIMONIAL — SUMA ASEGURADA

| # | Output | Fórmula Excel | Fórmula ArIA (Motor F) | ¿Coincide? | Impacto |
|---|--------|---------------|------------------------|-----------|---------|
| 14.1 | Suma asegurada sugerida | `MAX(3 - NivelRiqueza, 0) × Dependientes × GastosTotales × 12` → **función de NivelRiqueza y gastos** | `patrimonio_neto × 0.70` → **70% del patrimonio neto** | 🔴 **Fórmula completamente diferente** | **El Excel basa la cobertura en la brecha de riqueza y el flujo de gastos (cuánto necesita el dependiente si el titular falta). ArIA basa la cobertura en el patrimonio neto total. Para un cliente con poco patrimonio pero gastos altos, el Excel recomendará más cobertura que ArIA. Para un cliente rico, el Excel recomienda 0 cobertura; ArIA siempre recomienda el 70%.** |
| 14.2 | Flag por dependientes | Si sin dependientes → cobertura = 0 | `if dependientes AND NOT seguro_vida` → solo recomienda si tiene dependientes | ✅ Igual en condición | — |
| 14.3 | Flag por edad (>65) | Si edad >= 65 → cobertura = 0 | No tiene flag de edad | ❌ ArIA puede recomendar seguro a cliente de 70 años | |
| 14.4 | Seguro de hogar | `(renta_mensual_propiedad / 5%) × 12` si no está asegurado | `inmuebles_total × 1.0` (valor total de inmuebles como base) | 🔴 **Metodología diferente** | **Excel estima el valor del inmueble vía cap rate sobre la renta (más preciso si se tiene renta). ArIA usa el valor declarado directamente.** |
| 14.5 | Costo prima de vida | `(suma_asegurada × $7,000) / 1,000,000` | `(suma_asegurada / 1,000,000) × 7,000` | ✅ Igual | — |
| 14.6 | SGMM estimado | `EdadActual × (2,224,556 / 10,000)` → escalado por edad | `30,000 si edad >= 50; 15,000 si edad < 50` → simplificado | ⚠️ Simplificado en ArIA | Excel da un valor continuo por edad; ArIA da dos valores discretos |

---

### BLOQUE 15: VIABILIDAD DE OBJETIVOS Y LEGADO

| # | Output | Fórmula Excel | Fórmula ArIA (Motor D) | ¿Coincide? | Impacto |
|---|--------|---------------|------------------------|-----------|---------|
| 15.1 | Acumulación mes a mes | `Saldo[t+1] = (Saldo[t] + Aportación_Mensual) × (1 + TasaReal/12)` | `saldo = saldo + aportacion + saldo × tasa_mensual` (equivalente) | ✅ Igual | — |
| 15.2 | Viabilidad objetivo k | `Saldo_al_plazo >= Meta_k` | `saldo >= objetivo.monto` | ✅ Igual | — |
| 15.3 | Legado estimado | `Saldo_seguros_al_90 + Valor_activos_no_vendidos` | `legado = max(0, saldo_retiro × (1+tasa)^meses_jubilacion)` → **solo proyecta el saldo de acumulación** | ⚠️ **ArIA no considera el valor de los activos no financieros en el legado** | Para clientes con casa o inmuebles, el legado real es mucho mayor que lo que ArIA reporta |
| 15.4 | Flujo disponible para objetivos | `MAX(CapacidadAhorro - AportaciónRetiro, 0)` | `aportacion_mensual` input directo del usuario | ⚠️ En ArIA el asesor decide qué aportación asignar; en Excel se calcula como el residual | Diferencia de diseño — ArIA es más flexible pero menos automatizado |

---

## RESUMEN EJECUTIVO DE DISCREPANCIAS

### 🔴 CRÍTICAS — Resultados matemáticamente incorrectos o muy diferentes al Excel

| # | Output afectado | Problema | Urgencia |
|---|----------------|---------|---------|
| C1 | **Nivel de Riqueza** | ArIA incluye AFORE, PPR y plan privado en el ratio; el Excel los excluye. Sobreestima nivel de riqueza para clientes con fondos de retiro ilíquidos. | Alta |
| C2 | **Índice de Solvencia** | Diferente base de cálculo (ArIA incluye retiro y herencia) + escala completamente diferente. Un cliente con 75% de índice en Excel aparece "Recomendable" en ArIA. | Alta |
| C3 | **Potencial de Apalancamiento** | Fórmulas distintas. Excel usa 50% del patrimonio neto disponible menos deuda. ArIA usa LTV diferenciados sin restar la deuda. | Alta |
| C4 | **Suma Asegurada Sugerida** | Excel: función de NivelRiqueza y gastos anuales. ArIA: 70% del patrimonio neto. Lógica financiera completamente diferente. | Alta |
| C5 | **Tipo de pago en PMT (Pensión/Mensualidad posible)** | Excel usa `tipo=1` (inicio período) para AFORE y voluntarios. ArIA usa `tipo=0` (fin período). La diferencia acumulada en 360 meses puede ser ~8–12% del valor de la mensualidad. | Media-Alta |
| C6 | **Capital Humano VP** | ArIA usa tasa de descuento 6.5%; Excel usa la tasa real de 1%. El VP del capital humano en ArIA será ~5–6× menor que en Excel — exagerando el déficit de retiro percibido. | Alta |
| C7 | **Remanente (Motor A)** | ArIA retorna `ahorro` (input) sin descontar el déficit de reserva de emergencia. El Excel calcula el remanente real disponible. | Media |

### ⚠️ DIFERENCIAS CON JUSTIFICACIÓN — El diseño de ArIA difiere intencionalmente

| # | Output afectado | Diferencia | Justificación posible |
|---|----------------|-----------|----------------------|
| D1 | **Grado de Avance** | ArIA incluye `rentas` en el numerador junto con pensión; Excel las separa | ArIA unifica todos los ingresos fijos en retiro para una métrica más clara |
| D2 | **Legado Estimado** | ArIA solo proyecta activos financieros; Excel incluye valor residual de inmuebles | ArIA no modela eventos de venta de activos no financieros |
| D3 | **SGMM estimado** | Dos valores discretos (30K / 15K) vs escala continua por edad | Simplificación aceptable para prototipo |
| D4 | **Flujo para objetivos** | ArIA usa input del asesor; Excel calcula como residual automático | Más flexible para el asesor, menos prescriptivo |
| D5 | **Curva timeline vs Motor C** | `calcularTimeline` retira `gastoNeto`; Motor C retira `mensualidad_posible` completa | Timeline modela el "saldo real considerando ingresos fijos"; Motor C modela el "potencial máximo de retiro" |

### ❌ AUSENTES — Funcionalidades del Excel no implementadas en ArIA

| # | Output | Presente en Excel | Presente en ArIA | Impacto |
|---|--------|------------------|-----------------|---------|
| A1 | Pasivo del Retiro VP | ✅ | ❌ | Solo se muestra déficit mensual nominal, no el monto total |
| A2 | Aportación mensual necesaria (backend) | ✅ | Solo frontend TS | Backend no puede calcularlo |
| A3 | Longevidad de recursos | ✅ | ❌ | Dato de enganche interesante para el cliente |
| A4 | Meses para cubrir reserva CP | ✅ | ❌ | Afecta el remanente correcto |
| A5 | Seguro de hogar basado en cap rate | ✅ | ❌ (usa valor directo) | Menos preciso sin renta conocida |
| A6 | Flag edad >= 65 en seguro de vida | ✅ | ❌ | Puede recomendar seguro a adultos mayores |
| A7 | Legado con valor inmuebles | ✅ | ❌ | Subvalúa el legado para clientes con propiedades |
| A8 | Potencial apalancamiento descontando deuda | ✅ | ❌ | ArIA puede mostrar potencial positivo a clientes muy endeudados |

---

## PLAN DE ACCIÓN RECOMENDADO (prioridad)

### 🚨 Prioridad 1 — Correcciones Matemáticas Inmediatas

1. **Motor B (Nivel de Riqueza):** Cambiar la base del ratio para usar solo `inversiones + seguros_acumulación`, excluyendo AFORE, PPR, plan_privado, liquidez
2. **Motor E (Índice de Solvencia):** Cambiar denominador para excluir activos de retiro y herencia; actualizar escala de clasificación al esquema del Excel
3. **Motor E (Potencial Apalancamiento):** Cambiar a `(activos_disponibles × 0.5) - obligaciones`
4. **Motor F (Suma Asegurada):** Cambiar a `MAX(3 - NivelRiqueza, 0) × flag_dep × gastos_totales × 12`; agregar flag edad >= 65
5. **Motor A (Remanente):** Calcular como `MAX(capacidad_ahorro × (1 - meses_para_cubrir_déficit / capacidad_ahorro), 0)`

### ⚡ Prioridad 2 — Correcciones Importantes

6. **Motor C (PMT tipo):** Verificar y unificar si se usa `tipo=0` o `tipo=1`. Alinearse con el Excel (tipo=1 para AFORE/voluntarios)
7. **Motor C (Capital Humano):** Cambiar tasa de descuento de 6.5% a 1% (tasa real del sistema)
8. **Motor C (Esquemas individuales):** El backend Python debe recibir `saldo_afore`, `saldo_voluntarios` y `ley_73` por separado — no mezclarlos en `saldo_esquemas`
9. **Motor C (aportacion_necesaria):** Implementar en Python backend

### 📌 Prioridad 3 — Completar Funcionalidades

10. Agregar `longevidad_recursos` como output de Motor B
11. Agregar `meses_para_cubrir_reserva` en Motor A
12. Agregar legado con valor de inmuebles en Motor D
13. Sincronizar la curva de `calcularTimeline` con Motor C (usar la misma lógica de retiro)

---

*Documento generado: Mayo 2026 | Basado en análisis directo del Excel y del código fuente de ArIA*
