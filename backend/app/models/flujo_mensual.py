from uuid import uuid4
from decimal import Decimal
from sqlalchemy import Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class FlujoMensual(Base, TimestampMixin):
    __tablename__ = "flujos_mensuales"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    diagnostico_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("diagnosticos.id"), nullable=False)
    ahorro: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    rentas: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    otros: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    gastos_basicos: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    obligaciones: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    creditos: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)

    diagnostico = relationship("Diagnostico", back_populates="flujo_mensual")
