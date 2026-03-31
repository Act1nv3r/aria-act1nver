import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface Perfil {
  nombre: string;
  edad: number;
  genero: string;
  ocupacion: string;
  dependientes: boolean;
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
  seguro_vida: boolean;
  propiedades_aseguradas: boolean | null;
  sgmm: boolean;
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
  tipo: "oportunidad" | "insight" | "contexto";
  texto: string;
  producto_sugerido?: string;
  confianza: number;
  fase: "conversacion" | "simulacion";
  created_at: number;
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

  // v2 session fields
  sesion_duracion_minutos: number;
  datos_fuente: "voz" | "manual" | "mixto";
  completitud_pct: number;
  sesion_insights: SessionInsight[];
  extracted_fields: ExtractedField[];
  sesion_inicio: number | null;

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
  updateCompletitud: () => void;
  addSessionInsight: (insight: Omit<SessionInsight, "id" | "created_at">) => void;
  addExtractedField: (field: Omit<ExtractedField, "timestamp">) => void;
  acceptExtractedField: (campo: string) => void;
  updateExtractedFieldValue: (campo: string, valor: string | number | boolean) => void;
  applyExtractedField: (field: ExtractedField) => void;
  reset: () => void;
}

const initialState = {
  pasoActual: 1,
  pasosCompletados: [] as number[],
  modo: "individual" as const,
  perfil: {
    nombre: "",
    edad: 18,
    genero: "H",
    ocupacion: "asalariado",
    dependientes: false,
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
    seguro_vida: false,
    propiedades_aseguradas: null,
    sgmm: false,
  },
  outputs: {
    motorA: null,
    motorB: null,
    motorC: null,
    motorD: null,
    motorE: null,
    motorF: null,
  },
  sesion_duracion_minutos: 0,
  datos_fuente: "manual" as const,
  completitud_pct: 0,
  sesion_insights: [] as SessionInsight[],
  extracted_fields: [] as ExtractedField[],
  sesion_inicio: null as number | null,
  pareja_perfil: null,
  pareja_flujoMensual: null,
  pareja_patrimonio: null,
  pareja_retiro: null,
  pareja_objetivos: null,
  pareja_proteccion: null,
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
};

const parejaDemo = {
  pareja_perfil: {
    nombre: "",
    edad: 18,
    genero: "M",
    ocupacion: "asalariado",
    dependientes: false,
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
    seguro_vida: false,
    propiedades_aseguradas: null,
    sgmm: false,
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

      setSesionInicio: () => set({ sesion_inicio: Date.now() }),
      setDatosFuente: (fuente) => set({ datos_fuente: fuente }),
      updateCompletitud: () =>
        set((s) => {
          const fields = {
            perfil: ["nombre", "edad", "genero", "ocupacion", "dependientes"],
            flujo: ["ahorro", "rentas", "otros", "gastos_basicos", "obligaciones", "creditos"],
            patrimonio_fin: ["liquidez", "inversiones", "dotales"],
            retiro_esquemas: ["afore", "ppr", "plan_privado", "seguros_retiro", "ley_73"],
            no_financiero: ["casa", "inmuebles_renta", "tierra", "negocio", "herencia"],
            proteccion: ["seguro_vida", "propiedades_aseguradas", "sgmm"],
          };
          let total = 0;
          let filled = 0;
          for (const [cat, flds] of Object.entries(fields)) {
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
              if (val !== undefined && val !== null && val !== "" && val !== 0 && val !== false) filled++;
            }
          }
          // Add retiro fields
          if (s.retiro?.edad_retiro && s.retiro.edad_retiro !== 65) { filled++; }
          total++;
          if (s.retiro?.mensualidad_deseada && s.retiro.mensualidad_deseada > 0) { filled++; }
          total++;
          return { completitud_pct: total > 0 ? Math.round((filled / total) * 100) : 0 };
        }),
      addSessionInsight: (insight) =>
        set((s) => ({
          sesion_insights: [
            ...s.sesion_insights,
            { ...insight, id: crypto.randomUUID(), created_at: Date.now() },
          ],
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

          if (perfilFields.includes(field.campo)) {
            return { perfil: { ...(s.perfil ?? {} as Perfil), [field.campo]: field.valor } };
          }
          if (flujoFields.includes(field.campo)) {
            return { flujoMensual: { ...(s.flujoMensual ?? {} as FlujoMensual), [field.campo]: field.valor } };
          }
          if (patrimonioFields.includes(field.campo)) {
            return { patrimonio: { ...(s.patrimonio ?? {} as Patrimonio), [field.campo]: field.valor } };
          }
          if (retiroFields.includes(field.campo)) {
            return { retiro: { ...(s.retiro ?? {} as Retiro), [field.campo]: field.valor } };
          }
          if (proteccionFields.includes(field.campo)) {
            return { proteccion: { ...(s.proteccion ?? {} as Proteccion), [field.campo]: field.valor } };
          }
          return {};
        }),
      reset: () => set(initialState),
    }),
    {
      name: "diagnostico-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? sessionStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
    }
  )
);
