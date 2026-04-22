"use client";

import { useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { AreaScore, SaludFinancieraResult } from "@/lib/motors/salud-scores";
import { ChevronDown, ChevronUp } from "lucide-react";

const URGENCIA_COLORS = {
  Bajo: { text: "text-[#10B981]", bg: "bg-[#10B981]/10", border: "border-[#10B981]/20" },
  Medio: { text: "text-[#C9A84C]", bg: "bg-[#C9A84C]/10", border: "border-[#C9A84C]/20" },
  Alto: { text: "text-[#F97316]", bg: "bg-[#F97316]/10", border: "border-[#F97316]/20" },
  "Muy Alto": { text: "text-[#EF4444]", bg: "bg-[#EF4444]/10", border: "border-[#EF4444]/20" },
};

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color =
    score >= 75 ? "#10B981" : score >= 50 ? "#C9A84C" : score >= 25 ? "#F97316" : "#EF4444";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1A3154" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-bold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

function AreaCard({
  area,
  expanded,
  onToggle,
}: {
  area: AreaScore;
  expanded: boolean;
  onToggle: () => void;
}) {
  const urg = URGENCIA_COLORS[area.urgencia];
  return (
    <div
      className={`rounded-[14px] border transition-all duration-200 bg-[#0C1829] cursor-pointer select-none
        ${expanded ? "border-[#C9A84C]/30" : "border-white/[0.06] hover:border-white/[0.1]"}`}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 p-3">
        <span className="text-xl shrink-0">{area.icono}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#F0F4FA]">{area.area}</p>
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${urg.text} ${urg.bg} ${urg.border}`}
            >
              {area.urgencia}
            </span>
          </div>
          <p className="text-[11px] text-[#8B9BB4] mt-0.5 truncate">{area.situacion}</p>
        </div>
        <ScoreRing score={area.score} size={44} />
        <span className="text-[#5A6A85] shrink-0">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.04]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] text-[#5A6A85]">Valor clave:</span>
            <span className="text-[10px] font-semibold text-[#C9A84C]">{area.valor_clave}</span>
          </div>
          <p className="text-[12px] text-[#8B9BB4] leading-relaxed">{area.recomendacion}</p>
        </div>
      )}
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0C1829] border border-white/[0.1] rounded-xl px-3 py-2 text-xs">
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="text-[#8B9BB4]">{p.name === "base" ? "Actual" : "Simulado"}:</span>
          <span className="font-bold text-[#F0F4FA]">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

interface RadarSaludFinancieraProps {
  base: SaludFinancieraResult;
  simulado?: SaludFinancieraResult;
  showComparison?: boolean;
}

export function RadarSaludFinanciera({
  base,
  simulado,
  showComparison = false,
}: RadarSaludFinancieraProps) {
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  const radarData = base.areas.map((area) => {
    const simArea = simulado?.areas.find((a) => a.key === area.key);
    return {
      area: area.area,
      base: area.score,
      simulado: simArea?.score ?? area.score,
    };
  });

  const totalColor =
    base.score_total >= 75
      ? "#10B981"
      : base.score_total >= 50
      ? "#C9A84C"
      : base.score_total >= 25
      ? "#F97316"
      : "#EF4444";

  const simTotalColor = simulado
    ? simulado.score_total >= 75
      ? "#10B981"
      : simulado.score_total >= 50
      ? "#C9A84C"
      : simulado.score_total >= 25
      ? "#F97316"
      : "#EF4444"
    : null;

  return (
    <div className="space-y-6">
      {/* Radar Chart + Score */}
      <div className="flex flex-col items-center gap-4">
        {/* Total score */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-[11px] text-[#5A6A85] uppercase tracking-wider mb-1">
              Salud financiera
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold" style={{ color: totalColor }}>
                {base.score_total}
              </span>
              <span className="text-lg text-[#5A6A85]">/100</span>
            </div>
          </div>
          {showComparison && simulado && simulado.score_total !== base.score_total && (
            <div className="text-center border-l border-white/[0.06] pl-4">
              <p className="text-[11px] text-[#5A6A85] uppercase tracking-wider mb-1">Simulado</p>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-4xl font-bold"
                  style={{ color: simTotalColor ?? "#C9A84C" }}
                >
                  {simulado.score_total}
                </span>
                <span className="text-lg text-[#5A6A85]">/100</span>
              </div>
              <p
                className={`text-xs font-bold mt-0.5 ${
                  simulado.score_total > base.score_total ? "text-[#10B981]" : "text-[#EF4444]"
                }`}
              >
                {simulado.score_total > base.score_total ? "▲" : "▼"}{" "}
                {Math.abs(simulado.score_total - base.score_total)} pts
              </p>
            </div>
          )}
        </div>

        {/* Radar */}
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#1A3154" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="area"
                tick={{ fill: "#8B9BB4", fontSize: 11, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "#5A6A85", fontSize: 9 }}
                tickCount={6}
              />
              <Tooltip content={<CustomTooltip />} />
              <Radar
                name="base"
                dataKey="base"
                stroke="#C9A84C"
                fill="#C9A84C"
                fillOpacity={0.15}
                strokeWidth={2}
                dot={{ fill: "#C9A84C", r: 3 }}
              />
              {showComparison && simulado && (
                <Radar
                  name="simulado"
                  dataKey="simulado"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ fill: "#10B981", r: 3 }}
                />
              )}
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        {showComparison && simulado && (
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded bg-[#C9A84C]" />
              <span className="text-[#8B9BB4]">Estado actual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 border-t-2 border-dashed border-[#10B981]" />
              <span className="text-[#8B9BB4]">Simulado</span>
            </div>
          </div>
        )}
      </div>

      {/* 8 Area Cards */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-[#5A6A85] font-semibold mb-3">
          Desglose por área — toca para ver recomendación
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {base.areas.map((area) => (
            <AreaCard
              key={area.key}
              area={area}
              expanded={expandedArea === area.key}
              onToggle={() =>
                setExpandedArea(expandedArea === area.key ? null : area.key)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
