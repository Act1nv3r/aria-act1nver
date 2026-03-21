# ArIA by Actinver — Cursor Rules
# Version: 1.0 | Marzo 2026
# Stack: Next.js 15 + FastAPI + PostgreSQL 16 + Redis + Docker

## IDENTIDAD DEL PRODUCTO: ArIA

**ArIA** (AR·IA) es la herramienta de planeación financiera personal de Actinver. El nombre contiene "Inteligencia Artificial" de forma orgánica — se descubre, no se explica.

### La metáfora del Aria
Un *aria* es el momento más poderoso de la ópera: el solista se detiene, y con toda la profundidad emocional posible, expresa lo que piensa, siente o desea. Detrás, la orquesta entera trabaja en conjunto para sostenerlo. Y arriba de todo, el director coordina que cada instrumento entre en el momento exacto.

En ArIA:
- **El cliente es el solista.** Es su vida financiera, sus metas, su patrimonio. Todo existe para que su "voz" se escuche con claridad.
- **Actinver es la orquesta.** Inversiones, crédito, seguros, asesoría — cada "instrumento" cumple una función dentro del plan patrimonial. Juntos crean algo mayor.
- **La IA es el director.** No toca ningún instrumento, pero sabe cuándo debe entrar cada uno, a qué volumen, con qué intensidad. Orquesta los instrumentos financieros en tiempo real.

### Principios de experiencia derivados de la metáfora
```
1. EL CLIENTE AL CENTRO (El solista): Cada pantalla, cada output, cada recomendación pone al cliente como protagonista.
2. ARMONÍA (La orquesta): Los módulos trabajan juntos, no aislados. El diagnóstico es una pieza completa.
3. DIRECCIÓN INTELIGENTE (El director): La IA orquesta sin ser protagonista — sugiere, calcula, optimiza, pero el asesor y el cliente deciden.
4. MOMENTO DE VERDAD (El aria): El "aha moment" es cuando el cliente ve su grado de avance al retiro — introspección financiera pura.
5. SIN ESFUERZO APARENTE: La complejidad (6 motores, 360 meses de simulación) queda detrás del telón.
```

### Tono de ArIA en la interfaz
```
- Empoderador, nunca alarmista (brandbook Actinver)
- Claro y directo (oraciones < 20 palabras)
- La IA habla en tercera persona discreta: "ArIA calculó tu grado de avance" (no "Yo calculé")
- Fórmula de mensajes: [Meta] + [lo que lo hace posible]
  Ejemplo: "Tu retiro está más cerca de lo que crees. Estos son tus siguientes pasos."
- Mensajes de carga usan metáforas musicales sutiles (no forzadas):
  "Afinando tu diagnóstico..." / "Componiendo tu plan..." / "Tu aria está lista."
```

---

## IDENTIDAD DEL PROYECTO
**ArIA** es una herramienta de planeación financiera personal para Actinver (banco/casa de bolsa mexicana regulada por CNBV y Banxico).
Es una aplicación web que permite a asesores financieros diagnosticar la situación patrimonial de sus clientes en 6 pasos,
generando 3 entregables PDF profesionales, simulaciones de retiro y recomendaciones accionables.

**USUARIOS**: ~500 asesores simultáneos + 150K clientes. SLA: 99.9% uptime.
**REGULACIÓN**: LFPDPPP, CUB (CNBV), Banxico ciberseguridad, CONDUSEF Art. 45, PLD/FT.
**DATOS SENSIBLES**: Patrimonio financiero, ingresos, gastos, saldos de Afore/PPR. NUNCA en logs ni en respuestas de error.

---

## STACK TECNOLÓGICO (NO NEGOCIABLE)

### Frontend
- **Framework**: Next.js 15 (App Router, Server Components donde aplique)
- **Lenguaje**: TypeScript 5+ en modo `strict` (cero `any`)
- **Estilos**: Tailwind CSS 4 con tokens custom del brandbook Actinver
- **State**: Zustand (global) + React Hook Form (formularios) + TanStack Query v5 (server state)
- **Validación**: Zod (schemas espejo de Pydantic backend)
- **Gráficas**: Recharts (interactivas en web) 
- **Componentes UI**: Radix UI primitives (accesibilidad) + custom styling Tailwind
- **Iconos**: Lucide React (trazo 1.5px, consistente con brandbook)
- **Testing**: Vitest + React Testing Library + Playwright (E2E)

