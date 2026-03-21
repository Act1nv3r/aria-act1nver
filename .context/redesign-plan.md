# ArIA — Plan Integral de Rediseño UX/UI
# Sr. Fintech Designer — Marzo 2026
# Producción: código listo para modificar directamente

---

## VISIÓN DE DISEÑO

**"Premium Intelligence"** — Una herramienta de diagnóstico financiero que se siente como
hablar con el mejor asesor del mundo: clara, sofisticada, que genera confianza instantánea.

Referentes de diseño: Robinhood (claridad de datos), Linear (micro-interacciones),
Stripe Dashboard (tablas y métricas), Wealthfront (visualizaciones financieras).

---

## PRINCIPIOS DE DISEÑO

1. **Numbers First**: Los números son los héroes. Grandes, legibles, con contexto inmediato.
2. **Progressive Disclosure**: Mostrar complejidad cuando se necesita, no todo junto.
3. **Live Feedback**: Cada input dispara un resultado visible. El usuario nunca espera.
4. **Trust Through Density**: La información densa (bien organizada) genera confianza.
5. **Conversational Flow**: El diagnóstico fluye como una conversación, no un formulario.

---

## FASE 1 — DESIGN TOKENS (globals.css + tailwind.config.ts)
### Archivo: src/app/globals.css

**PALETA REFINADA (mantener identidad Actinver, elevar calidad):**

```css
:root {
  /* === BACKGROUNDS === */
  --bg-base: #070B0F;           /* Más profundo que #0A0E12 */
  --bg-surface: #0F1923;        /* Reemplaza #1A2433 en cards */
  --bg-elevated: #162030;       /* Cards elevadas, dropdowns */
  --bg-overlay: #1C2940;        /* Modals, sidebars */
  --bg-subtle: #0D1520;         /* Hover states, filas alternas */

  /* === BRAND COLORS === */
  --brand-actinver: #2D4A7A;    /* Azul Actinver refinado */
  --brand-actinver-light: #3D5F9A;
  --brand-actinver-muted: rgba(45,74,122,0.15);

  /* === GOLD (ACCENT PRINCIPAL) === */
  --gold-500: #D4A853;          /* Gold primario — más refinado */
  --gold-400: #E6C478;          /* Light variant */
  --gold-300: #F0D898;          /* Muy claro — highlights */
  --gold-600: #B8893A;          /* Oscuro — hover */
  --gold-muted: rgba(212,168,83,0.12);
  --gold-subtle: rgba(212,168,83,0.06);

  /* === SEMANTIC — SUCCESS === */
  --success-500: #2A9D6B;
  --success-400: #38C07E;
  --success-muted: rgba(42,157,107,0.12);
  --success-subtle: rgba(42,157,107,0.06);

  /* === SEMANTIC — DANGER === */
  --danger-500: #C0392B;
  --danger-400: #E74C3C;
  --danger-muted: rgba(192,57,43,0.15);
  --danger-subtle: rgba(192,57,43,0.07);

  /* === SEMANTIC — WARNING === */
  --warning-500: #C67C3A;
  --warning-400: #E8924A;
  --warning-muted: rgba(198,124,58,0.15);

  /* === SEMANTIC — INFO === */
  --info-500: #4A8FC0;
  --info-400: #5AA8DC;
  --info-muted: rgba(74,143,192,0.12);

  /* === NEUTRAL SCALE === */
  --neutral-50: #F4F6F8;
  --neutral-100: #E8ECF0;
  --neutral-200: #C8D0D8;
  --neutral-300: #A0ACBA;
  --neutral-400: #7A8896;
  --neutral-500: #5A6878;
  --neutral-600: #3E4E60;
  --neutral-700: #283848;
  --neutral-800: #1C2A3A;
  --neutral-900: #0F1923;

  /* === BORDERS === */
  --border-subtle: rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --border-strong: rgba(255,255,255,0.18);
  --border-focus: var(--gold-500);
  --border-success: var(--success-500);
  --border-danger: var(--danger-500);

  /* === TEXT === */
  --text-primary: #FFFFFF;
  --text-secondary: #A0ACBA;   /* Reemplaza #5A6A85 — mejor contraste */
  --text-tertiary: #6A7888;
  --text-disabled: #3E4E60;
  --text-inverse: #070B0F;
  --text-gold: var(--gold-400);
  --text-success: var(--success-400);
  --text-danger: var(--danger-400);

  /* === SHADOWS / ELEVATION === */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.25);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.30);
  --shadow-lg: 0 8px 28px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.35);
  --shadow-xl: 0 16px 48px rgba(0,0,0,0.65), 0 8px 20px rgba(0,0,0,0.40);
  --shadow-gold: 0 0 24px rgba(212,168,83,0.20);
  --shadow-focus: 0 0 0 3px rgba(212,168,83,0.30);

  /* === BORDER RADIUS === */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-2xl: 28px;
  --radius-full: 9999px;

  /* === SPACING (base 4px) === */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* === TYPOGRAPHY === */
  --font-display: 2.5rem;    /* 40px — Números hero */
  --font-h1: 1.875rem;       /* 30px — Títulos de página */
  --font-h2: 1.5rem;         /* 24px — Títulos de sección */
  --font-h3: 1.25rem;        /* 20px — Subtítulos */
  --font-h4: 1.125rem;       /* 18px — Labels prominentes */
  --font-body-lg: 1rem;      /* 16px — Cuerpo principal */
  --font-body: 0.9375rem;    /* 15px — Cuerpo default */
  --font-body-sm: 0.875rem;  /* 14px — Labels */
  --font-caption: 0.75rem;   /* 12px — Metadatos */
  --font-micro: 0.6875rem;   /* 11px — Timestamps */

  /* === TRANSITIONS === */
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 350ms;
  --duration-slower: 500ms;
  --ease-default: cubic-bezier(0.16, 1, 0.3, 1);  /* Spring */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
}
```

