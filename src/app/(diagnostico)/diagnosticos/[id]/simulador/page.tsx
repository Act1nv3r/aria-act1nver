"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDiagnosticoStore, type SavedSimulation } from "@/stores/diagnostico-store";
import { calcularMotorC } from "@/lib/motors";
import { PARAMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { GradoAvanceBar } from "@/components/outputs/grado-avance-bar";
import { DeficitCard } from "@/components/outputs/deficit-card";
import { FinancialTimeline, type EventoVida } from "@/components/outputs/financial-timeline";
import { TrayectoriaRetiroChart } from "@/components/outputs/trayectoria-retiro-chart";
import { formatMXN } from "@/lib/format-currency";
import { Save, Trash2, RotateCcw, ChevronLeft, Clock } from "lucide-react";

export default function SimuladorPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname?.split("/diagnosticos/")[1]?.split("/")[0] || "demo";
  const { perfil, flujoMensual, patrimonio, retiro, simulaciones_guardadas, addSimulacion, removeSimulacion } = useDiagnosticoStore();
  const [saveLabel, setSaveLabel] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const patrimonioFin =
    (patrimonio?.liquidez ?? 0) +
    (patrimonio?.inversiones ?? 0) +
    (patrimonio?.dotales ?? 0);
  const edad = perfil?.edad ?? 50;
  const retiroBase = retiro ?? {
    edad_retiro: 60,
    mensualidad_deseada: 50000,
    edad_defuncion: 90,
  };
  const flujoBase = flujoMensual ?? {
    ahorro: 50000,
    rentas: 10000,
    otros: 0,
    gastos_basicos: 40000,
    obligaciones: 20000,
    creditos: 0,
  };

  const [sliderValues, setSliderValues] = useState({
    edad_retiro: retiroBase.edad_retiro,
    ahorro: flujoBase.ahorro,
    mensualidad_deseada: retiroBase.mensualidad_deseada,
    tasa_real: PARAMS.TASA_REAL_ANUAL * 100,
    aportacion_extra: 0,
    venta_activo_edad: 0,
    venta_activo_monto: 0,
  });

  const motorCInput = {
    patrimonio_financiero_total: patrimonioFin,
    saldo_esquemas: 0,
    ley_73: patrimonio?.ley_73 ?? 35000,
    rentas: flujoBase.rentas,
    edad,
    edad_retiro: retiroBase.edad_retiro,
    edad_defuncion: retiroBase.edad_defuncion,
    mensualidad_deseada: retiroBase.mensualidad_deseada,
  };

  const resultadoBase = useMemo(
    () => calcularMotorC(motorCInput),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const resultadoSimulado = useMemo(() => {
    const patrimonioAjustado = patrimonioFin + sliderValues.aportacion_extra;
    return calcularMotorC({
      ...motorCInput,
      patrimonio_financiero_total: patrimonioAjustado,
      edad_retiro: sliderValues.edad_retiro,
      mensualidad_deseada: sliderValues.mensualidad_deseada,
      tasa_real_anual: sliderValues.tasa_real / 100,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderValues, patrimonioFin]);

  const resetValues = () => {
    setSliderValues({
      edad_retiro: retiroBase.edad_retiro,
      ahorro: flujoBase.ahorro,
      mensualidad_deseada: retiroBase.mensualidad_deseada,
      tasa_real: PARAMS.TASA_REAL_ANUAL * 100,
      aportacion_extra: 0,
      venta_activo_edad: 0,
      venta_activo_monto: 0,
    });
  };

  const diffGrado =
    (resultadoSimulado.grado_avance - resultadoBase.grado_avance) * 100;

  const eventos: EventoVida[] = useMemo(() => {
    const evts: EventoVida[] = [];
    if (sliderValues.venta_activo_edad > 0 && sliderValues.venta_activo_monto > 0) {
      evts.push({
        edad: sliderValues.venta_activo_edad,
        monto: sliderValues.venta_activo_monto,
        label: "Venta activo",
        tipo: "positivo",
      });
    }
    if (sliderValues.aportacion_extra > 0) {
      evts.push({
        edad,
        monto: sliderValues.aportacion_extra,
        label: "Aportación extra",
        tipo: "positivo",
      });
    }
    return evts;
  }, [sliderValues.venta_activo_edad, sliderValues.venta_activo_monto, sliderValues.aportacion_extra, edad]);

  const handleSaveSimulation = () => {
    if (!saveLabel.trim()) return;
    addSimulacion({
      nombre: saveLabel.trim(),
      params: { ...sliderValues },
      resultados: {
        grado_avance: resultadoSimulado.grado_avance,
        mensualidad_posible: resultadoSimulado.mensualidad_posible,
        deficit_mensual: resultadoSimulado.deficit_mensual,
        saldo_inicio_jubilacion: resultadoSimulado.saldo_inicio_jubilacion,
        pension_total_mensual: resultadoSimulado.pension_total_mensual,
      },
    });
    setSaveLabel("");
    setShowSaveInput(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const loadSimulation = (sim: SavedSimulation) => {
    setSliderValues({ ...sim.params });
  };

  return (
    <div className="min-h-screen bg-[#060D1A]">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-8">
      <div className="mb-8">
        <h1 className="font-bold font-[family-name:var(--font-poppins)] text-[28px] text-white">
          Simula tu futuro
        </h1>
        <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85] mt-1">
          Mueve los controles y observa cómo cambia tu retiro
        </p>
      </div>

      {/* Financial Timeline Hero — full width */}
      <div className="mb-8">
        <Card>
          <FinancialTimeline
            edadActual={edad}
            edadRetiro={sliderValues.edad_retiro}
            edadDefuncion={retiroBase.edad_defuncion}
            patrimonioActual={patrimonioFin + sliderValues.aportacion_extra}
            ahorroMensual={sliderValues.ahorro}
            tasaReal={sliderValues.tasa_real / 100}
            pensionMensual={patrimonio?.ley_73 ?? 35000}
            rentasMensuales={flujoBase.rentas}
            mensualidadDeseada={sliderValues.mensualidad_deseada}
            eventos={eventos}
            modo="simulador"
            showMetrics={true}
            animate={false}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Sliders */}
        <div className="space-y-6">
          <Card>
            <Slider
              label="Ahorro mensual"
              min={0}
              max={Math.max(flujoBase.ahorro * 3, 200000)}
              step={5000}
              value={[sliderValues.ahorro]}
              onChange={(v) =>
                setSliderValues((s) => ({ ...s, ahorro: v[0] }))
              }
              formatValue={(v) => formatMXN(v) + "/mes"}
            />
            <p className="mt-1 font-[family-name:var(--font-open-sans)] text-[11px] text-[#5A6A85]">
              Base: {formatMXN(flujoBase.ahorro)}/mes
            </p>
          </Card>

          <Card>
            <Slider
              label="Edad de retiro"
              min={edad + 1}
              max={70}
              step={1}
              value={[sliderValues.edad_retiro]}
              onChange={(v) =>
                setSliderValues((s) => ({ ...s, edad_retiro: v[0] }))
              }
              formatValue={(v) => `${v} años`}
            />
            <p className="mt-1 font-[family-name:var(--font-open-sans)] text-[11px] text-[#5A6A85]">
              Base: {retiroBase.edad_retiro} años
            </p>
          </Card>

          <Card>
            <Slider
              label="Mensualidad deseada en retiro"
              min={10000}
              max={200000}
              step={5000}
              value={[sliderValues.mensualidad_deseada]}
              onChange={(v) =>
                setSliderValues((s) => ({
                  ...s,
                  mensualidad_deseada: v[0],
                }))
              }
              formatValue={(v) => formatMXN(v) + "/mes"}
            />
          </Card>

          <Card>
            <Slider
              label="Tasa real anual"
              min={0}
              max={5}
              step={0.5}
              value={[sliderValues.tasa_real]}
              onChange={(v) =>
                setSliderValues((s) => ({ ...s, tasa_real: v[0] }))
              }
              formatValue={(v) => `${v}%`}
            />
          </Card>

          <Card>
            <Slider
              label="Aportación extra única"
              min={0}
              max={5000000}
              step={100000}
              value={[sliderValues.aportacion_extra]}
              onChange={(v) =>
                setSliderValues((s) => ({ ...s, aportacion_extra: v[0] }))
              }
              formatValue={(v) => formatMXN(v)}
            />
            <p className="mt-1 font-[family-name:var(--font-open-sans)] text-[11px] text-[#5A6A85]">
              Un monto adicional que podrías invertir hoy
            </p>
          </Card>

          <Card>
            <Slider
              label="Venta de activo — Edad"
              min={0}
              max={retiroBase.edad_defuncion}
              step={1}
              value={[sliderValues.venta_activo_edad]}
              onChange={(v) =>
                setSliderValues((s) => ({ ...s, venta_activo_edad: v[0] }))
              }
              formatValue={(v) => (v === 0 ? "Sin evento" : `${v} años`)}
            />
            {sliderValues.venta_activo_edad > 0 && (
              <div className="mt-3">
                <Slider
                  label="Venta de activo — Monto"
                  min={0}
                  max={10000000}
                  step={100000}
                  value={[sliderValues.venta_activo_monto]}
                  onChange={(v) =>
                    setSliderValues((s) => ({ ...s, venta_activo_monto: v[0] }))
                  }
                  formatValue={(v) => formatMXN(v)}
                />
              </div>
            )}
          </Card>
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          <Card>
            <GradoAvanceBar porcentaje={resultadoSimulado.grado_avance} />
            <p
              className={`mt-2 font-bold font-[family-name:var(--font-poppins)] text-xs ${
                diffGrado >= 0 ? "text-[#317A70]" : "text-[#8B3A3A]"
              }`}
            >
              {diffGrado >= 0 ? "▲" : "▼"} {Math.abs(diffGrado).toFixed(1)}% vs
              base
            </p>
          </Card>

          <Card>
            <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
              Mensualidad posible
            </p>
            <p className="font-bold font-[family-name:var(--font-poppins)] text-[28px] text-white">
              {formatMXN(resultadoSimulado.mensualidad_posible)}
            </p>
          </Card>

          <Card>
            <DeficitCard deficit={resultadoSimulado.deficit_mensual} />
          </Card>

          <Card className="min-h-[380px]">
            <TrayectoriaRetiroChart
              saldoInicioJubilacion={resultadoSimulado.saldo_inicio_jubilacion}
              pensionTotalMensual={resultadoSimulado.pension_total_mensual}
              mensualidadDeseada={sliderValues.mensualidad_deseada}
              edadRetiro={sliderValues.edad_retiro}
              edadDefuncion={retiroBase.edad_defuncion}
              patrimonioFinancieroActual={patrimonioFin + sliderValues.aportacion_extra}
              tasaRealAnual={sliderValues.tasa_real / 100}
            />
          </Card>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3 mt-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/diagnosticos/${id}/presentacion`)}
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al balance
        </Button>
        <Button variant="outline" onClick={resetValues}>
          <RotateCcw className="w-3.5 h-3.5" />
          Resetear valores
        </Button>

        <div className="ml-auto flex items-center gap-2">
          {showSaveInput ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={saveLabel}
                onChange={(e) => setSaveLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && saveLabel.trim()) {
                    handleSaveSimulation();
                  }
                  if (e.key === "Escape") {
                    setShowSaveInput(false);
                    setSaveLabel("");
                  }
                }}
                placeholder="Nombre de la simulación..."
                className="bg-[#112038] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F0F4FA] placeholder:text-[#4A5A72] focus:outline-none focus:border-[#C9A84C]/60 w-[220px]"
              />
              <Button
                variant="accent"
                size="sm"
                onClick={handleSaveSimulation}
                disabled={!saveLabel.trim()}
              >
                Guardar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowSaveInput(false); setSaveLabel(""); }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="accent"
              onClick={() => setShowSaveInput(true)}
            >
              <Save className="w-4 h-4" />
              {justSaved ? "¡Guardada!" : "Guardar simulación"}
            </Button>
          )}
        </div>
      </div>

      {/* Saved simulations */}
      {simulaciones_guardadas.length > 0 && (
        <div className="mt-10">
          <h2 className="font-bold text-lg text-[#F0F4FA] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#C9A84C]" />
            Simulaciones guardadas ({simulaciones_guardadas.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {simulaciones_guardadas.map((sim) => (
              <SavedSimulationCard
                key={sim.id}
                sim={sim}
                onLoad={() => loadSimulation(sim)}
                onDelete={() => removeSimulacion(sim.id)}
              />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function SavedSimulationCard({
  sim,
  onLoad,
  onDelete,
}: {
  sim: SavedSimulation;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const avancePct = (sim.resultados.grado_avance * 100).toFixed(0);
  const dateStr = new Date(sim.created_at).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <Card className="group hover:border-[#C9A84C]/30 transition-all duration-300 cursor-pointer" onClick={onLoad}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-[#F0F4FA] truncate">{sim.nombre}</h4>
            <p className="text-[11px] text-[#5A6A85] mt-0.5">{dateStr}</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg text-[#5A6A85] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors shrink-0"
            title="Eliminar simulación"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[#5A6A85]">Grado avance</span>
            <p className={`font-bold ${Number(avancePct) >= 100 ? "text-[#10B981]" : Number(avancePct) >= 70 ? "text-[#C9A84C]" : "text-[#EF4444]"}`}>
              {avancePct}%
            </p>
          </div>
          <div>
            <span className="text-[#5A6A85]">Mensualidad</span>
            <p className="font-bold text-[#F0F4FA]">{formatMXN(sim.resultados.mensualidad_posible)}</p>
          </div>
          <div>
            <span className="text-[#5A6A85]">Retiro a</span>
            <p className="font-bold text-[#F0F4FA]">{sim.params.edad_retiro} años</p>
          </div>
          <div>
            <span className="text-[#5A6A85]">Déficit</span>
            <p className={`font-bold ${sim.resultados.deficit_mensual < 0 ? "text-[#EF4444]" : "text-[#10B981]"}`}>
              {formatMXN(Math.abs(sim.resultados.deficit_mensual))}
            </p>
          </div>
        </div>

        <p className="text-[10px] text-[#5A6A85] text-center group-hover:text-[#C9A84C] transition-colors">
          Toca para cargar esta simulación
        </p>
      </div>
    </Card>
  );
}
