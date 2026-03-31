import { getAccessToken } from "./api-client";

export interface NaviSuggestion {
  tipo: "pregunta" | "oportunidad" | "alerta";
  texto: string;
  categoria: string;
  campo_target?: string;
  confianza: number;
  producto_sugerido?: string;
}

interface NaviContext {
  transcripcion: string;
  datosRecopilados: Record<string, unknown>;
  datosFaltantes: string[];
  contextoCliente: {
    edad?: number;
    ocupacion?: string;
    dependientes?: boolean;
    nombre?: string;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const FALLBACK_SUGGESTIONS: Record<string, NaviSuggestion> = {
  edad: {
    tipo: "pregunta",
    texto: "Pregúntale: ¿Cuántos años tienes? o ¿En qué año naciste?",
    categoria: "perfil",
    campo_target: "edad",
    confianza: 1,
  },
  ocupacion: {
    tipo: "pregunta",
    texto: "Pregúntale: ¿A qué te dedicas actualmente?",
    categoria: "perfil",
    campo_target: "ocupacion",
    confianza: 1,
  },
  gastos_basicos: {
    tipo: "pregunta",
    texto: "Pregúntale: ¿Cómo es un mes típico para ti entre lo que entra y sale?",
    categoria: "flujo",
    campo_target: "gastos_basicos",
    confianza: 1,
  },
  ahorro: {
    tipo: "pregunta",
    texto: "Pregúntale: ¿Cuánto logras ahorrar al mes, aproximadamente?",
    categoria: "flujo",
    campo_target: "ahorro",
    confianza: 1,
  },
  afore: {
    tipo: "pregunta",
    texto: "Pregúntale: ¿Tienes tu estado de cuenta del Afore? ¿Sabes cuánto tienes ahí?",
    categoria: "retiro",
    campo_target: "afore",
    confianza: 1,
  },
  edad_retiro: {
    tipo: "pregunta",
    texto: "Pregúntale: ¿A qué edad te gustaría retirarte? ¿Has pensado en eso?",
    categoria: "retiro",
    campo_target: "edad_retiro",
    confianza: 1,
  },
  seguro_vida: {
    tipo: "pregunta",
    texto: "Pregúntale: ¿Tu familia está protegida si algo te pasa? ¿Tienes algún seguro?",
    categoria: "proteccion",
    campo_target: "seguro_vida",
    confianza: 1,
  },
  liquidez: {
    tipo: "pregunta",
    texto: "Pregúntale: Aparte de tus inversiones, ¿cuánto tienes disponible en cuentas bancarias?",
    categoria: "patrimonio",
    campo_target: "liquidez",
    confianza: 1,
  },
  casa: {
    tipo: "pregunta",
    texto: "Pregúntale: Aparte de tus inversiones, ¿tienes algún inmueble o negocio?",
    categoria: "patrimonio",
    campo_target: "casa",
    confianza: 1,
  },
  mensualidad_deseada: {
    tipo: "pregunta",
    texto: "Pregúntale: ¿Cuánto te gustaría recibir al mes cuando te retires?",
    categoria: "retiro",
    campo_target: "mensualidad_deseada",
    confianza: 1,
  },
};

const PRIORITY_ORDER = [
  "edad",
  "ocupacion",
  "ahorro",
  "gastos_basicos",
  "liquidez",
  "inversiones",
  "afore",
  "edad_retiro",
  "mensualidad_deseada",
  "casa",
  "seguro_vida",
];

let lastCallTime = 0;
const MIN_COOLDOWN_MS = 15_000;
const MAX_CALLS_PER_MINUTE = 4;
let callsThisMinute = 0;
let minuteStart = Date.now();

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - lastCallTime < MIN_COOLDOWN_MS) return false;
  if (now - minuteStart > 60_000) {
    minuteStart = now;
    callsThisMinute = 0;
  }
  if (callsThisMinute >= MAX_CALLS_PER_MINUTE) return false;
  return true;
}

export async function generarSugerenciaNavi(
  ctx: NaviContext
): Promise<NaviSuggestion> {
  if (!ctx.datosFaltantes.length) {
    return {
      tipo: "pregunta",
      texto: "¡Excelente! Ya tienes todos los datos. Puedes generar el balance.",
      categoria: "general",
      confianza: 1,
    };
  }

  // If rate limited or no transcript, use prioritized fallback
  if (!checkRateLimit() || !ctx.transcripcion.trim()) {
    return getFallbackSuggestion(ctx.datosFaltantes);
  }

  try {
    callsThisMinute++;
    lastCallTime = Date.now();

    const token = getAccessToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/api/v1/voz/navi-sugerencia`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        transcripcion: ctx.transcripcion.slice(-2000),
        datos_faltantes: ctx.datosFaltantes,
        contexto_cliente: ctx.contextoCliente,
      }),
    });

    if (!res.ok) return getFallbackSuggestion(ctx.datosFaltantes);

    const data = await res.json();
    return {
      tipo: data.tipo || "pregunta",
      texto: data.texto || getFallbackSuggestion(ctx.datosFaltantes).texto,
      categoria: data.categoria || "general",
      campo_target: data.campo_target,
      confianza: data.confianza || 0.8,
    };
  } catch {
    return getFallbackSuggestion(ctx.datosFaltantes);
  }
}

function getFallbackSuggestion(datosFaltantes: string[]): NaviSuggestion {
  for (const field of PRIORITY_ORDER) {
    if (datosFaltantes.includes(field) && FALLBACK_SUGGESTIONS[field]) {
      return FALLBACK_SUGGESTIONS[field];
    }
  }

  const first = datosFaltantes[0];
  if (FALLBACK_SUGGESTIONS[first]) return FALLBACK_SUGGESTIONS[first];

  return {
    tipo: "pregunta",
    texto: `Aún faltan datos de: ${datosFaltantes.slice(0, 3).join(", ")}. Intenta preguntar sobre estos temas.`,
    categoria: "general",
    confianza: 0.6,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDatosFaltantes(store: {
  perfil: any;
  flujoMensual: any;
  patrimonio: any;
  retiro: any;
  proteccion: any;
}): string[] {
  const faltantes: string[] = [];

  const checkFields = (
    obj: Record<string, unknown> | null | undefined,
    fields: string[],
    defaults?: Record<string, unknown>
  ) => {
    for (const f of fields) {
      const val = (obj as Record<string, unknown> | null)?.[f];
      const def = defaults?.[f];
      if (val === undefined || val === null || val === "" || val === def) {
        faltantes.push(f);
      }
    }
  };

  checkFields(store.perfil, ["nombre", "edad", "ocupacion"], { edad: 18 });
  checkFields(store.flujoMensual, [
    "ahorro",
    "gastos_basicos",
    "obligaciones",
    "creditos",
  ]);
  checkFields(store.patrimonio, [
    "liquidez",
    "inversiones",
    "afore",
    "ppr",
    "casa",
    "inmuebles_renta",
  ]);
  checkFields(store.retiro, ["edad_retiro", "mensualidad_deseada"], {
    edad_retiro: 65,
  });
  checkFields(store.proteccion, ["seguro_vida", "sgmm"]);

  return faltantes;
}

export type { NaviContext };
