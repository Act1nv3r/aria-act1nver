import { getAccessToken } from "./api-client";

export interface Oportunidad {
  id: string;
  oportunidad: string;
  producto_sugerido: string;
  razon: string;
  confianza: number;
  detected_at: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const KEYWORD_RULES: Array<{
  keywords: string[];
  oportunidad: string;
  producto: string;
}> = [
  {
    keywords: ["cambiar de trabajo", "nuevo empleo", "renunciar", "otra empresa"],
    oportunidad: "Cambio de empleo detectado",
    producto: "PPR, revisión Afore",
  },
  {
    keywords: ["hijos", "hijo", "niños", "escuela", "colegio", "universidad"],
    oportunidad: "Hijos en edad escolar",
    producto: "Seguro educativo, plan de ahorro",
  },
  {
    keywords: ["comprar casa", "departamento nuevo", "hipoteca", "mudarme"],
    oportunidad: "Interés en inmueble",
    producto: "Crédito hipotecario, seguro de vida",
  },
  {
    keywords: ["esposa no trabaja", "no trabaja", "ama de casa", "se dedica al hogar"],
    oportunidad: "Dependiente económico sin ingreso",
    producto: "Seguro de vida cobertura amplia",
  },
  {
    keywords: ["negocio", "emprender", "mi empresa", "socio", "invertir en un negocio"],
    oportunidad: "Interés en emprendimiento",
    producto: "Cuenta empresarial, crédito PYME, seguro negocio",
  },
  {
    keywords: ["viaje", "vacaciones", "irme al extranjero"],
    oportunidad: "Planes de viaje",
    producto: "Seguro viajero, tarjeta con beneficios",
  },
  {
    keywords: ["retirar", "jubilar", "pensión", "dejar de trabajar"],
    oportunidad: "Interés en retiro",
    producto: "PPR, fondo retiro, Afore voluntario",
  },
  {
    keywords: ["deuda", "debo mucho", "tarjetas", "pagar crédito"],
    oportunidad: "Carga de deuda",
    producto: "Reestructura, consolidación",
  },
  {
    keywords: ["herencia", "testamento", "heredar", "mis papás"],
    oportunidad: "Planeación sucesoria",
    producto: "Fideicomiso, planeación sucesoria",
  },
];

function detectKeywordOpportunities(transcript: string): Oportunidad[] {
  const lower = transcript.toLowerCase();
  const results: Oportunidad[] = [];

  for (const rule of KEYWORD_RULES) {
    const matched = rule.keywords.some((kw) => lower.includes(kw));
    if (matched) {
      results.push({
        id: crypto.randomUUID(),
        oportunidad: rule.oportunidad,
        producto_sugerido: rule.producto,
        razon: `Detectado en la conversación`,
        confianza: 0.75,
        detected_at: Date.now(),
      });
    }
  }

  return results;
}

let lastOppCallTime = 0;
const OPP_COOLDOWN_MS = 30_000;

export async function detectarOportunidades(
  transcriptCompleto: string,
  existingOps: Oportunidad[] = []
): Promise<Oportunidad[]> {
  const keywordOps = detectKeywordOpportunities(transcriptCompleto);

  const existingProducts = new Set(existingOps.map((o) => o.producto_sugerido));
  const newKeywordOps = keywordOps.filter(
    (o) => !existingProducts.has(o.producto_sugerido)
  );

  const now = Date.now();
  if (now - lastOppCallTime < OPP_COOLDOWN_MS || !transcriptCompleto.trim()) {
    return [...existingOps, ...newKeywordOps];
  }

  try {
    lastOppCallTime = now;
    const token = getAccessToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/api/v1/voz/navi-oportunidades`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        transcripcion: transcriptCompleto.slice(-5000),
        oportunidades_existentes: existingOps.map((o) => o.oportunidad),
      }),
    });

    if (!res.ok) return [...existingOps, ...newKeywordOps];

    const data = await res.json();
    const aiOps: Oportunidad[] = (Array.isArray(data) ? data : []).map(
      (d: { oportunidad: string; producto_sugerido: string; razon: string; confianza: number }) => ({
        id: crypto.randomUUID(),
        oportunidad: d.oportunidad,
        producto_sugerido: d.producto_sugerido,
        razon: d.razon,
        confianza: d.confianza || 0.7,
        detected_at: Date.now(),
      })
    );

    const allNew = [...newKeywordOps, ...aiOps].filter(
      (o) => !existingProducts.has(o.producto_sugerido)
    );
    return [...existingOps, ...allNew];
  } catch {
    return [...existingOps, ...newKeywordOps];
  }
}