**Animaciones nuevas:**
```css
@keyframes slideUpFade {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes countUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulseGold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(212,168,83,0); }
  50%       { box-shadow: 0 0 0 6px rgba(212,168,83,0.20); }
}
```

---

## FASE 2 — COMPONENTES UI (src/components/ui/)

### 2.1 button.tsx — REDISEÑO COMPLETO

**Cambios clave:**
- Usar CSS vars en lugar de colores hardcoded
- Añadir variant `danger` y `success`
- Mejorar hover/active states con transform
- Loading state con spinner nativo (no import extra)
- Focus ring con `--shadow-focus`

```tsx
// Variants:
// primary:  bg-[--brand-actinver] + gold border bottom (2px) para dar profundidad
// secondary: bg-[--bg-elevated] + border-[--border-default]
// outline:  transparent + border-[--border-strong] + hover bg-[--bg-subtle]
// ghost:    transparent + hover bg-[--bg-subtle]
// accent:   bg-[--gold-500] + text-[--text-inverse] — CTAs primarios
// danger:   bg-[--danger-muted] + border-[--danger-500]
// success:  bg-[--success-muted] + border-[--success-500]

// Estados:
// hover: opacity 0.9 + translateY(-1px)
// active: translateY(0) + scale(0.98)
// disabled: opacity-40 + cursor-not-allowed
// loading: spinner inline + text oculto con aria-hidden
```

### 2.2 input.tsx — REDISEÑO

**Cambios clave:**
- Background: `--bg-surface` (no transparente — da sensación de campo real)
- Border: `--border-default` → focus: `--border-focus` con `--shadow-focus`
- Label flotante animada (float label pattern) — moderno y limpio
- Subtext: helper text (gris) o error (rojo) bajo el campo
- Padding más generoso: py-3 px-4 (vs py-2 px-3 actual)
- Trailing icon slot para unidades o acciones

```tsx
// Estructura:
// <div className="field-wrapper">
//   <label className="float-label">Nombre</label>
//   <input className="input-field" />
//   <span className="field-hint">Texto de ayuda o error</span>
// </div>
```

