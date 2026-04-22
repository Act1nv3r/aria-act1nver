import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

const FIELD_DESCRIPTIONS: Record<string, string> = {
  nombre: "Nombre completo del cliente",
  edad: "Edad actual del cliente en años (número entero). Si dice su año de nacimiento (ej: 'nací en 1982', 'soy de 1985'), calcula la edad: 2026 - año = edad. Ejemplos: 'nací en 1982' → 44, 'soy de 1990' → 36, 'tengo 45 años' → 45.",
  genero: "Género: Masculino, Femenino, u Otro",
  ocupacion: "Ocupación o profesión del cliente (asalariado, independiente, o empresario)",
  dependientes: "¿Tiene dependientes económicos? (true si tiene hijos o familia que dependa de él, false si no). Si dice 'tengo 2 hijos' = true. Si dice 'no tengo hijos' = false.",
  ahorro: "Monto mensual que ahorra o le sobra al mes (número en MXN). Si dice 'gano 80 mil' o 'mi sueldo es 80000', ese es el ahorro/ingreso.",
  rentas: "Ingresos mensuales por rentas de propiedades (número en MXN). 0 si no tiene.",
  gastos_basicos: "Gastos mensuales esenciales: comida, servicios, transporte, renta de donde vive (número en MXN). Si dice '30 mil de gastos' = 30000.",
  obligaciones: "Pagos fijos mensuales: colegiaturas, seguros, mantenimientos (número en MXN)",
  otros: "Otros ingresos adicionales al sueldo: freelance, honorarios, negocio extra (número en MXN)",
  creditos: "Pagos mensuales de créditos: hipoteca, auto, tarjetas de crédito (número en MXN). Si dice 'crédito hipotecario de 35 mil' = 35000. 0 si no tiene.",
  liquidez: "Saldo TOTAL acumulado en cuentas bancarias o efectivo disponible (número en MXN). SOLO si mencionan 'en el banco', 'en mi cuenta', 'tengo X guardado', 'saldo en el banco'. NO confundir con el ahorro mensual (lo que sobra al mes).",
  inversiones: "Monto total en inversiones: fondos, acciones, CETES, bonos (número en MXN)",
  dotales: "Monto en seguros dotales o con componente de ahorro (número en MXN)",
  afore: "Saldo acumulado en AFORE (número en MXN). ¡IMPORTANTE: el saldo en AFORE NO implica Ley 73! Son cosas distintas. No extraigas ley_73 solo porque mencionan AFORE.",
  ppr: "Monto en Plan Personal de Retiro (número en MXN). 0 si no tiene.",
  plan_privado: "Monto en plan de pensión de la empresa (número en MXN). 0 si no tiene.",
  seguros_retiro: "Monto en seguros con beneficio de retiro (número en MXN)",
  ley_73: "Pensión mensual garantizada por Ley 73 del IMSS (número en MXN). SOLO extraer si explícitamente mencionan 'Ley 73', 'pensión del IMSS', 'pensión del Seguro Social', o un monto específico que recibirán del IMSS al jubilarse. NUNCA inferir ley_73 de tener AFORE — son campos completamente independientes. Ejemplo: 'tengo 200 mil en AFORE' = NO extraer ley_73.",
  casa: "Valor de la casa habitación propia (número en MXN). 0 si renta.",
  inmuebles_renta: "Valor de propiedades que renta a terceros (número en MXN)",
  tierra: "Valor de terrenos o tierra (número en MXN)",
  negocio: "Valor estimado de negocio propio (número en MXN)",
  herencia: "Monto esperado de herencia futura (número en MXN). 0 si no espera.",
  seguro_vida: "¿Tiene seguro de vida? (true/false). Cualquier afirmación de tener seguro de vida = true. Ejemplos: 'sí tengo seguro de vida', 'tengo seguro de vida', 'cuento con seguro de vida', 'tengo mi seguro'.",
  propiedades_aseguradas: "¿Sus propiedades están aseguradas? (true/false). 'mis propiedades están aseguradas', 'sí están aseguradas', 'tengo seguro de la casa' = true.",
  sgmm: "¿Tiene Seguro de Gastos Médicos Mayores? (true/false). Cualquier mención de SGMM o gastos médicos = true. Ejemplos: 'tengo SGMM', 'cuento con SGMM', 'tengo gastos médicos', 'tengo seguro de gastos médicos', 'gastos médicos mayores'.",
  edad_retiro: "Edad a la que desea retirarse (número entero)",
  mensualidad_deseada: "Monto mensual deseado al retirarse (número en MXN)",
};

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 }
    );
  }

  const body = await req.json();
  const { texto, datos_faltantes } = body as {
    texto: string;
    datos_faltantes: string[];
  };

  if (!texto?.trim() || !datos_faltantes?.length) {
    return NextResponse.json([]);
  }

  const fieldLines = datos_faltantes
    .map((campo) => `  - ${campo}: ${FIELD_DESCRIPTIONS[campo] || campo}`)
    .join("\n");

  const systemPrompt = `Eres un experto extractor de datos financieros para una herramienta de planificación financiera en México.

Analizas conversaciones entre un asesor financiero y su cliente para extraer TODOS los datos mencionados.

REGLAS CRÍTICAS:
1. Analiza TODO el texto completo, cada frase puede contener datos valiosos.
2. El cliente habla coloquialmente:
   - "Tengo 2 hijos" = dependientes: true
   - "Me sobran como 15 mil" = ahorro: 15000 (NO liquidez — es el sobrante mensual)
   - "Tengo 200 mil en el banco" = liquidez: 200000 (sí es liquidez — es saldo total bancario)
   - "Gasto unos 30 mil al mes en todo" = gastos_basicos: 30000
   - "Pago 35 mil de hipoteca" = creditos: 35000
   - "Mi casa vale como 3 millones" = casa: 3000000
   - "Sí tengo seguro de vida" = seguro_vida: true
   - "También tengo gastos médicos mayores" = sgmm: true
   - "No tengo deudas" = creditos: 0
3. REGLAS DE NO-INFERENCIA (muy importante):
   - AFORE ≠ Ley 73. Tener AFORE NO significa tener pensión Ley 73. Son campos separados.
   - Ley 73 SOLO si dicen: "Ley 73", "pensión del IMSS", "pensión del Seguro Social", o dan un monto de pensión IMSS.
   - liquidez ≠ ahorro. "Tengo 200 mil en el banco" = liquidez. "Me sobran 15 mil al mes" = ahorro. No confundir.
4. Montos en MXN — el mexicano usa estas expresiones:
   - "50 mil" = 50000
   - "350 mil" = 350000
   - "doscientos mil" = 200000
   - "medio millón" = 500000
   - "un millón" = 1000000
   - "1.5 millones" = 1500000
   - "2.5 millones" = 2500000
   - "4.5 millones" = 4500000 (NO 4.5, son 4 millones y medio)
   - "1 millón doscientos" = 1200000 (1 millón + 200 mil)
   - "1 millón 200" = 1200000 (misma lógica)
   - "3 millones y medio" = 3500000
   - "un millón y medio" = 1500000
   - "2 millones 500 mil" = 2500000
   - "como millón y medio" = 1500000
   - "un cuarto de millón" = 250000
   REGLA CLAVE: Cuando dicen "X millones Y" donde Y es un número pequeño (ej: 200, 300, 500), Y se refiere a MILES. "1 millón doscientos" = 1,200,000 NO 1,000,200.
5. Para campos booleanos (seguro_vida, propiedades_aseguradas, sgmm, dependientes): cualquier mención afirmativa = true, negativa = false.
6. Confianza alta (0.88-0.95) cuando el dato es claro y explícito. Media (0.75-0.87) solo si hay contexto suficiente para inferir. BAJA si solo es una suposición.
7. Responde SOLAMENTE con un JSON array válido. Sin texto adicional, sin markdown, sin explicaciones.
8. Si no encuentras información EXPLÍCITA para un campo, NO lo incluyas. Preferible dejar vacío que hacer una inferencia incorrecta.
9. Extrae los campos que el cliente mencionó. No inventes datos que no dijo.`;

  const userPrompt = `Campos que necesito extraer de esta conversación:
${fieldLines}

Conversación completa:
${texto.slice(-5000)}

Responde SOLO con JSON array: [{"campo": "nombre_campo", "valor": valor_extraido, "confianza": 0.0-1.0, "texto_fuente": "fragmento exacto"}]`;

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
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[extract] Anthropic error:", res.status, errText);
      return NextResponse.json([]);
    }

    const data = await res.json();
    const content = (data?.content || [{}])[0]?.text || "";
    if (!content) return NextResponse.json([]);

    const cleaned = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return NextResponse.json([]);

    const faltantesSet = new Set(datos_faltantes);
    const valid = parsed
      .filter(
        (item: Record<string, unknown>) =>
          typeof item === "object" &&
          item !== null &&
          "campo" in item &&
          "valor" in item &&
          faltantesSet.has(item.campo as string)
      )
      .map((item: Record<string, unknown>) => ({
        campo: item.campo,
        valor: item.valor,
        confianza: Math.min(
          Math.max(Number(item.confianza ?? 0.85), 0),
          1
        ),
        texto_fuente: String(item.texto_fuente || "").slice(0, 100),
      }));

    return NextResponse.json(valid);
  } catch (err) {
    console.error("[extract] Error:", err);
    return NextResponse.json([]);
  }
}
