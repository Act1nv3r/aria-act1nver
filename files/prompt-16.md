# PROMPT 16 - Backend FastAPI + PostgreSQL + Docker Compose
# Sprint 6 | 2 dias | Post-aprobacion comite

Lee .context/architecture.md y .context/codebase-map.md.

Docker Compose: web(Next.js:3000), api(FastAPI:8000), db(PostgreSQL16+pgcrypto:5432), redis(Redis7:6379).
init.sql: CREATE EXTENSION pgcrypto; CREATE EXTENSION uuid-ossp;

Backend estructura completa en /backend/app/:
  main.py (FastAPI app + middleware stack: CORS, rate_limit, audit, error_handler RFC7807)
  core/ (config pydantic-settings, security JWT RS256+bcrypt, database SQLAlchemy async, deps)
  models/ (18 SQLAlchemy models, uno por tabla. id UUID, created_at, updated_at en todas)
  schemas/ (Pydantic v2, DEBEN coincidir con Zod del frontend)
  services/ (motor_a.py ... motor_f.py, recomendaciones.py)
  api/v1/ (auth.py, clientes.py, diagnosticos.py, admin.py, glosario.py, health.py)
  middleware/ (auth.py, rls.py, audit.py, rate_limit.py, error_handler.py)
  alembic/ (migraciones reversibles)

RLS: ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
  CREATE POLICY asesor_isolation ON clientes FOR ALL USING (asesor_id = current_setting(app.current_asesor_id)::uuid);
  Repetir para diagnosticos y tablas con FK a asesor.

Cifrado: campos financieros con pgp_sym_encrypt(value::text, key) al escribir, pgp_sym_decrypt al leer.

Seed (app/seed.py): admin user (admin@aria.actinver.com / Test123!), 5 parametros globales, 22 terminos glosario.
