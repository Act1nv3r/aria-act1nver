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
from app.services.pdf_generator import render_pdf_html, html_to_pdf
from app.services.wrapped_generator import generate_wrapped_images
from app.api.v1.cliente_readonly import create_share_token
from app.models.referral_link import ReferralLink

import secrets
from pathlib import Path
import tempfile

router = APIRouter(prefix="/diagnosticos", tags=["diagnosticos"])


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
    return StepResponse(data=data.model_dump(mode="json"), outputs=None)


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
    return StepResponse(data=data.model_dump(mode="json"), outputs=None)


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
    return StepResponse(data=data.model_dump(mode="json"), outputs=None)


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
    await db.flush()
    if diag.referral_code_used:
        await db.execute(
            update(ReferralLink)
            .where(ReferralLink.referral_code == diag.referral_code_used)
            .values(conversiones=ReferralLink.conversiones + 1)
        )
    return StepResponse(data=data.model_dump(), outputs=None)


@router.get("/{id}/pdf/{tipo}")
async def get_diagnostico_pdf(
    id: str,
    tipo: str,
    db: AsyncSession = Depends(get_db),
    current_user: Asesor = Depends(get_current_user),
):
    """GET /api/v1/diagnosticos/{id}/pdf/{tipo} - tipo: patrimonio|balance|recomendaciones"""
    if tipo not in ("patrimonio", "balance", "recomendaciones"):
        raise HTTPException(status_code=400, detail="tipo debe ser patrimonio, balance o recomendaciones")
    diag = await _get_diagnostico(db, id, current_user.id)
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnóstico no encontrado")
    nombre = diag.perfil.nombre if diag.perfil else "Cliente"
    data = {}
    if diag.patrimonio and tipo == "patrimonio":
        p = diag.patrimonio
        data["patrimonio"] = {
            "liquidez": float(p.liquidez), "inversiones": float(p.inversiones), "dotales": float(p.dotales),
            "afore": float(p.afore), "ppr": float(p.ppr), "casa": float(p.casa),
            "inmuebles_renta": float(p.inmuebles_renta), "negocio": float(p.negocio), "hipoteca": float(p.hipoteca),
        }
    try:
        html = render_pdf_html(tipo, nombre, data)
        pdf_bytes = html_to_pdf(html)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=aria_{tipo}_{id[:8]}.pdf"})
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


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
    base_url = settings.cors_origins.split(",")[0].strip() if settings.cors_origins else "http://localhost:3000"
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
