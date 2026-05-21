# ArIA by Actinver — Design brief (Stitch / AI UI)

*Purpose: single document to paste or attach in Google Stitch (or similar) to generate a UI kit and screen variants aligned with Actinver’s institutional premium positioning.*

---

## 0. Product one-liner

**ArIA** is a Spanish-language web app for **Actinver advisors**: client CRM, voice-guided wealth diagnostics, narrative presentations, and PDF outputs (balance patrimonial, diagnóstico). Tone: **trustworthy, institutional, warm gold on deep navy** — not playful consumer fintech.

---

## 1. Brand and visual direction

- **Personality:** expert, calm, discreet luxury, Mexico private-banking adjacency.
- **Primary background:** deep navy near `#060D1A` (use full scale: `#060D1A`, `#0C1829`, `#1A3154`).
- **Primary accent:** muted gold `#C9A84C` (support: `#E8C872`, `#A8893A`). Use gold for **focus rings**, **key CTAs**, **highlights**, **active nav** — not for large fills.
- **Text:** high contrast on dark — primary `#F0F4FA`, secondary muted blue-gray `#8B9BB4`, tertiary `#4A5A72` / `#5A6A85`.
- **Semantic colors:** success `#10B981`, warning `#F59E0B`, error `#EF4444`, info `#60A5FA`.
- **Surfaces:** layered dark panels; borders as **1px** `rgba(255,255,255,0.05–0.15)`; subtle **inner glow** optional on hero cards (`rgba(201,168,76,0.12)`).
- **Typography:**
  - **Headings:** Poppins 600–800, tight tracking on small caps labels (e.g. “ArIA” wordmark style).
  - **Body:** Open Sans 400–600 for long reading (transcriptions, legal).
  - **Scale:** clear H1–H4 for dashboard vs dense “session” UI.
- **Shape:** generous radius — cards **16px**, buttons/inputs **10px**, modals **20px**.
- **Elevation:** soft dark shadows (`0 4px 24px rgba(0,0,0,0.4)` card; stronger for modals).
- **Motion:** restrained (200–300ms ease); **no** distracting loops on core work screens; optional subtle celebrate on **completion only** (advisor-facing).

---

## 2. Design tokens (propose as Figma variables / CSS)

Map explicitly in your kit:

| Category | Token name examples | Notes |
|----------|---------------------|--------|
| Color.bg | `bg-base`, `bg-elevated`, `bg-sunken` | 3-step navy ladder |
| Color.border | `border-subtle`, `border-default`, `border-strong` | white @ 5%, 8%, 15% |
| Color.text | `text-primary`, `text-secondary`, `text-muted` | |
| Color.accent | `accent-sunset`, `accent-sunset-muted` | gold |
| Color.state | `success`, `warning`, `danger`, `info` | |
| Space | `space-1` … `space-6` | 8px grid |
| Radius | `radius-card`, `radius-button`, `radius-input`, `radius-modal` | |
| Shadow | `shadow-card`, `shadow-glow`, `shadow-elevated` | |
| Type | `font-heading`, `font-body`, sizes `text-xs`–`text-2xl` | |

Deliver **light mode** only if business requests; default product is **dark**.

---

## 3. Core components (kit scope)

Minimum set with **all interactive states** (default, hover, active, focus-visible, disabled, loading):

1. **Button:** primary (gold outline or gold fill — pick one system), secondary (ghost on dark), destructive, icon-only.
2. **Input / Select / Textarea** — with error text and hint.
3. **Card** — default, highlighted, “insight” variant.
4. **Tabs** — underline or pill to match current dashboard nav.
5. **Table** — CRM lists; sticky header; row hover; empty state.
6. **Badge / Tag** — estado cliente, tipo actividad.
7. **Modal / Dialog** — confirmaciones, PDF preview hint.
8. **Toast / Alert** — inline errors en formularios + global notice.
9. **Sidebar** — admin 240px width reference.
10. **App header** — logo block “Actinver” + sublabel “ArIA”, blur glass, user menu.
11. **Voice session bar** — recording state, timer, waveform or simple pulse (keep technically feasible).
12. **Data panel / “command center”** — two-column grid collapsing to stacked on mobile.
13. **Progress / stepper** — diagnóstico multi-paso.
14. **Skeleton** — listas y cards.

---

## 4. Key screens (hi-fi or annotated wireframe)

Prioritize **Spanish copy** placeholders realistic for wealth advisory.

| ID | Screen | Must show |
|----|--------|------------|
| `login` | Login asesor | Email, password, error state, Actinver mark |
| `dashboard` | Mis clientes | Search, cards/table, CTA “nuevo cliente” o equivalente |
| `crm-cliente` | Ficha cliente | Tabs: resumen, actividades, documentos; lista docs con icono PDF |
| `sesion-voz` | Entrevista voz | Izquierda: campos patrimonio/perfil; derecha: transcripción; barra “escuchando”; estados error mic |
| `presentacion` | Resultados narrativos | Actos/secciones, CTAs plan + descarga, área colapsable “House View” |
| `presentacion-pdf` | Hint layout | Nota diseño: contenido también exportable a PDF — evitar sombras que rompan captura |
| `admin-dashboard` | Admin home | KPIs simples o lista |
| `empty-states` | — | Sin clientes, sin documentos, sin resultados búsqueda |
| `mobile-breakpoints` | Sesión + CRM | Breakpoint ≤768px |

---

## 5. UX rules (non-negotiables)

- **WCAG:** contrast AA on text and controls; visible focus always (gold ring).
- **Touch targets:** min 44px height en CTAs móvil.
- **No critical actions** sin confirmación (eliminar, enviar, cerrar sesión con datos no guardados).
- **Loading:** skeleton o spinner contextual, no solo pantalla blanca.
- **Language:** Spanish; formal “usted” where the product already uses it; otherwise match existing tone in app.

---

## 6. Out of scope for first Stitch pass (unless requested)

- Logotipos vectoriales oficiales no incluidos en repo (usar placeholder tipográfico “Actinver” + “ArIA”).
- Ilustraciones custom complejas; prefer geometric patterns subtle.
- Redefinición legal de avisos de privacidad (solo layout).

---

## 7. Handoff format expected from Stitch

For each screen/component group, export or specify:

- Name (`login`, `sesion-voz`, …), **breakpoint** (desktop/tablet/mobile).
- List of **new tokens** vs reuse of section 2.
- **Spacing/radius** key decisions.
- **Component list** with variants.
- Notes for **engineers**: sticky regions, scroll areas, PDF-sensitive regions.

This `design.md` pairs with `02-plataforma-aria-mapa-producto-y-tech.md` for route and tech alignment.
