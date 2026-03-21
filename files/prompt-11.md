# PROMPT 11 - Captura por Voz: Microfono + Deepgram STT Streaming
# Sprint 4 | 2 dias

API key en .env.local: NEXT_PUBLIC_DEEPGRAM_API_KEY

## Hook /hooks/use-deepgram.ts

Custom hook para grabar audio y transcribir en tiempo real:
1. navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } })
2. MediaRecorder con mimeType audio/webm codecs=opus, timeslice 250ms
3. WebSocket a wss://api.deepgram.com/v1/listen con params: model=nova-2, language=es, punctuate=true, diarize=true, smart_format=true
   Auth: protocol header ['token', DEEPGRAM_API_KEY]
4. MediaRecorder.ondataavailable -> send chunk via WebSocket
5. WebSocket.onmessage -> parsear JSON:
   data.channel.alternatives[0].transcript -> texto
   data.channel.alternatives[0].words[0].speaker -> 0=asesor, 1=cliente
   data.is_final -> boolean
6. Agregar a array de TranscriptLine: { text, speaker, timestamp, isFinal }
7. Cleanup: stopRecording -> cerrar MediaRecorder + cerrar WebSocket

Interface:
  isRecording: boolean
  transcript: TranscriptLine[]
  startRecording: () => Promise<void>
  stopRecording: () => void
  error: string | null

Errores: getUserMedia rechazado, WebSocket error, timeout 5s sin respuesta

## /components/voz/voice-button.tsx

Boton circular 40px en context-bar.tsx (entre nombre cliente e indicador guardado).
- Inactivo: bg info/20, icono Mic (Lucide 20px) info. Hover: info/30. Tooltip: Activar captura por voz.
- Activo: bg error-brand, icono Mic blanco. CSS pulse animation 1.5s infinite (scale 1 -> 1.15 -> 1).
- Error: bg info/20, icono MicOff error-brand. Cursor not-allowed.
Click inactivo + primera vez -> abrir VoiceConsentModal. Ya consintio -> startRecording().
Click activo -> stopRecording().

## /components/voz/voice-consent-modal.tsx

Modal (usa modal.tsx de Prompt 1):
- Titulo: Captura por voz (Poppins Bold 20px)
- Icono Mic 48px sunset centrado
- Texto: Para agilizar la captura, esta sesion se procesa por voz. El audio no se almacena.
- Texto secundario: El audio se procesa en tiempo real y no se guarda. (Open Sans 12px info)
- Checkbox/Toggle: Acepto el procesamiento de voz para esta sesion
- Boton Activar voz (primary, solo si checkbox marcado) -> sessionStorage voice_consent=true -> startRecording() -> cerrar
- Boton No gracias (ghost) -> cerrar sin activar

## /components/voz/transcription-panel.tsx

Panel lateral cuando voz activa:
- Desktop: panel fijo derecha del output panel, 300px width, bg azul-grandeza, border-left 1px info/20. Colapsable.
- Tablet: drawer bottom 50% height con handle bar.
- Header: Transcripcion en vivo (Poppins Bold 14px sunset) + badge REC rojo pulsante
- Lista TranscriptLines en scroll auto (scroll-to-bottom automatico):
  Badge hablante: Asesor (bg info/20 text info) o Cliente (bg sunset/20 text sunset)
  Texto: Open Sans 14px blanco. Si !isFinal: opacity 0.6
  Animacion: slide-in desde abajo 200ms cada nueva linea
- Footer: Solo respuestas del cliente alimentan los campos (Open Sans 11px info)
- Mostrar cuando isRecording=true, ocultar con slide-out 300ms cuando false.
