export interface Oportunidad {
  id: string;
  oportunidad: string;
  producto_sugerido: string;
  razon: string;
  confianza: number;
  detected_at: number;
}

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

export async function detectarOportunidades(
  transcriptCompleto: string,
  existingOps: Oportunidad[] = []
): Promise<Oportunidad[]> {
  const keywordOps = detectKeywordOpportunities(transcriptCompleto);

  const existingProducts = new Set(existingOps.map((o) => o.producto_sugerido));
  const newKeywordOps = keywordOps.filter(
    (o) => !existingProducts.has(o.producto_sugerido)
  );

  return [...existingOps, ...newKeywordOps];
}
