# Requisitos de información — Sr. Front Developer + Sr. UX/UI Designer

*English summary: This doc lists what senior front-end and senior UX/UI roles need to audit and redesign a live product: product truth, IA, components, tokens, constraints, and acceptance criteria.*

---

## 1. Sr. Front Developer — qué necesita

| Área | Qué debe existir | Por qué |
|------|------------------|---------|
| **Stack y versiones** | Next.js, React, Tailwind, librerías UI (Radix, etc.), estado (Zustand), data fetching | Evita proponer componentes incompatibles o APIs imposibles. |
| **Arquitectura de rutas** | Lista de URLs, layouts por grupo `(dashboard)`, `(diagnostico)`, guards de auth | Navegación coherente y permisos por rol. |
| **Contratos de datos** | Endpoints relevantes, shape de JSON, errores típicos | Formularios y tablas alineados a la API real. |
| **Patrones existentes** | Cómo se hacen modales, tablas, formularios, toasts, loading | Consistencia y menos deuda al implementar. |
| **Rendimiento y accesibilidad** | Targets (Lighthouse, axe), `lang`, skip link, focus | No regresar a11y/perf al rediseñar. |
| **Build y entorno** | Variables `NEXT_PUBLIC_*`, puerto dev, CI | Diseños viables en prod. |
| **Activos** | Logos, licencias de fuentes, export Figma/Stitch | Implementación sin bloqueos legales. |

**Entregables mínimos que el front senior produce o valida:** mapa de rutas, inventario de componentes reutilizables, checklist de implementación por pantalla, riesgos técnicos.

---

## 2. Sr. UX/UI Designer — qué necesita

| Área | Qué debe existir | Por qué |
|------|------------------|---------|
| **Propuesta de valor y tono** | Para quién es ArIA (asesor Actinver, cliente final), tono de voz | Microcopy y jerarquía visual alineados a marca. |
| **Personas y contexto** | Asesor en oficina vs remoto, cliente en enlace mágico | Flujos y densidad de información. |
| **User journeys** | Login → dashboard → CRM → diagnóstico por voz → presentación/PDF | Priorizar pantallas y estados vacíos/error. |
| **Inventario de pantallas** | Lista priorizada + estados (loading, error, vacío, éxito) | Cobertura del rediseño sin huecos. |
| **Design system actual** | Colores, tipografía, radios, sombras, espaciado (tokens) | Evolución, no “otra app”. |
| **Accesibilidad** | Contraste, foco, tamaños táctiles, lectores de pantalla | WCAG como requisito, no opcional. |
| **Referencias de marca** | Actinver: azul profundo, oro/sunset, premium institucional | Coherencia con identidad corporativa. |

**Entregables mínimos que el UX senior produce:** flujos priorizados, wireframes o hi-fi por pantalla clave, kit de componentes (variantes y estados), guía de contenido corta, criterios de aceptación visuales.

---

## 3. Intersección Front + UX (donde suelen fallar los handoffs)

1. **Nombres estables:** cada pantalla con ID (`login`, `dashboard`, `sesion-voz`, `presentacion-premium`) para enlazar diseño ↔ código.
2. **Tokens, no solo hex:** documentar variables CSS / Tailwind que ya existen o las nuevas propuestas.
3. **Componentes atómicos vs compuestos:** qué es “nuevo componente” vs variante de `Button`, `Card`, etc.
4. **Responsive y breakpoints:** qué cambia en móvil para sesión de voz y CRM.
5. **Datos reales vs placeholder:** qué campos vienen del backend para no diseñar tablas imposibles.

---

## 4. Qué ya está cubierto en esta carpeta

- **02-** inventario de producto y tech **específico de ArIA**.
- **design.md** brief visual/UX para herramientas generativas (Stitch).
- **04-** qué pedir a Stitch y qué traer de vuelta para implementación en Cursor.

Si falta algo (capturas de pantalla actuales, métricas de uso, entrevistas con asesores), complétalo antes de generar en masa en Stitch para no iterar a ciegas.