### 2.3 currency-input.tsx — MEJORAS IMPORTANTES

**Cambios clave:**
- Formateo EN TIEMPO REAL (no solo al blur) con separadores de miles
- Prefijo "$" integrado visualmente dentro del campo (no flotante)
- Sufijo "MXN" en badge pequeño al final
- Animación sutil en valor cuando cambia
- Placeholder contextual: "$0" en vez de vacío
- Agregar prop `hint` para sugerencias (ej: "Gasto actual: $35,000")

### 2.4 select.tsx — REDISEÑO

**Cambios clave:**
- Dropdown con `--bg-elevated` + `--shadow-lg`
- Items con hover `--bg-overlay` + slide suave
- Selected item con checkmark gold al lado
- Soporte de grupos con separadores
- Transición de apertura: `scaleIn` keyframe

### 2.5 card.tsx — NUEVAS VARIANTES

```tsx
// Variantes:
// default:  bg-[--bg-surface] + border-[--border-subtle] + shadow-md
// elevated: bg-[--bg-elevated] + shadow-lg + border-[--border-default]
// outlined: bg-transparent + border-[--border-strong]
// glass:    bg-white/5 + backdrop-blur(12px) + border-white/10
// stat:     bg-[--bg-surface] con header gold (para métricas)
// hero:     bg gradient + shadow-gold — para resultados importantes

// Todas con: hover: border opacity sube, subtle translateY(-2px)
```

### 2.6 badge.tsx — MEJORAS

**Cambios clave:**
- Paleta semántica usando CSS vars
- Variante `outline` (solo borde, fondo transparente)
- Tamaños: xs / sm / md (actualmente solo un tamaño)
- Puntos de estado animados (dot pulsante para "en curso")

### 2.7 modal.tsx — REDISEÑO

**Cambios clave:**
- Entrada con `scaleIn` animation (0.2s spring)
- Backdrop blur: `backdrop-blur(8px)` + `bg-black/70`
- Tamaños: sm (400px) / md (560px) / lg (720px) / xl (900px)
- Header con título + subtítulo + close button bien posicionado
- Footer sticky con divider
- Scroll interno del body (max-height 80vh)
- Focus trap correcto (usar Radix Dialog ya existente)

### 2.8 slider.tsx — REDISEÑO VISUAL

**Cambios clave:**
- Track más grueso: h-2 (8px) vs h-1.5 actual
- Thumb más grande: 22px con sombra `--shadow-gold`
- Valor actual flotando encima del thumb (tooltip persistente)
- Tick marks opcionales para pasos clave
- Animación de fill: transición suave del gradiente

### 2.9 toggle.tsx — MEJORAS

**Cambios clave:**
- Tamaño más grande por default (46px × 26px)
- Off state: `--bg-overlay` con borde `--border-default` (más visible)
- On state: `--gold-500` como actualmente pero con glow
- Label integrado al componente (no solo en wrapper externo)
- Focus ring visible

### 2.10 accordion.tsx — REDISEÑO

**Cambios clave:**
- Trigger: full-width con chevron animado, hover bg-[--bg-subtle]
- Open state: borde izquierdo gold (4px) + bg-[--gold-subtle]
- Animación: height con `@keyframes accordion-down` (ya existe, mantener)
- Header con badge contador de campos completados: "3/5 campos"
- Multi-open support (desactivar single-collapse)

### 2.11 info-box.tsx — REEMPLAZAR CON TOOLTIP

**Nuevo diseño:**
- Reemplazar el patrón ⓘ button + positioned box
- Usar `@floating-ui/react` (ya instalado) para Tooltip real
- Trigger: ícono Info (16px) en gris, hover → dorado
- Tooltip: bg-[--bg-overlay] + border-[--border-default] + shadow-lg
- Mobile: tap toggle (no hover)
- Animación: `slideUpFade` 150ms

### 2.12 progress-bar.tsx — MEJORAR

