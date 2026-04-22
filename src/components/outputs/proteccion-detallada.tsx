"use client";

import { calcularMotorE } from "@/lib/motors/motor-e";
import { calcularMotorF } from "@/lib/motors/motor-f";
import { calcularMotorA } from "@/lib/motors/motor-a";
import { formatMXN } from "@/lib/format-currency";

interface Props {
  motorE: ReturnType<typeof calcularMotorE>;
  motorF: ReturnType<typeof calcularMotorF>;
  motorA: ReturnType<typeof calcularMotorA>;
  proteccion: { seguro_vida: boolean | null; propiedades_aseguradas: boolean | null; sgmm: boolean | null };
  patrimonio: { casa: number; inmuebles_renta: number };
}

function WarningBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-900/30 text-red-400 border border-red-600/30">
      ⚠ Sin cobertura
    </span>
  );
}

function OkBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-900/30 text-green-400 border border-green-600/30">
      ✓ Cubierto
    </span>
  );
}

export function ProteccionDetallada({ motorE, motorF, motorA, proteccion, patrimonio }: Props) {
  const tieneVida = !!proteccion.seguro_vida;
  const tienePropAseg = !!proteccion.propiedades_aseguradas;
  const tieneSGMM = !!proteccion.sgmm;

  const sumaAseguradaVida = motorF.suma_asegurada_vida ?? 0;
  const costoPrimaVida = motorF.costo_prima_vida ?? 0;
  const costoHogarCasa = patrimonio.casa * 0.003;
  const costoHogarRenta = patrimonio.inmuebles_renta * 0.003;

  // Impacto en balance — si pierde inmuebles sin asegurar
  const afectacionPatrimonio = (!tienePropAseg)
    ? patrimonio.casa + patrimonio.inmuebles_renta
    : 0;
  const patrimonioNeto = motorE.patrimonio_neto;
  const patrimonioNeto_resultante = patrimonioNeto - afectacionPatrimonio;
  const solvenciaActual = motorE.activos_total > 0
    ? ((1 - motorE.pasivos_total / motorE.activos_total) * 100).toFixed(0)
    : "0";
  const activosResultantes = motorE.activos_total - afectacionPatrimonio;
  const solvenciaResultante = activosResultantes > 0
    ? ((1 - motorE.pasivos_total / activosResultantes) * 100).toFixed(0)
    : "0";

  // Impacto en flujo — ingresos pasivos en riesgo si no hay cobertura arrendador
  const ingresoEnRiesgo = !tienePropAseg && patrimonio.inmuebles_renta > 0 ? motorA.remanente : 0;

  return (
    <div className="space-y-5">
      {/* Seguro de Vida */}
      <div className={`rounded-xl p-5 border ${tieneVida ? "bg-[#162236] border-[#243555]" : "bg-red-900/10 border-red-600/30"}`}>
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-bold text-white">Seguro de Vida</p>
          {tieneVida ? <OkBadge /> : <WarningBadge />}
        </div>
        <p className="text-xs text-[#8899BB] mb-3">
          Protege a tus dependientes con una suma que cubra al menos 3 años de gastos básicos.
        </p>
        {sumaAseguradaVida > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0F1E36] rounded-lg p-3">
              <p className="text-xs text-[#4A5A75]">Suma asegurada sugerida</p>
              <p className="text-base font-bold text-[#C9A96E]">{formatMXN(sumaAseguradaVida)}</p>
            </div>
            <div className="bg-[#0F1E36] rounded-lg p-3">
              <p className="text-xs text-[#4A5A75]">Costo prima anual estimado</p>
              <p className="text-base font-bold text-white">{formatMXN(costoPrimaVida)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Seguro Propietario */}
      {patrimonio.casa > 0 && (
        <div className={`rounded-xl p-5 border ${tienePropAseg ? "bg-[#162236] border-[#243555]" : "bg-yellow-900/10 border-yellow-600/30"}`}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-bold text-white">Seguro Propietario — Casa Propia</p>
            {tienePropAseg ? <OkBadge /> : <WarningBadge />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0F1E36] rounded-lg p-3">
              <p className="text-xs text-[#4A5A75]">Suma a asegurar</p>
              <p className="text-base font-bold text-[#C9A96E]">{formatMXN(patrimonio.casa)}</p>
            </div>
            <div className="bg-[#0F1E36] rounded-lg p-3">
              <p className="text-xs text-[#4A5A75]">Costo anual estimado (0.3%)</p>
              <p className="text-base font-bold text-white">{formatMXN(costoHogarCasa)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Seguro Arrendador */}
      {patrimonio.inmuebles_renta > 0 && (
        <div className={`rounded-xl p-5 border ${tienePropAseg ? "bg-[#162236] border-[#243555]" : "bg-yellow-900/10 border-yellow-600/30"}`}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-bold text-white">Seguro Arrendador — Inmuebles en Renta</p>
            {tienePropAseg ? <OkBadge /> : <WarningBadge />}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0F1E36] rounded-lg p-3">
              <p className="text-xs text-[#4A5A75]">Suma a asegurar</p>
              <p className="text-base font-bold text-[#C9A96E]">{formatMXN(patrimonio.inmuebles_renta)}</p>
            </div>
            <div className="bg-[#0F1E36] rounded-lg p-3">
              <p className="text-xs text-[#4A5A75]">Costo anual estimado (0.3%)</p>
              <p className="text-base font-bold text-white">{formatMXN(costoHogarRenta)}</p>
            </div>
          </div>
        </div>
      )}

      {/* SGMM */}
      {!tieneSGMM && (
        <div className="bg-yellow-900/10 rounded-xl p-5 border border-yellow-600/30">
          <div className="flex justify-between items-center">
            <p className="text-sm font-bold text-white">Seguro Gastos Médicos Mayores (SGMM)</p>
            <WarningBadge />
          </div>
          <p className="text-xs text-[#8899BB] mt-2">Sin SGMM, un evento médico mayor puede comprometer severamente tu patrimonio.</p>
        </div>
      )}

      {/* Impacto en Balance */}
      {afectacionPatrimonio > 0 && (
        <div className="bg-[#162236] rounded-xl border border-[#243555] overflow-hidden">
          <div className="bg-[#0F1E36] px-5 py-3 border-b border-[#243555]">
            <p className="text-xs font-bold text-[#C9A96E] uppercase tracking-widest">Impacto en tu Balance sin Protección</p>
          </div>
          <div className="grid grid-cols-3 gap-0 divide-x divide-[#243555]">
            <div className="p-4 text-center">
              <p className="text-xs text-[#8899BB] mb-1">Patrimonio Neto Actual</p>
              <p className="text-base font-bold text-white">{formatMXN(patrimonioNeto)}</p>
              <p className="text-xs text-[#4A5A75]">Solvencia {solvenciaActual}%</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-[#8899BB] mb-1">Afectación sin seguro</p>
              <p className="text-base font-bold text-red-400">-{formatMXN(afectacionPatrimonio)}</p>
              <p className="text-xs text-[#4A5A75]">Activos sin asegurar</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-[#8899BB] mb-1">Patrimonio Resultante</p>
              <p className={`text-base font-bold ${patrimonioNeto_resultante >= 0 ? "text-yellow-400" : "text-red-400"}`}>
                {formatMXN(patrimonioNeto_resultante)}
              </p>
              <p className="text-xs text-[#4A5A75]">Solvencia {solvenciaResultante}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Impacto en Flujo */}
      {ingresoEnRiesgo > 0 && (
        <div className="bg-[#162236] rounded-xl border border-[#243555] overflow-hidden">
          <div className="bg-[#0F1E36] px-5 py-3 border-b border-[#243555]">
            <p className="text-xs font-bold text-[#C9A96E] uppercase tracking-widest">Impacto en tu Flujo de Efectivo</p>
          </div>
          <div className="grid grid-cols-3 gap-0 divide-x divide-[#243555] text-center">
            <div className="p-4">
              <p className="text-xs text-[#8899BB] mb-1">Ingresos Disponibles</p>
              <p className="text-base font-bold text-white">{formatMXN(motorA.remanente)}</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-[#8899BB] mb-1">Resultante si pierde rentas</p>
              <p className="text-base font-bold text-red-400">$0</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-[#8899BB] mb-1">Impacto</p>
              <p className="text-base font-bold text-red-400">-100%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
