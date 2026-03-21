from app.models.asesor import Asesor
from app.models.cliente import Cliente
from app.models.diagnostico import Diagnostico
from app.models.referral_link import ReferralLink
from app.models.perfil_cliente import PerfilCliente
from app.models.flujo_mensual import FlujoMensual
from app.models.patrimonio_financiero import PatrimonioFinanciero
from app.models.plan_retiro import PlanRetiro
from app.models.proteccion_patrimonial import ProteccionPatrimonial
from app.models.resultado_calculo import ResultadoCalculo
from app.core.database import Base

__all__ = [
    "Base",
    "Asesor",
    "Cliente",
    "Diagnostico",
    "ReferralLink",
    "PerfilCliente",
    "FlujoMensual",
    "PatrimonioFinanciero",
    "PlanRetiro",
    "ProteccionPatrimonial",
    "ResultadoCalculo",
]
