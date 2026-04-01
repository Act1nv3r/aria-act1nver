import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json([]);
  }

  const body = await req.json();
  const { transcripcion, datos_cliente } = body as {
    transcripcion: string;
    datos_cliente?: string;
  };

  if (!transcripcion?.trim() || transcripcion.length < 50) {
    return NextResponse.json([]);
  }

  const systemPrompt = `Eres un analista experto de conversaciones financieras entre asesores y clientes en México.

Tu trabajo es leer TODA la conversación y detectar:

1. **OPORTUNIDADES DE PRODUCTO** — señales de que el cliente necesita o se beneficiaría de un producto financiero:
   - Menciona eventos de vida: boda, hijo, cambio de trabajo, negocio, compra de casa, viaje, etc.
   - Tiene gaps en protección, ahorro, retiro, inversión, fiscal
   - Menciona preocupaciones financieras: deudas, gastos altos, falta de ahorro

2. **SEÑALES ENTRE LÍNEAS** — pistas sutiles que el cliente da sin darse cuenta:
   - "Mi esposa quiere que..." → hay un segundo tomador de decisión
   - "Mi hermano me dijo que..." → influenciadores externos
   - "Estoy pensando en..." → intención no concreta aún
   - "Me preocupa que..." → ansiedad financiera = oportunidad de protección
   - "No he tenido tiempo de..." → procrastinación que el asesor puede resolver
   - "Un amigo invierte en..." → interés pasivo en inversiones
   - "El año que viene quiero..." → planes futuros
   - "Mi papá se retiró y..." → referencia de retiro familiar

3. **CONTEXTO PARA SEGUIMIENTO** — información valiosa para CRM post-sesión:
   - Fechas mencionadas: cumpleaños, aniversarios, vencimientos
   - Personas mencionadas: esposa, hijos, padres, socios
   - Emociones detectadas: preocupación, entusiasmo, frustración, indecisión
   - Objeciones: "es muy caro", "no confío en...", "después lo veo"
   - Triggers de contacto: "cuando me paguen", "después de diciembre", "cuando cambie de trabajo"

Para CADA hallazgo responde con este JSON:
{
  "oportunidad": "Título corto descriptivo",
  "producto_sugerido": "Productos Actinver relevantes",
  "razon": "Explicación detallada de POR QUÉ es una oportunidad, citando lo que dijo el cliente",
  "categoria": "proteccion|ahorro|retiro|deuda|inversion|fiscal|patrimonio|seguimiento",
  "prioridad": "alta|media|baja",
  "contexto_seguimiento": "Información útil para el asesor al dar seguimiento (nombres, fechas, emociones, objeciones)",
  "accion_sugerida": "Qué debería hacer el asesor como siguiente paso concreto",
  "señal_detectada": "La frase textual o parafraseo de lo que dijo el cliente que generó esta oportunidad",
  "confianza": 0.0-1.0
}

REGLAS:
- Analiza TODO el texto, no solo palabras clave. Lee entre líneas.
- Sé específico en el contexto_seguimiento — incluye nombres propios, fechas, detalles.
- La accion_sugerida debe ser CONCRETA: "Enviarle por WhatsApp la tabla de beneficios del PPR" en vez de "Dar seguimiento".
- Incluye tanto oportunidades obvias como sutiles.
- Para señales entre líneas, explica qué infiriste y por qué.
- Máximo 8 oportunidades, priorizando las más valiosas.
- Responde SOLO con un JSON array válido. Sin markdown ni texto extra.`;

  const userPrompt = `${datos_cliente ? `Datos ya capturados del cliente:\n${datos_cliente}\n\n` : ""}Conversación completa entre asesor y cliente:
${transcripcion.slice(-6000)}

Analiza la conversación a profundidad e identifica TODAS las oportunidades, señales entre líneas y contexto de seguimiento.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) return NextResponse.json([]);

    const data = await res.json();
    const content = (data?.content || [{}])[0]?.text || "";
    if (!content) return NextResponse.json([]);

    const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return NextResponse.json([]);

    const valid = parsed
      .filter((item: Record<string, unknown>) =>
        typeof item === "object" && item !== null && "oportunidad" in item
      )
      .slice(0, 8)
      .map((item: Record<string, unknown>) => ({
        oportunidad: String(item.oportunidad || ""),
        producto_sugerido: String(item.producto_sugerido || ""),
        razon: String(item.razon || ""),
        categoria: String(item.categoria || "seguimiento"),
        prioridad: String(item.prioridad || "media"),
        contexto_seguimiento: String(item.contexto_seguimiento || ""),
        accion_sugerida: String(item.accion_sugerida || ""),
        señal_detectada: String(item["señal_detectada"] || item.senal_detectada || ""),
        confianza: Math.min(Math.max(Number(item.confianza ?? 0.8), 0), 1),
      }));

    return NextResponse.json(valid);
  } catch {
    return NextResponse.json([]);
  }
}