### Backend
- **Framework**: FastAPI 0.115+ (Python 3.12+)
- **ORM**: SQLAlchemy 2.0+ (async) + Alembic (migraciones)
- **Validación**: Pydantic v2 (schemas compartidos con frontend vía OpenAPI)
- **Auth**: JWT RS256 (PyJWT) + bcrypt (passwords)
- **Cache**: Redis 7+ (sessions, rate limiting, cache de cálculos)
- **PDF**: WeasyPrint (HTML→PDF con templates Jinja2)
- **Voz**: Deepgram Python SDK (STT) + Anthropic SDK (NLU con Claude Haiku)
- **Testing**: pytest + pytest-asyncio + Factory Boy (fixtures)
- **Logging**: structlog (structured JSON logging)

### Base de Datos
- **PostgreSQL 16** con extensiones: pgcrypto (cifrado AES-256), uuid-ossp
- **Row-Level Security (RLS)**: Segregación por asesor_id en TODAS las tablas de cliente
- **Cifrado en reposo**: Campos financieros con pgp_sym_encrypt/decrypt
- **Migraciones**: Alembic con migraciones reversibles

### Infraestructura
- **Contenedores**: Docker Compose (dev) → Docker (prod)
- **Hosting MVP**: Hetzner Cloud CPX31 (8 vCPU, 16GB RAM) — $30 USD/mes
- **CI/CD**: GitHub Actions (lint → test → build → deploy)
- **Monitoreo**: Sentry (errores) + Prometheus + Grafana (métricas)
- **CDN/SSL**: Cloudflare (Free tier)

---

## REGLAS DE CÓDIGO (OBLIGATORIAS)

