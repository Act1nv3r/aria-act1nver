import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface Perfil {
  nombre: string;
  edad: number;
  genero: string;
  ocupacion: string;
  dependientes: boolean | null;
}

interface FlujoMensual {
  ahorro: number;
  rentas: number;
  otros: number;
  gastos_basicos: number;
  obligaciones: number;
  creditos: number;
}

interface Patrimonio {
  liquidez: number;
  inversiones: number;
  dotales: number;
  afore: number;
  ppr: number;
  plan_privado: number;
  seguros_retiro: number;
  ley_73: number | null;
  casa: number;
  inmuebles_renta: number;
  tierra: number;
  negocio: number;
  herencia: number;
  hipoteca: number;
  saldo_planes: number;
  compromisos: number;
}

interface Retiro {
  edad_retiro: number;
  mensualidad_deseada: number;
  edad_defuncion: number;
}

export interface CriterioActivo {
  vende: boolean;
  edad_venta?: number;
  valor_venta?: number;
}

export interface CriteriosTrayectoria {
  casa: CriterioActivo;
  tierra: CriterioActivo;
  inmuebles_renta: CriterioActivo;
  negocio: CriterioActivo;
  herencia: { edad_recepcion?: number };
}

interface Objetivo {
  nombre: string;
  monto: number;
  plazo: number;
}

interface Objetivos {
  aportacion_inicial: number;
  aportacion_mensual: number;
  lista: Objetivo[];
}

interface Proteccion {
  seguro_vida: boolean | null;
  propiedades_aseguradas: boolean | null;
  sgmm: boolean | null;
}

interface Outputs {
  motorA: unknown | null;
  motorB: unknown | null;
  motorC: unknown | null;
  motorD: unknown | null;
  motorE: unknown | null;
  motorF: unknown | null;
  titular?: unknown;
  pareja?: unknown;
  hogar?: unknown;
}

export interface SessionInsight {
  id: string;
  tipo: "oportunidad" | "insight" | "contexto" | "seguimiento";
  texto: string;
  producto_sugerido?: string;
  confianza: number;
  fase: "conversacion" | "simulacion" | "presentacion";
  created_at: number;
  contexto_seguimiento?: string;
  accion_sugerida?: string;
  señal_detectada?: string;
  clienteId?: string;
  // Task management
  estado_tarea: "pendiente" | "en_proceso" | "completada" | "descartada";
  justificacion_descarte?: string;
  fecha_completada?: number;
}

export interface SavedSimulation {
  id: string;
  nombre: string;
  created_at: number;
  params: {
    edad_retiro: number;
    ahorro: number;
    mensualidad_deseada: number;
    tasa_real: number;
    aportacion_extra: number;
    venta_activo_edad: number;
    venta_activo_monto: number;
  };
  resultados: {
    grado_avance: number;
    mensualidad_posible: number;
    deficit_mensual: number;
    saldo_inicio_jubilacion: number;
    pension_total_mensual: number;
  };
}

export interface SavedDocument {
  id: string;
  tipo: "balance" | "diagnostico";
  nombre_archivo: string;
  cliente_nombre: string;
  created_at: number;
  diagnostico_id?: string;
}

export interface ClienteSnapshot {
  cliente_id: string;
  diagnostico_id: string;
  completed_at: number;
  perfil: {
    nombre: string;
    edad: number;
    genero: string;
    ocupacion: string;
    dependientes: boolean | null;
  };
  flujoMensual: {
    ahorro: number;
    rentas: number;
    otros: number;
    gastos_basicos: number;
    obligaciones: number;
    creditos: number;
  };
  patrimonio: {
    liquidez: number;
    inversiones: number;
    dotales: number;
    afore: number;
    ppr: number;
    plan_privado: number;
    seguros_retiro: number;
    ley_73: number | null;
    casa: number;
    inmuebles_renta: number;
    tierra: number;
    negocio: number;
    herencia: number;
    hipoteca: number;
  };
  retiro: {
    edad_retiro: number;
    mensualidad_deseada: number;
  };
  proteccion: {
    seguro_vida: boolean | null;
    propiedades_aseguradas: boolean | null;
    sgmm: boolean | null;
  };
  oportunidades: Array<{
    id: string;
    titulo: string;
    descripcion: string;
    producto_sugerido: string;
    categoria: string;
    prioridad: string;
    confianza: number;
    estado: "pendiente" | "en_proceso" | "completada" | "descartada";
    created_at: number;
  }>;
}

