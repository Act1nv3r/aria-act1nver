export interface Sugerencia {
  campo: string;
  valor: string | number | boolean;
  confianza: number;
  texto_fuente: string;
}

// ---------------------------------------------------------------------------
// Number parsing: handles spoken numbers, currency, and shorthand
// Mexican colloquial: "4.5 millones", "1 millón doscientos", "3 millones y medio"
// ---------------------------------------------------------------------------

const WORD_NUMBERS: Record<string, number> = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciséis: 16, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintidos: 22, veintitrés: 23, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiséis: 26, veintiseis: 26,
  veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60,
  setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100,
  doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300,
  cuatrocientos: 400, cuatrocientas: 400, quinientos: 500, quinientas: 500,
  seiscientos: 600, seiscientas: 600, setecientos: 700, setecientas: 700,
  ochocientos: 800, ochocientas: 800, novecientos: 900, novecientas: 900,
};

function parseWordNumber(word: string): number | null {
  const w = word.toLowerCase().trim();
  if (WORD_NUMBERS[w] !== undefined) return WORD_NUMBERS[w];

  // "treinta y cinco" → 35
  const compoundMatch = w.match(
    /^(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)\s+y\s+(uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)$/
  );
  if (compoundMatch) {
    const tens = WORD_NUMBERS[compoundMatch[1]];
    const ones = WORD_NUMBERS[compoundMatch[2]];
    if (tens !== undefined && ones !== undefined) return tens + ones;
  }

  return null;
}

function parseSimpleNumber(raw: string): number | null {
  const s = raw
    .replace(/,/g, "")
    .replace(/\$/g, "")
    .replace(/\s+/g, "")
    .trim();
  const n = Number(s);
  return isNaN(n) ? null : n;
}

/**
 * Parse a full spoken amount including compound expressions.
 * Handles: "4.5 millones", "1 millón doscientos", "3 millones y medio",
 * "un millón doscientos mil", "medio millón", "350 mil", "doscientos mil", etc.
 */
function parseSpokenAmount(text: string): number | null {
  const s = text
    .toLowerCase()
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .replace(/pesos/gi, "")
    .replace(/mensuales/gi, "")
    .replace(/al\s+mes/gi, "")
    .replace(/de\s+pesos/gi, "")
    .replace(/mxn/gi, "")
    .trim();

  if (!s) return null;

  // "medio millón" → 500,000
  if (/^medio\s+mill[oó]n$/i.test(s)) return 500_000;

  // "un cuarto de millón" → 250,000
  if (/^un\s+cuarto\s+de\s+mill[oó]n$/i.test(s)) return 250_000;

  // Pattern: {N} millón(es) {remainder}
  // Examples: "4.5 millones", "1 millón doscientos", "3 millones y medio",
  //           "un millón 200", "2 millones 500 mil", "1 millón doscientos mil"
  const millonPattern = /^([\d.]+|un[oa]?|medio)\s*mill[oó]n(?:es)?(?:\s+(?:de\s+)?(?:y\s+)?(.+))?$/i;
  const mm = s.match(millonPattern);
  if (mm) {
    let base: number;
    if (mm[1] === "un" || mm[1] === "uno" || mm[1] === "una") base = 1;
    else if (mm[1] === "medio") base = 0.5;
    else base = parseFloat(mm[1]);
    if (isNaN(base)) return null;

    let millions = base * 1_000_000;

    const remainder = (mm[2] || "").trim();
    if (remainder) {
      const extra = parseRemainderAfterMillions(remainder);
      if (extra !== null) millions += extra;
    }

    return millions;
  }

  // Pattern: {word} millón(es) — e.g. "dos millones", "tres millones y medio"
  const wordMillonPattern = /^(\w+)\s+mill[oó]n(?:es)?(?:\s+(?:de\s+)?(?:y\s+)?(.+))?$/i;
  const wm = s.match(wordMillonPattern);
  if (wm) {
    const baseWord = parseWordNumber(wm[1]);
    if (baseWord !== null && baseWord >= 1 && baseWord <= 999) {
      let millions = baseWord * 1_000_000;
      const remainder = (wm[2] || "").trim();
      if (remainder) {
        const extra = parseRemainderAfterMillions(remainder);
        if (extra !== null) millions += extra;
      }
      return millions;
    }
  }

  // Pattern: {N} mil — e.g. "50 mil", "350 mil", "doscientos mil"
  const milPattern = /^([\d.]+)\s*mil$/i;
  const km = s.match(milPattern);
  if (km) {
    const n = parseFloat(km[1]);
    if (!isNaN(n)) return n * 1_000;
  }

  // Pattern: {word} mil — e.g. "doscientos mil", "quinientos mil"
  const wordMilPattern = /^(\w+(?:\s+y\s+\w+)?)\s+mil$/i;
  const wkm = s.match(wordMilPattern);
  if (wkm) {
    const n = parseWordNumber(wkm[1]);
    if (n !== null) return n * 1_000;
  }

  // Simple word number
  const wordVal = parseWordNumber(s);
  if (wordVal !== null) return wordVal;

  // Plain numeric
  return parseSimpleNumber(s);
}

