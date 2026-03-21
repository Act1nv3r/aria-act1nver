# Sprint 27 - Deploy a Producción

## Hetzner Cloud (CPX31)

1. Crear servidor Ubuntu 24.04 LTS
2. Instalar Docker + Docker Compose
3. Clonar repo
4. Crear `.env.prod`:
   ```
   DB_PASSWORD=<openssl rand -hex 16>
   REDIS_PASSWORD=<openssl rand -hex 16>
   CORS_ORIGINS=https://tu-dominio.com
   API_BASE_URL=https://api.tu-dominio.com
   ```
5. Generar RSA keys: `openssl genrsa -out backend/keys/private.pem 2048`
6. `openssl rsa -in backend/keys/private.pem -pubout -out backend/keys/public.pem`
7. Ejecutar migraciones: `psql $DATABASE_URL -f backend/migrations/add_referral_links.sql`
8. `psql $DATABASE_URL -f backend/migrations/add_referral_code_to_diagnosticos.sql`
9. `docker-compose -f docker-compose.prod.yml up -d`
10. Seed: `docker-compose -f docker-compose.prod.yml exec api python -m app.seed` (o ejecutar seed.py contra la BD)

## Cloudflare

- DNS A record al IP Hetzner
- SSL Full (strict)
- WAF activado
- Cache para static assets

## Backup

Cron cada 6h: `0 */6 * * * /path/to/scripts/backup-db.sh`

## Monitoreo

- GET /api/v1/health → {status, db, redis}
- UptimeRobot ping cada 5 min

## Checklist Pre-Deploy

- [ ] Cambiar password admin
- [ ] CORS solo dominio producción
- [ ] .env completo con secrets reales
- [ ] Test suite completa
- [ ] Smoke test: login → cliente → diagnóstico → PDF
