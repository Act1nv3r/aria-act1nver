export interface Sugerencia {
  campo: string;
  valor: string | number | boolean;
  confianza: number;
  texto_fuente: string;
}

// ---------------------------------------------------------------------------
// Number parsing: handles spoken numbers, currency, and shorthand
// ---------------------------------------------------------------------------

function parseSpokenNumber(raw: string): number | null {
  let s = raw
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/\$/g, "")
    .replace(/pesos/gi, "")
    .replace(/mensuales/gi, "")
    .replace(/al\s+mes/gi, "")
    .replace(/millones?\s+de\s+pesos/gi, "000000")
    .replace(/millón\s+de\s+pesos/gi, "000000")
    .replace(/millones/gi, "000000")
    .replace(/millón/gi, "000000")
    .replace(/mil\s+pesos/gi, "000")
    .replace(/mil/gi, "000")
    .trim();

  const wordNumbers: Record<string, number> = {
    cero: 0, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
    seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
    once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
    dieciséis: 16, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
    veinte: 20, veintiuno: 21, veintidos: 22, veintitrés: 23, veintitres: 23,
    veinticuatro: 24, veinticinco: 25, veintiséis: 26, veintiseis: 26,
    veintisiete: 27, veintiocho: 28, veintinueve: 29,
    treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60,
    setenta: 70, ochenta: 80, noventa: 90, cien: 100,
  };

  if (wordNumbers[s] !== undefined) return wordNumbers[s];

  // "treinta y cinco" → 35
  const compoundMatch = s.match(
    /^(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)\s+y\s+(uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)$/
  );
  if (compoundMatch) {
    const tens = wordNumbers[compoundMatch[1]];
    const ones = wordNumbers[compoundMatch[2]];
    if (tens !== undefined && ones !== undefined) return tens + ones;
  }

  s = s.replace(/\s+/g, "");
  const n = Number(s);
  return isNaN(n) ? null : n;
}

// Try to extract a currency/monetary amount from text
function extractAmount(text: string): number | null {
  // $50,000 or $50000 or 50,000 pesos
  const patterns = [
    /\$\s*([\d,]+(?:\.\d{1,2})?)/,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:pesos|mxn|mensuales|al\s+mes)/i,
    /(?:como|unos|aproximadamente|más o menos|cerca de|alrededor de)\s*\$?\s*([\d,]+)/i,
    /(?:gano|cobro|recibo|ahorro|gasto|pago|debo|tengo)\s+(?:como\s+)?(?:unos\s+)?\$?\s*([\d,]+)/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = parseSpokenNumber(m[1]);
      if (n !== null && n > 0) return n;
    }
  }

  // "50 mil", "2 millones", "medio millón"
  const milMatch = text.match(/([\d.]+)\s*mil/i);
  if (milMatch) {
    const n = parseFloat(milMatch[1]);
    if (!isNaN(n)) return n * 1000;
  }

  const millonMatch = text.match(/([\d.]+)\s*mill[oó]n(?:es)?/i);
  if (millonMatch) {
    const n = parseFloat(millonMatch[1]);
    if (!isNaN(n)) return n * 1_000_000;
  }

  if (/medio\s+mill[oó]n/i.test(text)) return 500_000;

  return null;
}

