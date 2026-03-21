# PROMPT 5 — Los 6 Motores de Cálculo en TypeScript
# Sprint 2 | Tiempo estimado: 2 días
# PREREQUISITO: Prompts 1-4 completados. Store con datos de Juan Pérez.

Lee .context/context.md secciones "Los 6 Motores de Cálculo", "Parámetros Globales", "Tabla de Benchmark" y "Datos de Prueba".
Crea los motores como funciones TypeScript puras en /lib/motors/. Se ejecutan en frontend (sin backend).

## /lib/constants.ts — Parámetros globales (hardcoded para prototipo)

```typescript
export const PARAMS = {
  TASA_REAL_ANUAL: 0.01,           // 1% anual
  COSTO_SEGURO_POR_MILLON: 7000,   // $7,000 MXN por millón asegurado
  CAP_RATE: 0.05,                   // 5% rentabilidad inmuebles
  EDAD_DEFUNCION_DEFAULT: 90,
  BENCHMARK_RESERVA_MESES: 3,       // 3 meses de gastos básicos
} as const;

// Tabla de benchmark: Nivel de Riqueza por Edad (múltiplos de gasto anual)
// Cada fila: [edad_min, suficiente, mejor, bien, genial, on_fire]
export const BENCHMARK_RIQUEZA = [
  [25, 0,   0.1,  0.25, 0.4,  0.6],
  [30, 0.5, 0.75, 1,    1.5,  2],
  [35, 1,   2,    3,    4,    6],
  [40, 2,   4,    6,    8,    10],
  [45, 3,   6,    8,    10,   12],
  [50, 4,   7,    9,    12,   15],
  [55, 5,   8,    11,   14,   18],
  [60, 6,   9,    13,   16,   20],
] as const;

export const NIVELES = ['suficiente', 'mejor', 'bien', 'genial', 'on-fire'] as const;
```

## /lib/motors/motor-a.ts — Análisis Ingreso/Gasto

```typescript
interface MotorAInput {
  ahorro: number; rentas: number; otros: number;
  gastos_basicos: number; obligaciones: number; creditos: number;
  liquidez?: number; // viene del Paso 3, puede ser null
}

interface MotorAOutput {
  ingresos_totales: number;
  gastos_totales: number;
  distribucion: {
    obligaciones_pct: number;
    gastos_pct: number;
    ahorro_pct: number;
  };
  benchmark_reserva: number;
  meses_cubiertos: number | null; // null si no hay liquidez aún
  resultado_reserva: 'Cubierta' | 'Insuficiente' | 'Pendiente';
  remanente: number;
}
```

Cálculos:
- ingresos_totales = ahorro + rentas + otros
- gastos_totales = gastos_basicos + obligaciones + creditos
- Si ingresos_totales === 0: todos los _pct = 0 (proteger contra /0)
- obligaciones_pct = obligaciones / ingresos_totales
- gastos_pct = gastos_basicos / ingresos_totales
- ahorro_pct = ahorro / ingresos_totales
- benchmark_reserva = PARAMS.BENCHMARK_RESERVA_MESES * gastos_basicos
- Si liquidez !== undefined y gastos_basicos > 0: meses_cubiertos = liquidez / gastos_basicos
- resultado_reserva: si meses_cubiertos === null → 'Pendiente', si >= 3 → 'Cubierta', si < 3 → 'Insuficiente'
- remanente = ahorro (simplificado para prototipo)

## /lib/motors/motor-b.ts — Patrimonio y Nivel de Riqueza

```typescript
interface MotorBInput {
  // Patrimonio financiero de acumulación
  liquidez: number; inversiones: number; dotales: number;
  afore: number; ppr: number; plan_privado: number; seguros_retiro: number;
  // Contexto
  edad: number;
  gastos_basicos: number; obligaciones: number; creditos: number;
}

interface MotorBOutput {
  patrimonio_financiero_total: number;
  gasto_anual: number;
  ratio: number; // veces que el patrimonio cubre gastos anuales
  nivel_riqueza: 'suficiente' | 'mejor' | 'bien' | 'genial' | 'on-fire';
  benchmark_para_edad: number; // el valor "suficiente" para esa edad
  longevidad_recursos: number; // edad hasta la que cubre
  meses_cubiertos: number; // liquidez / gastos_basicos
}
```

