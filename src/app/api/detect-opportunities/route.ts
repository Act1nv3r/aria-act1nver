import { NextRequest, NextResponse } from "next/server";
import { getProductIndex, buildProductCatalogPrompt } from "@/lib/product-index";

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

  // ── Cargar catálogo de productos (cacheado en memoria) ──────────────────
  const productIndex = getProductIndex();
  const hasProductCatalog = productIndex && productIndex.products.length > 0;
  const catalogSection = hasProductCatalog
    ? buildProductCatalogPrompt(productIndex!)
    : null;

  // ── System Prompt ────────────────────────────────────────────────────────
  const systemPrompt = `Eres un asesor financiero senior de Actinver México.
Tu misión: analizar una entrevista financiera con un cliente y detectar oportunidades de venta específicas basadas en los productos reales disponibles.

${catalogSection ? `${catalogSection}\n---\n` : ""}
Tu trabajo es leer TODA la conversación y detectar:

1. **OPORTUNIDADES DE PRODUCTO** — señales de que el cliente se beneficiaría de un producto del catálogo:
   - Cruza el perfil y necesidades del cliente con los "triggers_de_venta" de cada producto
   - Prioriza productos donde el cliente cumple el "perfil_ideal"
   - Evita proponer donde aplica "cuando_no_proponer"
   ${hasProductCatalog
    ? "- USA SOLO productos del catálogo listado arriba. No inventes productos genéricos."
    : "- Si no hay catálogo disponible, sugiere productos financieros comunes de México."}

2. **SEÑALES ENTRE LÍNEAS** — pistas sutiles que el cliente da sin darse cuenta:
   - "Mi esposa quiere que..." → hay un segundo tomador de decisión
   - "Me preocupa que..." → ansiedad financiera = oportunidad de protección
   - "Un amigo invierte en..." → interés pasivo en inversiones
   - "El año que viene quiero..." → planes futuros
   - "No he tenido tiempo de..." → procrastinación que el asesor puede resolver

3. **CONTEXTO PARA SEGUIMIENTO** — información valiosa para CRM post-sesión:
   - Fechas: cumpleaños, aniversarios, vencimientos
   - Personas: esposa, hijos, padres, socios
   - Emociones: preocupación, entusiasmo, frustración, indecisión
   - Objeciones: "es muy caro", "no confío en...", "después lo veo"
   - Triggers: "cuando me paguen", "después de diciembre", "cuando cambie de trabajo"

4. **GANCHOS DE CONVERSACIÓN** — momentos personales para crear conexión genuina:
   - Eventos próximos: aniversario, cumpleaños, boda, viaje, graduación
   - Situaciones emocionales: preocupación, entusiasmo, pérdida, cambio importante
   - Para ganchos: "tipo": "gancho_conversacion", "accion_sugerida": cómo usarlo para conectar (NO vender directamente)

Responde con un JSON array. Cada elemento:
{
  "oportunidad": "Título corto y específico",
  "producto_sugerido": "${hasProductCatalog ? "Nombre EXACTO del producto según el campo producto_sugerido_texto del catálogo" : "Nombre del producto financiero"}",
  "razon": "Por qué este producto es relevante para ESTE cliente específico, citando su situación",
  "categoria": "proteccion|ahorro|retiro|deuda|inversion|fiscal|patrimonio|seguimiento",
  "prioridad": "alta|media|baja",
  "tipo": "oportunidad|gancho_conversacion",
  "contexto_seguimiento": "Info útil para seguimiento: nombres, fechas, emociones, objeciones",
  "accion_sugerida": "Siguiente paso CONCRETO (ej: 'Enviar por WhatsApp la tabla de rendimientos de Soluciones Alpha')",
  "señal_detectada": "Frase textual o parafraseo del cliente que generó esta oportunidad",
  "confianza": 0.0-1.0
}

REGLAS:
- Máximo 8 oportunidades, priorizando las más valiosas y concretas.
- La accion_sugerida debe ser ESPECÍFICA en máximo 15 palabras.
- razon y contexto_seguimiento máximo 2 oraciones cortas.
- señal_detectada máximo 20 palabras, cita textual o parafraseo breve.
- Para oportunidades de producto: el producto_sugerido debe ser del catálogo.
- Analiza TODO el texto, no solo palabras clave. Lee entre líneas.
- Responde SOLO con un JSON array válido. Sin markdown ni texto extra.`;

  const userPrompt = `${datos_cliente ? `Perfil financiero capturado del cliente:\n${datos_cliente}\n\n` : ""}Conversación completa entre asesor y cliente:
${transcripcion.slice(-6000)}

Analiza la conversación e identifica TODAS las oportunidades, cruzando el perfil del cliente con el catálogo de productos disponible.`;

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
        max_tokens: 8000,
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
      .slice(0, 10)
      .map((item: Record<string, unknown>) => ({
        oportunidad: String(item.oportunidad || ""),
        producto_sugerido: String(item.producto_sugerido || ""),
        razon: String(item.razon || ""),
        categoria: String(item.categoria || "seguimiento"),
        prioridad: String(item.prioridad || "media"),
        tipo: String(item.tipo || "oportunidad"),
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