/**
 * Parse the part after "millones" — could be "y medio", "doscientos",
 * "200", "500 mil", "doscientos mil", etc.
 */
function parseRemainderAfterMillions(remainder: string): number | null {
  const r = remainder.toLowerCase().trim();

  if (r === "medio" || r === "y medio") return 500_000;

  // "{N} mil" — e.g. "500 mil", "200 mil"
  const milMatch = r.match(/^([\d.]+)\s*mil$/i);
  if (milMatch) {
    const n = parseFloat(milMatch[1]);
    if (!isNaN(n)) return n * 1_000;
  }

  // "{word} mil" — e.g. "doscientos mil", "quinientos mil"
  const wordMilMatch = r.match(/^(\w+(?:\s+y\s+\w+)?)\s+mil$/i);
  if (wordMilMatch) {
    const n = parseWordNumber(wordMilMatch[1]);
    if (n !== null) return n * 1_000;
  }

  // Plain number — e.g. "200" meaning 200,000, "doscientos" meaning 200,000
  // Context: after "millones", a naked number ≤999 implies thousands
  const wordVal = parseWordNumber(r);
  if (wordVal !== null) return wordVal * 1_000;

  const plainNum = parseFloat(r.replace(/,/g, ""));
  if (!isNaN(plainNum)) {
    // After millions: "200" → 200,000 ; "1200" → 1,200 (literal)
    return plainNum <= 999 ? plainNum * 1_000 : plainNum;
  }

  return null;
}

// Try to extract a currency/monetary amount from text
function extractAmount(text: string): number | null {
  // Direct $ amounts: $50,000 or $4,500,000
  const dollarMatch = text.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
  if (dollarMatch) {
    const n = parseSimpleNumber(dollarMatch[1]);
    if (n !== null && n > 0) return n;
  }

  // "XXX pesos/mxn/mensuales"
  const pesosMatch = text.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:pesos|mxn|mensuales|al\s+mes)/i);
  if (pesosMatch) {
    const n = parseSimpleNumber(pesosMatch[1]);
    if (n !== null && n > 0) return n;
  }

  // Compound spoken amounts: "4.5 millones", "1 millón doscientos",
  // "medio millón", "3 millones y medio", "doscientos mil", "50 mil"
  const spokenPatterns = [
    // millones with optional remainder
    /(?:como|unos|aproximadamente|más o menos|cerca de|alrededor de|de|son|vale|tiene|tengo)?\s*((?:[\d.]+|un[oa]?|medio|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*mill[oó]n(?:es)?(?:\s+(?:y\s+)?(?:medio|[\d.]+\s*mil|(?:doscient|trescient|cuatrocient|quinient|seiscient|setecient|ochocient|novecient)\w*(?:\s+mil)?))?)/i,
    // medio millón standalone
    /(?:como|unos)?\s*(medio\s+mill[oó]n)/i,
    // N mil
    /(?:como|unos|aproximadamente|más o menos|cerca de|alrededor de)?\s*((?:[\d.]+|(?:doscient|trescient|cuatrocient|quinient|seiscient|setecient|ochocient|novecient)\w*)\s+mil)/i,
  ];

  for (const p of spokenPatterns) {
    const m = text.match(p);
    if (m) {
      const n = parseSpokenAmount(m[1]);
      if (n !== null && n > 0) return n;
    }
  }

  // Contextual patterns with verbs + amount
  const contextPatterns = [
    /(?:como|unos|aproximadamente|más o menos|cerca de|alrededor de)\s*\$?\s*([\d,]+)/i,
    /(?:gano|cobro|recibo|ahorro|gasto|pago|debo|tengo)\s+(?:como\s+)?(?:unos\s+)?\$?\s*([\d,]+)/i,
  ];
  for (const p of contextPatterns) {
    const m = text.match(p);
    if (m) {
      const n = parseSimpleNumber(m[1]);
      if (n !== null && n > 0) return n;
    }
  }

  return null;
}

