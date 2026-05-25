"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useDiagnosticoStore, type SavedSimulation } from "@/stores/diagnostico-store";
import {
  calcularMotorA,
  calcularMotorB,
  calcularMotorC,
  calcularMotorE,
  calcularMotorF,
} from "@/lib/motors";
import { calcularSaludFinanciera } from "@/lib/motors/salud-scores";
import { calcularTimeline } from "@/lib/calcular-timeline";
import { PARAMS } from "@/lib/constants";
import { HouseViewPanel } from "@/components/outputs/house-view-panel";
import { FinancialTimeline, type EventoVida } from "@/components/outputs/financial-timeline";
import { TrayectoriaRetiroChart } from "@/components/outputs/trayectoria-retiro-chart";
import { RadarSaludFinanciera } from "@/components/outputs/radar-salud-financiera";
import { GradoAvanceBar } from "@/components/outputs/grado-avance-bar";
import { DeficitCard } from "@/components/outputs/deficit-card";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { formatMXN } from "@/lib/format-currency";
import { Save, Trash2, RotateCcw, Clock, ChevronDown, ChevronUp } from "lucide-react";

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtMXN(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n < 0 ? "−" : "") + "$" + (abs / 1e9).toFixed(1) + "B";
  if (abs >= 1e6) return (n < 0 ? "−" : "") + "$" + (abs / 1e6).toFixed(1) + "M";
  if (abs >= 1e3) return (n < 0 ? "−" : "") + "$" + Math.round(abs / 1e3) + "K";
  return (n < 0 ? "−" : "") + "$" + Math.round(abs).toLocaleString("es-MX");
}