**Cambios clave:**
- Track: bg-[--bg-overlay] (más visible)
- Animated fill con gradient: `--gold-600` → `--gold-400`
- Stripe animation cuando está "en proceso"
- Variante circular (progress ring) para el grado de avance

### 2.13 toast.tsx — MEJORAS

**Cambios clave:**
- Añadir botón X (close) explícito
- Role="alert" + aria-live="assertive"
- Stack múltiples toasts (máximo 3 visibles)
- Posición: top-right en desktop, top-center en mobile
- Barra de progreso de auto-dismiss visible

### NUEVOS COMPONENTES

### 2.14 NEW: stat-card.tsx

```tsx
// Componente para métricas dashboard/resultados
// Props: label, value, delta?, trend?, icon?, format?
// Diseño: label pequeño arriba + valor grande + delta con flecha
// Ejemplo: "Grado de Avance" | "106%" | "+6% sobre meta" ↑
```

### 2.15 NEW: section-header.tsx

```tsx
// Reemplaza los h3 inconsistentes en formularios
// Props: title, subtitle?, badge?, action?
// Diseño: título + badge + línea divisora + subtítulo opcional
```

### 2.16 NEW: tabs.tsx

```tsx
// Tabs accesibles para ResultsPage y Admin
// Variantes: pills (redondeados), underline (línea bottom)
// Animación: indicador que se mueve suavemente entre tabs
```

### 2.17 NEW: empty-state.tsx

```tsx
// Estado vacío unificado para dashboard, tablas, listas
// Props: icon, title, description, action?
```

---

## FASE 3 — NUEVA ARQUITECTURA DE LAYOUT

### 3.1 Login Page — SPLIT SCREEN
**Archivo:** `src/app/(auth)/login/page.tsx`

**Nueva estructura:**
```
┌─────────────────────┬──────────────────────┐
│   BRAND SIDE (45%)  │   FORM SIDE (55%)     │
│   bg-[--bg-surface] │   bg-[--bg-base]      │
│                     │                       │
│   ╔═══════════════╗ │   Iniciar sesión       │
│   ║  Actinver     ║ │   Bienvenido de vuelta │
│   ║  ◆ ArIA       ║ │                       │
│   ╚═══════════════╝ │   [Email field]       │
│                     │   [Password field]    │
│   Animated gradient │                       │
│   background with   │   [Iniciar sesión]    │
│   subtle number     │                       │
│   particles         │   ¿Olvidaste tu       │
│                     │   contraseña?         │
│   "Transforma el    │                       │
│   diagnóstico       │   ──── v1.0 ────      │
│   financiero"       │                       │
└─────────────────────┴──────────────────────┘
```

**Cambios:**
- Fondo lado izquierdo: gradiente radial `--bg-surface` → `--bg-overlay`
- Logo más grande y prominente
- Tagline bajo el logo
- Lado derecho: form centrado con max-w-sm
- Añadir "¿Olvidaste tu contraseña?" link
- Validación en tiempo real (not just on submit)
- Error state con shake animation

### 3.2 Dashboard — NUEVO LAYOUT
**Archivo:** `src/app/(dashboard)/dashboard/page.tsx`