export interface ExtractedField {
  campo: string;
  valor: string | number | boolean;
  confianza: number;
  texto_fuente: string;
  aceptado: boolean;
  timestamp: number;
}

type OwnershipValue = "titular" | "pareja" | "compartido";

interface DiagnosticoStore {
  pasoActual: number;
  pasosCompletados: number[];
  modo: "individual" | "pareja";
  perfil: Perfil | null;
  flujoMensual: FlujoMensual | null;
  patrimonio: Patrimonio | null;
  retiro: Retiro | null;
  objetivos: Objetivos | null;
  proteccion: Proteccion | null;
  pareja_perfil: Perfil | null;
  pareja_flujoMensual: FlujoMensual | null;
  pareja_patrimonio: Patrimonio | null;
  pareja_retiro: Retiro | null;
  pareja_objetivos: Objetivos | null;
  pareja_proteccion: Proteccion | null;
  ownership: Record<string, OwnershipValue>;
  outputs: Outputs;
  criterios_trayectoria: CriteriosTrayectoria;

  // v2 session fields
  sesion_duracion_minutos: number;
  datos_fuente: "voz" | "manual" | "mixto";
  completitud_pct: number;
  sesion_insights: SessionInsight[];
  extracted_fields: ExtractedField[];
  sesion_inicio: number | null;
  simulaciones_guardadas: SavedSimulation[];
  documentos_guardados: SavedDocument[];
  diagnosticos_completados: Record<string, { nombre: string; completed_at: number; modo: string }>;
  perfiles_completados: Record<string, ClienteSnapshot>;
  currentClienteId: string | null;
  salud_scores: Record<string, number>; // clienteId → score 0-100

