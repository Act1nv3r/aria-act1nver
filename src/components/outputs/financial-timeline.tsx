"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import { formatMXN } from "@/lib/format-currency";
import {
  calcularTimeline,
  type TimelineInput,
  type TimelinePoint,
  type EventoVida,
} from "@/lib/calcular-timeline";

type TimelineMode = "presentacion" | "simulador" | "resultados" | "mini";

interface FinancialTimelineProps {
  edadActual: number;
  edadRetiro: number;
  edadDefuncion: number;
  patrimonioActual: number;
  ahorroMensual: number;
  tasaReal?: number;
  pensionMensual: number;
  rentasMensuales: number;
  mensualidadDeseada: number;
  eventos?: EventoVida[];
  modo?: TimelineMode;
  showMetrics?: boolean;
  animate?: boolean;
}

const modeHeights: Record<TimelineMode, string> = {
  presentacion: "h-[55vh] min-h-[400px]",
  simulador: "h-[320px]",
  resultados: "h-[360px]",
  mini: "h-[180px]",
};

function MetricCard({
  label,
  value,
  color,
  animate: shouldAnimate,
}: {
  label: string;
  value: string;
  color: string;
  animate: boolean;
}) {
  return (
    <div className="bg-[#0C1829] border border-white/[0.06] rounded-[12px] px-4 py-3 min-w-0">
      <p className="text-[10px] text-[#8B9BB4] uppercase tracking-wider font-semibold truncate">
        {label}
      </p>
      <p
        className={`text-lg font-bold font-[family-name:var(--font-poppins)] mt-0.5 ${
          shouldAnimate ? "transition-all duration-300" : ""
        }`}
        style={{ color }}
      >
        {value}
      </p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ payload?: TimelinePoint; value?: number }>;
  label?: number;
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  if (!point) return null;

  return (
    <div
      className="rounded-[12px] p-3 shadow-xl border border-white/[0.1] text-sm"
      style={{ background: "rgba(12,24,41,0.95)", backdropFilter: "blur(12px)" }}
    >
      <p className="font-bold text-[#F0F4FA]">
        A los {label ?? point.edad} años
      </p>
      <p className="text-[#C9A84C] font-semibold mt-1">
        Patrimonio: {formatMXN(point.saldo)}
      </p>
      <p className="text-[#8B9BB4] text-xs mt-0.5">
        Fase: {point.fase === "acumulacion" ? "Acumulación" : "Retiro"}
      </p>
      {point.evento && (
        <p className="text-xs mt-1" style={{ color: point.evento.tipo === "positivo" ? "#10B981" : "#EF4444" }}>
          {point.evento.label}: {formatMXN(point.evento.monto)}
        </p>
      )}
      {point.ingresoRetiro !== undefined && (
        <p className="text-[#2DD4BF] text-xs mt-0.5">
          Ingresos retiro/año: {formatMXN(point.ingresoRetiro)}
        </p>
      )}
    </div>
  );
}

function EventDot(props: {
  cx?: number;
  cy?: number;
  payload?: TimelinePoint;
}) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload?.evento) return null;

  const isPositive = payload.evento.tipo === "positivo";
  const fill = isPositive ? "#F59E0B" : "#EF4444";

  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={fill} stroke="#060D1A" strokeWidth={2} />
      <text
        x={cx}
        y={cy - 14}
        textAnchor="middle"
        fill={fill}
        fontSize={9}
        fontWeight="bold"
      >
        {payload.evento.label}
      </text>
    </g>
  );
}

