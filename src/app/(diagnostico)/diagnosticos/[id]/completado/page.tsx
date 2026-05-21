"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle, Save, Trash2, RotateCcw, Clock, ChevronDown, ChevronUp } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { BalanceResultsScreen } from "@/components/diagnostico/balance-results-screen";
import { useDiagnosticoStore, type SavedSimulation } from "@/stores/diagnostico-store";
import { useDiagnosticoId } from "@/contexts/diagnostico-context";
import { generarBalancePDF, generarDiagnosticoPDF } from "@/lib/pdf-generator";
import { api, getAccessToken } from "@/lib/api-client";
import { CompartirButton } from "./compartir-button";
import { BalancePDFTemplate } from "@/components/pdf/balance-pdf-template";
import { DiagnosticoPDFTemplate } from "@/components/pdf/diagnostico-pdf-template";
import {
  calcularMotorC,
  calcularMotorA,
  calcularMotorB,
  calcularMotorE,
  calcularMotorF,
} from "@/lib/motors";
import { calcularSaludFinanciera } from "@/lib/motors/salud-scores";
import { PARAMS } from "@/lib/constants";
import { GradoAvanceBar } from "@/components/outputs/grado-avance-bar";
import { DeficitCard } from "@/components/outputs/deficit-card";
import { FinancialTimeline, type EventoVida } from "@/components/outputs/financial-timeline";
import { TrayectoriaRetiroChart } from "@/components/outputs/trayectoria-retiro-chart";
import { RadarSaludFinanciera } from "@/components/outputs/radar-salud-financiera";
import { formatMXN } from "@/lib/format-currency";
import { HouseViewPanel } from "@/components/outputs/house-view-panel";