**Nueva estructura:**
```
┌─────────────────────────────────────────────────────┐
│  HEADER: Logo + "Buenos días, [Asesor]" + Avatar    │
├─────────────────────────────────────────────────────┤
│  STATS ROW: [Clientes] [Completos] [En proceso]     │
├─────────────────────────────────────────────────────┤
│  ACTIONS: [🔍 Buscar...] [⊕ Nuevo diagnóstico] [↓] │
├─────────────────────────────────────────────────────┤
│  CLIENT LIST (table on desktop, cards on mobile)    │
│  Nombre       Edad  Estado       Última actividad   │
│  Juan Pérez   50    ✓ Completo   Hoy 2:34 pm        │
│  Ana García   45    ⏳ En proceso Ayer 11:20 am      │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

**Cambios:**
- Stat cards en la parte superior (3 métricas rápidas)
- Lista/tabla en vez de grid de cards
- Search integrado
- Estado del diagnóstico como badge de color
- Empty state ilustrado para cuando no hay clientes

### 3.3 Diagnostic Layout — REDISEÑO TOTAL
**Archivo:** `src/app/(diagnostico)/layout.tsx`

**NUEVA ARQUITECTURA DE 3 COLUMNAS:**
```
┌─────────────────────────────────────────────────────────────┐
│ TOPBAR (56px): Logo + "Juan Pérez, 50 años" + Voz + Guardar │
├──────────┬──────────────────────────┬────────────────────────┤
│  STEPPER │       FORM CENTER        │   LIVE RESULTS         │
│  (260px) │    (flex-1, max-w-lg)   │     (320px)            │
│          │                          │                        │
│  Paso 1 ✓│  ┌────────────────────┐ │  ┌──────────────────┐ │
│  Paso 2 ✓│  │  Flujo Mensual     │ │  │  Motor A Output  │ │
│  Paso 3 →│  │                    │ │  │  [Donut Chart]   │ │
│  Paso 4  │  │  INGRESOS          │ │  │                  │ │
│  Paso 5  │  │  [Ahorro]   $50K   │ │  │  Motor B Output  │ │
│  Paso 6  │  │  [Rentas]   $10K   │ │  │  [Wealth Badge]  │ │
│          │  │                    │ │  │                  │ │
│  ──────  │  │  EGRESOS           │ │  │  (Updates live   │ │
│  RESUMEN │  │  [Gastos]   $40K   │ │  │   as user types) │ │
│  Mini    │  │  [Créditos] $15K   │ │  │                  │ │
│          │  └────────────────────┘ │  └──────────────────┘ │
│          │  [← Anterior] [Siguiente→]                      │
└──────────┴──────────────────────────┴────────────────────────┘

MOBILE: Tabs inferiores [Formulario] [Resultados]
        Stepper como progress bar horizontal en top
```

**Cambios:**
- Stepper vertical en sidebar izquierdo (vs horizontal actual)
- Panel de resultados derecho SIEMPRE visible en desktop
- Resultados se actualizan mientras el usuario escribe (debounce 400ms)
- Mobile: bottom tabs para alternar form ↔ resultados
- Stepper sidebar incluye mini-resumen de datos ya capturados

---

## FASE 4 — STEPPER NAV REDISEÑO
**Archivo:** `src/components/diagnostico/stepper-nav.tsx`

**Nueva estructura (vertical, en sidebar):**
```
─────────────────────
  ✓  Perfil              ← completed (teal, checkmark)
     Juan Pérez, 50
─────────────────────
  ✓  Flujo Mensual
     $60K ing. / $55K eg.
─────────────────────
  →  Patrimonio          ← current (gold, animated dot)
     3 de 4 secciones
─────────────────────
     Retiro              ← pending (gray, locked icon)
─────────────────────
     Objetivos
─────────────────────
     Protección
