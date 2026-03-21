# ArIA Backend - Sprints 6-10

## Quick Start

### 1. Start PostgreSQL and Redis (Docker)

```bash
docker-compose up -d db redis
```

### 2. Environment (backend)

Copia la plantilla a **`backend/.env.local`** (recomendado). Si mantienes **`backend/.env`**, también funciona; **`.env.local` tiene prioridad** sobre `.env`.

```bash
cp backend/.env.local.example backend/.env.local
# Editar backend/.env.local si hace falta (URLs de DB, Redis, API keys de voz, etc.)
```

### 3. Run Backend API

```bash
cd backend
pip install -r requirements.txt
./venv/bin/python seed.py   # Creates tables + users (or: python3 seed.py)
uvicorn app.main:app --reload --port 8000
```

### 4. Login Credentials

- **Admin**: admin@actinver.com / Test123!
- **Admin**: ltinajero@actinver.com.mx / Luis123!
- **Asesor**: maria@actinver.com / Test123!

### 5. Frontend

Next.js usa **`.env.local`** en la raíz del repo (ya documentado en `.env.local.example`):

```bash
# En la raíz del proyecto
cp .env.local.example .env.local
npm run dev
```

### Seguridad y GitHub

- **`backend/.env`**, **`backend/.env.local`** y **`.env.local`** (raíz) están en **`.gitignore`** para que no se suban secretos a GitHub.
- Solo deben versionarse las plantillas **`.env.example`**, **`.env.local.example`** y las de **`backend/`** con el mismo sufijo **`.example`**.
- Si algún `.env` **ya entró en el historial de Git**, quítalo del índice (el archivo local no se borra) y haz commit:

  ```bash
  git rm --cached --ignore-unmatch backend/.env backend/.env.local .env.local .env
  ```

  Si el repo fue público, **rota** contraseñas, JWT secrets y API keys que hayan estado en ese archivo.

## Implemented (Sprint 6-7)

- Docker Compose (api, db, redis)
- FastAPI + SQLAlchemy async + PostgreSQL
- JWT auth (HS256 fallback when no RSA keys)
- CRUD clientes with asesor isolation
- Models: Asesor, Cliente, Diagnostico, PerfilCliente, FlujoMensual, PatrimonioFinanciero, PlanRetiro, ProteccionPatrimonial, ResultadoCalculo
- Frontend: Login connects to real API, auth store with token persistence
- API client with auth header

## Pending (Sprints 7-10)

- Endpoints diagnóstico (PUT perfil, flujo, patrimonio, etc.)
- Python motors B, C, D, E, F
- Frontend: Dashboard fetches real clientes, diagnostic flow uses API
- PDFs WeasyPrint, Voice backend
- Security tests + CI/CD
- Simulator backend, Admin panel
- Client readonly view, Wrapped backend
- Responsive, Performance, Production deploy
