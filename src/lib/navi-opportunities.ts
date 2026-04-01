export interface Oportunidad {
  id: string;
  oportunidad: string;
  producto_sugerido: string;
  razon: string;
  confianza: number;
  detected_at: number;
  categoria: "proteccion" | "ahorro" | "retiro" | "deuda" | "inversion" | "fiscal" | "patrimonio" | "seguimiento";
  prioridad: "alta" | "media" | "baja";
  icono: string;
  contexto_seguimiento?: string;
  accion_sugerida?: string;
  señal_detectada?: string;
  fuente?: "keyword" | "datos" | "ai";
}

/* ------------------------------------------------------------------ */
/*  1. Keyword-based detection (from transcript)                       */
/* ------------------------------------------------------------------ */

const KEYWORD_RULES: Array<{
  keywords: string[];
  oportunidad: string;
  producto: string;
  categoria: Oportunidad["categoria"];
  prioridad: Oportunidad["prioridad"];
  icono: string;
}> = [
  {
    keywords: ["cambiar de trabajo", "nuevo empleo", "renunciar", "otra empresa"],
    oportunidad: "Cambio de empleo detectado",
    producto: "PPR, revisión Afore",
    categoria: "retiro", prioridad: "alta", icono: "💼",
  },
  {
    keywords: ["hijos", "hijo", "niños", "escuela", "colegio", "universidad"],
    oportunidad: "Hijos en edad escolar",
    producto: "Seguro educativo, plan de ahorro",
    categoria: "ahorro", prioridad: "alta", icono: "🎓",
  },
  {
    keywords: ["comprar casa", "departamento nuevo", "hipoteca", "mudarme"],
    oportunidad: "Interés en inmueble",
    producto: "Crédito hipotecario, seguro de vida",
    categoria: "patrimonio", prioridad: "alta", icono: "🏠",
  },
  {
    keywords: ["esposa no trabaja", "no trabaja", "ama de casa", "se dedica al hogar"],
    oportunidad: "Dependiente económico sin ingreso",
    producto: "Seguro de vida cobertura amplia",
    categoria: "proteccion", prioridad: "alta", icono: "🛡️",
  },
  {
    keywords: ["negocio", "emprender", "mi empresa", "socio", "invertir en un negocio"],
    oportunidad: "Interés en emprendimiento",
    producto: "Cuenta empresarial, crédito PYME, seguro negocio",
    categoria: "inversion", prioridad: "media", icono: "🏢",
  },
  {
    keywords: ["viaje", "vacaciones", "irme al extranjero"],
    oportunidad: "Planes de viaje",
    producto: "Seguro viajero, tarjeta con beneficios",
    categoria: "proteccion", prioridad: "baja", icono: "✈️",
  },
  {
    keywords: ["retirar", "jubilar", "pensión", "dejar de trabajar"],
    oportunidad: "Interés en retiro",
    producto: "PPR, fondo retiro, Afore voluntario",
    categoria: "retiro", prioridad: "alta", icono: "🌴",
  },
  {
    keywords: ["deuda", "debo mucho", "tarjetas", "pagar crédito"],
    oportunidad: "Carga de deuda",
    producto: "Reestructura, consolidación",
    categoria: "deuda", prioridad: "alta", icono: "💳",
  },
  {
    keywords: ["herencia", "testamento", "heredar", "mis papás"],
    oportunidad: "Planeación sucesoria",
    producto: "Fideicomiso, planeación sucesoria",
    categoria: "patrimonio", prioridad: "media", icono: "📜",
  },
];

function detectKeywordOpportunities(transcript: string): Oportunidad[] {
  const lower = transcript.toLowerCase();
  const results: Oportunidad[] = [];
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      results.push({
        id: crypto.randomUUID(),
        oportunidad: rule.oportunidad,
        producto_sugerido: rule.producto,
        razon: "Detectado en la conversación",
        confianza: 0.75,
        detected_at: Date.now(),
        categoria: rule.categoria,
        prioridad: rule.prioridad,
        icono: rule.icono,
        fuente: "keyword",
      });
    }
  }
  return results;
}

/* ------------------------------------------------------------------ */
/*  2. Data-driven detection (from captured store data)                */
/* ------------------------------------------------------------------ */

interface StoreSnapshot {
  perfil: { nombre?: string; edad?: number; dependientes?: boolean; genero?: string; ocupacion?: string } | null;
  flujoMensual: { ahorro: number; rentas: number; otros: number; gastos_basicos: number; obligaciones: number; creditos: number } | null;
  patrimonio: {
    liquidez: number; inversiones: number; dotales: number; afore: number; ppr: number;
    plan_privado: number; seguros_retiro: number; ley_73: number | null;
    casa: number; inmuebles_renta: number; tierra: number; negocio: number; herencia: number;
    hipoteca: number; saldo_planes: number; compromisos: number;
  } | null;
  retiro: { edad_retiro: number; mensualidad_deseada: number; edad_defuncion: number } | null;
  proteccion: { seguro_vida: boolean; propiedades_aseguradas: boolean | null; sgmm: boolean } | null;
}