Cálculos:
- patrimonio_financiero_total = liquidez + inversiones + dotales + afore + ppr + plan_privado + seguros_retiro
- gasto_mensual = gastos_basicos + obligaciones + creditos
- gasto_anual = gasto_mensual * 12
- ratio = patrimonio_financiero_total / gasto_anual (proteger /0)
- nivel_riqueza: buscar en BENCHMARK_RIQUEZA la fila donde edad >= edad_min (tomar la última que aplique), luego comparar ratio con los umbrales [suficiente, mejor, bien, genial, on_fire]. Asignar el nivel más alto que el ratio supere.
- benchmark_para_edad: el valor de la columna "suficiente" para esa fila de edad
- longevidad_recursos = edad + (patrimonio_financiero_total / gasto_mensual / 12) (años de vida que cubre)
- meses_cubiertos = liquidez / gastos_basicos (proteger /0)

## /lib/motors/motor-c.ts — Desacumulación (RETIRO) — EL MÁS IMPORTANTE

```typescript
interface MotorCInput {
  patrimonio_financiero_total: number;
  saldo_esquemas: number; // afore + ppr + plan_privado + seguros_retiro
  ley_73: number | null; // mensualidad Ley 73, null si no aplica
  rentas: number; // ingresos por rentas mensuales
  edad: number;
  edad_retiro: number;
  edad_defuncion: number;
  mensualidad_deseada: number;
}

interface MotorCOutput {
  saldo_inicio_jubilacion: number;
  meses_acumulacion: number;
  meses_jubilacion: number;
  mensualidad_posible: number;
  pension_total_mensual: number; // ley_73 + rentas
  grado_avance: number; // decimal: 0.771 = 77.1%
  deficit_mensual: number; // positivo = falta, negativo = sobra
  aportacion_necesaria: number | null;
  curva: Array<{ mes: number; edad: number; saldo: number }>;
  fuentes_ingreso: { rentas: number; pension: number; patrimonio: number };
}
```

Cálculos (EXACTOS — deben coincidir con el Excel):
```
tasa_mensual = PARAMS.TASA_REAL_ANUAL / 12   // 0.01/12 = 0.000833...
meses_acumulacion = (edad_retiro - edad) * 12
meses_jubilacion = (edad_defuncion - edad_retiro) * 12

// Valor futuro del patrimonio al inicio de la jubilación
saldo_inicio_jubilacion = patrimonio_financiero_total * Math.pow(1 + tasa_mensual, meses_acumulacion)

// Mensualidad posible (fórmula de amortización / anualidad)
if (tasa_mensual > 0) {
  mensualidad_posible = saldo_inicio_jubilacion * tasa_mensual / (1 - Math.pow(1 + tasa_mensual, -meses_jubilacion))
} else {
  mensualidad_posible = saldo_inicio_jubilacion / meses_jubilacion
}

// Pensión total (fuentes fijas de ingreso en retiro)
pension_total_mensual = (ley_73 || 0) + rentas

// Grado de avance: qué % de la mensualidad deseada ya tiene cubierto
grado_avance = (pension_total_mensual + mensualidad_posible) / mensualidad_deseada
// Cap a un máximo razonable para display (puede ser > 1.0 si sobra)

// Déficit: cuánto falta (positivo) o sobra (negativo) por mes
deficit_mensual = mensualidad_deseada - (pension_total_mensual + mensualidad_posible)

// Curva de desacumulación (para la gráfica hero)
curva = []
saldo_actual = saldo_inicio_jubilacion
for (let mes = 0; mes <= meses_jubilacion; mes++) {
  if (mes > 0) {
    interes = saldo_actual * tasa_mensual
    saldo_actual = saldo_actual + interes - mensualidad_posible
    saldo_actual = Math.max(saldo_actual, 0) // no puede ser negativo
  }
  // Guardar 1 punto por año (cada 12 meses) + el último mes
  if (mes % 12 === 0 || mes === meses_jubilacion) {
    curva.push({
      mes: mes,
      edad: edad_retiro + mes / 12,
      saldo: Math.round(saldo_actual * 100) / 100
    })
  }
}

fuentes_ingreso = {
  rentas: rentas,
  pension: ley_73 || 0,
  patrimonio: mensualidad_posible
}
```

## VALIDACIÓN OBLIGATORIA (Juan Pérez):
Con los datos prellenados del store:
- patrimonio_financiero_total = 200000+2000000+100000+1000000+0+0+0 = 3,300,000
- Pero OJO: el patrimonio de ACUMULACIÓN excluye lo que ya es pensión
  Para el prototipo, usar patrimonio_financiero_total = liquidez+inversiones+dotales = 2,300,000
  (Afore y demás se consideran como fuente de pensión separada)
