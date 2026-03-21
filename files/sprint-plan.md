# ArIA — Plan de Ejecución por Sprints para Cursor AI
# TODOS los prompts están COMPLETOS y listos para copiar/pegar en Cursor
# 27 prompts detallados | 6 semanas prototipo + 5.5 semanas MVP
# Fecha: Marzo 2026

---

## ESTRATEGIA

PROTO (Sprints 0-5, 6 semanas): Todo en FRONTEND. Sin backend, sin BD.
  Los motores son TypeScript puro. Voz llama Deepgram/Claude desde browser.
  ESTO es lo que ve el comité de dirección.
MVP (Sprints 6-10, 5.5 semanas): Backend real post-aprobación del comité.
V2 (Backlog): Integraciones Actinver (Salesforce, Core).

---

## ÍNDICE DE PROMPTS

Sprint 0 (3 días):
  PROMPT 1: Setup Next.js + Design System + 14 componentes UI + Login mock

Sprint 1 (1 semana):
  PROMPT 2: Zustand store + Stepper + Layout diagnóstico
  PROMPT 3: 6 formularios completos (React Hook Form + Zod + InfoBoxes)
  PROMPT 4: Dashboard mock + navegación completa

Sprint 2 (1 semana):
  PROMPT 5: 6 motores de cálculo TypeScript (con test Motor C vs Excel)
  PROMPT 6: 12 gráficas interactivas Recharts (curva desacumulación = HERO)
  PROMPT 7: Conectar outputs al flujo con recálculo en tiempo real

Sprint 3 (1 semana):
  PROMPT 8: Simulador de escenarios (5 sliders + recálculo 200ms)
  PROMPT 9: Vista resultados 3 tabs + 5 recomendaciones dinámicas
  PROMPT 10: PDF client-side + pantalla "Tu aria está lista" + confetti

Sprint 4 (1 semana):
  PROMPT 11: Botón micrófono + consentimiento + Deepgram STT streaming
  PROMPT 12: Claude Haiku NLU + Suggestion Pills en campos

Sprint 5A (4 días):
  PROMPT 13: Toggle pareja + layout 2 columnas + ownership activos
  PROMPT 14: Consolidación hogar + resultados triple

Sprint 5B (3 días):
  PROMPT 15: 7 tarjetas Wrapped (PNG 1080x1920) + carousel + ZIP

→ DEMO CHECKPOINT (Semana 6): 12 min, 4 actos

Sprint 6-7 (2.5 semanas):
  PROMPT 16: Backend FastAPI + PostgreSQL + Docker Compose
  PROMPT 17: Auth JWT RS256 + CRUD clientes con RLS
  PROMPT 18: Endpoints diagnóstico + motores Python
  PROMPT 19: Conectar frontend al backend real

Sprint 7-8 (2 semanas):
  PROMPT 20: PDFs WeasyPrint + Voz backend (Deepgram/Claude server-side)
  PROMPT 21: Tests seguridad (BLOQUEANTES CI) + GitHub Actions pipeline

Sprint 8-9 (1.5 semanas):
  PROMPT 22: Simulador + Escenarios backend
  PROMPT 23: Panel Admin completo

Sprint 9-10 (2 semanas):
  PROMPT 24: Vista cliente readonly
  PROMPT 25: Wrapped backend + referral tracking
  PROMPT 26: Responsive + Performance + Accesibilidad (Lighthouse >90)
  PROMPT 27: Deploy producción Hetzner + Cloudflare + monitoreo

TOTAL: 11.5 semanas. Costo: ~$120 USD/mes.

V2 BACKLOG:
  Push Salesforce, prellenado Core, SSO, API Gateway, re-engagement, wrapped anual.

---

Cada prompt está detallado en su archivo individual dentro de:
  .context/prompts/prompt-01.md ... prompt-27.md

Esto permite copiar/pegar directamente en Cursor sin editar.
