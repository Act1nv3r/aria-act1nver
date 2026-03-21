"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { formatMXN } from "@/lib/format-currency";

interface EsquemasPensionChartProps {
  afore: number;
  ppr: number;
  planPrivado: number;
  segurosRetiro: number;
  ley73: number | null;
}

export function EsquemasPensionChart({
  afore,
  ppr,
  planPrivado,
  segurosRetiro,
  ley73,
}: EsquemasPensionChartProps) {
  const voluntario = ppr + planPrivado + segurosRetiro;
  const ley73Anual = (ley73 ?? 0) * 12;
  const data = [
    { name: "Afore", value: afore, color: "#317A70" },
    { name: "Voluntario", value: voluntario, color: "#E6C78A" },
    { name: "Ley 73 (anual)", value: ley73Anual, color: "#314566" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="space-y-2 min-w-0">
        <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
          Esquemas de Pensión
        </p>
        <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
          Sin esquemas de retiro registrados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 min-w-0">
      <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
        Esquemas de Pensión
      </p>
      <div className="h-[80px] w-full">
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: "#5A6A85", fontSize: 11 }}
              tickFormatter={(v) => (v.length > 20 ? v.slice(0, 18) + "…" : v)}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#317A70]" />
          Afore: {formatMXN(afore)}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#E6C78A]" />
          Voluntario: {formatMXN(voluntario)}
        </span>
        {(ley73 ?? 0) > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#314566]" />
            Ley 73: {formatMXN(ley73!)}/mes (pensión estimada)
          </span>
        )}
      </div>
    </div>
  );
}
