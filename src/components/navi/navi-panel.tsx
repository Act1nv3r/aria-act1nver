"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Check, User, Wallet, Building2, Palmtree, Target, Shield } from "lucide-react";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { NaviSuggestionCard } from "./navi-suggestion";
import { NaviChecklist, type DataCategory } from "./navi-checklist";
import { NaviOpportunities } from "./navi-opportunities";
import { NaviAlert } from "./navi-alert";
import {
  generarSugerenciaNavi,
  getDatosFaltantes,
  type NaviSuggestion,
} from "@/lib/navi-engine";
import { detectarOportunidades, type Oportunidad } from "@/lib/navi-opportunities";
import type { LucideIcon } from "lucide-react";

type NaviTab = "guia" | "datos" | "insights";

interface NaviPanelProps {
  transcripcion: string;
  sesionMinutos: number;
  maxMinutos?: number;
  activeTab: NaviTab;
  onTabChange: (tab: NaviTab) => void;
}

const PHASES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "flujo", label: "Flujo", icon: Wallet },
  { id: "patrimonio_fin", label: "Patrimonio", icon: Building2 },
  { id: "retiro", label: "Retiro", icon: Palmtree },
  { id: "no_financiero", label: "Objetivos", icon: Target },
  { id: "proteccion", label: "Protección", icon: Shield },
];

