from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_access_token, create_refresh_token, verify_token
from app.core.config import settings
from app.models.asesor import Asesor
from app.schemas.auth import LoginInput, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginInput, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Asesor).where(Asesor.email == data.email, Asesor.activo == True))
    asesor = result.scalar_one_or_none()
    if not asesor or not verify_password(data.password, asesor.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )
    user = UserResponse(id=asesor.id, nombre=asesor.nombre, email=asesor.email, rol=asesor.rol)
    access_token = create_access_token({"sub": asesor.id, "email": asesor.email, "rol": asesor.rol})
    refresh_token = create_refresh_token({"sub": asesor.id})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.access_token_expire_minutes * 60,
        user=user,
    )