function extractAge(text: string): number | null {
  const patterns = [
    /tengo\s+(\d{1,3})\s*(?:años)?/i,
    /(\d{1,3})\s*años/i,
    /edad\s+(?:de\s+)?(\d{1,3})/i,
    /cumpl[ioí]\s+(\d{1,3})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const age = parseInt(m[1]);
      if (age >= 15 && age <= 120) return age;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Field extraction rules — each defines how to detect a specific field
// ---------------------------------------------------------------------------

interface ExtractionRule {
  campo: string;
  extract: (text: string) => { valor: string | number | boolean; confianza: number; fuente: string } | null;
}

const RULES: ExtractionRule[] = [
  // --- PERFIL ---
  {
    campo: "nombre",
    extract: (text) => {
      const patterns = [
        /(?:me llamo|mi nombre es|soy)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/,
        /(?:se llama|su nombre es|el (?:señor|cliente) es)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})/,
      ];
      for (const p of patterns) {
        const m = text.match(p);
        if (m) return { valor: m[1].trim(), confianza: 0.9, fuente: m[0] };
      }
      return null;
    },
  },
  {
    campo: "edad",
    extract: (text) => {
      const age = extractAge(text);
      if (age) return { valor: age, confianza: 0.92, fuente: text.slice(0, 60) };
      return null;
    },
  },
  {
    campo: "genero",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/\b(soy hombre|masculino|varón|género masculino)\b/.test(lower))
        return { valor: "Masculino", confianza: 0.95, fuente: text.slice(0, 40) };
      if (/\b(soy mujer|femenino|género femenino)\b/.test(lower))
        return { valor: "Femenino", confianza: 0.95, fuente: text.slice(0, 40) };
      return null;
    },
  },
  {
    campo: "ocupacion",
    extract: (text) => {
      const patterns = [
        /(?:soy|trabajo como|me dedico a|trabajo en|mi profesión es|soy profesionista)\s+(.{3,40}?)(?:\.|,|$)/i,
        /(?:trabajo de)\s+(.{3,40}?)(?:\.|,|$)/i,
      ];
      for (const p of patterns) {
        const m = text.match(p);
        if (m) {
          const val = m[1].trim().replace(/\.$/, "");
          if (val.length >= 3 && val.length <= 40) {
            return { valor: val, confianza: 0.85, fuente: m[0] };
          }
        }
      }
      return null;
    },
  },
  {
    campo: "dependientes",
    extract: (text) => {
      const lower = text.toLowerCase();
      const numPatterns = [
        /tengo\s+(\d+)\s+(?:hijos?|dependientes?|hij[oa]s?)/i,
        /(\d+)\s+(?:hijos?|dependientes?|hij[oa]s?)/i,
        /(?:tengo|somos)\s+(un|una|dos|tres|cuatro|cinco|seis)\s+(?:hijo|hija|hijos|dependientes)/i,
      ];
      for (const p of numPatterns) {
        const m = lower.match(p);
        if (m) {
          const n = parseSpokenNumber(m[1]);
          return { valor: (n ?? parseInt(m[1])) || 1, confianza: 0.88, fuente: m[0] };
        }
      }
      if (/no tengo (?:hijos|dependientes|familia que dependa)/i.test(lower))
        return { valor: 0, confianza: 0.9, fuente: text.slice(0, 50) };
      return null;
    },
  },

  // --- FLUJO MENSUAL ---
  {
    campo: "ahorro",
    extract: (text) => {
      const lower = text.toLowerCase();
      const triggers = [
        /(?:ahorro|me queda|logro ahorrar|guardo|reservo)[\w\s]{0,15}?/i,
        /(?:mi sueldo|gano|percibo|mis ingresos?|cobro)[\w\s]{0,15}?/i,
      ];
      for (const t of triggers) {
        if (t.test(lower)) {
          const amount = extractAmount(text);
          if (amount && amount > 0) return { valor: amount, confianza: 0.88, fuente: text.slice(0, 60) };
        }
      }
      return null;
    },
  },
  {
    campo: "rentas",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:rento|rentas?|ingreso por renta|me pagan de renta|cobro de renta)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.87, fuente: text.slice(0, 60) };
      }
      if (/no (?:tengo|recibo) (?:ingresos? por )?rentas?/i.test(lower))
        return { valor: 0, confianza: 0.85, fuente: text.slice(0, 40) };
      return null;
    },
  },
  {
    campo: "gastos_basicos",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:gasto|gastos?\s+(?:básicos?|fijos?|esenciales?)|servicios|luz|agua|gas|super|despensa|comida)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.86, fuente: text.slice(0, 60) };
      }
      return null;
    },
  },
  {
    campo: "obligaciones",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:obligacion|colegiatura|seguros?|mantenimiento|pensión alimenticia|pago fijo)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.85, fuente: text.slice(0, 60) };
      }
      return null;
    },
  },
  {
    campo: "otros",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:otros?\s+ingreso|ingreso\s+extra|adicional(?:es)?|freelance|negocio\s+extra|honorarios)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.82, fuente: text.slice(0, 60) };
      }
      return null;
    },
  },
  {
    campo: "creditos",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:crédito|hipoteca|mensualidad(?:es)?|pago (?:del? )?(?:carro|auto|coche|tarjeta)|debo|adeudo)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.86, fuente: text.slice(0, 60) };
      }
      if (/no (?:tengo|debo|pago)\s+(?:ningún\s+)?(?:crédito|deuda)/i.test(lower))
        return { valor: 0, confianza: 0.88, fuente: text.slice(0, 40) };
      return null;
    },
  },

  // --- PATRIMONIO FINANCIERO ---
  {
    campo: "liquidez",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:en (?:el|mi) banco|cuenta(?:s)?\s+(?:de\s+)?(?:ahorro|bancaria)|dinero\s+disponible|liquidez|efectivo|ahorrado(?:s)?)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.87, fuente: text.slice(0, 60) };
      }
      return null;
    },
  },
  {
    campo: "inversiones",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:inversion(?:es)?|fondos?\s+de\s+inversión|acciones?|cetes|bonos?|bolsa|portafolio|actinver|gbm|cetesdirecto)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.87, fuente: text.slice(0, 60) };
      }
      return null;
    },
  },
  {
    campo: "dotales",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:dotal(?:es)?|seguro\s+(?:dotal|con\s+ahorro)|ahorro\s+asegurado)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.85, fuente: text.slice(0, 60) };
      }
      if (/no\s+tengo\s+(?:ningún\s+)?(?:seguro\s+)?dotal/i.test(lower))
        return { valor: 0, confianza: 0.85, fuente: text.slice(0, 40) };
      return null;
    },
  },

  // --- RETIRO ---
  {
    campo: "afore",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:afore|mi afore|en (?:el|mi) afore)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.88, fuente: text.slice(0, 60) };
      }
      return null;
    },
  },
  {
    campo: "ppr",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:ppr|plan personal de retiro|plan\s+de\s+retiro\s+personal)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.87, fuente: text.slice(0, 60) };
      }
      if (/no\s+tengo\s+(?:un\s+)?ppr/i.test(lower))
        return { valor: 0, confianza: 0.86, fuente: text.slice(0, 40) };
      return null;
    },
  },
  {
    campo: "plan_privado",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:plan\s+(?:privado|de la empresa|de pensión|patronal|de\s+retiro\s+de)|mi\s+empresa\s+(?:me\s+)?(?:da|tiene|ofrece))/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.84, fuente: text.slice(0, 60) };
      }
      if (/(?:no\s+(?:tengo|tiene)|mi empresa no)\s+(?:plan\s+(?:privado|de\s+pensión))/i.test(lower))
        return { valor: 0, confianza: 0.85, fuente: text.slice(0, 40) };
      return null;
    },
  },
  {
    campo: "seguros_retiro",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:seguro(?:s)?\s+(?:de\s+)?retiro|seguro\s+(?:para\s+(?:el\s+)?)?retir)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.84, fuente: text.slice(0, 60) };
      }
      return null;
    },
  },
  {
    campo: "ley_73",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:ley\s+73|pensión\s+(?:del\s+)?(?:imss|seguro social)|me\s+(?:van\s+a\s+dar|darán)\s+del\s+seguro)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.83, fuente: text.slice(0, 60) };
      }
      if (/no\s+(?:cotizo|estoy)\s+(?:en\s+)?ley\s+73/i.test(lower))
        return { valor: 0, confianza: 0.85, fuente: text.slice(0, 40) };
      return null;
    },
  },

  // --- PATRIMONIO NO FINANCIERO ---
  {
    campo: "casa",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:mi casa|casa\s+(?:propia|habitación)|valor\s+(?:de\s+)?(?:mi\s+)?casa|donde vivo)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.86, fuente: text.slice(0, 60) };
      }
      if (/no\s+tengo\s+casa\s+propia|rento\s+(?:donde\s+vivo|mi\s+(?:casa|depa))/i.test(lower))
        return { valor: 0, confianza: 0.85, fuente: text.slice(0, 40) };
      return null;
    },
  },
  {
    campo: "inmuebles_renta",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:inmueble(?:s)?\s+(?:que\s+)?rent|propiedad(?:es)?\s+(?:que\s+)?rent|departamento(?:s)?\s+(?:que\s+)?rent|local(?:es)?\s+(?:que\s+)?rent)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.84, fuente: text.slice(0, 60) };
      }
      return null;
    },
  },
  {
    campo: "tierra",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:terreno(?:s)?|tierra(?:s)?|rancho|parcela)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.82, fuente: text.slice(0, 60) };
      }
      return null;
    },
  },
  {
    campo: "negocio",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:mi negocio|negocio\s+propio|empresa\s+propia|valor\s+(?:de\s+)?(?:mi\s+)?negocio|mi empresa vale)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.83, fuente: text.slice(0, 60) };
      }
      return null;
    },
  },
  {
    campo: "herencia",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:herencia|voy a heredar|me van a dejar|espero recibir\s+(?:una\s+)?herencia)/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.80, fuente: text.slice(0, 60) };
      }
      if (/no\s+(?:espero|tengo)\s+(?:ninguna\s+)?herencia/i.test(lower))
        return { valor: 0, confianza: 0.85, fuente: text.slice(0, 40) };
      return null;
    },
  },

  // --- PROTECCIÓN ---
  {
    campo: "seguro_vida",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:seguro\s+de\s+vida|tengo\s+(?:un\s+)?seguro\s+de\s+vida|sí(?:,?\s+)tengo\s+seguro)/i.test(lower))
        return { valor: true, confianza: 0.9, fuente: text.slice(0, 40) };
      if (/no\s+tengo\s+(?:un\s+)?seguro\s+de\s+vida/i.test(lower))
        return { valor: false, confianza: 0.9, fuente: text.slice(0, 40) };
      return null;
    },
  },
  {
    campo: "propiedades_aseguradas",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:propiedades?\s+(?:están?\s+)?asegurad|sí\s+(?:están?\s+)?asegurad|seguro\s+(?:de\s+)?(?:mi\s+)?(?:casa|propiedad|inmueble))/i.test(lower))
        return { valor: true, confianza: 0.87, fuente: text.slice(0, 40) };
      if (/no\s+(?:están?\s+)?asegurad|no\s+tengo\s+seguro\s+(?:de\s+)?(?:casa|propiedad)/i.test(lower))
        return { valor: false, confianza: 0.87, fuente: text.slice(0, 40) };
      return null;
    },
  },
  {
    campo: "sgmm",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:sgmm|gastos\s+médicos\s+mayores|sí\s+tengo\s+(?:un\s+)?(?:seguro\s+)?(?:de\s+)?gastos\s+médicos|sí\s+tengo\s+sgmm)/i.test(lower))
        return { valor: true, confianza: 0.9, fuente: text.slice(0, 40) };
      if (/no\s+tengo\s+(?:seguro\s+de\s+)?gastos\s+médicos|no\s+tengo\s+sgmm/i.test(lower))
        return { valor: false, confianza: 0.9, fuente: text.slice(0, 40) };
      return null;
    },
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Client-side NLU extraction — works entirely in the browser.
 * Scans the text for field values and returns all matches, filtered
 * to only include fields that are still missing.
 */