  setPaso: (paso: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  completarPaso: (paso: number) => void;
  updatePerfil: (data: Partial<Perfil>) => void;
  updateFlujoMensual: (data: Partial<FlujoMensual>) => void;
  updatePatrimonio: (data: Partial<Patrimonio>) => void;
  updateRetiro: (data: Partial<Retiro>) => void;
  updateObjetivos: (data: Partial<Objetivos>) => void;
  updateProteccion: (data: Partial<Proteccion>) => void;
  updateOutputs: (motor: keyof Outputs, data: unknown) => void;
  setModo: (modo: "individual" | "pareja") => void;
  updateParejaPerfil: (data: Partial<Perfil>) => void;
  updateParejaFlujoMensual: (data: Partial<FlujoMensual>) => void;
  updateParejaPatrimonio: (data: Partial<Patrimonio>) => void;
  updateParejaRetiro: (data: Partial<Retiro>) => void;
  updateParejaObjetivos: (data: Partial<Objetivos>) => void;
  updateParejaProteccion: (data: Partial<Proteccion>) => void;
  updateOwnership: (asset: string, value: OwnershipValue) => void;

  // v2 actions
  setSesionInicio: () => void;
  setDatosFuente: (fuente: "voz" | "manual" | "mixto") => void;
  setCurrentClienteId: (clienteId: string) => void;
  updateCompletitud: () => void;
  addSessionInsight: (insight: Omit<SessionInsight, "id" | "created_at" | "estado_tarea">) => void;
  updateInsightEstado: (id: string, estado: SessionInsight["estado_tarea"], justificacion?: string) => void;
  addExtractedField: (field: Omit<ExtractedField, "timestamp">) => void;
  acceptExtractedField: (campo: string) => void;
  updateExtractedFieldValue: (campo: string, valor: string | number | boolean) => void;
  applyExtractedField: (field: ExtractedField) => void;
  addSimulacion: (sim: Omit<SavedSimulation, "id" | "created_at">) => void;
  removeSimulacion: (id: string) => void;
  addDocumento: (doc: Omit<SavedDocument, "id" | "created_at">) => void;
  removeDocumento: (id: string) => void;
  marcarDiagnosticoCompleto: (diagnosticoId: string, nombre: string, modo: string) => void;
  guardarSnapshotCliente: (clienteId: string, diagnosticoId: string) => void;
  agregarOportunidadesSnapshot: (clienteId: string, oportunidades: ClienteSnapshot["oportunidades"]) => void;
  actualizarEstadoOportunidadSnapshot: (clienteId: string, oportunidadId: string, estado: ClienteSnapshot["oportunidades"][number]["estado"]) => void;
  guardarScoreSalud: (clienteId: string, score: number) => void;
  updateCriteriosTrayectoria: (data: Partial<CriteriosTrayectoria>) => void;
  resetSession: () => void;
  reset: () => void;
}

// Session-only data reset when a new session starts (does NOT include cross-session persistent data)
const sessionBlank = {
  pasoActual: 1,
  pasosCompletados: [] as number[],
  perfil: {
    nombre: "",
    edad: 0,
    genero: "",
    ocupacion: "",
    dependientes: null as null,
  },
  flujoMensual: {
    ahorro: 0,
    rentas: 0,
    otros: 0,
    gastos_basicos: 0,
    obligaciones: 0,
    creditos: 0,
  },
  patrimonio: {
    liquidez: 0,
    inversiones: 0,
    dotales: 0,
    afore: 0,
    ppr: 0,
    plan_privado: 0,
    seguros_retiro: 0,
    ley_73: null as null,
    casa: 0,
    inmuebles_renta: 0,
    tierra: 0,
    negocio: 0,
    herencia: 0,
    hipoteca: 0,
    saldo_planes: 0,
    compromisos: 0,
  },
  retiro: {
    edad_retiro: 65,
    mensualidad_deseada: 0,
    edad_defuncion: 85,
  },
  objetivos: {
    aportacion_inicial: 0,
    aportacion_mensual: 0,
    lista: [] as Array<{ nombre: string; monto: number; plazo: number }>,
  },
  proteccion: {
    seguro_vida: null as null,
    propiedades_aseguradas: null as null,
    sgmm: null as null,
  },
  outputs: {
    motorA: null as null,
    motorB: null as null,
    motorC: null as null,
    motorD: null as null,
    motorE: null as null,
    motorF: null as null,
  },
  pareja_perfil: null as null,
  pareja_flujoMensual: null as null,
  pareja_patrimonio: null as null,
  pareja_retiro: null as null,
  pareja_objetivos: null as null,
  pareja_proteccion: null as null,
  ownership: {
    casa: "compartido" as OwnershipValue,
    inmuebles_renta: "titular" as OwnershipValue,
    hipoteca: "compartido" as OwnershipValue,
    tierra: "titular" as OwnershipValue,
    negocio: "titular" as OwnershipValue,
    herencia: "titular" as OwnershipValue,
    saldo_planes: "titular" as OwnershipValue,
    compromisos: "titular" as OwnershipValue,
  },
  sesion_duracion_minutos: 0,
  datos_fuente: "manual" as const,
  completitud_pct: 0,
  extracted_fields: [] as ExtractedField[],
  sesion_inicio: null as number | null,
  criterios_trayectoria: {
    casa: { vende: false },
    tierra: { vende: false },
    inmuebles_renta: { vende: false },
    negocio: { vende: false },
    herencia: {},
  } as CriteriosTrayectoria,
};

const initialState = {
  ...sessionBlank,
  modo: "individual" as const,
  sesion_insights: [] as SessionInsight[],
  simulaciones_guardadas: [] as SavedSimulation[],
  documentos_guardados: [] as SavedDocument[],
  diagnosticos_completados: {} as Record<string, { nombre: string; completed_at: number; modo: string }>,
  perfiles_completados: {} as Record<string, ClienteSnapshot>,
  currentClienteId: null as string | null,
  salud_scores: {} as Record<string, number>,
};

const parejaDemo = {
  pareja_perfil: {
    nombre: "",
    edad: 0,
    genero: "",
    ocupacion: "",
    dependientes: null as null,
  },
  pareja_flujoMensual: {
    ahorro: 0,
    rentas: 0,
    otros: 0,
    gastos_basicos: 0,
    obligaciones: 0,
    creditos: 0,
  },
  pareja_patrimonio: {
    liquidez: 0,
    inversiones: 0,
    dotales: 0,
    afore: 0,
    ppr: 0,
    plan_privado: 0,
    seguros_retiro: 0,
    ley_73: null,
    casa: 0,
    inmuebles_renta: 0,
    tierra: 0,
    negocio: 0,
    herencia: 0,
    hipoteca: 0,
    saldo_planes: 0,
    compromisos: 0,
  },
  pareja_retiro: {
    edad_retiro: 65,
    mensualidad_deseada: 0,
    edad_defuncion: 85,
  },
  pareja_objetivos: {
    aportacion_inicial: 0,
    aportacion_mensual: 0,
    lista: [] as Array<{ nombre: string; monto: number; plazo: number }>,
  },
  pareja_proteccion: {
    seguro_vida: null as null,
    propiedades_aseguradas: null,
    sgmm: null as null,
  },
};

export const useDiagnosticoStore = create<DiagnosticoStore>()(
  persist(
    (set) => ({
      ...initialState,
      setPaso: (paso) => set({ pasoActual: paso }),
      nextStep: () =>
        set((s) => ({ pasoActual: Math.min(6, s.pasoActual + 1) })),
      prevStep: () =>
        set((s) => ({ pasoActual: Math.max(1, s.pasoActual - 1) })),
      completarPaso: (paso) =>
        set((s) => ({
          pasosCompletados: s.pasosCompletados.includes(paso)
            ? s.pasosCompletados
            : [...s.pasosCompletados, paso].sort((a, b) => a - b),
        })),
      updatePerfil: (data) =>
        set((s) => ({
          perfil: s.perfil ? { ...s.perfil, ...data } : (data as Perfil),
        })),
      updateFlujoMensual: (data) =>
        set((s) => ({
          flujoMensual: s.flujoMensual
            ? { ...s.flujoMensual, ...data }
            : (data as FlujoMensual),
        })),
      updatePatrimonio: (data) =>
        set((s) => ({
          patrimonio: s.patrimonio
            ? { ...s.patrimonio, ...data }
            : (data as Patrimonio),
        })),
      updateRetiro: (data) =>
        set((s) => ({
          retiro: s.retiro ? { ...s.retiro, ...data } : (data as Retiro),
        })),
      updateObjetivos: (data) =>
        set((s) => ({
          objetivos: s.objetivos
            ? { ...s.objetivos, ...data }
            : (data as Objetivos),
        })),
      updateProteccion: (data) =>
        set((s) => ({
          proteccion: s.proteccion
            ? { ...s.proteccion, ...data }
            : (data as Proteccion),
        })),
      updateOutputs: (motor, data) =>
        set((s) => ({
          outputs: { ...s.outputs, [motor]: data },
        })),
      setModo: (modo) =>
        set((s) =>
          modo === "pareja"
            ? { modo, ...parejaDemo }
            : { modo, pareja_perfil: null, pareja_flujoMensual: null, pareja_patrimonio: null, pareja_retiro: null, pareja_objetivos: null, pareja_proteccion: null }
        ),
      updateParejaPerfil: (data) =>
        set((s) => ({
          pareja_perfil: s.pareja_perfil ? { ...s.pareja_perfil, ...data } : (data as Perfil),
        })),
      updateParejaFlujoMensual: (data) =>
        set((s) => ({
          pareja_flujoMensual: s.pareja_flujoMensual ? { ...s.pareja_flujoMensual, ...data } : (data as FlujoMensual),
        })),
      updateParejaPatrimonio: (data) =>
        set((s) => ({
          pareja_patrimonio: s.pareja_patrimonio ? { ...s.pareja_patrimonio, ...data } : (data as Patrimonio),
        })),
      updateParejaRetiro: (data) =>
        set((s) => ({
          pareja_retiro: s.pareja_retiro ? { ...s.pareja_retiro, ...data } : (data as Retiro),
        })),
      updateParejaObjetivos: (data) =>
        set((s) => ({
          pareja_objetivos: s.pareja_objetivos ? { ...s.pareja_objetivos, ...data } : (data as Objetivos),
        })),
      updateParejaProteccion: (data) =>
        set((s) => ({
          pareja_proteccion: s.pareja_proteccion ? { ...s.pareja_proteccion, ...data } : (data as Proteccion),
        })),
      updateOwnership: (asset, value) =>
        set((s) => ({
          ownership: { ...s.ownership, [asset]: value },
        })),

      setSesionInicio: () => set((s) => ({ sesion_inicio: s.sesion_inicio ?? Date.now() })),
      setDatosFuente: (fuente) => set({ datos_fuente: fuente }),
      updateCompletitud: () =>
        set((s) => {
          const defaults: Record<string, unknown> = {
            nombre: "", edad: 0, genero: "", ocupacion: "", dependientes: false,
            ahorro: 0, rentas: 0, otros: 0, gastos_basicos: 0, obligaciones: 0, creditos: 0,
            liquidez: 0, inversiones: 0, dotales: 0,
            afore: 0, ppr: 0, plan_privado: 0, seguros_retiro: 0, ley_73: null,
            casa: 0, inmuebles_renta: 0, tierra: 0, negocio: 0, herencia: 0,
            seguro_vida: false, propiedades_aseguradas: null, sgmm: false,
            edad_retiro: 65, mensualidad_deseada: 0,
          };
          const fieldGroups: Record<string, string[]> = {
            perfil: ["nombre", "edad", "genero", "ocupacion", "dependientes"],
            flujo: ["ahorro", "rentas", "otros", "gastos_basicos", "obligaciones", "creditos"],
            patrimonio_fin: ["liquidez", "inversiones", "dotales"],
            retiro_esquemas: ["afore", "ppr", "plan_privado", "seguros_retiro", "ley_73"],
            no_financiero: ["casa", "inmuebles_renta", "tierra", "negocio", "herencia"],
            proteccion: ["seguro_vida", "propiedades_aseguradas", "sgmm"],
            retiro: ["edad_retiro", "mensualidad_deseada"],
          };
          let total = 0;
          let filled = 0;
          for (const [cat, flds] of Object.entries(fieldGroups)) {
            for (const f of flds) {
              total++;
              let val: unknown = undefined;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (cat === "perfil") val = (s.perfil as any)?.[f];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if (cat === "flujo") val = (s.flujoMensual as any)?.[f];
              else if (cat === "patrimonio_fin" || cat === "retiro_esquemas" || cat === "no_financiero")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                val = (s.patrimonio as any)?.[f];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if (cat === "proteccion") val = (s.proteccion as any)?.[f];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              else if (cat === "retiro") val = (s.retiro as any)?.[f];
              if (val === undefined || val === null || val === "" || val === defaults[f]) continue;
              filled++;
            }
          }
          return { completitud_pct: total > 0 ? Math.round((filled / total) * 100) : 0 };
        }),
      setCurrentClienteId: (clienteId) => set({ currentClienteId: clienteId }),
      addSessionInsight: (insight) =>
        set((s) => ({
          sesion_insights: [
            ...s.sesion_insights,
            {
              ...insight,
              id: crypto.randomUUID(),
              created_at: Date.now(),
              clienteId: insight.clienteId ?? s.currentClienteId ?? undefined,
              estado_tarea: "pendiente" as const,
            },
          ],
        })),
      updateInsightEstado: (id, estado, justificacion) =>
        set((s) => ({
          sesion_insights: s.sesion_insights.map((i) =>
            i.id === id
              ? {
                  ...i,
                  estado_tarea: estado,
                  justificacion_descarte: justificacion,
                  fecha_completada: estado === "completada" || estado === "descartada" ? Date.now() : i.fecha_completada,
                }
              : i
          ),
        })),
      addExtractedField: (field) =>
        set((s) => ({
          extracted_fields: [
            ...s.extracted_fields.filter((f) => f.campo !== field.campo),
            { ...field, timestamp: Date.now() },
          ],
        })),
      acceptExtractedField: (campo) =>
        set((s) => ({
          extracted_fields: s.extracted_fields.map((f) =>
            f.campo === campo ? { ...f, aceptado: true } : f
          ),
        })),
      updateExtractedFieldValue: (campo, valor) =>
        set((s) => ({
          extracted_fields: s.extracted_fields.map((f) =>
            f.campo === campo ? { ...f, valor, aceptado: true } : f
          ),
        })),
      applyExtractedField: (field) =>
        set((s) => {
          const perfilFields = ["nombre", "edad", "genero", "ocupacion", "dependientes"];
          const flujoFields = ["ahorro", "rentas", "otros", "gastos_basicos", "obligaciones", "creditos"];
          const patrimonioFields = [
            "liquidez", "inversiones", "dotales", "afore", "ppr", "plan_privado",
            "seguros_retiro", "ley_73", "casa", "inmuebles_renta", "tierra",
            "negocio", "herencia", "hipoteca", "saldo_planes", "compromisos",
          ];
          const retiroFields = ["edad_retiro", "mensualidad_deseada", "edad_defuncion"];
          const proteccionFields = ["seguro_vida", "propiedades_aseguradas", "sgmm"];

          // Type coercion: Haiku may return numbers as strings, etc.
          let valor = field.valor;

          // Numeric fields — parse string to number
          const numericFields = [
            ...flujoFields, ...patrimonioFields, ...retiroFields, "edad",
          ];
          if (numericFields.includes(field.campo) && typeof valor === "string") {
            const parsed = Number(String(valor).replace(/[$,\s]/g, ""));
            if (!isNaN(parsed)) valor = parsed;
          }

          // Boolean fields — convert number/string to boolean
          const booleanFields = ["seguro_vida", "propiedades_aseguradas", "sgmm", "dependientes"];
          if (booleanFields.includes(field.campo)) {
            if (typeof valor === "number") valor = valor > 0;
            if (typeof valor === "string") {
              const lower = valor.toLowerCase();
              valor = lower === "true" || lower === "sí" || lower === "si" || Number(lower) > 0;
            }
          }

          // edad — ensure it's an integer
          if (field.campo === "edad" && typeof valor === "number") {
            valor = Math.round(valor);
          }

          if (perfilFields.includes(field.campo)) {
            return { perfil: { ...(s.perfil ?? {} as Perfil), [field.campo]: valor } };
          }
          if (flujoFields.includes(field.campo)) {
            return { flujoMensual: { ...(s.flujoMensual ?? {} as FlujoMensual), [field.campo]: valor } };
          }
          if (patrimonioFields.includes(field.campo)) {
            return { patrimonio: { ...(s.patrimonio ?? {} as Patrimonio), [field.campo]: valor } };
          }
          if (retiroFields.includes(field.campo)) {
            return { retiro: { ...(s.retiro ?? {} as Retiro), [field.campo]: valor } };
          }
          if (proteccionFields.includes(field.campo)) {
            return { proteccion: { ...(s.proteccion ?? {} as Proteccion), [field.campo]: valor } };
          }
          return {};
        }),
      addSimulacion: (sim) =>
        set((s) => ({
          simulaciones_guardadas: [
            ...s.simulaciones_guardadas,
            { ...sim, id: crypto.randomUUID(), created_at: Date.now() },
          ],
        })),
      removeSimulacion: (id) =>
        set((s) => ({
          simulaciones_guardadas: s.simulaciones_guardadas.filter((sim) => sim.id !== id),
        })),
      addDocumento: (doc) =>
        set((s) => ({
          documentos_guardados: [
            { ...doc, id: crypto.randomUUID(), created_at: Date.now() },
            ...s.documentos_guardados,
          ],
        })),
      removeDocumento: (id) =>
        set((s) => ({
          documentos_guardados: s.documentos_guardados.filter((d) => d.id !== id),
        })),
      marcarDiagnosticoCompleto: (diagnosticoId, nombre, modo) =>
        set((s) => ({
          diagnosticos_completados: {
            ...s.diagnosticos_completados,
            [diagnosticoId]: { nombre, completed_at: Date.now(), modo },
          },
        })),
      guardarSnapshotCliente: (clienteId, diagnosticoId) =>
        set((s) => {
          const snap: ClienteSnapshot = {
            cliente_id: clienteId,
            diagnostico_id: diagnosticoId,
            completed_at: Date.now(),
            perfil: {
              nombre: s.perfil?.nombre ?? "Cliente",
              edad: s.perfil?.edad ?? 0,
              genero: s.perfil?.genero ?? "",
              ocupacion: s.perfil?.ocupacion ?? "",
              dependientes: s.perfil?.dependientes ?? null,
            },
            flujoMensual: s.flujoMensual ?? { ahorro: 0, rentas: 0, otros: 0, gastos_basicos: 0, obligaciones: 0, creditos: 0 },
            patrimonio: {
              liquidez: s.patrimonio?.liquidez ?? 0,
              inversiones: s.patrimonio?.inversiones ?? 0,
              dotales: s.patrimonio?.dotales ?? 0,
              afore: s.patrimonio?.afore ?? 0,
              ppr: s.patrimonio?.ppr ?? 0,
              plan_privado: s.patrimonio?.plan_privado ?? 0,
              seguros_retiro: s.patrimonio?.seguros_retiro ?? 0,
              ley_73: s.patrimonio?.ley_73 ?? null,
              casa: s.patrimonio?.casa ?? 0,
              inmuebles_renta: s.patrimonio?.inmuebles_renta ?? 0,
              tierra: s.patrimonio?.tierra ?? 0,
              negocio: s.patrimonio?.negocio ?? 0,
              herencia: s.patrimonio?.herencia ?? 0,
              hipoteca: s.patrimonio?.hipoteca ?? 0,
            },
            retiro: {
              edad_retiro: s.retiro?.edad_retiro ?? 65,
              mensualidad_deseada: s.retiro?.mensualidad_deseada ?? 0,
            },
            proteccion: {
              seguro_vida: s.proteccion?.seguro_vida ?? null,
              propiedades_aseguradas: s.proteccion?.propiedades_aseguradas ?? null,
              sgmm: s.proteccion?.sgmm ?? null,
            },
            oportunidades: s.perfiles_completados[clienteId]?.oportunidades ?? [],
          };
          return {
            perfiles_completados: {
              ...s.perfiles_completados,
              [clienteId]: snap,
            },
          };
        }),
      agregarOportunidadesSnapshot: (clienteId, oportunidades) =>
        set((s) => {
          const existing = s.perfiles_completados[clienteId];
          // If no snapshot exists yet, create a minimal one so oportunidades aren't lost
          const base: ClienteSnapshot = existing ?? {
            cliente_id: clienteId,
            diagnostico_id: "",
            completed_at: Date.now(),
            perfil: { nombre: s.perfil?.nombre ?? "Cliente", edad: s.perfil?.edad ?? 0, genero: s.perfil?.genero ?? "", ocupacion: s.perfil?.ocupacion ?? "", dependientes: s.perfil?.dependientes ?? null },
            flujoMensual: s.flujoMensual ?? { ahorro: 0, rentas: 0, otros: 0, gastos_basicos: 0, obligaciones: 0, creditos: 0 },
            patrimonio: { liquidez: s.patrimonio?.liquidez ?? 0, inversiones: s.patrimonio?.inversiones ?? 0, dotales: s.patrimonio?.dotales ?? 0, afore: s.patrimonio?.afore ?? 0, ppr: s.patrimonio?.ppr ?? 0, plan_privado: s.patrimonio?.plan_privado ?? 0, seguros_retiro: s.patrimonio?.seguros_retiro ?? 0, ley_73: s.patrimonio?.ley_73 ?? null, casa: s.patrimonio?.casa ?? 0, inmuebles_renta: s.patrimonio?.inmuebles_renta ?? 0, tierra: s.patrimonio?.tierra ?? 0, negocio: s.patrimonio?.negocio ?? 0, herencia: s.patrimonio?.herencia ?? 0, hipoteca: s.patrimonio?.hipoteca ?? 0 },
            retiro: { edad_retiro: s.retiro?.edad_retiro ?? 65, mensualidad_deseada: s.retiro?.mensualidad_deseada ?? 0 },
            proteccion: { seguro_vida: s.proteccion?.seguro_vida ?? null, propiedades_aseguradas: s.proteccion?.propiedades_aseguradas ?? null, sgmm: s.proteccion?.sgmm ?? null },
            oportunidades: [],
          };
          const existingIds = new Set(base.oportunidades.map((o) => o.id));
          const newOps = oportunidades.filter((o) => !existingIds.has(o.id));
          if (newOps.length === 0) return {};
          return {
            perfiles_completados: {
              ...s.perfiles_completados,
              [clienteId]: { ...base, oportunidades: [...base.oportunidades, ...newOps] },
            },
          };
        }),
      actualizarEstadoOportunidadSnapshot: (clienteId, oportunidadId, estado) =>
        set((s) => {
          const existing = s.perfiles_completados[clienteId];
          if (!existing) return {};
          return {
            perfiles_completados: {
              ...s.perfiles_completados,
              [clienteId]: {
                ...existing,
                oportunidades: existing.oportunidades.map((o) =>
                  o.id === oportunidadId ? { ...o, estado } : o
                ),
              },
            },
          };
        }),
      guardarScoreSalud: (clienteId, score) =>
        set((s) => ({
          salud_scores: { ...s.salud_scores, [clienteId]: score },
        })),
      updateCriteriosTrayectoria: (data) =>
        set((s) => ({
          criterios_trayectoria: { ...s.criterios_trayectoria, ...data },
        })),
      resetSession: () => set(sessionBlank),
      reset: () => set(initialState),
    }),
    {
      name: "diagnostico-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
    }
  )
);
