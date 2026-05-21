# Plataforma ArIA — mapa de producto, rutas y tecnología

*English summary: Product and technical inventory for ArIA by Actinver: who uses it, main routes, UI stack, and design tokens from the codebase.*

---

## 1. Qué es ArIA (producto)

- **Nombre comercial:** ArIA by Actinver (metadata del sitio: herramienta de diagnóstico y planeación financiera personal).
- **Usuarios principales:**
  - **Asesor** autenticado: gestiona clientes, CRM, diagnósticos, entrevista asistida (voz), presentaciones y documentos.
  - **Admin:** panel administrativo (asesores, parámetros, glosario, auditoría, referrals, aviso de privacidad).
  - **Cliente (enlace):** experiencia bajo ruta `(cliente)/cliente/[token]` sin el mismo shell que el dashboard completo.
- **Idioma UI:** `lang="es"` en el layout raíz.
- **Dominios de experiencia clave:** autenticación, lista de clientes y CRM, **sesión de diagnóstico por voz** (transcripción + panel de datos), **presentación de resultados** (varias variantes), PDFs (balance, diagnóstico), flujos post-diagnóstico (completado, simulador, wrapped).

---

## 2. Rutas principales (Next.js App Router)

Rutas reales bajo `src/app/` (prioridad alta para rediseño):

| Ruta | Descripción breve |
|------|-------------------|
| `/` | Redirección a `/dashboard` o `/login` según sesión. |
| `/login` | Autenticación asesor. |
| `/dashboard` | Home de asesor: clientes / accesos rápidos. |
| `/crm` | Listado CRM. |
| `/crm/[clienteId]` | Perfil cliente: actividades, documentos, descargas PDF. |
| `/diagnosticos/[id]` | Entrada/hub del diagnóstico. |
| `/diagnosticos/[id]/sesion` | **Entrevista por voz** — UI densa: panel Navi, transcripción, “command center” de datos. |
| `/diagnosticos/[id]/presentacion` | Reporte / presentación (técnica). |
| `/diagnosticos/[id]/presentacion-b` | Presentación “premium” (incluye plantilla PDF balance en DOM). |
| `/diagnosticos/[id]/completado` | Cierre de flujo. |
| `/diagnosticos/[id]/simulador` | Simulador. |
| `/diagnosticos/[id]/wrapped` | Wrapped / cierre creativo. |
| `/diagnosticos/[id]/paso/[step]` | Wizard por pasos (si aplica al flujo actual). |
| `/cliente/[token]` | Vista cliente por token. |
| `/admin/*` | Dashboard, asesores, parámetros, glosario, auditoría, referrals, aviso privacidad. |

**Layouts de grupo:**

- `(dashboard)/layout.tsx` — header sticky, marca Actinver + “ArIA”, nav “Mis Clientes”, “Admin” si rol admin, logout.
- `(diagnostico)/layout.tsx` — shell específico de flujo diagnóstico (revisar en código para patrones de navegación entre pasos).
- `(dashboard)/admin/layout.tsx` — sidebar admin ~240px, fondo `#1A2433`, ítems activos oro/azul Actinver.

---

## 3. Stack técnico front (implementación real)

| Capa | Tecnología |
|------|------------|
| Framework | **Next.js 16.2** (App Router) |
| UI | **React 19**, **Tailwind CSS v4** (`@import "tailwindcss"`, `@theme inline` en `globals.css`) |
| Componentes | **Radix** (accordion, dialog, select, slider), componentes propios bajo `src/components/` |
| Iconos | **lucide-react** |
| Formularios | **react-hook-form**, **zod**, **@hookform/resolvers** |
| Estado cliente | **zustand** (persist en diagnóstico y auth) |
| Datos async | **@tanstack/react-query** |
| Gráficos | **recharts** |
| PDF cliente | **html2canvas**, **jspdf** |
| Animación celebración | **canvas-confetti** (presente en algunos flujos; reporte técnico puede resetear confetti al montar) |
| Fuentes (layout raíz) | **Poppins** (variable `--font-poppins`), **Open Sans** (`--font-open-sans`) — body usa Open Sans por defecto en `body` class |

**Backend asociado (contexto, no diseño):** API FastAPI, PostgreSQL, CRM integrado; el diseñador solo necesita saber que hay **listas, formularios, tabs, documentos** con datos remotos y estados de carga/error.

---

## 4. Sistema visual actual (tokens en `src/app/globals.css`)

Colores de marca Actinver ya definidos como variables CSS en `@theme inline`:

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-azul-grandeza` | `#060D1A` | Fondo profundo |
| `--color-azul-acomp` | `#0C1829` | Acompañamiento |
| `--color-azul-actinver` | `#1A3154` | Azul institucional |
| `--color-arena` / `--color-blanco` | `#F0F4FA` | Texto claro / superficies claras |
| `--color-sunset` | `#C9A84C` | Acento oro (marca, focus, CTAs secundarios) |
| `--color-gold-light` / `--color-gold-dark` | `#E8C872` / `#A8893A` | Paleta oro extendida |
| `--color-exito` / `--color-alerta` / `--color-error-brand` / `--color-info` | verde / ámbar / rojo / azul info | Estados |
| Superficies | `--color-surface-01` … `03` | Capas de UI oscura |
| Bordes | `--color-border-subtle` … `strong` | rgba blancos bajos |
| Texto | `--color-text-primary` … `muted` | Jerarquía |
| Espaciado | `--spacing-1` … `6` (base 8px) | Grid vertical |
| Radios | `--radius-card`, `--radius-input`, `--radius-modal`, `--radius-button` | Consistencia |
| Sombras | `--shadow-card`, `--shadow-glow`, `--shadow-elevated` | Profundidad |
| Fuentes tema | `--font-heading`, `--font-body` → Poppins | Títulos/cuerpo en tema |

**`:root`:** `--background: #060D1A`, `--foreground: #F0F4FA`.

**Focus:** `outline: 2px solid var(--color-sunset)` en `:focus-visible`.

**Accesibilidad ya presente:** skip link “Saltar al contenido principal” en layout raíz.

**Nota para diseño:** En varios componentes aún hay **colores hardcodeados** (ej. `#5A6A85`, `#1A2433`, `#314566`) mezclados con tokens — oportunidad de **unificar** en Stitch hacia tokens con nombre.

---

## 5. Patrones de UI recurrentes (para el kit)

- **Header glass:** `backdrop-filter`, borde inferior sutil en dashboard.
- **Pills de navegación** entre Mis Clientes / Admin.
- **Cards oscuras** con bordes `white/opacity` baja y acentos oro.
- **Sesión voz:** dos columnas (datos extraídos vs transcripción / Navi) — crítico para responsive.
- **CTAs duales** en presentación (plan patrimonial, resumen, secciones colapsables tipo House View).
- **Tabs CRM:** perfil, actividades, documentos — deduplicación y descarga PDF con fallback de ruta.

---

## 6. Riesgos y restricciones de diseño

1. **PDF:** parte del balance depende de un nodo DOM con id fijo en ciertas rutas; cambios de layout deben coordinarse con `balance-pdf-template` y generadores PDF.
2. **Sesión voz:** latencia de STT/NLU — estados de “escuchando”, “procesando”, error de micrófono deben diseñarse explícitamente.
3. **Roles:** admin vs asesor cambia nav y rutas bloqueadas.
4. **Marca:** mantener lectura “premium institucional mexicana” (Actinver), no genérico fintech global a menos que sea decisión explícita de negocio.

---

Este documento es la **fuente de verdad técnica-producto** para alimentar `design.md` y los prompts de Stitch.
