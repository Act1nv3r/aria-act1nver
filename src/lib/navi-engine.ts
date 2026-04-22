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
  skipFields?: string[];
}

const FALLBACK_SUGGESTIONS: Record<string, NaviSuggestion> = {
  nombre: {
    tipo: "pregunta",
    texto: "Para comenzar, ¿me podría dar su nombre completo?",
    categoria: "perfil", campo_target: "nombre", confianza: 1,
  },
  edad: {
    tipo: "pregunta",
    texto: "¿Cuántos años tienes? o ¿En qué año naciste?",
    categoria: "perfil", campo_target: "edad", confianza: 1,
  },
  genero: {
    tipo: "pregunta",
    texto: "Para completar tu perfil, ¿podría indicarme su género?",
    categoria: "perfil", campo_target: "genero", confianza: 1,
  },
  ocupacion: {
    tipo: "pregunta",
    texto: "¿A qué te dedicas actualmente? ¿Eres asalariado, independiente o tienes un negocio?",
    categoria: "perfil", campo_target: "ocupacion", confianza: 1,
  },
  dependientes: {
    tipo: "pregunta",
    texto: "¿Tienes hijos o algún familiar que dependa económicamente de ti?",
    categoria: "perfil", campo_target: "dependientes", confianza: 1,
  },
  ahorro: {
    tipo: "pregunta",
    texto: "¿Cuánto logras ahorrar al mes, aproximadamente? Lo que te sobra después de todos tus gastos.",
    categoria: "flujo", campo_target: "ahorro", confianza: 1,
  },
  rentas: {
    tipo: "pregunta",
    texto: "¿Recibes ingresos por rentas de propiedades o algún ingreso pasivo?",
    categoria: "flujo", campo_target: "rentas", confianza: 1,
  },
  gastos_basicos: {
    tipo: "pregunta",
    texto: "¿Cómo es un mes típico para ti entre lo que entra y sale? ¿Cuánto gastas en lo esencial?",
    categoria: "flujo", campo_target: "gastos_basicos", confianza: 1,
  },
  obligaciones: {
    tipo: "pregunta",
    texto: "¿Tienes pagos fijos mensuales como colegiaturas, seguros o mantenimientos?",
    categoria: "flujo", campo_target: "obligaciones", confianza: 1,
  },
  otros: {
    tipo: "pregunta",
    texto: "¿Tienes algún otro ingreso adicional al sueldo? ¿Freelance, honorarios, negocio extra?",
    categoria: "flujo", campo_target: "otros", confianza: 1,
  },
  creditos: {
    tipo: "pregunta",
    texto: "¿Pagas algún crédito actualmente? Hipoteca, auto, tarjetas de crédito...",
    categoria: "flujo", campo_target: "creditos", confianza: 1,
  },
  liquidez: {
    tipo: "pregunta",
    texto: "Aparte de tus inversiones, ¿cuánto tienes disponible en cuentas bancarias o efectivo?",
    categoria: "patrimonio", campo_target: "liquidez", confianza: 1,
  },
  inversiones: {
    tipo: "pregunta",
    texto: "¿Tienes inversiones en fondos, acciones, CETES o algún instrumento financiero?",
    categoria: "patrimonio", campo_target: "inversiones", confianza: 1,
  },
  dotales: {
    tipo: "pregunta",
    texto: "¿Tienes algún seguro dotal o producto con componente de ahorro?",
    categoria: "patrimonio", campo_target: "dotales", confianza: 1,
  },
  afore: {
    tipo: "pregunta",
    texto: "¿Tienes tu estado de cuenta del Afore? ¿Sabes cuánto tienes acumulado ahí?",
    categoria: "retiro", campo_target: "afore", confianza: 1,
  },
  ppr: {
    tipo: "pregunta",
    texto: "¿Tienes un Plan Personal de Retiro (PPR)? Es deducible de impuestos y muy útil.",
    categoria: "retiro", campo_target: "ppr", confianza: 1,
  },
  plan_privado: {
    tipo: "pregunta",
    texto: "¿Tu empresa te ofrece algún plan de pensión o fondo de retiro complementario?",
    categoria: "retiro", campo_target: "plan_privado", confianza: 1,
  },
  seguros_retiro: {
    tipo: "pregunta",
    texto: "¿Tienes algún seguro que te dé un beneficio al momento de retirarte?",
    categoria: "retiro", campo_target: "seguros_retiro", confianza: 1,
  },
  ley_73: {
    tipo: "pregunta",
    texto: "¿Cotizas bajo la Ley 73 del IMSS? ¿Conoces tu pensión estimada?",
    categoria: "retiro", campo_target: "ley_73", confianza: 1,
  },
  casa: {
    tipo: "pregunta",
    texto: "¿Tienes casa propia? ¿Cuál sería su valor aproximado hoy?",
    categoria: "patrimonio_nf", campo_target: "casa", confianza: 1,
  },
  inmuebles_renta: {
    tipo: "pregunta",
    texto: "¿Tienes alguna propiedad que rentes o puedas rentar?",
    categoria: "patrimonio_nf", campo_target: "inmuebles_renta", confianza: 1,
  },
  tierra: {
    tipo: "pregunta",
    texto: "¿Tienes algún terreno o tierra? ¿Cuál es su valor aproximado?",
    categoria: "patrimonio_nf", campo_target: "tierra", confianza: 1,
  },
  negocio: {
    tipo: "pregunta",
    texto: "¿Tienes un negocio propio? ¿Cuál sería su valor estimado?",
    categoria: "patrimonio_nf", campo_target: "negocio", confianza: 1,
  },
  herencia: {
    tipo: "pregunta",
    texto: "¿Esperas recibir alguna herencia en el futuro?",
    categoria: "patrimonio_nf", campo_target: "herencia", confianza: 1,
  },
  seguro_vida: {
    tipo: "pregunta",
    texto: "¿Tu familia está protegida si algo te pasa? ¿Tienes algún seguro de vida?",
    categoria: "proteccion", campo_target: "seguro_vida", confianza: 1,
  },
  propiedades_aseguradas: {
    tipo: "pregunta",
    texto: "¿Tus propiedades están aseguradas contra siniestros?",
    categoria: "proteccion", campo_target: "propiedades_aseguradas", confianza: 1,
  },
  sgmm: {
    tipo: "pregunta",
    texto: "¿Cuentas con Seguro de Gastos Médicos Mayores?",
    categoria: "proteccion", campo_target: "sgmm", confianza: 1,
  },
  edad_retiro: {
    tipo: "pregunta",
    texto: "¿A qué edad te gustaría retirarte? ¿Has pensado en eso?",
    categoria: "retiro", campo_target: "edad_retiro", confianza: 1,
  },
  mensualidad_deseada: {
    tipo: "pregunta",
    texto: "Cuando te retires, ¿cuánto te gustaría recibir al mes para vivir tranquilamente?",
    categoria: "retiro", campo_target: "mensualidad_deseada", confianza: 1,
  },
};

