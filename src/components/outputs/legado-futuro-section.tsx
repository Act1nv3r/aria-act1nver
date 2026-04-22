"use client";

import { useState } from "react";
import { CheckCircle2, Download, ChevronRight, ChevronDown, Award, Lock, Sparkles, BarChart2 } from "lucide-react";
import { calcularMotorC } from "@/lib/motors/motor-c";
import { calcularMotorD } from "@/lib/motors/motor-d";
import { calcularMotorE } from "@/lib/motors/motor-e";
import { formatMXN } from "@/lib/format-currency";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { HouseViewPanel } from "@/components/outputs/house-view-panel";

interface Props {
  motorC: ReturnType<typeof calcularMotorC> | null;
  motorD: ReturnType<typeof calcularMotorD> | null;
  motorE: ReturnType<typeof calcularMotorE>;
  nombre: string;
  onDownloadPDF?: () => void;
}

function buildLegadoCurva(patrimonioNeto: number, legado?: number): Array<{ year: number; valor: number }> {
  const data = [];
  const tasa = 0.065;
  for (let i = 0; i <= 25; i += 5) {
    data.push({
      year: new Date().getFullYear() + i,
      valor: Math.round(patrimonioNeto * Math.pow(1 + tasa, i)),
    });
  }
  if (legado && legado > patrimonioNeto) {
    data[data.length - 1] = { year: data[data.length - 1].year, valor: legado };
  }
  return data;
}

function formatYAxis(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

const PROPUESTAS = [
  { icon: Award, text: "Plan Patrimonial personalizado, revisado contigo cada año" },
  { icon: Lock, text: "Acceso a productos institucionales exclusivos para banca privada" },
  { icon: Sparkles, text: "Optimización fiscal integrada en tu estrategia patrimonial" },
];

export function LegadoFuturoSection({ motorC, motorD, motorE, nombre, onDownloadPDF }: Props) {
  const [showHouseView, setShowHouseView] = useState(false);
  const legado = motorD?.legado ?? null;
  const legadoEstimado = legado ?? Math.round(motorE.patrimonio_neto * Math.pow(1.065, 25));
  const curvaDatos = buildLegadoCurva(motorE.patrimonio_neto, legadoEstimado);

  const nombreMostrar = nombre || "Cliente";

  return (
    <div className="space-y-8">
      {/* Legacy projection */}
      <div className="bg-[#0C1829] border border-white/[0.06] rounded-2xl p-6">
        <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-1">Tu Legado</p>
        <p className="text-[#8B9BB4] text-sm mb-6">
          Con una gestión óptima de tu patrimonio, esto es lo que podrías dejar a quienes más quieres.
        </p>

        <div className="flex flex-col md:flex-row gap-6 items-center">
          {/* Chart */}
          <div className="w-full md:flex-1 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curvaDatos} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="legadoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#243555" />
                <XAxis dataKey="year" tick={{ fill: "#5A6A85", fontSize: 11 }} />
                <YAxis tickFormatter={formatYAxis} tick={{ fill: "#5A6A85", fontSize: 11 }} width={55} />
                <Tooltip
                  formatter={(v) => [formatMXN(Number(v)), "Valor proyectado"]}
                  contentStyle={{ background: "#0C1829", border: "1px solid #243555", borderRadius: 8, color: "#fff", fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="#C9A84C"
                  strokeWidth={2.5}
                  fill="url(#legadoGrad)"
                  isAnimationActive
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legado metric */}
          <div className="text-center md:text-right">
            <p className="text-xs text-[#5A6A85] uppercase tracking-wide mb-1">Legado proyectado</p>
            <p className="text-4xl font-bold text-[#C9A84C]">{formatMXN(legadoEstimado)}</p>
            <p className="text-xs text-[#8B9BB4] mt-1">en 25 años · tasa 6.5% anual</p>
            <div className="mt-3 px-3 py-1.5 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 inline-block">
              <p className="text-xs font-semibold text-[#C9A84C]">Blindaje Patrimonial</p>
            </div>
          </div>
        </div>
      </div>

      {/* El Siguiente Paso — Conversion CTA */}
      <div
        className="relative overflow-hidden rounded-2xl border border-[#C9A84C]/30 p-8"
        style={{
          background: "linear-gradient(135deg, #0C1829 0%, #162236 50%, #0F1E36 100%)",
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #C9A84C, transparent)" }}
        />

        <div className="relative z-10">
          <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-3">El Siguiente Paso</p>
          <h2 className="text-2xl font-bold text-white mb-2">
            {nombreMostrar}, tu consultor financiero de cabecera está listo.
          </h2>
          <p className="text-[#8B9BB4] text-sm mb-8 max-w-xl">
            Hemos analizado tu patrimonio completo. Ahora es momento de formalizar una estrategia personalizada que proteja y haga crecer lo que has construido.
          </p>

          {/* Value props */}
          <div className="space-y-3 mb-8">
            {PROPUESTAS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-[#C9A84C] shrink-0 mt-0.5" />
                <p className="text-sm text-[#8B9BB4]">{text}</p>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #C9A84C, #E8C872)",
                color: "#0C1829",
                boxShadow: "0 0 30px #C9A84C30",
              }}
            >
              Iniciar mi Plan Patrimonial con Actinver
              <ChevronRight size={16} />
            </button>

            {onDownloadPDF && (
              <button
                onClick={onDownloadPDF}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-sm border border-white/[0.12] text-[#8B9BB4] hover:border-[#C9A84C]/30 hover:text-[#C9A84C] transition-colors"
              >
                <Download size={16} />
                Descargar mi Resumen Patrimonial
              </button>
            )}
          </div>

          {/* House View toggle button */}
          <button
            onClick={() => setShowHouseView((v) => !v)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-white/[0.08] text-[#5A6A85] hover:border-[#C9A84C]/20 hover:text-[#C9A84C]/80 transition-colors"
          >
            <BarChart2 size={15} />
            Perspectiva de Mercados · House View Actinver
            <ChevronDown
              size={14}
              className="transition-transform duration-300"
              style={{ transform: showHouseView ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          {/* House View expandable panel */}
          {showHouseView && (
            <div className="mt-2 border-t border-white/[0.06] pt-6">
              <HouseViewPanel />
            </div>
          )}

          {/* Trust seal */}
          <p className="text-[10px] text-[#4A5A75] mt-5 text-center">
            Actinver · Banca Privada · Regulado por CNBV · Miembro de la BMV desde 1993
          </p>
        </div>
      </div>
    </div>
  );
}