function extractAge(text: string): number | null {
  // --- Birth year patterns first (4-digit year → calculate age) ---
  const birthYearPatterns = [
    /nac[ií]\s+(?:el\s+\d{1,2}\s+de\s+\w+\s+de\s+|en\s+)?(\d{4})/i, // "nací en 1982" / "nací el 5 de mayo de 1980"
    /\bsoy\s+de\s+(?:generación\s+)?(\d{4})\b/i,                       // "soy de 1985"
    /\baño\s+de\s+nacimiento\s+(?:es\s+)?(\d{4})/i,                    // "año de nacimiento es 1985"
  ];
  for (const p of birthYearPatterns) {
    const m = text.match(p);
    if (m) {
      const year = parseInt(m[1]);
      if (year >= 1920 && year <= 2009) {
        const age = new Date().getFullYear() - year;
        if (age >= 15 && age <= 120) return age;
      }
    }
  }

  // --- Direct age patterns (require context to avoid false positives) ---
  // IMPORTANT: "años" is required (not optional) to avoid capturing "tengo 20 empleados"
  // Also avoid matching "N años de hipoteca/experiencia/trabajo/etc."
  const DISQUALIFY_AFTER = /\baños\s+(?:de\s+(?:hipoteca|experiencia|trabajo|servicio|antigüedad|carrera|crédito|casado|plazo|casada|matrimonio)|pagando|trabajando|viviendo|llevamos|llevo|tiene\s+la\s+empresa|de\s+la\s+empresa)/i;

  // Word-age helper: "tengo cuarenta y cinco años" → 45
  // Handles decades+units like "treinta y dos", "cuarenta y cinco", etc.
  const WORD_AGE_PATTERN = /\b(?:tengo|cumplo|cumplí|cumplí)\s+((?:treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)(?:\s+y\s+(?:un[oa]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve))?|veinte(?:\s+y\s+(?:un[oa]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve))?|treinta|cuarenta|cincuenta|sesenta|setenta)\s+años\b/i;
  const wm = text.match(WORD_AGE_PATTERN);
  if (wm) {
    const raw = wm[1].trim().toLowerCase();
    // Try decade+unit compound first (e.g. "treinta y cinco")
    const compoundMatch = raw.match(/^(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|veinte)\s+y\s+(uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)$/i);
    if (compoundMatch) {
      const tens = WORD_NUMBERS[compoundMatch[1].toLowerCase()] ?? 0;
      const ones = WORD_NUMBERS[compoundMatch[2].toLowerCase()] ?? 0;
      const age = tens + ones;
      if (age >= 15 && age <= 120) return age;
    }
    const simpleAge = WORD_NUMBERS[raw];
    if (simpleAge !== undefined && simpleAge >= 15 && simpleAge <= 120) return simpleAge;
  }

  const patterns: RegExp[] = [
    /\btengo\s+(\d{1,3})\s+años\b/i,            // "tengo 45 años"
    /\bcumplo\s+(\d{1,3})\s+años\b/i,           // "cumplo 45 años"
    /\bcumpl[ií]\s+(\d{1,3})\s+años?\b/i,       // "cumplí 45 años"
    /\bvoy\s+a\s+cumplir\s+(\d{1,3})/i,         // "voy a cumplir 45"
    /\btengo\s+(\d{1,3})\s+de\s+edad\b/i,       // "tengo 45 de edad"
    /\bmi\s+edad\s+(?:es\s+(?:de\s+)?)?(\d{1,3})/i, // "mi edad es 45" / "mi edad es de 45"
    /\bedad\s+(?:es\s+(?:de\s+)?|de\s+)?(\d{1,3})/i, // "edad de 45" / "edad es de 45"
    /\b(\d{1,3})\s+años\s+(?:de\s+edad|tengo|cumpl)/i, // "45 años de edad" / "45 años tengo"
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const age = parseInt(m[1]);
      if (age >= 15 && age <= 120) {
        // Verify no disqualifying context (e.g. "tengo 20 años de hipoteca")
        const matchStart = text.search(p);
        const surrounding = text.slice(Math.max(0, matchStart), matchStart + m[0].length + 40);
        if (DISQUALIFY_AFTER.test(surrounding)) continue;
        return age;
      }
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
        /tengo\s+(\d+)\s+(?:hijos?|dependientes?|hij[oa]s?|niños?)/i,
        /(\d+)\s+(?:hijos?|dependientes?|hij[oa]s?|niños?)/i,
        /(?:tengo|somos)\s+(un[oa]?|dos|tres|cuatro|cinco|seis|siete|ocho)\s+(?:hijos?|hijas?|niños?|dependientes?)/i,
      ];
      for (const p of numPatterns) {
        const m = lower.match(p);
        if (m) {
          const n = parseWordNumber(m[1]) ?? parseInt(m[1]);
          return { valor: !isNaN(n) && n > 0 ? n : 1, confianza: 0.88, fuente: m[0] };
        }
      }
      if (/\b(?:tengo\s+(?:hijos?|familia)|sí\s+tengo\s+(?:hijos?|dependientes))\b/i.test(lower))
        return { valor: true, confianza: 0.85, fuente: text.slice(0, 50) };
      if (/no tengo (?:hijos|dependientes|familia que dependa|ningún dependiente)/i.test(lower))
        return { valor: false, confianza: 0.9, fuente: text.slice(0, 50) };
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
      // Check each sentence independently — prevents false positives from "en el banco"
      // appearing in one part of the 30s window and an unrelated number in another part.
      const BANK_PATTERN = /(?:en (?:el|mi) banco|cuenta(?:s)?\s+(?:de\s+)?(?:ahorro|bancaria|bancarias?)|saldo\s+(?:disponible|bancario|en\s+(?:el|mi)\s+banco)|dinero\s+disponible|liquidez|dinero\s+en\s+efectivo|(?:tengo|mantengo|guardo)\s+(?:\w+\s+)?en\s+(?:el|mi)\s+banco|(?:tengo|mantengo)\s+(?:\w+\s+)?en\s+(?:una\s+)?cuenta)/i;
      const sentences = text.split(/[.!?\n]+/);
      for (const sentence of sentences) {
        if (!sentence.trim()) continue;
        if (BANK_PATTERN.test(sentence)) {
          const amount = extractAmount(sentence);
          if (amount && amount > 0) return { valor: amount, confianza: 0.87, fuente: sentence.trim().slice(0, 60) };
        }
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

  // --- RETIRO OBJETIVOS ---
  {
    campo: "edad_retiro",
    extract: (text) => {
      const patterns = [
        /(?:retirar(?:me)?|jubilar(?:me)?)\s+(?:a\s+los\s+)?(\d{2})/i,
        /(?:retiro|jubilación)\s+(?:a\s+(?:los\s+)?)?(\d{2})/i,
        /a\s+los\s+(\d{2})\s+(?:me\s+)?(?:retiro|jubilo)/i,
      ];
      for (const p of patterns) {
        const m = text.match(p);
        if (m) {
          const age = parseInt(m[1]);
          if (age >= 40 && age <= 80) return { valor: age, confianza: 0.9, fuente: m[0] };
        }
      }
      return null;
    },
  },
  {
    campo: "mensualidad_deseada",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:recibir|necesit|quisiera|quiero|me gustaría|vivir con|necesitaría)\s+(?:al\s+mes|mensuales?|cada\s+mes)/i.test(lower) ||
          /(?:al\s+mes|mensual(?:es)?)\s+(?:cuando|para|al)\s+(?:me\s+)?retir/i.test(lower) ||
          /(?:para\s+(?:mi\s+)?retiro|cuando\s+me\s+retire).{0,30}?\d/i.test(lower)) {
        const amount = extractAmount(text);
        if (amount && amount > 0) return { valor: amount, confianza: 0.87, fuente: text.slice(0, 60) };
      }
      return null;
    },
  },

  // --- PROTECCIÓN ---
  {
    campo: "seguro_vida",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:seguro\s+de\s+vida|tengo\s+(?:un\s+)?seguro\s+(?:de\s+vida)?|cuento\s+con\s+(?:un\s+)?seguro\s+de\s+vida|sí(?:,?\s+)tengo\s+seguro|tengo\s+mi\s+seguro\s+de\s+vida)/i.test(lower))
        return { valor: true, confianza: 0.9, fuente: text.slice(0, 40) };
      if (/no\s+tengo\s+(?:un\s+)?seguro\s+de\s+vida|no\s+cuento\s+con\s+seguro\s+de\s+vida|sin\s+seguro\s+de\s+vida/i.test(lower))
        return { valor: false, confianza: 0.9, fuente: text.slice(0, 40) };
      return null;
    },
  },
  {
    campo: "propiedades_aseguradas",
    extract: (text) => {
      const lower = text.toLowerCase();
      if (/(?:propiedades?\s+(?:están?\s+)?asegurad|sí\s+(?:están?\s+)?asegurad|seguro\s+(?:de\s+)?(?:mi\s+)?(?:casa|propiedad|inmueble)|tengo\s+(?:el\s+)?seguro\s+(?:de\s+)?(?:la\s+)?casa|mi\s+casa\s+(?:está\s+)?asegurad)/i.test(lower))
        return { valor: true, confianza: 0.87, fuente: text.slice(0, 40) };
      if (/no\s+(?:están?\s+)?asegurad|no\s+tengo\s+seguro\s+(?:de\s+)?(?:casa|propiedad)|sin\s+seguro\s+(?:de\s+)?(?:casa|propiedad)/i.test(lower))
        return { valor: false, confianza: 0.87, fuente: text.slice(0, 40) };
      return null;
    },
  },
  {
    campo: "sgmm",
    extract: (text) => {
      const lower = text.toLowerCase();
      // Accept broad phrasings: "tengo SGMM", "cuento con SGMM", "gastos médicos (mayores)", etc.
      if (/(?:sgmm|gastos\s+médicos(?:\s+mayores)?|tengo\s+(?:un\s+)?(?:seguro\s+(?:de\s+)?)?gastos\s+médicos|cuento\s+con\s+(?:un\s+)?(?:seguro\s+(?:de\s+)?)?gastos\s+médicos|tengo\s+(?:mi\s+)?sgmm|cuento\s+con\s+sgmm)/i.test(lower))
        return { valor: true, confianza: 0.9, fuente: text.slice(0, 40) };
      if (/no\s+tengo\s+(?:seguro\s+de\s+)?gastos\s+médicos|no\s+tengo\s+sgmm|no\s+cuento\s+con\s+(?:sgmm|gastos\s+médicos)/i.test(lower))
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

/**
 * Sends the FULL transcript to Claude Haiku via the Next.js API route.
 * Falls back to local regex if the API is unavailable.
 */
export async function extraerConHaiku(
  textoCompleto: string,
  datosFaltantes: string[]
): Promise<Sugerencia[]> {
  if (!textoCompleto.trim() || datosFaltantes.length === 0) return [];

  try {
    const res = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return extraerEntidadesLocal(textoCompleto, datosFaltantes);
    }
    return parsed;
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
  "cuento con seguro de vida": "seguro_vida",
  "gastos médicos": "sgmm",
  "gastos médicos mayores": "sgmm",
  "tengo sgmm": "sgmm",
  "cuento con sgmm": "sgmm",
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
