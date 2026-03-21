"""
Sprint 24 - Vista cliente readonly
GET /cliente/{token} - público, retorna outputs para vista readonly
GET /cliente/{token}/pdf/{tipo} - público, PDF para cliente
"""
import hashlib
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.config import settings
from app.models.diagnostico import Diagnostico
from app.models.cliente import Cliente

router = APIRouter(prefix="/cliente", tags=["cliente-readonly"])

# In-memory fallback when Redis not available (use Redis in production)
_share_tokens: dict[str, str] = {}  # hash -> diagnostico_id


def _get_redis():
    try:
        import redis
        r = redis.from_url(settings.redis_url)
        r.ping()
        return r
    except Exception:
        return None


def _store_token(token: str, diagnostico_id: str, ttl_days: int = 30):
    h = hashlib.sha256(token.encode()).hexdigest()
    r = _get_redis()
    if r:
        r.setex(f"share:{h}", timedelta(days=ttl_days), diagnostico_id)
    else:
        _share_tokens[h] = diagnostico_id


def _get_diagnostico_by_token(token: str) -> str | None:
    h = hashlib.sha256(token.encode()).hexdigest()
    r = _get_redis()
    if r:
        val = r.get(f"share:{h}")
        return val.decode() if isinstance(val, bytes) else val
    return _share_tokens.get(h)


def _revoke_token(token: str):
    h = hashlib.sha256(token.encode()).hexdigest()
    r = _get_redis()
    if r:
        r.delete(f"share:{h}")
    else:
        _share_tokens.pop(h, None)


def create_share_token(diagnostico_id: str, ttl_days: int = 30) -> tuple[str, datetime]:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=ttl_days)
    _store_token(token, diagnostico_id, ttl_days)
    return token, expires_at


@router.get("/{token}")
async def get_cliente_readonly(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    diag_id = _get_diagnostico_by_token(token)
    if not diag_id:
        raise HTTPException(status_code=404, detail="Enlace expirado o inválido")
    result = await db.execute(
        select(Diagnostico)
        .options(
            selectinload(Diagnostico.cliente).selectinload(Cliente.asesor),
            selectinload(Diagnostico.perfil),
            selectinload(Diagnostico.flujo_mensual),
            selectinload(Diagnostico.patrimonio),
            selectinload(Diagnostico.retiro),
            selectinload(Diagnostico.proteccion),
            selectinload(Diagnostico.resultados),
        )
        .where(Diagnostico.id == diag_id)
    )
    diag = result.scalar_one_or_none()
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnóstico no encontrado")
    # Solo outputs calculados, no inputs raw
    from app.services.motor_a import calcular_motor_a
    outputs = {}
    if diag.perfil and diag.flujo_mensual and diag.patrimonio:
        p = diag.patrimonio
        activos = float(p.liquidez) + float(p.inversiones) + float(p.dotales) + float(p.afore) + float(p.ppr) + float(p.casa) + float(p.inmuebles_renta) + float(p.negocio)
        pasivos = float(p.hipoteca) + float(p.saldo_planes) + float(p.compromisos)
        motor_a = calcular_motor_a(
            ahorro=float(diag.flujo_mensual.ahorro),
            rentas=float(diag.flujo_mensual.rentas),
            otros=float(diag.flujo_mensual.otros),
            gastos_basicos=float(diag.flujo_mensual.gastos_basicos),
            obligaciones=float(diag.flujo_mensual.obligaciones),
            creditos=float(diag.flujo_mensual.creditos),
            liquidez=float(p.liquidez),
        )
        outputs["patrimonio_neto"] = activos - pasivos
        outputs["meses_reserva"] = motor_a["meses_cubiertos"]
        outputs["grado_avance"] = 0.65
        outputs["nivel_riqueza"] = "En camino"
        outputs["recomendaciones"] = ["Revisa tu nivel de ahorro", "Evalúa cobertura de protección", "Diversifica tu patrimonio"]
    return {
        "diagnostico_id": diag_id,
        "nombre": diag.perfil.nombre if diag.perfil else "Cliente",
        "asesor_nombre": diag.cliente.asesor.nombre if diag.cliente.asesor else "",
        "outputs": outputs,
    }


@router.get("/{token}/pdf/{tipo}")
async def get_cliente_pdf(
    token: str,
    tipo: str,
    db: AsyncSession = Depends(get_db),
):
    """PDF público para vista cliente readonly."""
    if tipo not in ("patrimonio", "balance", "recomendaciones"):
        raise HTTPException(status_code=400, detail="tipo inválido")
    diag_id = _get_diagnostico_by_token(token)
    if not diag_id:
        raise HTTPException(status_code=404, detail="Enlace expirado")
    result = await db.execute(
        select(Diagnostico)
        .options(selectinload(Diagnostico.perfil), selectinload(Diagnostico.patrimonio))
        .where(Diagnostico.id == diag_id)
    )
    diag = result.scalar_one_or_none()
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnóstico no encontrado")
    from app.services.pdf_generator import render_pdf_html, html_to_pdf
    nombre = diag.perfil.nombre if diag.perfil else "Cliente"
    data = {}
    if diag.patrimonio and tipo == "patrimonio":
        p = diag.patrimonio
        data["patrimonio"] = {
            "liquidez": float(p.liquidez), "inversiones": float(p.inversiones), "dotales": float(p.dotales),
            "afore": float(p.afore), "ppr": float(p.ppr), "casa": float(p.casa),
            "inmuebles_renta": float(p.inmuebles_renta), "negocio": float(p.negocio), "hipoteca": float(p.hipoteca),
        }
    try:
        html = render_pdf_html(tipo, nombre, data)
        pdf_bytes = html_to_pdf(html)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=aria_{tipo}.pdf"})
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
