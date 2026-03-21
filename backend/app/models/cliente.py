from uuid import uuid4
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Cliente(Base, TimestampMixin):
    __tablename__ = "clientes"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    asesor_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("asesores.id"), nullable=False)
    nombre_alias: Mapped[str] = mapped_column(String(80), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    asesor = relationship("Asesor", back_populates="clientes")
    diagnosticos = relationship("Diagnostico", back_populates="cliente")
