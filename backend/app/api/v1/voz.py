import json
import asyncio
import logging
import ssl
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from app.core.config import settings
import httpx
import certifi

logger = logging.getLogger(__name__)

# SSL context con certifi para evitar CERTIFICATE_VERIFY_FAILED en macOS
_ssl_context = ssl.create_default_context(cafile=certifi.where())

router = APIRouter(prefix="/voz", tags=["voz"])


class ExtraerInput(BaseModel):
    texto: str
    paso_actual: int


@router.websocket("/transcribir")
async def websocket_transcribir(websocket: WebSocket):
    """Proxy WebSocket: frontend sends audio -> backend forwards to Deepgram -> returns transcripts."""
    await websocket.accept()
    if not settings.deepgram_api_key:
        await websocket.close(code=1011, reason="DEEPGRAM_API_KEY no configurada")
        return

    import websockets as ws_lib
    # Doc: https://developers.deepgram.com/reference/speech-to-text/listen-streaming
    # WebM/Opus container: omit encoding/sample_rate (auto-detect)
    # interim_results: updates en tiempo real antes del resultado final
    # diarize: asigna speaker (0,1,...) a cada palabra
    deepgram_url = (
        "wss://api.deepgram.com/v1/listen"
        "?model=nova-2"
        "&language=es"
        "&punctuate=true"
        "&diarize=true"
        "&smart_format=true"
        "&interim_results=true"
        "&utterance_end_ms=1000"
    )
    headers = {"Authorization": f"Token {settings.deepgram_api_key}"}

    try:
        async with ws_lib.connect(
            deepgram_url,
            additional_headers=headers,
            ssl=_ssl_context,
            ping_interval=10,
            ping_timeout=5,
        ) as dg_ws:
            async def forward_to_deepgram():
                try:
                    while True:
                        data = await websocket.receive_bytes()
                        if len(data) > 0:
                            await dg_ws.send(data)
                except WebSocketDisconnect:
                    pass
                except Exception:
                    pass

            async def forward_to_client():
                try:
                    while True:
                        msg = await dg_ws.recv()
                        if isinstance(msg, bytes):
                            await websocket.send_bytes(msg)
                        else:
                            await websocket.send_text(msg)
                except Exception:
                    pass

            await asyncio.gather(forward_to_deepgram(), forward_to_client())
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.exception("Deepgram proxy error: %s", e)
        try:
            msg = (str(e)[:80] + "…") if len(str(e)) > 80 else str(e) or "Error de proxy Deepgram"
            await websocket.close(code=1011, reason=msg)
        except Exception:
            pass


@router.post("/extraer")
async def extraer_entidades(data: ExtraerInput):
    """Extrae entidades financieras del texto usando Claude Haiku."""
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY no configurada")

    campos_por_paso = {
        1: ["nombre", "edad", "genero", "ocupacion", "dependientes"],
        2: ["ahorro", "rentas", "otros", "gastos_basicos", "obligaciones", "creditos"],
        3: ["liquidez", "inversiones", "dotales", "afore", "ppr", "plan_privado", "seguros_retiro", "ley_73", "casa", "inmuebles_renta", "tierra", "negocio", "herencia", "hipoteca", "saldo_planes", "compromisos"],
        4: ["edad_retiro", "mensualidad_deseada", "edad_defuncion"],
        5: ["aportacion_inicial", "aportacion_mensual", "nombre_objetivo", "monto_objetivo", "plazo_objetivo"],
        6: ["seguro_vida", "propiedades_aseguradas", "sgmm"],
    }
    campos = campos_por_paso.get(data.paso_actual, [])
    system_prompt = "Eres un asistente que extrae datos financieros de conversaciones entre un asesor financiero mexicano y su cliente. Responde SOLAMENTE con JSON válido, sin markdown. Montos en MXN: 50 mil=50000, un millón=1000000, 2.5 millones=2500000, medio millón=500000."
    user_prompt = f"Paso actual: {data.paso_actual}. Campos esperados: {', '.join(campos)}.\n\nTexto de conversación:\n{data.texto}\n\nResponde con un array JSON: [{{\"campo\": \"nombre_campo\", \"valor\": valor_extraido, \"confianza\": 0.0-1.0, \"texto_fuente\": \"fragmento\"}}]"

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 500,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                },
                timeout=30.0,
            )
        if res.status_code != 200:
            return []
        body = res.json()
        content = (body.get("content") or [{}])[0].get("text", "")
        if not content:
            return []
        parsed = json.loads(content.replace("```json", "").replace("```", "").strip())
        return parsed if isinstance(parsed, list) else []
    except Exception:
        return []
