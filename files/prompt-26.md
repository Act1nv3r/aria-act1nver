# PROMPT 26 - Responsive + Performance + Accesibilidad
# Sprint 10 | 1.5 dias

## Responsive (verificar CADA pagina)
Desktop >=1024px: grid 12 cols, form 8 + outputs 4
Tablet >=768px <1024px: full width, outputs drawer bottom, stepper vertical colapsable
Mobile <768px: stack vertical, CurrencyInput inputMode=numeric

Checklist: login card centrada, dashboard grid 3/2/1, stepper horizontal/vertical/dots, formularios padding 32/16/12, graficas width=100%, simulador 2cols/stack, wrapped carousel+swipe, admin sidebar colapsable.

## Performance (Lighthouse > 90)
Next.js Image optimization, lazy loading graficas (dynamic import + skeleton), code splitting por ruta, preconnect fonts.googleapis.com, cache headers Cloudflare, bundle analyzer (verificar no deps gigantes), prefetch datos siguiente paso.

## Accesibilidad (WCAG 2.1 AA)
Focus visible 2px sunset en TODOS los interactivos. aria-label en botones solo-icono. aria-describedby para InfoBox. role=navigation en stepper, role=tablist en tabs. Keyboard: Tab navegar, Enter/Space activar, Escape cerrar modals. Color contrast 4.5:1. Skip navigation link. Alt text en graficas.
