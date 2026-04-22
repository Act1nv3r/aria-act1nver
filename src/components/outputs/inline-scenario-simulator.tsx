"use client";

import { useState, useMemo, useCallback } from "react";
import { Sparkles, Save, CheckCircle2 } from "lucide-react";
import { calcularMotorC } from "@/lib/motors/motor-c";
import { formatMXN } from "@/lib/format-currency";
import { Slider } from "@/components/ui/slider";
import { TrayectoriaRetiroChart } from "@/components/outputs/trayectoria-retiro-chart";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";

interface BaseInput {
  patrimonio_financiero_total: number;
  saldo_esquemas: number;
  saldo_esquemas_pension?: number;
  saldo_esquemas_voluntarios?: number;
  ley_73: number | null;
  rentas: number;
  ingresos_negocio?: number;
  edad: number;
  edad_retiro: number;
  edad_defuncion: number;
  mensualidad_deseada: number;
}

interface Props {
  baseInput: BaseInput;
  motorCBase: ReturnType<typeof calcularMotorC>;
}

const PRESETS = [
  { label: "Conservador", aportacion: 0, edadRetiro: 68, tasa: 1 },
  { label: "Moderado", aportacion: 5000, edadRetiro: 65, tasa: 4 },
  { label: "Optimista", aportacion: 15000, edadRetiro: 62, tasa: 7 },
];

function DeltaChip({ base, simulated }: { base: number; simulated: number }) {
  const delta = simulated - base;
  const pct = base > 0 ? (delta / base) * 100 : 0;
  if (Math.abs(pct) < 0.5) return null;
  const positive = delta > 0;
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2"
      style={{ background: positive ? "#10B98120" : "#EF444420", color: positive ? "#10B981" : "#EF4444" }}
    >
      {positive ? "+" : ""}{pct.toFixed(0)}%
    </span>
  );
}

