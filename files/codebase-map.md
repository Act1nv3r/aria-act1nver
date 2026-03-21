# Codebase Map — ArIA by Actinver

## Estructura Completa del Repositorio

```
aria/
│
├── .cursor/
│   └── rules/
│       └── cursorrules.md          ← Reglas para Cursor AI (este proyecto)
│
├── .context/
│   ├── context.md                  ← Contexto de negocio completo para la AI
│   ├── architecture.md             ← Arquitectura del sistema
│   ├── conventions.md              ← Convenciones de código y naming
│   ├── codebase-map.md             ← ESTE ARCHIVO — mapa del repositorio
│   ├── security.md                 ← Políticas de seguridad detalladas
│   └── testing-strategy.md         ← Estrategia de testing y QA
│
├── frontend/                       ← NEXT.JS 15 APPLICATION
│   ├── app/                        ← App Router (pages + layouts)
│   │   ├── layout.tsx              ← Root layout (providers, fonts, metadata)
│   │   ├── page.tsx                ← Redirect a /login o /dashboard
│   │   │
│   │   ├── (auth)/                 ← Auth group (sin dashboard layout)
│   │   │   └── login/
│   │   │       └── page.tsx        ← Pantalla de login
│   │   │
│   │   ├── (dashboard)/            ← Dashboard group (con sidebar/header)
│   │   │   ├── layout.tsx          ← Dashboard layout (header + sidebar)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        ← Lista de clientes del asesor
│   │   │   └── clientes/
│   │   │       └── [id]/
│   │   │           └── page.tsx    ← Detalle de cliente + historial diagnósticos
│   │   │
│   │   ├── (diagnostico)/          ← Diagnóstico group (con stepper layout)
│   │   │   ├── layout.tsx          ← Layout con stepper + barra contexto + panel outputs
│   │   │   └── diagnosticos/
│   │   │       └── [id]/
│   │   │           ├── page.tsx    ← Redirect a paso actual
│   │   │           ├── paso/
│   │   │           │   └── [step]/
│   │   │           │       └── page.tsx  ← Renderiza el paso correspondiente (1-6)
│   │   │           ├── resultados/
│   │   │           │   └── page.tsx      ← Vista de resultados completos (tabs)
│   │   │           ├── simulador/
│   │   │           │   └── page.tsx      ← Simulador de escenarios
│   │   │           └── wrapped/
│   │   │               └── page.tsx      ← Financial Wrapped viewer
│   │   │
│   │   ├── (admin)/                ← Admin group
│   │   │   ├── layout.tsx          ← Admin layout (sidebar nav)
│   │   │   └── admin/
│   │   │       ├── page.tsx        ← Dashboard de métricas
│   │   │       ├── asesores/
│   │   │       │   └── page.tsx    ← Gestión de asesores
│   │   │       ├── parametros/
│   │   │       │   └── page.tsx    ← Configuración global
│   │   │       ├── glosario/
│   │   │       │   └── page.tsx    ← Gestión del glosario
│   │   │       └── auditoria/
│   │   │           └── page.tsx    ← Log de auditoría
│   │   │
│   │   └── (cliente)/              ← Cliente group (vista pública readonly)
│   │       └── cliente/
│   │           └── [token]/
│   │               └── page.tsx    ← Vista readonly del diagnóstico
│   │
│   ├── components/
│   │   ├── ui/                     ← Componentes base reutilizables
│   │   │   ├── button.tsx          ← Botón con variantes (primary, secondary, outline, ghost)
│   │   │   ├── input.tsx           ← Input text con label, error, info box
│   │   │   ├── currency-input.tsx  ← Input monetario con formato MXN ($#,##0)
│   │   │   ├── number-input.tsx    ← Input numérico con stepper
│   │   │   ├── select.tsx          ← Select dropdown (Radix)
│   │   │   ├── toggle.tsx          ← Toggle switch (Sí/No)
│   │   │   ├── slider.tsx          ← Range slider (Radix)
│   │   │   ├── card.tsx            ← Card container (Azul Acompañamiento)
│   │   │   ├── info-box.tsx        ← Tooltip contextual (hover/tap)
│   │   │   ├── badge.tsx           ← Badge de nivel de riqueza (con colores)
│   │   │   ├── progress-bar.tsx    ← Barra de progreso animada
│   │   │   ├── accordion.tsx       ← Acordeón para secciones colapsables
│   │   │   ├── modal.tsx           ← Modal/Dialog (Radix)
│   │   │   ├── toast.tsx           ← Notificaciones toast
│   │   │   ├── drawer.tsx          ← Drawer bottom (mobile outputs)
│   │   │   ├── skeleton.tsx        ← Skeleton loader
│   │   │   └── form-field.tsx      ← Wrapper de campo con label + error + info box
│   │   │
│   │   ├── diagnostico/            ← Componentes del flujo de diagnóstico
│   │   │   ├── stepper-nav.tsx     ← Navegación de 6 pasos
│   │   │   ├── context-bar.tsx     ← Barra superior (nombre + guardado + mic)
│   │   │   ├── output-panel.tsx    ← Panel lateral de outputs parciales
│   │   │   ├── consent-modal.tsx   ← Modal de aviso de privacidad
│   │   │   ├── completion-screen.tsx ← Pantalla de éxito con confetti
│   │   │   ├── paso1-perfil.tsx    ← Formulario Paso 1 (5 campos)
│   │   │   ├── paso2-flujo.tsx     ← Formulario Paso 2 (6 campos)
│   │   │   ├── paso3-patrimonio.tsx ← Formulario Paso 3 (4 acordeones, 15 campos)
│   │   │   ├── paso4-retiro.tsx    ← Formulario Paso 4 (3 campos)
│   │   │   ├── paso5-objetivos.tsx ← Formulario Paso 5 (dinámico, hasta 5 obj)
│   │   │   ├── paso6-proteccion.tsx ← Formulario Paso 6 (3 toggles)
│   │   │   └── pareja-layout.tsx   ← Layout de 2 columnas para modo pareja
│   │   │
│   │   ├── outputs/                ← Componentes de visualización de resultados
│   │   │   ├── donut-chart.tsx     ← Gráfica donut distribución ingreso/gasto/ahorro
│   │   │   ├── reserva-semaforo.tsx ← Indicador semáforo de reserva de emergencia
│   │   │   ├── patrimonio-neto-card.tsx ← Card de patrimonio neto con composición
│   │   │   ├── nivel-riqueza-badge.tsx  ← Badge animado del nivel de riqueza
│   │   │   ├── indice-solvencia.tsx     ← Gauge semicircular de solvencia
│   │   │   ├── regla72-table.tsx        ← Tabla de Regla del 72
│   │   │   ├── curva-desacumulacion.tsx ← AreaChart de desacumulación (HERO visual)
│   │   │   ├── grado-avance-bar.tsx     ← Barra de progreso animada del retiro
│   │   │   ├── deficit-card.tsx         ← Card de déficit/superávit
│   │   │   ├── fuentes-ingreso.tsx      ← BarChart apilado fuentes de ingreso retiro
│   │   │   ├── tabla-viabilidad.tsx     ← Tabla de viabilidad de objetivos (✓/✗)
│   │   │   ├── legado-card.tsx          ← Card de legado proyectado
│   │   │   └── texto-dinamico.tsx       ← Texto generado dinámicamente
│   │   │
│   │   ├── simulador/              ← Componentes del simulador de escenarios
│   │   │   ├── variable-slider.tsx ← Slider de variable simulable
│   │   │   ├── comparison-view.tsx ← Vista lado a lado de escenarios
│   │   │   └── scenario-card.tsx   ← Card de escenario guardado
│   │   │
│   │   ├── voz/                    ← Componentes de captura por voz
│   │   │   ├── voice-button.tsx    ← Botón de micrófono (activar/desactivar)
│   │   │   ├── transcription-panel.tsx ← Panel de transcripción en tiempo real
│   │   │   ├── suggestion-pill.tsx ← Pill de sugerencia de llenado
│   │   │   └── voice-consent-modal.tsx ← Modal de consentimiento de grabación
│   │   │
│   │   ├── wrapped/                ← Componentes del Financial Wrapped
│   │   │   ├── wrapped-viewer.tsx  ← Carousel de tarjetas wrapped
│   │   │   ├── wrapped-card.tsx    ← Tarjeta individual con toggle
│   │   │   └── download-button.tsx ← Botón de descarga ZIP/video
│   │   │
│   │   └── admin/                  ← Componentes del panel admin
│   │       ├── metrics-dashboard.tsx
│   │       ├── asesor-table.tsx
│   │       ├── parametros-form.tsx
│   │       ├── glosario-admin.tsx
│   │       └── auditoria-table.tsx
│   │
│   ├── hooks/
│   │   ├── use-auto-save.ts        ← Auto-guardado con debounce + IndexedDB fallback
│   │   ├── use-websocket.ts        ← WebSocket para STT streaming
│   │   ├── use-diagnostico.ts      ← Queries y mutations del diagnóstico
│   │   ├── use-glosario.ts         ← Cache del glosario para info boxes
│   │   └── use-inactivity.ts       ← Detector de inactividad (30 min timeout)
│   │
│   ├── lib/
│   │   ├── api-client.ts           ← Fetch wrapper con interceptor de auth
│   │   ├── format-currency.ts      ← Formateo MXN (Intl.NumberFormat)
│   │   ├── validators.ts           ← Zod schemas (espejo de Pydantic)
│   │   ├── query-keys.ts           ← TanStack Query keys tipados
│   │   └── constants.ts            ← Constantes de la app
│   │
│   ├── stores/
│   │   ├── auth-store.ts           ← Estado de autenticación (user, tokens)
│   │   ├── diagnostico-store.ts    ← Estado del diagnóstico activo
│   │   └── ui-store.ts             ← Estado de UI (drawer abierto, dark mode, etc.)
│   │
│   ├── styles/
│   │   └── globals.css             ← Tailwind directives + custom CSS variables
│   │
│   ├── tailwind.config.ts          ← Config con tokens del brandbook Actinver
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── vitest.config.ts
│
├── backend/                        ← FASTAPI APPLICATION
│   ├── app/
│   │   ├── main.py                 ← FastAPI app factory + middleware stack
│   │   │
│   │   ├── api/v1/                 ← Routers
│   │   │   ├── __init__.py         ← Router principal (incluye todos los sub-routers)
│   │   │   ├── auth.py             ← POST /login, /refresh, /logout
│   │   │   ├── clientes.py         ← CRUD /clientes
│   │   │   ├── diagnosticos.py     ← CRUD /diagnosticos + sub-recursos (perfil, flujo, etc.)
│   │   │   ├── escenarios.py       ← CRUD /diagnosticos/{id}/escenarios
│   │   │   ├── pdf.py              ← GET /diagnosticos/{id}/pdf/{tipo}
│   │   │   ├── wrapped.py          ← POST/GET /diagnosticos/{id}/wrapped
│   │   │   ├── voz.py              ← WebSocket /voz/transcribir + POST /voz/extraer
│   │   │   ├── admin.py            ← /admin/metricas, /admin/asesores, /admin/parametros, /admin/glosario
│   │   │   ├── glosario.py         ← GET /glosario (público)
│   │   │   ├── cliente_view.py     ← GET /cliente/{token} (público, readonly)
│   │   │   └── health.py           ← GET /health (uptime check)
│   │   │
│   │   ├── core/
│   │   │   ├── config.py           ← Settings (env vars via pydantic-settings)
│   │   │   ├── security.py         ← JWT create/verify, password hash/verify
│   │   │   ├── database.py         ← SQLAlchemy async engine + session factory
│   │   │   └── deps.py             ← Dependency injection (get_db, get_current_user, etc.)
│   │   │
│   │   ├── models/                 ← SQLAlchemy ORM models
│   │   │   ├── __init__.py         ← Export all models
│   │   │   ├── asesor.py
│   │   │   ├── cliente.py
│   │   │   ├── pareja.py
│   │   │   ├── diagnostico.py
│   │   │   ├── perfil_cliente.py
│   │   │   ├── flujo_mensual.py
│   │   │   ├── patrimonio_financiero.py
│   │   │   ├── patrimonio_no_financiero.py
│   │   │   ├── plan_retiro.py
│   │   │   ├── objetivo_financiero.py
│   │   │   ├── proteccion_patrimonial.py
│   │   │   ├── resultado_calculo.py
│   │   │   ├── escenario.py
│   │   │   ├── transcripcion.py
│   │   │   ├── wrapped_card.py
│   │   │   ├── referral_link.py
│   │   │   ├── auditoria_log.py
│   │   │   └── parametro_global.py
│   │   │
│   │   ├── schemas/                ← Pydantic v2 schemas (input/output)
│   │   │   ├── auth.py             ← LoginInput, TokenResponse, UserResponse
│   │   │   ├── cliente.py          ← ClienteCreate, ClienteResponse, ClienteList
│   │   │   ├── diagnostico.py      ← DiagnosticoCreate, DiagnosticoResponse
│   │   │   ├── perfil.py           ← PerfilInput (con condicionales en output)
│   │   │   ├── flujo_mensual.py    ← FlujoMensualInput, MotorAOutput
│   │   │   ├── patrimonio.py       ← PatrimonioInput, MotorBOutput, MotorEOutput
│   │   │   ├── retiro.py           ← RetiroInput, MotorCOutput (incluye curva[360])
│   │   │   ├── objetivos.py        ← ObjetivosInput, MotorDOutput
│   │   │   ├── proteccion.py       ← ProteccionInput, MotorFOutput
│   │   │   ├── escenario.py        ← EscenarioCreate, EscenarioResponse
│   │   │   ├── wrapped.py          ← WrappedResponse
│   │   │   ├── admin.py            ← MetricasResponse, ParametrosUpdate
│   │   │   └── error.py            ← RFC7807 ProblemDetail
│   │   │
│   │   ├── services/               ← Business logic (CORE del sistema)
│   │   │   ├── motor_a.py          ← Análisis Ingreso/Gasto
│   │   │   ├── motor_b.py          ← Patrimonio y Nivel de Riqueza
│   │   │   ├── motor_c.py          ← Desacumulación (simulación 360 meses)
│   │   │   ├── motor_d.py          ← Proyección con Objetivos
│   │   │   ├── motor_e.py          ← Balance General + Solvencia + Apalancamiento
│   │   │   ├── motor_f.py          ← Protección Patrimonial
│   │   │   ├── recomendaciones.py  ← Generación de 5 recomendaciones dinámicas
│   │   │   ├── pdf_generator.py    ← HTML→PDF con WeasyPrint + Matplotlib
│   │   │   ├── wrapped_generator.py ← Generación de tarjetas PNG (Pillow)
│   │   │   ├── voz_stt.py          ← Integración Deepgram (STT streaming)
│   │   │   ├── voz_nlu.py          ← Integración Claude Haiku (extracción entidades)
│   │   │   └── salesforce.py       ← Push de diagnósticos al CRM (V2)
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.py             ← JWT verification + set current_user
│   │   │   ├── rls.py              ← SET app.current_asesor_id para RLS
│   │   │   ├── audit.py            ← Log de acciones en auditoria_log
│   │   │   ├── rate_limit.py       ← Redis-based rate limiting
│   │   │   └── error_handler.py    ← Global exception → RFC 7807
│   │   │
│   │   └── tests/
│   │       ├── conftest.py         ← Fixtures (test DB, test client, factories)
│   │       ├── factories.py        ← Factory Boy factories para todas las entidades
│   │       ├── test_auth.py
│   │       ├── test_clientes.py
│   │       ├── test_diagnosticos.py
│   │       ├── test_motor_a.py     ← Suite con datos del Excel original
│   │       ├── test_motor_b.py
│   │       ├── test_motor_c.py     ← Validación ±$1 vs Excel
│   │       ├── test_motor_d.py
│   │       ├── test_motor_e.py
│   │       ├── test_motor_f.py
│   │       ├── test_security.py    ← Tests RLS + cifrado (BLOQUEANTES en CI)
│   │       └── test_pdf.py
│   │
│   ├── alembic/
│   │   ├── alembic.ini
│   │   ├── env.py
│   │   └── versions/               ← Migration files
│   │       └── 001_initial_schema.py
│   │
│   ├── templates/                   ← Jinja2 HTML templates para PDFs
│   │   ├── base.html               ← Base template con CSS brandbook
│   │   ├── patrimonio.html         ← Template PDF Patrimonio Financiero
│   │   ├── balance.html            ← Template PDF Balance General
│   │   └── recomendaciones.html    ← Template PDF Plan de Recomendaciones
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── pytest.ini
│
├── docker-compose.yml              ← 4 servicios: web, api, db, redis
├── docker-compose.prod.yml         ← Producción (sin hot reload, con healthchecks)
├── Makefile                        ← Shortcuts: make dev, make test, make lint, make migrate
├── .env.example                    ← Template de variables de entorno
├── .gitignore                      ← Node modules, __pycache__, .env, etc.
├── .github/
│   └── workflows/
│       ├── ci.yml                  ← CI pipeline completo
│       └── deploy.yml              ← Deploy a staging/production
│
└── README.md                       ← Setup guide + contributing guide
```

## Dependencias entre Módulos

```
Frontend:
  app/(auth)        → lib/api-client, stores/auth-store
  app/(dashboard)   → hooks/use-diagnostico, components/ui/*
  app/(diagnostico) → components/diagnostico/*, components/outputs/*, hooks/use-auto-save
  app/(admin)       → components/admin/*
  components/ui/*   → NO depende de nada (componentes puros)
  components/outputs/* → Recharts, stores/diagnostico-store
  hooks/*           → lib/api-client, stores/*
  stores/*          → lib/api-client (solo auth-store)

Backend:
  api/v1/*          → schemas/*, services/*, core/deps
  services/motor_*  → schemas/* (input/output types), core/config (parámetros)
  services/pdf_*    → templates/, services/motor_* (para gráficas)
  middleware/*      → core/security, core/database
  models/*          → NO depende de nada (definiciones puras)
  schemas/*         → NO depende de nada (validación pura)
```
