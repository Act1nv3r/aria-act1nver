from uuid import uuid4
from sqlalchemy import String, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Asesor(Base, TimestampMixin):
    __tablename__ = "asesores"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nombre: Mapped[str] = mapped_column(String(120), nullable=False)
    rol: Mapped[str] = mapped_column(String(20), default="asesor")
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    clientes = relationship("Cliente", back_populates="asesor")