export function detectarOportunidadesDesdeDatos(store: StoreSnapshot): Oportunidad[] {
  const ops: Oportunidad[] = [];
  const { perfil, flujoMensual, patrimonio, retiro, proteccion } = store;

  const push = (
    oportunidad: string,
    producto: string,
    razon: string,
    cat: Oportunidad["categoria"],
    pri: Oportunidad["prioridad"],
    icono: string,
    conf = 0.85,
  ) => {
    ops.push({
      id: crypto.randomUUID(),
      oportunidad, producto_sugerido: producto, razon,
      confianza: conf, detected_at: Date.now(),
      categoria: cat, prioridad: pri, icono,
      fuente: "datos",
    });
  };

  // --- PROTECCIÓN ---
  if (proteccion) {
    if (!proteccion.seguro_vida && perfil?.dependientes) {
      push(
        "Sin seguro de vida con dependientes",
        "Seguro de vida temporal o universal",
        "El cliente tiene dependientes económicos pero no cuenta con seguro de vida, dejándolos desprotegidos ante un imprevisto.",
        "proteccion", "alta", "🛡️", 0.95,
      );
    }
    if (!proteccion.seguro_vida && !perfil?.dependientes) {
      push(
        "Sin seguro de vida",
        "Seguro de vida con ahorro o dotal",
        "Aunque no tiene dependientes, un seguro de vida con componente de ahorro ofrece beneficios fiscales y protección.",
        "proteccion", "media", "🛡️", 0.7,
      );
    }
    if (!proteccion.sgmm) {
      push(
        "Sin Seguro de Gastos Médicos Mayores",
        "SGMM individual o familiar",
        "No cuenta con SGMM. Un evento médico importante podría impactar gravemente sus finanzas.",
        "proteccion", "alta", "🏥", 0.9,
      );
    }
    if (proteccion.propiedades_aseguradas === false || proteccion.propiedades_aseguradas === null) {
      const inmuebleVal = (patrimonio?.casa ?? 0) + (patrimonio?.inmuebles_renta ?? 0);
      if (inmuebleVal > 0) {
        push(
          "Inmuebles sin asegurar",
          "Seguro de hogar / seguro inmobiliario",
          `Tiene inmuebles valuados en $${(inmuebleVal / 1_000_000).toFixed(1)}M sin protección contra desastres o robo.`,
          "proteccion", "alta", "🏠", 0.9,
        );
      }
    }
  }

  // --- AHORRO ---
  if (flujoMensual) {
    if (flujoMensual.ahorro === 0) {
      push(
        "Sin ahorro mensual",
        "Cuenta de inversión automatizada, CETES, fondo de ahorro",
        "El cliente no está ahorrando nada mensualmente. Establecer un plan de ahorro automático es prioritario.",
        "ahorro", "alta", "💰", 0.95,
      );
    } else {
      const ingresos = flujoMensual.ahorro + flujoMensual.gastos_basicos + flujoMensual.obligaciones + flujoMensual.creditos;
      if (ingresos > 0) {
        const tasaAhorro = flujoMensual.ahorro / ingresos;
        if (tasaAhorro < 0.1) {
          push(
            "Tasa de ahorro baja",
            "Optimización de gastos, ahorro automatizado",
            `Solo ahorra ${(tasaAhorro * 100).toFixed(0)}% de sus ingresos. Se recomienda al menos 10-20%.`,
            "ahorro", "media", "📊", 0.8,
          );
        }
      }
    }

    if (patrimonio && flujoMensual.gastos_basicos > 0) {
      const mesesReserva = patrimonio.liquidez / flujoMensual.gastos_basicos;
      if (mesesReserva < 3) {
        push(
          "Fondo de emergencia insuficiente",
          "Cuenta líquida, CETES a 28 días, fondo de inversión de corto plazo",
          `Solo tiene ${mesesReserva.toFixed(1)} meses de reserva. Se recomiendan al menos 3-6 meses de gastos.`,
          "ahorro", "alta", "🚨", 0.9,
        );
      }
    }
  }

  // --- DEUDA ---
  if (flujoMensual && flujoMensual.creditos > 0) {
    const ingresos = flujoMensual.ahorro + flujoMensual.gastos_basicos + flujoMensual.obligaciones + flujoMensual.creditos;
    if (ingresos > 0) {
      const ratioDeuda = flujoMensual.creditos / ingresos;
      if (ratioDeuda > 0.3) {
        push(
          "Carga de deuda elevada",
          "Reestructuración de deuda, consolidación de créditos",
          `Los pagos de crédito representan ${(ratioDeuda * 100).toFixed(0)}% de sus ingresos, superando el 30% recomendado.`,
          "deuda", "alta", "⚠️", 0.9,
        );
      }
    }
  }

  // --- RETIRO ---
  if (perfil && retiro) {
    const anosParaRetiro = retiro.edad_retiro - (perfil.edad ?? 30);
    if (anosParaRetiro <= 10 && anosParaRetiro > 0) {
      const saldoEsquemas = (patrimonio?.afore ?? 0) + (patrimonio?.ppr ?? 0) +
        (patrimonio?.plan_privado ?? 0) + (patrimonio?.seguros_retiro ?? 0);
      const necesario = retiro.mensualidad_deseada * 12 * (retiro.edad_defuncion - retiro.edad_retiro);
      if (saldoEsquemas < necesario * 0.3) {
        push(
          "Retiro cercano con ahorro insuficiente",
          "Aportaciones voluntarias a Afore, PPR, inversiones agresivas de corto plazo",
          `Faltan ~${anosParaRetiro} años para el retiro y el saldo acumulado cubre menos del 30% de lo necesario.`,
          "retiro", "alta", "⏰", 0.9,
        );
      }
    }

    if ((patrimonio?.afore ?? 0) === 0 && (patrimonio?.ppr ?? 0) === 0) {
      push(
        "Sin esquemas formales de retiro",
        "PPR (Plan Personal de Retiro), aportaciones voluntarias a Afore",
        "No tiene PPR ni aportaciones voluntarias. Un PPR ofrece beneficios fiscales de hasta $175,505 MXN anuales.",
        "retiro", "alta", "🌴", 0.85,
      );
    } else if ((patrimonio?.ppr ?? 0) === 0) {
      push(
        "Sin Plan Personal de Retiro",
        "PPR con deducibilidad fiscal",
        "No tiene PPR. Es deducible de impuestos y complementa el Afore para el retiro.",
        "retiro", "media", "📋", 0.8,
      );
    }
  }

  // --- INVERSIÓN ---
  if (patrimonio) {
    const totalFinanciero = patrimonio.liquidez + patrimonio.inversiones + patrimonio.dotales;
    if (patrimonio.liquidez > 0 && patrimonio.inversiones === 0 && totalFinanciero > 50_000) {
      push(
        "Patrimonio concentrado en liquidez",
        "Fondos de inversión, portafolio diversificado, ETFs",
        "Todo el patrimonio financiero está en instrumentos líquidos sin rendimiento real. Diversificar generaría mejores rendimientos.",
        "inversion", "alta", "📈", 0.85,
      );
    }

    const totalNoFinanciero = patrimonio.casa + patrimonio.inmuebles_renta + patrimonio.tierra + patrimonio.negocio;
    if (totalNoFinanciero > 0 && totalFinanciero === 0) {
      push(
        "Patrimonio 100% no financiero",
        "Estrategia de liquidez, portafolio financiero",
        "Todo el patrimonio está en bienes no líquidos. Se recomienda diversificar con instrumentos financieros para mayor flexibilidad.",
        "inversion", "media", "🔄", 0.8,
      );
    }
  }

  // --- FISCAL ---
  if (flujoMensual && patrimonio) {
    const ingresos = flujoMensual.ahorro + flujoMensual.gastos_basicos + flujoMensual.obligaciones + flujoMensual.creditos + flujoMensual.rentas + flujoMensual.otros;
    if (ingresos > 50_000 && (patrimonio.ppr ?? 0) === 0 && !proteccion?.sgmm) {
      push(
        "Oportunidad de optimización fiscal",
        "PPR, SGMM deducible, donativos autorizados",
        "Con ingresos altos, no aprovechar deducciones fiscales como PPR y SGMM representa un costo de oportunidad significativo.",
        "fiscal", "media", "🧾", 0.8,
      );
    }
  }

  return ops;
}

