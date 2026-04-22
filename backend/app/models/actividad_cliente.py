"""
ActividadCliente — Timeline de interacciones del asesor con el cliente.
Cada llamada, email, WhatsApp, reunión, diagnóstico o nota queda registrada aquí.
Es el historial de actividad al estilo Salesforce Activity Timeline.
"""
from uuid import uuid4
from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class ActividadCliente(Base, TimestampMixin):
    """
    Registro de cada interacción con el cliente.
    Tipos: llamada | email | whatsapp | presencial | diagnostico | nota | tarea_completada
    """
    __tablename__ = "actividades_cliente"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    cliente_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("clientes.id"), nullable=False)
    asesor_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("asesores.id"), nullable=False)

    # --- Tipo y contenido ---
    tipo: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # llamada | email | whatsapp | presencial | diagnostico | nota | tarea_completada | oportunidad_descartada

    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Resultado (para llamadas/reuniones) ---
    resultado: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )  # exitoso | sin_respuesta | reagendado | cancelado | no_aplica

    # --- Referencia a diagnóstico (cuando la actividad es una sesión) ---
    diagnostico_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("diagnosticos.id"), nullable=True)

    # --- Referencia a oportunidad (cuando la actividad cierra/descarta una oportunidad) ---
    oportunidad_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("oportunidades_cliente.id"), nullable=True)

    # --- Timing ---
    duracion_minutos: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fecha_actividad: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # --- Metadata extra (flexible para Salesforce sync) ---
    metadata_extra: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Relationships
    cliente = relationship("Cliente", back_populates="actividades")
    asesor = relationship("Asesor")
    diagnostico = relationship("Diagnostico", foreign_keys=[diagnostico_id])
    oportunidad = relationship("OportunidadCliente", foreign_keys=[oportunidad_id], back_populates="actividades")