─────────────────────
```

**Cambios:**
- Vertical layout (no horizontal)
- Cada paso muestra un dato resumen cuando está completado
- Indicador de progreso parcial ("3 de 4 secciones")
- Animación de transición entre estados
- Click en completed steps navega directamente

---

## FASE 5 — FLUJO DIAGNÓSTICO (6 PASOS)

### 5.1 Paso 1 — Perfil
**Archivo:** `src/components/diagnostico/paso1-perfil.tsx`

**Cambios:**
- Layout: Nombre y Edad en una fila (2 columnas)
- Género: botones visuales en grid (H / M / Otro / Prefiero no decir) vs select dropdown
- Ocupación: 3 opciones como pill-buttons con ícono
- Dependientes: toggle grande con label explicativo
- Tooltips (nuevo componente) en lugar de InfoBox bulky
- Validación en tiempo real

```tsx
// Diseño del campo género:
// ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────┐
// │  ♂  │ │  ♀  │ │  ⊕  │ │  Sin indicar │
// │ Hom. │ │ Muj. │ │ Otro │ │              │
// └──────┘ └──────┘ └──────┘ └──────────────┘
```

### 5.2 Paso 2 — Flujo Mensual
**Archivo:** `src/components/diagnostico/paso2-flujo.tsx`

**CAMBIO PRINCIPAL: Layout de balance visual**
```
┌─────────────────────────────────────────────┐
│  BALANCE MENSUAL: $5,000 remanente          │ ← Live counter
├──────────────────────┬──────────────────────┤
│  INGRESOS 🟢         │  EGRESOS 🔴          │
│                      │                      │
│  Ahorro     $50,000  │  Gastos     $40,000  │
│  Rentas     $10,000  │  Obligac.   $10,000  │
│  Otros      $ 5,000  │  Créditos   $10,000  │
│  ─────────────────   │  ─────────────────   │
│  Total: $65,000      │  Total: $60,000      │
└──────────────────────┴──────────────────────┘
```

**Cambios:**
- Totales automáticos actualizados en tiempo real
- Remanente mensual prominente en header de la sección
- Código de color: ingresos = verde, egresos = rojo, remanente = gold/rojo
- Donut chart visible inline (no solo en panel derecho)

### 5.3 Paso 3 — Patrimonio
**Archivo:** `src/components/diagnostico/paso3-patrimonio.tsx`

**CAMBIO PRINCIPAL: De accordion colapsado → secciones con header siempre visible**

```
╔══════════════════════════════════════════════╗
║  PATRIMONIO FINANCIERO                       ║
║  Subtotal: $2,300,000                   [−] ║
╠══════════════════════════════════════════════╣
║  Liquidez     $200,000                       ║
║  Inversiones  $2,000,000                    ║
║  Dotales      $100,000                      ║
╠══════════════════════════════════════════════╣
║  ESQUEMAS DE RETIRO                          ║
║  Subtotal: $1,100,000                   [−] ║
╠══════════════════════════════════════════════╣
║  Afore        $1,000,000                    ║
║  PPR          $0                            ║
║  ...                                        ║
╚══════════════════════════════════════════════╝
```

**Barra de composición patrimonial (siempre visible en top):**
```
Total: $5,400,000 | Patrimonio Neto: $4,400,000
████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
[Financiero 43%] [No Financiero 39%] [Pasivos 18%]
```

**Cambios:**
- Subtotales visibles por sección (header siempre)
- Barra de composición encima de los campos
- Campos en 2 columnas en desktop para reducir scroll
- Saldo acumulado total flotante en sticky bottom
- Accordions TODOS abiertos por default

### 5.4 Paso 4 — Retiro
**Archivo:** `src/components/diagnostico/paso4-retiro.tsx`

**CAMBIO PRINCIPAL: Los sliders son los héroes**

```
╔════════════════════════════════════════════════╗
║  En 10 años te retiras                         ║
║                                                ║
║  Edad de retiro                                ║
║  [51 ────────────────●──────────── 70]         ║
║              60 años                          ║
║                                                ║
║  Mensualidad deseada                           ║
║  Sugerencia: tus gastos actuales = $50,000    ║
║  [$ __50,000__________________]               ║
║                                                ║
║  Estimado de vida                              ║
║  [60 ─────────────────────●── 95]             ║
║                        90 años                ║
╚════════════════════════════════════════════════╝

