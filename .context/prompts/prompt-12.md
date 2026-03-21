# PROMPT 12 - Claude Haiku NLU: Extraccion de Entidades + Suggestion Pills
# Sprint 4 | 2 dias

API key en .env.local: NEXT_PUBLIC_ANTHROPIC_API_KEY

## /lib/voz-nlu.ts

Funcion extraerEntidades(texto: string, pasoActual: number): Promise<Sugerencia[]>

Llamar API Anthropic directamente desde browser (temporal para prototipo):
fetch https://api.anthropic.com/v1/messages con headers:
  x-api-key, anthropic-version: 2023-06-01, anthropic-dangerous-direct-browser-access: true
Model: claude-haiku-4-5-20251001. Max tokens: 500.

System prompt: Eres un asistente que extrae datos financieros de conversaciones entre un asesor financiero mexicano y su cliente. Responde SOLAMENTE con JSON valido, sin markdown. Montos en MXN: 50 mil=50000, un millon=1000000, 2.5 millones=2500000, medio millon=500000.

User prompt incluye: paso actual, campos esperados (mapeo por paso - ver context.md), texto de conversacion.
Response: [{campo, valor, confianza, texto_fuente}]

Campos esperados por paso:
  1: nombre, edad, genero, ocupacion, dependientes
  2: ahorro, rentas, otros, gastos_basicos, obligaciones, creditos
  3: liquidez, inversiones, dotales, afore, ppr, plan_privado, seguros_retiro, ley_73, casa, inmuebles_renta, tierra, negocio, herencia, hipoteca, saldo_planes, compromisos
  4: edad_retiro, mensualidad_deseada, edad_defuncion
  5: aportacion_inicial, aportacion_mensual, nombre_objetivo, monto_objetivo, plazo_objetivo
  6: seguro_vida, propiedades_aseguradas, sgmm

## /components/voz/suggestion-pill.tsx

Chip flotante junto al campo sugerido. Position absolute al borde derecho del input (wrapper needs position relative).
- Confianza > 0.9: fondo exito/15, borde 1px exito/30, texto exito
- Confianza 0.7-0.9: fondo sunset/15, borde 1px sunset/30, texto sunset
- Confianza < 0.7: NO renderizar
- Contenido: valor formateado (ej 0,000) Open Sans Bold 13px + 2 botones mini 24px:
  Check (bg exito, icon Check 14px blanco) -> onAccept -> setValue(campo, valor) + toast
  X (bg error-brand/50, icon X 14px blanco) -> onReject -> descartar
- Animacion: fade-in + translate-y -4px a 0 en 300ms
- Auto-dismiss: 30 segundos -> fade-out

## /hooks/use-voice-suggestions.ts

Map<campo, Sugerencia> de sugerencias activas.
Trigger extraccion: cada 10s mientras voz activa O pausa de 2s detectada.
Solo usar lineas del speaker=cliente (no las del asesor).
Tomar ultimos 30s de transcript -> extraerEntidades(texto, pasoActual).
Si confianza >= 0.7: agregar al Map -> renderizar SuggestionPill.
aceptarSugerencia: setValue(campo, valor) + remover del Map + toast exito
rechazarSugerencia: remover del Map

## Integrar en formularios paso1-paso6:
Cada campo envuelto en div position:relative con SuggestionPill condicional.
