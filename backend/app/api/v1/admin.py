"""
Sprint 25 - Admin endpoints (admin role required).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.asesor import Asesor
from app.models.referral_link import ReferralLink
from app.models.diagnostico import Diagnostico
from app.models.cliente import Cliente

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/referrals")
async def list_referrals(
    db: AsyncSession = Depends(get_db),
    _admin: Asesor = Depends(get_admin_user),
):
    """Lista referrals con clicks, conversiones, tasa de conversión."""
    result = await db.execute(
        select(ReferralLink)
        .options(
            selectinload(ReferralLink.diagnostico).selectinload(Diagnostico.cliente).selectinload(Cliente.asesor),
        )
        .order_by(ReferralLink.created_at.desc())
    )
    links = result.scalars().all()
    rows = []
    for r in links:
        tasa = (r.conversiones / r.clicks * 100) if r.clicks > 0 else 0
        asesor = ""
        if r.diagnostico and r.diagnostico.cliente and r.diagnostico.cliente.asesor:
            asesor = r.diagnostico.cliente.asesor.nombre
        rows.append({
            "id": r.id,
            "referral_code": r.referral_code,
            "diagnostico_id": r.diagnostico_id,
            "asesor": asesor,
            "clicks": r.clicks,
            "conversiones": r.conversiones,
            "tasa_conversion": round(tasa, 1),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return {"referrals": rows}
