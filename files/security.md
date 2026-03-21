# Security Policies — ArIA by Actinver

## Clasificación de Datos

| Nivel | Tipo de dato | Cifrado reposo | Cifrado tránsito | Log permitido | Ejemplo |
|-------|-------------|----------------|-------------------|---------------|---------|
| CRÍTICO | Datos financieros | AES-256 (pgcrypto) | TLS 1.3 | Solo ID, NUNCA valor | Saldos, patrimonio, ingresos |
| ALTO | Datos personales | AES-256 | TLS 1.3 | Solo ID | Nombre, edad, ocupación |
| MEDIO | Datos operativos | No requerido | TLS 1.3 | Sí | Estado diagnóstico, paso actual |
| BAJO | Datos públicos | No requerido | TLS 1.3 | Sí | Glosario, parámetros globales |

## OWASP Top 10 2025 — Checklist por PR

Antes de aprobar cualquier PR, verificar:

- [ ] **A01: Broken Access Control** — ¿El endpoint verifica ownership (RLS + asesor_id)?
- [ ] **A02: Cryptographic Failures** — ¿Datos financieros cifrados con pgcrypto? ¿TLS 1.3?
- [ ] **A03: Injection** — ¿Usa SQLAlchemy ORM (no raw SQL)? ¿Pydantic valida todo input?
- [ ] **A04: Insecure Design** — ¿Rate limiting activo? ¿Fail-safe en motores?
- [ ] **A05: Security Misconfiguration** — ¿CORS solo dominio propio? ¿CSP headers?
- [ ] **A06: Vulnerable Components** — ¿pip-audit + npm audit sin críticos?
- [ ] **A07: Auth Failures** — ¿JWT RS256? ¿Refresh rotation? ¿No token en URL?
- [ ] **A08: Data Integrity** — ¿Auditoría append-only? ¿Idempotency keys?
- [ ] **A09: Logging Failures** — ¿structlog sin datos financieros? ¿Sentry configurado?
- [ ] **A10: SSRF** — ¿No hay fetch a URLs provistas por el usuario?

## Regulación Mexicana Aplicable

| Regulación | Qué exige | Cómo cumplimos |
|-----------|-----------|----------------|
| LFPDPPP | Aviso privacidad, consentimiento, derechos ARCO | Modal de consentimiento con timestamp. API de eliminación (borrado lógico+físico 30d) |
| CUB (CNBV) | Cifrado, control acceso, auditoría | AES-256, RLS, auditoria_log append-only 5 años |
| Banxico Ciber | Gestión riesgos tecnológicos, plan continuidad | Backups cada 6h, DR con RPO<1h RTO<4h |
| CONDUSEF Art.45 | Transparencia en recomendaciones | Disclaimer en PDFs: "no constituye asesoría personalizada" |
| PLD/FT | Confidencialidad de datos patrimoniales | Cifrado, RLS, logs sin montos, acceso mínimo privilegio |

## Gestión de Secretos

```
NUNCA en código:
- Database passwords
- JWT private keys (RS256)
- Deepgram API key
- Anthropic API key
- Redis password
- Encryption key para pgcrypto

SIEMPRE en:
- .env (local dev, en .gitignore)
- GitHub Secrets (CI/CD)
- Environment variables del servidor (producción)

ROTACIÓN:
- JWT keys: cada 90 días
- API keys: cada 180 días
- DB passwords: cada 90 días
- Admin password: cambiar ANTES de producción (no usar Test123! en prod)
```

## Incident Response

```
SEVERIDAD CRÍTICA (data breach, acceso no autorizado):
1. Contener: revocar todos los tokens, bloquear acceso
2. Notificar: CISO Actinver + equipo legal (< 1 hora)
3. Investigar: revisar auditoria_log
4. Remediar: patch + deploy
5. Reportar: CNBV si aplica (datos de clientes comprometidos)
6. Post-mortem: documento + mejoras

SEVERIDAD ALTA (vulnerabilidad descubierta, no explotada):
1. Evaluar: ¿es explotable? ¿qué datos están en riesgo?
2. Parchar: hotfix branch → test → deploy (< 24 horas)
3. Comunicar: equipo interno

SEVERIDAD MEDIA/BAJA:
1. Crear ticket con prioridad
2. Resolver en siguiente sprint
```
