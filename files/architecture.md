# Architecture — ArIA by Actinver

## Visión de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INTERNET (Cloudflare CDN/WAF)                │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS (TLS 1.3)
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     DOCKER HOST (Hetzner CPX31)                     │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────┐  ┌──────────────┐ │
│  │  Next.js 15  │  │   FastAPI    │  │ Redis  │  │ PostgreSQL   │ │
│  │  (Frontend)  │←→│  (Backend)   │←→│  7+    │  │  16 + RLS    │ │
│  │  Port :3000  │  │  Port :8000  │  │ :6379  │  │  + pgcrypto  │ │
│  └──────────────┘  └──────┬───────┘  └────────┘  │  Port :5432  │ │
│                           │                       └──────────────┘ │
│                           │ WebSocket (WSS)                        │
│                           ▼                                        │
│                    ┌──────────────┐                                 │
│                    │  Deepgram    │ ← STT streaming (externo)      │
│                    │  Claude API  │ ← NLU extracción (externo)     │
│                    └──────────────┘                                 │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ API REST (mTLS en V2)
                                ▼
                    ┌──────────────────┐
                    │  Salesforce CRM  │ ← Push diagnósticos (V2)
                    │  (Actinver)      │
                    └──────────────────┘
```

## Decisiones de Arquitectura (ADR)

### ADR-001: Monolito modular en lugar de microservicios
**Decisión**: Monolito con separación clara de módulos (frontend/backend/services) en vez de microservicios.
**Razón**: Para 500 asesores concurrentes, un monolito bien estructurado es más económico, más rápido de desarrollar con vibe coding, y más fácil de mantener. Un solo servidor Hetzner CPX31 ($30/mes) maneja esta carga.
**Trade-off**: Si se necesita escalar >5000 asesores, migrar motores de cálculo a workers separados.

### ADR-002: PostgreSQL RLS para multi-tenancy en lugar de schemas separados
**Decisión**: Row-Level Security nativo de PostgreSQL para aislar datos entre asesores.
**Razón**: RLS es enforcement a nivel de BD (no de aplicación), lo que previene data leaks incluso si hay un bug en el código. Más seguro que filtros WHERE en la app.

### ADR-003: Next.js App Router con Server Components
**Decisión**: Server Components por default, Client Components solo para interactividad.
**Razón**: Reduce JavaScript enviado al cliente (mejor performance), mejora SEO para vista pública del cliente, y permite streaming de UI durante carga de datos.

### ADR-004: Cursor/Vibe coding con guardrails estrictos
**Decisión**: Desarrollo asistido por AI (Cursor) con rules files, context files, y code review humano obligatorio para seguridad.
**Razón**: Reduce tiempo de desarrollo ~60%. Los guardrails (cursorrules.md, tests de seguridad en CI, review humano) mitigan los riesgos documentados de vibe coding (45% de código AI con vulnerabilidades según estudios 2025).

### ADR-005: Infraestructura propia en lugar de cloud enterprise
**Decisión**: Hetzner Cloud (MVP) en vez de AWS/Azure/GCP.
**Razón**: Costo 5-10x menor ($30-80/mes vs $300-800/mes). Suficiente para 500 asesores + 150K clientes. Si regulación o escala lo requieren en V2, migrar a AWS con containers Docker idénticos.

---

## Modelo de Datos (ER simplificado)

```
Asesor (1) ──────< (N) Cliente (1) ──< (N) Diagnostico
                      │                      │
                      └── (0..1) Pareja      ├── (1) PerfilCliente
                                             ├── (1) FlujoMensual
                                             ├── (1) PatrimonioFinanciero
                                             ├── (1) PatrimonioNoFinanciero
                                             ├── (1) PlanRetiro
                                             ├── (N) ObjetivoFinanciero (max 5)
                                             ├── (1) ProteccionPatrimonial
                                             ├── (N) ResultadoCalculo (por motor/persona)
                                             ├── (N) Escenario (max 3)
                                             ├── (N) Transcripcion (por paso con voz)
                                             └── (N) WrappedCard (5-7 tarjetas)

Independientes:
- AuditoriaLog (append-only, 5 años retención)
- ParametroGlobal (singleton config)
- ReferralLink (tracking de compartidos)
```

---

## Flujo de Request (Ejemplo: Guardar Paso 2)

```
1. [Frontend] Asesor completa campos → useAutoSave detecta cambio (30s debounce)
2. [Frontend] Zod valida client-side → si error, muestra inline, NO envía
3. [Frontend] PUT /api/v1/diagnosticos/{id}/flujo-mensual con JWT en Authorization header
4. [Backend] Middleware auth: verifica JWT RS256, extrae asesor_id
5. [Backend] Middleware RLS: SET app.current_asesor_id = asesor_id
6. [Backend] Middleware rate_limit: INCR rate:{asesor_id} en Redis (100/min)
7. [Backend] Middleware audit: registra intención de acción
8. [Backend] Router: valida body con Pydantic FlujoMensualInput
9. [Backend] Service: guarda en BD (campos cifrados con pgcrypto)
10. [Backend] Service: ejecuta Motor A → calcula distribución, reserva, meses
11. [Backend] Service: almacena resultado en ResultadoCalculo(motor='A')
12. [Backend] Response 200: {data: input_guardado, outputs: motor_a_results}
13. [Frontend] TanStack Query actualiza cache → re-render panel outputs
14. [Frontend] Recharts anima nueva gráfica donut + semáforo
15. [Frontend] Indicador "Guardado ✓" en barra contexto (fade 3s)
```

---

## Capas de Seguridad

```
CAPA 1 — PERIMETRO
├── Cloudflare WAF (DDoS, bot protection)
├── TLS 1.3 (certificado Cloudflare)
├── CORS estricto (solo dominio propio)
└── CSP headers (no inline scripts)

