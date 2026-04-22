from fastapi import APIRouter
from app.api.v1 import auth, clientes, diagnosticos, health, voz, cliente_readonly, referral, admin, crm

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(clientes.router)
api_router.include_router(diagnosticos.router)
api_router.include_router(health.router)
api_router.include_router(voz.router)
api_router.include_router(cliente_readonly.router)
api_router.include_router(referral.router)
api_router.include_router(admin.router)
api_router.include_router(crm.router)