const PRIORITY_ORDER = [
  "nombre", "edad", "ocupacion", "dependientes",
  "ahorro", "gastos_basicos", "creditos",
  "liquidez", "inversiones",
  "afore", "edad_retiro", "mensualidad_deseada",
  "casa", "seguro_vida", "sgmm",
  "rentas", "obligaciones", "otros",
  "dotales", "ppr", "plan_privado", "seguros_retiro", "ley_73",
  "inmuebles_renta", "tierra", "negocio", "herencia",
  "propiedades_aseguradas", "genero",
];

// Contextual topic groups: if the transcript mentions a keyword,
// prioritize fields from the same topic.
const TOPIC_KEYWORDS: { keywords: RegExp; fields: string[] }[] = [
  {
    keywords: /\b(hijo|hija|hijos|familia|esposa|esposo|dependientes?|ninos?|bebe)\b/i,
    fields: ["dependientes", "seguro_vida", "sgmm"],
  },
  {
    keywords: /\b(gasto|gastos|pago|pagar|renta|servicios|comida|transporte|basico)\b/i,
    fields: ["gastos_basicos", "obligaciones", "creditos"],
  },
  {
    keywords: /\b(ahorro|ahorr[oa]|sobra|queda|ingreso|sueldo|gan[oa]|salario)\b/i,
    fields: ["ahorro", "rentas", "otros"],
  },
  {
    keywords: /\b(casa|departamento|inmueble|propiedad|terreno|tierra)\b/i,
    fields: ["casa", "inmuebles_renta", "tierra", "propiedades_aseguradas"],
  },
  {
    keywords: /\b(retir[oa]|afore|pension|jubilar|jubilarme|vejez)\b/i,
    fields: ["edad_retiro", "afore", "mensualidad_deseada", "ppr", "plan_privado", "ley_73"],
  },
  {
    keywords: /\b(seguro|asegurad[oa]|proteccion|proteger|poliza|medico|sgmm)\b/i,
    fields: ["seguro_vida", "sgmm", "propiedades_aseguradas"],
  },
  {
    keywords: /\b(inversion|inversiones|fondos|acciones|cetes|bonos|bolsa)\b/i,
    fields: ["inversiones", "liquidez", "dotales"],
  },
  {
    keywords: /\b(negocio|empresa|emprendimiento|emprender|socio|autonomo|independiente)\b/i,
    fields: ["negocio", "ocupacion", "otros"],
  },
  {
    keywords: /\b(credito|hipoteca|tarjeta|deuda|prestamo|mensualidad)\b/i,
    fields: ["creditos", "obligaciones", "casa"],
  },
  {
    keywords: /\b(herencia|heredar|padres|abuelos|legado)\b/i,
    fields: ["herencia"],
  },
];

