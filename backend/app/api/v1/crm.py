"""
CRM API — Gestión del perfil acumulado del cliente, actividades y oportunidades.
Arquitectura estilo Salesforce: cada cliente tiene un perfil persistente que acumula
información de todos sus diagnósticos, llamadas y acciones del asesor.

Endpoints:
  GET    /crm/clientes/{clienteId}/perfil           — Perfil CRM completo
  PUT    /crm/clientes/{clienteId}/perfil           — Actualizar campos de contacto/notas/tags
  POST   /crm/clientes/{clienteId}/perfil/sync      — Sincronizar desde último diagnóstico

  GET    /crm/clientes/{clienteId}/actividades      — Timeline de actividades
  POST   /crm/clientes/{clienteId}/actividades      — Registrar nueva actividad

  GET    /crm/clientes/{clienteId}/oportunidades    — Listar oportunidades del cliente
  POST   /crm/clientes/{clienteId}/oportunidades    — Crear oportunidad manual
  PATCH  /crm/clientes/{clienteId}/oportunidades/{opId} — Actualizar estado/campos
  POST   /crm/clientes/{clienteId}/oportunidades/bulk  — Crear múltiples desde sesión
"""
from typing import Annotated, Optional
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.asesor import Asesor
from app.models.cliente import Cliente
from app.models.diagnostico import Diagnostico
from app.models.perfil_cliente import PerfilCliente
from app.models.flujo_mensual import FlujoMensual
from app.models.patrimonio_financiero import PatrimonioFinanciero
from app.models.proteccion_patrimonial import ProteccionPatrimonial
from app.models.perfil_acumulado import PerfilAcumulado
from app.models.actividad_cliente import ActividadCliente
from app.models.oportunidad_cliente import OportunidadCliente

router = APIRouter(prefix="/crm", tags=["crm"])

# ─────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────

class PerfilContactoUpdate(BaseModel):
    email: Optional[str] = None
    telefono: Optional[str] = None
    whatsapp: Optional[str] = None
    empresa: Optional[str] = None
    cargo: Optional[str] = None
    ciudad: Optional[str] = None
    notas_generales: Optional[str] = None
    tags: Optional[list[str]] = None


class ActividadCreate(BaseModel):
    tipo: str = Field(..., description="llamada|email|whatsapp|presencial|diagnostico|nota|tarea_completada|oportunidad_descartada")
    titulo: str
    descripcion: Optional[str] = None
    resultado: Optional[str] = None      # exitoso|sin_respuesta|reagendado|cancelado
    diagnostico_id: Optional[str] = None
    oportunidad_id: Optional[str] = None
    duracion_minutos: Optional[int] = None
    fecha_actividad: Optional[datetime] = None
    metadata_extra: Optional[dict] = None


class OportunidadCreate(BaseModel):
    tipo: str = Field(..., description="oportunidad|seguimiento")
    categoria: Optional[str] = None
    prioridad: str = "media"
    fuente: str = "manual"
    titulo: str
    descripcion: Optional[str] = None
    producto_sugerido: Optional[str] = None
    señal_detectada: Optional[str] = None
    contexto_seguimiento: Optional[str] = None
    accion_sugerida: Optional[str] = None
    confianza: Optional[float] = None
    diagnostico_id: Optional[str] = None
    valor_estimado_mxn: Optional[float] = None


class OportunidadBulkItem(BaseModel):
    """Un insight de sesión convertido a oportunidad persistente."""
    tipo: str
    categoria: Optional[str] = None
    prioridad: str = "media"
    fuente: str = "ai"
    titulo: str
    descripcion: Optional[str] = None
    producto_sugerido: Optional[str] = None
    señal_detectada: Optional[str] = None
    contexto_seguimiento: Optional[str] = None
    accion_sugerida: Optional[str] = None
    confianza: Optional[float] = None


class OportunidadEstadoUpdate(BaseModel):
    estado_tarea: str = Field(..., description="pendiente|en_proceso|completada|descartada")
    justificacion_descarte: Optional[str] = None
    nota: Optional[str] = None


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

async def _get_cliente_or_404(cliente_id: str, asesor: Asesor, db: AsyncSession) -> Cliente:
    """Verifica que el cliente existe y pertenece al asesor."""
    result = await db.execute(
        select(Cliente).where(Cliente.id == cliente_id, Cliente.asesor_id == asesor.id, Cliente.activo == True)
    )
    cliente = result.scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


