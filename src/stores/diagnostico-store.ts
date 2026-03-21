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
