# Arquitectura de ArIA by Actinver

> Documento técnico para el equipo de desarrollo.

---

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Next.js | 16 | Framework principal (App Router) |
| React | 19 | UI |
| TypeScript | 5 | Lenguaje |
| Tailwind CSS | 4 | Estilos |
| Radix UI | — | Componentes base (sliders, dialogs, accordions) |
| Recharts | — | Gráficas financieras |
| Zustand | — | Estado global (con persistencia) |
| jsPDF + html2canvas | — | Generación de PDF en cliente |
| react-hook-form + zod | — | Formularios y validación |
| Lucide | — | Iconos |

### Backend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Python | 3.12 | Lenguaje |
| FastAPI + Uvicorn | — | API REST + WebSocket |
| SQLAlchemy 2 async + asyncpg | — | ORM async |
| PostgreSQL | 16 | Base de datos principal |
| Redis | 7 | Tokens de compartir y health checks |
| python-jose | — | JWT (RS256 prod / HS256 dev) |
| WeasyPrint + Jinja2 | — | PDFs en servidor |
| Anthropic Claude | — | Extracción NLU de entrevistas |
| Deepgram | — | Transcripción de voz via WebSocket |

---

## Estructura de Carpetas

```
ArIA by Actinver/
├── src/
│   ├── app/
│   │   ├── (auth)/login/          # Autenticación del asesor
│   │   ├── (dashboard)/           # Admin, CRM, customers, dashboard
│   │   ├── (diagnostico)/         # Flujo del diagnóstico por pasos
│   │   │   └── diagnosticos/[id]/ # sesion, simulador, completado, presentacion
│   │   ├── (cliente)/             # Vista pública readonly para el cliente
│   │   └── api/                   # Route Handlers server-side (extracción NLU)
│   ├── components/
│   │   ├── diagnostico/           # Pantallas del wizard
│   │   ├── outputs/               # Gráficas (FinancialTimeline, TrayectoriaRetiro, Radar)
│   │   ├── sesion/                # Transcripción en vivo
│   │   ├── pdf/                   # Templates de PDF cliente
│   │   ├── crm/                   # Componentes CRM
│   │   ├── navi/                  # Motor de recomendaciones Navi
│   │   └── ui/                    # Componentes base (Card, Slider, Button…)
│   ├── lib/
│   │   ├── motors/                # Motores de cálculo A–F en TypeScript
│   │   ├── calcular-timeline.ts   # Motor de línea de tiempo financiera
│   │   ├── api-client.ts          # Cliente HTTP centralizado
│   │   └── voz-nlu.ts             # NLU para extracción de datos por voz
│   ├── stores/                    # Zustand (auth-store, diagnostico-store)
│   └── contexts/                  # DiagnosticoProvider (hidrata desde API)
│
├── backend/
│   ├── app/
│   │   ├── api/v1/                # Endpoints: auth, clientes, diagnosticos, voz, crm…
│   │   ├── models/                # ORM: Asesor, Cliente, Diagnostico, ResultadoCalculo…
│   │   ├── services/              # Motores Python, PDF, wrapped
│   │   └── core/                  # Security (JWT), config, sesión de DB
│   └── templates/                 # HTML Jinja para PDF servidor
│
├── docs/                          # Documentación y design handoff
├── docker-compose.yml             # Orquestación local
└── scripts/                       # Deploy, backups, a11y, build de índice
```

---

## Capas de la Aplicación

```
┌─────────────────────────────────────────┐
│              Navegador                  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│       Next.js Frontend                  │
│  • App Router + Layouts por grupo       │
│  • Zustand Store (wizard, auth)         │
│  • /api/* Route Handlers (server-side)  │
│  Entorno: localhost:3001 / Vercel       │
└──────────────────┬──────────────────────┘
                   │ REST + WebSocket
┌──────────────────▼──────────────────────┐
│       FastAPI Backend                   │
│  • /api/v1/auth, clientes, diagnosticos │
│  • /api/v1/voz (WebSocket Deepgram)     │
│  • /api/v1/crm, admin, referral         │
│  • Motores A–F Python                   │
│  Entorno: localhost:8000 / servidor ext │
└────────┬─────────────────────┬──────────┘
         │                     │
┌────────▼────────┐   ┌────────▼────────┐
│  PostgreSQL 16  │   │    Redis 7       │
│  Puerto 5433    │   │    Puerto 6380   │
└─────────────────┘   └─────────────────┘

Servicios externos:
  • Anthropic Claude  → Extracción NLU
  • Deepgram          → Transcripción de voz
  • Sentry            → Monitoreo de errores (opcional)
```

---

## Patrones Principales

### Motores de Cálculo A–F
Calculadores financieros implementados **dos veces**:
- **TypeScript** (`src/lib/motors/`) → preview inmediato en la UI sin latencia
- **Python** (`backend/app/services/motor_*.py`) → fuente de verdad que se persiste en DB

Deben mantenerse sincronizados. Los resultados se guardan como JSON por motor en la tabla `ResultadoCalculo`.