export function extraerEntidadesLocal(
  texto: string,
  datosFaltantes: string[]
): Sugerencia[] {
  if (!texto.trim() || datosFaltantes.length === 0) return [];

  const faltantesSet = new Set(datosFaltantes);
  const results: Sugerencia[] = [];

  for (const rule of RULES) {
    if (!faltantesSet.has(rule.campo)) continue;
    const match = rule.extract(texto);
    if (match) {
      results.push({
        campo: rule.campo,
        valor: match.valor,
        confianza: match.confianza,
        texto_fuente: match.fuente,
      });
    }
  }

  return results;
}

import { getAccessToken } from "./api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * v2: Continuous extraction — sends the FULL transcript to Claude Haiku
 * via the backend. The local regex engine serves as an instant fallback
 * if the API is unavailable, and also runs alongside to catch obvious matches.
 */
export async function extraerConHaiku(
  textoCompleto: string,
  datosFaltantes: string[]
): Promise<Sugerencia[]> {
  if (!textoCompleto.trim() || datosFaltantes.length === 0) return [];

  try {
    const token = getAccessToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/api/v1/voz/extraer-continuo`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        texto: textoCompleto,
        datos_faltantes: datosFaltantes,
      }),
    });

    if (!res.ok) {
      console.warn("[voz-nlu] Haiku API returned", res.status);
      return extraerEntidadesLocal(textoCompleto, datosFaltantes);
    }

    const parsed = await res.json();
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("[voz-nlu] Haiku API failed, using local fallback:", err);
    return extraerEntidadesLocal(textoCompleto, datosFaltantes);
  }
}

/**
 * Legacy v1 extraction (kept for compatibility).
 */
export async function extraerEntidades(
  texto: string,
  _pasoActual: number
): Promise<Sugerencia[]> {
  return extraerEntidadesLocal(texto, RULES.map((r) => r.campo));
}

const COLLOQUIAL_MAP: Record<string, string> = {
  "lo que me queda al mes": "ahorro",
  "lo que ahorro": "ahorro",
  "lo que gasto en la casa": "gastos_basicos",
  "mis gastos": "gastos_basicos",
  "lo que pago de carro": "creditos",
  "mis créditos": "creditos",
  "lo que debo": "creditos",
  "lo que tengo en el banco": "liquidez",
  "en mi cuenta": "liquidez",
  "mi departamento que rento": "inmuebles_renta",
  "lo que me van a dar del seguro social": "ley_73",
  "mi pensión del imss": "ley_73",
  "me quiero retirar a los": "edad_retiro",
  "jubilarme a los": "edad_retiro",
  "necesito como": "mensualidad_deseada",
  "quiero recibir": "mensualidad_deseada",
  "gano": "ahorro",
  "mi sueldo": "ahorro",
  "mi afore": "afore",
  "tengo un seguro": "seguro_vida",
  "seguro de vida": "seguro_vida",
  "gastos médicos": "sgmm",
};

export function mapearExpresionColoquial(texto: string): string | null {
  const lower = texto.toLowerCase().trim();
  for (const [expr, campo] of Object.entries(COLLOQUIAL_MAP)) {
    if (lower.includes(expr)) return campo;
  }
  return null;
}

export function shouldAutoAccept(confianza: number): "auto" | "confirm" | "ignore" {
  if (confianza >= 0.85) return "auto";
  if (confianza >= 0.7) return "confirm";
  return "ignore";
}
