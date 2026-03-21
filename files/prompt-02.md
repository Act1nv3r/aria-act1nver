# PROMPT 2 — Zustand Store + Stepper 6 Pasos + Layout Diagnóstico
# Sprint 1 | Tiempo estimado: 1 día

Lee el archivo .context/context.md para entender los 6 pasos del diagnóstico y los datos de cada uno.

## ZUSTAND STORE en /stores/diagnostico-store.ts

```typescript
interface DiagnosticoStore {
  // Navegación
  pasoActual: number;  // 1-6
  pasosCompletados: number[];
  modo: 'individual' | 'pareja';
  
  // Datos por paso
  perfil: {
    nombre: string; edad: number; genero: string; ocupacion: string; dependientes: boolean;
  } | null;
  
  flujoMensual: {
    ahorro: number; rentas: number; otros: number;
    gastos_basicos: number; obligaciones: number; creditos: number;
  } | null;
  
  patrimonio: {
    liquidez: number; inversiones: number; dotales: number;
    afore: number; ppr: number; plan_privado: number; seguros_retiro: number; ley_73: number | null;
    casa: number; inmuebles_renta: number; tierra: number; negocio: number; herencia: number;
    hipoteca: number; saldo_planes: number; compromisos: number;
  } | null;
  
  retiro: {
    edad_retiro: number; mensualidad_deseada: number; edad_defuncion: number;
  } | null;
  
  objetivos: {
    aportacion_inicial: number; aportacion_mensual: number;
    lista: { nombre: string; monto: number; plazo: number; }[];
  } | null;
  
  proteccion: {
    seguro_vida: boolean; propiedades_aseguradas: boolean | null; sgmm: boolean;
  } | null;
  
  // Outputs de motores (se calculan en Prompt 5)
  outputs: {
    motorA: any | null; motorB: any | null; motorC: any | null;
    motorD: any | null; motorE: any | null; motorF: any | null;
  };
  
  // Acciones
  setPaso: (paso: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  completarPaso: (paso: number) => void;
  updatePerfil: (data: any) => void;
  updateFlujoMensual: (data: any) => void;
  updatePatrimonio: (data: any) => void;
  updateRetiro: (data: any) => void;
  updateObjetivos: (data: any) => void;
  updateProteccion: (data: any) => void;
  updateOutputs: (motor: string, data: any) => void;
  reset: () => void;
}
```

Persistir en sessionStorage con middleware `persist` de Zustand.

PRELLENAR con datos de Juan Pérez al iniciar (para que la demo tenga datos desde el arranque):
```
perfil: { nombre: 'Juan Pérez', edad: 50, genero: 'H', ocupacion: 'asalariado', dependientes: true }
flujoMensual: { ahorro: 50000, rentas: 10000, otros: 0, gastos_basicos: 40000, obligaciones: 20000, creditos: 0 }
patrimonio: { liquidez: 200000, inversiones: 2000000, dotales: 100000, afore: 1000000, ppr: 0, plan_privado: 0, seguros_retiro: 0, ley_73: 35000, casa: 0, inmuebles_renta: 1000000, tierra: 0, negocio: 0, herencia: 0, hipoteca: 0, saldo_planes: 0, compromisos: 1000000 }
retiro: { edad_retiro: 60, mensualidad_deseada: 50000, edad_defuncion: 90 }
objetivos: { aportacion_inicial: 400000, aportacion_mensual: 15000, lista: [{ nombre: 'Educación hijos', monto: 500000, plazo: 5 }] }
proteccion: { seguro_vida: true, propiedades_aseguradas: false, sgmm: false }
```

## STEPPER en /components/diagnostico/stepper-nav.tsx

Componente horizontal de 6 pasos. Props: pasoActual, pasosCompletados, onStepClick.

Los 6 pasos con iconos Lucide React:
1. User → "Perfil"
2. DollarSign → "Flujo"
3. Briefcase → "Patrimonio"
4. Target → "Retiro"
5. Flag → "Objetivos"
6. Shield → "Protección"

Visual:
- Cada paso: círculo 40px con icono 20px centrado + label debajo.
- Línea conectora 2px horizontal entre pasos.
- Paso actual: fondo sunset (#E6C78A), icono blanco, label Poppins Bold 12px blanco.
- Completado: fondo exito (#317A70), icono blanco con check superpuesto, label exito.
- Futuro: fondo info/20, icono info/50, label info. Cursor not-allowed. No clickeable.
- Línea entre completados: exito. Entre futuros: info/30.
- Click en paso completado → onStepClick(paso). Click en futuro → nada.
- Transition 200ms al cambiar.

## LAYOUT en /app/(diagnostico)/layout.tsx

Barra contexto (sticky top-0, h-60px, bg azul-acomp, z-50, border-bottom 1px info/20):
- Izquierda: "{nombre}, {edad} años" en Poppins Bold 14px blanco (lee del store).
- Centro: espacio reservado para botón micrófono (Sprint 4).
- Derecha: "Guardado ✓" en Open Sans 12px exito (opacity 0 default, aparece 3s tras auto-save).

Stepper debajo de la barra (padding 24px horizontal, bg azul-grandeza).

Contenido:
- Desktop (≥1024px): CSS grid 12 cols gap-8.
  Formulario: col-span-8, padding 32px.
  Panel outputs: col-span-4, sticky top-[140px], max-h-[calc(100vh-160px)], overflow-y-auto, padding 24px.
- Tablet (<1024px): Formulario full-width. Outputs ocultos tras botón "Ver resultados ↑" que abre drawer.

Panel outputs (/components/diagnostico/output-panel.tsx):
- Header: "Tus resultados" Poppins Bold 16px sunset.
- Cards apiladas con gap 16px. Scroll vertical independiente.
- Empty state: "Completa los primeros pasos para ver tus resultados" Open Sans 14px info, centrado.
- Los outputs se agregan progresivamente (se conectan en Prompt 7).

Rutas:
- /app/(diagnostico)/diagnosticos/[id]/page.tsx → redirect a /paso/{pasoActual}
- /app/(diagnostico)/diagnosticos/[id]/paso/[step]/page.tsx → renderiza paso según step param
- step=1 → <Paso1Perfil />, step=2 → <Paso2Flujo />, etc. (los componentes se crean en Prompt 3)
- Por ahora [id] es siempre "demo" (string fijo, no hay backend).

Navegación entre pasos:
- Botón "Siguiente →" (primary) fixed en bottom del formulario → valida → completarPaso(n) → nextStep().
- Botón "← Anterior" (ghost) al lado → prevStep().
- En Paso 6: botón dice "Finalizar diagnóstico ✓" (accent/sunset) → navega a /completado.
