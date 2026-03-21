from uuid import uuid4
from sqlalchemy import String, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class PerfilCliente(Base, TimestampMixin):
    __tablename__ = "perfiles_cliente"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    diagnostico_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("diagnosticos.id"), nullable=False)
    nombre: Mapped[str] = mapped_column(String(80), nullable=False)
    edad: Mapped[int] = mapped_column(Integer, nullable=False)
    genero: Mapped[str] = mapped_column(String(2), nullable=False)
    ocupacion: Mapped[str] = mapped_column(String(30), nullable=False)
    dependientes: Mapped[bool] = mapped_column(Boolean, default=False)

    diagnostico = relationship("Diagnostico", back_populates="perfil")
