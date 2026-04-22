from uuid import uuid4
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import Response, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.config import settings
from app.core.deps import get_current_user
from app.models.asesor import Asesor
from app.models.cliente import Cliente
from app.models.diagnostico import Diagnostico
from app.models.perfil_cliente import PerfilCliente
from app.models.flujo_mensual import FlujoMensual
from app.models.patrimonio_financiero import PatrimonioFinanciero
from app.models.plan_retiro import PlanRetiro
from app.models.proteccion_patrimonial import ProteccionPatrimonial
from app.models.resultado_calculo import ResultadoCalculo
from app.models.perfil_acumulado import PerfilAcumulado
from app.models.actividad_cliente import ActividadCliente
from app.schemas.diagnostico import (
    DiagnosticoCreate,
    PerfilInput,
    FlujoMensualInput,
    PatrimonioInput,
    RetiroInput,
    ObjetivosInput,
    ProteccionInput,
    StepResponse,
)
from app.services.motor_a import calcular_motor_a
from app.services.motor_b import calcular_motor_b
from app.services.motor_c import calcular_motor_c
from app.services.motor_d import calcular_motor_d
from app.services.motor_e import calcular_motor_e
from app.services.motor_f import calcular_motor_f
from app.services.pdf_generator import render_pdf_html, html_to_pdf
from app.services.wrapped_generator import generate_wrapped_images
from app.api.v1.cliente_readonly import create_share_token
from app.models.referral_link import ReferralLink

import secrets
from pathlib import Path
import tempfile

router = APIRouter(prefix="/diagnosticos", tags=["diagnosticos"])


async def _upsert_resultado(db: AsyncSession, diagnostico_id: str, motor: str, resultado: dict) -> None:
    """Insert or replace a ResultadoCalculo row for a given motor."""
    await db.execute(
        delete(ResultadoCalculo).where(
            ResultadoCalculo.diagnostico_id == diagnostico_id,
            ResultadoCalculo.motor == motor,
        )
    )
    rc = ResultadoCalculo(
        id=str(uuid4()),
        diagnostico_id=diagnostico_id,
        motor=motor,
        resultado=resultado,
    )
    db.add(rc)


def _build_wrapped_data(diag: Diagnostico) -> dict:
    """Build data dict for wrapped generator from diagnostico."""
    from app.services.motor_a import calcular_motor_a
    nombre = diag.perfil.nombre if diag.perfil else "Cliente"
    data = {"nombre": nombre, "nivel": "suficiente", "grado_avance": 0, "meses_reserva": 0, "ahorro_pct": "0", "objetivos_count": 0, "viables_count": 0}
    motor_a = motor_b = motor_c = motor_d = None
    for r in (diag.resultados or []):
        if r.motor == "A":
            motor_a = r.resultado
        elif r.motor == "B":
            motor_b = r.resultado
        elif r.motor == "C":
            motor_c = r.resultado
        elif r.motor == "D":
            motor_d = r.resultado
    if not motor_a and diag.flujo_mensual and diag.patrimonio:
        p = diag.patrimonio
        f = diag.flujo_mensual
        motor_a = calcular_motor_a(
            float(f.ahorro), float(f.rentas), float(f.otros),
            float(f.gastos_basicos), float(f.obligaciones), float(f.creditos),
            float(p.liquidez),
        )
    if motor_a:
        data["meses_reserva"] = motor_a.get("meses_cubiertos") or 0
        dist = motor_a.get("distribucion") or {}
        data["ahorro_pct"] = str(int((dist.get("ahorro_pct") or 0) * 100))
    if motor_b:
        data["nivel"] = motor_b.get("nivel_riqueza") or "suficiente"
    if motor_c:
        data["grado_avance"] = (motor_c.get("grado_avance") or 0) * 100
    if motor_d:
        res = motor_d.get("resultados") or []
        data["objetivos_count"] = len(res)
        data["viables_count"] = sum(1 for o in res if o.get("viable"))
    data["fecha"] = datetime.now().strftime("%d de %B de %Y")
    return data


