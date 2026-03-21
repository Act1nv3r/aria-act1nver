from uuid import uuid4
from decimal import Decimal
from sqlalchemy import Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class PatrimonioFinanciero(Base, TimestampMixin):
    __tablename__ = "patrimonios_financieros"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    diagnostico_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("diagnosticos.id"), nullable=False)
    liquidez: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    inversiones: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    dotales: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    afore: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    ppr: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    plan_privado: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    seguros_retiro: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    ley_73: Mapped[Decimal | None] = mapped_column(Numeric(18, 2), nullable=True)
    casa: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    inmuebles_renta: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    tierra: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    negocio: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    herencia: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    hipoteca: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    saldo_planes: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    compromisos: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)

    diagnostico = relationship("Diagnostico", back_populates="patrimonio")
