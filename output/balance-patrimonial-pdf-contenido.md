# Balance Patrimonial (PDF) — Contenido y datos para UX

Documento de referencia para diseño/UX: resume **todo el texto y la lógica** que la plataforma usa al armar el PDF del **Balance Patrimonial**.  
**Origen en código:** `src/components/pdf/balance-pdf-template.tsx` (9 páginas fijas, `data-pdf-page="1"` … `"9"`).

---

## 1. Fuentes de datos (qué alimenta el PDF)

El componente lee el estado de la sesión/diagnóstico (Zustand `useDiagnosticoStore`) y calcula motores:

| Bloque en store | Campos principales | Motor / uso |
|-----------------|---------------------|-------------|
| `perfil` | `nombre`, `edad`, `dependientes` | Motor B, C, F; textos y supuestos |
| `flujoMensual` | `ahorro`, `rentas`, `otros`, `gastos_basicos`, `obligaciones`, `creditos` | **Motor A** (ingresos/gastos/remanente) |
| `patrimonio` | `liquidez`, `inversiones`, `dotales`, `afore`, `ppr`, `plan_privado`, `seguros_retiro`, `casa`, `tierra`, `herencia`, `inmuebles_renta`, `negocio`, `hipoteca`, `saldo_planes`, `compromisos`, `ley_73` | **Motor B, C, E**; estructura patrimonial |
| `retiro` | `edad_retiro`, `mensualidad_deseada`, `edad_defuncion` | **Motor C** (curva, grado de avance) |
| `proteccion` | `seguro_vida`, `sgmm`, `propiedades_aseguradas` | **Motor F**; página de blindaje |

**Valores mostrados:** montos con `formatMXN` (formato MXN). **Fecha de emisión:** `new Date().toLocaleDateString("es-MX", { year, month: "long", day: "numeric" })`.

---

## 2. Identidad visual (tokens en código)

Paleta usada en el template (hex):

- **Navy:** `#1C2B4A` (marca, barras, texto fuerte)
- **Navy oscuro / medio:** `#0F1E36`, `#243555`
- **Dorado:** `#C9A96E`, `#E8C87A`
- **Crema / pergamino:** `#F5F0E8`, `#EDE8DF`
- **Verde / naranja / rojo:** `#2E8B57`, `#E08020`, `#C0302A`
- **Fondos suaves:** verde `#E6F4EC`, naranja `#FEF3E2`, rojo `#FDEAEA`

**Tipografía en contenedor raíz:** `Arial, Helvetica, sans-serif`.  
**Dimensiones por página PDF:** ~794×1123 px (A4 a ~96dpi).

---

## 3. Elementos repetidos en casi todas las páginas

### Cabecera (`PageHeader`)

- Izquierda: **Actinver Banca Privada**
- Centro: nombre del reporte → **`Tu Balance Patrimonial`**
- Derecha: **`{nombre del cliente}`**

### Pie (`PageFooter`, páginas 2–8)

- Izquierda: **Actinver Banca Privada**
- Derecha: **Página {n} de 9**

### Niveles patrimoniales (píldoras en portada)

Orden fijo: `suficiente` → `mejor` → `bien` → `genial` → `on-fire`  
Etiquetas mostradas: **Suficiente**, **Mejor**, **Bien**, **Genial**, **On Fire**.  
La activa viene de `motorB.nivel_riqueza`.

### Badges deriesgo (`RiskBadge`)

Texto: **Alto** | **Medio** | **Bajo** | **Muy Alto** (colores según severidad).

---

## 4. Página 1 — Portada (`Page1Cover`)

### Barra superior

- **Actinver Banca Privada**
- Subtítulo derecha: **Diagnóstico Patrimonial Privado**

### Hero

- Rótulo: **Preparado exclusivamente para**
- **H1:** `{clientName}`
- **Fecha:** `{fecha}`

### Cuatro tarjetas de métricas (valores dinámicos)

| Etiqueta | Subtítulo | Valor (origen) |
|----------|-----------|----------------|
| Tu Patrimonio Neto | Activos menos obligaciones | `motorE.patrimonio_neto` |
| Tus recursos duran | Longevidad financiera | `{motorB.longevidad_recursos}` años |
| En ingreso disponible | Para invertir cada mes | `%` = remanente/ingresos desde **Motor A** |
| Alcanzarás el retiro | Avance hacia tu meta: se muestra el símbolo de verificación (check Unicode U+2713) en la UI si `motorC.grado_avance >= 1`, si no `{grado_avance * 100}%` |