| Motor | Dominio |
|-------|---------|
| Motor A | Perfil del cliente |
| Motor B | Flujo mensual |
| Motor C | Proyección de retiro |
| Motor E | Patrimonio |
| Motor F | Protección / seguros |

### calcularTimeline
Motor en TypeScript (`src/lib/calcular-timeline.ts`) que es la **fuente única** para todas las gráficas del simulador. Recibe: patrimonio actual, ahorro mensual con rango, tasa real, inicio de rendimientos, eventos de vida (ventas, aportaciones), pensión y mensualidad deseada.

### Store + Context
- **Zustand** (`diagnostico-store`) almacena el estado del wizard y los outputs de los motores
- **`DiagnosticoProvider`** hidrata el store desde la API al entrar a `/diagnosticos/[id]/`
- **`auth-store`** persiste el JWT del asesor

### Layouts por grupo de rutas
`(diagnostico)/layout.tsx` es un **client component** que envuelve todos los pasos del diagnóstico con el stepper, la UI de voz y la navegación lateral.

### Autenticación
- Bearer JWT en header `Authorization`
- `apiFetch` redirige a `/login` automáticamente en `401`
- Producción: RS256 con llaves PEM; Desarrollo: HS256 con secret fijo

### Token de compartir (vista cliente)
Al completar el diagnóstico se genera un link firmado almacenado en Redis con TTL. El cliente abre `(cliente)/cliente/[token]` que consume el endpoint público `/api/v1/cliente/{token}`.

### Doble generación de PDF
| Vía | Tecnología | Cuándo se usa |
|-----|-----------|---------------|
| Cliente | `jspdf + html2canvas` | Templates en `components/pdf/` |
| Servidor | `WeasyPrint + Jinja2` | Templates en `backend/templates/` |

---

## Flujo Principal

```
1. Login
   → POST /api/v1/auth/login
   → JWT guardado en Zustand (auth-store)

2. Crear / seleccionar cliente
   → POST /api/v1/clientes
   → UUID del cliente

3. Crear diagnóstico
   → POST /api/v1/diagnosticos
   → UUID del diagnóstico

4. Wizard (pasos 1–6)
   → Cada paso hace PATCH/PUT de su sección:
     perfil, flujo-mensual, patrimonio, proteccion, retiro…
   → Backend recalcula motores y guarda ResultadoCalculo
   → Opcional: sesión de voz
     └── WebSocket → Deepgram (transcripción)
     └── Anthropic (extracción de campos NLU)

5. Completar diagnóstico
   → Snapshot de parámetros guardado en DB
   → PDF disponible para descarga

6. Compartir con el cliente
   → Token generado en Redis
   → Cliente abre /cliente/{token} (vista readonly)

7. Pantalla de resultados / simulador (asesor)
   → calcularTimeline en cliente para gráficas interactivas
   → TrayectoriaRetiroChart con desglose por componentes
```

---

## Infraestructura y Variables de Entorno

### Docker Compose (desarrollo local)

```yaml
services:
  api:    # FastAPI — puerto 8000
  db:     # PostgreSQL 16 — puerto 5433 (host) → 5432 (container)
  redis:  # Redis 7 — puerto 6380 (host) → 6379 (container)
```

Comandos para levantar:
```bash
# Solo infraestructura
docker-compose up -d db redis

# Frontend
ulimit -n 65536
npx next dev -p 3001 --hostname 127.0.0.1

# Backend (dentro del container o con venv)
uvicorn app.main:app --reload --port 8000
```

### Variables de entorno

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** (`backend/.env`):
```
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://localhost:6380
CORS_ORIGINS=http://localhost:3001
DEEPGRAM_API_KEY=...
ANTHROPIC_API_KEY=...
JWT_PRIVATE_KEY_PATH=/app/keys/private.pem   # Solo producción
JWT_PUBLIC_KEY_PATH=/app/keys/public.pem     # Solo producción
SENTRY_DSN=...                               # Opcional
```

---

## Consideraciones Importantes

### ⚠️ JWT en producción
Desarrollo usa **HS256** con un secret fijo en código. **Producción requiere llaves PEM (RS256)**. Asegurarse de configurar `JWT_PRIVATE_KEY_PATH` y `JWT_PUBLIC_KEY_PATH` antes de cualquier despliegue a producción.

### 🔄 Motores duplicados TS/Python
Los motores existen en TypeScript y Python con la misma lógica. Cualquier cambio en las fórmulas debe aplicarse en **ambos**. Los motores Python son la fuente de verdad persistida.

### 📦 Dependencia no usada
`@tanstack/react-query` está en `package.json` pero no se usa en el código fuente del frontend. Fue planeado pero no implementado.

### 🖨️ WeasyPrint
El servicio de PDF en servidor requiere Cairo/Pango instalados en el sistema operativo. Ya están incluidos en el `Dockerfile` del backend pero deben considerarse en cualquier cambio de imagen base.

### 🚀 Deploy
- **Frontend** → Vercel (documentado en `VERCEL.md`)
- **Backend** → Servidor externo (documentado en `README-BACKEND.md`)
- `NEXT_PUBLIC_API_URL` debe apuntar a la URL HTTPS del backend en producción