- saldo_inicio_jubilacion ≈ 2,300,000 * (1.000833)^120 ≈ 2,541,787
- mensualidad_posible ≈ 8,175 (±$100)
- pension_total = 35,000 (Ley73) + 10,000 (rentas) = 45,000
- grado_avance = (45,000 + 8,175) / 50,000 ≈ 1.06 (106%!) — el cliente de ejemplo tiene superávit
  
NOTA: Si el grado sale >100%, es porque Juan Pérez tiene Ley 73 de $35K/mes que ya cubre mucho.
Para la demo esto está bien — muestra un caso positivo.
Para probar un caso con déficit, reducir Ley 73 a 0 y mensualidad deseada a 50,000.

## /lib/motors/motor-d.ts — Proyección con Objetivos

Input: aportacion_inicial, aportacion_mensual, objetivos[], patrimonio, edad, edad_retiro.
Simula mes a mes:
- saldo_inicial = aportacion_inicial
- Cada mes: saldo += aportacion_mensual + (saldo * tasa_mensual)
- Al vencer un objetivo (mes = plazo*12): saldo -= monto. Si saldo >= monto → viable, si no → insuficiente.
- Output: viabilidad por objetivo, saldo al retiro, legado (saldo a edad defunción).

## /lib/motors/motor-e.ts — Balance General

Input: todos los patrimonios + pasivos.
- activos_total = financiero_total + casa + inmuebles_renta + tierra + negocio + herencia
- pasivos_total = hipoteca + saldo_planes + compromisos
- patrimonio_neto = activos_total - pasivos_total
- indice_solvencia = activos_total > 0 ? 1 - (pasivos_total / activos_total) : 0
- clasificacion_solvencia: <0.1='Muy saludable', 0.1-0.3='Recomendable', 0.3-0.4='Aceptable', 0.4-0.5='Elevado', >0.5='Crítico'
- potencial_credito_liquidos = (liquidez + inversiones) * 0.60
- potencial_credito_inmuebles = (casa + inmuebles_renta + tierra) * 0.50
- potencial_apalancamiento = potencial_credito_liquidos + potencial_credito_inmuebles

## /lib/motors/motor-f.ts — Protección Patrimonial

Input: seguro_vida, propiedades_aseguradas, sgmm, dependientes, patrimonio_neto, inmuebles_total.
Cálculos:
- Si dependientes && !seguro_vida:
  suma_asegurada = patrimonio_neto * 0.7 (70% del patrimonio como cobertura sugerida)
  costo_prima_anual = (suma_asegurada / 1000000) * PARAMS.COSTO_SEGURO_POR_MILLON
- Si inmuebles_total > 0 && !propiedades_aseguradas:
  seguro_hogar_sugerido = inmuebles_total * 1.0 (cobertura = valor de inmuebles)
  costo_hogar_anual = seguro_hogar_sugerido * 0.003 (0.3% del valor)
- SGMM: costo estimado $15,000-$30,000/año según edad (lookup simple).

## Test con Vitest (/lib/motors/__tests__/motor-c.test.ts):

```typescript
import { describe, test, expect } from 'vitest';
import { calcularMotorC } from '../motor-c';

describe('Motor C - Desacumulación', () => {
  const juanPerez = {
    patrimonio_financiero_total: 2300000,
    saldo_esquemas: 0,
    ley_73: 35000,
    rentas: 10000,
    edad: 50,
    edad_retiro: 60,
    edad_defuncion: 90,
    mensualidad_deseada: 50000,
  };

  test('calcula mensualidad posible correctamente', () => {
    const result = calcularMotorC(juanPerez);
    expect(result.mensualidad_posible).toBeGreaterThan(7000);
    expect(result.mensualidad_posible).toBeLessThan(10000);
  });

  test('genera curva de desacumulación', () => {
    const result = calcularMotorC(juanPerez);
    expect(result.curva.length).toBeGreaterThan(20); // ~30 puntos (1/año * 30 años)
    expect(result.curva[0].saldo).toBeGreaterThan(0);
    expect(result.curva[result.curva.length - 1].saldo).toBeCloseTo(0, -3); // se acerca a 0
  });

  test('calcula fuentes de ingreso', () => {
    const result = calcularMotorC(juanPerez);
    expect(result.fuentes_ingreso.rentas).toBe(10000);
    expect(result.fuentes_ingreso.pension).toBe(35000);
    expect(result.fuentes_ingreso.patrimonio).toBeGreaterThan(0);
  });

  test('maneja division por cero', () => {
    const input = { ...juanPerez, mensualidad_deseada: 0 };
    expect(() => calcularMotorC(input)).not.toThrow();
  });
});
```

Ejecutar: `pnpm vitest run lib/motors/__tests__/motor-c.test.ts`
Si falla, ajustar las fórmulas hasta que pase.