### TypeScript / Frontend
```
- SIEMPRE usar TypeScript strict. NUNCA `any`, NUNCA `@ts-ignore`.
- SIEMPRE exportar componentes como named exports (NUNCA default exports).
- SIEMPRE usar Zod para validar inputs. Los schemas Zod DEBEN ser espejo exacto de los schemas Pydantic del backend.
- SIEMPRE usar `'use client'` solo cuando el componente necesita interactividad (hooks, event handlers). Server Components por default.
- Nombres de componentes: PascalCase. Nombres de archivos: kebab-case.
- Un componente por archivo. Máximo 200 líneas por componente; si excede, dividir.
- Custom hooks en `/hooks/use-*.ts`. Utilities en `/lib/*.ts`.
- NUNCA usar localStorage para datos sensibles. Access token en memoria (Zustand), refresh token en httpOnly cookie.
- NUNCA hardcodear colores. Usar SIEMPRE tokens Tailwind del brandbook: `bg-azul-grandeza`, `text-sunset`, etc.
- SIEMPRE manejar estados de loading, error y empty en componentes que hacen fetch.
```

### Python / Backend
```
- SIEMPRE usar type hints en TODAS las funciones (parámetros + retorno).
- SIEMPRE usar Pydantic BaseModel para request/response schemas.
- SIEMPRE usar async/await para endpoints y queries a BD.
- NUNCA usar `print()`. Usar `structlog.get_logger()`.
- NUNCA exponer datos financieros en logs. Loggear solo IDs, nunca montos.
- NUNCA retornar stack traces al cliente. Errores en formato RFC 7807.
- Motores de cálculo en `services/motor_*.py` (un archivo por motor: A, B, C, D, E, F).
- Cada motor con try/except POR CAMPO, no global. Si un cálculo falla, retorna null + error msg para ese campo.
- SIEMPRE validar ownership: cada endpoint verifica que el asesor es dueño del recurso antes de retornar datos.
- Rate limiting en TODOS los endpoints: 100 req/min por asesor (Redis counter).
```

### SQL / Base de Datos
```
- NUNCA escribir queries raw con string concatenation. SIEMPRE SQLAlchemy ORM o parameterized queries.
- SIEMPRE activar RLS antes de cualquier query: SET app.current_asesor_id = '{asesor_id}'.
- Campos financieros SIEMPRE cifrados: pgp_sym_encrypt(value, key) al escribir, pgp_sym_decrypt al leer.
- NUNCA DELETE físico en tablas de cliente. Solo soft delete (activo=false).
- Auditoría: tabla auditoria_log es APPEND-ONLY. No grants de UPDATE/DELETE al app user.
- Índices obligatorios: diagnosticos(cliente_id, estado), clientes(asesor_id), auditoria_log(created_at).
```

---

## SEGURIDAD (MÁXIMA PRIORIDAD)

```
- Auth: JWT RS256 con access token (15 min) + refresh token (7 días con rotación).
- MFA: Obligatorio para admin. Opcional para asesores en MVP.
- Cifrado en tránsito: TLS 1.3 para HTTPS. WSS para WebSocket de voz.
- Cifrado en reposo: AES-256 (pgcrypto) para campos financieros en PostgreSQL.
- CORS: Solo dominio propio. No wildcard (*).
- CSP headers: Estrictos. No inline scripts.
- Rate limiting: Redis-based. 100 req/min por asesor. 5 login attempts/min por IP.
- Input sanitization: Pydantic (back) + Zod (front) validan todo. NUNCA confiar en input del cliente.
- Secrets: NUNCA en código. Solo en env vars. .env NUNCA en git (.gitignore).
- Dependencias: Renovate bot para updates automáticos. `pip-audit` y `npm audit` en CI.
- OWASP Top 10 2025: Cada PR debe pasar checklist OWASP antes de merge.
```

---

## PATRONES DE DISEÑO

### API Design
```
- REST con versionado: /api/v1/...
- Responses: {data: T, meta?: {cursor, total}} para listas. T directo para detalle.
- Errores: RFC 7807 → {type, title, status, detail, instance}
- Paginación: cursor-based (NUNCA offset). Header: Link con next/prev.
- Idempotencia: PUT y DELETE idempotentes. POST con header Idempotency-Key.
```

### Frontend Architecture
```
- App Router: /app/(auth)/login, /app/(dashboard)/dashboard, /app/(diagnostico)/diagnosticos/[id]/paso/[step]
- Layouts: RootLayout → AuthLayout / DashboardLayout / DiagnosticoLayout
- Data fetching: TanStack Query con queryKeys tipados. Mutations con optimistic updates.
- Forms: React Hook Form + Zod resolver. Un schema por paso del diagnóstico.
- Auto-save: Custom hook useAutoSave(data, endpoint, 30000ms). Debounce + IndexedDB fallback.
```

### Manejo de Errores
```
- Frontend: Error Boundary global + por sección. Toast para errores de red. Inline para validación.
- Backend: Try/except por campo en motores de cálculo. Retorna null + mensaje si falla un campo.
- Fallo seguro: NUNCA mostrar dato posiblemente incorrecto. Mostrar "No disponible" con explicación.
- Auto-guardado: Si falla PUT, guardar en IndexedDB. Reintentar al reconectar.
```

---

## BRANDBOOK ACTINVER (COLORES Y TIPOGRAFÍA)

### Colores (Tailwind tokens)
```
azul-grandeza: #0A0E12      — Fondos principales (dark mode default)
azul-acompanamiento: #1A2433 — Cards, paneles, tooltips
azul-actinver: #314566       — Botones primarios, links, acentos
arena: #F5F2EB               — Fondos light mode, formularios
blanco: #FFFFFF               — Texto sobre fondos oscuros
sunset: #E6C78A               — Highlights, badges, progreso, punto diacrítico logo

Funcionales:
exito: #317A70     — Estados positivos, completado
alerta: #B58657    — Warnings
error: #8B3A3A     — Errores, déficit
info: #5A6A85      — Informativos, texto secundario
```

### Tipografía
```
Headings: Poppins (Bold/Extrabold) — H1: 64px, H2: 32px, H3: 16px
Body: Open Sans (Regular/Light) — Body: 16px, Small: 12px
Regla del 4: Todos los tamaños en múltiplos de 4 (8, 12, 16, 20, 24, 28, 32, 48, 64)
```

### Regla 90:10
```
90% de composición en colores primarios (azul-grandeza, azul-acompañamiento, blanco)
10% en color complementario (sunset para acentos)
```

---

## CONVENCIONES DE ARCHIVOS

```
/frontend/
  /app/                    — Next.js App Router pages
    /(auth)/login/         — Login page
    /(dashboard)/          — Dashboard layout
    /(diagnostico)/        — Diagnóstico layout + pasos
    /(admin)/              — Panel admin
    /(cliente)/            — Vista readonly cliente
  /components/
    /ui/                   — Componentes base (Button, Input, Card, InfoBox, etc.)
    /diagnostico/          — Componentes del flujo (Paso1Perfil, Paso2Flujo, etc.)
    /outputs/              — Componentes de outputs (DonutChart, CurvaDesacumulacion, etc.)
    /admin/                — Componentes del panel admin
    /wrapped/              — Componentes del Financial Wrapped
  /hooks/                  — Custom hooks (useAutoSave, useWebSocket, etc.)
  /lib/                    — Utilities (api.ts, format.ts, validators.ts)
  /stores/                 — Zustand stores (auth.ts, diagnostico.ts, glosario.ts)
  /styles/                 — Tailwind config + global CSS

/backend/
  /app/
    /api/v1/               — Routers FastAPI (auth.py, clientes.py, diagnosticos.py, admin.py, voz.py)
    /core/                 — Config, security, database, deps
    /models/               — SQLAlchemy models
    /schemas/              — Pydantic schemas (input/output por entidad)
    /services/             — Lógica de negocio (motor_a.py ... motor_f.py, recomendaciones.py, pdf.py, wrapped.py)
    /middleware/            — Auth, RLS, audit, rate_limit, error_handler
    /tests/                — pytest tests (unit + integration)
  /alembic/                — Migraciones
  /templates/              — Jinja2 templates para PDFs

/docker-compose.yml
/.github/workflows/ci.yml
/.cursor/rules/            — Cursor rules (este archivo)
/.context/                 — Context files para la AI
```

---

## TESTING REQUIREMENTS

```
- ANTES de hacer PR: todos los tests pasan localmente.
- Backend: pytest con >80% coverage. Cada motor tiene suite de tests con datos del Excel original.
- Frontend: Vitest para unit tests de hooks y utils. React Testing Library para componentes.
- E2E: Playwright para flujos críticos (login → crear cliente → completar diagnóstico → descargar PDF).
- Seguridad: Tests de RLS y cifrado ejecutan en CI como bloqueantes.
- Precisión: Motores A-F validados contra Excel original con tolerancia ±0.01%.
```

---

## FLUJO DE DESARROLLO

```
1. Crear branch: feature/HU-XXX-descripcion-corta
2. Implementar con Cursor Agent (usar este archivo como contexto)
3. Escribir tests ANTES o DURANTE (TDD cuando sea posible)
4. Correr tests localmente: `make test`
5. Commit con mensaje: "feat(HU-XXX): descripción" o "fix(HU-XXX): descripción"
6. Push + crear PR con checklist:
   [ ] Tests pasan
   [ ] Linter sin errores
   [ ] No hay `any` en TypeScript
   [ ] No hay datos sensibles en logs
   [ ] No hay secrets en código
   [ ] RLS verificado si toca datos de cliente
   [ ] OWASP Top 10 checklist revisado
7. Code review (humano revisa seguridad, AI puede revisar estilo)
8. Merge a main → CI/CD despliega a staging
9. QA en staging → merge a production
```

---

## CONTEXTO DE NEGOCIO PARA LA AI

- Actinver es un banco Y casa de bolsa. Sus clientes son patrimoniales (alto patrimonio) que invierten.
- La herramienta transforma un Excel de 12 pestañas en una app web.
- El Excel tiene 6 motores de cálculo (A-F) que DEBEN replicarse con precisión ±0.01%.
- Los 3 entregables (PDFs) son el deliverable principal para el cliente.
- El tono del brandbook es: empoderar, acompañar, positivo, claro, directo. NUNCA alarmar.
- Los mensajes siguen la fórmula: [Meta] + [lo que lo hace posible]. Ejemplo: "Tu retiro comienza hoy. Da el siguiente paso."
- La herramienta vive FUERA del stack de Actinver. Se conecta vía APIs seguras al CRM (Salesforce).
