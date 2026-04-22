"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Check, ChevronDown, ChevronRight, Sparkles, AlertTriangle,
  User, Wallet, Building2, Palmtree, Target, Shield, Lightbulb, X, Pencil,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useDiagnosticoStore, type ExtractedField } from "@/stores/diagnostico-store";
import {
  generarSugerenciaNavi,
  getDatosFaltantes,
  type NaviSuggestion,
} from "@/lib/navi-engine";
import { detectarOportunidades, type Oportunidad } from "@/lib/navi-opportunities";

interface FieldDef {
  nombre: string;
  campo: string;
  preguntaSugerida: string;
  getValue: () => unknown;
  isCompleted: () => boolean;
}

interface CategoryDef {
  id: string;
  nombre: string;
  icon: LucideIcon;
  fields: FieldDef[];
}

interface DataCommandCenterProps {
  transcripcion: string;
  sesionMinutos: number;
  maxMinutos?: number;
  extractedFields: ExtractedField[];
  onAcceptField?: (campo: string) => void;
  onDismissField?: (campo: string) => void;
  onSetField?: (campo: string, valor: string | number | boolean) => void;
}

const BOOLEAN_CAMPOS = ["dependientes", "seguro_vida", "propiedades_aseguradas", "sgmm"];
const CURRENCY_CAMPOS = [
  "ahorro", "rentas", "gastos_basicos", "obligaciones", "otros", "creditos",
  "liquidez", "inversiones", "dotales", "afore", "ppr", "plan_privado",
  "seguros_retiro", "casa", "inmuebles_renta", "tierra", "negocio", "herencia",
];