╔════════════════════════════════════════════════╗
║  RESULTADO PROYECTADO                          ║
║                                                ║
║  🟢 Tienes 106% de cobertura                  ║  ← grade of advance
║                                                ║
║  Podrás retirar: $53,175/mes                  ║  ← big number
╚════════════════════════════════════════════════╝
```

**Cambios:**
- Resultado de Motor C visible DEBAJO de los sliders (no solo en panel derecho)
- Slider de edad muestra "en X años" como label dinámico
- Curva de desacumulación animada que cambia con sliders
- Color del resultado: verde (>100%) / amarillo (80-100%) / rojo (<80%)

### 5.5 Paso 5 — Objetivos
**Archivo:** `src/components/diagnostico/paso5-objetivos.tsx`

**Cambios:**
- Cards de objetivos con progress indicator de viabilidad
- Timeline visual (horizontal, tipo Gantt ligero) de los objetivos
- Botón "Agregar objetivo" más prominente
- Límite visual de 5 ("5 máximo, tienes X disponibles")
- Cada card muestra si es viable o no en tiempo real

### 5.6 Paso 6 — Protección
**Archivo:** `src/components/diagnostico/paso6-proteccion.tsx`

**CAMBIO PRINCIPAL: De toggles simples → visualización de brechas**

```
╔══════════════════════════════════════════════╗
║  COBERTURA ACTUAL                            ║
╠══════════════════════════════════════════════╣
║  Vida    [○ SIN COBERTURA]  ← toggle         ║
║  ⚠ Con dependientes, se recomienda           ║
║    Suma sugerida: $3,850,000                 ║
║    Prima estimada: $26,950/año               ║
╠══════════════════════════════════════════════╣
║  Propiedades  [● CON COBERTURA]              ║
║  ✓ Inmuebles asegurados                     ║
╠══════════════════════════════════════════════╣
║  SGMM  [○ SIN COBERTURA]                    ║
║  ⚠ Costo estimado: $18,000–$30,000/año      ║
╚══════════════════════════════════════════════╝
```

**Cambios:**
- Cada toggle muestra las implicaciones de no tener cobertura
- Montos sugeridos calculados por Motor F (visibles inline)
- Color semáforo: rojo = sin cobertura + recomendado, verde = cubierto
- Botón final "Finalizar diagnóstico" con resumen de alertas

---

## FASE 6 — RESULTADOS Y OUTPUTS

### 6.1 Pantalla Completado
**Archivo:** `src/app/(diagnostico)/diagnosticos/[id]/completado/page.tsx`

**Nueva estructura:**
```
┌──────────────────────────────────────────────┐
│  HERO: "Tu diagnóstico financiero"           │
│  Juan Pérez · 50 años · Hoy                  │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Riqueza  │ │ Retiro   │ │ Pat.Neto │    │
│  │  Genial  │ │  106%    │ │ $4.4M    │    │
│  └──────────┘ └──────────┘ └──────────┘    │
├──────────────────────────────────────────────┤
│  TABS: [Flujo] [Patrimonio] [Retiro] [Metas] │
├──────────────────────────────────────────────┤
│  [Contenido del tab activo]                 │
├──────────────────────────────────────────────┤
│  ACCIONES: [PDF] [Compartir] [Simular]       │
└──────────────────────────────────────────────┘
```

**Cambios:**
- 3 stat cards en hero (KPIs clave)
- Tabs para organizar resultados (vs scroll infinito)
- Confetti: solo una vez (no en cada re-render)
- Botones de acción en fila ordenada

### 6.2 Output Components — MEJORAS

**output-panel.tsx:**
- Añadir animación `countUp` en números al aparecer
- Sección headers con `section-header.tsx` nuevo componente

**curva-desacumulacion.tsx:**
- Más grande (altura 320px)
- Annotation markers: "Inicio retiro", "Recursos agotados" o "Herencia"
- Tooltip más rico: edad + saldo + variación

**grado-avance-bar.tsx:**
- Reemplazar progress bar simple con gauge/semi-circle
- Colores: verde (>100%), amarillo (80-99%), rojo (<80%)
- Animación de fill (1.5s ease-out)

**deficit-card.tsx:**
- Más visual: ícono grande + número + CTA
- Versión positiva (excedente) más celebrativa

### 6.3 Simulador
**Archivo:** `src/app/(diagnostico)/diagnosticos/[id]/simulador/page.tsx`

**Cambios:**
- Header con "vs Diagnóstico actual" comparativa
- Sliders con valor actual del diagnóstico marcado con línea punteada
- Resultados: columnas "Actual" vs "Simulado" con delta en color
- Reset button animado

### 6.4 Wrapped
**Archivo:** `src/app/(diagnostico)/diagnosticos/[id]/wrapped/page.tsx`

**Cambios:**
- Cards más refinadas con gradientes (no colores planos)
- Typography más bold y grande (estilo editorial)
- Transición entre cards con slide horizontal suave
- Preview en pantalla antes de descargar

---

## FASE 7 — ADMIN PANEL

**Archivo:** `src/app/(dashboard)/admin/` (todas las páginas)

**Cambios generales:**
- Sidebar de navegación fija (vs tabs)
- Tables con mejor densidad y sorting
- Stats cards en dashboard principal
- Formularios de edición en slide-over (no páginas separadas)

---

## ORDEN DE IMPLEMENTACIÓN (dependencias)

```
Wave 1 — Fundación (Todo depende de esto):
  1. src/app/globals.css         → Tokens CSS
  2. tailwind.config.ts          → Extend con tokens

