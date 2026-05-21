# Google Stitch — qué pedir y qué traer de vuelta a Cursor

*English summary: Copy-paste prompts for Stitch, then a checklist of artifacts to bring back so a coding agent can implement the redesign safely.*

---

## Parte A — Qué subir / adjuntar en Stitch antes de generar

1. **`design.md`** (de esta carpeta) — brief maestro.
2. **`02-plataforma-aria-mapa-producto-y-tech.md`** — rutas, stack, tokens reales.
3. **Opcional pero muy útil:** 5–10 capturas de pantalla actuales (login, dashboard, sesión voz, CRM cliente, presentación) anotadas con números.

---

## Parte B — Prompts listos para copiar en Stitch

Usa uno o combina **B1** (kit) + **B2** (pantallas). Sustituye `[…]` solo si quieres acotar.

### B1 — Solo UI Kit + tokens

```text
You are designing a UI kit for "ArIA by Actinver", a Spanish-language dark-mode web app for wealth advisors (Actinver, Mexico). Read the attached design.md and technical context.

Deliver:
1. Color system as Figma-style variables (dark theme primary) + semantic colors.
2. Typography scale: Poppins for headings, Open Sans for body.
3. Core components with all states: Button (primary/secondary/destructive/icon), Input, Select, Textarea, Card (3 variants), Tabs, Table (CRM), Badge, Modal, Toast, Sidebar (240px), Top app header with glass blur, Skeleton, Alert inline.
4. Spacing (8px grid), radii (16 card, 10 button/input, 20 modal), shadows.
5. Accessibility: focus ring color #C9A84C, min 44px touch targets on mobile variants.

Output: structured sections with component names, variant list, and token table. Spanish UI labels in examples.
```

### B2 — Pantallas prioritarias

```text
Using the attached design.md and product route list, produce high-fidelity layouts (desktop 1440px and mobile 390px) for these screens in Spanish:

login, dashboard (client list), crm-client-detail (tabs: resumen, actividades, documentos), voice-diagnostic-session (two-column: extracted data left, live transcript right + listening state), presentation-results (narrative sections + two primary CTAs + one collapsible "House View" market section), admin-dashboard (sidebar layout).

For each screen: list components reused from the kit, note scroll/sticky behavior, and flag any area that must stay "PDF-safe" (flat colors, no problematic shadows) for html2canvas export.

Mark each frame with an ID matching: login, dashboard, crm-cliente, sesion-voz, presentacion, admin-dashboard.
```

### B3 — Rediseño explícito “evolución de marca”

```text
Evolve the current Actinver ArIA dark UI toward a more premium, calmer interface without breaking brand: deep navy #060D1A family, gold accent #C9A84C. Reduce visual noise: unify grays into the token system, increase whitespace on dashboard, tighten the voice session information hierarchy. Show before/after notes per screen. Spanish copy.
```

---

## Parte C — Qué necesito de ti cuando regreses a Cursor (checklist de handoff)

Para implementar sin adivinar, lo ideal es traer **uno o más** de estos formatos:

| Prioridad | Artefacto | Por qué lo necesito |
|-----------|-----------|---------------------|
| **P1** | Enlace o export de Stitch (si permite compartir vista) | Contexto visual. |
| **P1** | **PNG/SVG** de cada pantalla clave (desktop + mobile) o PDF de deck | Pixel reference para spacing y jerarquía. |
| **P1** | Lista de **frames con IDs** exactos (`login`, `sesion-voz`, …) | Mapeo 1:1 a rutas `src/app/...`. |
| **P2** | **Token table** (nombre → hex o CSS) nueva o diff vs `globals.css` | Actualizo `@theme` y Tailwind sin inventar colores. |
| **P2** | **Especificación de componentes**: variantes, tamaños, radios, sombras | Refactor de `src/components/ui/*` y similares. |
| **P2** | **Cambios de copy** texto por texto (ES) si Stitch los cambió | Evito revertir microcopy legal o de negocio por error. |
| **P3** | **Prototype flow** (orden de navegación si cambió) | Ajuste de `router.push` y layouts. |
| **P3** | Anotaciones **“sticky header”**, **“scroll solo en panel X”** | CSS `overflow` / layout. |
| **P3** | Región **“PDF-safe”** marcada en presentación/balance | No romper `html2canvas` / `balance-pdf-template`. |

### Mensaje corto que puedes pegar al volver aquí

```text
Implementa el rediseño Stitch adjunto. Rutas afectadas: [lista]. Prioridad: [kit primero | pantalla X primero]. Respeta tokens en globals.css salvo donde indique el diff adjunto. No cambies lógica de negocio ni contratos API; solo UI/UX. PDF: respeta regiones marcadas PDF-safe.
```

Cuanto más completes **P1+P2**, más rápido y fiel será el código.

---

## Parte D — Lo que el agente de código hará con eso

- Traducir tokens a `src/app/globals.css` (`@theme`) y limpiar hex sueltos donde aplique.
- Actualizar componentes compartidos en `src/components/` y layouts en `src/app/(dashboard)` / `(diagnostico)`.
- Ajustar clases Tailwind y Radix según variantes.
- Verificar **contraste** y **focus-visible**.
- Probar **sesión voz** y **export PDF** en rutas reales.

Si Stitch solo entrega imágenes sin tokens, igual se puede trabajar, pero habrá más ida y vuelta para medir colores y espaciados.

---

**Archivos de esta carpeta a usar en conjunto:** `README.md` → `design.md` + `02-…` → prompts B1/B2 → regreso con checklist Parte C.
