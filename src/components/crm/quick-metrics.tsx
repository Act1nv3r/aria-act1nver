"use client";

interface MetricItem {
  label: string;
  value: number | string;
  color?: string;
}

interface QuickMetricsProps {
  metrics: MetricItem[];
}

export function QuickMetrics({ metrics }: QuickMetricsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {metrics.map(({ label, value, color }) => (
        <div
          key={label}
          className="bg-[#0C1829] border border-white/[0.06] rounded-[12px] px-4 py-3 flex items-center gap-3"
        >
          <span
            className="font-bold text-lg leading-none"
            style={{ color: color || "#C9A84C" }}
          >
            {value}
          </span>
          <span className="text-[#8B9BB4] text-xs">{label}</span>
        </div>
      ))}
    </div>
  );
}