/* ------------------------------------------------------------------ */
/*  3. AI-powered deep analysis (Claude Haiku via /api/detect-opportunities) */
/* ------------------------------------------------------------------ */

const CATEGORY_ICONS: Record<string, string> = {
  proteccion: "🛡️", ahorro: "💰", retiro: "🌴", deuda: "💳",
  inversion: "📈", fiscal: "🧾", patrimonio: "🏠", seguimiento: "📋",
};

let _aiInFlight = false;
let _lastAiTextLen = 0;

async function detectarOportunidadesAI(
  transcript: string,
  storeData?: StoreSnapshot,
): Promise<Oportunidad[]> {
  if (transcript.length < 100 || _aiInFlight) return [];
  if (transcript.length <= _lastAiTextLen) return [];

  _aiInFlight = true;
  _lastAiTextLen = transcript.length;

  try {
    const datosCliente = storeData ? buildClientSummary(storeData) : undefined;

    const res = await fetch("/api/detect-opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcripcion: transcript,
        datos_cliente: datosCliente,
      }),
    });

    if (!res.ok) return [];

    const parsed = await res.json();
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: Record<string, string | number>) => ({
      id: crypto.randomUUID(),
      oportunidad: String(item.oportunidad || ""),
      producto_sugerido: String(item.producto_sugerido || ""),
      razon: String(item.razon || ""),
      confianza: Number(item.confianza || 0.8),
      detected_at: Date.now(),
      categoria: (item.categoria || "seguimiento") as Oportunidad["categoria"],
      prioridad: (item.prioridad || "media") as Oportunidad["prioridad"],
      icono: CATEGORY_ICONS[String(item.categoria)] || "📋",
      contexto_seguimiento: String(item.contexto_seguimiento || ""),
      accion_sugerida: String(item.accion_sugerida || ""),
      señal_detectada: String(item["señal_detectada"] || item.senal_detectada || ""),
      fuente: "ai" as const,
    }));
  } catch {
    return [];
  } finally {
    _aiInFlight = false;
  }
}

