"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { formatMXN } from "@/lib/format-currency";
import { PARAMS } from "@/lib/constants";

interface TrayectoriaRetiroChartProps {
  saldoInicioJubilacion: number;
  pensionTotalMensual: number;
  mensualidadDeseada: number;
  edadRetiro: number;
  edadDefuncion: number;
  patrimonioFinancieroActual?: number;
  tasaRealAnual?: number;
  compact?: boolean;
  chartHeight?: number;
}

function formatYAxis(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function TrayectoriaRetiroChart({
  saldoInicioJubilacion,
  pensionTotalMensual,
  mensualidadDeseada,
  edadRetiro,
  edadDefuncion,
  patrimonioFinancieroActual,
  tasaRealAnual = PARAMS.TASA_REAL_ANUAL,
  compact = false,
  chartHeight,
}: TrayectoriaRetiroChartProps) {
  const { trayectoria, disposicionMensual, ahorroPotencial } = useMemo(() => {
    const tasa_mensual = tasaRealAnual / 12;
    const meses_jubilacion = (edadDefuncion - edadRetiro) * 12;
    const retiroDelPatrimonio = mensualidadDeseada - pensionTotalMensual;

    const data: Array<{ edad: number; saldo: number }> = [];
    let saldo_actual = saldoInicioJubilacion;

    for (let mes = 0; mes <= meses_jubilacion; mes++) {
      if (mes > 0) {
        const interes = saldo_actual * tasa_mensual;
        saldo_actual = saldo_actual + interes - retiroDelPatrimonio;
      }
      if (mes % 12 === 0 || mes === meses_jubilacion) {
        data.push({
          edad: Math.round(edadRetiro + mes / 12),
          saldo: Math.round(saldo_actual * 100) / 100,
        });
      }
    }

    const patActual =
      patrimonioFinancieroActual ??
      saldoInicioJubilacion /
        Math.pow(1 + tasa_mensual, Math.max(0, (edadRetiro - 50) * 12));
    const ahorroPotencial = Math.max(0, saldoInicioJubilacion - patActual);

    return {
      trayectoria: data,
      disposicionMensual: mensualidadDeseada,
      ahorroPotencial,
    };
  }, [
    saldoInicioJubilacion,
    pensionTotalMensual,
    mensualidadDeseada,
    edadRetiro,
    edadDefuncion,
    patrimonioFinancieroActual,
    tasaRealAnual,
  ]);

  const renderTooltip = (props: unknown) => {
    const p = props as {
      active?: boolean;
      payload?: Array<{ payload: { edad: number; saldo: number }; value: number }>;
    };
    if (!p.active || !p.payload?.[0]) return null;
    const { edad, saldo } = p.payload[0].payload;
    return (
      <div className="bg-[#1A2433] p-3 rounded-lg shadow-lg border border-[#5A6A85]/30 min-w-[160px]">
        <p className="font-[family-name:var(--font-poppins)] text-sm font-bold text-white">
          {edad} años
        </p>
        <p
          className={`font-[family-name:var(--font-open-sans)] text-sm ${
            saldo >= 0 ? "text-[#317A70]" : "text-[#8B3A3A]"
          }`}
        >
          {formatMXN(saldo)}
        </p>
      </div>
    );
  };

  const patrimonioFinanciero =
    patrimonioFinancieroActual ??
    saldoInicioJubilacion /
      Math.pow(
        1 + tasaRealAnual / 12,
        Math.max(0, (edadRetiro - 50) * 12)
      );
  const total = patrimonioFinanciero + ahorroPotencial;

  const resolvedChartHeight = chartHeight ?? (compact ? 200 : 360);

  return (
    <div className="space-y-4 min-w-0">
      {!compact && (
        <>
          <div>
            <h4 className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
              Trayectoria al momento del retiro
            </h4>
            <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85] mt-0.5">
              (Sobre patrimonio financiero)
            </p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
              Disposición mensual:
            </span>
            <span className="font-bold font-[family-name:var(--font-poppins)] text-base text-[#E6C78A]">
              {formatMXN(disposicionMensual)}
            </span>
          </div>
        </>
      )}

      <div style={{ height: resolvedChartHeight }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={trayectoria}
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,106,133,0.2)" vertical={true} horizontal={false} />
            <YAxis
              type="category"
              dataKey="edad"
              tick={{ fill: "#5A6A85", fontSize: 11 }}
              tickFormatter={(v) => `${v}`}
              width={30}
            />
            <XAxis
              type="number"
              tick={{ fill: "#5A6A85", fontSize: 10 }}
              tickFormatter={formatYAxis}
              domain={["auto", "auto"]}
              allowDataOverflow
            />
            <Tooltip content={renderTooltip} cursor={{ fill: "rgba(90,106,133,0.1)" }} />
            <ReferenceLine x={0} stroke="#5A6A85" strokeWidth={1} />
            <Bar
              dataKey="saldo"
              fill="#317A70"
              maxBarSize={14}
              isAnimationActive
              animationDuration={1500}
            >
              {trayectoria.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.saldo >= 0 ? "#317A70" : "#8B3A3A"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-6 pt-2 border-t border-[#5A6A85]/20">
          <div>
            <p className="font-[family-name:var(--font-open-sans)] text-[10px] text-[#5A6A85]">
              Patrimonio Financiero
            </p>
            <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
              {formatMXN(patrimonioFinanciero)}
            </p>
          </div>
          <div>
            <p className="font-[family-name:var(--font-open-sans)] text-[10px] text-[#5A6A85]">
              Ahorro Potencial
            </p>
            <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-[#317A70]">
              {formatMXN(ahorroPotencial)}
            </p>
          </div>
          <div>
            <p className="font-[family-name:var(--font-open-sans)] text-[10px] text-[#5A6A85]">
              Total
            </p>
            <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">
              {formatMXN(total)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
