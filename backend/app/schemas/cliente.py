from datetime import datetime

from pydantic import BaseModel, Field


class UltimoDiagnosticoSummary(BaseModel):
    id: str
    estado: str
    paso_actual: int
    modo: str
    created_at: datetime | None = None


class ClienteCreate(BaseModel):
    nombre_alias: str = Field(..., max_length=80)


class ClienteUpdate(BaseModel):
    nombre_alias: str | None = Field(None, max_length=80)


class ClienteResponse(BaseModel):
    id: str
    nombre_alias: str
    activo: bool
    ultimo_diagnostico: UltimoDiagnosticoSummary | None = None

    class Config:
        from_attributes = True
