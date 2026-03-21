# Sprint 9-10 — Configuración Cloudflare (DNS/CDN)

## DNS

1. **Añadir registros** en Cloudflare → DNS → Records:

| Tipo | Nombre | Contenido | Proxy | TTL |
|------|--------|-----------|-------|-----|
| A | @ | IP_SERVIDOR_HETZNER | Proxied | Auto |
| A | www | IP_SERVIDOR_HETZNER | Proxied | Auto |
| A | api | IP_SERVIDOR_HETZNER | Proxied | Auto |

2. **CNAME** (si usas subdominio):
   - `aria` → `aria.actinver.com` (o tu dominio)

## CDN

1. **Speed** → Optimization:
   - Auto Minify: JS, CSS, HTML ✓
   - Brotli ✓
   - Early Hints ✓

2. **Caching** → Configuration:
   - Caching Level: Standard
   - Browser Cache TTL: Respect Existing Headers
   - Cache static assets (Next.js): `/_next/static/*`, `*.js`, `*.css`, `*.woff2`

3. **Page Rules** (o Rules):
   - `aria.actinver.com/_next/static/*` → Cache Level: Cache Everything, Edge TTL: 1 month
   - `api.aria.actinver.com/*` → Cache Level: Bypass (API no cachear)

## SSL

1. **SSL/TLS** → Overview:
   - Mode: Full (strict) si tienes cert en origen
   - O Full si usas cert Cloudflare

2. **Edge Certificates**:
   - Always Use HTTPS: On
   - Minimum TLS Version: 1.2
   - Automatic HTTPS Rewrites: On

## Security

1. **Security** → Settings:
   - Security Level: Medium

2. **WAF** (opcional):
   - Reglas para bloquear SQL injection, XSS conocidos

## Firewall Rules (opcional)

- Bloquear países no deseados
- Rate limiting por IP

## Variables de entorno

Para el deploy, usar en `.env.prod`:

```
NEXT_PUBLIC_API_URL=https://api.aria.actinver.com
```