async def _check_cliente_asesor(db: AsyncSession, cliente_id: str, asesor_id: str) -> Cliente | None:
    result = await db.execute(select(Cliente).where(Cliente.id == cliente_id, Cliente.asesor_id == asesor_id, Cliente.activo == True))
    return result.scalar_one_or_none()


async def _sync_perfil_acumulado(db: AsyncSession, diag: Diagnostico, asesor_id: str) -> None:
    """Upsert PerfilAcumulado for the client after a diagnostic is completed."""
    from uuid import uuid4 as _uuid4

    cliente_id = diag.cliente_id
    perfil = diag.perfil
    flujo = diag.flujo_mensual
    patrimonio = diag.patrimonio
    proteccion = diag.proteccion

    # Fetch or create PerfilAcumulado
    result = await db.execute(
        select(PerfilAcumulado).where(PerfilAcumulado.cliente_id == cliente_id)
    )
    pa = result.scalar_one_or_none()
    if pa is None:
        pa = PerfilAcumulado(
            id=str(_uuid4()),
            cliente_id=cliente_id,
        )
        db.add(pa)

    # --- Sync demographic data from PerfilCliente ---
    if perfil:
        pa.nombre = perfil.nombre or pa.nombre
        pa.edad = perfil.edad if perfil.edad else pa.edad
        pa.genero = perfil.genero or pa.genero
        pa.ocupacion = perfil.ocupacion or pa.ocupacion
        pa.dependientes = perfil.dependientes if perfil.dependientes is not None else pa.dependientes

    # --- Sync financial summary from FlujoMensual ---
    if flujo:
        pa.ahorro_mensual = float(flujo.ahorro or 0)

    # --- Sync patrimonial data ---
    if patrimonio:
        pa.patrimonio_total = (
            float(patrimonio.liquidez or 0)
            + float(patrimonio.inversion or 0)
            + float(patrimonio.bienes_raices or 0)
            + float(patrimonio.afore or 0)
            + float(patrimonio.otros_activos or 0)
        )
        pa.liquidez_total = float(patrimonio.liquidez or 0)

    # --- Sync protection data ---
    if proteccion:
        pa.tiene_seguro_vida = proteccion.seguro_vida
        pa.tiene_sgmm = proteccion.sgmm

    # --- Update CRM metadata ---
    pa.ultimo_diagnostico_id = diag.id
    pa.ultima_actualizacion_diagnostico = datetime.now()

    await db.flush()

    # Log activity
    actividad = ActividadCliente(
        id=str(_uuid4()),
        cliente_id=cliente_id,
        asesor_id=asesor_id,
        tipo="diagnostico",
        titulo="Diagnóstico completado",
        descripcion=f"Diagnóstico #{diag.id[:8]} completado y perfil acumulado actualizado.",
        diagnostico_id=diag.id,
    )
    db.add(actividad)
    await db.commit()