Wave 2 — Componentes base (sin dependencias entre sí):
  3. src/components/ui/button.tsx
  4. src/components/ui/input.tsx
  5. src/components/ui/currency-input.tsx
  6. src/components/ui/select.tsx
  7. src/components/ui/card.tsx
  8. src/components/ui/badge.tsx
  9. src/components/ui/modal.tsx
  10. src/components/ui/slider.tsx
  11. src/components/ui/toggle.tsx
  12. src/components/ui/accordion.tsx
  13. src/components/ui/info-box.tsx   → tooltip refactor
  14. src/components/ui/progress-bar.tsx
  15. src/components/ui/toast.tsx
  16. src/components/ui/skeleton.tsx
  17. src/components/ui/tabs.tsx       → NEW
  18. src/components/ui/stat-card.tsx  → NEW
  19. src/components/ui/section-header.tsx → NEW
  20. src/components/ui/empty-state.tsx → NEW

Wave 3 — Layout y navegación:
  21. src/app/(auth)/login/page.tsx
  22. src/app/(dashboard)/dashboard/page.tsx
  23. src/app/(diagnostico)/layout.tsx → 3-column
  24. src/components/diagnostico/stepper-nav.tsx → vertical

Wave 4 — Flujo de diagnóstico:
  25. src/components/diagnostico/paso1-perfil.tsx
  26. src/components/diagnostico/paso2-flujo.tsx
  27. src/components/diagnostico/paso3-patrimonio.tsx
  28. src/components/diagnostico/paso4-retiro.tsx
  29. src/components/diagnostico/paso5-objetivos.tsx
  30. src/components/diagnostico/paso6-proteccion.tsx

Wave 5 — Outputs y resultados:
  31. src/components/outputs/output-panel.tsx
  32. src/components/outputs/grado-avance-bar.tsx → gauge
  33. src/components/outputs/curva-desacumulacion.tsx → enhanced
  34. src/components/outputs/deficit-card.tsx → enhanced
  35. src/app/(diagnostico)/diagnosticos/[id]/completado/page.tsx
  36. src/app/(diagnostico)/diagnosticos/[id]/simulador/page.tsx
  37. src/app/(diagnostico)/diagnosticos/[id]/wrapped/page.tsx

Wave 6 — Admin:
  38. src/app/(dashboard)/admin/page.tsx
  39. src/app/(dashboard)/admin/asesores/page.tsx
  40. src/app/(dashboard)/admin/parametros/page.tsx
```

---

## MÉTRICAS DE ÉXITO

- Lighthouse Performance > 90
- Lighthouse Accessibility > 90
- WCAG AA en contrastes (mínimo 4.5:1 texto normal)
- Tiempo de diagnóstico: mantener < 11 minutos
- 0 errores de TypeScript strict
- Mobile-first: funcional en 375px

---

## ARCHIVOS QUE NO SE TOCAN

- src/lib/motors/*.ts            → Lógica de cálculo intacta
- src/stores/*.ts                → Estado Zustand intacto
- src/lib/api-client.ts          → API client intacto
- src/lib/pdf-generator.ts       → Generador PDF intacto
- backend/                       → Backend completo intacto
- src/lib/wrapped-generator.ts   → ZIP generator intacto