/**
 * Pick the best next suggestion considering:
 * 1. Fields that are still missing
 * 2. Fields the advisor has already skipped (will be excluded)
 * 3. Conversation context (keywords in transcript)
 */
function pickLocalSuggestion(
  datosFaltantes: string[],
  skipFields: string[],
  transcripcion: string,
): NaviSuggestion | null {
  if (datosFaltantes.length === 0) return null;

  const skipSet = new Set(skipFields);
  const available = datosFaltantes.filter((f) => !skipSet.has(f));

  // If all available were skipped, reset and use the full list
  const pool = available.length > 0 ? available : datosFaltantes;

  // Check if there's a contextual match from the recent transcript (last ~200 chars)
  const recentText = transcripcion.slice(-300);
  if (recentText.length > 10) {
    for (const topic of TOPIC_KEYWORDS) {
      if (topic.keywords.test(recentText)) {
        const contextualField = topic.fields.find(
          (f) => pool.includes(f) && FALLBACK_SUGGESTIONS[f]
        );
        if (contextualField) {
          return FALLBACK_SUGGESTIONS[contextualField];
        }
      }
    }
  }

  // No contextual match → fall back to priority order
  for (const field of PRIORITY_ORDER) {
    if (pool.includes(field) && FALLBACK_SUGGESTIONS[field]) {
      return FALLBACK_SUGGESTIONS[field];
    }
  }

  // Last resort: any remaining field
  const first = pool[0];
  if (FALLBACK_SUGGESTIONS[first]) return FALLBACK_SUGGESTIONS[first];

  return {
    tipo: "pregunta",
    texto: `Aún faltan datos de: ${pool.slice(0, 3).join(", ")}. Intenta preguntar sobre estos temas.`,
    categoria: "general",
    confianza: 0.6,
  };
}

let _haikuInFlight = false;

/**
 * Main entry: returns a contextual suggestion.
 * Tries Haiku first (if transcript is long enough), then falls back to local logic.
 */
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

  const skipFields = ctx.skipFields ?? [];

  // Try Haiku for smarter, contextual suggestions when we have enough transcript
  if (ctx.transcripcion.length > 80 && !_haikuInFlight) {
    try {
      _haikuInFlight = true;
      const res = await fetch("/api/navi-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcripcion: ctx.transcripcion.slice(-2000),
          datos_faltantes: ctx.datosFaltantes.filter((f) => !new Set(skipFields).has(f)),
          contexto: ctx.contextoCliente,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.texto) {
          return data as NaviSuggestion;
        }
      }
    } catch {
      // Haiku failed, fall back silently
    } finally {
      _haikuInFlight = false;
    }
  }

  return (
    pickLocalSuggestion(ctx.datosFaltantes, skipFields, ctx.transcripcion) ?? {
      tipo: "pregunta",
      texto: `Faltan ${ctx.datosFaltantes.length} datos. Pregunta al cliente sobre ${ctx.datosFaltantes[0]}.`,
      categoria: "general",
      confianza: 0.5,
    }
  );
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

  checkFields(store.perfil, ["nombre", "edad", "genero", "ocupacion", "dependientes"], {
    // Use store initial values (0 for edad, "" for strings) so unfilled fields are
    // correctly detected. edad: 18 was wrong — store starts at 0, not 18.
    nombre: "", edad: 0, genero: "", ocupacion: "",
  });
  checkFields(store.flujoMensual, [
    "ahorro", "rentas", "gastos_basicos", "obligaciones", "otros", "creditos",
  ], {
    ahorro: 0, rentas: 0, gastos_basicos: 0, obligaciones: 0, otros: 0, creditos: 0,
  });
  // Ley 73 only applies to workers who enrolled in IMSS before July 1997 (age ≥ ~46).
  // If we know the client is younger, exclude ley_73 so it is never asked or extracted.
  const edad = (store.perfil as Record<string, unknown> | null)?.edad as number | undefined;
  const incluirLey73 = !edad || edad === 0 || edad >= 46;
  const patrimonioFields: string[] = [
    "liquidez", "inversiones", "dotales", "afore", "ppr", "plan_privado",
    "seguros_retiro", ...(incluirLey73 ? ["ley_73"] : []),
    "casa", "inmuebles_renta", "tierra", "negocio", "herencia",
  ];
  checkFields(store.patrimonio, patrimonioFields, {
    liquidez: 0, inversiones: 0, dotales: 0, afore: 0, ppr: 0, plan_privado: 0,
    seguros_retiro: 0, ley_73: null, casa: 0, inmuebles_renta: 0, tierra: 0, negocio: 0, herencia: 0,
  });
  checkFields(store.retiro, ["edad_retiro", "mensualidad_deseada"], {
    edad_retiro: 65, mensualidad_deseada: 0,
  });
  checkFields(store.proteccion, ["seguro_vida", "propiedades_aseguradas", "sgmm"], {
    propiedades_aseguradas: null,
  });

  return faltantes;
}

export type { NaviContext };
