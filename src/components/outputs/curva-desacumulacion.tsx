"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatMXN } from "@/lib/format-currency";

interface CurvaDesacumulacionProps {
  curva: Array<{ edad: number; saldo: number }>;
  edadRetiro: number;
  edadDefuncion: number;
}

export function CurvaDesacumulacion({
  curva,
  edadRetiro,
  edadDefuncion,
}: CurvaDesacumulacionProps) {
  const renderTooltip = (props: unknown) => {
    const p = props as { active?: boolean; payload?: Array<{ payload?: { edad?: number; saldo?: number }; value?: number }>; label?: number };
    if (!p.active || !p.payload?.[0]) return null;
    const entry = p.payload[0];
    const point = entry.payload as { edad?: number; saldo?: number } | undefined;
    const saldo = point?.saldo ?? (entry.value as number) ?? 0;
    const edad = point?.edad ?? (p.label as number) ?? edadRetiro;
    const meses = Math.round((edadDefuncion - edad) * 12);
    return (
      <div className="bg-[#1A2433] p-3 rounded-lg shadow-lg font-[family-name:var(--font-open-sans)] text-sm text-white">
        <p>A los {edad} años tendrás {formatMXN(saldo)} disponibles</p>
        <p className="text-[#5A6A85] text-xs">Quedan {meses} meses de retiro</p>
      </div>
    );
  };

  return (
    <div className="space-y-2 min-w-0">
      <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
        Curva de Desacumulación
      </p>
      <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
        Proyección del saldo disponible por edad
      </p>
    <div className="w-full h-[320px] md:h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={curva} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#314566" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#314566" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,106,133,0.1)" />
          <XAxis
            dataKey="edad"
            tick={{ fill: "#5A6A85", fontSize: 12 }}
            tickFormatter={(v) => `${v}`}
          />
          <YAxis
            tick={{ fill: "#5A6A85", fontSize: 12 }}
            tickFormatter={(v) =>
              v >= 1_000_000 ? `$${v / 1_000_000}M` : `$${v / 1000}K`
            }
          />
          <Tooltip content={renderTooltip} />
          <Area
            type="monotone"
            dataKey="saldo"
            stroke="#E6C78A"
            strokeWidth={2.5}
            fill="url(#gradientArea)"
            isAnimationActive
            animationDuration={2000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    </div>
  );
}
