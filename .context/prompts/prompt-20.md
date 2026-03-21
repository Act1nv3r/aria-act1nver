# PROMPT 20 - PDFs WeasyPrint + Voz Backend
# Sprint 7-8 | 2 dias

## PDFs Server-Side
GET /api/v1/diagnosticos/{id}/pdf/{tipo}: patrimonio|balance|recomendaciones
Templates Jinja2 en backend/templates/ con CSS brandbook (fondo arena para impresion, headings azul-actinver).
Graficas: Matplotlib con paleta data viz del brandbook -> PNG base64 embebido en HTML.
WeasyPrint: HTML(string=rendered).write_pdf()
Cache Redis: pdf:{id}:{tipo}:{version}, TTL 24h. Invalidar al editar diagnostico.
Header: ArIA by Actinver + nombre + fecha. Footer: disclaimer CONDUSEF.
Response: StreamingResponse application/pdf.
Frontend: boton descarga -> window.open(API_URL/api/v1/diagnosticos/{id}/pdf/{tipo})

## Voz Backend (mover API keys al server)
WebSocket /api/v1/voz/transcribir: frontend envia audio chunks -> backend proxy a Deepgram -> retorna transcripciones.
POST /api/v1/voz/extraer: {texto, paso_actual} -> backend llama Claude Haiku con Anthropic SDK -> retorna entidades.
Auth WS: JWT en query param (?token=xxx). Audio NUNCA en disco.
Frontend: actualizar use-deepgram.ts (WS al backend, no a Deepgram directo). Eliminar API keys publicas de .env.local.