export function FinancialTimeline({
  edadActual,
  edadRetiro,
  edadDefuncion,
  patrimonioActual,
  ahorroMensual,
  tasaReal,
  pensionMensual,
  rentasMensuales,
  mensualidadDeseada,
  eventos = [],
  modo = "resultados",
  showMetrics = true,
  animate = true,
}: FinancialTimelineProps) {
  const input: TimelineInput = useMemo(
    () => ({
      edadActual,
      edadRetiro,
      edadDefuncion,
      patrimonioActual,
      ahorroMensual,
      tasaReal,
      pensionMensual,
      rentasMensuales,
      mensualidadDeseada,
      eventos,
    }),
    [
      edadActual,
      edadRetiro,
      edadDefuncion,
      patrimonioActual,
      ahorroMensual,
      tasaReal,
      pensionMensual,
      rentasMensuales,
      mensualidadDeseada,
      eventos,
    ]
  );

  const timeline = useMemo(() => calcularTimeline(input), [input]);

  const {
    puntos,
    pico,
    edadPico,
    legado,
    edadAgotamiento,
    gradoAvance,
    mensualidadPosible,
    deficit,
  } = timeline;

  const gradoColor =
    gradoAvance >= 1 ? "#10B981" : gradoAvance >= 0.7 ? "#F59E0B" : "#EF4444";
  const deficitColor = deficit <= 0 ? "#10B981" : "#EF4444";
  const deficitLabel = deficit <= 0 ? "Superávit" : "Déficit";
  const deficitValue = deficit <= 0 ? `+${formatMXN(Math.abs(deficit))}` : `-${formatMXN(deficit)}`;

  const isMini = modo === "mini";
  const isPresentation = modo === "presentacion";
  const shouldAnimate = animate && modo !== "simulador";

  // Build zone reference areas data
  const maxSaldo = pico * 1.1;

  return (
    <div className="space-y-3 w-full">
      {/* Header */}
      {!isMini && (
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-bold font-[family-name:var(--font-poppins)] text-[#F0F4FA] ${isPresentation ? "text-xl" : "text-sm"}`}>
              Línea de Tiempo Financiera
            </p>
            <p className={`font-[family-name:var(--font-open-sans)] text-[#8B9BB4] ${isPresentation ? "text-sm" : "text-xs"}`}>
              Tu vida financiera completa en una vista
            </p>
          </div>
          {edadAgotamiento && (
            <div className="px-3 py-1 rounded-full bg-[#EF4444]/15 text-[#EF4444] text-xs font-semibold">
              Se agota a los {Math.round(edadAgotamiento)} años
            </div>
          )}
        </div>
      )}

      {/* Metric Cards */}
      {showMetrics && !isMini && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <MetricCard
            label="Grado de avance"
            value={`${Math.round(gradoAvance * 100)}%`}
            color={gradoColor}
            animate={!shouldAnimate}
          />
          <MetricCard
            label="Mensualidad posible"
            value={formatMXN(mensualidadPosible + pensionMensual + rentasMensuales)}
            color="#C9A84C"
            animate={!shouldAnimate}
          />
          <MetricCard
            label={deficitLabel}
            value={deficitValue}
            color={deficitColor}
            animate={!shouldAnimate}
          />
          <MetricCard
            label="Legado estimado"
            value={formatMXN(legado)}
            color={legado > 0 ? "#10B981" : "#8B9BB4"}
            animate={!shouldAnimate}
          />
        </div>
      )}

      {/* Chart */}
      <div className={`w-full ${modeHeights[modo]}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={puntos}
            margin={{
              top: isPresentation ? 30 : 15,
              right: isPresentation ? 30 : 15,
              left: isPresentation ? 10 : 0,
              bottom: isPresentation ? 10 : 5,
            }}
          >
            <defs>
              <linearGradient id="tlAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1A3154" stopOpacity={0.6} />
                <stop offset="50%" stopColor="#1A3154" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1A3154" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="tlIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(90,106,133,0.08)"
              vertical={false}
            />

            <XAxis
              dataKey="edad"
              tick={{ fill: "#8B9BB4", fontSize: isPresentation ? 13 : 11 }}
              tickFormatter={(v) => `${v}`}
              axisLine={{ stroke: "rgba(90,106,133,0.15)" }}
              tickLine={false}
            />

            <YAxis
              tick={{ fill: "#8B9BB4", fontSize: isPresentation ? 12 : 10 }}
              tickFormatter={(v) =>
                v >= 1_000_000
                  ? `$${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1000
                  ? `$${Math.round(v / 1000)}K`
                  : `$${v}`
              }
              axisLine={false}
              tickLine={false}
              width={isPresentation ? 70 : 55}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "rgba(201,168,76,0.3)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            {/* Retirement reference line */}
            <ReferenceLine
              x={edadRetiro}
              stroke="#EF4444"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: `Retiro (${edadRetiro})`,
                position: "top",
                fill: "#EF4444",
                fontSize: isPresentation ? 12 : 10,
                fontWeight: "bold",
              }}
            />

            {/* Zero line if patrimony goes near zero */}
            {edadAgotamiento && (
              <ReferenceLine
                y={0}
                stroke="rgba(239,68,68,0.3)"
                strokeDasharray="4 4"
              />
            )}

            {/* Peak annotation */}
            {pico > 0 && !isMini && (
              <ReferenceLine
                x={Math.round(edadPico)}
                stroke="rgba(201,168,76,0.2)"
                strokeDasharray="2 4"
                label={{
                  value: `Pico: ${formatMXN(pico)}`,
                  position: "insideTopRight",
                  fill: "#C9A84C",
                  fontSize: 9,
                }}
              />
            )}

            {/* Retirement income line */}
            <Line
              type="monotone"
              dataKey="ingresoRetiro"
              stroke="#2DD4BF"
              strokeWidth={1.5}
              strokeDasharray="6 3"
              dot={false}
              connectNulls={false}
              isAnimationActive={shouldAnimate}
              animationDuration={1500}
            />

            {/* Main area */}
            <Area
              type="monotone"
              dataKey="saldo"
              stroke="#C9A84C"
              strokeWidth={2.5}
              fill="url(#tlAreaGradient)"
              dot={(props: { cx?: number; cy?: number; payload?: TimelinePoint; index?: number }) => {
                return <EventDot key={props.index} {...props} />;
              }}
              activeDot={{
                r: 5,
                stroke: "#C9A84C",
                strokeWidth: 2,
                fill: "#060D1A",
              }}
              isAnimationActive={shouldAnimate}
              animationDuration={2000}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {!isMini && (
        <div className="flex flex-wrap gap-4 justify-center text-[10px] text-[#8B9BB4]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#C9A84C] rounded" /> Patrimonio
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#2DD4BF] rounded border-b border-dashed border-[#2DD4BF]" /> Ingresos retiro
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#EF4444] rounded border-b border-dashed border-[#EF4444]" /> Línea retiro
          </span>
          {eventos.length > 0 && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Evento +
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Evento −
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export { calcularTimeline, type TimelineInput, type EventoVida };