function fmtFull(n: number): string {
  return "$" + Math.round(Math.abs(n)).toLocaleString("es-MX");
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

// ── Donut SVG ─────────────────────────────────────────────────────────────────

const CIRCUM = 2 * Math.PI * 70; // r=70 → ≈ 439.8

interface DonutSegment {
  color: string;
  value: number;
  label: string;
}

function DonutChart({ segments, total }: { segments: DonutSegment[]; total: number }) {
  const totalVal = segments.reduce((s, d) => s + Math.max(0, d.value), 0);
  let offset = 0;
  return (
    <svg width={200} height={200} viewBox="0 0 200 200" style={{ flexShrink: 0 }}>
      <circle cx={100} cy={100} r={70} fill="none" stroke="#1A2840" strokeWidth={28} />
      {segments.map((seg, i) => {
        if (seg.value <= 0) return null;
        const len = (seg.value / totalVal) * CIRCUM;
        const el = (
          <circle
            key={i}
            cx={100} cy={100} r={70}
            fill="none"
            stroke={seg.color}
            strokeWidth={28}
            strokeDasharray={`${len.toFixed(1)} ${(CIRCUM - len).toFixed(1)}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 100 100)"
          />
        );
        offset += len;
        return el;
      })}
      <text x={100} y={95} textAnchor="middle" fill="#F0F4FA" fontSize={13} fontWeight={700} fontFamily="system-ui">Total</text>
      <text x={100} y={113} textAnchor="middle" fill="#C9A84C" fontSize={11} fontWeight={600} fontFamily="system-ui">{fmtMXN(total)}</text>
    </svg>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

type BadgeVariant = "gold" | "green" | "red" | "blue" | "amber";
const BADGE_STYLES: Record<BadgeVariant, string> = {
  gold:  "bg-[rgba(201,168,76,0.15)]  text-[#C9A84C]",
  green: "bg-[rgba(16,185,129,0.15)]  text-[#10B981]",
  red:   "bg-[rgba(239,68,68,0.15)]   text-[#EF4444]",
  blue:  "bg-[rgba(59,130,246,0.15)]  text-[#3B82F6]",
  amber: "bg-[rgba(245,158,11,0.15)]  text-[#F59E0B]",
};

function Badge({ variant, children }: { variant: BadgeVariant; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-[11px] font-bold ${BADGE_STYLES[variant]}`}>
      {children}
    </span>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="mb-16" style={{ scrollMarginTop: 60 }}>
      {children}
    </div>
  );
}

function SectionHeader({ tag, title, subtitle }: { tag: string; title: string; subtitle: string }) {
  return (
    <div className="mb-7 pb-4 border-b border-white/[0.06]">
      <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[2.5px] uppercase text-[#C9A84C] mb-1.5">
        <span>{tag}</span><span>─</span>
      </div>
      <h2 className="text-[22px] font-bold text-[#F0F4FA]">{title}</h2>
      <p className="text-[13px] text-[#8B9BB4] mt-0.5">{subtitle}</p>
    </div>
  );
}

// ── Nivel riqueza label ───────────────────────────────────────────────────────

const NIVEL_MAP: Record<string, string> = {
  "critico": "Crítico",
  "insuficiente": "Insuficiente",
  "básico": "Básico",
  "suficiente": "Suficiente",
  "bueno": "Bueno",
  "muy_bueno": "Muy Bueno",
  "excelente": "Excelente",
  "genial": "Genial",
};

function nivelLabel(n: string): string {
  return NIVEL_MAP[n.toLowerCase()] ?? n;
}

function nivelColor(n: string): string {
  const l = n.toLowerCase();
  if (["genial", "excelente"].includes(l)) return "#C9A84C";
  if (["muy_bueno", "bueno"].includes(l)) return "#10B981";
  if (["suficiente"].includes(l)) return "#F59E0B";
  return "#EF4444";
}

// ── Riesgo badge for Plan de Acción ──────────────────────────────────────────

function riesgoBadge(nivel: "Bajo" | "Medio" | "Alto") {
  const v = nivel === "Bajo" ? "green" : nivel === "Medio" ? "amber" : "red";
  return <Badge variant={v as BadgeVariant}>{nivel}</Badge>;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface BalanceResultsScreenV2Props {
  nombre?: string;
  backHref?: string;
  onDownloadBalance?: () => void;
  onDownloadDiagnostico?: () => void;
}

export function BalanceResultsScreenV2({
  nombre,
  backHref,
  onDownloadBalance,
  onDownloadDiagnostico,
}: BalanceResultsScreenV2Props) {
  const perfil      = useDiagnosticoStore((s) => s.perfil);
  const flujo       = useDiagnosticoStore((s) => s.flujoMensual);
  const patrimonio  = useDiagnosticoStore((s) => s.patrimonio);
  const retiro      = useDiagnosticoStore((s) => s.retiro);
  const objetivos   = useDiagnosticoStore((s) => s.objetivos);
  const proteccion  = useDiagnosticoStore((s) => s.proteccion);

  const [showSimulador, setShowSimulador] = useState(false);
  const [showHouseView, setShowHouseView] = useState(false);
  const [activeNav, setActiveNav] = useState("patrimonio");

  // Simulator state
  const [simView, setSimView] = useState<"salud" | "retiro">("salud");
  const [saveLabel, setSaveLabel] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const {
    simulaciones_guardadas,
    addSimulacion,
    removeSimulacion,
    guardarScoreSalud,
  } = useDiagnosticoStore();

  // ── Motors ──────────────────────────────────────────────────────────────────
  const motors = useMemo(() => {
    if (!perfil || !flujo || !patrimonio) return null;

    const motorA = calcularMotorA({
      ahorro: flujo.ahorro,
      rentas: flujo.rentas,
      otros: flujo.otros,
      gastos_basicos: flujo.gastos_basicos,
      obligaciones: flujo.obligaciones,
      creditos: flujo.creditos,
      liquidez: patrimonio.liquidez,
    });

    const motorB = calcularMotorB({
      liquidez: patrimonio.liquidez,
      inversiones: patrimonio.inversiones,
      dotales: patrimonio.dotales,
      afore: patrimonio.afore,
      ppr: patrimonio.ppr,
      plan_privado: patrimonio.plan_privado,
      seguros_retiro: patrimonio.seguros_retiro,
      edad: perfil.edad,
      gastos_basicos: flujo.gastos_basicos,
      obligaciones: flujo.obligaciones,
      creditos: flujo.creditos,
    });

    const motorE = calcularMotorE(patrimonio);

    const patrimonioFin = patrimonio.liquidez + patrimonio.inversiones + patrimonio.dotales;

    const motorC = retiro
      ? calcularMotorC({
          liquidez: patrimonio.liquidez,
          inversiones: patrimonio.inversiones,
          dotales: patrimonio.dotales,
          afore: patrimonio.afore,
          ppr: patrimonio.ppr,
          plan_privado: patrimonio.plan_privado,
          seguros_retiro: patrimonio.seguros_retiro,
          ley_73: patrimonio.ley_73,
          rentas: flujo.rentas,
          edad: perfil.edad,
          edad_retiro: retiro.edad_retiro,
          edad_defuncion: retiro.edad_defuncion,
          mensualidad_deseada: retiro.mensualidad_deseada,
        })
      : null;

    const motorF = proteccion
      ? calcularMotorF({
          seguro_vida: proteccion.seguro_vida ?? false,
          propiedades_aseguradas: proteccion.propiedades_aseguradas,
          sgmm: proteccion.sgmm ?? false,
          dependientes: perfil.dependientes ? 1 : 0,
          inversiones: patrimonio.inversiones,
          dotales: patrimonio.dotales,
          gastos_mensuales: flujo.gastos_basicos + flujo.obligaciones + flujo.creditos,
          edad: perfil.edad,
          inmuebles_total: patrimonio.casa + patrimonio.inmuebles_renta,
          rentas_mensuales: flujo.rentas,
        })
      : null;

    return { motorA, motorB, motorC, motorE, motorF };
  }, [perfil, flujo, patrimonio, retiro, objetivos, proteccion]);

  // ── Simulator calculations ───────────────────────────────────────────────────
  const edad = perfil?.edad ?? 50;
  const retiroBase = retiro ?? { edad_retiro: 65, mensualidad_deseada: 50000, edad_defuncion: 90 };
  const flujoBase = flujo ?? { ahorro: 30000, rentas: 0, otros: 0, gastos_basicos: 30000, obligaciones: 0, creditos: 0 };
  const patrimonioFin = (patrimonio?.liquidez ?? 0) + (patrimonio?.inversiones ?? 0) + (patrimonio?.dotales ?? 0);

  const [sliderValues, setSliderValues] = useState(() => ({
    edad_retiro: retiroBase.edad_retiro,
    ahorro: flujoBase.ahorro,
    mensualidad_deseada: retiroBase.mensualidad_deseada,
    tasa_real: PARAMS.TASA_REAL_ANUAL * 100,
    aportacion_extra: 0,
    aportacion_extra_edad: 0, // 0 = sin evento
    venta_activo_edad: 0,
    venta_activo_monto: 0,
    inicio_rendimientos: 0,
    ahorro_rango: null as [number, number] | null,
  }));

  const motorCBaseInput = {
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resultadoBase = useMemo(() => calcularMotorC(motorCBaseInput), []);

  const resultadoSimulado = useMemo(() => {
    const { aportacion_extra, aportacion_extra_edad, edad_retiro, tasa_real } = sliderValues;
    // Si la aportación ocurre antes del retiro, la componemos al capital inicial
    let extraCompuesto = 0;
    if (aportacion_extra > 0 && aportacion_extra_edad > 0 && aportacion_extra_edad <= edad_retiro) {
      const anios = edad_retiro - aportacion_extra_edad;
      extraCompuesto = aportacion_extra * Math.pow(1 + tasa_real / 100, anios);
    }
    return calcularMotorC({
      ...motorCBaseInput,
      liquidez: motorCBaseInput.liquidez + extraCompuesto,
      edad_retiro,
      mensualidad_deseada: sliderValues.mensualidad_deseada,
      tasa_real_anual: tasa_real / 100,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sliderValues, patrimonioFin]);

  const saludInput = useMemo(() => ({
    motorA: motors?.motorA ?? null,
    motorB: motors?.motorB ?? null,
    motorE: motors?.motorE ?? null,
    motorF: motors?.motorF ?? null,
    patrimonio: patrimonio ? {
      casa: patrimonio.casa,
      inmuebles_renta: patrimonio.inmuebles_renta,
      tierra: patrimonio.tierra,
      negocio: patrimonio.negocio,
      herencia: patrimonio.herencia,
    } : null,
    proteccion: proteccion ?? null,
    perfil: perfil ? { dependientes: perfil.dependientes } : null,
  }), [motors, patrimonio, proteccion, perfil]);

  const saludBase = useMemo(
    () => calcularSaludFinanciera({ ...saludInput, motorC: resultadoBase }),
    [saludInput, resultadoBase]
  );
  const saludSimulado = useMemo(
    () => calcularSaludFinanciera({ ...saludInput, motorC: resultadoSimulado }),
    [saludInput, resultadoSimulado]
  );

  const eventos: EventoVida[] = useMemo(() => {
    const evts: EventoVida[] = [];
    if (sliderValues.venta_activo_edad > 0 && sliderValues.venta_activo_monto > 0) {
      evts.push({ edad: sliderValues.venta_activo_edad, monto: sliderValues.venta_activo_monto, label: "Venta activo", tipo: "positivo" });
    }
    if (sliderValues.aportacion_extra > 0 && sliderValues.aportacion_extra_edad > 0) {
      evts.push({ edad: sliderValues.aportacion_extra_edad, monto: sliderValues.aportacion_extra, label: "Aportación extra", tipo: "positivo" });
    }
    return evts;
  }, [sliderValues.venta_activo_edad, sliderValues.venta_activo_monto, sliderValues.aportacion_extra, sliderValues.aportacion_extra_edad, edad]);

  // Calcula el saldo al momento del retiro usando el mismo motor que la FinancialTimeline.
  // Esto incluye: ahorro mensual con rango, inicio de rendimientos, todos los eventos de vida.
  const { saldoInicioConVenta, inyeccionesRetiro, ahorroPostRetiro, ahorroHastaEdad, tlSimulado, componentesRetiro } = useMemo(() => {
    const { edad_retiro, tasa_real, ahorro, ahorro_rango } = sliderValues;
    const rangoAhorro: [number, number] = ahorro_rango ?? [edad, edad_retiro];

    const commonInput = {
      edadActual: edad,
      edadRetiro: edad_retiro,
      edadDefuncion: retiroBase.edad_defuncion,
      patrimonioActual: patrimonioFin,
      tasaReal: tasa_real / 100,
      edadInicioRendimientos: sliderValues.inicio_rendimientos > 0 ? sliderValues.inicio_rendimientos : undefined,
      pensionMensual: patrimonio?.ley_73 ?? null,
      rentasMensuales: flujoBase.rentas,
      mensualidadDeseada: sliderValues.mensualidad_deseada,
    };

    // Full timeline (all components active)
    const tl = calcularTimeline({ ...commonInput, ahorroMensual: ahorro, rangoAhorro, eventos });

    // For component breakdown: run incremental timelines to isolate each contribution
    const tlSoloBase = calcularTimeline({ ...commonInput, ahorroMensual: 0, eventos: [] });

    const ventaEventos = eventos.filter((e) => e.label === "Venta activo");
    const extraEventos = eventos.filter((e) => e.label === "Aportación extra");

    const tlConAhorro = calcularTimeline({ ...commonInput, ahorroMensual: ahorro, rangoAhorro, eventos: [] });
    const tlConVenta  = calcularTimeline({ ...commonInput, ahorroMensual: ahorro, rangoAhorro, eventos: ventaEventos });

    const compBase   = tlSoloBase.saldoRetiro;
    const compAhorro = Math.max(0, tlConAhorro.saldoRetiro - compBase);
    const compVenta  = Math.max(0, tlConVenta.saldoRetiro  - tlConAhorro.saldoRetiro);
    const compExtra  = Math.max(0, tl.saldoRetiro           - tlConVenta.saldoRetiro);

    // Post-retiro: eventos que ocurren después del retiro se pasan como inyecciones tipadas
    const inyecciones = eventos
      .filter((ev) => ev.edad > edad_retiro && ev.monto > 0)
      .map((ev) => ({
        edad: ev.edad,
        monto: ev.monto,
        label: ev.label,
        tipo: (ev.label === "Venta activo" ? "venta" : "extra") as "venta" | "extra",
      }));

    // Ahorro mensual que continúa en la fase de retiro
    const ahorroPost = ahorro > 0 && rangoAhorro[1] > edad_retiro ? ahorro : 0;
    const hastaEdad  = rangoAhorro[1];

    return {
      saldoInicioConVenta: tl.saldoRetiro,
      inyeccionesRetiro: inyecciones,
      ahorroPostRetiro: ahorroPost,
      ahorroHastaEdad: hastaEdad,
      tlSimulado: tl,
      componentesRetiro: { base: compBase, ahorro: compAhorro, venta: compVenta, extra: compExtra },
    };
  }, [sliderValues, edad, patrimonioFin, retiroBase.edad_defuncion, patrimonio?.ley_73, flujoBase.rentas, eventos]);

  // Línea base para comparar el delta del simulador
  const tlBase = useMemo(() => calcularTimeline({
    edadActual: edad,
    edadRetiro: retiroBase.edad_retiro,
    edadDefuncion: retiroBase.edad_defuncion,
    patrimonioActual: patrimonioFin,
    ahorroMensual: flujoBase.ahorro,
    tasaReal: PARAMS.TASA_REAL_ANUAL,
    pensionMensual: patrimonio?.ley_73 ?? null,
    rentasMensuales: flujoBase.rentas,
    mensualidadDeseada: retiroBase.mensualidad_deseada,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  const diffGrado = (tlSimulado.gradoAvance - tlBase.gradoAvance) * 100;

  const resetValues = () => setSliderValues({
    edad_retiro: retiroBase.edad_retiro,
    ahorro: flujoBase.ahorro,
    mensualidad_deseada: retiroBase.mensualidad_deseada,
    tasa_real: PARAMS.TASA_REAL_ANUAL * 100,
    aportacion_extra: 0,
    aportacion_extra_edad: 0,
    venta_activo_edad: 0,
    venta_activo_monto: 0,
    inicio_rendimientos: 0,
    ahorro_rango: null,
  });

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
    setSaveLabel(""); setShowSaveInput(false);
    setJustSaved(true); setTimeout(() => setJustSaved(false), 2000);
  };

  const loadSimulation = (sim: SavedSimulation) => {
    setSliderValues((prev) => ({ ...prev, ...sim.params }));
    document.getElementById("simulador")?.scrollIntoView({ behavior: "smooth" });
  };

  // ── Active nav on scroll ─────────────────────────────────────────────────────
  useEffect(() => {
    const ids = ["patrimonio", "resumen", "flujo", "retiro", "plan", "proteccion", "simulador", "houseview"];
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveNav(e.target.id); });
      },
      { threshold: 0.4 }
    );
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  if (!motors || !perfil || !flujo || !patrimonio) {
    return (
      <div className="text-center py-20 text-[#4A5A75]">
        <p className="text-lg">Completa el diagnóstico para ver los resultados</p>
      </div>
    );
  }

  const { motorA, motorB, motorC, motorE, motorF } = motors;
  const clienteNombre = nombre ?? perfil.nombre ?? "Cliente";
  const initials = clienteNombre.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const edadActual = perfil.edad;
  const edadRetiro = retiro?.edad_retiro ?? 65;
  const edadFin    = retiro?.edad_defuncion ?? 85;
  const mensDeseada = retiro?.mensualidad_deseada ?? 0;

  // Pasivos breakdown (for balance grid)
  const pat = patrimonio as unknown as Record<string, number>;
  const hipoteca      = pat.hipoteca      ?? flujo.obligaciones ?? 0;
  const saldo_planes  = pat.saldo_planes  ?? 0;
  const compromisos   = pat.compromisos   ?? flujo.creditos ?? 0;

  // Donut segments
  const donutSegs: DonutSegment[] = [
    { color: "#C9A84C", value: patrimonio.liquidez,      label: "Liquidez" },
    { color: "#3B82F6", value: patrimonio.inversiones + patrimonio.dotales, label: "Inversiones" },
    { color: "#8B5CF6", value: patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado + patrimonio.seguros_retiro, label: "Retiro" },
    { color: "#0EA5E9", value: patrimonio.casa + patrimonio.inmuebles_renta + patrimonio.tierra, label: "Bienes Raíces" },
    { color: "#10B981", value: patrimonio.negocio + patrimonio.herencia, label: "Productivos" },
  ].filter((s) => s.value > 0);

  const indice_solvencia_pct = motorE.indice_solvencia * 100;
  const deuda_activos_pct    = motorE.activos_total > 0
    ? (motorE.pasivos_total / motorE.activos_total) * 100
    : 0;

  const longevidad_anos = Math.round(motorB.longevidad_recursos / 12);

  // ─── Métricas adicionales PO ─────────────────────────────────────────────
  // Índice de liquidez CORRECTO: (liquidez + inversiones) / total_obligaciones
  const total_obligaciones = hipoteca + saldo_planes + compromisos;
  const indice_liquidez_correcto = total_obligaciones > 0
    ? (patrimonio.liquidez + patrimonio.inversiones) / total_obligaciones
    : null;
  // Bolsa de emergencia: meses de gastos cubiertos por liquidez
  const bolsa_emergencia_meses = flujo.gastos_basicos > 0
    ? patrimonio.liquidez / flujo.gastos_basicos
    : 0;
  // Mostrar Capacidad de Retiro solo si hay meta definida
  const tieneMetaRetiro = mensDeseada > 0;

  // Trayectoria curva (bar chart data)
  const curvaPorAnio = motorC ? (() => {
    const data: { edad: number; saldo: number }[] = [];
    if (!motorC.curva.length) return data;
    const edadMin = motorC.curva[0].edad;
    const edadMax = motorC.curva[motorC.curva.length - 1].edad;
    for (let age = Math.round(edadMin); age <= Math.round(edadMax); age++) {
      const pto = motorC.curva.find((p) => Math.round(p.edad) === age);
      if (pto) data.push({ edad: age, saldo: pto.saldo });
    }
    return data.slice(0, 21); // max 21 años
  })() : [];

  const maxSaldo = curvaPorAnio.length
    ? Math.max(...curvaPorAnio.map((d) => Math.abs(d.saldo)))
    : 1;

  // Fuentes stacked bars (from motorC.curva)
  const fuentesData = motorC ? (() => {
    const data: { edad: number; pension: number; voluntarios: number; rentas: number; patrimonio: number }[] = [];
    const edadMin = motorC.curva[0]?.edad ?? edadRetiro;
    const edadMax = motorC.curva[motorC.curva.length - 1]?.edad ?? edadFin;
    for (let age = Math.round(edadMin); age <= Math.round(edadMax); age++) {
      const pto = motorC.curva.find((p) => Math.round(p.edad) === age);
      if (pto) {
        data.push({
          edad: age,
          pension: Math.max(0, pto.pension_mensual),
          voluntarios: Math.max(0, pto.voluntarios_mensual),
          rentas: Math.max(0, pto.rentas_mensual),
          patrimonio: Math.max(0, pto.patrimonio_retiro),
        });
      }
    }
    return data.slice(0, 21);
  })() : [];

  const maxFuente = fuentesData.length
    ? Math.max(...fuentesData.map((d) => d.pension + d.voluntarios + d.rentas + d.patrimonio))
    : 1;


  // ── Plan de Acción rows (derived from motors) ────────────────────────────────
  const planRows = useMemo(() => {
    const rows: { area: string; situacion: string; riesgo: "Bajo" | "Medio" | "Alto"; rec: string }[] = [];

    const meses = motorA.meses_cubiertos ?? 0;
    rows.push({
      area: "Liquidez",
      situacion: `Reserva de ${fmtMXN(patrimonio.liquidez)} cubre ${Math.round(meses)} meses de gastos básicos`,
      riesgo: meses >= 3 ? "Bajo" : "Alto",
      rec: meses >= 3
        ? "Mantener nivel. Considerar optimizar rendimiento de excedente con fondos de corto plazo."
        : "Incrementar reserva de emergencia a un mínimo de 3 meses de gastos básicos.",
    });

    if (motorC) {
      const avance = motorC.grado_avance;
      rows.push({
        area: "Retiro",
        situacion: `Avance del ${pct(avance)} hacia meta. ${motorC.deficit_mensual > 0 ? `Brecha de ${fmtMXN(motorC.deficit_mensual)}/mes` : "Meta cubierta"}`,
        riesgo: avance >= 1 ? "Bajo" : avance >= 0.7 ? "Medio" : "Alto",
        rec: avance >= 1
          ? "Trayectoria en curso. Mantener aportaciones y revisar anualmente."
          : `Incrementar aportación mensual para cerrar brecha de ${fmtMXN(Math.abs(motorC.deficit_mensual))}/mes.`,
      });
    }

    if (proteccion != null) {
      const sinVida = !(proteccion.seguro_vida);
      rows.push({
        area: "Protección de Vida",
        situacion: sinVida
          ? "Sin seguro de vida vigente con dependientes activos"
          : "Seguro de vida vigente",
        riesgo: sinVida && (perfil.dependientes ?? false) ? "Alto" : sinVida ? "Medio" : "Bajo",
        rec: sinVida
          ? `Contratar seguro de vida por monto equivalente a 5 años de ingreso (${fmtMXN(motorA.ingresos_totales * 60)} cobertura).`
          : "Verificar vigencia y montos de cobertura anualmente.",
      });

      const sinProp = !(proteccion.propiedades_aseguradas);
      if (patrimonio.casa > 0 || patrimonio.inmuebles_renta > 0) {
        rows.push({
          area: "Bienes Raíces",
          situacion: sinProp
            ? `Propiedades sin cobertura verificada (${fmtMXN(patrimonio.casa + patrimonio.inmuebles_renta)} en riesgo)`
            : "Propiedades aseguradas",
          riesgo: sinProp ? "Medio" : "Bajo",
          rec: sinProp
            ? "Verificar coberturas de inmuebles. Evaluar seguro de daños para todos los activos."
            : "Revisar coberturas periódicamente y actualizar valores asegurados.",
        });
      }
    }

    if (patrimonio.inversiones > 0) {
      rows.push({
        area: "Inversiones",
        situacion: `Cartera financiera de ${fmtMXN(patrimonio.inversiones + patrimonio.dotales)}`,
        riesgo: "Medio",
        rec: "Diversificar hacia instrumentos de renta fija y alternativos acordes al horizonte de inversión.",
      });
    }

    if (motorE.patrimonio_neto > 0) {
      rows.push({
        area: "Sucesión",
        situacion: `Patrimonio proyectado de ${fmtMXN(motorE.patrimonio_neto)} sin testamento confirmado`,
        riesgo: "Alto",
        rec: "Formalizar testamento y fideicomiso para transmisión eficiente del patrimonio. Revisar beneficiarios.",
      });
    }

    return rows;
  }, [motorA, motorC, motorE, patrimonio, proteccion, perfil]);

  // ── Composition bar widths ────────────────────────────────────────────────────
  const totalComp  = motorE.activos_total || 1;
  const liqPct     = (patrimonio.liquidez / totalComp) * 100;
  const invPct     = ((patrimonio.inversiones + patrimonio.dotales) / totalComp) * 100;
  const retPct     = ((patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado + patrimonio.seguros_retiro) / totalComp) * 100;
  const realPct    = ((patrimonio.casa + patrimonio.inmuebles_renta + patrimonio.tierra) / totalComp) * 100;
  const prodPct    = ((patrimonio.negocio + patrimonio.herencia) / totalComp) * 100;
  const pasivoPct  = (motorE.pasivos_total / totalComp) * 100;

  // Nav items
  const NAV_ITEMS = [
    { id: "patrimonio", label: "Patrimonio" },
    { id: "resumen",    label: "Resumen" },
    { id: "flujo",      label: "Flujo" },
    { id: "retiro",     label: "Retiro" },
    { id: "plan",       label: "Plan de Acción" },
    { id: "proteccion", label: "Protección" },
    { id: "simulador",  label: "Simulador" },
    { id: "houseview",  label: "House View" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#060D1A", color: "#F0F4FA", fontFamily: "-apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif", WebkitFontSmoothing: "antialiased" }}>

      {/* ── STICKY NAV ─────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-40 border-b"
        style={{ background: "rgba(6,13,26,0.92)", backdropFilter: "blur(20px) saturate(1.6)", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 flex items-center overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {backHref && (
            <a
              href={backHref}
              className="shrink-0 flex items-center gap-1.5 mr-3 py-[14px] pr-4 border-r border-white/[0.06] text-[12px] font-semibold text-[#8B9BB4] hover:text-[#F0F4FA] transition-colors whitespace-nowrap"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0"><path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Mis Clientes
            </a>
          )}
          <span className="whitespace-nowrap text-[11px] font-bold tracking-[2px] uppercase text-[#8B9BB4] py-[14px] pr-[18px] mr-2 border-r border-white/[0.06] shrink-0">
            Actinver · Banca Privada
          </span>
          {NAV_ITEMS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={() => setActiveNav(id)}
              className={`px-[18px] py-[14px] text-[12px] font-semibold whitespace-nowrap border-b-2 transition-colors shrink-0 ${
                activeNav === id
                  ? "text-[#C9A84C] border-[#C9A84C]"
                  : "text-[#4A5A72] border-transparent hover:text-[#F0F4FA]"
              }`}
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pb-20">

        {/* ── TOP CLIENT BAR ─────────────────────────────────────────────────── */}
        <div className="pt-5 mb-0 flex justify-between items-center">
          <div className="flex items-center gap-[14px]">
            <div
              className="w-11 h-11 rounded-[12px] flex items-center justify-center font-extrabold text-[16px] text-[#C9A84C]"
              style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)" }}
            >
              {initials}
            </div>
            <div>
              <div className="text-[18px] font-bold text-[#F0F4FA]">{clienteNombre}</div>
              <div className="text-[12px] text-[#8B9BB4] mt-0.5">
                {edadActual} años · Diagnóstico completado hoy
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {onDownloadDiagnostico && (
              <button
                onClick={onDownloadDiagnostico}
                className="flex items-center gap-1.5 px-[18px] py-[9px] rounded-[9px] text-[13px] font-semibold text-[#8B9BB4] transition-colors hover:text-white"
                style={{ border: "1px solid rgba(255,255,255,0.10)" }}
              >
                ⬇ Diagnóstico PDF
              </button>
            )}
            {onDownloadBalance && (
              <button
                onClick={onDownloadBalance}
                className="flex items-center gap-1.5 px-[18px] py-[9px] rounded-[9px] text-[13px] font-semibold transition-colors"
                style={{ background: "#C9A84C", color: "#060D1A" }}
              >
                ⬇ Balance Patrimonial
              </button>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* HERO — PATRIMONIO NETO                                              */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <div
          id="patrimonio"
          className="relative py-12 border-b mb-14 overflow-hidden"
          style={{ borderColor: "rgba(255,255,255,0.06)", scrollMarginTop: 60 }}
        >
          {/* Radial glow */}
          <div className="pointer-events-none absolute" style={{ top: -80, left: "50%", transform: "translateX(-50%)", width: 700, height: 400, background: "radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 70%)" }} />

          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-[6px] h-[6px] rounded-full bg-[#10B981]" style={{ boxShadow: "0 0 8px #10B981" }} />
            <span className="text-[11px] font-bold tracking-[3px] uppercase text-[#8B9BB4]">
              Patrimonio Neto · Al día de hoy
            </span>
          </div>

          <div className="font-extrabold leading-none mb-1.5 tabular-nums" style={{ fontSize: "clamp(44px,6vw,72px)", letterSpacing: -2 }}>
            {fmtFull(motorE.patrimonio_neto)}{" "}
            <span className="text-[0.5em] font-semibold text-[#8B9BB4] tracking-normal">MXN</span>
          </div>
          <div className="text-[14px] text-[#8B9BB4] mb-9">
            Activos totales {fmtMXN(motorE.activos_total)}&nbsp;·&nbsp;Obligaciones {fmtMXN(motorE.pasivos_total)}
          </div>

          {/* 3 KPIs strip — Corto plazo · Acumulación · Retiro */}
          <div
            className="grid overflow-hidden"
            style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}
          >
            {/* Horizonte 1 — Corto plazo: Bolsa de Emergencia */}
            <div className="px-5 py-4" style={{ background: "#0C1829" }}>
              <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-[#4A5A72] mb-1.5">Bolsa de Emergencia</div>
              <div className="text-[20px] font-bold leading-none tabular-nums" style={{ color: bolsa_emergencia_meses >= 3 ? "#10B981" : "#F59E0B" }}>
                {bolsa_emergencia_meses.toFixed(1)} meses
              </div>
              <div className="text-[11px] text-[#8B9BB4] mt-0.5">
                {bolsa_emergencia_meses >= 3 ? "Cubierta ✓" : "Reforzar — meta: 3 meses"}
              </div>
            </div>
            {/* Horizonte 2 — Acumulación: Longevidad de activos */}
            <div className="px-5 py-4" style={{ background: "#0C1829" }}>
              <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-[#4A5A72] mb-1.5">Longevidad de Activos</div>
              <div className="text-[20px] font-bold leading-none tabular-nums text-[#F0F4FA]">
                {longevidad_anos} años
              </div>
              <div className="text-[11px] text-[#8B9BB4] mt-0.5">Hasta los {edadActual + longevidad_anos} años</div>
            </div>
            {/* Horizonte 3 — Retiro: Capacidad de Retiro */}
            <div className="px-5 py-4" style={{ background: "#0C1829" }}>
              <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-[#4A5A72] mb-1.5">Capacidad de Retiro</div>
              {tieneMetaRetiro && motorC ? (
                <>
                  <div className="text-[20px] font-bold leading-none tabular-nums" style={{ color: motorC.grado_avance >= 1 ? "#10B981" : "#F59E0B" }}>
                    {pct(motorC.grado_avance)}
                  </div>
                  <div className="text-[11px] text-[#8B9BB4] mt-0.5">Meta {fmtMXN(mensDeseada)}/mes</div>
                </>
              ) : (
                <>
                  <div className="text-[20px] font-bold leading-none tabular-nums text-[#4A5A72]">—</div>
                  <div className="text-[11px] text-[#8B9BB4] mt-0.5">Definir meta de retiro</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* C — DIAGNÓSTICO PATRIMONIAL                                         */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <Section id="patrimonio-detalle">
          <SectionHeader tag="C" title="Diagnóstico Patrimonial" subtitle="Composición detallada de activos, pasivos y patrimonio neto" />

          {/* Balance 3 columnas */}
          <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>

            {/* Activos Financieros */}
            <div>
              <div className="text-[10px] font-bold tracking-[2px] uppercase px-4 py-2.5 rounded-t-[8px] mb-px" style={{ background: "rgba(201,168,76,0.08)", color: "#C9A84C" }}>
                Activos Financieros
              </div>
              <div className="flex flex-col gap-px">
                {[
                  { label: "Ahorro / Liquidez", val: patrimonio.liquidez },
                  { label: "Inversiones",        val: patrimonio.inversiones },
                  { label: "Dotales",            val: patrimonio.dotales },
                  { label: "AFORE",              val: patrimonio.afore },
                  { label: "PPR",                val: patrimonio.ppr },
                  { label: "Plan Privado",       val: patrimonio.plan_privado },
                  { label: "Seguros Retiro",     val: patrimonio.seguros_retiro },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center px-4 py-2.5 text-[13px]" style={{ background: "#0C1829" }}>
                    <span className="text-[#8B9BB4]">{row.label}</span>
                    <span className="font-semibold tabular-nums" style={{ color: row.val > 0 ? "#F0F4FA" : "#4A5A72" }}>{fmtFull(row.val)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center px-4 py-3 mt-px rounded-b-[8px] font-bold text-[14px] tabular-nums" style={{ background: "rgba(201,168,76,0.10)", color: "#C9A84C" }}>
                <span>Total Financiero</span><span>{fmtMXN(motorE.financiero)}</span>
              </div>
            </div>

            {/* Activos No Financieros */}
            <div>
              <div className="text-[10px] font-bold tracking-[2px] uppercase px-4 py-2.5 rounded-t-[8px] mb-px" style={{ background: "rgba(59,130,246,0.08)", color: "#3B82F6" }}>
                Activos No Financieros
              </div>
              <div className="flex flex-col gap-px">
                {[
                  { label: "Casa Principal",      val: patrimonio.casa },
                  { label: "Inmuebles en Renta",  val: patrimonio.inmuebles_renta },
                  { label: "Tierra",              val: patrimonio.tierra },
                  { label: "Negocio",             val: patrimonio.negocio },
                  { label: "Herencia Esperada",   val: patrimonio.herencia },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center px-4 py-2.5 text-[13px]" style={{ background: "#0C1829" }}>
                    <span className="text-[#8B9BB4]">{row.label}</span>
                    <span className="font-semibold tabular-nums" style={{ color: row.val > 0 ? "#F0F4FA" : "#4A5A72" }}>{fmtFull(row.val)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center px-4 py-3 mt-px rounded-b-[8px] font-bold text-[14px] tabular-nums" style={{ background: "rgba(59,130,246,0.10)", color: "#3B82F6" }}>
                <span>Total No Financiero</span><span>{fmtMXN(motorE.no_financiero)}</span>
              </div>
            </div>

            {/* Pasivos */}
            <div>
              <div className="text-[10px] font-bold tracking-[2px] uppercase px-4 py-2.5 rounded-t-[8px] mb-px" style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444" }}>
                Obligaciones
              </div>
              <div className="flex flex-col gap-px">
                {(() => {
                  const rows = [
                    { label: "Hipoteca",          val: hipoteca },
                    { label: "Planes / Seguros",  val: saldo_planes },
                    { label: "Otros Compromisos", val: compromisos },
                  ].filter(r => r.val > 0);
                  if (rows.length === 0) {
                    return (
                      <div className="px-4 py-3 text-[12px] text-[#4A5A72] italic" style={{ background: "#0C1829" }}>
                        Sin obligaciones registradas
                      </div>
                    );
                  }
                  return rows.map((row, i) => (
                    <div key={i} className="flex justify-between items-center px-4 py-2.5 text-[13px]" style={{ background: "#0C1829" }}>
                      <span className="text-[#8B9BB4]">{row.label}</span>
                      <span className="font-semibold tabular-nums" style={{ color: "#EF4444" }}>{fmtFull(row.val)}</span>
                    </div>
                  ));
                })()}
              </div>
              <div className="flex justify-between items-center px-4 py-3 mt-px rounded-[8px] font-bold text-[14px] tabular-nums" style={{ background: "rgba(239,68,68,0.10)", color: "#EF4444" }}>
                <span>Total Obligaciones</span><span>{fmtMXN(motorE.pasivos_total)}</span>
              </div>
              {/* Patrimonio Neto inline */}
              <div className="mt-3 px-4 py-3.5 rounded-[8px]" style={{ background: "rgba(201,168,76,0.12)" }}>
                <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#C9A84C] mb-1">Patrimonio Neto</div>
                <div className="text-[22px] font-extrabold text-[#C9A84C] tabular-nums" style={{ letterSpacing: -0.5 }}>{fmtMXN(motorE.patrimonio_neto)}</div>
                <div className="text-[10px] text-[#4A5A72] mt-0.5">Activos {fmtMXN(motorE.activos_total)} − Oblig. {fmtMXN(motorE.pasivos_total)}</div>
              </div>
            </div>
          </div>

          {/* Barra de composición */}
          <div className="rounded-[16px] p-6 border mb-4" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="mb-3.5">
              <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#C9A84C] mb-2.5">Estructura del patrimonio</div>
              <div className="h-2 rounded-full overflow-hidden flex" style={{ background: "#112038" }}>
                {liqPct  > 0 && <div style={{ width: `${liqPct}%`,   background: "#C9A84C", opacity: 0.9 }} title="Liquidez" />}
                {invPct  > 0 && <div style={{ width: `${invPct}%`,   background: "#3B82F6", opacity: 0.85 }} title="Inversiones" />}
                {retPct  > 0 && <div style={{ width: `${retPct}%`,   background: "#8B5CF6", opacity: 0.85 }} title="Retiro" />}
                {realPct > 0 && <div style={{ width: `${realPct}%`,  background: "#0EA5E9", opacity: 0.80 }} title="Patrimoniales" />}
                {prodPct > 0 && <div style={{ width: `${prodPct}%`,  background: "#10B981", opacity: 0.80 }} title="Productivos" />}
                {pasivoPct > 0 && <div style={{ width: `${pasivoPct}%`, background: "#EF4444", opacity: 0.70 }} title="Obligaciones" />}
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                {[
                  { color: "#C9A84C", label: `Liquidez ${liqPct.toFixed(0)}%` },
                  { color: "#3B82F6", label: `Inversiones ${invPct.toFixed(0)}%` },
                  { color: "#8B5CF6", label: `Retiro ${retPct.toFixed(0)}%` },
                  { color: "#0EA5E9", label: `Patrimoniales ${realPct.toFixed(0)}%` },
                  { color: "#10B981", label: `Productivos ${prodPct.toFixed(0)}%` },
                  { color: "#EF4444", label: `Obligaciones −${pasivoPct.toFixed(0)}%` },
                ].map((leg, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-[#8B9BB4]">
                    <div className="w-2 h-2 rounded-[2px]" style={{ background: leg.color }} />
                    {leg.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Donut + leyenda */}
            <div className="grid gap-8 mt-2 items-center" style={{ gridTemplateColumns: "200px 1fr" }}>
              <DonutChart segments={donutSegs} total={motorE.activos_total} />
              <div className="flex flex-col gap-2.5">
                {donutSegs.map((seg, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-[13px]">
                    <div className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: seg.color }} />
                    <span className="flex-1 text-[#8B9BB4]">{seg.label}</span>
                    <span className="font-semibold tabular-nums" style={{ color: seg.color }}>{fmtFull(seg.value)}</span>
                    <span className="text-[11px] text-[#4A5A72] w-[38px] text-right">{((seg.value / motorE.activos_total) * 100).toFixed(1)}%</span>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t flex justify-between items-baseline" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <span className="text-[11px] text-[#4A5A72]">Índice de Solvencia</span>
                  <span className="text-[16px] font-bold" style={{ color: indice_solvencia_pct >= 70 ? "#10B981" : "#F59E0B" }}>
                    {indice_solvencia_pct.toFixed(1)}%{" "}
                    <span className="text-[11px] font-normal">{motorE.clasificacion_solvencia}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* D — FLUJO DISPONIBLE                                                */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <Section id="flujo">
          <SectionHeader tag="D" title="Fuentes de Flujo Disponible" subtitle="Análisis de ingresos, gastos y capacidad de inversión mensual" />

          {/* Estado de resultados + Breakdown lado a lado */}
          <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="rounded-[14px] border overflow-hidden" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
              {[
                { label: "Ingresos Totales",         val: fmtFull(motorA.ingresos_totales), color: "#C9A84C", sub: "mensual" },
                { label: "Gastos Totales",            val: `− ${fmtFull(motorA.gastos_totales)}`, color: "#EF4444", sub: `${motorA.ingresos_totales > 0 ? ((motorA.gastos_totales / motorA.ingresos_totales) * 100).toFixed(0) : 0}% de ingresos` },
                { label: "Disponible para Inversión", val: fmtFull(motorA.remanente), color: "#10B981", sub: `${motorA.ingresos_totales > 0 ? ((motorA.remanente / motorA.ingresos_totales) * 100).toFixed(0) : 0}% de ingresos`, highlight: true },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center px-6 py-4 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.06)", background: row.highlight ? "#112038" : "transparent" }}>
                  <div className="text-[14px]" style={{ color: row.highlight ? "#F0F4FA" : "#8B9BB4", fontWeight: row.highlight ? 700 : 400 }}>{row.label}</div>
                  <div className="text-right">
                    <div className="text-[18px] font-bold tabular-nums" style={{ color: row.color }}>{row.val}</div>
                    <div className="text-[11px] text-[#4A5A72] mt-0.5">{row.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Breakdown: Disponible Activo + Disponible Pasivo */}
            <div className="flex flex-col gap-3">
              {[
                {
                  label: "Disponible Activo",
                  sub: "Actividad principal (trabajo)",
                  val: motorA.ingreso_disponible_activo,
                  color: "#C9A84C",
                  pct: motorA.remanente > 0 ? motorA.ingreso_disponible_activo / motorA.remanente : 0,
                },
                {
                  label: "Disponible Pasivo",
                  sub: "Rentas + Negocio (otras fuentes)",
                  val: motorA.ingreso_disponible_pasivo,
                  color: "#10B981",
                  pct: motorA.remanente > 0 ? motorA.ingreso_disponible_pasivo / motorA.remanente : 0,
                },
              ].map((item, i) => (
                <div key={i} className="flex-1 rounded-[12px] border px-5 py-[18px]" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="text-[11px] font-semibold tracking-[1px] uppercase text-[#4A5A72] mb-1.5">{item.label}</div>
                  <div className="text-[22px] font-bold tabular-nums" style={{ color: item.color }}>{fmtFull(item.val)}</div>
                  <div className="text-[11px] text-[#8B9BB4] mt-0.5">{item.sub}</div>
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "#112038" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, item.pct * 100)}%`, background: item.color }} />
                  </div>
                  <div className="text-[10px] text-[#4A5A72] mt-1">{(item.pct * 100).toFixed(0)}% del total disponible</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rentabilidad */}
          {(patrimonio.inmuebles_renta > 0 || patrimonio.negocio > 0) && (
            <div className="rounded-[16px] border p-6" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#C9A84C] mb-3.5">Rentabilidad de fuentes de flujo</div>
              <table className="w-full text-[13px]" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr>
                    {["Fuente", "Activo Productivo", "Flujo Mensual", "Rentabilidad Anual"].map((h, i) => (
                      <th key={i} className="px-4 py-2.5 text-left text-[10px] font-bold tracking-[1.5px] uppercase text-[#4A5A72]" style={{ background: "#112038" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    patrimonio.inmuebles_renta > 0 && { fuente: "Inmuebles en Renta", activo: patrimonio.inmuebles_renta, flujo: flujo.rentas, rentabilidad: patrimonio.inmuebles_renta > 0 ? ((flujo.rentas * 12) / patrimonio.inmuebles_renta) * 100 : 0 },
                    patrimonio.negocio > 0 && { fuente: "Negocio Propio", activo: patrimonio.negocio, flujo: flujo.otros, rentabilidad: patrimonio.negocio > 0 ? ((flujo.otros * 12) / patrimonio.negocio) * 100 : 0 },
                  ].filter((r): r is {fuente:string;activo:number;flujo:number;rentabilidad:number} => !!r).map((row, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 border-b font-semibold text-[#C9A84C]" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>{row.fuente}</td>
                      <td className="px-4 py-3 border-b text-[#8B9BB4]" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>{fmtFull(row.activo)}</td>
                      <td className="px-4 py-3 border-b font-semibold text-[#C9A84C]" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>{fmtFull(row.flujo)}</td>
                      <td className="px-4 py-3 border-b text-right" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
                        <Badge variant={row.rentabilidad >= 3 ? "green" : "amber"}>{row.rentabilidad.toFixed(1)}%</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* A — RESUMEN EJECUTIVO                                               */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <Section id="resumen">
          <SectionHeader tag="A" title="Resumen Ejecutivo" subtitle="Panorama integral de la situación patrimonial y financiera" />

          {/* 2 boxes: Tasa de Ahorro + Índice de Liquidez */}
          <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
            {/* A1 Tasa de Ahorro */}
            <div className="rounded-[14px] p-5 border relative overflow-hidden" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#4A5A72] mb-2.5">A1</div>
              <div className="text-[13px] font-semibold text-[#8B9BB4] mb-3">Tasa de Ahorro</div>
              <div className="text-[32px] font-extrabold leading-none tabular-nums" style={{ letterSpacing: -1, color: "#C9A84C" }}>
                {motorA.ingresos_totales > 0 ? pct(motorA.remanente / motorA.ingresos_totales) : "—"}
              </div>
              <div className="text-[12px] text-[#8B9BB4] mt-1">{fmtFull(motorA.remanente)}/mes disponible</div>
              <div className="mt-3.5">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-[11px] text-[#8B9BB4]">del ingreso total</span>
                  <span className="text-[16px] font-bold text-[#C9A84C]">
                    {motorA.ingresos_totales > 0 ? pct(motorA.remanente / motorA.ingresos_totales) : "—"}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#112038" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, motorA.ingresos_totales > 0 ? (motorA.remanente / motorA.ingresos_totales) * 100 : 0)}%`, background: "linear-gradient(90deg,#C9A84C,#E8C872)" }} />
                </div>
              </div>
            </div>

            {/* A2 Índice de Liquidez — (Liquidez + Inversiones) / Total Obligaciones */}
            <div className="rounded-[14px] p-5 border relative overflow-hidden" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#4A5A72] mb-2.5">A2</div>
              <div className="text-[13px] font-semibold text-[#8B9BB4] mb-3">Índice de Liquidez</div>
              <div className="text-[32px] font-extrabold leading-none tabular-nums" style={{ letterSpacing: -1, color: indice_liquidez_correcto !== null && indice_liquidez_correcto >= 1 ? "#10B981" : "#F59E0B" }}>
                {indice_liquidez_correcto !== null ? `${indice_liquidez_correcto.toFixed(2)}x` : "—"}
              </div>
              <div className="text-[12px] text-[#8B9BB4] mt-1">
                {total_obligaciones > 0 ? `(Liq + Inv) / Obligaciones totales` : "Sin obligaciones registradas"}
              </div>
              <div className="mt-3.5">
                <Badge variant={indice_liquidez_correcto !== null && indice_liquidez_correcto >= 1 ? "green" : "amber"}>
                  {indice_liquidez_correcto !== null && indice_liquidez_correcto >= 1 ? "Activos cubren deuda" : "Reforzar liquidez"}
                </Badge>
                {indice_liquidez_correcto !== null && (
                  <div className="mt-2.5 text-[11px] text-[#4A5A72]">
                    {fmtMXN(patrimonio.liquidez + patrimonio.inversiones)} vs {fmtMXN(total_obligaciones)} en obligaciones
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* A3 Estructura de Apalancamiento — layout izq (vertical) + der (desglose) */}
          <div className="rounded-[14px] p-5 border" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#4A5A72] mb-2.5">A3</div>
            <div className="text-[13px] font-semibold text-[#8B9BB4] mb-4">Estructura de Apalancamiento</div>
            <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {/* Izquierda: Apalancamiento actual → Potencial → Excedente */}
              <div className="flex flex-col gap-2">
                {[
                  { label: "Apalancamiento Actual", val: fmtMXN(motorE.apalancamiento_actual), color: "#EF4444", sub: "Deuda total vigente" },
                  { label: "Potencial de Apalancamiento", val: fmtMXN(motorE.apalancamiento_potencial_bruto), color: "#F59E0B", sub: "Activos base × 50%" },
                  { label: "Excedente Disponible", val: motorE.excedente_apalancamiento > 0 ? fmtMXN(motorE.excedente_apalancamiento) : "Sin margen", color: motorE.excedente_apalancamiento > 0 ? "#10B981" : "#4A5A72", sub: "Capacidad adicional de crédito" },
                ].map((item, i) => (
                  <div key={i} className="rounded-[10px] px-4 py-3 flex justify-between items-center" style={{ background: "#112038" }}>
                    <div>
                      <div className="text-[11px] text-[#4A5A72] mb-0.5">{item.label}</div>
                      <div className="text-[12px] text-[#8B9BB4]">{item.sub}</div>
                    </div>
                    <div className="text-[18px] font-bold tabular-nums" style={{ color: item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>
              {/* Derecha: Desglose por tipo de activo */}
              <div className="flex flex-col gap-2">
                <div className="text-[10px] font-semibold tracking-[1.5px] uppercase text-[#4A5A72] mb-1">Respaldo del potencial</div>
                {[
                  { label: "Activos Financieros", val: motorE.potencial_fin, pct: motorE.pct_fin, color: "#3B82F6", sub: `Liq + Inv — ${(motorE.pct_fin * 100).toFixed(0)}% del total` },
                  { label: "Activos Inmobiliarios", val: motorE.potencial_nofin, pct: motorE.pct_nofin, color: "#0EA5E9", sub: `Casa + Inmuebles + Tierra — ${(motorE.pct_nofin * 100).toFixed(0)}% del total` },
                ].map((item, i) => (
                  <div key={i} className="rounded-[10px] px-4 py-3" style={{ background: "#112038" }}>
                    <div className="flex justify-between items-baseline mb-2">
                      <div className="text-[11px] text-[#8B9BB4]">{item.label}</div>
                      <div className="text-[16px] font-bold tabular-nums" style={{ color: item.color }}>{fmtMXN(item.val)}</div>
                    </div>
                    <div className="text-[10px] text-[#4A5A72] mb-1.5">{item.sub}</div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "#060D1A" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, item.pct * 100)}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
                <div className="text-[11px] text-[#4A5A72] text-center mt-1">
                  Deuda/Activos: <span className="font-bold text-[#F0F4FA]">{deuda_activos_pct.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* G — TRAYECTORIA Y RETIRO                                            */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {motorC && retiro && (
          <Section id="retiro">
            <SectionHeader tag="G" title="Trayectoria Patrimonial y Retiro" subtitle="Proyección de ingresos en retiro por fuente y capital humano" />

            <div className="grid gap-5 mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="rounded-[14px] border px-5 py-5" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[#4A5A72] mb-2">Mensualidad Posible en Retiro</div>
                <div className="text-[30px] font-extrabold text-[#C9A84C] tabular-nums" style={{ letterSpacing: -1 }}>
                  {fmtFull(motorC.mensualidad_posible)}
                </div>
                <div className="text-[12px] text-[#8B9BB4] mt-1">
                  vs meta de {fmtFull(mensDeseada)}/mes ·{" "}
                  {motorC.deficit_mensual > 0
                    ? <span className="text-[#F59E0B]">Brecha: {fmtMXN(motorC.deficit_mensual)}/mes</span>
                    : <span className="text-[#10B981]">Meta alcanzada</span>
                  }
                </div>
              </div>
              <div className="rounded-[14px] border px-5 py-5" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[#4A5A72] mb-2">Capital al Inicio del Retiro</div>
                <div className="text-[30px] font-extrabold text-[#F0F4FA] tabular-nums" style={{ letterSpacing: -1 }}>
                  {fmtMXN(motorC.saldo_inicio_jubilacion)}
                </div>
                <div className="text-[12px] text-[#8B9BB4] mt-1">Proyectado a los {edadRetiro} años con tasa real 2.5%</div>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-[14px] border p-6 mb-6" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#C9A84C] mb-1">Línea de vida financiera</div>
              <div className="text-[12px] text-[#4A5A72] mb-5">Hoy → Retiro → Proyección de vida</div>
              <div className="flex items-end gap-0 relative py-8">
                {/* Track bg */}
                <div className="absolute" style={{ top: "50%", left: 0, right: 0, height: 2, background: "#112038", transform: "translateY(-50%)" }} />
                {/* Progress to retiro */}
                <div className="absolute" style={{ top: "50%", left: 0, width: "43%", height: 2, background: "#C9A84C", transform: "translateY(-50%)" }} />
                {/* Hoy */}
                <div className="flex flex-col items-center w-20 shrink-0 relative z-10">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#C9A84C] mb-2.5" style={{ boxShadow: "0 0 12px rgba(201,168,76,0.5)" }} />
                  <div className="text-[22px] font-extrabold text-[#F0F4FA]">{edadActual}</div>
                  <div className="text-[10px] text-[#4A5A72] mt-0.5 text-center tracking-wider">HOY</div>
                  <div className="text-[12px] text-[#8B9BB4] mt-1">{fmtMXN(motorE.patrimonio_neto)}</div>
                </div>
                <div className="flex-1" />
                {/* Retiro */}
                <div className="flex flex-col items-center w-24 shrink-0 relative z-10">
                  <div className="w-[18px] h-[18px] rounded-full bg-[#C9A84C] mb-2.5 border-[3px]" style={{ boxShadow: "0 0 16px rgba(201,168,76,0.6)", borderColor: "#060D1A" }} />
                  <div className="text-[26px] font-extrabold text-[#C9A84C]">{edadRetiro}</div>
                  <div className="text-[10px] text-[#C9A84C] mt-0.5 text-center tracking-[1px]">RETIRO</div>
                  <div className="text-[12px] text-[#8B9BB4] mt-1">{fmtMXN(motorC.saldo_inicio_jubilacion)}</div>
                  <div className="text-[11px] text-[#10B981] mt-0.5">{fmtFull(motorC.mensualidad_posible)}/mes</div>
                </div>
                <div className="flex-1" style={{ background: "linear-gradient(90deg,transparent,rgba(16,185,129,0.15))" }} />
                {/* Fin */}
                <div className="flex flex-col items-center w-20 shrink-0 relative z-10">
                  <div className="w-3.5 h-3.5 rounded-full border-2 mb-2.5" style={{ background: "#112038", borderColor: "#4A5A72" }} />
                  <div className="text-[22px] font-extrabold text-[#8B9BB4]">{edadFin}</div>
                  <div className="text-[10px] text-[#4A5A72] mt-0.5 text-center tracking-wider">PROYECCIÓN</div>
                  <div className="text-[12px] text-[#8B9BB4] mt-1 text-center">
                    Legado {motorC.curva.length ? fmtMXN(Math.max(0, motorC.curva[motorC.curva.length - 1].saldo)) : "—"}
                  </div>
                </div>
              </div>

              {/* Fuentes en retiro */}
              <div className="mt-5 pt-5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#4A5A72] mb-3">
                  Fuentes de ingreso al inicio del retiro ({edadRetiro} años)
                </div>
                <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
                  {[
                    { label: "IMSS/AFORE",            val: motorC.fuentes_ingreso.pension,    color: "#8B9BB4" },
                    { label: "Esq. Voluntarios",      val: 0,                                  color: "#C9A84C" },
                    { label: "Rentas e Inv.",          val: motorC.fuentes_ingreso.rentas,     color: "#3B82F6" },
                    { label: "Retiro de Capital",     val: motorC.fuentes_ingreso.patrimonio, color: "#10B981" },
                  ].map((item, i) => (
                    <div key={i} className="rounded-[10px] px-3.5 py-3" style={{ background: "#112038" }}>
                      <div className="text-[10px] text-[#4A5A72] mb-1">{item.label}</div>
                      <div className="text-[16px] font-bold tabular-nums" style={{ color: item.color }}>{fmtFull(item.val)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gráficas de Trayectoria */}
            <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {/* Gráfica 1 — Patrimonio por año */}
              <div className="rounded-[14px] border p-5" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#C9A84C] mb-1">Trayectoria del Patrimonio en Retiro</div>
                <div className="text-[12px] text-[#8B9BB4] mb-4">Saldo proyectado por año · Tasa real 2.5%</div>
                <div className="flex flex-col gap-[5px]">
                  {curvaPorAnio.map((d, i) => {
                    const pctBar = maxSaldo > 0 ? Math.min(100, (Math.abs(d.saldo) / maxSaldo) * 95 + 2) : 2;
                    const isPos  = d.saldo >= 0;
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <span className="text-[11px] text-[#4A5A72] w-8 text-right shrink-0">{d.edad}a</span>
                        <div className="flex-1 h-[18px] rounded-[3px] overflow-hidden" style={{ background: "#112038" }}>
                          <div className="h-full rounded-[3px]" style={{ width: `${pctBar}%`, background: isPos ? "#10B981" : "#EF4444", opacity: i === 0 ? 1 : 0.75 }} />
                        </div>
                        <span className="text-[11px] font-semibold w-16 text-right shrink-0 tabular-nums" style={{ color: isPos ? "#10B981" : "#EF4444" }}>
                          {fmtMXN(d.saldo)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gráfica 2 — Fuentes por año */}
              <div className="rounded-[14px] border p-5" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#C9A84C] mb-1">Ingresos en Retiro por Fuente</div>
                <div className="text-[12px] text-[#8B9BB4] mb-2">Distribución mensual estimada por año</div>
                <div className="flex flex-wrap gap-2.5 mb-3">
                  {[
                    { color: "#C9A84C", label: "AFORE/Pensión" },
                    { color: "#3B82F6", label: "Rentas" },
                    { color: "#8B5CF6", label: "Negocio" },
                    { color: "#5A7A9F", label: "Patrimonio" },
                  ].map((leg, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-[#8B9BB4]">
                      <div className="w-2.5 h-2.5 rounded-[2px]" style={{ background: leg.color }} />
                      {leg.label}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  {fuentesData.map((d, i) => {
                    const total = d.pension + d.voluntarios + d.rentas + d.patrimonio;
                    const totalWidth = maxFuente > 0 ? (total / maxFuente) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <span className="text-[11px] text-[#4A5A72] w-8 text-right shrink-0">{d.edad}a</span>
                        <div className="flex-1 h-3.5 rounded-[2px] overflow-hidden" style={{ background: "#112038" }}>
                          <div className="flex h-full" style={{ width: `${totalWidth}%` }}>
                            {d.pension    > 0 && <div style={{ flex: d.pension,    background: "#C9A84C" }} />}
                            {d.voluntarios > 0 && <div style={{ flex: d.voluntarios, background: "#E8C87A" }} />}
                            {d.rentas     > 0 && <div style={{ flex: d.rentas,     background: "#3B82F6" }} />}
                            {d.patrimonio > 0 && <div style={{ flex: d.patrimonio, background: "#5A7A9F" }} />}
                          </div>
                        </div>
                        <span className="text-[11px] text-[#8B9BB4] w-14 text-right shrink-0 tabular-nums">{fmtMXN(total)}/mes</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* KPIs resumen */}
            <div className="grid gap-2.5 mt-5" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
              {[
                { label: "Patrimonio Financiero al Retiro", val: fmtMXN(motorC.saldo_inicio_jubilacion), color: "#C9A84C" },
                { label: "Capital Humano (VP ingresos futuros)", val: fmtMXN(motorA.ingresos_totales * 12 * Math.max(0, edadRetiro - edadActual)), color: "#F0F4FA" },
                { label: "Obligaciones", val: fmtMXN(motorE.pasivos_total), color: "#EF4444" },
                { label: "Patrimonio Total Proyectado", val: fmtMXN(motorC.saldo_inicio_jubilacion + motorE.no_financiero), color: "#10B981" },
              ].map((kpi, i) => (
                <div key={i} className="rounded-[10px] px-3.5 py-3" style={{ background: "#112038" }}>
                  <div className="text-[10px] text-[#4A5A72] mb-1">{kpi.label}</div>
                  <div className="text-[15px] font-bold tabular-nums" style={{ color: kpi.color }}>{kpi.val}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* E — POTENCIAL DEL BALANCE                                           */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <Section id="potencial">
          <SectionHeader tag="E" title="Potencial del Balance" subtitle="Solvencia, estructura patrimonial y distribución de activos" />

          <div className="rounded-[16px] border p-6 mb-4" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex justify-between items-baseline mb-1.5">
              <div className="flex items-baseline gap-3">
                <span className="text-[10px] font-bold tracking-[2px] uppercase text-[#4A5A72]">Índice de Solvencia</span>
                <span className="text-[24px] font-extrabold text-[#10B981]">{indice_solvencia_pct.toFixed(1)}%</span>
              </div>
              <Badge variant={indice_solvencia_pct >= 70 ? "green" : indice_solvencia_pct >= 50 ? "amber" : "red"}>
                {motorE.clasificacion_solvencia}
              </Badge>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: "#112038", margin: "12px 0" }}>
              <div className="h-full rounded-full" style={{ width: `${indice_solvencia_pct}%`, background: "linear-gradient(90deg,#10B981,#34D399)", transition: "width 0.8s ease" }} />
            </div>
            <div className="text-[12px] text-[#8B9BB4]">
              Los activos cubren {motorE.activos_total > 0 && motorE.pasivos_total > 0 ? (motorE.activos_total / motorE.pasivos_total).toFixed(1) : "∞"}x las obligaciones. Estructura con {indice_solvencia_pct >= 70 ? "amplio" : "limitado"} margen de seguridad.
            </div>
          </div>

          <div className="rounded-[16px] border p-6" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-[10px] font-bold tracking-[2px] uppercase text-[#C9A84C] mb-4">Distribución por categoría</div>
            <div className="flex flex-col gap-3">
              {[
                { label: "Inversiones y Dotales", val: patrimonio.inversiones + patrimonio.dotales, color: "#3B82F6" },
                { label: "Bienes Raíces Patrimoniales", val: patrimonio.casa + patrimonio.inmuebles_renta + patrimonio.tierra, color: "#0EA5E9" },
                { label: "Activos Productivos", val: patrimonio.negocio + patrimonio.herencia, color: "#10B981" },
                { label: "Esquemas de Retiro", val: patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado + patrimonio.seguros_retiro, color: "#8B5CF6" },
                { label: "Liquidez", val: patrimonio.liquidez, color: "#C9A84C" },
              ].map((cat, i) => {
                const catPct = motorE.activos_total > 0 ? (cat.val / motorE.activos_total) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-[13px] text-[#8B9BB4]">{cat.label}</span>
                      <span className="text-[13px] font-bold tabular-nums text-[#F0F4FA]">
                        {fmtFull(cat.val)}{" "}
                        <span className="text-[#4A5A72] font-normal">{catPct.toFixed(1)}%</span>
                      </span>
                    </div>
                    <div className="h-[5px] rounded-[3px] overflow-hidden" style={{ background: "#112038" }}>
                      <div className="h-full rounded-[3px]" style={{ width: `${catPct}%`, background: cat.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* B — PLAN DE ACCIÓN                                                  */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <Section id="plan">
          <SectionHeader tag="B" title="Plan de Acción" subtitle="Situación actual, nivel de riesgo y recomendaciones por área" />

          <div className="rounded-[16px] border overflow-hidden" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
            <table className="w-full text-[13px]" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  {["Área", "Situación Actual", "Riesgo", "Recomendación"].map((h, i) => (
                    <th key={i} className="px-[18px] py-3 text-left text-[10px] font-bold tracking-[1.5px] uppercase text-[#4A5A72]" style={{ background: "#112038", width: i === 0 ? "18%" : i === 2 ? "12%" : undefined }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planRows.map((row, i) => (
                  <tr key={i}>
                    <td className="px-[18px] py-3.5 border-b font-semibold text-[#F0F4FA]" style={{ background: i % 2 === 0 ? "#0C1829" : "rgba(10,22,40,0.8)", borderColor: "rgba(255,255,255,0.06)", verticalAlign: "top" }}>{row.area}</td>
                    <td className="px-[18px] py-3.5 border-b text-[#8B9BB4]" style={{ background: i % 2 === 0 ? "#0C1829" : "rgba(10,22,40,0.8)", borderColor: "rgba(255,255,255,0.06)", verticalAlign: "top" }}>{row.situacion}</td>
                    <td className="px-[18px] py-3.5 border-b" style={{ background: i % 2 === 0 ? "#0C1829" : "rgba(10,22,40,0.8)", borderColor: "rgba(255,255,255,0.06)", verticalAlign: "top" }}>{riesgoBadge(row.riesgo)}</td>
                    <td className="px-[18px] py-3.5 border-b text-[#F0F4FA]" style={{ background: i % 2 === 0 ? "#0C1829" : "rgba(10,22,40,0.8)", borderColor: "rgba(255,255,255,0.06)", verticalAlign: "top" }}>{row.rec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* F — PROTECCIÓN                                                      */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {proteccion != null && (
          <Section id="proteccion">
            <SectionHeader tag="F" title="Protección Patrimonial" subtitle="Cobertura de seguros e impacto potencial en el balance" />

            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
              {/* Seguro de Vida */}
              <div className="rounded-[12px] border p-5 flex flex-col gap-2" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div className="text-[11px] font-semibold tracking-[1px] uppercase text-[#4A5A72]">Seguro de Vida</div>
                <div className="text-[15px] font-bold" style={{ color: proteccion.seguro_vida ? "#10B981" : "#EF4444" }}>
                  {proteccion.seguro_vida ? "Contratado" : "No contratado"}
                </div>
                <div className="text-[12px] text-[#8B9BB4]">
                  {proteccion.seguro_vida
                    ? "Cobertura de vida vigente para proteger dependientes."
                    : `Riesgo patrimonial estimado: ${fmtMXN(motorA.ingresos_totales * 60)} sin cobertura.`}
                </div>
                <Badge variant={proteccion.seguro_vida ? "green" : "red"}>
                  {proteccion.seguro_vida ? "Cubierto" : "Acción urgente"}
                </Badge>
              </div>

              {/* Propiedades */}
              <div className="rounded-[12px] border p-5 flex flex-col gap-2" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)" }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div className="text-[11px] font-semibold tracking-[1px] uppercase text-[#4A5A72]">Propiedades Aseguradas</div>
                <div className="text-[15px] font-bold" style={{ color: proteccion.propiedades_aseguradas === true ? "#10B981" : proteccion.propiedades_aseguradas === null ? "#F59E0B" : "#EF4444" }}>
                  {proteccion.propiedades_aseguradas === true ? "Aseguradas" : proteccion.propiedades_aseguradas === false ? "Sin cobertura" : "Sin verificar"}
                </div>
                <div className="text-[12px] text-[#8B9BB4]">
                  {proteccion.propiedades_aseguradas
                    ? "Propiedades con cobertura vigente."
                    : `Inmuebles sin cobertura verificada (${fmtMXN(patrimonio.casa + patrimonio.inmuebles_renta)} en riesgo).`}
                </div>
                <Badge variant={proteccion.propiedades_aseguradas === true ? "green" : proteccion.propiedades_aseguradas === null ? "amber" : "amber"}>
                  {proteccion.propiedades_aseguradas === true ? "Cubierto" : "Revisar"}
                </Badge>
              </div>

              {/* SGMM */}
              <div className="rounded-[12px] border p-5 flex flex-col gap-2" style={{ background: "#0C1829", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: "rgba(16,185,129,0.12)" }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div className="text-[11px] font-semibold tracking-[1px] uppercase text-[#4A5A72]">Gastos Médicos Mayores</div>
                <div className="text-[15px] font-bold" style={{ color: proteccion.sgmm ? "#10B981" : "#EF4444" }}>
                  {proteccion.sgmm ? "Activo" : "Sin cobertura"}
                </div>
                <div className="text-[12px] text-[#8B9BB4]">
                  {proteccion.sgmm
                    ? "SGMM vigente. Cobertura médica completa."
                    : "Sin seguro de gastos médicos mayores activo."}
                </div>
                <Badge variant={proteccion.sgmm ? "green" : "red"}>
                  {proteccion.sgmm ? "Cubierto" : "Acción urgente"}
                </Badge>
              </div>
            </div>
          </Section>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* SIMULADOR — teaser colapsable                                       */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <div id="simulador" style={{ scrollMarginTop: 60 }}>
          <button
            onClick={() => setShowSimulador((v) => !v)}
            className="w-full flex justify-between items-center gap-6 p-8 text-left transition-all"
            style={{
              background: "linear-gradient(135deg,rgba(201,168,76,0.05) 0%,rgba(59,130,246,0.04) 100%)",
              border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: showSimulador ? "16px 16px 0 0" : "16px",
            }}
          >
            <div>
              <h3 className="text-[20px] font-bold text-[#F0F4FA] mb-1.5">Simula tu futuro</h3>
              <p className="text-[13px] text-[#8B9BB4] max-w-[380px]">
                Ajusta ahorro, retiro y rendimiento para ver cómo impactan en tu trayectoria patrimonial.
              </p>
            </div>
            <div className="px-6 py-3 rounded-[9px] font-semibold text-[14px] shrink-0" style={{ background: "#C9A84C", color: "#060D1A" }}>
              {showSimulador ? "Cerrar ↑" : "Abrir simulador ↓"}
            </div>
          </button>

          {showSimulador && (
            <div className="px-8 py-8 border border-t-0" style={{ borderColor: "rgba(201,168,76,0.15)", borderRadius: "0 0 16px 16px" }}>

              {/* Financial Timeline */}
              <div className="mb-8">
                <Card>
                  <FinancialTimeline
                    edadActual={edad}
                    edadRetiro={sliderValues.edad_retiro}
                    edadDefuncion={retiroBase.edad_defuncion}
                    patrimonioActual={patrimonioFin}
                    ahorroMensual={sliderValues.ahorro}
                    tasaReal={sliderValues.tasa_real / 100}
                    edadInicioRendimientos={sliderValues.inicio_rendimientos > 0 ? sliderValues.inicio_rendimientos : undefined}
                    onInicioRendimientosChange={(v) => setSliderValues((s) => ({ ...s, inicio_rendimientos: v }))}
                    rangoAhorro={sliderValues.ahorro_rango ?? [edad, sliderValues.edad_retiro]}
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
                      formatValue={(v) => fmtMXN(v) + "/mes"}
                    />
                    <p className="mt-1 text-[11px] text-[#5A6A85]">Base: {fmtMXN(flujoBase.ahorro)}/mes</p>
                    {sliderValues.ahorro > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/[0.06]">
                        <Slider
                          label="Periodo de aportación"
                          min={edad}
                          max={retiroBase.edad_defuncion}
                          step={1}
                          value={sliderValues.ahorro_rango ?? [edad, sliderValues.edad_retiro]}
                          onChange={(v) => setSliderValues((s) => ({
                            ...s,
                            ahorro_rango: [v[0] as number, v[1] as number],
                          }))}
                          formatValue={(v) => (v === retiroBase.edad_defuncion ? `${v}a (vida)` : `${v}a`)}
                        />
                      </div>
                    )}
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
                    <p className="mt-1 text-[11px] text-[#5A6A85]">Base: {retiroBase.edad_retiro} años</p>
                  </Card>

                  <Card>
                    <Slider
                      label="Mensualidad deseada en retiro"
                      min={10000}
                      max={200000}
                      step={5000}
                      value={[sliderValues.mensualidad_deseada]}
                      onChange={(v) => setSliderValues((s) => ({ ...s, mensualidad_deseada: v[0] }))}
                      formatValue={(v) => fmtMXN(v) + "/mes"}
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
                      label="Aportación extra única — Edad"
                      min={0}
                      max={retiroBase.edad_defuncion}
                      step={1}
                      value={[sliderValues.aportacion_extra_edad]}
                      onChange={(v) => setSliderValues((s) => ({
                        ...s,
                        aportacion_extra_edad: v[0],
                        aportacion_extra: v[0] > 0 && s.aportacion_extra === 0 ? 500_000 : s.aportacion_extra,
                      }))}
                      formatValue={(v) => (v === 0 ? "Sin evento" : `${v} años`)}
                    />
                    {sliderValues.aportacion_extra_edad > 0 && (
                      <div className="mt-3">
                        <Slider
                          label="Aportación extra — Monto"
                          min={0}
                          max={20_000_000}
                          step={100_000}
                          value={[sliderValues.aportacion_extra]}
                          onChange={(v) => setSliderValues((s) => ({ ...s, aportacion_extra: v[0] }))}
                          formatValue={(v) => fmtMXN(v)}
                        />
                      </div>
                    )}
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
                        // Auto-initialize monto to 1M when edad is first set
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
                          formatValue={(v) => fmtMXN(v)}
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
                        onClick={() => setSimView(v)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                          simView === v ? "bg-[#1A3154] text-[#F0F4FA]" : "text-[#5A6A85] hover:text-[#8B9BB4]"
                        }`}
                      >
                        {v === "salud" ? "Salud Financiera" : "Trayectoria de Retiro"}
                      </button>
                    ))}
                  </div>

                  {simView === "salud" && (
                    <Card>
                      <RadarSaludFinanciera
                        base={saludBase}
                        simulado={saludSimulado}
                        showComparison={saludSimulado.score_total !== saludBase.score_total}
                      />
                    </Card>
                  )}

                  {simView === "retiro" && (
                    <div className="space-y-6">
                      <Card>
                        <GradoAvanceBar porcentaje={tlSimulado.gradoAvance} />
                        <p className={`mt-2 font-bold text-xs ${diffGrado >= 0 ? "text-[#317A70]" : "text-[#8B3A3A]"}`}>
                          {diffGrado >= 0 ? "▲" : "▼"} {Math.abs(diffGrado).toFixed(1)}% vs base
                        </p>
                      </Card>

                      <Card>
                        <p className="text-sm text-[#5A6A85]">Mensualidad posible</p>
                        <p className="font-bold text-[28px] text-white">{formatMXN(tlSimulado.mensualidadPosible)}</p>
                      </Card>

                      <Card>
                        <DeficitCard
                          deficit={tlSimulado.deficit}
                          simuladorUrl="#simulador"
                        />
                      </Card>

                      <Card className="min-h-[380px]">
                        <TrayectoriaRetiroChart
                          saldoInicioJubilacion={saldoInicioConVenta}
                          pensionTotalMensual={resultadoSimulado.pension_fija_total}
                          mensualidadDeseada={sliderValues.mensualidad_deseada}
                          edadRetiro={sliderValues.edad_retiro}
                          edadDefuncion={retiroBase.edad_defuncion}
                          patrimonioFinancieroActual={patrimonioFin}
                          inyecciones={inyeccionesRetiro}
                          tasaRealAnual={sliderValues.tasa_real / 100}
                          ahorroMensualPostRetiro={ahorroPostRetiro}
                          ahorroHastaEdad={ahorroHastaEdad}
                          componentesRetiro={componentesRetiro}
                        />
                      </Card>
                    </div>
                  )}
                </div>
              </div>

              {/* Action bar */}
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <button
                  type="button"
                  onClick={resetValues}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-semibold border border-white/[0.08] text-[#F0F4FA] hover:bg-white/[0.04] transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Resetear valores
                </button>

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
                      <button
                        type="button"
                        onClick={handleSaveSimulation}
                        disabled={!saveLabel.trim()}
                        className="px-4 py-2 rounded-[10px] text-sm font-bold bg-[#C9A84C] text-[#060D1A] disabled:opacity-40 transition-all"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowSaveInput(false); setSaveLabel(""); }}
                        className="px-3 py-2 rounded-[10px] text-sm text-[#8B9BB4] hover:text-[#F0F4FA] transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSaveInput(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-sm font-bold bg-[#C9A84C] text-[#060D1A] transition-all hover:bg-[#E8C872]"
                    >
                      <Save className="w-4 h-4" />
                      {justSaved ? "¡Guardada!" : "Guardar simulación"}
                    </button>
                  )}
                </div>
              </div>

              {/* Saved simulations */}
              {simulaciones_guardadas.length > 0 && (
                <div className="mt-10">
                  <h4 className="font-bold text-lg text-[#F0F4FA] mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#C9A84C]" />
                    Simulaciones guardadas ({simulaciones_guardadas.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {simulaciones_guardadas.map((sim) => (
                      <SavedSimulationCardV2
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
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* H — HOUSE VIEW (teaser colapsable)                                  */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <div id="houseview" className="mt-6" style={{ scrollMarginTop: 60 }}>
          <button
            onClick={() => setShowHouseView((v) => !v)}
            className="w-full flex justify-between items-center gap-6 p-8 text-left transition-all"
            style={{
              background: "linear-gradient(135deg,rgba(201,168,76,0.05) 0%,rgba(59,130,246,0.04) 100%)",
              border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: showHouseView ? "16px 16px 0 0" : "16px",
            }}
          >
            <div>
              <h3 className="text-[20px] font-bold text-[#F0F4FA] mb-1.5">House View</h3>
              <p className="text-[13px] text-[#8B9BB4] max-w-[380px]">
                Perspectiva de mercado Actinver Análisis — objetivos de cierre 2026 para bolsas, divisas, tasas y materias primas.
              </p>
            </div>
            <div className="px-6 py-3 rounded-[9px] font-semibold text-[14px] shrink-0" style={{ background: "#C9A84C", color: "#060D1A" }}>
              {showHouseView ? "Cerrar ↑" : "Ver House View ↓"}
            </div>
          </button>

          {showHouseView && (
            <div className="p-8 border border-t-0" style={{ borderColor: "rgba(201,168,76,0.15)", borderRadius: "0 0 16px 16px", background: "#0C1829" }}>
              <HouseViewPanel />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Saved simulation card ──────────────────────────────────────────────────────

function SavedSimulationCardV2({
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
    <div
      className="group bg-[#0C1829] border border-white/[0.06] rounded-[16px] p-5 cursor-pointer hover:border-[#C9A84C]/30 transition-all duration-300"
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
            title="Eliminar"
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
            <p className="font-bold text-[#F0F4FA]">{fmtMXN(sim.resultados.mensualidad_posible)}</p>
          </div>
          <div>
            <span className="text-[#5A6A85]">Retiro a</span>
            <p className="font-bold text-[#F0F4FA]">{sim.params.edad_retiro} años</p>
          </div>
          <div>
            <span className="text-[#5A6A85]">Déficit</span>
            <p className={`font-bold ${sim.resultados.deficit_mensual < 0 ? "text-[#EF4444]" : "text-[#10B981]"}`}>
              {fmtMXN(Math.abs(sim.resultados.deficit_mensual))}
            </p>
          </div>
        </div>

        <p className="text-[10px] text-[#5A6A85] text-center group-hover:text-[#C9A84C] transition-colors">
          Toca para cargar esta simulación
        </p>
      </div>
    </div>
  );
}
