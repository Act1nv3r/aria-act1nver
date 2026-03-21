# PROMPT 9 — Vista de Resultados Completos + 5 Recomendaciones
# Sprint 3 | Tiempo estimado: 1.5 días
# PREREQUISITO: Prompts 1-8 completados

## /app/(diagnostico)/diagnosticos/[id]/resultados/page.tsx

### Navegación por Tabs

Usar @radix-ui/react-tabs. 3 tabs horizontales:
- Tab activa: Poppins Bold 14px sunset, borde inferior 2px sunset.
- Tab inactiva: Poppins Regular 14px info. Hover: info/50.
- Transición: slide content 200ms (opacity + translateX).

### TAB 1: "Patrimonio Financiero"

5 secciones como Cards verticales con gap 24px:

Sección I — "El valor del dinero en el tiempo":
  <Regla72Table patrimonio={outputs.motorB.patrimonio_financiero_total} />
  Texto: "Si inviertes tu patrimonio al {tasa}%, se duplica en {años} años. El tiempo es tu mejor aliado." Open Sans 14px.

Sección II — "Tu reserva de emergencia":
  <ReservaSemaforo meses={outputs.motorA.meses_cubiertos} benchmark={3} />
  Texto dinámico:
  - Si cubierta: "Tu reserva cubre {meses} meses de gastos básicos. Tienes un colchón sólido."
  - Si insuficiente: "Con {formatMXN(faltante)} adicionales completarías tu reserva de 3 meses."

Sección III — "Tu ciclo de vida financiero" (SECCIÓN HERO):
  <CurvaDesacumulacion curva={outputs.motorC.curva} ... />
  <GradoAvanceBar porcentaje={outputs.motorC.grado_avance} />
  <FuentesIngreso rentas={...} pension={...} patrimonio={...} />
  Texto: "Tus fuentes de ingreso en el retiro trabajan juntas para cubrir tu calidad de vida deseada."

Sección IV — "Protección de tu patrimonio":
  Lista de 2-3 cards pequeñas con icono Shield + recomendación + costo estimado.
  Basado en outputs.motorF:
  - Si no tiene seguro vida y tiene dependientes: "Seguro de vida: ${formatMXN(suma)} por ${formatMXN(costo)}/año"
  - Si no tiene seguro hogar y tiene inmuebles: "Seguro de hogar: ${formatMXN(valor)} por ${formatMXN(costo)}/año"
  - Si no tiene SGMM: "SGMM: protección médica desde ${formatMXN(15000)}/año"

Sección V — "Tus objetivos personales" (solo si Paso 5 completado):
  <TablaViabilidad objetivos={outputs.motorD.resultados} />
  <LegadoCard monto={outputs.motorD.legado} edadDefuncion={retiro.edad_defuncion} />

### TAB 2: "Balance General"

6 secciones:
1. <PatrimonioNetoCard neto={...} financiero={...} noFinanciero={...} pasivos={...} />
2. Composición del patrimonio: barra horizontal stacked con labels.
3. <IndiceSolvencia valor={outputs.motorE.indice_solvencia} clasificacion={...} />
4. Potencial de apalancamiento: card con 2 barras (Crédito líquidos 60% + Crédito inmuebles 50%).
   Total: Poppins Bold 20px sunset.
5. Longevidad: "Tus recursos cubren hasta los {longevidad} años" con icono Calendar.
6. <NivelRiquezaBadge nivel={...} ratio={...} benchmarkEdad={...} />

### TAB 3: "Tu Plan de Acción" — 5 Recomendaciones

Crear /lib/recomendaciones.ts:

