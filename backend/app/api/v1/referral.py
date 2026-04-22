"""
Sprint 25 - Referral tracking público.
GET /api/v1/referral/{code}: incrementa clicks, redirige a landing con asesor.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.config import settings
from app.models.referral_link import ReferralLink
from app.models.diagnostico import Diagnostico
from app.models.cliente import Cliente

router = APIRouter(prefix="/referral", tags=["referral"])


@router.get("/{code}")
async def get_referral_redirect(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Público. Incrementa clicks y redirige a landing 'Agenda tu diagnóstico' con asesor."""
    result = await db.execute(
        select(ReferralLink)
        .options(
            selectinload(ReferralLink.diagnostico).selectinload(Diagnostico.cliente).selectinload(Cliente.asesor),
        )
        .where(ReferralLink.referral_code == code)
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Referral no encontrado")
    await db.execute(update(ReferralLink).where(ReferralLink.id == link.id).values(clicks=ReferralLink.clicks + 1))
    base_url = settings.cors_origins.split(",")[0].strip() if settings.cors_origins else "http://localhost:3001"
    asesor_nombre = ""
    if link.diagnostico and link.diagnostico.cliente and link.diagnostico.cliente.asesor:
        asesor_nombre = link.diagnostico.cliente.asesor.nombre or ""
    landing = f"{base_url}/?ref={code}"
    if asesor_nombre:
        landing += f"&asesor={asesor_nombre.replace(' ', '+')}"
    return RedirectResponse(url=landing, status_code=302)
