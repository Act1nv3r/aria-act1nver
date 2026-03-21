# PROMPT 25 - Wrapped Backend + Referral Tracking
# Sprint 10 | 1.5 dias

## Wrapped Server-Side
POST /api/v1/diagnosticos/{id}/wrapped: genera 7 PNGs con Pillow (Python).
  Image.new RGB 1080x1920. Gradiente azul-grandeza a azul-acomp.
  Fonts Poppins (incluir .ttf en backend/fonts/).
  Mismo contenido que las tarjetas client-side pero renderizado server-side.
  Response: [{tipo, imagen_url}]. Almacenamiento temporal /tmp/ TTL 24h.

## Referral Tracking
POST /api/v1/diagnosticos/{id}/wrapped/share: genera referral_code unico.
  Response: {referral_code, referral_url}. Persiste en tabla referral_links.
GET /api/v1/referral/{code}: publico. INCREMENT clicks. Redirect a landing Agenda tu diagnostico con {asesor}.
  Si prospecto completa diagnostico -> INCREMENT conversiones.

Panel Admin: agregar tabla referrals con clicks, conversiones, tasa conversion.
