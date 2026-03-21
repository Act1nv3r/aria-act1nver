# PROMPT 7 — Conectar Outputs al Flujo con Recálculo en Tiempo Real
# Sprint 2 | Tiempo estimado: 1 día
# PREREQUISITO: Prompts 5 y 6 completados (motores + gráficas existen)

Modifica /components/diagnostico/output-panel.tsx para que lea los outputs del Zustand store
y renderice las gráficas progresivamente conforme el asesor completa cada paso.

## Lógica del Panel de Outputs

El panel observa el store y renderiza condicionalmente basado en qué motores tienen datos:

```typescript
// Pseudocódigo de output-panel.tsx
const { outputs, perfil, flujoMensual, patrimonio, retiro, objetivos, proteccion } = useDiagnosticoStore();

return (
  <div className="space-y-4">
    <h3 className="font-poppins font-bold text-base text-sunset">Tus resultados</h3>
    
    {/* Aparece después de Paso 2 (Motor A) */}
    {outputs.motorA && (
      <FadeIn>
        <Card><DonutChart data={formatDistribucion(outputs.motorA)} total={outputs.motorA.ingresos_totales} /></Card>
        <Card><ReservaSemaforo meses={outputs.motorA.meses_cubiertos} benchmark={3} /></Card>
      </FadeIn>
    )}
    
    {/* Aparece después de Paso 3 (Motor B + E) */}
    {outputs.motorB && (
      <FadeIn>
        <Card><PatrimonioNetoCard ... /></Card>
        <Card><NivelRiquezaBadge ... /></Card>
        <Card><IndiceSolvencia ... /></Card>
        <Card><Regla72Table ... /></Card>
      </FadeIn>
    )}
    
    {/* Aparece después de Paso 4 (Motor C) — MOMENTO DE VERDAD */}
    {outputs.motorC && (
      <FadeIn>
        <Card><GradoAvanceBar porcentaje={outputs.motorC.grado_avance} /></Card>
        <Card><CurvaDesacumulacion curva={outputs.motorC.curva} ... /></Card>
        <Card><DeficitCard deficit={outputs.motorC.deficit_mensual} /></Card>
        <Card><FuentesIngreso ... /></Card>
      </FadeIn>
    )}
    
    {/* Aparece después de Paso 5 (Motor D) — si se completó */}
    {outputs.motorD && (
      <FadeIn>
        <Card><TablaViabilidad objetivos={outputs.motorD.resultados} /></Card>
        <Card><LegadoCard monto={outputs.motorD.legado} edadDefuncion={retiro?.edad_defuncion || 90} /></Card>
      </FadeIn>
    )}
    
    {/* Aparece después de Paso 6 (Motor F) */}
    {outputs.motorF && (
      <FadeIn>
        <Card>{/* Recomendaciones de protección */}</Card>
      </FadeIn>
    )}
    
    {/* Empty state si no hay nada */}
    {!outputs.motorA && (
      <div className="text-center py-12">
        <p className="text-info text-sm">Completa los primeros pasos para ver tus resultados</p>
      </div>
    )}
  </div>
);
```

## Componente <FadeIn>

Wrapper que agrega animación de entrada a los outputs nuevos:
```typescript
// components/ui/fade-in.tsx
function FadeIn({ children }: { children: ReactNode }) {
  return (
    <div className="animate-fade-in space-y-4">
      {children}
    </div>
  );
}
```
CSS animation en globals.css:
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}
```

## Trigger de Cálculo en los Formularios

Modificar cada componente paso (paso2-flujo.tsx, paso3-patrimonio.tsx, etc.) para que al hacer submit:

1. Guarde los datos en el store (updateFlujoMensual, updatePatrimonio, etc.)
2. Ejecute el motor correspondiente con los datos actuales:
   ```typescript
   import { calcularMotorA } from '@/lib/motors/motor-a';
   
   const onSubmit = (data: FlujoMensualInput) => {
     updateFlujoMensual(data);
     
     // Ejecutar motor
     const outputA = calcularMotorA({
       ...data,
       liquidez: patrimonio?.liquidez, // puede ser null si Paso 3 no completado
     });
     updateOutputs('motorA', outputA);
     
     completarPaso(2);
     nextStep();
   };
   ```

3. Para pasos que afectan motores previos, RECALCULAR:
   - Al completar Paso 3: recalcular Motor A (ahora tiene liquidez real) + ejecutar Motor B + Motor E
   - Al completar Paso 4: ejecutar Motor C
   - Al completar Paso 5: ejecutar Motor D
   - Al completar Paso 6: ejecutar Motor F

## Recálculo en Tiempo Real

Agregar un useEffect en output-panel.tsx que detecte cambios en los datos del store
y recalcule los motores afectados:

```typescript
useEffect(() => {
  // Si el asesor modifica Paso 2 después de haber completado Paso 3,
  // los Motores B, C, D, E necesitan recalcularse
  if (flujoMensual && patrimonio) {
    const newMotorA = calcularMotorA({ ...flujoMensual, liquidez: patrimonio.liquidez });
    const newMotorB = calcularMotorB({ ...patrimonio, edad: perfil.edad, ...flujoMensual });
    const newMotorE = calcularMotorE({ ...patrimonio });
    updateOutputs('motorA', newMotorA);
    updateOutputs('motorB', newMotorB);
    updateOutputs('motorE', newMotorE);
    
    if (retiro) {
      const newMotorC = calcularMotorC({ ... });
      updateOutputs('motorC', newMotorC);
    }
  }
}, [flujoMensual, patrimonio, retiro, objetivos]); // dependencias
```

## Flash Animation en Outputs Actualizados

Cuando un output se recalcula (no es la primera vez), hacer un flash visual:
- La card completa baja a opacity 0.5 y vuelve a 1.0 en 300ms.
- Implementar con un state `updatedMotors` que trackea qué motores acaban de recalcularse.
- CSS: `.flash { animation: flash 0.3s ease-out; }`
  ```css
  @keyframes flash { from { opacity: 0.5; } to { opacity: 1; } }
  ```

## IMPORTANTE: Orden visual de los outputs

Los outputs MÁS RECIENTES van ARRIBA del panel. Orden:
1. Motor F (protección) — arriba si existe
2. Motor D (objetivos) — si existe
3. Motor C (retiro + curva) — SECCIÓN MÁS GRANDE
4. Motor B + E (patrimonio + solvencia)
5. Motor A (distribución + reserva) — abajo

Esto asegura que al completar Paso 4 (Motor C), la curva de desacumulación
aparece arriba del panel con la animación draw-line de 2 segundos — el MOMENTO DE VERDAD.
