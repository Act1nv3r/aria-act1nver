# Context — ArIA by Actinver

## ¿Qué es ArIA?

**ArIA** (AR·IA) — el nombre contiene "Inteligencia Artificial" de forma orgánica, se descubre, no se explica. Es la herramienta de diagnóstico y planeación financiera personal de Actinver.

**La metáfora del Aria:** En la ópera, un *aria* es el momento donde el solista (el **cliente**) expresa con toda profundidad lo que siente y desea, mientras la orquesta (**Actinver**: inversiones, crédito, seguros) lo sostiene, y el director (la **IA**) coordina que cada instrumento entre en el momento exacto. ArIA pone al cliente al centro de su planeación financiera.

ArIA transforma un Excel de 12 pestañas (con +200 fórmulas) en una aplicación moderna. Los asesores financieros de Actinver la usan con sus clientes para:

1. Capturar datos financieros en 6 pasos guiados (11 min vs 45 min en Excel)
2. Ejecutar 6 motores de cálculo que diagnostican patrimonio, retiro, protección
3. Generar 3 entregables PDF profesionales con recomendaciones
4. Simular escenarios "¿Qué pasa si?" para motivar acciones del cliente
5. Compartir un "Financial Wrapped" en redes sociales (sin montos, solo badges/%)

## ¿Quién lo usa?

| Rol | Cantidad | Acceso | Qué hace |
|-----|----------|--------|----------|
| Asesor financiero | ~500 concurrentes | Login email+pass | Opera la herramienta, captura datos, presenta resultados |
| Cliente | ~150K total | Link temporal (30 días) | Ve su diagnóstico, explora simulador básico, descarga PDFs |
| Admin | 1-3 personas | Login admin | Ve métricas, gestiona asesores, configura parámetros |

## Los 6 Pasos del Diagnóstico

### Paso 1: Perfil (5 campos, ~1 min)
- Nombre/Alias, Edad (18-90), Género, Ocupación (Asalariado/Independiente/Empresario), Dependientes (Sí/No)
- Condicionalidad: Si edad < 46, Ley 73 no aparece en Paso 3

### Paso 2: Flujo Mensual (6 campos, ~2 min)
- Ingresos: Capacidad de Ahorro, Rentas, Otros ingresos
- Egresos: Gastos básicos (>$0), Obligaciones, Créditos
- **Output parcial**: Gráfica donut distribución + Semáforo reserva emergencia (benchmark: 3 meses gastos básicos)

### Paso 3: Patrimonio Completo (15 campos en 4 secciones, ~3 min)
- 3A. Financiero: Liquidez, Inversiones, Dotales
- 3B. Retiro: Afore, PPR, Plan privado, Seguros retiro, Ley 73 (condicional si edad>46)
- 3C. No Financiero: Casa, Inmuebles renta, Tierra, Negocio, Herencia
- 3D. Pasivos: Hipoteca, Saldo planes pendiente, Compromisos futuros
- **Output parcial**: Patrimonio Neto, Nivel Riqueza (badge), Índice Solvencia, Potencial Apalancamiento, Regla 72

### Paso 4: Planeación del Retiro (3 campos, ~2 min)
- Edad retiro (51-70), Mensualidad deseada (MXN), Edad defunción (default 90)
- **Output parcial**: Grado avance %, Déficit/Superávit, Curva desacumulación (360 meses), Fuentes ingreso retiro

### Paso 5: Objetivos Personales (OPCIONAL, hasta 5 objetivos, ~2 min)
- Aportación inicial, Aportación mensual, por objetivo: Nombre/Monto/Plazo
- **Output parcial**: Viabilidad por objetivo (✓/✗), Legado proyectado

### Paso 6: Protección Patrimonial (3 campos, ~1 min)
- ¿Seguro vida? ¿Propiedades aseguradas? (condicional si hay inmuebles) ¿SGMM?
- **Output FINAL**: Recomendaciones de seguros + Plan completo + Cambio estado a "completo"

