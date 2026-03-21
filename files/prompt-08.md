# PROMPT 8 — Simulador de Escenarios con Sliders en Tiempo Real
# Sprint 3 | Tiempo estimado: 1.5 días
# PREREQUISITO: Prompts 1-7 completados (flujo completo con motores y gráficas)

El simulador es el "WOW factor #1" de la demo. Los sliders mueven números EN VIVO.

## /app/(diagnostico)/diagnosticos/[id]/simulador/page.tsx

### Layout

Desktop (≥1024px): grid 2 columnas (50/50 con gap 32px).
  Izquierda: panel de sliders. Derecha: resultados recalculados.
Tablet (<1024px): stack vertical (sliders arriba, resultados abajo con scroll).

Título: "Simula tu futuro" Poppins Bold 28px blanco.
Subtítulo: "Mueve los controles y observa cómo cambia tu retiro" Open Sans 14px info.

### Panel Izquierdo — 5 Sliders

Cada slider usa el componente <Slider> creado en Prompt 1, dentro de una Card individual:

1. "Edad de retiro"
   - min: perfil.edad + 1 (ej: 51 si tiene 50)
   - max: 70
   - step: 1
   - value: retiro.edad_retiro (default del diagnóstico base: 60)
   - formatValue: (v) => `${v} años`
   - Label adicional debajo: "Base: {retiro.edad_retiro} años" en Open Sans 11px info

2. "Capacidad de ahorro mensual"
   - min: 0
   - max: flujoMensual.ahorro * 3 (ej: $150,000 si ahorra $50K)
   - step: 5000
   - value: flujoMensual.ahorro (default: $50,000)
   - formatValue: (v) => formatMXN(v) + "/mes"
   - Label: "Base: {formatMXN(flujoMensual.ahorro)}/mes"

3. "Mensualidad deseada en retiro"
   - min: 10000
   - max: 200000
   - step: 5000
   - value: retiro.mensualidad_deseada (default: $50,000)
   - formatValue: (v) => formatMXN(v) + "/mes"

4. "Tasa real anual"
   - min: 0
   - max: 5
   - step: 0.5
   - value: 1 (PARAMS.TASA_REAL_ANUAL * 100)
   - formatValue: (v) => `${v}%`

5. "Aportación extra única"
   - min: 0
   - max: 5000000
   - step: 100000
   - value: 0
   - formatValue: (v) => formatMXN(v)
   - Descripción: "Un monto adicional que podrías invertir hoy" Open Sans 11px info

### Panel Derecho — Resultados Actualizados

Los resultados se recalculan con debounce de 200ms al mover CUALQUIER slider.

Lógica:
```typescript
const [sliderValues, setSliderValues] = useState({
  edad_retiro: retiro.edad_retiro,
  ahorro: flujoMensual.ahorro,
  mensualidad_deseada: retiro.mensualidad_deseada,
  tasa_real: PARAMS.TASA_REAL_ANUAL,
  aportacion_extra: 0,
});

// Estado base (del diagnóstico real, no cambia)
const resultadoBase = useMemo(() => calcularMotorC({
  patrimonio_financiero_total: patrimonio_total,
  ...retiro,
  ...otros_datos
}), []);

// Estado simulado (cambia con cada slider)
const resultadoSimulado = useMemo(() => {
  const patrimonioAjustado = patrimonio_total + sliderValues.aportacion_extra;
  return calcularMotorC({
    patrimonio_financiero_total: patrimonioAjustado,
    edad_retiro: sliderValues.edad_retiro,
    mensualidad_deseada: sliderValues.mensualidad_deseada,
    // ... usar sliderValues en vez de valores base
  });
}, [sliderValues]); // se recalcula instantáneamente
```

Renderizar en el panel derecho:

1. **Grado de Avance** (card más grande):
   - <GradoAvanceBar porcentaje={resultadoSimulado.grado_avance} />
   - Diff: "Base: {formatPct(base.grado_avance)} → Simulado: {formatPct(sim.grado_avance)}"
     Color del diff: verde si mejoró (▲ +15.2%), rojo si empeoró (▼ -5.3%). Poppins Bold 12px.

2. **Mensualidad posible**:
   - Número: Poppins Bold 28px blanco → formatMXN(sim.mensualidad_posible)
   - Diff: "Base: {base} → {sim}" con delta colored

3. **Déficit/Superávit**:
   - <DeficitCard deficit={sim.deficit_mensual} />
   - Diff badge

4. **Curva de desacumulación** (HERO — se REDIBUJA con cada cambio):
   - <CurvaDesacumulacion curva={sim.curva} />
   - La curva debe redibujar suavemente. Usar key={JSON.stringify(sliderValues)} para forzar re-render con animación.

### Botones Bottom

- "Volver al diagnóstico" (ghost) → navegar a /resultados
- "Resetear valores" (outline) → setSliderValues(valores originales del diagnóstico)

### Performance

El recálculo Motor C con 360 iteraciones es muy rápido en TypeScript (<5ms).
useMemo asegura que solo se recalcula cuando cambian los sliderValues.
El debounce de 200ms en los sliders evita recálculos excesivos durante el drag.
Si aún hay lag visual, usar requestAnimationFrame para las actualizaciones de gráficas.

RESULTADO: Al mover el slider de ahorro de $50K a $80K, el grado de avance debe saltar
de 77% a ~92% con animación EN VIVO. Este es el momento WOW de la demo.