async def _get_or_create_perfil(cliente_id: str, db: AsyncSession) -> PerfilAcumulado:
    """Devuelve el perfil acumulado, creándolo si no existe."""
    result = await db.execute(select(PerfilAcumulado).where(PerfilAcumulado.cliente_id == cliente_id))
    perfil = result.scalar_one_or_none()
    if not perfil:
        perfil = PerfilAcumulado(id=str(uuid4()), cliente_id=cliente_id)
        db.add(perfil)
        await db.flush()
    return perfil


def _calcular_salud_score(perfil: PerfilAcumulado) -> int:
    """Calcula el salud_score del cliente (0-100) basado en completitud y datos financieros."""
    score = 0
    # Contacto (30 pts)
    if perfil.email: score += 10
    if perfil.telefono or perfil.whatsapp: score += 10
    if perfil.empresa or perfil.ciudad: score += 10
    # Datos financieros (50 pts)
    if perfil.nombre: score += 10
    if perfil.grado_avance_retiro is not None:
        score += min(20, int((perfil.grado_avance_retiro or 0) / 5))  # max 20 pts al 100%
    if perfil.tiene_seguro_vida: score += 10
    if perfil.tiene_sgmm: score += 10
    # Actividad (20 pts)
    score += 20 if perfil.ultima_actualizacion_diagnostico else 0
    return min(100, score)


# ─────────────────────────────────────────────
# PERFIL ENDPOINTS
# ─────────────────────────────────────────────