function CategoryRing({ filled, total, size = 28 }: { filled: number; total: number; size?: number }) {
  const r = (size - 4) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = total > 0 ? filled / total : 0;
  const offset = circumference * (1 - pct);
  const isComplete = filled === total && total > 0;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1A3154" strokeWidth={2.5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={isComplete ? "#10B981" : "#C9A84C"} strokeWidth={2.5}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

function formatValue(campo: string, valor: unknown): string {
  if (valor === undefined || valor === null || valor === "") return "";
  const v = Number(valor);
  const currencyFields = [
    "ahorro", "rentas", "gastos_basicos", "obligaciones", "otros", "creditos",
    "liquidez", "inversiones", "dotales", "afore", "ppr", "plan_privado",
    "seguros_retiro", "casa", "inmuebles_renta", "tierra", "negocio", "herencia",
  ];
  if (!isNaN(v) && v > 0 && currencyFields.includes(campo)) {
    return `$${v.toLocaleString("es-MX")}`;
  }
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  return String(valor);
}

export function DataCommandCenter({
  transcripcion,
  sesionMinutos,
  maxMinutos = 20,
  extractedFields,
  onAcceptField,
  onDismissField,
  onSetField,
}: DataCommandCenterProps) {
  const store = useDiagnosticoStore();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["perfil", "flujo"]));
  const [suggestion, setSuggestion] = useState<NaviSuggestion | null>(null);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const [recentlyFilled, setRecentlyFilled] = useState<Set<string>>(new Set());
  const [skippedFields, setSkippedFields] = useState<string[]>([]);
  const [suggestionTransition, setSuggestionTransition] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const opsRef = useRef<Oportunidad[]>([]);
  const prevFieldCountRef = useRef(0);
  const prevFaltantesRef = useRef<string[]>([]);

  const startEditing = (campo: string, currentValue: unknown) => {
    setEditingField(campo);
    if (currentValue === true) setEditingValue("true");
    else if (currentValue === false) setEditingValue("false");
    else if (currentValue !== null && currentValue !== undefined && currentValue !== 0 && currentValue !== "") {
      setEditingValue(String(currentValue));
    } else {
      setEditingValue("");
    }
    setTimeout(() => editInputRef.current?.focus(), 30);
  };

  const commitEdit = (campo: string) => {
    const raw = editingValue.trim();
    if (raw === "") { setEditingField(null); return; }
    let finalValue: string | number | boolean;
    if (BOOLEAN_CAMPOS.includes(campo)) {
      finalValue = raw === "true";
    } else if (CURRENCY_CAMPOS.includes(campo) || campo === "edad" || campo === "ley_73") {
      const num = parseFloat(raw.replace(/[,\s$]/g, ""));
      finalValue = isNaN(num) ? raw : num;
    } else {
      finalValue = raw;
    }
    onSetField?.(campo, finalValue);
    setEditingField(null);
    setEditingValue("");
  };

  const cancelEdit = () => { setEditingField(null); setEditingValue(""); };

  const categories: CategoryDef[] = [
    {
      id: "perfil", nombre: "Perfil del cliente", icon: User,
      fields: [
        { nombre: "Nombre", campo: "nombre", preguntaSugerida: "¿Me podría dar su nombre completo?", getValue: () => store.perfil?.nombre, isCompleted: () => !!store.perfil?.nombre },
        { nombre: "Edad", campo: "edad", preguntaSugerida: "¿Qué edad tiene actualmente?", getValue: () => store.perfil?.edad, isCompleted: () => (store.perfil?.edad ?? 0) > 0 },
        { nombre: "Género", campo: "genero", preguntaSugerida: "Para el perfil, ¿podría indicarme su género?", getValue: () => store.perfil?.genero, isCompleted: () => !!store.perfil?.genero },
        { nombre: "Ocupación", campo: "ocupacion", preguntaSugerida: "¿A qué se dedica profesionalmente?", getValue: () => store.perfil?.ocupacion, isCompleted: () => !!store.perfil?.ocupacion },
        { nombre: "Dependientes", campo: "dependientes", preguntaSugerida: "¿Tiene dependientes económicos, hijos o familia que dependa de usted?", getValue: () => store.perfil?.dependientes, isCompleted: () => store.perfil?.dependientes !== undefined && store.perfil?.dependientes !== null },
      ],
    },
    {
      id: "flujo", nombre: "Flujo mensual", icon: Wallet,
      fields: [
        { nombre: "Ahorro mensual", campo: "ahorro", preguntaSugerida: "¿Cuánto logra ahorrar al mes aproximadamente?", getValue: () => store.flujoMensual?.ahorro, isCompleted: () => (store.flujoMensual?.ahorro ?? 0) > 0 },
        { nombre: "Rentas", campo: "rentas", preguntaSugerida: "¿Recibe ingresos por rentas de propiedades?", getValue: () => store.flujoMensual?.rentas, isCompleted: () => (store.flujoMensual?.rentas ?? 0) > 0 },
        { nombre: "Gastos básicos", campo: "gastos_basicos", preguntaSugerida: "¿Cuánto gasta al mes en lo esencial — alimentación, servicios, transporte?", getValue: () => store.flujoMensual?.gastos_basicos, isCompleted: () => (store.flujoMensual?.gastos_basicos ?? 0) > 0 },
        { nombre: "Obligaciones", campo: "obligaciones", preguntaSugerida: "¿Tiene pagos fijos como colegiaturas, seguros o mantenimientos?", getValue: () => store.flujoMensual?.obligaciones, isCompleted: () => (store.flujoMensual?.obligaciones ?? 0) > 0 },
        { nombre: "Otros ingresos", campo: "otros", preguntaSugerida: "¿Tiene algún otro ingreso adicional al sueldo?", getValue: () => store.flujoMensual?.otros, isCompleted: () => (store.flujoMensual?.otros ?? 0) > 0 },
        { nombre: "Créditos", campo: "creditos", preguntaSugerida: "¿Paga algún crédito actualmente — hipoteca, auto, tarjetas?", getValue: () => store.flujoMensual?.creditos, isCompleted: () => (store.flujoMensual?.creditos ?? 0) > 0 },
      ],
    },
    {
      id: "patrimonio_fin", nombre: "Patrimonio financiero", icon: Building2,
      fields: [
        { nombre: "Liquidez", campo: "liquidez", preguntaSugerida: "¿Cuánto tiene disponible en cuentas bancarias o efectivo?", getValue: () => store.patrimonio?.liquidez, isCompleted: () => (store.patrimonio?.liquidez ?? 0) > 0 },
        { nombre: "Inversiones", campo: "inversiones", preguntaSugerida: "¿Tiene inversiones en fondos, acciones o instrumentos financieros?", getValue: () => store.patrimonio?.inversiones, isCompleted: () => (store.patrimonio?.inversiones ?? 0) > 0 },
        { nombre: "Dotales", campo: "dotales", preguntaSugerida: "¿Tiene seguros dotales o productos con componente de ahorro?", getValue: () => store.patrimonio?.dotales, isCompleted: () => (store.patrimonio?.dotales ?? 0) > 0 },
      ],
    },
    {
      id: "retiro", nombre: "Esquemas de retiro", icon: Palmtree,
      fields: [
        { nombre: "Afore", campo: "afore", preguntaSugerida: "¿Sabe cuánto tiene acumulado en su Afore?", getValue: () => store.patrimonio?.afore, isCompleted: () => (store.patrimonio?.afore ?? 0) > 0 },
        { nombre: "PPR", campo: "ppr", preguntaSugerida: "¿Tiene un Plan Personal de Retiro?", getValue: () => store.patrimonio?.ppr, isCompleted: () => (store.patrimonio?.ppr ?? 0) > 0 },
        { nombre: "Plan privado", campo: "plan_privado", preguntaSugerida: "¿Su empresa le ofrece algún plan de pensión privado?", getValue: () => store.patrimonio?.plan_privado, isCompleted: () => (store.patrimonio?.plan_privado ?? 0) > 0 },
        { nombre: "Seguros retiro", campo: "seguros_retiro", preguntaSugerida: "¿Tiene algún seguro con beneficio de retiro?", getValue: () => store.patrimonio?.seguros_retiro, isCompleted: () => (store.patrimonio?.seguros_retiro ?? 0) > 0 },
        // Ley 73 only applies to workers who enrolled in IMSS before July 1997 (age ≥ ~46).
        // Hide the field when we know the client is younger to avoid confusion.
        ...((store.perfil?.edad ?? 0) === 0 || (store.perfil?.edad ?? 0) >= 46
          ? [{ nombre: "Ley 73", campo: "ley_73", preguntaSugerida: "¿Cotiza bajo la Ley 73 del IMSS? ¿Conoce su pensión estimada?", getValue: () => store.patrimonio?.ley_73, isCompleted: () => store.patrimonio?.ley_73 !== null && store.patrimonio?.ley_73 !== undefined }]
          : []),
      ],
    },
    {
      id: "no_financiero", nombre: "Patrimonio no financiero", icon: Target,
      fields: [
        { nombre: "Casa habitación", campo: "casa", preguntaSugerida: "¿Tiene casa propia? ¿Cuál es su valor aproximado?", getValue: () => store.patrimonio?.casa, isCompleted: () => (store.patrimonio?.casa ?? 0) > 0 },
        { nombre: "Inmuebles en renta", campo: "inmuebles_renta", preguntaSugerida: "¿Tiene propiedades que rente o pueda rentar?", getValue: () => store.patrimonio?.inmuebles_renta, isCompleted: () => (store.patrimonio?.inmuebles_renta ?? 0) > 0 },
        { nombre: "Tierra", campo: "tierra", preguntaSugerida: "¿Tiene terrenos o tierra?", getValue: () => store.patrimonio?.tierra, isCompleted: () => (store.patrimonio?.tierra ?? 0) > 0 },
        { nombre: "Negocio", campo: "negocio", preguntaSugerida: "¿Tiene un negocio propio? ¿Cuál es su valor estimado?", getValue: () => store.patrimonio?.negocio, isCompleted: () => (store.patrimonio?.negocio ?? 0) > 0 },
        { nombre: "Herencia esperada", campo: "herencia", preguntaSugerida: "¿Espera recibir alguna herencia en el futuro?", getValue: () => store.patrimonio?.herencia, isCompleted: () => (store.patrimonio?.herencia ?? 0) > 0 },
      ],
    },
    {
      id: "proteccion", nombre: "Protección", icon: Shield,
      fields: [
        { nombre: "Seguro de vida", campo: "seguro_vida", preguntaSugerida: "¿Cuenta con un seguro de vida?", getValue: () => store.proteccion?.seguro_vida, isCompleted: () => store.proteccion?.seguro_vida !== undefined && store.proteccion?.seguro_vida !== null },
        { nombre: "Propiedades aseguradas", campo: "propiedades_aseguradas", preguntaSugerida: "¿Sus propiedades están aseguradas?", getValue: () => store.proteccion?.propiedades_aseguradas, isCompleted: () => store.proteccion?.propiedades_aseguradas !== null && store.proteccion?.propiedades_aseguradas !== undefined },
        { nombre: "SGMM", campo: "sgmm", preguntaSugerida: "¿Tiene Seguro de Gastos Médicos Mayores?", getValue: () => store.proteccion?.sgmm, isCompleted: () => store.proteccion?.sgmm !== undefined && store.proteccion?.sgmm !== null },
      ],
    },
  ];

  const totalFields = categories.reduce((s, c) => s + c.fields.length, 0);
  const totalFilled = categories.reduce((s, c) => s + c.fields.filter((f) => f.isCompleted()).length, 0);

  // All campos that have a pending (unaccepted) extraction with enough confidence
  const pendingCampos = categories
    .flatMap((c) => c.fields.map((f) => f.campo))
    .filter((campo) =>
      extractedFields.some((e) => e.campo === campo && !e.aceptado && e.confianza >= 0.7)
    );

  const handleAcceptAll = () => {
    pendingCampos.forEach((campo) => onAcceptField?.(campo));
  };

  // Track recently filled fields for animation
  useEffect(() => {
    if (totalFilled > prevFieldCountRef.current) {
      const newlyFilled = new Set<string>();
      for (const cat of categories) {
        for (const f of cat.fields) {
          if (f.isCompleted()) newlyFilled.add(f.campo);
        }
      }
      setRecentlyFilled(newlyFilled);
      const timer = setTimeout(() => setRecentlyFilled(new Set()), 3000);
      return () => clearTimeout(timer);
    }
    prevFieldCountRef.current = totalFilled;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalFilled]);

  // Auto-expand first incomplete category
  useEffect(() => {
    for (const cat of categories) {
      const filled = cat.fields.filter((f) => f.isCompleted()).length;
      if (filled < cat.fields.length) {
        setExpandedCats((prev) => {
          const next = new Set(prev);
          next.add(cat.id);
          return next;
        });
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalFilled]);

  // Fetch Navi suggestion
  const datosFaltantes = getDatosFaltantes({
    perfil: store.perfil,
    flujoMensual: store.flujoMensual,
    patrimonio: store.patrimonio,
    retiro: store.retiro,
    proteccion: store.proteccion,
  });

  // Keep refs so interval/callbacks always read fresh values
  const skippedRef = useRef(skippedFields);
  skippedRef.current = skippedFields;
  const transcripcionRef = useRef(transcripcion);
  transcripcionRef.current = transcripcion;
  const faltantesRef = useRef(datosFaltantes);
  faltantesRef.current = datosFaltantes;

  const fetchSuggestion = useCallback(async (skipOverride?: string[]) => {
    setSuggestionTransition(true);
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
    setTimeout(() => setSuggestionTransition(false), 300);
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

  // Auto-detect when a field gets answered → refresh suggestion & clear skipped
  useEffect(() => {
    const prev = new Set(prevFaltantesRef.current);
    const curr = new Set(datosFaltantes);
    const answered = [...prev].filter((f) => !curr.has(f));

    if (answered.length > 0) {
      // A field was just answered — if it was the current suggestion's target, auto-refresh
      const currentTarget = suggestion?.campo_target;
      if (currentTarget && answered.includes(currentTarget)) {
        setSkippedFields([]);
        fetchSuggestion([]);
      }
    }
    prevFaltantesRef.current = datosFaltantes;
  }, [datosFaltantes, suggestion, fetchSuggestion]);

  const storedInsightIdsRef = useRef<Set<string>>(new Set());

  const fetchOpportunities = useCallback(async () => {
    const storeSnapshot = {
      perfil: store.perfil,
      flujoMensual: store.flujoMensual,
      patrimonio: store.patrimonio,
      retiro: store.retiro,
      proteccion: store.proteccion,
    };
    const result = await detectarOportunidades(transcripcionRef.current, opsRef.current, storeSnapshot);

    // Persist all detected opportunities as session insights for CRM follow-up
    for (const op of result) {
      if (!storedInsightIdsRef.current.has(op.oportunidad)) {
        storedInsightIdsRef.current.add(op.oportunidad);
        // AI opportunities with contexto_seguimiento → tipo "seguimiento" (post-sale follow-up)
        // Everything else → tipo "oportunidad" (cross-sell)
        const tipo = op.fuente === "ai" && op.contexto_seguimiento ? "seguimiento" : "oportunidad";
        store.addSessionInsight({
          tipo,
          texto: op.oportunidad + (op.razon ? ` — ${op.razon}` : ""),
          producto_sugerido: op.producto_sugerido,
          confianza: op.confianza,
          fase: "conversacion",
          contexto_seguimiento: op.contexto_seguimiento,
          accion_sugerida: op.accion_sugerida,
          señal_detectada: op.señal_detectada,
        });
      }
    }

    opsRef.current = result;
    setOportunidades(result);
  }, [store]);

  // Periodic refresh: every 20s for suggestions (Haiku needs time), 30s for opportunities
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

  const toggleCat = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const minutosRestantes = maxMinutos - sesionMinutos;
  const missingCount = totalFields - totalFilled;

  // Find the first missing field for prominent display
  const firstMissingField = (() => {
    for (const cat of categories) {
      for (const f of cat.fields) {
        if (!f.isCompleted()) return { cat, field: f };
      }
    }
    return null;
  })();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top: Next question suggestion — the most prominent element */}
      <div className="shrink-0 p-4 border-b border-white/[0.06]">
        {suggestion ? (
          <div className={`rounded-xl bg-gradient-to-r from-[#C9A84C]/[0.08] to-transparent border border-[#C9A84C]/20 p-4 transition-all duration-300 ${
            suggestionTransition ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"
          }`}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#E8C872] flex items-center justify-center shadow-[0_0_12px_rgba(201,168,76,0.3)] animate-pulse-glow shrink-0">
                <Sparkles className="w-4 h-4 text-[#060D1A]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-[#C9A84C] font-semibold mb-1">
                  Pregunta sugerida
                </p>
                <p className="text-[15px] text-[#F0F4FA] font-medium leading-relaxed">
                  &ldquo;{suggestion.texto}&rdquo;
                </p>
                {suggestion.campo_target && (
                  <p className="text-[11px] text-[#8B9BB4] mt-1.5">
                    Para obtener: <span className="text-[#C9A84C] font-semibold">{suggestion.campo_target}</span>
                    {suggestion.categoria && <span> &middot; {suggestion.categoria}</span>}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleSkipSuggestion}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#8B9BB4] hover:text-[#C9A84C] border border-white/[0.08] hover:border-[#C9A84C]/30 transition-colors"
                title="Saltar y ver otra pregunta"
              >
                <ChevronRight className="w-3 h-3" />
                Otra
              </button>
            </div>
          </div>
        ) : firstMissingField ? (
          <div className="rounded-xl bg-[#0C1829] border border-white/[0.06] p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1A3154] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[#8B9BB4]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-[#8B9BB4] font-semibold mb-1">
                  Siguiente dato por obtener
                </p>
                <p className="text-[15px] text-[#F0F4FA] font-medium">
                  &ldquo;{firstMissingField.field.preguntaSugerida}&rdquo;
                </p>
                <p className="text-[11px] text-[#8B9BB4] mt-1">
                  {firstMissingField.cat.nombre} &middot; {firstMissingField.field.nombre}
                </p>
              </div>
              <button
                type="button"
                onClick={() => fetchSuggestion()}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#8B9BB4] hover:text-[#C9A84C] border border-white/[0.08] hover:border-[#C9A84C]/30 transition-colors"
              >
                <ChevronRight className="w-3 h-3" />
                Otra
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 p-4 text-center">
            <p className="text-sm text-[#10B981] font-semibold">Todos los datos recopilados</p>
          </div>
        )}
      </div>

      {/* Summary bar: missing count + time warning + confirm-all */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-[#0A1628] border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#8B9BB4]">
            <span className="text-[#F0F4FA] font-bold">{totalFilled}</span>/{totalFields} datos
          </span>
          {missingCount > 0 && (
            <span className="text-xs text-[#C9A84C]">
              {missingCount} por obtener
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {pendingCampos.length > 0 && (
            <button
              type="button"
              onClick={handleAcceptAll}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20 border border-[#10B981]/25 hover:border-[#10B981]/50 transition-colors"
            >
              <Check className="w-3 h-3" />
              Confirmar {pendingCampos.length > 1 ? `todos (${pendingCampos.length})` : "dato"}
            </button>
          )}
          {minutosRestantes <= 5 && missingCount > 0 && (
            <div className="flex items-center gap-1.5 text-[#EF4444]">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-[11px] font-semibold">{Math.ceil(minutosRestantes)} min restantes</span>
            </div>
          )}
        </div>
      </div>

      {/* Main scrollable area: all categories + fields */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const filled = cat.fields.filter((f) => f.isCompleted()).length;
          const total = cat.fields.length;
          const isComplete = filled === total;
          const isExpanded = expandedCats.has(cat.id);
          const hasExtractedPending = cat.fields.some((f) => {
            const ef = extractedFields.find((e) => e.campo === f.campo && !e.aceptado && e.confianza >= 0.7);
            return !!ef;
          });

          return (
            <div key={cat.id} className={`rounded-xl border transition-colors ${
              isComplete
                ? "border-[#10B981]/20 bg-[#10B981]/[0.03]"
                : hasExtractedPending
                ? "border-[#C9A84C]/20 bg-[#C9A84C]/[0.02]"
                : "border-white/[0.06] bg-[#0C1829]"
            }`}>
              <button
                type="button"
                onClick={() => toggleCat(cat.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <CategoryRing filled={filled} total={total} />
                <Icon className={`w-4 h-4 shrink-0 ${isComplete ? "text-[#10B981]" : "text-[#8B9BB4]"}`} />
                <span className={`text-sm font-semibold flex-1 ${isComplete ? "text-[#10B981]" : "text-[#F0F4FA]"}`}>
                  {cat.nombre}
                </span>
                <span className={`text-xs font-mono ${isComplete ? "text-[#10B981]" : "text-[#8B9BB4]"}`}>
                  {filled}/{total}
                </span>
                {isExpanded
                  ? <ChevronDown className="w-4 h-4 text-[#4A5A72]" />
                  : <ChevronRight className="w-4 h-4 text-[#4A5A72]" />
                }
              </button>

              {isExpanded && (
                <div className="px-4 pb-3 space-y-1">
                  {cat.fields.map((field) => {
                    const completed = field.isCompleted();
                    const value = field.getValue();
                    const pendingExtract = extractedFields.find(
                      (e) => e.campo === field.campo && !e.aceptado && e.confianza >= 0.7
                    );
                    const wasRecentlyFilled = recentlyFilled.has(field.campo) && completed;
                    const isEditing = editingField === field.campo;
                    const isBool = BOOLEAN_CAMPOS.includes(field.campo);

                    return (
                      <div
                        key={field.campo}
                        className={`rounded-lg px-3 py-2.5 transition-all duration-300 ${
                          isEditing
                            ? "bg-[#0F1E36] border border-[#C9A84C]/40"
                            : wasRecentlyFilled
                            ? "bg-[#10B981]/10 border border-[#10B981]/30 animate-pulse"
                            : completed
                            ? "bg-[#1A3154]/30 hover:bg-[#1A3154]/50 cursor-pointer group"
                            : pendingExtract
                            ? "bg-[#C9A84C]/[0.06] border border-[#C9A84C]/20"
                            : "bg-transparent hover:bg-[#0C1829] cursor-pointer"
                        }`}
                        onClick={() => {
                          if (!isEditing && !pendingExtract) {
                            startEditing(field.campo, completed ? value : "");
                          }
                        }}
                      >
                        {/* ── Edit mode ── */}
                        {isEditing ? (
                          isBool ? (
                            <div className="flex items-center gap-2">
                              <Pencil className="w-3 h-3 text-[#C9A84C] shrink-0" />
                              <span className="text-xs text-[#8B9BB4] flex-1">{field.nombre}</span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onSetField?.(field.campo, true); setEditingField(null); setEditingValue(""); }}
                                className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${editingValue === "true" ? "bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981]" : "border-white/[0.1] text-[#8B9BB4] hover:border-[#10B981]/30 hover:text-[#10B981]"}`}
                              >Sí</button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onSetField?.(field.campo, false); setEditingField(null); setEditingValue(""); }}
                                className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${editingValue === "false" ? "bg-[#EF4444]/10 border-[#EF4444]/40 text-[#EF4444]" : "border-white/[0.1] text-[#8B9BB4] hover:border-[#EF4444]/30 hover:text-[#EF4444]"}`}
                              >No</button>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                                className="w-5 h-5 rounded flex items-center justify-center text-[#5A6A85] hover:text-[#EF4444] transition-colors"
                              ><X className="w-3 h-3" /></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Pencil className="w-3 h-3 text-[#C9A84C] shrink-0" />
                              <span className="text-xs text-[#8B9BB4] shrink-0">{field.nombre}</span>
                              <input
                                ref={editInputRef}
                                type={CURRENCY_CAMPOS.includes(field.campo) || field.campo === "edad" || field.campo === "ley_73" ? "number" : "text"}
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitEdit(field.campo);
                                  if (e.key === "Escape") cancelEdit();
                                }}
                                placeholder={CURRENCY_CAMPOS.includes(field.campo) ? "Monto MXN" : ""}
                                className="flex-1 min-w-0 bg-[#060D1A] border border-[#C9A84C]/40 rounded px-2 py-0.5 text-xs text-[#F0F4FA] outline-none focus:border-[#C9A84C]/80 placeholder:text-[#3A4A5A]"
                              />
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => { e.stopPropagation(); commitEdit(field.campo); }}
                                className="shrink-0 w-6 h-6 rounded flex items-center justify-center bg-[#10B981]/10 hover:bg-[#10B981]/25 border border-[#10B981]/30 text-[#10B981] transition-colors"
                              ><Check className="w-3 h-3" /></button>
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => { e.stopPropagation(); cancelEdit(); }}
                                className="shrink-0 w-6 h-6 rounded flex items-center justify-center bg-white/[0.04] border border-white/[0.08] text-[#5A6A85] hover:text-[#EF4444] transition-colors"
                              ><X className="w-3 h-3" /></button>
                            </div>
                          )
                        ) : completed ? (
                          /* ── Completed ── */
                          <div className="flex items-center gap-2.5">
                            <Check className="w-4 h-4 text-[#10B981] shrink-0 group-hover:opacity-0 transition-opacity" />
                            <Pencil className="w-3.5 h-3.5 text-[#C9A84C] shrink-0 absolute opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-xs text-[#8B9BB4] flex-1">{field.nombre}</span>
                            <span className="text-sm text-[#F0F4FA] font-semibold group-hover:text-[#C9A84C] transition-colors">
                              {formatValue(field.campo, value)}
                            </span>
                            <Pencil className="w-3 h-3 text-[#C9A84C]/0 group-hover:text-[#C9A84C]/60 shrink-0 transition-colors" />
                          </div>
                        ) : pendingExtract ? (
                          /* ── Pending (ArIA detected, awaiting confirm) ── */
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <div className="w-4 h-4 rounded-full border-2 border-[#C9A84C] flex items-center justify-center shrink-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse" />
                            </div>
                            <span className="text-xs text-[#C9A84C] font-medium flex-1 truncate">{field.nombre}</span>
                            <span className="text-sm text-[#F0F4FA] font-semibold">
                              {formatValue(field.campo, pendingExtract.valor)}
                            </span>
                            <button
                              type="button"
                              title="Editar valor"
                              onClick={(e) => { e.stopPropagation(); startEditing(field.campo, pendingExtract.valor); }}
                              className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[#5A6A85] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 border border-transparent hover:border-[#C9A84C]/25 transition-colors"
                            ><Pencil className="w-3 h-3" /></button>
                            <button
                              type="button"
                              title="Confirmar"
                              onClick={(e) => { e.stopPropagation(); onAcceptField?.(field.campo); }}
                              className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-[#10B981]/10 hover:bg-[#10B981]/25 border border-[#10B981]/30 hover:border-[#10B981]/60 transition-colors"
                            ><Check className="w-3 h-3 text-[#10B981]" /></button>
                            <button
                              type="button"
                              title="Descartar"
                              onClick={(e) => { e.stopPropagation(); onDismissField?.(field.campo); }}
                              className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center bg-white/[0.04] hover:bg-[#EF4444]/10 border border-white/[0.08] hover:border-[#EF4444]/30 transition-colors"
                            ><X className="w-3 h-3 text-[#5A6A85] hover:text-[#EF4444]" /></button>
                          </div>
                        ) : (
                          /* ── Empty — click to enter ── */
                          <div>
                            <div className="flex items-center gap-2.5">
                              <div className="w-4 h-4 rounded border border-[#4A5A72]/50 shrink-0" />
                              <span className="text-xs text-[#5A6A85] flex-1">{field.nombre}</span>
                              <span className="text-[10px] text-[#C9A84C]/50 font-medium px-1.5 py-0.5 rounded border border-[#C9A84C]/20 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]/80 transition-colors">
                                + Ingresar
                              </span>
                            </div>
                            <p className="text-[11px] text-[#4A5A72] mt-1 ml-[26px] italic">
                              &ldquo;{field.preguntaSugerida}&rdquo;
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Opportunities section */}
        {oportunidades.length > 0 && (
          <div className="rounded-xl border border-[#C9A84C]/15 bg-[#0C1829] p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-[#C9A84C]" />
              <p className="text-xs text-[#C9A84C] font-semibold uppercase tracking-wider">
                Oportunidades detectadas ({oportunidades.length})
              </p>
            </div>
            <div className="space-y-2.5">
              {oportunidades.map((op) => (
                <div key={op.id} className="rounded-lg bg-[#1A3154]/30 overflow-hidden">
                  <div className="flex items-start gap-2.5 px-3 py-2.5">
                    <span className="text-sm shrink-0 mt-0.5">{op.icono}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-[#F0F4FA] font-semibold">{op.oportunidad}</p>
                        {op.fuente === "ai" && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#8B5CF6]/15 text-[#8B5CF6] font-medium shrink-0">AI</span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#C9A84C] mt-0.5">{op.producto_sugerido}</p>
                      {op.señal_detectada && (
                        <p className="text-[10px] text-[#8B9BB4] mt-1 italic">
                          &ldquo;{op.señal_detectada}&rdquo;
                        </p>
                      )}
                      {op.accion_sugerida && (
                        <p className="text-[10px] text-[#10B981] mt-1 font-medium">
                          → {op.accion_sugerida}
                        </p>
                      )}
                    </div>
                  </div>
                  {op.contexto_seguimiento && (
                    <div className="px-3 pb-2 pt-0">
                      <p className="text-[9px] text-[#5A6A85] leading-relaxed pl-[22px]">
                        Seguimiento: {op.contexto_seguimiento}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
