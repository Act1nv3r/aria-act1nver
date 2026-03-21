from uuid import uuid4
from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class ProteccionPatrimonial(Base, TimestampMixin):
    __tablename__ = "protecciones_patrimoniales"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    diagnostico_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("diagnosticos.id"), nullable=False)
    seguro_vida: Mapped[bool] = mapped_column(Boolean, default=False)
    propiedades_aseguradas: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    sgmm: Mapped[bool] = mapped_column(Boolean, default=False)

    diagnostico = relationship("Diagnostico", back_populates="proteccion")