## Los 6 Motores de Cálculo

| Motor | Input | Output principal | Precisión requerida |
|-------|-------|-----------------|-------------------|
| A: Ingreso/Gasto | Ingresos + Gastos | Distribución %, Reserva CP, Meses cubiertos | ±0.01% vs Excel |
| B: Patrimonio/Riqueza | Patrimonio + Edad | Nivel riqueza (tabla benchmark), Índice liquidez | ±0.01% vs Excel |
| C: Desacumulación | Todo + Retiro | Mensualidad posible, Grado avance, Curva 360 meses | ±$1 MXN vs Excel |
| D: Objetivos | Aportaciones + Metas | Viabilidad por objetivo, Saldo retiro ajustado | ±$1 MXN vs Excel |
| E: Balance General | Todo patrimonio | Patrimonio neto, Solvencia, Apalancamiento | ±0.01% vs Excel |
| F: Protección | Seguros + Dependientes | Cobertura sugerida, Suma asegurada, Costo prima | ±$1 MXN vs Excel |

## Parámetros Globales (configurables desde Admin)

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| tasa_real_anual | 1% (0.01) | Tasa real para proyecciones (conservadora) |
| costo_seguro_por_millon | $7,000 MXN | Costo prima anual por millón de suma asegurada |
| cap_rate_propiedades | 5% (0.05) | Rentabilidad anual de inmuebles en renta |
| edad_defuncion_default | 90 | Edad máxima para cálculos de retiro |
| benchmark_reserva_meses | 3 | Meses de gastos básicos para reserva de emergencia |

## Tabla de Benchmark: Nivel de Riqueza por Edad (Múltiplos de gasto anual)

| Edad | Suficiente | Mejor | Bien | Genial | On fire |
|------|-----------|-------|------|--------|---------|
| 25 | 0x | 0.1x | 0.25x | 0.4x | 0.6x |
| 30 | 0.5x | 0.75x | 1x | 1.5x | 2x |
| 35 | 1x | 2x | 3x | 4x | 6x |
| 40 | 2x | 4x | 6x | 8x | 10x |
| 45 | 3x | 6x | 8x | 10x | 12x |
| 50 | 4x | 7x | 9x | 12x | 15x |
| 55 | 5x | 8x | 11x | 14x | 18x |
| 60+ | 6x | 9x | 13x | 16x | 20x |

## Índice de Solvencia (Deuda/Activo)

| Rango | Clasificación |
|-------|--------------|
| < 0.10 | Muy saludable |
| 0.10-0.30 | Recomendable |
| 0.30-0.40 | Aceptable |
| 0.40-0.50 | Elevado |
| > 0.50 | Crítico |

## Integración con Actinver

La herramienta vive FUERA del stack tecnológico de Actinver. Se conecta mediante:
- **APIs salientes**: Push de diagnósticos completados y recomendaciones al CRM Salesforce de Actinver
- **APIs entrantes (V2)**: Prellenado de datos de clientes existentes desde el core bancario
- **Autenticación independiente**: JWT propio (no SSO corporativo en MVP)
- **mTLS**: Para comunicación bidireccional con sistemas Actinver (V2)

## Datos de Prueba (del Excel original)

Cliente ejemplo: Juan Pérez, 50 años, Hombre, Asalariado, Con dependientes
- Ingresos: Ahorro $50,000 + Rentas $10,000 = $110,000/mes (con $50K base)
- Gastos: Básicos $40,000 + Obligaciones $20,000 = $60,000/mes
- Patrimonio Financiero: Liquidez $200K + Inversiones $2M + Dotales $100K = $2.3M
- Retiro: Afore $1M, Ley 73 $35K/mes, Edad retiro 60, Mensualidad deseada $50K
- No Financiero: Inmuebles renta $1M, Compromisos $1M
- Resultado Motor C: Mensualidad posible = $8,175.39, Grado avance = 77.1%
