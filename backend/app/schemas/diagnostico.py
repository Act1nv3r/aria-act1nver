from decimal import Decimal
from pydantic import BaseModel, Field
from typing import Any


class DiagnosticoCreate(BaseModel):
    cliente_id: str
    modo: str = "individual"
    referral_code: str | None = None


class PerfilInput(BaseModel):
    nombre: str = Field(..., max_length=80)
    edad: int = Field(..., ge=18, le=90)
    genero: str = Field(..., pattern="^[HMONS]$")
    ocupacion: str = Field(..., pattern="^(asalariado|independiente|empresario)$")
    dependientes: bool = False


class FlujoMensualInput(BaseModel):
    ahorro: Decimal = 0
    rentas: Decimal = 0
    otros: Decimal = 0
    gastos_basicos: Decimal = Field(..., ge=1)
    obligaciones: Decimal = 0
    creditos: Decimal = 0


class PatrimonioInput(BaseModel):
    liquidez: Decimal = 0
    inversiones: Decimal = 0
    dotales: Decimal = 0
    afore: Decimal = 0
    ppr: Decimal = 0
    plan_privado: Decimal = 0
    seguros_retiro: Decimal = 0
    ley_73: Decimal | None = None
    casa: Decimal = 0
    inmuebles_renta: Decimal = 0
    tierra: Decimal = 0
    negocio: Decimal = 0
    herencia: Decimal = 0
    hipoteca: Decimal = 0
    saldo_planes: Decimal = 0
    compromisos: Decimal = 0


class RetiroInput(BaseModel):
    edad_retiro: int = Field(..., ge=50, le=70)
    mensualidad_deseada: Decimal = 0
    edad_defuncion: int = Field(..., ge=60, le=95)


class ObjetivoInput(BaseModel):
    nombre: str = Field(..., max_length=40)
    monto: Decimal = 0
    plazo: int = Field(..., ge=1)


class ObjetivosInput(BaseModel):
    aportacion_inicial: Decimal = 0
    aportacion_mensual: Decimal = 0
    lista: list[ObjetivoInput] = Field(default_factory=list, max_length=5)


class ProteccionInput(BaseModel):
    seguro_vida: bool = False
    propiedades_aseguradas: bool | None = None
    sgmm: bool = False


class StepResponse(BaseModel):
    data: dict[str, Any]
    outputs: dict[str, Any] | None = None
    condicionales: dict[str, Any] | None = None