CAPA 2 — AUTENTICACIÓN
├── JWT RS256 (access 15min + refresh 7d con rotación)
├── bcrypt (passwords, salt rounds 12)
├── Rate limiting por IP (login: 5/min)
└── MFA para admin (TOTP)

CAPA 3 — AUTORIZACIÓN
├── RBAC middleware (admin, asesor, cliente_readonly)
├── Ownership check (asesor solo ve sus clientes)
└── PostgreSQL RLS (enforcement a nivel BD)

CAPA 4 — DATOS
├── Cifrado en reposo: AES-256 (pgcrypto) campos financieros
├── Cifrado en tránsito: TLS 1.3 (HTTPS) + WSS (WebSocket)
├── Soft delete (nunca borrado físico en MVP)
└── Auditoría append-only (retención 5 años)

CAPA 5 — APLICACIÓN
├── Input validation: Pydantic (back) + Zod (front)
├── SQL injection: SQLAlchemy ORM (no raw queries)
├── XSS: React auto-escape + CSP headers
├── OWASP Top 10 2025 checklist en cada PR
└── Dependencias: Renovate + pip-audit + npm audit
```

---

## Estrategia de Performance (SLA 99.9%)

### Targets
| Métrica | Target | Cómo se logra |
|---------|--------|---------------|
| FCP (First Contentful Paint) | < 1.5s | Next.js Server Components + Cloudflare CDN |
| API response (CRUD) | < 200ms | PostgreSQL índices + Redis cache |
| Motor de cálculo (A-F) | < 300ms | Fórmulas cerradas + cache parcial |
| Generación PDF | < 5s | WeasyPrint + template cache + Redis |
| WebSocket STT latency | < 500ms | Deepgram streaming directo |
| Simulador recálculo | < 300ms | Solo recalcular motor afectado |

### Estrategia de Cache (Redis)
```
glosario:all         → TTL 24h (invalidar al editar desde admin)
diagnostico:{id}:motor:{x} → TTL hasta cambio de datos del paso
pdf:{diag_id}:{tipo}:{version} → TTL 24h (invalidar al editar diagnóstico)
admin:metricas       → TTL 5min
rate:{asesor_id}     → TTL 60s (sliding window rate limit)
session:{token_hash} → TTL 7d (refresh tokens)
```

### Estrategia de Escalado

**Fase 1 (MVP): Single server** — Hetzner CPX31, 8 vCPU, 16GB RAM
- Soporta: 500 asesores concurrentes, 150K clientes en BD, ~1000 diagnósticos/mes
- Costo: ~$80/mes total (server + DB + Redis + STT + NLU)

**Fase 2 (Growth): Horizontal scaling**
- Separar BD a managed PostgreSQL (Hetzner/Aiven)
- Load balancer (Hetzner LB) + 2-3 app servers
- Redis dedicado (managed)
- Costo: ~$200-400/mes

**Fase 3 (Enterprise): Cloud migration**
- AWS/Azure con containers Docker (misma imagen)
- RDS PostgreSQL + ElastiCache Redis
- Auto-scaling groups + ALB
- Costo: ~$800-2000/mes

---

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push: [main, develop]
  pull_request: [main]

jobs:
  lint:
    - frontend: pnpm lint + tsc --noEmit
    - backend: ruff check + mypy

  test-backend:
    - pytest --cov=80%
    - pytest tests/security/ (RLS + cifrado) — BLOQUEANTE
    - pytest tests/motors/ (precisión vs Excel) — BLOQUEANTE

  test-frontend:
    - vitest run --coverage
    - playwright test (E2E flujos críticos)

  security:
    - pip-audit (Python deps)
    - npm audit (Node deps)
    - trivy (Docker image scan)
    - OWASP ZAP (DAST básico en staging)

  build:
    - docker build frontend + backend
    - Push a registry

  deploy-staging:
    - Si branch develop → deploy a staging
    - Smoke tests automáticos

  deploy-production:
    - Si branch main + todos los checks pasan
    - Blue-green deployment (zero downtime)
    - Health check post-deploy
    - Rollback automático si health check falla
```

---

## Monitoreo y Alertas

```
SENTRY (errores):
├── Frontend: Error Boundary reports
├── Backend: Exception handlers
├── Alertas: Slack channel #planeador-alerts
└── SLA: P1 errors → notificación en 5 min

PROMETHEUS + GRAFANA (métricas):
├── Request latency (p50, p95, p99)
├── Error rate (4xx, 5xx)
├── Active connections
├── Database query time
├── Redis hit/miss ratio
├── Motor calculation time
└── CPU/Memory/Disk usage

UPTIME:
├── Healthcheck endpoint: GET /api/v1/health
├── Monitoreo externo: UptimeRobot (free tier)
└── Target: 99.9% mensual (máx 43 min downtime/mes)
```

---

## Disaster Recovery

| Métrica | Target |
|---------|--------|
| RPO (Recovery Point Objective) | < 1 hora |
| RTO (Recovery Time Objective) | < 4 horas |
| Backup frecuencia | Cada 6 horas (PostgreSQL pg_dump cifrado) |
| Backup retención | 30 días |
| Backup ubicación | Diferente datacenter del primario |
| Test de restauración | Mensual |
