"use client";

import { TrendingUp, Users, Lightbulb, BarChart3 } from "lucide-react";

interface MetricItem {
  label: string;
  value: number | string;
  color?: string;
  icon?: React.ReactNode;
  sublabel?: string;
}

interface QuickMetricsProps {
  metrics: MetricItem[];
}

export function QuickMetrics({ metrics }: QuickMetricsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map(({ label, value, color, icon, sublabel }) => (
        <div
          key={label}
          className="bg-[#0C1829] border border-white/[0.06] rounded-[14px] px-4 py-3.5 flex items-center gap-3 hover:border-white/[0.1] transition-colors"
        >
          {icon && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color || "#C9A84C"}18` }}
            >
              <span style={{ color: color || "#C9A84C" }} className="[&>svg]:w-4 [&>svg]:h-4">
                {icon}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <span
              className="font-bold text-xl leading-none block"
              style={{ color: color || "#C9A84C" }}
            >
              {value}
            </span>
            <span className="text-[#8B9BB4] text-[11px] leading-tight block mt-0.5 truncate">{label}</span>
            {sublabel && <span className="text-[#5A6A85] text-[10px] block mt-0.5">{sublabel}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
