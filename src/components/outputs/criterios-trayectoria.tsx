"use client";

import { CriteriosTrayectoria } from "@/stores/diagnostico-store";
import { formatMXN } from "@/lib/format-currency";

interface PatrimonioData {
  casa: number;
  inmuebles_renta: number;
  tierra: number;
  negocio: number;
  herencia: number;
}

interface FlujoData {
  rentas: number;
  otros: number;
}

interface Props {
  criterios: CriteriosTrayectoria;
  patrimonio: PatrimonioData;
  flujoMensual: FlujoData;
  aportacion_mensual: number;
}

interface Activo {
  key: "casa" | "tierra" | "inmuebles_renta" | "negocio";
  label: string;
  valor: number;
  flujo_perdido?: number;
}

export function CriteriosTrayectoriaSection({ criterios, patrimonio, flujoMensual, aportacion_mensual }: Props) {
  const activos: Activo[] = ([
    { key: "casa" as const, label: "Casa Propia", valor: patrimonio.casa },
    { key: "tierra" as const, label: "Tierra", valor: patrimonio.tierra },
    { key: "inmuebles_renta" as const, label: "Inmuebles en Renta", valor: patrimonio.inmuebles_renta, flujo_perdido: flujoMensual.rentas },
    { key: "negocio" as const, label: "Negocio", valor: patrimonio.negocio, flujo_perdido: flujoMensual.otros },
  ] as Activo[]).filter((a) => a.valor > 0);

  const herenciaEdad = criterios.herencia?.edad_recepcion;

  return (
    <div className="space-y-5">
      {/* Aportación */}
      <div className="bg-[#162236] rounded-xl p-5 border border-[#243555] flex justify-between items-center">
        <div>
          <p className="text-xs font-bold text-[#C9A96E] uppercase tracking-widest mb-1">Aportación Mensual</p>
          <p className="text-xs text-[#8899BB]">Aportación mensual destinada a inversión / retiro</p>
        </div>
        <p className="text-2xl font-bold text-white">{formatMXN(aportacion_mensual)}</p>
      </div>

      {/* Tabla activos */}
      {activos.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[#243555]">
          <div className="bg-[#0F1E36] px-4 py-3 border-b border-[#243555]">
            <p className="text-xs font-bold text-[#C9A96E] uppercase tracking-widest">Criterios por Activo No Financiero</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#243555] bg-[#162236]">
                <th className="text-left px-4 py-2 text-xs text-[#8899BB]">Activo</th>
                <th className="text-right px-4 py-2 text-xs text-[#8899BB]">Valor</th>
                <th className="text-center px-4 py-2 text-xs text-[#8899BB]">Venta</th>
                <th className="text-center px-4 py-2 text-xs text-[#8899BB]">Edad</th>
                <th className="text-right px-4 py-2 text-xs text-[#8899BB]">Valor vendido</th>
                <th className="text-right px-4 py-2 text-xs text-[#8899BB]">Flujo perdido</th>
              </tr>
            </thead>
            <tbody>
              {activos.map((a, i) => {
                const criterio = criterios[a.key];
                return (
                  <tr key={a.key} className={`border-b border-[#243555] ${i % 2 === 0 ? "bg-[#162236]" : "bg-[#1A2840]"}`}>
                    <td className="px-4 py-3 text-white font-medium">{a.label}</td>
                    <td className="px-4 py-3 text-right text-[#C9A96E] font-semibold">{formatMXN(a.valor)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${criterio.vende ? "bg-yellow-900/30 text-yellow-400 border border-yellow-600/30" : "bg-[#0F1E36] text-[#4A5A75] border border-[#243555]"}`}>
                        {criterio.vende ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-[#8899BB]">
                      {criterio.vende && criterio.edad_venta ? `${criterio.edad_venta} años` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-[#8899BB]">
                      {criterio.vende ? formatMXN(criterio.valor_venta ?? a.valor) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-red-400">
                      {criterio.vende && a.flujo_perdido && a.flujo_perdido > 0
                        ? `-${formatMXN(a.flujo_perdido)}/mes`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Herencia */}
      {patrimonio.herencia > 0 && (
        <div className="bg-[#162236] rounded-xl p-4 border border-[#243555] flex justify-between items-center">
          <div>
            <p className="text-sm font-semibold text-white">Herencia</p>
            <p className="text-xs text-[#8899BB]">
              Edad estimada de recepción:{" "}
              <span className="text-[#C9A96E] font-semibold">{herenciaEdad ? `${herenciaEdad} años` : "—"}</span>
            </p>
          </div>
          <p className="text-lg font-bold text-[#C9A96E]">{formatMXN(patrimonio.herencia)}</p>
        </div>
      )}

      {activos.length === 0 && patrimonio.herencia === 0 && (
        <div className="bg-[#0F1E36] rounded-xl p-5 border border-[#243555] text-center">
          <p className="text-sm text-[#4A5A75]">Sin activos no financieros registrados</p>
        </div>
      )}
    </div>
  );
}
