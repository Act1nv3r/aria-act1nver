import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

const FIELD_NAMES: Record<string, string> = {
  nombre: "Nombre completo",
  edad: "Edad",
  genero: "Género",
  ocupacion: "Ocupación",
  dependientes: "Dependientes económicos (hijos, familia)",
  ahorro: "Ahorro mensual",
  rentas: "Ingresos por rentas",
  gastos_basicos: "Gastos básicos mensuales",
  obligaciones: "Obligaciones fijas (colegiaturas, seguros)",
  otros: "Otros ingresos adicionales",
  creditos: "Pagos de créditos",
  liquidez: "Liquidez en cuentas bancarias",
  inversiones: "Inversiones (fondos, acciones)",
  dotales: "Seguros dotales",
  afore: "Saldo en Afore",
  ppr: "Plan Personal de Retiro",
  plan_privado: "Plan de pensión empresarial",
  seguros_retiro: "Seguros con beneficio de retiro",
  ley_73: "Pensión Ley 73 IMSS",
  casa: "Valor de casa habitación",
  inmuebles_renta: "Propiedades en renta",
  tierra: "Terrenos",
  negocio: "Valor de negocio propio",
  herencia: "Herencia esperada",
  seguro_vida: "Seguro de vida",
  propiedades_aseguradas: "Propiedades aseguradas",
  sgmm: "Seguro de Gastos Médicos Mayores",
  edad_retiro: "Edad deseada de retiro",
  mensualidad_deseada: "Mensualidad deseada al retirarse",
};

const CATEGORY_MAP: Record<string, string> = {
  nombre: "perfil", edad: "perfil", genero: "perfil", ocupacion: "perfil", dependientes: "perfil",
  ahorro: "flujo", rentas: "flujo", gastos_basicos: "flujo", obligaciones: "flujo", otros: "flujo", creditos: "flujo",
  liquidez: "patrimonio", inversiones: "patrimonio", dotales: "patrimonio",
  afore: "retiro", ppr: "retiro", plan_privado: "retiro", seguros_retiro: "retiro", ley_73: "retiro",
  casa: "patrimonio_nf", inmuebles_renta: "patrimonio_nf", tierra: "patrimonio_nf", negocio: "patrimonio_nf", herencia: "patrimonio_nf",
  seguro_vida: "proteccion", propiedades_aseguradas: "proteccion", sgmm: "proteccion",
  edad_retiro: "retiro", mensualidad_deseada: "retiro",
};

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(null);
  }

  const body = await req.json();
  const { transcripcion, datos_faltantes, contexto } = body as {
    transcripcion: string;
    datos_faltantes: string[];
    contexto: { edad?: number; ocupacion?: string; dependientes?: boolean; nombre?: string };
  };

  if (!datos_faltantes?.length) {
    return NextResponse.json(null);
  }

  const fieldLines = datos_faltantes
    .slice(0, 15)
    .map((f) => `  - ${f}: ${FIELD_NAMES[f] || f}`)
    .join("\n");

  const clientContext = [
    contexto?.nombre && `Nombre: ${contexto.nombre}`,
    contexto?.edad && `Edad: ${contexto.edad}`,
    contexto?.ocupacion && `Ocupación: ${contexto.ocupacion}`,
    contexto?.dependientes !== undefined && `Dependientes: ${contexto.dependientes ? "Sí" : "No"}`,
  ].filter(Boolean).join(", ");

  const systemPrompt = `Eres Navi, el asistente inteligente de un asesor financiero mexicano.
Tu trabajo es sugerir la SIGUIENTE pregunta más natural para continuar la conversación y recopilar datos financieros del cliente.

REGLAS:
1. Las preguntas deben sentirse como conversación natural, NO como cuestionario o interrogatorio.
2. Usa principios de behavioral economics: preguntas abiertas, contextuales, que fluyan de lo que se acaba de hablar.
3. Si el cliente acaba de hablar de ingresos → pregunta sobre gastos (flujo natural).
4. Si se habló de familia → pregunta sobre seguros/protección (contexto emocional).
5. Si se habló de trabajo → pregunta sobre Afore/retiro (contexto profesional).
6. Si quedan pocos datos (≤5) → sé más directo: "Solo me faltan un par de datos más..."
7. NUNCA sugieras preguntar algo que YA se recopiló.
8. La pregunta debe ser en español mexicano, natural y empática.
9. Responde SOLO con JSON válido, sin markdown ni texto extra.

Responde con este formato exacto:
{"tipo":"pregunta","texto":"la pregunta sugerida","categoria":"nombre_categoria","campo_target":"nombre_campo","confianza":0.9}`;

  const userPrompt = `Datos del cliente ya conocidos: ${clientContext || "Ninguno aún"}

Datos que AÚN FALTAN por obtener:
${fieldLines}

Últimos fragmentos de la conversación:
${(transcripcion || "No hay transcripción aún").slice(-1500)}

Genera la siguiente pregunta más natural y contextual para el asesor.`;

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
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) return NextResponse.json(null);

    const data = await res.json();
    const content = (data?.content || [{}])[0]?.text || "";
    if (!content) return NextResponse.json(null);

    const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed?.texto) return NextResponse.json(null);

    return NextResponse.json({
      tipo: parsed.tipo || "pregunta",
      texto: parsed.texto,
      categoria: parsed.categoria || CATEGORY_MAP[parsed.campo_target] || "general",
      campo_target: parsed.campo_target || undefined,
      confianza: Math.min(Math.max(Number(parsed.confianza ?? 0.9), 0), 1),
    });
  } catch {
    return NextResponse.json(null);
  }
}
