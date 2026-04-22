"""
PerfilAcumulado — Perfil CRM a nivel cliente (no a nivel diagnóstico).
Se actualiza cada vez que se completa un nuevo diagnóstico.
Es la fuente de verdad para el CRM y para la futura integración con Salesforce.
"""
from uuid import uuid4
from datetime import datetime
from sqlalchemy import String, Boolean, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Numeric
from app.core.database import Base
from app.models.base import TimestampMixin


class PerfilAcumulado(Base, TimestampMixin):
    """
    Perfil consolidado del cliente.
    Campos demográficos: se actualizan desde el diagnóstico más reciente.
    Campos de contacto: ingresados manualmente por el asesor.
    Campos financieros: resumen calculado del diagnóstico más reciente.
    Tags: etiquetas libres para segmentación.
    """
    __tablename__ = "perfiles_acumulados"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    cliente_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("clientes.id"), nullable=False, unique=True)

    # --- Datos demográficos (sincronizados desde último diagnóstico) ---
    nombre: Mapped[str | None] = mapped_column(String(120), nullable=True)
    edad: Mapped[int | None] = mapped_column(Integer, nullable=True)
    genero: Mapped[str | None] = mapped_column(String(2), nullable=True)       # H | M | O | N | S
    ocupacion: Mapped[str | None] = mapped_column(String(30), nullable=True)   # asalariado | independiente | empresario
    dependientes: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # --- Información de contacto (entrada manual del asesor) ---
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    whatsapp: Mapped[str | None] = mapped_column(String(20), nullable=True)
    empresa: Mapped[str | None] = mapped_column(String(120), nullable=True)
    cargo: Mapped[str | None] = mapped_column(String(80), nullable=True)
    ciudad: Mapped[str | None] = mapped_column(String(80), nullable=True)

    # --- Resumen financiero (actualizado tras cada diagnóstico) ---
    patrimonio_total: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    liquidez_total: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    ahorro_mensual: Mapped[float | None] = mapped_column(Numeric(18, 2), nullable=True)
    nivel_riqueza: Mapped[str | None] = mapped_column(String(20), nullable=True)   # bajo | medio | alto | muy_alto
    grado_avance_retiro: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)  # 0-100%
    tiene_seguro_vida: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    tiene_sgmm: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # --- Metadatos CRM ---
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)       # ["alto_valor", "cliente_nuevo", ...]
    notas_generales: Mapped[str | None] = mapped_column(Text, nullable=True)
    salud_score: Mapped[int | None] = mapped_column(Integer, nullable=True, default=20) # 0-100

    # --- Referencia al diagnóstico fuente del último sync ---
    ultimo_diagnostico_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("diagnosticos.id"), nullable=True)
    ultima_actualizacion_diagnostico: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    cliente = relationship("Cliente", back_populates="perfil_acumulado")
    ultimo_diagnostico = relationship("Diagnostico", foreign_keys=[ultimo_diagnostico_id])
