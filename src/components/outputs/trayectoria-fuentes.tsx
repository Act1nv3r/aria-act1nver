"use client";

import { calcularMotorC, calcularCapitalHumano } from "@/lib/motors/motor-c";
import { calcularMotorA } from "@/lib/motors/motor-a";
import { calcularMotorD } from "@/lib/motors/motor-d";
import { calcularMotorE } from "@/lib/motors/motor-e";
import { formatMXN } from "@/lib/format-currency";

interface Props {
  motorC: ReturnType<typeof calcularMotorC>;
  motorA: ReturnType<typeof calcularMotorA>;
  motorD?: ReturnType<typeof calcularMotorD> | null;
  motorE: ReturnType<typeof calcularMotorE>;
  perfil: { edad: number };
  retiro: { edad_retiro: number };
}

const COLORS = {
  pension: "#C9A96E",
  voluntarios: "#E8C87A",
  rentas: "#314566",
  negocio: "#5A6A85",
  patrimonio: "#1C2B4A",
  acumulacion: "#243555",
};

const LEGEND = [
  { key: "pension", label: "AFORE / Ley 73", color: COLORS.pension },
  { key: "voluntarios", label: "PPR / Voluntarios", color: COLORS.voluntarios },
  { key: "rentas", label: "Rentas", color: COLORS.rentas },
  { key: "negocio", label: "Negocio", color: COLORS.negocio },
  { key: "patrimonio", label: "Patrimonio Financiero", color: COLORS.patrimonio },
];

export function TrayectoriaFuentes({ motorC, motorA, motorD, motorE, perfil, retiro }: Props) {
  const { curva, saldo_inicio_jubilacion } = motorC;

  // Capital Humano
  const capitalHumano = calcularCapitalHumano(
    motorA.ingresos_totales,
    perfil.edad,
    retiro.edad_retiro
  );
  const legado = motorD?.legado;
  const total = capitalHumano + saldo_inicio_jubilacion - motorE.pasivos_total;

  if (curva.length === 0) return null;

  // Max total ingreso per month across all retirement points for bar scale
  const maxTotal = Math.max(
    1,
    ...curva.map((p) =>
      p.pension_mensual + p.voluntarios_mensual + p.rentas_mensual + p.negocio_mensual + p.patrimonio_retiro
    )
  );

  return (
    <div className="space-y-5">
      {/* Horizontal bars per year */}
      <div className="bg-[#162236] rounded-xl p-5 border border-[#243555]">
        <p className="text-xs font-bold text-[#C9A96E] uppercase tracking-widest mb-4">
          Trayectoria de Ingresos en Retiro por Fuente
        </p>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-5">
          {LEGEND.map((l) => (
            <div key={l.key} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: l.color }} />
              <span className="text-xs text-[#8899BB]">{l.label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {curva.map((punto) => {
            const totalPunto =
              punto.pension_mensual +
              punto.voluntarios_mensual +
              punto.rentas_mensual +
              punto.negocio_mensual +
              punto.patrimonio_retiro;
            const totalWidth = (totalPunto / maxTotal) * 100;

            const segments = [
              { key: "pension", value: punto.pension_mensual, color: COLORS.pension },
              { key: "voluntarios", value: punto.voluntarios_mensual, color: COLORS.voluntarios },
              { key: "rentas", value: punto.rentas_mensual, color: COLORS.rentas },
              { key: "negocio", value: punto.negocio_mensual, color: COLORS.negocio },
              { key: "patrimonio", value: punto.patrimonio_retiro, color: COLORS.patrimonio },
            ].filter((s) => s.value > 0);

            return (
              <div key={punto.mes} className="flex items-center gap-3">
                <span className="text-xs text-[#4A5A75] w-12 text-right shrink-0">{punto.edad % 1 === 0 ? `${punto.edad}a` : ""}</span>
                <div className="flex-1 h-5 bg-[#0F1E36] rounded-sm overflow-hidden flex">
                  {segments.map((seg) => (
                    <div
                      key={seg.key}
                      style={{
                        width: `${totalWidth > 0 ? (seg.value / totalPunto) * totalWidth : 0}%`,
                        background: seg.color,
                      }}
                      className="h-full transition-all"
                      title={`${seg.key}: ${formatMXN(seg.value)}/mes`}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#8899BB] w-28 text-right shrink-0">{formatMXN(totalPunto)}/mes</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#162236] rounded-xl p-4 border border-[#243555]">
          <p className="text-xs text-[#8899BB] mb-1">Patrimonio Financiero al Retiro</p>
          <p className="text-lg font-bold text-[#C9A96E]">{formatMXN(saldo_inicio_jubilacion)}</p>
        </div>
        <div className="bg-[#162236] rounded-xl p-4 border border-[#243555]">
          <p className="text-xs text-[#8899BB] mb-1">Capital Humano</p>
          <p className="text-xs text-[#4A5A75] mb-1">(VP ingresos futuros)</p>
          <p className="text-lg font-bold text-white">{formatMXN(capitalHumano)}</p>
        </div>
        <div className="bg-[#162236] rounded-xl p-4 border border-[#243555]">
          <p className="text-xs text-[#8899BB] mb-1">Obligaciones</p>
          <p className="text-lg font-bold text-red-400">{formatMXN(motorE.pasivos_total)}</p>
        </div>
        <div className="bg-[#162236] rounded-xl p-4 border border-[#243555]">
          <p className="text-xs text-[#8899BB] mb-1">Patrimonio Total Proyectado</p>
          <p className={`text-lg font-bold ${total >= 0 ? "text-green-400" : "text-red-400"}`}>{formatMXN(total)}</p>
        </div>
      </div>

      {/* Legado */}
      {legado && legado > 0 && (
        <div className="bg-[#0F1E36] rounded-xl p-4 border border-[#C9A96E]/30 flex justify-between items-center">
          <div>
            <p className="text-xs text-[#C9A96E] uppercase tracking-widest font-bold">Legado</p>
            <p className="text-xs text-[#8899BB]">Patrimonio transmitible al fallecimiento</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-[#C9A96E]">{formatMXN(legado)}</p>
            <span className="text-xs px-2 py-0.5 bg-[#C9A96E]/10 text-[#C9A96E] rounded-full border border-[#C9A96E]/20">Blindaje Patrimonial</span>
          </div>
        </div>
      )}
    </div>
  );
}
