# ArIA by Actinver

Plataforma de diagnóstico financiero: **Next.js** (front) + **FastAPI** (`backend/`).

## Inicio rápido

```bash
# Front (raíz)
cp .env.local.example .env.local
npm install
npm run dev
```

El front queda en **http://localhost:3001** (`npm run dev` usa ese puerto). API local: **`README-BACKEND.md`** y `backend/.env.local.example` (ajusta `CORS_ORIGINS` si tu front no va en 3001).

## Despliegue (Vercel + API)

Guía detallada en **[VERCEL.md](./VERCEL.md)** (front en Vercel, API en otro hosting + `NEXT_PUBLIC_API_URL`).

## Seguridad

No subas `.env` ni `.env.local` con secretos; usa los archivos `*.example` como plantilla.
