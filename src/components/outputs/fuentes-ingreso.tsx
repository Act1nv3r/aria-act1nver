"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { formatMXN } from "@/lib/format-currency";

interface FuentesIngresoProps {
  rentas: number;
  pension: number;
  patrimonio: number;
}

export function FuentesIngreso({
  rentas,
  pension,
  patrimonio,
}: FuentesIngresoProps) {
  const total = rentas + pension + patrimonio;
  const data = [
    { name: "Rentas", value: rentas, color: "#317A70" },
    { name: "Pensión", value: pension, color: "#E6C78A" },
    { name: "Patrimonio", value: patrimonio, color: "#314566" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-2 min-w-0">
      <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
        Fuentes de Ingreso en Retiro
      </p>
      <div className="h-[60px] w-full">
        <ResponsiveContainer width="100%" height={60}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={80} tick={{ fill: "#5A6A85", fontSize: 12 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85] break-words">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#317A70]" />
          Rentas: {formatMXN(rentas)}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#E6C78A]" />
          Pensión: {formatMXN(pension)}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#314566]" />
          Patrimonio: {formatMXN(patrimonio)}
        </span>
      </div>
    </div>
  );
}
