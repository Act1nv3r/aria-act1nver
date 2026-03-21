from uuid import uuid4
from sqlalchemy import String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class ResultadoCalculo(Base, TimestampMixin):
    __tablename__ = "resultados_calculo"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    diagnostico_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("diagnosticos.id"), nullable=False)
    motor: Mapped[str] = mapped_column(String(1), nullable=False)
    resultado: Mapped[dict] = mapped_column(JSONB, nullable=False)

    diagnostico = relationship("Diagnostico", back_populates="resultados")
