"use client";

import { calcularMotorA } from "@/lib/motors/motor-a";
import { formatMXN } from "@/lib/format-currency";

interface Props {
  motorA: ReturnType<typeof calcularMotorA>;
  flujoMensual: { rentas: number; otros: number };
  patrimonio: { inmuebles_renta: number; negocio: number };
}

export function FlujoDisponibleSection({ motorA, flujoMensual, patrimonio }: Props) {
  const ingresos = motorA.ingresos_totales;
  const gastos = motorA.gastos_totales;
  const remanente = motorA.remanente;
  const gastosPct = ingresos > 0 ? Math.round((gastos / ingresos) * 100) : 0;
  const remanentePct = ingresos > 0 ? Math.round((remanente / ingresos) * 100) : 0;

  const dispActividadPrincipal = remanente - flujoMensual.rentas - flujoMensual.otros;
  const dispOtros = flujoMensual.rentas + flujoMensual.otros;
  const dispPrincipalPct = ingresos > 0 ? Math.round((dispActividadPrincipal / ingresos) * 100) : 0;
  const dispOtrosPct = ingresos > 0 ? Math.round((dispOtros / ingresos) * 100) : 0;

  // Rentabilidad
  const rentRentas = patrimonio.inmuebles_renta > 0
    ? ((flujoMensual.rentas * 12) / patrimonio.inmuebles_renta * 100).toFixed(1)
    : null;
  const rentNegocio = patrimonio.negocio > 0
    ? ((flujoMensual.otros * 12) / patrimonio.negocio * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      {/* Income statement */}
      <div className="bg-[#162236] rounded-xl border border-[#243555] overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-[#243555]">
          <span className="text-sm font-semibold text-white">Ingresos Totales</span>
          <span className="text-lg font-bold text-[#C9A96E]">{formatMXN(ingresos)}</span>
        </div>
        <div className="flex justify-between items-center px-5 py-4 border-b border-[#243555] bg-red-900/10">
          <div>
            <span className="text-sm font-semibold text-red-400">Gastos Totales</span>
            <span className="ml-2 text-xs text-red-400/60">({gastosPct}%)</span>
          </div>
          <span className="text-lg font-bold text-red-400">-{formatMXN(gastos)}</span>
        </div>
        <div className="flex justify-between items-center px-5 py-4 bg-green-900/10">
          <div>
            <span className="text-sm font-semibold text-green-400">Ingreso disponible para inversión</span>
            <span className="ml-2 text-xs text-green-400/60">({remanentePct}%)</span>
          </div>
          <span className="text-lg font-bold text-green-400">{formatMXN(remanente)}</span>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#162236] rounded-xl p-4 border border-[#243555]">
          <p className="text-xs text-[#8899BB] mb-1">Disponible — Actividad Principal</p>
          <p className="text-xs text-[#4A5A75] mb-2">({dispPrincipalPct}% de ingresos)</p>
          <p className="text-xl font-bold text-white">{formatMXN(Math.max(0, dispActividadPrincipal))}</p>
        </div>
        <div className="bg-[#162236] rounded-xl p-4 border border-[#243555]">
          <p className="text-xs text-[#8899BB] mb-1">Disponible — Otros Ingresos</p>
          <p className="text-xs text-[#4A5A75] mb-2">({dispOtrosPct}% de ingresos)</p>
          <p className="text-xl font-bold text-white">{formatMXN(dispOtros)}</p>
        </div>
      </div>

      {/* Fuentes con rentabilidad */}
      {(flujoMensual.rentas > 0 || flujoMensual.otros > 0) && (
        <div className="bg-[#162236] rounded-xl border border-[#243555] overflow-hidden">
          <div className="bg-[#0F1E36] px-4 py-2 border-b border-[#243555]">
            <p className="text-xs font-bold text-[#C9A96E] uppercase tracking-widest">Fuentes de Flujo Disponible con Rentabilidad</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#243555]">
                <th className="text-left px-4 py-2 text-xs text-[#8899BB]">Fuente</th>
                <th className="text-right px-4 py-2 text-xs text-[#8899BB]">Monto Mensual</th>
                <th className="text-right px-4 py-2 text-xs text-[#8899BB]">Rentabilidad Anual</th>
              </tr>
            </thead>
            <tbody>
              {flujoMensual.rentas > 0 && (
                <tr className="border-b border-[#243555]">
                  <td className="px-4 py-3 text-white">Ingresos por Rentas</td>
                  <td className="px-4 py-3 text-right text-[#C9A96E] font-semibold">{formatMXN(flujoMensual.rentas)}</td>
                  <td className="px-4 py-3 text-right text-white">{rentRentas ? `${rentRentas}%` : "—"}</td>
                </tr>
              )}
              {flujoMensual.otros > 0 && (
                <tr>
                  <td className="px-4 py-3 text-white">Ingresos por Negocios</td>
                  <td className="px-4 py-3 text-right text-[#C9A96E] font-semibold">{formatMXN(flujoMensual.otros)}</td>
                  <td className="px-4 py-3 text-right text-white">{rentNegocio ? `${rentNegocio}%` : "—"}</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-[#0F1E36] border-t border-[#243555]">
            <p className="text-xs text-[#4A5A75]">* Rentabilidad anual sobre activos productivos correspondientes</p>
          </div>
        </div>
      )}

      {/* Motivational banner */}
      <div className="bg-[#0F1E36] rounded-xl p-4 border border-[#243555]">
        <p className="text-xs text-[#8899BB] text-center">
          El flujo disponible es el motor de tu crecimiento patrimonial.
          Invertir consistentemente el excedente acelera la acumulación de riqueza a largo plazo.
        </p>
      </div>
    </div>
  );
}