### Carril “nivel patrimonial”

- Título: **Tu nivel patrimonial en esta etapa de vida**

### Índice “En este reporte”

1. **Tu hoja de ruta** — *Revisión, análisis y las acciones que recomendamos para ti*
2. **Tu panorama de riqueza** — *Patrimonio, activos y el equilibrio de tu situación actual*
3. **Tu flujo de vida** — *Ingresos, gastos y tu capacidad de inversión mensual*
4. **La estructura de tu patrimonio** — *Distribución entre liquidez, inversiones, inmuebles y retiro*
5. **Tu camino al retiro** — *Proyección patrimonial y avance hacia tu independencia financiera*

### Pie portada

- **Actinver Banca Privada**
- **Página 1 de 9 · Confidencial**

---

## 5. Página 2 — Plan personalizado (`Page2PlanDeAccion`)

### Sección

- Letra: **Tu hoja de ruta**
- Título: **Tu plan personalizado**
- Subtítulo: **Situación actual en cada área y los pasos concretos que recomendamos para ti**

### Tabla (encabezados)

| Área | Dónde estás hoy | Urgencia | Lo que recomendamos |

Filas generadas por **`buildPlanDeAccion`** (una fila por “aspecto”). Lógica resumida:

| Aspecto | Condición (resumen) | Situación típica | Riesgo | Recomendación típica |
|---------|---------------------|------------------|--------|----------------------|
| **Liquidez** | `meses_cubiertos` Motor A | ≥12: “En exceso”; ≥3: “Reserva adecuada”; else: “Reserva insuficiente” | Bajo / Alto | Diversificar excedente; mantener reserva; subir a ≥3 meses |
| **Riqueza Financiera** | `ratio` Motor B | ≥5 / ≥2 / menor | Bajo / Medio | Optimizar; incrementar PFD; reducir pasivos |
| **Inversión** | % ingreso = remanente/ingresos | ≥40% / ≥20% / menor | Bajo / Medio / Alto | Textos sobre excelente/moderado/bajo ahorro |
| **Inmuebles** | noFinanciero vs financiero Motor E | Alta participación / normal / cero | Bajo | Crédito para inversión; mantener; considerar compra |
| **Seguros** | vida + SGMM | Combinaciones sin vida/SGMM/ambos | Alto / Medio / Bajo | Contratar pólizas; revisar sumas |
| **Dependientes** | `perfil.dependientes` + vida | Varios casos | Alto / Bajo | Suma asegurada; verificar 3 años de gastos; sin dependientes |
| **Retiro** | `motorC.grado_avance` | ≥1 / ≥0.6 / menor | Bajo / Medio | Optimizar esquemas; subir aportación; urgencia |
| **Sucesión** | inmuebles/negocio en patrimonio | Con bienes / sin registrar | Bajo | Fideicomiso/testamento; planificación preventiva |

### Banner inferior (navy)

- **Áreas de enfoque inmediato** → cuenta filas con riesgo **Alto** o **Muy Alto**
- **Bases sólidas** → cuenta filas con riesgo **Bajo**

---

## 6. Página 3 — Patrimonio neto (`Page3PatrimonioNeto`)

### Sección

- Letra: **Tu panorama de riqueza**
- Título: **Tu patrimonio neto**
- Subtítulo: **El total de lo que tienes, lo que debes y lo que es tuyo**

### Subsección

**Lo que tienes · Lo que debes · Lo que es tuyo**

#### Columna Activos

- **Activos financieros** → `motorE.financiero`
- **Bienes e inmuebles** → `motorE.noFinanciero`
- **Total de lo que tienes** → `motorE.activos_total`

#### Columna Pasivos y Patrimonio Neto

- **Lo que debes (créditos)** → `motorE.pasivos_total`
- **Lo que es tuyo** → `motorE.patrimonio_neto`
- **Total** → `motorE.activos_total`

### Gráficos de barras apiladas

- Bloque 1: **Financiero** / **No Financiero** (montos y %)
- Bloque 2: **Obligaciones** / **Patrimonio Neto**

### Banner longevidad

- Subsección: **¿Cuánto tiempo dura tu dinero sin tocar el retiro?**
- Textos:
  - **Tu dinero disponible cubre** → `{indice_liquidez}` **años** *de tus gastos actuales*  
    (`patrimonio_neto / gasto_anual` Motor B)
  - **Si no aportas más, tus recursos duran hasta** → **los {longevidad_recursos} años** *de edad estimada*