export function InlineScenarioSimulator({ baseInput, motorCBase }: Props) {
  const addSimulacion = useDiagnosticoStore((s) => s.addSimulacion);

  const [aportacion, setAportacion] = useState(0);
  const [edadRetiro, setEdadRetiro] = useState(baseInput.edad_retiro);
  const [tasa, setTasa] = useState(1);
  const [saved, setSaved] = useState(false);

  const motorCSim = useMemo(() => {
    const mesesAcum = Math.max((edadRetiro - baseInput.edad) * 12, 0);
    const patrimonioConAportacion = baseInput.patrimonio_financiero_total + aportacion * mesesAcum;
    return calcularMotorC({
      ...baseInput,
      patrimonio_financiero_total: patrimonioConAportacion,
      edad_retiro: edadRetiro,
      tasa_real_anual: tasa / 100,
    });
  }, [baseInput, aportacion, edadRetiro, tasa]);

  const applyPreset = useCallback((preset: typeof PRESETS[0]) => {
    setAportacion(preset.aportacion);
    setEdadRetiro(preset.edadRetiro);
    setTasa(preset.tasa);
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    addSimulacion({
      nombre: `Escenario ${new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`,
      params: {
        edad_retiro: edadRetiro,
        ahorro: aportacion,
        mensualidad_deseada: baseInput.mensualidad_deseada,
        tasa_real: tasa / 100,
        aportacion_extra: 0,
        venta_activo_edad: 0,
        venta_activo_monto: 0,
      },
      resultados: {
        grado_avance: motorCSim.grado_avance,
        mensualidad_posible: motorCSim.mensualidad_posible,
        deficit_mensual: motorCSim.deficit_mensual,
        saldo_inicio_jubilacion: motorCSim.saldo_inicio_jubilacion,
        pension_total_mensual: motorCSim.pension_total_mensual,
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [addSimulacion, edadRetiro, aportacion, baseInput.mensualidad_deseada, tasa, motorCSim]);

  const gradoPct = Math.min(motorCSim.grado_avance * 100, 100);
  const gradoColor = gradoPct >= 100 ? "#10B981" : gradoPct >= 60 ? "#C9A84C" : "#EF4444";

  return (
    <div className="bg-[#0A1525] border border-[#C9A84C]/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0C1829] to-[#162236] px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#C9A84C]" />
          <h3 className="text-sm font-bold text-white">¿Qué pasa si...?</h3>
        </div>
        {/* Preset buttons */}
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="text-[10px] font-semibold px-3 py-1 rounded-full border border-[#243555] text-[#8B9BB4] hover:border-[#C9A84C]/40 hover:text-[#C9A84C] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Sliders panel */}
        <div className="lg:w-2/5 p-6 border-b lg:border-b-0 lg:border-r border-white/[0.06] space-y-6">
          <Slider
            label="Aportación mensual adicional"
            min={0}
            max={50000}
            step={500}
            value={[aportacion]}
            onChange={(v) => { setAportacion(v[0] ?? 0); setSaved(false); }}
            formatValue={(v) => formatMXN(v)}
          />
          <Slider
            label="Edad de retiro"
            min={55}
            max={75}
            step={1}
            value={[edadRetiro]}
            onChange={(v) => { setEdadRetiro(v[0] ?? baseInput.edad_retiro); setSaved(false); }}
            formatValue={(v) => `${v} años`}
          />
          <Slider
            label="Rendimiento anual esperado"
            min={1}
            max={10}
            step={0.5}
            value={[tasa]}
            onChange={(v) => { setTasa(v[0] ?? 1); setSaved(false); }}
            formatValue={(v) => `${v}%`}
          />

          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all"
            style={
              saved
                ? { background: "#10B98118", borderColor: "#10B98140", color: "#10B981" }
                : { background: "#C9A84C18", borderColor: "#C9A84C40", color: "#C9A84C" }
            }
          >
            {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
            {saved ? "Escenario guardado" : "Guardar este escenario"}
          </button>
        </div>

        {/* Results panel */}
        <div className="lg:w-3/5 p-6 space-y-5">
          {/* Grado avance hero */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#5A6A85] uppercase tracking-wide">Avance hacia tu meta</span>
              <span className="text-xs text-[#5A6A85]">Base: {Math.round(motorCBase.grado_avance * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-[#243555] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${gradoPct}%`, background: gradoColor }}
                />
              </div>
              <span className="text-2xl font-bold transition-all duration-300" style={{ color: gradoColor }}>
                {Math.round(gradoPct)}%
                <DeltaChip base={motorCBase.grado_avance * 100} simulated={gradoPct} />
              </span>
            </div>
          </div>

          {/* 3 impact chips */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Mensualidad proyectada",
                base: motorCBase.mensualidad_posible + motorCBase.pension_total_mensual,
                sim: motorCSim.mensualidad_posible + motorCSim.pension_total_mensual,
              },
              {
                label: "Déficit / Surplus",
                base: motorCBase.deficit_mensual,
                sim: motorCSim.deficit_mensual,
                invert: true,
              },
              {
                label: "Saldo al retiro",
                base: motorCBase.saldo_inicio_jubilacion,
                sim: motorCSim.saldo_inicio_jubilacion,
              },
            ].map((item) => {
              const improved = item.invert ? item.sim < item.base : item.sim > item.base;
              return (
                <div key={item.label} className="bg-[#0C1829] border border-white/[0.06] rounded-xl p-3 text-center">
                  <p className="text-[9px] text-[#4A5A75] uppercase tracking-wide mb-1">{item.label}</p>
                  <p className="text-sm font-bold text-white">{formatMXN(Math.abs(item.sim))}</p>
                  {Math.abs(item.sim - item.base) > 100 && (
                    <p className="text-[10px] mt-0.5" style={{ color: improved ? "#10B981" : "#F97316" }}>
                      {improved ? "▲" : "▼"} {formatMXN(Math.abs(item.sim - item.base))}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mini chart */}
          <TrayectoriaRetiroChart
            saldoInicioJubilacion={motorCSim.saldo_inicio_jubilacion}
            pensionTotalMensual={motorCSim.pension_total_mensual}
            mensualidadDeseada={baseInput.mensualidad_deseada}
            edadRetiro={edadRetiro}
            edadDefuncion={baseInput.edad_defuncion}
            compact
            chartHeight={200}
          />
        </div>
      </div>
    </div>
  );
}
