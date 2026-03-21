# PROMPT 27 - Deploy a Produccion
# Sprint 10 | 1 dia

## Hetzner Cloud CPX31 (8 vCPU, 16GB RAM, ~0/mes)
Ubuntu 24.04 LTS. Instalar Docker + Docker Compose.
Clonar repo. .env produccion con secrets reales.
Generar RSA keys: openssl genrsa -out private.pem 2048.
docker-compose -f docker-compose.prod.yml up -d.
alembic upgrade head + python -m app.seed.

## docker-compose.prod.yml
Sin hot reload, healthchecks en todos los servicios, restart always, logs json-file max 10m, passwords seguros.

## Cloudflare
DNS A record al IP Hetzner. SSL Full strict. WAF activado. Cache static assets.

## Backup PostgreSQL
Cron cada 6h: pg_dump | gzip > /backups/aria_{fecha}.sql.gz. Retencion 30 dias. Test restauracion mensual.

## Monitoreo
GET /api/v1/health -> {status:healthy, db:true, redis:true}. UptimeRobot ping cada 5min. Sentry error tracking. Prometheus+Grafana (opcional MVP).

## Checklist Pre-Deploy
Cambiar password admin. Rotar ENCRYPTION_KEY (openssl rand -hex 32). Verificar .env completo. CORS solo dominio produccion. Rate limiting activo. Test suite completa. Backup BD. Smoke test: login -> cliente -> diagnostico -> PDF.

## Rollback
docker-compose down -> git checkout tag_anterior -> up -d -> restaurar backup si migracion fallo.
