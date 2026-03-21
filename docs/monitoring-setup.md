# Sprint 9-10 — Stack de monitoreo y observabilidad

## Sentry (Error tracking)

### Frontend (Next.js)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Configurar en `.env.local`:
```
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx  # para source maps
```

### Backend (FastAPI)

```bash
pip install sentry-sdk[fastapi]
```

En `backend/app/main.py`:
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    environment=os.getenv("ENV", "development"),
)
```

---

## Grafana + Prometheus

### Opción A: Docker Compose (self-hosted)

Añadir a `docker-compose.monitoring.yml`:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
```

### Opción B: Grafana Cloud

1. Crear cuenta en grafana.com/products/cloud
2. Conectar Prometheus o Loki
3. Crear dashboards para:
   - Request rate, latency (API)
   - Error rate
   - CPU/Memory del servidor

---

## UptimeRobot

1. Crear cuenta en uptimerobot.com
2. Añadir monitors:
   - **HTTP(s)**: `https://aria.actinver.com` — intervalo 5 min
   - **HTTP(s)**: `https://api.aria.actinver.com/api/v1/health` — intervalo 5 min
3. Alertas: Email, Slack, PagerDuty
4. Status page (opcional): público para usuarios

---

## Métricas recomendadas

| Métrica | Fuente | Alerta |
|---------|--------|--------|
| Uptime | UptimeRobot | Down > 2 checks |
| Errores 5xx | Sentry | > 10/min |
| Latencia p95 | Prometheus/Grafana | > 2s |
| Health check | UptimeRobot | No 200 |
