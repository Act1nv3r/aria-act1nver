# PROMPT 24 - Vista Cliente Readonly
# Sprint 9-10 | 1.5 dias

## Backend
POST /api/v1/diagnosticos/{id}/compartir: genera JWT scope=client_readonly, diagnostico_id, exp 30 dias.
  Response: {url, token, expires_at}. Hash del token en Redis TTL 30d.
GET /api/v1/cliente/{token}: publico. Valida token. Retorna outputs (no inputs raw).
  NO retorna montos especificos, solo outputs calculados.
  Si expirado -> 404.
DELETE /api/v1/diagnosticos/{id}/compartir: revoca token (borrar de Redis).

## Frontend /app/(cliente)/cliente/[token]/page.tsx
Ruta publica (sin layout dashboard). Header: logo ArIA centrado. Max-width 800px.
Saludo: Hola {nombre} (Poppins Bold 28px).
4 cards resumen grid 2x2: Patrimonio Neto, Grado Avance (circular grande), Nivel Riqueza, Reserva.
Grafica hero: CurvaDesacumulacion.
5 Recomendaciones simplificadas.
Simulador basico: solo 3 sliders (edad retiro, ahorro, mensualidad).
Boton Descargar mis resultados -> 3 PDFs.
Info boxes PROMINENTES: icono siempre visible (no solo hover). Tooltips mas grandes (max 60 palabras).
Footer: Tu asesor: {nombre}. Necesitas algo mas? Contacta a tu asesor.
Token expirado: logo + Este enlace ha expirado + Contacta a tu asesor.
