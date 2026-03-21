from uuid import uuid4
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import TimestampMixin


class ReferralLink(Base, TimestampMixin):
    __tablename__ = "referral_links"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    diagnostico_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("diagnosticos.id"), nullable=False)
    referral_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    clicks: Mapped[int] = mapped_column(Integer, default=0)
    conversiones: Mapped[int] = mapped_column(Integer, default=0)

    diagnostico = relationship("Diagnostico", back_populates="referral_links")
