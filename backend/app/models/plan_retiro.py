from uuid import uuid4
from decimal import Decimal
from sqlalchemy import Numeric, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class PlanRetiro(Base, TimestampMixin):
    __tablename__ = "planes_retiro"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    diagnostico_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("diagnosticos.id"), nullable=False)
    edad_retiro: Mapped[int] = mapped_column(Integer, default=60)
    mensualidad_deseada: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    edad_defuncion: Mapped[int] = mapped_column(Integer, default=90)

    diagnostico = relationship("Diagnostico", back_populates="retiro")
