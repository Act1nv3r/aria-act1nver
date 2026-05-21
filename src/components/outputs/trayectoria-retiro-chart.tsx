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
} from "recharts";
import { formatMXN } from "@/lib/format-currency";
import { PARAMS } from "@/lib/constants";

export interface InyeccionCapital {
  edad: number;
  monto: number;
  label?: string;
  /** Source of this injection — used to assign it to the correct colored bucket */
  tipo?: "venta" | "extra" | "ahorro" | "base";
}

/** Component breakdown of the starting balance at retirement */
export interface ComponentesRetiro {
  base: number;
  ahorro: number;
  venta: number;
  extra: number;
}

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
  /** Capital injections during retirement (e.g. asset sales after retirement age) */
  inyecciones?: InyeccionCapital[];
  /** Monthly savings that continue during retirement (e.g. if rangoAhorro extends past retirement) */
  ahorroMensualPostRetiro?: number;
  /** Age at which post-retirement savings stop */
  ahorroHastaEdad?: number;
  /** Optional breakdown of the starting balance by source — enables stacked color bars */
  componentesRetiro?: ComponentesRetiro;
}

function formatYAxis(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

const COLORS = {
  base:    "#317A70",  // teal
  ahorro:  "#4A90D9",  // blue
  venta:   "#C9A84C",  // gold
  extra:   "#9B59B6",  // purple
  deficit: "#8B3A3A",  // red
} as const;

const LABELS = {
  base:   "Patrimonio base",
  ahorro: "Ahorro acumulado",
  venta:  "Venta de activo",
  extra:  "Aportación extra",
} as const;

type ChartPoint = {
  edad: number;
  base: number;
  ahorro: number;
  venta: number;
  extra: number;
  deficit: number;
};

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
  inyecciones = [],
  ahorroMensualPostRetiro = 0,
  ahorroHastaEdad,
  componentesRetiro,
}: TrayectoriaRetiroChartProps) {
  const { trayectoria, disposicionMensual, ahorroPotencial, hasComponents } = useMemo(() => {
    const tasa_mensual = tasaRealAnual / 12;
    const meses_jubilacion = (edadDefuncion - edadRetiro) * 12;
    const retiroDelPatrimonio = Math.max(mensualidadDeseada - pensionTotalMensual, 0);

    const isStacked = !!(
      componentesRetiro &&
      (componentesRetiro.ahorro > 0 || componentesRetiro.venta > 0 || componentesRetiro.extra > 0)
    );

    // Build injection lookup by mes, separated by type
    const injPorMes = new Map<number, { venta: number; extra: number; base: number }>();
    for (const inj of inyecciones) {
      if (inj.monto <= 0) continue;
      const mesInj = Math.round((inj.edad - edadRetiro) * 12);
      if (mesInj > 0 && mesInj <= meses_jubilacion) {
        const prev = injPorMes.get(mesInj) ?? { venta: 0, extra: 0, base: 0 };
        const tipo = inj.tipo ?? "base";
        injPorMes.set(mesInj, {
          ...prev,
          [tipo === "extra" ? "extra" : tipo === "venta" ? "venta" : "base"]:
            prev[tipo === "extra" ? "extra" : tipo === "venta" ? "venta" : "base"] + inj.monto,
        });
      }
    }

    // Initial buckets
    let bBase  = componentesRetiro ? componentesRetiro.base  : saldoInicioJubilacion;
    let bAhorro = componentesRetiro ? componentesRetiro.ahorro : 0;
    let bVenta  = componentesRetiro ? componentesRetiro.venta  : 0;
    let bExtra  = componentesRetiro ? componentesRetiro.extra  : 0;

    const data: ChartPoint[] = [];

    for (let mes = 0; mes <= meses_jubilacion; mes++) {
      const edadActualMes = edadRetiro + mes / 12;

      if (mes > 0) {
        const total = bBase + bAhorro + bVenta + bExtra;

        if (total > 0) {
          // Interest + withdrawal applied proportionally to all buckets
          const interes = total * tasa_mensual;
          const netChange = interes - retiroDelPatrimonio;
          const factor = (total + netChange) / total;
          const f = Math.max(factor, -1); // prevent extreme flip
          bBase  = Math.max(0, bBase  * f);
          bAhorro = Math.max(0, bAhorro * f);
          bVenta  = Math.max(0, bVenta  * f);
          bExtra  = Math.max(0, bExtra  * f);
        }

        // Post-retirement savings go into ahorro bucket
        const ahorrando =
          ahorroMensualPostRetiro > 0 &&
          edadActualMes <= (ahorroHastaEdad ?? edadRetiro);
        if (ahorrando) bAhorro += ahorroMensualPostRetiro;
      }

      // Apply capital injections
      const inj = injPorMes.get(mes);
      if (inj) {
        bBase   += inj.base;
        bVenta  += inj.venta;
        bExtra  += inj.extra;
      }

      if (mes % 12 === 0 || mes === meses_jubilacion || injPorMes.has(mes)) {
        const total = bBase + bAhorro + bVenta + bExtra;
        const isNeg = total < 0;
        data.push({
          edad: Math.round(edadRetiro + mes / 12),
          base:   isNeg ? 0 : Math.round(bBase),
          ahorro: isNeg ? 0 : Math.round(bAhorro),
          venta:  isNeg ? 0 : Math.round(bVenta),
          extra:  isNeg ? 0 : Math.round(bExtra),
          deficit: isNeg ? Math.round(total) : 0,
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
      hasComponents: isStacked,
    };
  }, [
    saldoInicioJubilacion,
    pensionTotalMensual,
    mensualidadDeseada,
    edadRetiro,
    edadDefuncion,
    patrimonioFinancieroActual,
    tasaRealAnual,
    inyecciones,
    ahorroMensualPostRetiro,
    ahorroHastaEdad,
    componentesRetiro,
  ]);

  const renderTooltip = (props: unknown) => {
    const p = props as {
      active?: boolean;
      payload?: Array<{ name: string; value: number; fill: string }>;
      label?: number;
    };
    if (!p.active || !p.payload?.length) return null;
    const total = p.payload.reduce((s, e) => s + e.value, 0);
    const isNeg = p.payload.some((e) => e.name === "deficit" && e.value < 0);
    return (
      <div className="bg-[#1A2433] p-3 rounded-lg shadow-lg border border-[rgba(90,106,133,0.3)] min-w-[180px] space-y-1">
        <p className="font-[family-name:var(--font-poppins)] text-sm font-bold text-white mb-1">
          {p.label} años
        </p>
        {hasComponents && !isNeg
          ? p.payload
              .filter((e) => e.value > 0)
              .map((e) => (
                <div key={e.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.fill }} />
                  <span className="font-[family-name:var(--font-open-sans)] text-[11px] text-[#9AAFCA]">
                    {LABELS[e.name as keyof typeof LABELS] ?? e.name}
                  </span>
                  <span className="ml-auto font-[family-name:var(--font-poppins)] text-xs text-white">
                    {formatMXN(e.value)}
                  </span>
                </div>
              ))
          : null}
        <div className="pt-1 border-t border-white/10 flex justify-between">
          <span className="font-[family-name:var(--font-open-sans)] text-[11px] text-[#5A6A85]">Total</span>
          <span className={`font-bold font-[family-name:var(--font-poppins)] text-xs ${total >= 0 ? "text-[#317A70]" : "text-[#8B3A3A]"}`}>
            {formatMXN(isNeg ? p.payload.find((e) => e.name === "deficit")?.value ?? total : total)}
          </span>
        </div>
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

  // Which components are actually non-zero (for legend)
  const activeLegend = hasComponents
    ? (["base", "ahorro", "venta", "extra"] as const).filter(
        (k) => (componentesRetiro?.[k] ?? 0) > 0 ||
               inyecciones.some((i) => (i.tipo ?? "base") === k)
      )
    : (["base"] as const);

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

            {/* Stacked positive segments */}
            <Bar dataKey="base"   stackId="s" fill={COLORS.base}   maxBarSize={40} isAnimationActive animationDuration={1200} />
            <Bar dataKey="ahorro" stackId="s" fill={COLORS.ahorro} maxBarSize={40} isAnimationActive animationDuration={1200} />
            <Bar dataKey="venta"  stackId="s" fill={COLORS.venta}  maxBarSize={40} isAnimationActive animationDuration={1200} />
            <Bar dataKey="extra"  stackId="s" fill={COLORS.extra}  maxBarSize={40} isAnimationActive animationDuration={1200} />

            {/* Negative / deficit bar */}
            <Bar dataKey="deficit" stackId="d" fill={COLORS.deficit} maxBarSize={40} isAnimationActive animationDuration={1200} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Color legend */}
      {!compact && hasComponents && (
        <div className="flex flex-wrap gap-3 pt-2">
          {activeLegend.map((k) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[k] }} />
              <span className="font-[family-name:var(--font-open-sans)] text-[10px] text-[#5A6A85]">
                {LABELS[k]}
              </span>
            </div>
          ))}
        </div>
      )}

      {!compact && (
        <div className="flex flex-wrap gap-6 pt-2 border-t border-[rgba(90,106,133,0.2)]">
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