function PhaseStepperHorizontal({ categories }: { categories: DataCategory[] }) {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  let lastActiveIdx = -1;
  PHASES.forEach((p, i) => {
    const cat = catMap.get(p.id);
    if (cat && cat.fields.some((f) => f.completado)) lastActiveIdx = i;
  });

  return (
    <div className="flex items-center justify-between gap-1 px-2 py-3">
      {PHASES.map((phase, idx) => {
        const cat = catMap.get(phase.id);
        const filled = cat ? cat.fields.filter((f) => f.completado).length : 0;
        const total = cat ? cat.fields.length : 0;
        const isComplete = filled === total && total > 0;
        const isCurrent = idx === lastActiveIdx + 1 || (lastActiveIdx === -1 && idx === 0);
        const isPast = isComplete;

        return (
          <div key={phase.id} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isPast
                    ? "bg-[#10B981]/15 text-[#10B981]"
                    : isCurrent
                    ? "bg-[#C9A84C]/15 text-[#C9A84C] ring-2 ring-[#C9A84C]/30"
                    : "bg-[#1A3154] text-[#4A5A72]"
                }`}
              >
                {isPast ? <Check className="w-3 h-3" /> : idx + 1}
              </div>
              <span className={`text-[9px] font-medium leading-tight text-center ${
                isPast ? "text-[#10B981]" : isCurrent ? "text-[#C9A84C]" : "text-[#4A5A72]"
              }`}>
                {phase.label}
              </span>
            </div>
            {idx < PHASES.length - 1 && (
              <div className={`h-px flex-1 min-w-[8px] ${isPast ? "bg-[#10B981]/30" : "bg-[#1A3154]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function NaviPanel({
  transcripcion,
  sesionMinutos,
  maxMinutos = 20,
  activeTab,
  onTabChange,
}: NaviPanelProps) {
  const store = useDiagnosticoStore();
  const [suggestion, setSuggestion] = useState<NaviSuggestion | null>(null);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [skippedFields, setSkippedFields] = useState<string[]>([]);
  const opsRef = useRef<Oportunidad[]>([]);
  const prevFaltantesRef = useRef<string[]>([]);

  const datosFaltantes = getDatosFaltantes({
    perfil: store.perfil,
    flujoMensual: store.flujoMensual,
    patrimonio: store.patrimonio,
    retiro: store.retiro,
    proteccion: store.proteccion,
  });

  const skippedRef = useRef(skippedFields);
  skippedRef.current = skippedFields;
  const transcripcionRef = useRef(transcripcion);
  transcripcionRef.current = transcripcion;
  const faltantesRef = useRef(datosFaltantes);
  faltantesRef.current = datosFaltantes;

  const fetchSuggestion = useCallback(async (skipOverride?: string[]) => {
    const result = await generarSugerenciaNavi({
      transcripcion: transcripcionRef.current,
      datosRecopilados: {
        ...(store.perfil ?? {}),
        ...(store.flujoMensual ?? {}),
        ...(store.patrimonio ?? {}),
        ...(store.retiro ?? {}),
        ...(store.proteccion ?? {}),
      },
      datosFaltantes: faltantesRef.current,
      contextoCliente: {
        edad: store.perfil?.edad,
        ocupacion: store.perfil?.ocupacion,
        dependientes: store.perfil?.dependientes ?? undefined,
        nombre: store.perfil?.nombre,
      },
      skipFields: skipOverride ?? skippedRef.current,
    });
    setSuggestion(result);
  }, [store.perfil, store.flujoMensual, store.patrimonio, store.retiro, store.proteccion]);

  const handleSkipSuggestion = useCallback(() => {
    const currentTarget = suggestion?.campo_target;
    if (!currentTarget) {
      fetchSuggestion();
      return;
    }
    const newSkipped = [...skippedFields, currentTarget];
    setSkippedFields(newSkipped);
    fetchSuggestion(newSkipped);
  }, [suggestion, skippedFields, fetchSuggestion]);

  // Auto-detect when a field gets answered → clear skipped and refresh
  useEffect(() => {
    const prev = new Set(prevFaltantesRef.current);
    const curr = new Set(datosFaltantes);
    const answered = [...prev].filter((f) => !curr.has(f));
    if (answered.length > 0) {
      const currentTarget = suggestion?.campo_target;
      if (currentTarget && answered.includes(currentTarget)) {
        setSkippedFields([]);
        fetchSuggestion([]);
      }
    }
    prevFaltantesRef.current = datosFaltantes;
  }, [datosFaltantes, suggestion, fetchSuggestion]);

  const fetchOpportunities = useCallback(async () => {
    const result = await detectarOportunidades(transcripcionRef.current, opsRef.current);
    opsRef.current = result;
    setOportunidades(result);
  }, []);

  useEffect(() => {
    fetchSuggestion();
    const interval = setInterval(() => fetchSuggestion(), 20_000);
    return () => clearInterval(interval);
  }, [fetchSuggestion]);

  useEffect(() => {
    fetchOpportunities();
    const interval = setInterval(fetchOpportunities, 30_000);
    return () => clearInterval(interval);
  }, [fetchOpportunities]);

  const categories: DataCategory[] = [
    {
      id: "perfil",
      nombre: "Perfil",
      icono: "👤",
      fields: [
        { nombre: "Nombre", campo: "nombre", valor: store.perfil?.nombre, completado: !!store.perfil?.nombre },
        { nombre: "Edad", campo: "edad", valor: store.perfil?.edad, completado: (store.perfil?.edad ?? 18) !== 18 },
        { nombre: "Género", campo: "genero", valor: store.perfil?.genero, completado: !!store.perfil?.genero },
        { nombre: "Ocupación", campo: "ocupacion", valor: store.perfil?.ocupacion, completado: !!store.perfil?.ocupacion },
        { nombre: "Dependientes", campo: "dependientes", valor: store.perfil?.dependientes, completado: store.perfil?.dependientes !== undefined },
      ],
    },
    {
      id: "flujo",
      nombre: "Flujo mensual",
      icono: "💰",
      fields: [
        { nombre: "Ahorro", campo: "ahorro", valor: store.flujoMensual?.ahorro, completado: (store.flujoMensual?.ahorro ?? 0) > 0 },
        { nombre: "Rentas", campo: "rentas", valor: store.flujoMensual?.rentas, completado: (store.flujoMensual?.rentas ?? 0) > 0 },
        { nombre: "Gastos básicos", campo: "gastos_basicos", valor: store.flujoMensual?.gastos_basicos, completado: (store.flujoMensual?.gastos_basicos ?? 0) > 0 },
        { nombre: "Obligaciones", campo: "obligaciones", valor: store.flujoMensual?.obligaciones, completado: (store.flujoMensual?.obligaciones ?? 0) > 0 },
        { nombre: "Otros ingresos", campo: "otros", valor: store.flujoMensual?.otros, completado: (store.flujoMensual?.otros ?? 0) > 0 },
        { nombre: "Créditos", campo: "creditos", valor: store.flujoMensual?.creditos, completado: (store.flujoMensual?.creditos ?? 0) > 0 },
      ],
    },
    {
      id: "patrimonio_fin",
      nombre: "Patrimonio financiero",
      icono: "🏦",
      fields: [
        { nombre: "Liquidez", campo: "liquidez", valor: store.patrimonio?.liquidez, completado: (store.patrimonio?.liquidez ?? 0) > 0 },
        { nombre: "Inversiones", campo: "inversiones", valor: store.patrimonio?.inversiones, completado: (store.patrimonio?.inversiones ?? 0) > 0 },
        { nombre: "Dotales", campo: "dotales", valor: store.patrimonio?.dotales, completado: (store.patrimonio?.dotales ?? 0) > 0 },
      ],
    },
    {
      id: "retiro",
      nombre: "Esquemas retiro",
      icono: "🏖️",
      fields: [
        { nombre: "Afore", campo: "afore", valor: store.patrimonio?.afore, completado: (store.patrimonio?.afore ?? 0) > 0 },
        { nombre: "PPR", campo: "ppr", valor: store.patrimonio?.ppr, completado: (store.patrimonio?.ppr ?? 0) > 0 },
        { nombre: "Plan privado", campo: "plan_privado", valor: store.patrimonio?.plan_privado, completado: (store.patrimonio?.plan_privado ?? 0) > 0 },
        { nombre: "Seguros retiro", campo: "seguros_retiro", valor: store.patrimonio?.seguros_retiro, completado: (store.patrimonio?.seguros_retiro ?? 0) > 0 },
        { nombre: "Ley 73", campo: "ley_73", valor: store.patrimonio?.ley_73, completado: store.patrimonio?.ley_73 !== null && store.patrimonio?.ley_73 !== undefined },
      ],
    },
    {
      id: "no_financiero",
      nombre: "No financiero",
      icono: "🏠",
      fields: [
        { nombre: "Casa", campo: "casa", valor: store.patrimonio?.casa, completado: (store.patrimonio?.casa ?? 0) > 0 },
        { nombre: "Inmuebles renta", campo: "inmuebles_renta", valor: store.patrimonio?.inmuebles_renta, completado: (store.patrimonio?.inmuebles_renta ?? 0) > 0 },
        { nombre: "Tierra", campo: "tierra", valor: store.patrimonio?.tierra, completado: (store.patrimonio?.tierra ?? 0) > 0 },
        { nombre: "Negocio", campo: "negocio", valor: store.patrimonio?.negocio, completado: (store.patrimonio?.negocio ?? 0) > 0 },
        { nombre: "Herencia", campo: "herencia", valor: store.patrimonio?.herencia, completado: (store.patrimonio?.herencia ?? 0) > 0 },
      ],
    },
    {
      id: "proteccion",
      nombre: "Protección",
      icono: "🛡️",
      fields: [
        { nombre: "Seguro de vida", campo: "seguro_vida", valor: store.proteccion?.seguro_vida, completado: !!store.proteccion?.seguro_vida },
        { nombre: "Propiedades aseguradas", campo: "propiedades_aseguradas", valor: store.proteccion?.propiedades_aseguradas, completado: store.proteccion?.propiedades_aseguradas !== null },
        { nombre: "SGMM", campo: "sgmm", valor: store.proteccion?.sgmm, completado: !!store.proteccion?.sgmm },
      ],
    },
  ];

  const minutosRestantes = maxMinutos - sesionMinutos;
  const categoriasFaltantes = categories
    .filter((c) => c.fields.some((f) => !f.completado))
    .map((c) => c.nombre);

  const insightCount = oportunidades.length + (minutosRestantes <= 5 && categoriasFaltantes.length > 0 ? 1 : 0);

  const TABS: { id: NaviTab; label: string; badge?: number }[] = [
    { id: "guia", label: "Guía" },
    { id: "datos", label: "Datos" },
    { id: "insights", label: "Insights", badge: insightCount > 0 ? insightCount : undefined },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="shrink-0 flex border-b border-white/[0.06]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 relative py-3 text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? "text-[#C9A84C]"
                : "text-[#5A6A85] hover:text-[#8B9BB4]"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {tab.label}
              {tab.badge !== undefined && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#C9A84C] text-[#060D1A] text-[9px] font-bold">
                  {tab.badge}
                </span>
              )}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#C9A84C] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "guia" && (
          <div className="flex flex-col h-full p-4 gap-3">
            <NaviSuggestionCard
              suggestion={suggestion}
              onSkip={handleSkipSuggestion}
            />
            <div className="shrink-0 bg-[#0C1829] border border-white/[0.06] rounded-[14px]">
              <PhaseStepperHorizontal categories={categories} />
            </div>
          </div>
        )}

        {activeTab === "datos" && (
          <div className="p-4 h-full">
            <NaviChecklist categories={categories} />
          </div>
        )}

        {activeTab === "insights" && (
          <div className="flex flex-col gap-3 p-4 h-full">
            <NaviOpportunities oportunidades={oportunidades} />
            <NaviAlert
              faltantes={categoriasFaltantes}
              minutosRestantes={minutosRestantes}
            />
            {oportunidades.length === 0 && minutosRestantes > 5 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="flex gap-1 justify-center">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#4A5A72] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                  <p className="text-xs text-[#5A6A85]">ArIA está analizando la conversación...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
