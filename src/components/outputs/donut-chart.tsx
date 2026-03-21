"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatMXN } from "@/lib/format-currency";

interface DonutChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  total: number;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (!active || !payload?.[0]) return null;
  return (
    <div className="bg-[#1A2433] p-3 rounded-lg shadow-lg font-[family-name:var(--font-open-sans)] text-sm text-white">
      {payload[0].name}: {formatMXN(payload[0].value)}
    </div>
  );
};

export function DonutChart({ data, total }: DonutChartProps) {
  return (
    <div className="space-y-2 min-w-0">
      <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
        Análisis de Flujo Mensual
      </p>
      <div className="relative w-full h-[250px]">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive
              animationDuration={1000}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">Total</span>
          <span className="font-bold font-[family-name:var(--font-poppins)] text-base text-white">
            {formatMXN(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
