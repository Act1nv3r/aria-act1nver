# PROMPT 3 — Los 6 Formularios del Diagnóstico
# Sprint 1 | Tiempo estimado: 2 días

Crea los 6 componentes de formulario del diagnóstico en /components/diagnostico/. Cada uno usa React Hook Form con zodResolver. Los datos se leen/escriben del Zustand store (diagnostico-store.ts). Cada campo financiero tiene un <InfoBox>.

## /components/diagnostico/paso1-perfil.tsx

Título: "Conoce a tu cliente" Poppins Bold 24px. Subtítulo: "Estos datos personalizan el diagnóstico" Open Sans 14px info.

5 campos:
1. Nombre/Alias: <Input label="Nombre o alias" placeholder="Ej: Juan Pérez" maxLength={80} />
   InfoBox: "El nombre se usa solo para identificar el diagnóstico. Puedes usar un alias."
2. Edad: <Input type="number" label="Edad actual" min={18} max={90} />
   InfoBox: "La edad determina el horizonte de inversión y los benchmarks de patrimonio."
3. Género: <Select label="Género" options={['Hombre','Mujer','Otro','Prefiero no decir']} />
4. Ocupación: <Select label="Ocupación" options={['Asalariado','Independiente','Empresario']} />
   InfoBox: "La ocupación influye en las fuentes de ingreso para tu plan de retiro."
5. Dependientes: <Toggle label="¿Tiene dependientes económicos?" />
   InfoBox: "Si tienes personas que dependen de ti, las recomendaciones de protección se ajustan."

Zod: nombre z.string().min(1).max(80), edad z.number().min(18).max(90), genero z.enum(['H','M','O','NS']), ocupacion z.enum(['asalariado','independiente','empresario']), dependientes z.boolean()

Submit: updatePerfil(data) → completarPaso(1) → nextStep()

## /components/diagnostico/paso2-flujo.tsx

Título: "¿Cómo se mueve tu dinero cada mes?"

Sección "Ingresos" (3 campos CurrencyInput):
1. "Capacidad de ahorro mensual" — InfoBox: "El dinero que puedes apartar cada mes. Tu principal herramienta para construir patrimonio."
2. "Ingresos por rentas" — InfoBox: "Ingresos recurrentes de propiedades en renta."
3. "Otros ingresos mensuales"

Sección "Gastos" (3 campos CurrencyInput):
4. "Gastos básicos mensuales" — InfoBox: "Alimentación, transporte, servicios, educación. No incluyas ahorros."
5. "Obligaciones financieras" — InfoBox: "Pagos fijos: pensiones alimenticias, colegiaturas, seguros."
6. "Créditos mensuales" — InfoBox: "Pagos de créditos activos: hipoteca, auto, tarjetas."

Zod: todos z.number().min(0), excepto gastos_basicos: z.number().min(1, 'Debe ser mayor a $0')
Submit: updateFlujoMensual → ejecutar Motor A (cuando exista, Prompt 5) → completarPaso(2) → nextStep()

## /components/diagnostico/paso3-patrimonio.tsx

Título: "El panorama completo de tu patrimonio"

4 acordeones con <Accordion>:

Acordeón 1 "Patrimonio Financiero" (defaultOpen):
  Total parcial en header. 3 CurrencyInputs: Liquidez, Inversiones, Dotales.
  InfoBox Liquidez: "Dinero disponible hoy: saldo en cuentas de débito o instrumentos de inmediata liquidez."
  InfoBox Inversiones: "Instrumentos que generan rendimientos: fondos, acciones, bonos, ETFs."
  InfoBox Dotales: "Seguros de ahorro que combinan protección con crecimiento a largo plazo."

Acordeón 2 "Esquemas de Retiro":
  4-5 CurrencyInputs: Afore, PPR, Plan privado, Seguros retiro.
  CONDICIONAL: Si perfil.edad >= 46, mostrar campo "Mensualidad Ley 73" con banner "Aplica si cotizaste antes de julio 1997" (fondo sunset/10, Open Sans 12px). Si edad < 46, NO renderizar este campo.
  InfoBox Afore: "Tu cuenta de ahorro para el retiro administrada por una Afore."
  InfoBox PPR: "Cuenta de ahorro para retiro voluntaria con beneficios fiscales."
  InfoBox Ley 73: "Si cotizaste antes del 1 de julio de 1997, puedes recibir pensión con la ley anterior."

Acordeón 3 "Patrimonio No Financiero":
  5 CurrencyInputs: Casa, Inmuebles renta, Tierra, Negocio, Herencia.
  InfoBox Inmuebles renta: "Bienes que generan ingresos: inmuebles en renta, locales comerciales."

Acordeón 4 "Pasivos y Obligaciones":
  Total parcial en header (rojo si > 0). 3 CurrencyInputs: Hipoteca, Saldo planes, Compromisos.
  InfoBox Compromisos: "Gastos grandes que sabes que vienen: bodas, cirugías, compromisos pendientes."

Submit: updatePatrimonio → ejecutar Motor B + E → completarPaso(3) → nextStep()

## /components/diagnostico/paso4-retiro.tsx

Título: "Diseña tu retiro ideal"

3 campos:
1. <Slider label="Edad de retiro" min={perfil.edad+1} max={70} step={1} value={60} formatValue={v=>`${v} años`} />
   InfoBox: "Cada año adicional de trabajo puede mejorar significativamente tu retiro."
2. <CurrencyInput label="Mensualidad deseada en retiro" />
   Sugerencia: "Tus gastos actuales: ${formatMXN(gastos_basicos+obligaciones)}/mes" Open Sans 12px info.
   InfoBox: "¿Cuánto necesitas al mes para vivir cómodamente cuando te retires?"
3. <Slider label="Edad de defunción estimada" min={edad_retiro} max={95} step={1} value={90} />
   InfoBox: "Esperanza de vida MX: 76 años. Para planeación se recomienda 85-90 por seguridad."

Submit: updateRetiro → ejecutar Motor C → completarPaso(4) → nextStep()

## /components/diagnostico/paso5-objetivos.tsx

Título: "Tus metas personales (opcional)"

2 CurrencyInputs fijos: Aportación inicial, Aportación mensual.
Lista dinámica hasta 5 objetivos: Botón "+ Agregar objetivo" (outline sunset).
Cada objetivo: card con Input nombre (max 40), CurrencyInput monto, Input plazo años + botón ✕ eliminar.
Validación: plazo no puede exceder (edad_retiro - edad). Error: "El plazo excede tu edad de retiro."
Botón "Saltar este paso →" (ghost) → ir directo a Paso 6.
Submit: updateObjetivos → ejecutar Motor D → completarPaso(5) → nextStep()

## /components/diagnostico/paso6-proteccion.tsx

Título: "Protege lo que construiste"

3 toggles:
1. "¿Cuenta con seguro de vida?" InfoBox: "Protege a tus dependientes económicos."
2. CONDICIONAL (solo si casa+inmuebles_renta+tierra > 0): "¿Propiedades aseguradas?"
3. "¿Cuenta con SGMM?" InfoBox: "Seguro de Gastos Médicos Mayores. Sin él, una emergencia puede comprometer años de ahorro."

Botón "Finalizar diagnóstico ✓" (accent sunset, full-width, grande).
Submit: updateProteccion → ejecutar Motor F → completarPaso(6) → navegar a /completado