---

## 7. Página 4 — Flujo e ingresos (`Page4FlujoeIngresos`)

### Sección

- Letra: **Tu flujo de vida**
- Título: **Ingresos y capacidad de inversión**
- Subtítulo dinámico: **Ingresas {formatMXN(ingresos)} al mes — así es como fluye tu dinero**

### Filas resumen (Motor A)

- **Ingresos Totales**
- **Gastos Totales ({pct}%)**
- **Ingreso disponible para inversión ({pct}%)**

### Desglose de ingresos (solo si hay montos > 0 en flujo)

Subsección: **Desglose de Ingresos**

- **Disponible ingreso actividad principal ({pct}%)** → `flujoMensual.ahorro` *(nota: en el modelo el campo se llama `ahorro` pero en UI se usa como ingreso principal)*
- **Disponible otros ingresos — rentas ({pct}%)** → `rentas`
- **Disponible otros ingresos — actividad adicional ({pct}%)** → `otros`

### Bloques visuales

- **Ingresos Totales** | columna **Gastos** + **Disponible**

### Caja “Nuestra lectura”

- Rótulo: **Nuestra lectura**
- Texto condicional según `%` disponible sobre ingresos:
  - **≥40%:** *Excelente. Cada mes pones a trabajar el X% de tus ingresos. Eso es lo que construye riqueza generacional — sigamos creciendo y optimizando el portafolio.*
  - **≥20%:** *Tienes una base sólida: el X% de tus ingresos queda libre para crecer. Incorporar ingresos pasivos (rentas, dividendos) acelerará tu independencia financiera.*
  - **<20%:** *Tu flujo mensual tiene espacio para crecer. Identificar y reducir gastos no estratégicos te permitirá destinar más a inversiones que trabajen por ti.*

---

## 8. Página 5 — Estructura del patrimonio (`Page5EstructuraPatrimonio`)

### Sección

- Letra: **La estructura de tu patrimonio**
- Título: **De dónde viene tu fortaleza financiera**
- Subtítulo: **Cómo se distribuye tu riqueza entre liquidez, inversiones, inmuebles y retiro**

### Categorías (barras horizontales + leyenda)

| Label mostrado | Suma de campos | Descripción en UI |
|----------------|----------------|-------------------|
| **Dinero disponible** | `liquidez` | Cuentas bancarias y efectivo accesible |
| **Inversiones** | `inversiones + dotales` | Fondos, acciones, CETES, dotales |
| **Bienes propios** | `casa + tierra + herencia` | Casa, terreno, herencia esperada |
| **Activos que generan renta** | `inmuebles_renta + negocio` | Propiedades rentadas y negocio |
| **Para el retiro** | `afore + ppr + plan_privado + seguros_retiro` | AFORE, PPR, plan privado, seguros |

### Banner navy “Dónde está tu riqueza”

Muestra % por categoría con valor > 0 (primer palabra del label como subtítulo).

---

## 9. Página 6 — Protección patrimonial (`Page6ProteccionPatrimonial`)

### Sección

- Letra: **Blindaje patrimonial**
- Título: **Tus coberturas de protección**
- Subtítulo: **Lo que protege todo lo que has construido**

### Subsección: **Resumen de coberturas activas**

Cuatro tarjetas con marca de verificación o aspa según corresponda:

- **Seguro de Vida**
- **SGMM**
- **Propiedades Aseguradas**
- **Dependientes cubiertos** (si hay dependientes, exige seguro de vida)

### **Impacto en tu Balance**

- **Patrimonio Neto Actual** — nota: *Solvencia: {indice_solvencia * 100}%*
- **Afectación sin cobertura de vida** → `-{suma_asegurada}` o **—**
- **Patrimonio Resultante (con cobertura)** → cálculo con resta de suma asegurada

### **¿Qué pasaría si dejaras de percibir ingresos mañana?**

Tabla: **Concepto** | **Actual** | **Sin ingresos** | **Impacto**  
Fila: **Ingresos disponibles** → disponible | $0 | -100%

### **Protección para quienes dependen de ti**

Párrafo: *Una suma asegurada que garantice al menos 3 años de tu estilo de vida para quienes más importan.*

Caja dividida:

- **Suma asegurada recomendada** → `motorF` o **Por calcular**
- **Prima anual estimada** → **Por cotizar** si no hay dato
- Icono de advertencia (U+26A0 FE0F) en el template React