@router.get("/clientes/{cliente_id}/perfil")
async def get_perfil(
    cliente_id: str,
    asesor: Annotated[Asesor, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Devuelve el perfil CRM completo del cliente."""
    await _get_cliente_or_404(cliente_id, asesor, db)
    perfil = await _get_or_create_perfil(cliente_id, db)
    await db.commit()
    return _perfil_to_dict(perfil)


@router.put("/clientes/{cliente_id}/perfil")
async def update_perfil(
    cliente_id: str,
    body: PerfilContactoUpdate,
    asesor: Annotated[Asesor, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Actualiza campos de contacto, notas y tags del perfil (entrada manual del asesor)."""
    await _get_cliente_or_404(cliente_id, asesor, db)
    perfil = await _get_or_create_perfil(cliente_id, db)

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(perfil, field, value)

    perfil.salud_score = _calcular_salud_score(perfil)
    await db.commit()
    await db.refresh(perfil)
    return _perfil_to_dict(perfil)


@router.post("/clientes/{cliente_id}/perfil/sync")
async def sync_perfil_from_diagnostico(
    cliente_id: str,
    asesor: Annotated[Asesor, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Sincroniza el perfil acumulado desde el diagnóstico más reciente del cliente.
    Se llama automáticamente al completar un diagnóstico, y también puede llamarse manualmente.
    """
    await _get_cliente_or_404(cliente_id, asesor, db)

    # Get most recent completed diagnostic
    diag_result = await db.execute(
        select(Diagnostico)
        .where(Diagnostico.cliente_id == cliente_id)
        .order_by(Diagnostico.created_at.desc())
        .limit(1)
    )
    diagnostico = diag_result.scalar_one_or_none()
    if not diagnostico:
        raise HTTPException(status_code=404, detail="El cliente no tiene diagnósticos")

    perfil = await _get_or_create_perfil(cliente_id, db)

    # Sync demographic data from PerfilCliente
    pc_result = await db.execute(
        select(PerfilCliente).where(PerfilCliente.diagnostico_id == diagnostico.id)
    )
    pc = pc_result.scalar_one_or_none()
    if pc:
        perfil.nombre = pc.nombre
        perfil.edad = pc.edad
        perfil.genero = pc.genero
        perfil.ocupacion = pc.ocupacion
        perfil.dependientes = pc.dependientes

    # Sync financial summary from FlujoMensual
    fm_result = await db.execute(
        select(FlujoMensual).where(FlujoMensual.diagnostico_id == diagnostico.id)
    )
    fm = fm_result.scalar_one_or_none()
    if fm:
        perfil.ahorro_mensual = fm.ahorro

    # Sync patrimonio
    pat_result = await db.execute(
        select(PatrimonioFinanciero).where(PatrimonioFinanciero.diagnostico_id == diagnostico.id)
    )
    pat = pat_result.scalar_one_or_none()
    if pat:
        financiero = (pat.liquidez or 0) + (pat.inversiones or 0) + (pat.dotales or 0) + (pat.afore or 0) + (pat.ppr or 0)
        no_financiero = (pat.casa or 0) + (pat.inmuebles_renta or 0) + (pat.tierra or 0) + (pat.negocio or 0)
        deuda = (pat.hipoteca or 0) + (pat.saldo_planes or 0) + (pat.compromisos or 0)
        perfil.patrimonio_total = financiero + no_financiero - deuda
        perfil.liquidez_total = pat.liquidez or 0

    # Sync proteccion
    prot_result = await db.execute(
        select(ProteccionPatrimonial).where(ProteccionPatrimonial.diagnostico_id == diagnostico.id)
    )
    prot = prot_result.scalar_one_or_none()
    if prot:
        perfil.tiene_seguro_vida = prot.seguro_vida
        perfil.tiene_sgmm = prot.sgmm

    # Update reference
    perfil.ultimo_diagnostico_id = diagnostico.id
    perfil.ultima_actualizacion_diagnostico = datetime.now(timezone.utc)
    perfil.salud_score = _calcular_salud_score(perfil)

    await db.commit()
    await db.refresh(perfil)
    return _perfil_to_dict(perfil)


# ─────────────────────────────────────────────
# ACTIVIDADES ENDPOINTS
# ─────────────────────────────────────────────

@router.get("/clientes/{cliente_id}/actividades")
async def get_actividades(
    cliente_id: str,
    asesor: Annotated[Asesor, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 50,
):
    """Timeline de actividades del cliente (llamadas, emails, sesiones, notas)."""
    await _get_cliente_or_404(cliente_id, asesor, db)
    result = await db.execute(
        select(ActividadCliente)
        .where(ActividadCliente.cliente_id == cliente_id)
        .order_by(ActividadCliente.fecha_actividad.desc())
        .limit(limit)
    )
    actividades = result.scalars().all()
    return [_actividad_to_dict(a) for a in actividades]


@router.post("/clientes/{cliente_id}/actividades", status_code=status.HTTP_201_CREATED)
async def create_actividad(
    cliente_id: str,
    body: ActividadCreate,
    asesor: Annotated[Asesor, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Registra una nueva actividad (llamada, email, WhatsApp, nota, etc.)."""
    await _get_cliente_or_404(cliente_id, asesor, db)

    actividad = ActividadCliente(
        id=str(uuid4()),
        cliente_id=cliente_id,
        asesor_id=asesor.id,
        tipo=body.tipo,
        titulo=body.titulo,
        descripcion=body.descripcion,
        resultado=body.resultado,
        diagnostico_id=body.diagnostico_id,
        oportunidad_id=body.oportunidad_id,
        duracion_minutos=body.duracion_minutos,
        fecha_actividad=body.fecha_actividad or datetime.now(timezone.utc),
        metadata_extra=body.metadata_extra,
    )
    db.add(actividad)
    await db.commit()
    await db.refresh(actividad)
    return _actividad_to_dict(actividad)


# ─────────────────────────────────────────────
# OPORTUNIDADES ENDPOINTS
# ─────────────────────────────────────────────

@router.get("/clientes/{cliente_id}/oportunidades")
async def get_oportunidades(
    cliente_id: str,
    asesor: Annotated[Asesor, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    estado: Optional[str] = None,
):
    """Lista todas las oportunidades del cliente, opcionalmente filtradas por estado."""
    await _get_cliente_or_404(cliente_id, asesor, db)
    query = select(OportunidadCliente).where(OportunidadCliente.cliente_id == cliente_id)
    if estado:
        query = query.where(OportunidadCliente.estado_tarea == estado)
    query = query.order_by(OportunidadCliente.created_at.desc())
    result = await db.execute(query)
    ops = result.scalars().all()
    return [_oportunidad_to_dict(o) for o in ops]


@router.post("/clientes/{cliente_id}/oportunidades", status_code=status.HTTP_201_CREATED)
async def create_oportunidad(
    cliente_id: str,
    body: OportunidadCreate,
    asesor: Annotated[Asesor, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Crea una oportunidad manualmente."""
    await _get_cliente_or_404(cliente_id, asesor, db)
    op = OportunidadCliente(
        id=str(uuid4()),
        cliente_id=cliente_id,
        asesor_id=asesor.id,
        tipo=body.tipo,
        categoria=body.categoria,
        prioridad=body.prioridad,
        fuente=body.fuente,
        titulo=body.titulo,
        descripcion=body.descripcion,
        producto_sugerido=body.producto_sugerido,
        señal_detectada=body.señal_detectada,
        contexto_seguimiento=body.contexto_seguimiento,
        accion_sugerida=body.accion_sugerida,
        confianza=body.confianza,
        diagnostico_id=body.diagnostico_id,
        valor_estimado_mxn=body.valor_estimado_mxn,
        estado_tarea="pendiente",
        historial_estados=[{"estado": "pendiente", "fecha": datetime.now(timezone.utc).isoformat()}],
    )
    db.add(op)
    await db.commit()
    await db.refresh(op)
    return _oportunidad_to_dict(op)


@router.post("/clientes/{cliente_id}/oportunidades/bulk", status_code=status.HTTP_201_CREATED)
async def bulk_create_oportunidades(
    cliente_id: str,
    body: list[OportunidadBulkItem],
    diagnostico_id: Optional[str] = None,
    asesor: Annotated[Asesor, Depends(get_current_user)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
):
    """
    Guarda múltiples oportunidades desde una sesión de diagnóstico.
    Idempotente: si ya existe una oportunidad activa (no descartada) con el mismo
    título para este cliente, la omite para evitar duplicados entre sesiones.
    """
    await _get_cliente_or_404(cliente_id, asesor, db)

    # Fetch existing active opportunity titles for this client (case-insensitive)
    existing_result = await db.execute(
        select(OportunidadCliente.titulo).where(
            OportunidadCliente.cliente_id == cliente_id,
            OportunidadCliente.estado_tarea != "descartada",
        )
    )
    existing_titles = {row[0].strip().lower() for row in existing_result.fetchall() if row[0]}

    created = []
    now_iso = datetime.now(timezone.utc).isoformat()
    for item in body:
        # Skip if an active opportunity with the same title already exists
        if item.titulo.strip().lower() in existing_titles:
            continue
        op = OportunidadCliente(
            id=str(uuid4()),
            cliente_id=cliente_id,
            asesor_id=asesor.id,
            tipo=item.tipo,
            categoria=item.categoria,
            prioridad=item.prioridad,
            fuente=item.fuente,
            titulo=item.titulo,
            descripcion=item.descripcion,
            producto_sugerido=item.producto_sugerido,
            señal_detectada=item.señal_detectada,
            contexto_seguimiento=item.contexto_seguimiento,
            accion_sugerida=item.accion_sugerida,
            confianza=item.confianza,
            diagnostico_id=diagnostico_id,
            estado_tarea="pendiente",
            historial_estados=[{"estado": "pendiente", "fecha": now_iso}],
        )
        db.add(op)
        created.append(op)
        existing_titles.add(item.titulo.strip().lower())  # prevent same-batch dupes
    await db.commit()
    return {"created": len(created)}


@router.patch("/clientes/{cliente_id}/oportunidades/{op_id}")
async def update_oportunidad_estado(
    cliente_id: str,
    op_id: str,
    body: OportunidadEstadoUpdate,
    asesor: Annotated[Asesor, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Actualiza el estado de una oportunidad.
    Si se descarta, requiere justificacion_descarte.
    Registra automáticamente la actividad correspondiente.
    """
    await _get_cliente_or_404(cliente_id, asesor, db)

    result = await db.execute(
        select(OportunidadCliente).where(OportunidadCliente.id == op_id, OportunidadCliente.cliente_id == cliente_id)
    )
    op = result.scalar_one_or_none()
    if not op:
        raise HTTPException(status_code=404, detail="Oportunidad no encontrada")

    if body.estado_tarea == "descartada" and not body.justificacion_descarte:
        raise HTTPException(status_code=400, detail="Se requiere justificacion_descarte al descartar")

    now = datetime.now(timezone.utc)
    historial = op.historial_estados or []
    historial.append({
        "estado": body.estado_tarea,
        "fecha": now.isoformat(),
        "nota": body.nota or body.justificacion_descarte,
    })

    op.estado_tarea = body.estado_tarea
    op.historial_estados = historial
    if body.justificacion_descarte:
        op.justificacion_descarte = body.justificacion_descarte
    if body.estado_tarea in ("completada", "descartada"):
        op.fecha_completada = now
    if body.estado_tarea == "en_proceso" and not op.fecha_inicio_proceso:
        op.fecha_inicio_proceso = now

    # Auto-log activity
    tipo_actividad = "oportunidad_descartada" if body.estado_tarea == "descartada" else "tarea_completada"
    titulo_act = f"Oportunidad {body.estado_tarea}: {op.titulo[:80]}"
    actividad = ActividadCliente(
        id=str(uuid4()),
        cliente_id=cliente_id,
        asesor_id=asesor.id,
        tipo=tipo_actividad,
        titulo=titulo_act,
        descripcion=body.justificacion_descarte or body.nota,
        resultado="exitoso" if body.estado_tarea == "completada" else "cancelado",
        oportunidad_id=op_id,
        fecha_actividad=now,
    )
    db.add(actividad)

    await db.commit()
    await db.refresh(op)
    return _oportunidad_to_dict(op)


# ─────────────────────────────────────────────
# Serializers
# ─────────────────────────────────────────────

def _perfil_to_dict(p: PerfilAcumulado) -> dict:
    return {
        "id": p.id,
        "cliente_id": p.cliente_id,
        "nombre": p.nombre,
        "edad": p.edad,
        "genero": p.genero,
        "ocupacion": p.ocupacion,
        "dependientes": p.dependientes,
        "email": p.email,
        "telefono": p.telefono,
        "whatsapp": p.whatsapp,
        "empresa": p.empresa,
        "cargo": p.cargo,
        "ciudad": p.ciudad,
        "patrimonio_total": float(p.patrimonio_total) if p.patrimonio_total else None,
        "liquidez_total": float(p.liquidez_total) if p.liquidez_total else None,
        "ahorro_mensual": float(p.ahorro_mensual) if p.ahorro_mensual else None,
        "nivel_riqueza": p.nivel_riqueza,
        "grado_avance_retiro": float(p.grado_avance_retiro) if p.grado_avance_retiro else None,
        "tiene_seguro_vida": p.tiene_seguro_vida,
        "tiene_sgmm": p.tiene_sgmm,
        "tags": p.tags or [],
        "notas_generales": p.notas_generales,
        "salud_score": p.salud_score or 20,
        "ultimo_diagnostico_id": p.ultimo_diagnostico_id,
        "ultima_actualizacion_diagnostico": p.ultima_actualizacion_diagnostico.isoformat() if p.ultima_actualizacion_diagnostico else None,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


def _actividad_to_dict(a: ActividadCliente) -> dict:
    return {
        "id": a.id,
        "cliente_id": a.cliente_id,
        "asesor_id": a.asesor_id,
        "tipo": a.tipo,
        "titulo": a.titulo,
        "descripcion": a.descripcion,
        "resultado": a.resultado,
        "diagnostico_id": a.diagnostico_id,
        "oportunidad_id": a.oportunidad_id,
        "duracion_minutos": a.duracion_minutos,
        "fecha_actividad": a.fecha_actividad.isoformat() if a.fecha_actividad else None,
        "metadata_extra": a.metadata_extra,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


def _oportunidad_to_dict(o: OportunidadCliente) -> dict:
    return {
        "id": o.id,
        "cliente_id": o.cliente_id,
        "asesor_id": o.asesor_id,
        "diagnostico_id": o.diagnostico_id,
        "tipo": o.tipo,
        "categoria": o.categoria,
        "prioridad": o.prioridad,
        "fuente": o.fuente,
        "titulo": o.titulo,
        "descripcion": o.descripcion,
        "producto_sugerido": o.producto_sugerido,
        "señal_detectada": o.señal_detectada,
        "contexto_seguimiento": o.contexto_seguimiento,
        "accion_sugerida": o.accion_sugerida,
        "confianza": float(o.confianza) if o.confianza else None,
        "estado_tarea": o.estado_tarea,
        "justificacion_descarte": o.justificacion_descarte,
        "fecha_objetivo": o.fecha_objetivo.isoformat() if o.fecha_objetivo else None,
        "fecha_inicio_proceso": o.fecha_inicio_proceso.isoformat() if o.fecha_inicio_proceso else None,
        "fecha_completada": o.fecha_completada.isoformat() if o.fecha_completada else None,
        "historial_estados": o.historial_estados or [],
        "valor_estimado_mxn": float(o.valor_estimado_mxn) if o.valor_estimado_mxn else None,
        "created_at": o.created_at.isoformat() if o.created_at else None,
        "updated_at": o.updated_at.isoformat() if o.updated_at else None,
    }
