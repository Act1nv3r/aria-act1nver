"use client";

import { calcularMotorB } from "@/lib/motors/motor-b";
import { calcularMotorC } from "@/lib/motors/motor-c";
import { calcularMotorE } from "@/lib/motors/motor-e";
import { calcularMotorD } from "@/lib/motors/motor-d";
import { formatMXN } from "@/lib/format-currency";

const NIVEL_LABELS: Record<string, string> = {
  suficiente: "Suficiente",
  mejor: "Mejor",
  bien: "Bien",
  genial: "Genial",
  "on-fire": "On Fire",
};
const NIVELES_ORDER = ["suficiente", "mejor", "bien", "genial", "on-fire"];

interface Props {
  motorB: ReturnType<typeof calcularMotorB>;
  motorC: ReturnType<typeof calcularMotorC>;
  motorE: ReturnType<typeof calcularMotorE>;
  motorD?: ReturnType<typeof calcularMotorD> | null;
  perfil: { edad: number; nombre: string };
  objetivos?: { aportacion_mensual: number } | null;
  mensualidad_deseada: number;
}

function TrackBadge({ niveles, actual }: { niveles: string[]; actual: string }) {
  const idx = niveles.indexOf(actual);
  return (
    <div className="flex gap-1 flex-wrap">
      {niveles.map((n, i) => (
        <span
          key={n}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            i === idx
              ? "bg-[#C9A96E] text-[#0F1E36] border-[#C9A96E]"
              : i < idx
              ? "bg-[#1C2B4A] text-[#C9A96E] border-[#243555]"
              : "bg-transparent text-[#4A5A75] border-[#243555]"
          }`}
        >
          {NIVEL_LABELS[n] ?? n}
        </span>
      ))}
    </div>
  );
}

export function ResumenEjecutivo({ motorB, motorC, motorE, motorD, perfil, objetivos, mensualidad_deseada }: Props) {
  const longevidad = motorB.longevidad_recursos;
  const edadHasta = perfil.edad + longevidad;

  // Apalancamiento
  const deudaRatio = motorE.activos_total > 0 ? motorE.pasivos_total / motorE.activos_total : 0;
  const deudaPct = Math.round(deudaRatio * 100);
  const excedente = motorE.potencial_apalancamiento - motorE.pasivos_total;

  // Aportación necesaria (from motor-c enriched)
  const aportacionNecesaria = motorC.aportacion_necesaria;
  const aportacionActual = objetivos?.aportacion_mensual ?? 0;
  const metaAlcanzada = motorC.grado_avance >= 1;

  // Legado
  const legado = motorD?.legado;

  // Clasificacion solvencia → deuda badge label
  const clasificacion = motorE.clasificacion_solvencia;
  let deudaBadgeColor = "text-green-400";
  if (clasificacion === "Elevado" || clasificacion === "Crítico") deudaBadgeColor = "text-red-400";
  else if (clasificacion === "Aceptable") deudaBadgeColor = "text-yellow-400";

  return (
    <div className="space-y-4">
      {/* A1 — Patrimonio Neto */}
      <div className="bg-[#162236] rounded-xl p-5 border border-[#243555]">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-widest mb-1">A1 — Nivel de Patrimonio</p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-3xl font-bold text-white">{formatMXN(motorE.patrimonio_neto)}</p>
            <p className="text-xs text-[#8899BB] mt-1">Patrimonio Neto · Nivel de acuerdo a etapa de vida</p>
          </div>
          <TrackBadge niveles={NIVELES_ORDER} actual={motorB.nivel_riqueza} />
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-[#8899BB]">
          <span>Benchmark para tu edad:</span>
          <span className="text-[#C9A96E] font-semibold">{motorB.ratio.toFixed(1)}x gastos anuales</span>
          <span className="ml-2">·</span>
          <span className="ml-2">Meta: {motorB.benchmark_para_edad.toFixed(0)}x</span>
        </div>
      </div>

      {/* A2 — Longevidad */}
      <div className="bg-[#0F1E36] rounded-xl p-5 border border-[#243555]">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-widest mb-2">A2 — Longevidad de Activos Financieros</p>
        <p className="text-sm text-white leading-relaxed">
          Con tu patrimonio actual puedes cubrir{" "}
          <span className="text-[#C9A96E] font-bold">{Math.round(longevidad)} años</span> de gastos.
          Esto te permite mantener tu nivel de vida hasta los{" "}
          <span className="text-[#C9A96E] font-bold">{Math.round(edadHasta)} años</span>.
        </p>
      </div>

      {/* A3 — Estructura del Patrimonio / Apalancamiento */}
      <div className="bg-[#162236] rounded-xl p-5 border border-[#243555]">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-widest mb-3">A3 — Estructura del Patrimonio (Apalancamiento)</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#0F1E36] rounded-lg p-3 text-center">
            <p className="text-[10px] text-[#8899BB] uppercase tracking-wide mb-1">Apalancamiento Actual</p>
            <p className="text-lg font-bold text-white">{formatMXN(motorE.pasivos_total)}</p>
          </div>
          <div className="bg-[#0F1E36] rounded-lg p-3 text-center">
            <p className="text-[10px] text-[#8899BB] uppercase tracking-wide mb-1">Potencial</p>
            <p className="text-lg font-bold text-[#C9A96E]">{formatMXN(motorE.potencial_apalancamiento)}</p>
          </div>
          <div className="bg-[#0F1E36] rounded-lg p-3 text-center">
            <p className="text-[10px] text-[#8899BB] uppercase tracking-wide mb-1">Excedente</p>
            <p className={`text-lg font-bold ${excedente >= 0 ? "text-green-400" : "text-red-400"}`}>{formatMXN(Math.abs(excedente))}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-[#8899BB]">Índice Deuda/Activos:</p>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-[#0F1E36] border border-[#243555] ${deudaBadgeColor}`}>
            {deudaPct}% — {clasificacion}
          </span>
        </div>
      </div>

      {/* A4 — Mapa Patrimonial / Aportación */}
      <div className="bg-[#162236] rounded-xl p-5 border border-[#243555]">
        <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-widest mb-3">A4 — Mapa Patrimonial · Retiro</p>
        {metaAlcanzada ? (
          <div className="bg-green-900/30 border border-green-600/40 rounded-lg p-4 text-center">
            <p className="text-green-400 font-bold text-base">¡Ya alcanzas tu meta de retiro!</p>
            <p className="text-xs text-[#8899BB] mt-1">Mensualidad posible: {formatMXN(motorC.mensualidad_posible + motorC.pension_total_mensual)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#8899BB]">Aportación mensual necesaria para alcanzar tu meta:</span>
              <span className="text-[#C9A96E] font-bold text-base">{aportacionNecesaria ? formatMXN(aportacionNecesaria) : "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#8899BB]">Aportación mensual actual:</span>
              <span className="text-white font-semibold">{formatMXN(aportacionActual)}</span>
            </div>
            <div className="h-2 bg-[#0F1E36] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C9A96E] rounded-full transition-all"
                style={{ width: `${Math.min(100, motorC.grado_avance * 100)}%` }}
              />
            </div>
            <p className="text-xs text-[#8899BB] text-right">{Math.round(motorC.grado_avance * 100)}% de avance hacia meta de {formatMXN(mensualidad_deseada)}/mes</p>
          </div>
        )}
      </div>

      {/* A5 — Sucesión */}
      {legado && legado > 0 && (
        <div className="bg-[#162236] rounded-xl p-5 border border-[#243555] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-widest mb-1">A5 — Sucesión</p>
            <p className="text-sm text-[#8899BB]">Legado patrimonial estimado</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{formatMXN(legado)}</p>
            <span className="text-xs px-2 py-0.5 bg-[#C9A96E]/20 text-[#C9A96E] rounded-full border border-[#C9A96E]/30">Blindaje Patrimonial</span>
          </div>
        </div>
      )}
    </div>
  );
}