function buildClientSummary(store: StoreSnapshot): string {
  const parts: string[] = [];
  const { perfil: p, flujoMensual: f, patrimonio: pat, retiro: r, proteccion: pro } = store;
  if (p?.nombre) parts.push(`Nombre: ${p.nombre}`);
  if (p?.edad && p.edad !== 18) parts.push(`Edad: ${p.edad}`);
  if (p?.ocupacion) parts.push(`Ocupación: ${p.ocupacion}`);
  if (p?.dependientes) parts.push("Tiene dependientes");
  if (f) {
    if (f.ahorro > 0) parts.push(`Ahorro mensual: $${f.ahorro.toLocaleString()}`);
    if (f.gastos_basicos > 0) parts.push(`Gastos: $${f.gastos_basicos.toLocaleString()}`);
    if (f.creditos > 0) parts.push(`Créditos: $${f.creditos.toLocaleString()}/mes`);
  }
  if (pat) {
    if (pat.liquidez > 0) parts.push(`Liquidez: $${pat.liquidez.toLocaleString()}`);
    if (pat.inversiones > 0) parts.push(`Inversiones: $${pat.inversiones.toLocaleString()}`);
    if (pat.afore > 0) parts.push(`Afore: $${pat.afore.toLocaleString()}`);
    if (pat.casa > 0) parts.push(`Casa: $${pat.casa.toLocaleString()}`);
  }
  if (r?.edad_retiro && r.edad_retiro !== 65) parts.push(`Retiro deseado: ${r.edad_retiro} años`);
  if (pro) {
    parts.push(`Seguro vida: ${pro.seguro_vida ? "Sí" : "No"}`);
    parts.push(`SGMM: ${pro.sgmm ? "Sí" : "No"}`);
  }
  return parts.join("\n");
}

/* ------------------------------------------------------------------ */
/*  4. Combined detection: keywords + store data + AI deep analysis    */
/* ------------------------------------------------------------------ */

export async function detectarOportunidades(
  transcriptCompleto: string,
  existingOps: Oportunidad[] = [],
  storeData?: StoreSnapshot,
): Promise<Oportunidad[]> {
  const keywordOps = detectKeywordOpportunities(transcriptCompleto);
  const dataOps = storeData ? detectarOportunidadesDesdeDatos(storeData) : [];

  // AI deep analysis runs asynchronously — only when there's new transcript
  const aiOps = await detectarOportunidadesAI(transcriptCompleto, storeData);

  const allNew = [...keywordOps, ...dataOps, ...aiOps];
  const existingTitles = new Set(existingOps.map((o) => o.oportunidad));
  const deduped = allNew.filter((o) => !existingTitles.has(o.oportunidad));

  const combined = [...existingOps, ...deduped];
  combined.sort((a, b) => {
    const priOrder = { alta: 0, media: 1, baja: 2 };
    return priOrder[a.prioridad] - priOrder[b.prioridad];
  });

  return combined;
}

/** Reset AI analysis tracking (useful when starting new sessions) */
export function resetAIOpportunityTracking() {
  _lastAiTextLen = 0;
  _aiInFlight = false;
}
