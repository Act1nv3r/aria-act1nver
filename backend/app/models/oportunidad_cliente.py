"""
OportunidadCliente — Pipeline de oportunidades de venta y seguimiento postventa.
Equivalente al objeto Opportunity de Salesforce.
Cada oportunidad tiene un estado de tarea, historial de cambios y justificación en caso de descarte.
"""
from uuid import uuid4
from datetime import datetime, date
from sqlalchemy import String, Text, DateTime, Date, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Numeric
from app.core.database import Base
from app.models.base import TimestampMixin


class OportunidadCliente(Base, TimestampMixin):
    """
    Oportunidad de venta o seguimiento postventa detectada para un cliente.

    Tipos:
      - "oportunidad": cross-sell de producto financiero (seguro, PPR, inversión, etc.)
      - "seguimiento": señal entre líneas para seguimiento personalizado

    Estados de tarea:
      - pendiente → en_proceso → completada
      - cualquier estado → descartada (requiere justificación)
    """
    __tablename__ = "oportunidades_cliente"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    cliente_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("clientes.id"), nullable=False, index=True)
    asesor_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("asesores.id"), nullable=False)
    diagnostico_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("diagnosticos.id"), nullable=True)

    # --- Clasificación ---
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)          # oportunidad | seguimiento
    categoria: Mapped[str | None] = mapped_column(String(30), nullable=True)  # proteccion | ahorro | retiro | deuda | inversion | fiscal | patrimonio | seguimiento
    prioridad: Mapped[str] = mapped_column(String(10), nullable=False, default="media")  # alta | media | baja
    fuente: Mapped[str] = mapped_column(String(20), nullable=False, default="ai")       # ai | datos | keyword | manual

    # --- Contenido de la oportunidad ---
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    producto_sugerido: Mapped[str | None] = mapped_column(String(200), nullable=True)
    señal_detectada: Mapped[str | None] = mapped_column(String(500), nullable=True)    # Frase textual del cliente
    contexto_seguimiento: Mapped[str | None] = mapped_column(Text, nullable=True)      # Contexto inferido por IA
    accion_sugerida: Mapped[str | None] = mapped_column(Text, nullable=True)           # Acción concreta recomendada
    confianza: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)      # 0.0-1.0

    # --- Estado de tarea (pipeline CRM) ---
    estado_tarea: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pendiente"
    )  # pendiente | en_proceso | completada | descartada

    justificacion_descarte: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha_objetivo: Mapped[date | None] = mapped_column(Date, nullable=True)
    fecha_inicio_proceso: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fecha_completada: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # --- Historial de cambios de estado (audit trail para Salesforce) ---
    historial_estados: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    # Formato: [{"estado": "en_proceso", "fecha": "ISO", "nota": "..."}]

    # --- Valor estimado (para futura integración Salesforce Opportunity Amount) ---
    valor_estimado_mxn: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)

    # Relationships
    cliente = relationship("Cliente", back_populates="oportunidades")
    asesor = relationship("Asesor")
    diagnostico = relationship("Diagnostico", foreign_keys=[diagnostico_id])
    actividades = relationship("ActividadCliente", back_populates="oportunidad", foreign_keys="ActividadCliente.oportunidad_id")

    __table_args__ = (
        Index("ix_oportunidades_cliente_id_estado", "cliente_id", "estado_tarea"),
    )
