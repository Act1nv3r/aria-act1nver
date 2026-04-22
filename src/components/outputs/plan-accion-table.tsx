"use client";

import { buildPlanDeAccion, PlanRow, RiesgoNivel } from "@/lib/plan-accion";
import { calcularMotorA } from "@/lib/motors/motor-a";
import { calcularMotorB } from "@/lib/motors/motor-b";
import { calcularMotorC } from "@/lib/motors/motor-c";
import { calcularMotorE } from "@/lib/motors/motor-e";

interface Props {
  motorA: ReturnType<typeof calcularMotorA>;
  motorB: ReturnType<typeof calcularMotorB>;
  motorC: ReturnType<typeof calcularMotorC>;
  motorE: ReturnType<typeof calcularMotorE>;
  proteccion: { seguro_vida: boolean; propiedades_aseguradas: boolean | null; sgmm: boolean } | null;
  perfil: { dependientes: boolean; edad: number } | null;
  patrimonio: { casa: number; tierra: number; herencia: number; inmuebles_renta: number; negocio: number } | null;
}

const riesgoConfig: Record<RiesgoNivel, { label: string; className: string }> = {
  "Muy Alto": { label: "Muy Alto", className: "bg-red-900/30 text-red-400 border border-red-600/30" },
  Alto: { label: "Alto", className: "bg-red-900/30 text-red-400 border border-red-600/30" },
  Medio: { label: "Medio", className: "bg-yellow-900/30 text-yellow-400 border border-yellow-600/30" },
  Bajo: { label: "Bajo", className: "bg-green-900/30 text-green-400 border border-green-600/30" },
};

function RiskBadge({ nivel }: { nivel: RiesgoNivel }) {
  const cfg = riesgoConfig[nivel] ?? riesgoConfig.Medio;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export function PlanAccionTable(props: Props) {
  const rows: PlanRow[] = buildPlanDeAccion(props);

  return (
    <div className="overflow-hidden rounded-xl border border-[#243555]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#0F1E36] border-b border-[#243555]">
            <th className="text-left px-4 py-3 text-xs font-bold text-[#C9A96E] uppercase tracking-widest w-[140px]">Aspecto</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-[#C9A96E] uppercase tracking-widest">Situación Actual</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-[#C9A96E] uppercase tracking-widest w-[90px]">Riesgo</th>
            <th className="text-left px-4 py-3 text-xs font-bold text-[#C9A96E] uppercase tracking-widest">Recomendación</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.aspecto}
              className={`border-b border-[#243555] ${i % 2 === 0 ? "bg-[#162236]" : "bg-[#1A2840]"} hover:bg-[#243555] transition-colors`}
            >
              <td className="px-4 py-3 font-semibold text-white">{row.aspecto}</td>
              <td className="px-4 py-3 text-[#8899BB]">{row.situacion}</td>
              <td className="px-4 py-3">
                <RiskBadge nivel={row.riesgo} />
              </td>
              <td className="px-4 py-3 text-[#8899BB]">{row.recomendacion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