async def _get_diagnostico(db: AsyncSession, id: str, asesor_id: str) -> Diagnostico | None:
    result = await db.execute(
        select(Diagnostico)
        .options(
            selectinload(Diagnostico.cliente),
            selectinload(Diagnostico.perfil),
            selectinload(Diagnostico.flujo_mensual),
            selectinload(Diagnostico.patrimonio),
            selectinload(Diagnostico.retiro),
            selectinload(Diagnostico.proteccion),
            selectinload(Diagnostico.resultados),
        )
        .where(Diagnostico.id == id)
    )
    diag = result.scalar_one_or_none()
    if not diag or diag.cliente.asesor_id != asesor_id:
        return None
    return diag


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_diagnostico(
    data: DiagnosticoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    cliente = await _check_cliente_asesor(db, data.cliente_id, current_user.id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    diag = Diagnostico(
        id=str(uuid4()),
        cliente_id=data.cliente_id,
        modo=data.modo,
        referral_code_used=data.referral_code,
    )
    db.add(diag)
    await db.flush()
    return {"id": diag.id, "cliente_id": diag.cliente_id, "estado": diag.estado, "paso_actual": diag.paso_actual}


@router.get("/{id}")
async def get_diagnostico(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    diag = await _get_diagnostico(db, id, current_user.id)
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnóstico no encontrado")
    out = {
        "id": diag.id,
        "cliente_id": diag.cliente_id,
        "modo": diag.modo,
        "estado": diag.estado,
        "paso_actual": diag.paso_actual,
    }
    if diag.perfil:
        out["perfil"] = {"nombre": diag.perfil.nombre, "edad": diag.perfil.edad, "genero": diag.perfil.genero, "ocupacion": diag.perfil.ocupacion, "dependientes": diag.perfil.dependientes}
    if diag.flujo_mensual:
        f = diag.flujo_mensual
        out["flujoMensual"] = {"ahorro": float(f.ahorro), "rentas": float(f.rentas), "otros": float(f.otros), "gastos_basicos": float(f.gastos_basicos), "obligaciones": float(f.obligaciones), "creditos": float(f.creditos)}
    if diag.patrimonio:
        p = diag.patrimonio
        out["patrimonio"] = {"liquidez": float(p.liquidez), "inversiones": float(p.inversiones), "dotales": float(p.dotales), "afore": float(p.afore), "ppr": float(p.ppr), "plan_privado": float(p.plan_privado), "seguros_retiro": float(p.seguros_retiro), "ley_73": float(p.ley_73) if p.ley_73 else None, "casa": float(p.casa), "inmuebles_renta": float(p.inmuebles_renta), "tierra": float(p.tierra), "negocio": float(p.negocio), "herencia": float(p.herencia), "hipoteca": float(p.hipoteca), "saldo_planes": float(p.saldo_planes), "compromisos": float(p.compromisos)}
    if diag.retiro:
        r = diag.retiro
        out["retiro"] = {"edad_retiro": r.edad_retiro, "mensualidad_deseada": float(r.mensualidad_deseada), "edad_defuncion": r.edad_defuncion}
    if diag.objetivos_json:
        out["objetivos"] = diag.objetivos_json
    if diag.proteccion:
        pr = diag.proteccion
        out["proteccion"] = {"seguro_vida": pr.seguro_vida, "propiedades_aseguradas": pr.propiedades_aseguradas, "sgmm": pr.sgmm}
    return out


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_diagnostico(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    diag = await _get_diagnostico(db, id, current_user.id)
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnóstico no encontrado")
    await db.execute(delete(ResultadoCalculo).where(ResultadoCalculo.diagnostico_id == id))
    await db.execute(delete(ReferralLink).where(ReferralLink.diagnostico_id == id))
    await db.execute(delete(PerfilCliente).where(PerfilCliente.diagnostico_id == id))
    await db.execute(delete(FlujoMensual).where(FlujoMensual.diagnostico_id == id))
    await db.execute(delete(PatrimonioFinanciero).where(PatrimonioFinanciero.diagnostico_id == id))
    await db.execute(delete(PlanRetiro).where(PlanRetiro.diagnostico_id == id))
    await db.execute(delete(ProteccionPatrimonial).where(ProteccionPatrimonial.diagnostico_id == id))
    await db.execute(delete(Diagnostico).where(Diagnostico.id == id))
    await db.flush()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{id}/perfil", response_model=StepResponse)
async def update_perfil(
    id: str,
    data: PerfilInput,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    diag = await _get_diagnostico(db, id, current_user.id)
    if not diag:
        raise HTTPException(status_code=404)
    if diag.perfil:
        diag.perfil.nombre = data.nombre
        diag.perfil.edad = data.edad
        diag.perfil.genero = data.genero
        diag.perfil.ocupacion = data.ocupacion
        diag.perfil.dependientes = data.dependientes
    else:
        perfil = PerfilCliente(diagnostico_id=id, nombre=data.nombre, edad=data.edad, genero=data.genero, ocupacion=data.ocupacion, dependientes=data.dependientes)
        db.add(perfil)
    diag.paso_actual = 1
    await db.flush()
    return StepResponse(data=data.model_dump(), outputs=None, condicionales={"ley73_visible": data.edad >= 46})


@router.put("/{id}/flujo-mensual", response_model=StepResponse)
async def update_flujo(
    id: str,
    data: FlujoMensualInput,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    diag = await _get_diagnostico(db, id, current_user.id)
    if not diag:
        raise HTTPException(status_code=404)
    liquidez = None
    if diag.patrimonio:
        liquidez = float(diag.patrimonio.liquidez)
    if diag.flujo_mensual:
        f = diag.flujo_mensual
        f.ahorro = data.ahorro
        f.rentas = data.rentas
        f.otros = data.otros
        f.gastos_basicos = data.gastos_basicos
        f.obligaciones = data.obligaciones
        f.creditos = data.creditos
    else:
        flujo = FlujoMensual(diagnostico_id=id, ahorro=data.ahorro, rentas=data.rentas, otros=data.otros, gastos_basicos=data.gastos_basicos, obligaciones=data.obligaciones, creditos=data.creditos)
        db.add(flujo)
    diag.paso_actual = 2
    await db.flush()
    output_a = calcular_motor_a(
        float(data.ahorro), float(data.rentas), float(data.otros),
        float(data.gastos_basicos), float(data.obligaciones), float(data.creditos),
        liquidez,
    )
    return StepResponse(data=data.model_dump(mode="json"), outputs={"motorA": output_a})


@router.put("/{id}/patrimonio", response_model=StepResponse)
async def update_patrimonio(
    id: str,
    data: PatrimonioInput,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    diag = await _get_diagnostico(db, id, current_user.id)
    if not diag:
        raise HTTPException(status_code=404)
    if diag.patrimonio:
        p = diag.patrimonio
        p.liquidez = data.liquidez
        p.inversiones = data.inversiones
        p.dotales = data.dotales
        p.afore = data.afore
        p.ppr = data.ppr
        p.plan_privado = data.plan_privado
        p.seguros_retiro = data.seguros_retiro
        p.ley_73 = data.ley_73
        p.casa = data.casa
        p.inmuebles_renta = data.inmuebles_renta
        p.tierra = data.tierra
        p.negocio = data.negocio
        p.herencia = data.herencia
        p.hipoteca = data.hipoteca
        p.saldo_planes = data.saldo_planes
        p.compromisos = data.compromisos
    else:
        patrimonio = PatrimonioFinanciero(
            diagnostico_id=id,
            liquidez=data.liquidez,
            inversiones=data.inversiones,
            dotales=data.dotales,
            afore=data.afore,
            ppr=data.ppr,
            plan_privado=data.plan_privado,
            seguros_retiro=data.seguros_retiro,
            ley_73=data.ley_73,
            casa=data.casa,
            inmuebles_renta=data.inmuebles_renta,
            tierra=data.tierra,
            negocio=data.negocio,
            herencia=data.herencia,
            hipoteca=data.hipoteca,
            saldo_planes=data.saldo_planes,
            compromisos=data.compromisos,
        )
        db.add(patrimonio)
    diag.paso_actual = 3
    await db.flush()

    # Motor B — nivel de riqueza
    edad = diag.perfil.edad if diag.perfil else 35
    gastos_basicos = float(diag.flujo_mensual.gastos_basicos) if diag.flujo_mensual else 0.0
    obligaciones = float(diag.flujo_mensual.obligaciones) if diag.flujo_mensual else 0.0
    creditos = float(diag.flujo_mensual.creditos) if diag.flujo_mensual else 0.0
    output_b = calcular_motor_b(
        float(data.liquidez), float(data.inversiones), float(data.dotales),
        float(data.afore), float(data.ppr), float(data.plan_privado), float(data.seguros_retiro),
        edad, gastos_basicos, obligaciones, creditos,
    )
    await _upsert_resultado(db, id, "B", output_b)

    # Motor E — patrimonio neto / solvencia
    output_e = calcular_motor_e(
        float(data.liquidez), float(data.inversiones), float(data.dotales),
        float(data.afore), float(data.ppr), float(data.plan_privado), float(data.seguros_retiro),
        float(data.casa), float(data.inmuebles_renta), float(data.tierra),
        float(data.negocio), float(data.herencia),
        float(data.hipoteca), float(data.saldo_planes), float(data.compromisos),
    )
    await _upsert_resultado(db, id, "E", output_e)
    await db.flush()
    return StepResponse(data=data.model_dump(mode="json"), outputs={"motorB": output_b, "motorE": output_e})


@router.put("/{id}/retiro", response_model=StepResponse)
async def update_retiro(
    id: str,
    data: RetiroInput,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    diag = await _get_diagnostico(db, id, current_user.id)
    if not diag:
        raise HTTPException(status_code=404)
    if diag.retiro:
        diag.retiro.edad_retiro = data.edad_retiro
        diag.retiro.mensualidad_deseada = data.mensualidad_deseada
        diag.retiro.edad_defuncion = data.edad_defuncion
    else:
        retiro = PlanRetiro(
            diagnostico_id=id,
            edad_retiro=data.edad_retiro,
            mensualidad_deseada=data.mensualidad_deseada,
            edad_defuncion=data.edad_defuncion,
        )
        db.add(retiro)
    diag.paso_actual = 4
    await db.flush()

    # Motor C — proyección de retiro
    output_c = None
    if diag.patrimonio and diag.perfil:
        p = diag.patrimonio
        perfil = diag.perfil
        patrimonio_financiero_total = (
            float(p.liquidez) + float(p.inversiones) + float(p.dotales) +
            float(p.afore) + float(p.ppr) + float(p.plan_privado) + float(p.seguros_retiro)
        )
        saldo_esquemas = float(p.afore) + float(p.ppr) + float(p.plan_privado) + float(p.seguros_retiro)
        rentas = float(diag.flujo_mensual.rentas) if diag.flujo_mensual else 0.0
        output_c = calcular_motor_c(
            patrimonio_financiero_total,
            saldo_esquemas,
            float(p.ley_73) if p.ley_73 is not None else None,
            rentas,
            perfil.edad,
            data.edad_retiro,
            data.edad_defuncion,
            float(data.mensualidad_deseada),
        )
        await _upsert_resultado(db, id, "C", output_c)
        await db.flush()
    return StepResponse(data=data.model_dump(mode="json"), outputs={"motorC": output_c} if output_c else None)


@router.put("/{id}/objetivos", response_model=StepResponse)
async def update_objetivos(
    id: str,
    data: ObjetivosInput,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    diag = await _get_diagnostico(db, id, current_user.id)
    if not diag:
        raise HTTPException(status_code=404)
    diag.objetivos_json = {
        "aportacion_inicial": float(data.aportacion_inicial),
        "aportacion_mensual": float(data.aportacion_mensual),
        "lista": [{"nombre": o.nombre, "monto": float(o.monto), "plazo": o.plazo} for o in data.lista],
    }
    diag.paso_actual = 5
    await db.flush()

    # Motor D — viabilidad de objetivos
    output_d = None
    if diag.patrimonio and diag.perfil and diag.retiro:
        p = diag.patrimonio
        patrimonio_financiero = (
            float(p.liquidez) + float(p.inversiones) + float(p.dotales) +
            float(p.afore) + float(p.ppr) + float(p.plan_privado) + float(p.seguros_retiro)
        )
        output_d = calcular_motor_d(
            float(data.aportacion_inicial),
            float(data.aportacion_mensual),
            [{"nombre": o.nombre, "monto": float(o.monto), "plazo": o.plazo} for o in data.lista],
            patrimonio_financiero,
            diag.perfil.edad,
            diag.retiro.edad_retiro,
            diag.retiro.edad_defuncion,
        )
        await _upsert_resultado(db, id, "D", output_d)
        await db.flush()
    return StepResponse(data=data.model_dump(mode="json"), outputs={"motorD": output_d} if output_d else None)


@router.put("/{id}/proteccion", response_model=StepResponse)
async def update_proteccion(
    id: str,
    data: ProteccionInput,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    diag = await _get_diagnostico(db, id, current_user.id)
    if not diag:
        raise HTTPException(status_code=404)
    if diag.proteccion:
        diag.proteccion.seguro_vida = data.seguro_vida
        diag.proteccion.propiedades_aseguradas = data.propiedades_aseguradas
        diag.proteccion.sgmm = data.sgmm
    else:
        proteccion = ProteccionPatrimonial(
            diagnostico_id=id,
            seguro_vida=data.seguro_vida,
            propiedades_aseguradas=data.propiedades_aseguradas,
            sgmm=data.sgmm,
        )
        db.add(proteccion)
    diag.paso_actual = 6
    diag.estado = "completo"
    diag.completed_at = datetime.now()
    await db.flush()

    # Motor F — protección patrimonial
    output_f = None
    if diag.patrimonio and diag.perfil:
        p = diag.patrimonio
        inmuebles_total = float(p.casa) + float(p.inmuebles_renta) + float(p.tierra)
        activos = (
            float(p.liquidez) + float(p.inversiones) + float(p.dotales) +
            float(p.afore) + float(p.ppr) + float(p.plan_privado) + float(p.seguros_retiro) +
            inmuebles_total + float(p.negocio) + float(p.herencia)
        )
        pasivos = float(p.hipoteca) + float(p.saldo_planes) + float(p.compromisos)
        patrimonio_neto = activos - pasivos
        output_f = calcular_motor_f(
            bool(data.seguro_vida),
            data.propiedades_aseguradas,
            bool(data.sgmm),
            bool(diag.perfil.dependientes),
            patrimonio_neto,
            inmuebles_total,
            diag.perfil.edad,
        )
        await _upsert_resultado(db, id, "F", output_f)
        await db.flush()

    if diag.referral_code_used:
        await db.execute(
            update(ReferralLink)
            .where(ReferralLink.referral_code == diag.referral_code_used)
            .values(conversiones=ReferralLink.conversiones + 1)
        )

    # Auto-sync perfil acumulado del cliente
    try:
        await _sync_perfil_acumulado(db, diag, current_user.id)
    except Exception:
        pass  # No bloquear la respuesta si el sync falla

    return StepResponse(data=data.model_dump(), outputs={"motorF": output_f} if output_f else None)


@router.get("/{id}/pdf/{tipo}")
async def get_diagnostico_pdf(
    id: str,
    tipo: str,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    """GET /api/v1/diagnosticos/{id}/pdf/{tipo}
    tipo: diagnostico | balance | patrimonio | recomendaciones
    """
    if tipo not in ("diagnostico", "balance", "patrimonio", "recomendaciones"):
        raise HTTPException(status_code=400, detail="tipo inválido")
    diag = await _get_diagnostico(db, id, current_user.id)
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnóstico no encontrado")

    nombre = diag.perfil.nombre if diag.perfil else "Cliente"
    data: dict = {}

    # Build motors data
    p = diag.patrimonio
    f = diag.flujo_mensual
    perfil = diag.perfil
    retiro = diag.retiro

    motor_a_out = motor_b_out = motor_c_out = motor_e_out = motor_f_out = None

    if f:
        liquidez_val = float(p.liquidez) if p else None
        motor_a_out = calcular_motor_a(
            float(f.ahorro), float(f.rentas), float(f.otros),
            float(f.gastos_basicos), float(f.obligaciones), float(f.creditos),
            liquidez_val,
        )

    if p:
        edad = perfil.edad if perfil else 35
        gastos_basicos = float(f.gastos_basicos) if f else 0.0
        obligaciones = float(f.obligaciones) if f else 0.0
        creditos = float(f.creditos) if f else 0.0
        motor_b_out = calcular_motor_b(
            float(p.liquidez), float(p.inversiones), float(p.dotales),
            float(p.afore), float(p.ppr), float(p.plan_privado), float(p.seguros_retiro),
            edad, gastos_basicos, obligaciones, creditos,
        )
        motor_e_out = calcular_motor_e(
            float(p.liquidez), float(p.inversiones), float(p.dotales),
            float(p.afore), float(p.ppr), float(p.plan_privado), float(p.seguros_retiro),
            float(p.casa), float(p.inmuebles_renta), float(p.tierra),
            float(p.negocio), float(p.herencia),
            float(p.hipoteca), float(p.saldo_planes), float(p.compromisos),
        )

    if p and perfil and retiro:
        patrimonio_financiero_total = (
            float(p.liquidez) + float(p.inversiones) + float(p.dotales) +
            float(p.afore) + float(p.ppr) + float(p.plan_privado) + float(p.seguros_retiro)
        )
        saldo_esquemas = float(p.afore) + float(p.ppr) + float(p.plan_privado) + float(p.seguros_retiro)
        rentas = float(f.rentas) if f else 0.0
        motor_c_out = calcular_motor_c(
            patrimonio_financiero_total, saldo_esquemas,
            float(p.ley_73) if p.ley_73 is not None else None,
            rentas, perfil.edad, retiro.edad_retiro,
            retiro.edad_defuncion, float(retiro.mensualidad_deseada),
        )

    if p and perfil and diag.proteccion:
        inmuebles_total = float(p.casa) + float(p.inmuebles_renta) + float(p.tierra)
        patrimonio_neto_val = motor_e_out["patrimonio_neto"] if motor_e_out else 0.0
        motor_f_out = calcular_motor_f(
            bool(diag.proteccion.seguro_vida),
            diag.proteccion.propiedades_aseguradas,
            bool(diag.proteccion.sgmm),
            bool(perfil.dependientes),
            patrimonio_neto_val,
            inmuebles_total,
            perfil.edad,
        )

    # Populate template data
    if motor_a_out:
        data["motor_a"] = motor_a_out
    if motor_b_out:
        data["motor_b"] = motor_b_out
    if motor_c_out:
        data["motor_c"] = motor_c_out
    if motor_e_out:
        data["motor_e"] = motor_e_out
    if motor_f_out:
        data["motor_f"] = motor_f_out
    if perfil:
        data["perfil"] = {
            "nombre": perfil.nombre, "edad": perfil.edad,
            "genero": perfil.genero, "ocupacion": perfil.ocupacion,
            "dependientes": perfil.dependientes,
        }
    if f:
        data["flujo"] = {
            "ahorro": float(f.ahorro), "rentas": float(f.rentas), "otros": float(f.otros),
            "gastos_basicos": float(f.gastos_basicos), "obligaciones": float(f.obligaciones),
            "creditos": float(f.creditos),
        }
    if p:
        data["patrimonio"] = {
            "liquidez": float(p.liquidez), "inversiones": float(p.inversiones),
            "dotales": float(p.dotales), "afore": float(p.afore),
            "ppr": float(p.ppr), "plan_privado": float(p.plan_privado),
            "seguros_retiro": float(p.seguros_retiro),
            "ley_73": float(p.ley_73) if p.ley_73 else None,
            "casa": float(p.casa), "inmuebles_renta": float(p.inmuebles_renta),
            "tierra": float(p.tierra), "negocio": float(p.negocio),
            "herencia": float(p.herencia), "hipoteca": float(p.hipoteca),
            "saldo_planes": float(p.saldo_planes), "compromisos": float(p.compromisos),
        }
    if retiro:
        data["retiro"] = {
            "edad_retiro": retiro.edad_retiro,
            "mensualidad_deseada": float(retiro.mensualidad_deseada),
            "edad_defuncion": retiro.edad_defuncion,
        }
    if diag.objetivos_json:
        data["objetivos"] = diag.objetivos_json
    if diag.proteccion:
        data["proteccion"] = {
            "seguro_vida": diag.proteccion.seguro_vida,
            "propiedades_aseguradas": diag.proteccion.propiedades_aseguradas,
            "sgmm": diag.proteccion.sgmm,
        }

    try:
        html = render_pdf_html(tipo, nombre, data)
        pdf_bytes = html_to_pdf(html)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=aria_{tipo}_{id[:8]}.pdf"},
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.put("/{id}/completar")
async def completar_diagnostico(
    id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    """
    Marca el diagnóstico como completado y persiste el snapshot de la sesión.

    Body (JSON, todos los campos opcionales):
      parametros_snapshot: dict con el estado completo de la sesión frontend
        (outputs, sesion_insights, criterios_trayectoria, pareja_*, datos_fuente,
         completitud_pct, sesion_duracion_minutos, etc.)
    """
    diag = await _get_diagnostico(db, id, current_user.id)
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnóstico no encontrado")

    body: dict = {}
    try:
        body = await request.json()
    except Exception:
        pass  # empty body is fine

    parametros_snapshot = body.get("parametros_snapshot") if body else None

    if diag.estado != "completo":
        diag.estado = "completo"
        diag.completed_at = datetime.now()

    if parametros_snapshot:
        diag.parametros_snapshot = parametros_snapshot

    await db.commit()
    return {"id": diag.id, "estado": diag.estado}


@router.post("/{id}/compartir")
async def compartir_diagnostico(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    """Genera token para vista cliente readonly. Expira en 30 días."""
    diag = await _get_diagnostico(db, id, current_user.id)
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnóstico no encontrado")
    token, expires_at = create_share_token(id, 30)
    base_url = settings.cors_origins.split(",")[0].strip() if settings.cors_origins else "http://localhost:3001"
    url = f"{base_url}/cliente/{token}"
    return {"url": url, "token": token, "expires_at": expires_at.isoformat()}


@router.post("/{id}/wrapped")
async def post_wrapped(
    id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    """Genera 7 PNGs server-side con Pillow. Response: [{tipo, imagen_url}]."""
    diag = await _get_diagnostico(db, id, current_user.id)
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnóstico no encontrado")
    data = _build_wrapped_data(diag)
    base_url = str(request.base_url).rstrip("/")
    result = generate_wrapped_images(data, base_url, id)
    return result


@router.get("/{id}/wrapped/{tipo}")
async def get_wrapped_image(
    id: str,
    tipo: str,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    """Sirve PNG de wrapped generado previamente. tipo: intro|nivel|retiro|reserva|ahorro|objetivos|cta"""
    if tipo not in ("intro", "nivel", "retiro", "reserva", "ahorro", "objetivos", "cta"):
        raise HTTPException(status_code=400, detail="tipo inválido")
    diag = await _get_diagnostico(db, id, current_user.id)
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnóstico no encontrado")
    tmpdir = Path(tempfile.gettempdir()) / "aria_wrapped"
    path = tmpdir / f"{id[:8]}_{tipo}.png"
    if not path.exists():
        data = _build_wrapped_data(diag)
        base_url = "http://localhost:8000"
        generate_wrapped_images(data, base_url, id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Imagen no generada")
    return FileResponse(path, media_type="image/png")


@router.post("/{id}/wrapped/share")
async def post_wrapped_share(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    """Genera referral_code para compartir wrapped. Persiste en referral_links."""
    diag = await _get_diagnostico(db, id, current_user.id)
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnóstico no encontrado")
    result = await db.execute(
        select(ReferralLink).where(ReferralLink.diagnostico_id == id)
    )
    existing = result.scalars().first()
    if existing:
        api_url = settings.api_base_url.rstrip("/")
        url = f"{api_url}/api/v1/referral/{existing.referral_code}"
        return {"referral_code": existing.referral_code, "referral_url": url}
    code = secrets.token_urlsafe(8)[:12].replace("-", "").replace("_", "").lower()
    link = ReferralLink(diagnostico_id=id, referral_code=code)
    db.add(link)
    await db.flush()
    api_url = settings.api_base_url.rstrip("/")
    url = f"{api_url}/api/v1/referral/{code}"
    return {"referral_code": code, "referral_url": url}