```typescript
interface Recomendacion {
  numero: number; // 1-5
  titulo: string;
  texto: string;
  tipo: 'positivo' | 'accion' | 'alerta'; // para color del icono
}

function generarRecomendaciones(outputs, perfil, patrimonio, proteccion): Recomendacion[] {
  const recs: Recomendacion[] = [];
  
  // 1. Patrimonio vs gastos anuales
  if (outputs.motorB.nivel_riqueza === 'suficiente' || !['bien','genial','on-fire'].includes(outputs.motorB.nivel_riqueza)) {
    recs.push({
      numero: 1, tipo: 'accion',
      titulo: 'Tu patrimonio tiene espacio para crecer',
      texto: `Con tu capacidad de ahorro actual, podrías pasar de nivel "${outputs.motorB.nivel_riqueza}" a "${nextNivel}" en los próximos años. Cada peso que inviertes hoy trabaja para tu futuro.`
    });
  } else {
    recs.push({
      numero: 1, tipo: 'positivo',
      titulo: 'Tu patrimonio está bien posicionado',
      texto: `Estás en nivel "${outputs.motorB.nivel_riqueza}" — por encima del benchmark para tu edad. Tu siguiente meta: llegar a "${nextNivel}".`
    });
  }
  
  // 2. Liquidez / Reserva
  const meses = outputs.motorA.meses_cubiertos;
  if (meses !== null && meses < 3) {
    recs.push({
      numero: 2, tipo: 'accion',
      titulo: 'Fortalece tu reserva de emergencia',
      texto: `Tu reserva cubre ${meses.toFixed(1)} meses. Llegar a 3 meses te da tranquilidad ante cualquier imprevisto.`
    });
  } else {
    recs.push({
      numero: 2, tipo: 'positivo',
      titulo: 'Tu reserva de emergencia está cubierta',
      texto: `Cuentas con ${meses?.toFixed(1)} meses de gastos cubiertos. Tienes un colchón sólido.`
    });
  }
  
  // 3. Solvencia
  const solv = outputs.motorE.indice_solvencia;
  if (solv < 0.5) {
    recs.push({
      numero: 3, tipo: 'alerta',
      titulo: 'Tu nivel de deuda necesita atención',
      texto: `Tu índice de solvencia es ${(solv*100).toFixed(0)}%. Prioriza reducir pasivos para desbloquear tu potencial de crecimiento.`
    });
  } else {
    recs.push({
      numero: 3, tipo: 'positivo',
      titulo: 'Tu solvencia es saludable',
      texto: `Con un índice de ${(solv*100).toFixed(0)}%, tienes espacio para apalancarte estratégicamente.`
    });
  }
  
  // 4. Protección
  if (perfil.dependientes && !proteccion.seguro_vida) {
    recs.push({
      numero: 4, tipo: 'accion',
      titulo: 'Protege a quienes dependen de ti',
      texto: `Un seguro de vida de ${formatMXN(outputs.motorF.suma_asegurada)} te costaría solo ${formatMXN(outputs.motorF.costo_prima_anual)} al año. Es la mejor inversión para tu familia.`
    });
  } else {
    recs.push({
      numero: 4, tipo: 'positivo',
      titulo: 'Tu protección patrimonial está en orden',
      texto: 'Cuentas con las coberturas básicas para proteger tu patrimonio y a tu familia.'
    });
  }
  
  // 5. Retiro
  if (outputs.motorC.deficit_mensual > 0) {
    recs.push({
      numero: 5, tipo: 'accion',
      titulo: 'Tu retiro necesita un impulso',
      texto: `Para cubrir tu calidad de vida deseada, necesitas aportar ${formatMXN(outputs.motorC.deficit_mensual)} adicionales al mes. El simulador te muestra cómo lograrlo.`
    });
  } else {
    recs.push({
      numero: 5, tipo: 'positivo',
      titulo: 'Tu retiro está cubierto',
      texto: `Tienes un excedente de ${formatMXN(Math.abs(outputs.motorC.deficit_mensual))}/mes. Podrías dejar un legado de ${formatMXN(outputs.motorD?.legado || 0)} a tus beneficiarios.`
    });
  }
  
  return recs;
}
```

Renderizar las 5 recomendaciones como cards:
- Cada card: número en círculo 40px sunset + título Poppins Bold 16px blanco + texto Open Sans 14px.
- Tipo 'positivo': icono CheckCircle en exito. Borde izquierdo 3px exito.
- Tipo 'accion': icono ArrowRight en sunset. Borde izquierdo 3px sunset.
- Tipo 'alerta': icono AlertTriangle en alerta. Borde izquierdo 3px alerta.

### Botones Fixed Bottom

Fondo azul-acomp con blur. Padding 16px 32px. Gap 16px.
- "Descargar PDF" (primary) → genera PDF del tab actual (implementar en Prompt 10)
- "Abrir simulador" (accent) → navegar a /diagnosticos/demo/simulador
- "Nuevo diagnóstico" (ghost) → navegar a /dashboard