### Franja inferior

- **PROTECCIÓN PARA TI Y LOS QUE MÁS QUIERES**

---

## 10. Página 7 — Trayectoria al retiro (`Page7TrayectoriaPatrimonial`)

### Sección

- Letra: **Tu camino al retiro**
- Título: **Tu trayectoria patrimonial**
- Subtítulo: **Cómo crece y evoluciona tu patrimonio año con año**

### Gráfico de barras horizontales

- Eje: edad (`curva` Motor C, muestreada anualmente)
- Leyenda:
  - **Acumulación (antes del retiro)** (navy)
  - **Decumulación (retiro)** (dorado)
  - **Déficit** (rojo)

### Cuatro KPIs

- **Patrimonio en Retiro** → `motorC.saldo_inicio_jubilacion`
- **Mensualidad Total** → `motorC.pension_total_mensual`
- **Mensualidad Deseada** → `retiro.mensualidad_deseada`
- **Grado de Avance** → `{grado_avance * 100}%` (fondo verde si ≥100%, naranja si no)

---

## 11. Página 8 — Anexo metodología (`Page8AnexoCriterios`)

### Sección

- Letra: **Transparencia total**
- Título: **Cómo calculamos tu trayectoria**
- Subtítulo: **Los supuestos y metodología detrás de tus proyecciones**

### **Supuestos de proyección** (tabla fija de valores en UI)

| Etiqueta | Valor mostrado |
|----------|----------------|
| Tasa de rendimiento anual (promedio) | 6.5% real |
| Inflación estimada | 3.5% anual |
| Tasa neta sobre inflación | 3.0% anual |
| Horizonte de acumulación | `{edad_retiro - edad}` años (hoy → retiro) |
| Horizonte de decumulación (retiro) | `{edad_defuncion - edad_retiro}` años (retiro → edad final) |
| Fuentes de ingreso en retiro | AFORE · PPR · Plan privado · Patrimonio financiero · Rentas |
| Ley 73 IMSS (si aplica) | Incluida en proyección según saldo indicado |

### **Fuentes de Ingreso en el Retiro**

- Patrimonio financiero acumulado
- Pensiones / esquemas formales (`fuentes_ingreso.pension`)
- Ingresos por rentas (`fuentes_ingreso.rentas`)
- **Mensualidad total posible** (énfasis)
- **Mensualidad deseada**

### **Glosario** (término: definición)

- **Patrimonio Neto** — Activos totales menos pasivos…
- **Grado de Avance** — % de la mensualidad deseada cubierta por proyección…
- **Índice de Liquidez** — Años de gastos que el patrimonio financiero cubre…
- **Longevidad de Recursos** — Edad a la que se agotarían recursos al gasto actual…
- **SGMM** — Seguro de Gastos Médicos Mayores…
- **PPR** — Plan Personal de Retiro…

---

## 12. Página 9 — Contraportada (`Page9BackCover`)

- Franja degradado dorado → navy
- **Tu asesor financiero de confianza**
- **Actinver** + **Banca Privada**
- Tagline: **Tu patrimonio, con claridad. Tu futuro, con estrategia.**
- **{clientName}**
- **Documento emitido el {fecha}**

### Aviso legal (centrado)

> Este documento es informativo y no constituye recomendación de inversión. Las proyecciones se basan en datos proporcionados por el cliente y no garantizan resultados futuros. Rendimientos pasados no garantizan rendimientos futuros.  
> Actinver Casa de Bolsa, S.A. de C.V. — Supervisada por la CNBV.

### Pie

- **Actinver Banca Privada**
- **Página 9 de 9**

---

## 13. Notas para el equipo de UX

1. **Nombre del producto en UI:** el reporte se titula **Balance Patrimonial** (no “Balance Financiero”).
2. **Totales:** si faltan datos, el código usa **ceros por defecto** (`safeMotor*`, `safePatrimonio`, etc.) — el PDF siempre se puede generar, a veces con cifras en $0.
3. **Export PDF:** `src/lib/pdf-generator.ts` captura cada `[data-pdf-page]` con html2canvas y arma un PDF multipágina.
4. **Motores detallados:** fórmulas exactas en `src/lib/motors/` (`calcularMotorA` … `calcularMotorF`).

---

*Generado como referencia de contenido; mantener alineado con `balance-pdf-template.tsx` cuando cambie el producto.*
el reporte pr