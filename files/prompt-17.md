# PROMPT 17 - Auth JWT RS256 + CRUD Clientes con RLS
# Sprint 6-7 | 2 dias

## Auth
POST /api/v1/auth/login: valida email+password (bcrypt), retorna JWT RS256 (access 15min, refresh 7d).
  Response: {access_token, refresh_token, token_type:Bearer, expires_in:900, user:{id,nombre,email,rol}}
  Error 401: Credenciales invalidas (no revelar cual fallo). Rate limit: 5/min por IP (Redis INCR).
POST /api/v1/auth/refresh: rotacion de refresh token (invalida anterior en Redis).
  Si expirado/revocado -> 401.
Middleware auth: leer Bearer token, verificar JWT con public key, extraer user_id y rol.
Middleware RLS: SET app.current_asesor_id = user.id en cada request.
Generar par RSA: openssl genrsa -out private.pem 2048 && openssl rsa -in private.pem -pubout -out public.pem.
Auditoria: log login_exitoso y login_fallido con IP.

## CRUD Clientes
GET /api/v1/clientes: cursor pagination 20/page, ?search= ILIKE, ?sort=. RLS filtra automatico.
POST /api/v1/clientes: {nombre_alias max 80} -> 201 con asesor_id del JWT.
GET /api/v1/clientes/{id}: detail + diagnosticos[]. Si RLS no encuentra -> 404 (no 403).
PUT /api/v1/clientes/{id}: actualizar nombre.
DELETE /api/v1/clientes/{id}: soft delete (activo=false, deleted_at=now()). NUNCA delete fisico.