export default function CompletadoPage() {
  const params = useParams();
  const id = params?.id as string;
  const { isApiMode } = useDiagnosticoId();
  const searchParams = useSearchParams();
  const autoDownload = searchParams.get("autoDownload") === "true";

  const perfil = useDiagnosticoStore((s) => s.perfil);
  const modo = useDiagnosticoStore((s) => s.modo);
  const marcarDiagnosticoCompleto = useDiagnosticoStore((s) => s.marcarDiagnosticoCompleto);
  const currentClienteId = useDiagnosticoStore((s) => s.currentClienteId);
  const clienteId = searchParams.get("clienteId") ?? currentClienteId;

  const {
    flujoMensual,
    patrimonio,
    retiro,
    proteccion,
    simulaciones_guardadas,
    addSimulacion,
    removeSimulacion,
    guardarScoreSalud,
  } = useDiagnosticoStore();

  // ── Simulator state ──────────────────────────────────────────────
  const [saveLabel, setSaveLabel] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [view, setView] = useState<"salud" | "retiro">("salud");
  const [showSimulator, setShowSimulator] = useState(false);
  const [showHouseView, setShowHouseView] = useState(false);
  const [activeSection, setActiveSection] = useState("sec-patrimonio");

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
    liquidez: patrimonio?.liquidez ?? 0,
    inversiones: patrimonio?.inversiones ?? 0,
    dotales: patrimonio?.dotales ?? 0,
    afore: patrimonio?.afore ?? 0,
    ppr: patrimonio?.ppr ?? 0,
    plan_privado: patrimonio?.plan_privado ?? 0,
    seguros_retiro: patrimonio?.seguros_retiro ?? 0,
    ley_73: patrimonio?.ley_73 ?? null,
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
    const extraAcumulado = sliderValues.aportacion_extra;
    return calcularMotorC({
      ...motorCInput,
      liquidez: motorCInput.liquidez + extraAcumulado,
      edad_retiro: sliderValues.edad_retiro,
      mensualidad_deseada: sliderValues.mensualidad_deseada,
      tasa_real_anual: sliderValues.tasa_real / 100,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderValues, patrimonioFin]);

  const motorA = useMemo(
    () =>
      flujoMensual
        ? calcularMotorA({ ...flujoMensual, liquidez: patrimonio?.liquidez ?? 0 })
        : null,
    [flujoMensual, patrimonio]
  );

  const motorB = useMemo(
    () =>
      patrimonio && flujoMensual
        ? calcularMotorB({
            liquidez: patrimonio.liquidez,
            inversiones: patrimonio.inversiones,
            dotales: patrimonio.dotales,
            afore: patrimonio.afore,
            ppr: patrimonio.ppr,
            plan_privado: patrimonio.plan_privado,
            seguros_retiro: patrimonio.seguros_retiro,
            edad,
            gastos_basicos: flujoMensual.gastos_basicos,
            obligaciones: flujoMensual.obligaciones,
            creditos: flujoMensual.creditos,
          })
        : null,
    [patrimonio, flujoMensual, edad]
  );

  const motorE = useMemo(
    () =>
      patrimonio
        ? calcularMotorE({
            liquidez: patrimonio.liquidez,
            inversiones: patrimonio.inversiones,
            dotales: patrimonio.dotales,
            afore: patrimonio.afore,
            ppr: patrimonio.ppr,
            plan_privado: patrimonio.plan_privado,
            seguros_retiro: patrimonio.seguros_retiro,
            casa: patrimonio.casa,
            inmuebles_renta: patrimonio.inmuebles_renta,
            tierra: patrimonio.tierra,
            negocio: patrimonio.negocio,
            herencia: patrimonio.herencia,
            hipoteca: patrimonio.hipoteca,
            saldo_planes: patrimonio.saldo_planes,
            compromisos: patrimonio.compromisos,
          })
        : null,
    [patrimonio]
  );

  const motorF = useMemo(() => {
    if (!motorE || !proteccion || !perfil) return null;
    const inmuebles_total =
      (patrimonio?.casa ?? 0) +
      (patrimonio?.inmuebles_renta ?? 0) +
      (patrimonio?.tierra ?? 0);
    return calcularMotorF({
      seguro_vida: proteccion.seguro_vida ?? false,
      propiedades_aseguradas: proteccion.propiedades_aseguradas,
      sgmm: proteccion.sgmm ?? false,
      dependientes: perfil.dependientes ? 1 : 0,
      inversiones: patrimonio?.inversiones ?? 0,
      dotales: patrimonio?.dotales ?? 0,
      gastos_mensuales: (flujoBase.gastos_basicos) + (flujoBase.obligaciones) + (flujoBase.creditos),
      edad,
      inmuebles_total,
      rentas_mensuales: flujoBase.rentas,
    });
  }, [motorE, proteccion, perfil, patrimonio, edad, flujoBase]);

  const saludInput = useMemo(
    () => ({
      motorA,
      motorB,
      motorE,
      motorF,
      patrimonio: patrimonio
        ? {
            casa: patrimonio.casa,
            inmuebles_renta: patrimonio.inmuebles_renta,
            tierra: patrimonio.tierra,
            negocio: patrimonio.negocio,
            herencia: patrimonio.herencia,
          }
        : null,
      proteccion: proteccion ?? null,
      perfil: perfil ? { dependientes: perfil.dependientes } : null,
    }),
    [motorA, motorB, motorE, motorF, patrimonio, proteccion, perfil]
  );

  const saludBase = useMemo(
    () => calcularSaludFinanciera({ ...saludInput, motorC: resultadoBase }),
    [saludInput, resultadoBase]
  );

  const saludSimulado = useMemo(
    () => calcularSaludFinanciera({ ...saludInput, motorC: resultadoSimulado }),
    [saludInput, resultadoSimulado]
  );

  useEffect(() => {
    if (clienteId && saludBase.score_total > 0) {
      guardarScoreSalud(clienteId, saludBase.score_total);
    }
  }, [clienteId, saludBase.score_total, guardarScoreSalud]);

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

  // Venta de activo: pre-retiro → suma compuesta al saldo inicial;
  //                  post-retiro → inyección durante la trayectoria.
  const { saldoInicioConVenta, inyeccionesRetiro } = useMemo(() => {
    const base = resultadoSimulado.saldo_inicio_jubilacion;
    const { venta_activo_edad, venta_activo_monto, edad_retiro, tasa_real } = sliderValues;
    if (venta_activo_monto <= 0 || venta_activo_edad <= 0) {
      return { saldoInicioConVenta: base, inyeccionesRetiro: [] };
    }
    if (venta_activo_edad <= edad_retiro) {
      const anios = edad_retiro - venta_activo_edad;
      const montoCrecido = venta_activo_monto * Math.pow(1 + tasa_real / 100, anios);
      return { saldoInicioConVenta: base + montoCrecido, inyeccionesRetiro: [] };
    } else {
      return {
        saldoInicioConVenta: base,
        inyeccionesRetiro: [{ edad: venta_activo_edad, monto: venta_activo_monto, label: "Venta activo" }],
      };
    }
  }, [resultadoSimulado.saldo_inicio_jubilacion, sliderValues]);

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
        pension_fija_total: resultadoSimulado.pension_fija_total,
      },
    });
    setSaveLabel("");
    setShowSaveInput(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const loadSimulation = (sim: SavedSimulation) => {
    setSliderValues({ ...sim.params });
    document.getElementById("simulator-section")?.scrollIntoView({ behavior: "smooth" });
  };

  // ── Completado effects ────────────────────────────────────────────
  useEffect(() => {
    if (!id || id === "demo") return;
    marcarDiagnosticoCompleto(id, perfil?.nombre ?? "Cliente", modo);
    if (isApiMode) {
      api.diagnosticos.completar(id).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (autoDownload && perfil) {
      generarBalancePDF(
        perfil.nombre ?? "Cliente",
        isApiMode && id ? { diagnosticoId: id, token: getAccessToken() ?? undefined } : undefined
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDownload]);

  useEffect(() => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#C9A84C", "#10B981", "#1A3154"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#C9A84C", "#10B981", "#1A3154"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  useEffect(() => {
    const ids = [
      "sec-patrimonio","sec-resumen","sec-flujo","sec-retiro",
      "sec-potencial","sec-plan","sec-proteccion","simulator-section","houseview-section",
    ];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: "-10% 0px -70% 0px" }
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#060D1A]">

      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#C9A84C]/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative text-center py-16 px-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[24px] bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 border border-[#C9A84C]/30 mb-6">
            <CheckCircle className="w-10 h-10 text-[#C9A84C]" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-[#F0F4FA] mb-3">
            Diagnóstico completo
          </h1>
          <p className="text-[#8B9BB4] text-lg max-w-md mx-auto">
            {perfil?.nombre
              ? `${perfil.nombre}, aquí está tu análisis financiero integral.`
              : "Aquí está el análisis financiero integral."}
          </p>

          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <div className="flex gap-3 flex-wrap justify-center">
              <Button
                variant="accent"
                size="lg"
                onClick={() =>
                  generarDiagnosticoPDF(
                    perfil?.nombre ?? "Cliente",
                    isApiMode && id
                      ? { diagnosticoId: id, token: getAccessToken() ?? undefined }
                      : undefined
                  )
                }
              >
                Descarga tu Diagnóstico Financiero
              </Button>

              <Button
                variant="accent"
                size="lg"
                onClick={() =>
                  generarBalancePDF(
                    perfil?.nombre ?? "Cliente",
                    isApiMode && id
                      ? { diagnosticoId: id, token: getAccessToken() ?? undefined }
                      : undefined
                  )
                }
              >
                Descarga tu Balance Patrimonial
              </Button>
            </div>

            {isApiMode && id && (
              <CompartirButton diagnosticoId={id} />
            )}

            <Link href="/dashboard">
              <Button variant="ghost" size="lg">
                Mis Clientes
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky section nav */}
      <nav
        className="sticky top-0 z-40 border-b border-white/[0.06]"
        style={{ background: "rgba(6,13,26,0.95)", backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-[1600px] mx-auto px-6 flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {[
            { id: "sec-patrimonio",  label: "Patrimonio"    },
            { id: "sec-resumen",     label: "Resumen"       },
            { id: "sec-flujo",       label: "Flujo"         },
            { id: "sec-retiro",      label: "Retiro"        },
            { id: "sec-potencial",   label: "Solvencia"     },
            { id: "sec-plan",        label: "Plan de Acción"},
            { id: "sec-proteccion",  label: "Protección"    },
            { id: "simulator-section", label: "Simulador"   },
            { id: "houseview-section", label: "House View"  },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
              className={`shrink-0 py-4 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeSection === id
                  ? "text-[#C9A84C] border-[#C9A84C]"
                  : "text-[#5A6A85] border-transparent hover:text-[#8B9BB4]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Balance Results — full width command center */}
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pb-16">
        <BalanceResultsScreen />
      </div>

      {/* Simulator section */}
      <div id="simulator-section" className="border-t border-white/[0.06]" style={{ scrollMarginTop: "60px" }}>
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-8">

          {/* Teaser — always visible */}
          <div
            className="flex items-center justify-between gap-6 p-8 cursor-pointer transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(59,130,246,0.04) 100%)",
              border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: showSimulator ? "16px 16px 0 0" : "16px",
            }}
            onClick={() => setShowSimulator((v) => !v)}
          >
            <div>
              <h2 className="font-bold font-[family-name:var(--font-poppins)] text-[28px] text-white">
                Simula tu futuro
              </h2>
              <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85] mt-1 max-w-sm">
                Ajusta los parámetros de ahorro, retiro y tasa de rendimiento para ver cómo impactan en tu trayectoria patrimonial.
              </p>
            </div>
            <Button
              variant="accent"
              size="lg"
              style={{ whiteSpace: "nowrap" }}
              onClick={(e) => { e.stopPropagation(); setShowSimulator((v) => !v); }}
            >
              {showSimulator ? <><ChevronUp className="w-4 h-4" /> Cerrar</> : <><ChevronDown className="w-4 h-4" /> Abrir simulador</>}
            </Button>
          </div>

          {/* Expandable content */}
          {showSimulator && (
          <div
            className="px-8 py-8"
            style={{
              border: "1px solid rgba(201,168,76,0.15)",
              borderTop: "none",
              borderRadius: "0 0 16px 16px",
            }}
          >

          {/* Financial Timeline */}
          <div className="mb-8">
            <Card>
              <FinancialTimeline
                edadActual={edad}
                edadRetiro={sliderValues.edad_retiro}
                edadDefuncion={retiroBase.edad_defuncion}
                patrimonioActual={patrimonioFin + sliderValues.aportacion_extra}
                ahorroMensual={sliderValues.ahorro}
                tasaReal={sliderValues.tasa_real / 100}
                pensionMensual={patrimonio?.ley_73 ?? null}
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
                  onChange={(v) => setSliderValues((s) => ({ ...s, ahorro: v[0] }))}
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
                  onChange={(v) => setSliderValues((s) => ({ ...s, edad_retiro: v[0] }))}
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
                  onChange={(v) => setSliderValues((s) => ({ ...s, mensualidad_deseada: v[0] }))}
                  formatValue={(v) => formatMXN(v) + "/mes"}
                />
              </Card>

              <Card>
                <Slider
                  label="Tasa real anual"
                  min={0}
                  max={12}
                  step={0.5}
                  value={[sliderValues.tasa_real]}
                  onChange={(v) => setSliderValues((s) => ({ ...s, tasa_real: v[0] }))}
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
                  onChange={(v) => setSliderValues((s) => ({ ...s, aportacion_extra: v[0] }))}
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
                  onChange={(v) => setSliderValues((s) => ({
                    ...s,
                    venta_activo_edad: v[0],
                    venta_activo_monto: v[0] > 0 && s.venta_activo_monto === 0 ? 1_000_000 : s.venta_activo_monto,
                  }))}
                  formatValue={(v) => (v === 0 ? "Sin evento" : `${v} años`)}
                />
                {sliderValues.venta_activo_edad > 0 && (
                  <div className="mt-3">
                    <Slider
                      label="Venta de activo — Monto"
                      min={0}
                      max={20000000}
                      step={100000}
                      value={[sliderValues.venta_activo_monto]}
                      onChange={(v) => setSliderValues((s) => ({ ...s, venta_activo_monto: v[0] }))}
                      formatValue={(v) => {
                        const abs = Math.abs(v);
                        if (abs >= 1e9) return "$" + (abs / 1e9).toFixed(1) + "B";
                        if (abs >= 1e6) return "$" + (abs / 1e6).toFixed(1) + "M";
                        if (abs >= 1e3) return "$" + Math.round(abs / 1e3) + "K";
                        return "$" + Math.round(abs).toLocaleString("es-MX");
                      }}
                    />
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Results */}
            <div className="space-y-4">
              <div className="flex gap-1 p-1 bg-[#0A1628] rounded-xl border border-white/[0.06]">
                {(["salud", "retiro"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                      view === v
                        ? "bg-[#1A3154] text-[#F0F4FA]"
                        : "text-[#5A6A85] hover:text-[#8B9BB4]"
                    }`}
                  >
                    {v === "salud" ? "Salud Financiera" : "Trayectoria de Retiro"}
                  </button>
                ))}
              </div>

              {view === "salud" && (
                <Card>
                  <RadarSaludFinanciera
                    base={saludBase}
                    simulado={saludSimulado}
                    showComparison={saludSimulado.score_total !== saludBase.score_total}
                  />
                </Card>
              )}

              {view === "retiro" && (
                <div className="space-y-6">
                  <Card>
                    <GradoAvanceBar porcentaje={resultadoSimulado.grado_avance} />
                    <p
                      className={`mt-2 font-bold font-[family-name:var(--font-poppins)] text-xs ${
                        diffGrado >= 0 ? "text-[#317A70]" : "text-[#8B3A3A]"
                      }`}
                    >
                      {diffGrado >= 0 ? "▲" : "▼"} {Math.abs(diffGrado).toFixed(1)}% vs base
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
                    <DeficitCard
                      deficit={resultadoSimulado.deficit_mensual}
                      simuladorUrl="#simulator-section"
                    />
                  </Card>

                  <Card className="min-h-[380px]">
                    <TrayectoriaRetiroChart
                      saldoInicioJubilacion={saldoInicioConVenta}
                      pensionTotalMensual={resultadoSimulado.pension_fija_total}
                      mensualidadDeseada={sliderValues.mensualidad_deseada}
                      edadRetiro={sliderValues.edad_retiro}
                      edadDefuncion={retiroBase.edad_defuncion}
                      patrimonioFinancieroActual={patrimonioFin + sliderValues.aportacion_extra}
                      tasaRealAnual={sliderValues.tasa_real / 100}
                      inyecciones={inyeccionesRetiro}
                    />
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Simulator action bar */}
          <div className="flex flex-wrap items-center gap-3 mt-8">
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
                      if (e.key === "Enter" && saveLabel.trim()) handleSaveSimulation();
                      if (e.key === "Escape") { setShowSaveInput(false); setSaveLabel(""); }
                    }}
                    placeholder="Nombre de la simulación..."
                    className="bg-[#112038] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F0F4FA] placeholder:text-[#4A5A72] focus:outline-none focus:border-[#C9A84C]/60 w-[220px]"
                  />
                  <Button variant="accent" size="sm" onClick={handleSaveSimulation} disabled={!saveLabel.trim()}>
                    Guardar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setShowSaveInput(false); setSaveLabel(""); }}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button variant="accent" onClick={() => setShowSaveInput(true)}>
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
          )} {/* end showSimulator */}
        </div>
      </div>

      {/* House View section */}
      <div id="houseview-section" className="border-t border-white/[0.06]" style={{ scrollMarginTop: "60px" }}>
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div
            className="flex items-center justify-between gap-6 p-8 cursor-pointer transition-all"
            style={{
              background: "linear-gradient(135deg, rgba(201,168,76,0.05) 0%, rgba(59,130,246,0.04) 100%)",
              border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: showHouseView ? "16px 16px 0 0" : "16px",
            }}
            onClick={() => setShowHouseView((v) => !v)}
          >
            <div>
              <h2 className="font-bold font-[family-name:var(--font-poppins)] text-[28px] text-white">
                House View
              </h2>
              <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85] mt-1 max-w-sm">
                Perspectiva de mercado Actinver Análisis — objetivos de cierre 2026 para bolsas, divisas, tasas y materias primas.
              </p>
            </div>
            <Button
              variant="accent"
              size="lg"
              style={{ whiteSpace: "nowrap" }}
              onClick={(e) => { e.stopPropagation(); setShowHouseView((v) => !v); }}
            >
              {showHouseView ? <><ChevronUp className="w-4 h-4" /> Cerrar</> : <><ChevronDown className="w-4 h-4" /> Ver House View</>}
            </Button>
          </div>
          {showHouseView && (
            <div
              className="px-8 py-8"
              style={{
                border: "1px solid rgba(201,168,76,0.15)",
                borderTop: "none",
                borderRadius: "0 0 16px 16px",
              }}
            >
              <HouseViewPanel />
            </div>
          )}
        </div>
      </div>

      {/* Hidden PDF templates */}
      <div aria-hidden="true" style={{ position: "fixed", top: "-9999px", left: "-9999px", pointerEvents: "none", opacity: 0, zIndex: -1 }}>
        <BalancePDFTemplate />
        <DiagnosticoPDFTemplate />
      </div>

      {/* Sticky bottom bar */}
      <div
        className="sticky bottom-0 py-4 px-6 border-t border-white/[0.06]"
        style={{ background: "rgba(6,13,26,0.9)", backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-[1600px] mx-auto flex flex-wrap gap-3 justify-end">
          <Button
            variant="accent"
            size="sm"
            onClick={() =>
              generarBalancePDF(
                perfil?.nombre ?? "Cliente",
                isApiMode && id
                  ? { diagnosticoId: id, token: getAccessToken() ?? undefined }
                  : undefined
              )
            }
          >
            Descarga tu Balance Patrimonial
          </Button>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">← Mis Clientes</Button>
          </Link>
        </div>
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
    <Card
      className="group hover:border-[#C9A84C]/30 transition-all duration-300 cursor-pointer"
      onClick={onLoad}
    >
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
