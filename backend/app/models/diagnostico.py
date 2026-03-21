from uuid import uuid4
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class Diagnostico(Base, TimestampMixin):
    __tablename__ = "diagnosticos"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    cliente_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("clientes.id"), nullable=False)
    modo: Mapped[str] = mapped_column(String(20), default="individual")
    estado: Mapped[str] = mapped_column(String(20), default="borrador")
    paso_actual: Mapped[int] = mapped_column(Integer, default=1)
    referral_code_used: Mapped[str | None] = mapped_column(String(32), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    parametros_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    objetivos_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    cliente = relationship("Cliente", back_populates="diagnosticos")
    perfil = relationship("PerfilCliente", back_populates="diagnostico", uselist=False)
    referral_links = relationship("ReferralLink", back_populates="diagnostico")
    flujo_mensual = relationship("FlujoMensual", back_populates="diagnostico", uselist=False)
    patrimonio = relationship("PatrimonioFinanciero", back_populates="diagnostico", uselist=False)
    retiro = relationship("PlanRetiro", back_populates="diagnostico", uselist=False)
    proteccion = relationship("ProteccionPatrimonial", back_populates="diagnostico", uselist=False)
    resultados = relationship("ResultadoCalculo", back_populates="diagnostico")
