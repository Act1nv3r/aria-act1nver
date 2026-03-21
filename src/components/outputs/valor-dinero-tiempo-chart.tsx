"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatMXN } from "@/lib/format-currency";

interface ValorDineroTiempoChartProps {
  montoInversion: number;
  reservaCortoPlazo: number;
  edadInicio: number;
  edadDefuncion: number;
}

const TASAS = [
  { key: "p8", tasa: 0.08, label: "8%", color: "#317A70", añosDuplicar: 9, desc: "Deuda mexicana" },
  { key: "p12", tasa: 0.12, label: "12%", color: "#E6C78A", añosDuplicar: 6, desc: "Portafolio balanceado" },
  { key: "p14", tasa: 0.14, label: "14%", color: "#314566", añosDuplicar: 5.14, desc: "Equity americano" },
] as const;

function formatYAxis(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function ValorDineroTiempoChart({
  montoInversion,
  reservaCortoPlazo,
  edadInicio,
  edadDefuncion,
}: ValorDineroTiempoChartProps) {
  const chartData = useMemo(() => {
    const años = edadDefuncion - edadInicio;
    const step = Math.max(1, Math.floor(años / 12)); // ~12 puntos en el eje X
    const data: Array<{ edad: number; p8: number; p12: number; p14: number }> = [];

    for (let t = 0; t <= años; t += step) {
      const edad = edadInicio + t;
      data.push({
        edad,
        p8: montoInversion * Math.pow(1.08, t),
        p12: montoInversion * Math.pow(1.12, t),
        p14: montoInversion * Math.pow(1.14, t),
      });
    }
    // Asegurar que el último punto sea edadDefuncion
    if (data.length > 0 && data[data.length - 1].edad < edadDefuncion) {
      const t = edadDefuncion - edadInicio;
      data.push({
        edad: edadDefuncion,
        p8: montoInversion * Math.pow(1.08, t),
        p12: montoInversion * Math.pow(1.12, t),
        p14: montoInversion * Math.pow(1.14, t),
      });
    }
    return data;
  }, [montoInversion, edadInicio, edadDefuncion]);

  const renderTooltip = (props: unknown) => {
    const p = props as {
      active?: boolean;
      payload?: Array<{ dataKey: string; value: number; payload: { edad: number } }>;
      label?: number;
    };
    if (!p.active || !p.payload?.length) return null;
    const edad = p.payload[0]?.payload?.edad ?? p.label ?? edadInicio;
    return (
      <div className="bg-[#1A2433] p-3 rounded-lg shadow-lg border border-[#5A6A85]/30 min-w-[180px]">
        <p className="font-[family-name:var(--font-poppins)] text-sm font-bold text-white mb-2">
          A los {edad} años
        </p>
        {p.payload.map((entry) => {
          const meta = TASAS.find((t) => t.key === entry.dataKey);
          return (
            <p
              key={entry.dataKey}
              className="font-[family-name:var(--font-open-sans)] text-xs text-white flex justify-between gap-4"
            >
              <span style={{ color: meta?.color }}>{meta?.label}</span>
              <span>{formatMXN(entry.value)}</span>
            </p>
          );
        })}
      </div>
    );
  };

  const renderLegend = () => (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {TASAS.map((t) => (
        <div
          key={t.key}
          className="flex items-center gap-2 font-[family-name:var(--font-open-sans)] text-xs"
        >
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: t.color }}
          />
          <span className="text-[#5A6A85]">
            {t.label}: Duplica cada {t.añosDuplicar} años
          </span>
        </div>
      ))}
    </div>
  );

  if (chartData.length === 0) return null;

  return (
    <div className="space-y-4 min-w-0">
      <div>
        <h4 className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
          Valor Dinero en el Tiempo
        </h4>
        <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85] mt-0.5">
          REGLA 72: Tiempo en duplicar tu inversión (72/tasa)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85] mb-1">
            ¿Cuánto deseas invertir?
          </label>
          <p className="font-bold font-[family-name:var(--font-poppins)] text-base text-[#E6C78A] break-all">
            {formatMXN(montoInversion)}
          </p>
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85] mt-0.5">
            Monto aproximado de inversión
          </p>
        </div>
        <div>
          <label className="block font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85] mb-1">
            Reserva corto plazo
          </label>
          <p className="font-bold font-[family-name:var(--font-poppins)] text-base text-white break-all">
            {formatMXN(reservaCortoPlazo)}
          </p>
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85] mt-0.5">
            Ahorros disponibles de forma inmediata
          </p>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,106,133,0.2)" />
            <XAxis
              dataKey="edad"
              tick={{ fill: "#5A6A85", fontSize: 11 }}
              tickFormatter={(v) => `${v} años`}
            />
            <YAxis
              tick={{ fill: "#5A6A85", fontSize: 11 }}
              tickFormatter={formatYAxis}
              domain={["auto", "auto"]}
            />
            <Tooltip content={renderTooltip} />
            {TASAS.map((t) => (
              <Line
                key={t.key}
                type="monotone"
                dataKey={t.key}
                stroke={t.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: t.color }}
                isAnimationActive
                animationDuration={1500}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {renderLegend()}

      <p className="font-[family-name:var(--font-open-sans)] text-[10px] text-[#5A6A85] italic">
        *Rendimientos pasados no garantizan rendimientos futuros
      </p>
    </div>
  );
}
