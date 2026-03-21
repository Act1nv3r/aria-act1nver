from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.asesor import Asesor
from app.models.cliente import Cliente
from app.models.diagnostico import Diagnostico
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse, UltimoDiagnosticoSummary

router = APIRouter(prefix="/clientes", tags=["clientes"])


@router.get("", response_model=list[ClienteResponse])
async def list_clientes(
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
    search: str | None = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
):
    q = select(Cliente).where(Cliente.asesor_id == current_user.id, Cliente.activo == True)
    if search:
        q = q.where(Cliente.nombre_alias.ilike(f"%{search}%"))
    q = q.offset(offset).limit(limit).order_by(Cliente.updated_at.desc())
    result = await db.execute(q)
    clientes = list(result.scalars().all())
    if not clientes:
        return []
    cid_list = [c.id for c in clientes]
    diag_result = await db.execute(
        select(Diagnostico)
        .where(Diagnostico.cliente_id.in_(cid_list))
        .order_by(Diagnostico.created_at.desc())
    )
    latest_by_cliente: dict[str, Diagnostico] = {}
    for d in diag_result.scalars().all():
        if d.cliente_id not in latest_by_cliente:
            latest_by_cliente[d.cliente_id] = d
    out: list[ClienteResponse] = []
    for c in clientes:
        d = latest_by_cliente.get(c.id)
        ultimo = (
            UltimoDiagnosticoSummary(
                id=d.id,
                estado=d.estado,
                paso_actual=d.paso_actual,
                modo=d.modo,
                created_at=d.created_at,
            )
            if d
            else None
        )
        out.append(
            ClienteResponse(
                id=c.id,
                nombre_alias=c.nombre_alias,
                activo=c.activo,
                ultimo_diagnostico=ultimo,
            )
        )
    return out


@router.post("", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
async def create_cliente(
    data: ClienteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    cliente = Cliente(
        id=str(uuid4()),
        asesor_id=current_user.id,
        nombre_alias=data.nombre_alias,
    )
    db.add(cliente)
    await db.flush()
    await db.refresh(cliente)
    return cliente


@router.get("/{id}/diagnosticos")
async def list_diagnosticos_cliente(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    result = await db.execute(
        select(Cliente).where(Cliente.id == id, Cliente.asesor_id == current_user.id, Cliente.activo == True)
    )
    cliente = result.scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    diag_result = await db.execute(
        select(Diagnostico).where(Diagnostico.cliente_id == id).order_by(Diagnostico.created_at.desc()).limit(100)
    )
    diags = diag_result.scalars().all()
    return [
        {
            "id": d.id,
            "cliente_id": d.cliente_id,
            "estado": d.estado,
            "paso_actual": d.paso_actual,
            "modo": d.modo,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in diags
    ]


@router.get("/{id}", response_model=ClienteResponse)
async def get_cliente(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    result = await db.execute(
        select(Cliente).where(Cliente.id == id, Cliente.asesor_id == current_user.id, Cliente.activo == True)
    )
    cliente = result.scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    return cliente


@router.put("/{id}", response_model=ClienteResponse)
async def update_cliente(
    id: str,
    data: ClienteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    result = await db.execute(
        select(Cliente).where(Cliente.id == id, Cliente.asesor_id == current_user.id, Cliente.activo == True)
    )
    cliente = result.scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    if data.nombre_alias is not None:
        cliente.nombre_alias = data.nombre_alias
    await db.flush()
    await db.refresh(cliente)
    return cliente


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cliente(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    result = await db.execute(
        select(Cliente).where(Cliente.id == id, Cliente.asesor_id == current_user.id)
    )
    cliente = result.scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    cliente.activo = False
    await db.flush()
