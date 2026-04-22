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


class ExtraerContinuoInput(BaseModel):
    texto: str
    datos_faltantes: list[str]
    datos_actuales: dict = {}


# Field descriptions for Claude — maps internal field names to natural-language meaning
FIELD_DESCRIPTIONS = {
    "nombre": "Nombre completo del cliente",
    "edad": "Edad actual del cliente (número entero)",
    "genero": "Género: Masculino, Femenino, u Otro",
    "ocupacion": "Ocupación o profesión del cliente",
    "dependientes": "Número de dependientes económicos (hijos, familia que depende del cliente). Si dice 'no tengo hijos/dependientes', el valor es 0. Si dice 'tengo 2 hijos', el valor es 2.",
    "ahorro": "Monto mensual que ahorra o le sobra al mes (MXN)",
    "rentas": "Ingresos mensuales por rentas de propiedades (MXN). 0 si no tiene.",
    "gastos_basicos": "Gastos mensuales esenciales: comida, servicios, transporte (MXN)",
    "obligaciones": "Pagos fijos mensuales: colegiaturas, seguros, mantenimientos (MXN)",
    "otros": "Otros ingresos adicionales al sueldo: freelance, honorarios, negocio extra (MXN)",
    "creditos": "Pagos mensuales de créditos: hipoteca, auto, tarjetas de crédito (MXN). 0 si no tiene.",
    "liquidez": "Dinero disponible en cuentas bancarias, ahorro líquido, efectivo (MXN)",
    "inversiones": "Monto total en inversiones: fondos, acciones, CETES, bonos (MXN)",
    "dotales": "Monto en seguros dotales o con componente de ahorro (MXN)",
    "afore": "Saldo acumulado en AFORE (MXN)",
    "ppr": "Monto en Plan Personal de Retiro (MXN). 0 si no tiene.",
    "plan_privado": "Monto en plan de pensión de la empresa (MXN). 0 si no tiene.",
    "seguros_retiro": "Monto en seguros con beneficio de retiro (MXN)",
    "ley_73": "Pensión estimada mensual por Ley 73 del IMSS (MXN). 0 si no cotiza.",
    "casa": "Valor de la casa habitación propia (MXN). 0 si renta.",
    "inmuebles_renta": "Valor de propiedades que renta a terceros (MXN)",
    "tierra": "Valor de terrenos o tierra (MXN)",
    "negocio": "Valor estimado de negocio propio (MXN)",
    "herencia": "Monto esperado de herencia futura (MXN). 0 si no espera.",
    "seguro_vida": "¿Tiene seguro de vida? (true/false)",
    "propiedades_aseguradas": "¿Sus propiedades están aseguradas? (true/false)",
    "sgmm": "¿Tiene Seguro de Gastos Médicos Mayores? (true/false)",
    "edad_retiro": "Edad a la que desea retirarse (número entero)",
    "mensualidad_deseada": "Monto mensual deseado al retirarse (MXN)",
}


@router.post("/extraer-continuo")
async def extraer_continuo(data: ExtraerContinuoInput):
    """
    Continuous extraction: Claude Haiku analyzes the full conversation transcript
    and extracts ALL possible field values from ANY part of the conversation,
    regardless of which section/step it belongs to.
    """
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY no configurada")

    if not data.texto.strip() or not data.datos_faltantes:
        return []

    # Build field descriptions for only the missing fields
    field_desc_lines = []
    for campo in data.datos_faltantes:
        desc = FIELD_DESCRIPTIONS.get(campo, campo)
        field_desc_lines.append(f"  - {campo}: {desc}")
    field_descriptions = "\n".join(field_desc_lines)

    system_prompt = """Eres un experto extractor de datos financieros para una herramienta de planificación financiera en México.

Tu trabajo es analizar una conversación entre un asesor financiero y su cliente, y extraer TODOS los datos posibles que mencione el cliente o el asesor.

REGLAS CRÍTICAS:
1. Analiza TODO el texto, no solo las últimas frases.
2. El cliente habla coloquialmente. "Tengo 2 hijos" = dependientes: 2. "Me sobran como 15 mil" = ahorro: 15000. "Gasto unos 30 mil al mes en todo" = gastos_basicos: 30000.
3. Montos en MXN: "50 mil" = 50000, "un millón" = 1000000, "2.5 millones" = 2500000, "medio millón" = 500000, "como 200" probablemente son 200000 si habla de patrimonio.
4. Para campos booleanos (seguro_vida, propiedades_aseguradas, sgmm): "sí tengo" = true, "no tengo" = false.
5. Para dependientes: "tengo 3 hijos" = 3, "no tengo hijos" = 0, "somos mi esposa y yo" = 0 (solo cuenta dependientes, no pareja).
6. Asigna confianza alta (0.85-0.95) cuando el dato es claro y directo. Confianza media (0.7-0.84) cuando hay que inferir. Confianza baja (<0.7) si es muy ambiguo.
7. Responde SOLAMENTE con un JSON array válido, sin texto adicional, sin markdown, sin explicaciones.
8. Si no encuentras información para un campo, NO lo incluyas en el array."""

    user_prompt = f"""Campos que necesito extraer:
{field_descriptions}

Conversación:
{data.texto[-4000:]}

Responde SOLO con JSON array: [{{"campo": "nombre_campo", "valor": valor_extraido, "confianza": 0.0-1.0, "texto_fuente": "fragmento exacto de la conversación"}}]"""

    try:
        async with httpx.AsyncClient(verify=_ssl_context) as client:
            res = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": 1000,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                },
                timeout=30.0,
            )
        if res.status_code != 200:
            logger.warning("Anthropic returned %s: %s", res.status_code, res.text[:200])
            return []
        body = res.json()
        content = (body.get("content") or [{}])[0].get("text", "")
        if not content:
            return []
        cleaned = content.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(cleaned)
        if not isinstance(parsed, list):
            return []
        # Validate and filter results
        valid = []
        for item in parsed:
            if isinstance(item, dict) and "campo" in item and "valor" in item:
                if item["campo"] in data.datos_faltantes:
                    valid.append({
                        "campo": item["campo"],
                        "valor": item["valor"],
                        "confianza": min(max(float(item.get("confianza", 0.8)), 0.0), 1.0),
                        "texto_fuente": str(item.get("texto_fuente", ""))[:100],
                    })
        return valid
    except json.JSONDecodeError as e:
        logger.warning("Failed to parse Haiku response: %s", e)
        return []
    except Exception as e:
        logger.exception("extraer-continuo error: %s", e)
        return []


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
        "&numerals=true"       # force numeric digits ("45") not words ("cuarenta y cinco")
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
