/**
 * build-product-index.ts
 * ---------------------------------------------------------------------------
 * Procesa los PDFs en /Products/ y genera /Products/index.json con fichas
 * estructuradas de cada producto. Usa hashes para re-procesar solo archivos
 * nuevos o modificados (incremental).
 *
 * Uso:
 *   npm run build:products
 *   npm run build:products -- --force   (fuerza re-proceso de todos)
 * ---------------------------------------------------------------------------
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
// pdf-parse v1.1.1: use internal path to avoid test-file-on-import issue
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse") as (buf: Buffer, opts?: { max?: number }) => Promise<{ text: string }>;

// ── Config ─────────────────────────────────────────────────────────────────

const PRODUCTS_DIR = path.resolve(__dirname, "../Products");
const INDEX_PATH = path.join(PRODUCTS_DIR, "index.json");
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const FORCE = process.argv.includes("--force");

// PDF files to skip (compliance/regulatory forms, not product docs)
const SKIP_FILES = new Set(["PLD_Formato_492.pdf"]);
// Non-PDF files handled separately
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// ── Types ───────────────────────────────────────────────────────────────────

interface ProductEntry {
  id: string;
  nombre: string;
  categoria: "proteccion" | "ahorro" | "retiro" | "inversion" | "credito" | "patrimonio" | "seguro" | "otro";
  subcategoria?: string;
  descripcion: string;
  beneficios_clave: string[];
  perfil_ideal: string;
  triggers_de_venta: string[];
  cuando_no_proponer: string;
  monto_minimo?: number;
  producto_sugerido_texto: string; // exact name to use in oportunidades
  fuente: string;
  hash: string;
  updated_at: string;
}

interface ProductIndex {
  version: string;
  updated_at: string;
  total: number;
  products: ProductEntry[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fileHash(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

async function extractPdfText(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer, { max: 30 }); // max 30 pages
  // Clean up whitespace noise
  return data.text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{3,}/g, " ")
    .trim()
    .slice(0, 20000); // ~5000 tokens max
}

async function buildProductEntry(
  filePath: string,
  rawText: string
): Promise<Omit<ProductEntry, "hash" | "fuente" | "updated_at">> {
  const fileName = path.basename(filePath);

  const systemPrompt = `Eres un experto en productos financieros y seguros de Actinver México.
Analiza el documento de producto y extrae una ficha estructurada en JSON.
Responde SOLO con JSON válido, sin markdown ni texto extra.`;

  const userPrompt = `Archivo: "${fileName}"

Contenido del documento:
${rawText}

Genera una ficha JSON con EXACTAMENTE estos campos:
{
  "id": "slug-kebab-case del nombre del producto",
  "nombre": "Nombre completo y oficial del producto",
  "categoria": "proteccion|ahorro|retiro|inversion|credito|patrimonio|seguro|otro",
  "subcategoria": "descripción breve del tipo (ej: 'seguro de vida', 'fondo de inversión')",
  "descripcion": "Descripción clara en 2-3 oraciones de qué es el producto y para qué sirve",
  "beneficios_clave": ["beneficio 1", "beneficio 2", "beneficio 3", "beneficio 4"],
  "perfil_ideal": "Descripción del cliente ideal: edad, perfil económico, situación familiar, necesidades",
  "triggers_de_venta": [
    "Situación o frase del cliente que indica que necesita este producto",
    "...",
    "..."
  ],
  "cuando_no_proponer": "Situaciones donde NO es apropiado ofrecer este producto",
  "monto_minimo": null o número en pesos MXN si aplica,
  "producto_sugerido_texto": "Nombre exacto a usar al recomendar este producto al asesor"
}

REGLAS:
- triggers_de_venta debe ser lista de 3-6 situaciones MUY específicas y accionables
- perfil_ideal debe ser concreto (ej: "Empresario 35-55 años con activos >2M y dependientes económicos")
- producto_sugerido_texto es el nombre que el asesor usaría al hablar con el cliente
- Si el documento contiene múltiples productos, elige el principal o más importante`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const content = (data?.content?.[0]?.text || "").trim();
  const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(cleaned);

  return parsed;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!ANTHROPIC_API_KEY) {
    console.error("❌  ANTHROPIC_API_KEY not set");
    process.exit(1);
  }

  // Load existing index
  let existingIndex: ProductIndex | null = null;
  if (fs.existsSync(INDEX_PATH)) {
    try {
      existingIndex = JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8")) as ProductIndex;
      console.log(`📦  Índice existente: ${existingIndex.total} productos`);
    } catch {
      console.warn("⚠️  No se pudo leer index.json existente, regenerando...");
    }
  }

  const existingByFile = Object.fromEntries(
    (existingIndex?.products ?? []).map((p) => [p.fuente, p])
  );

  // Scan products folder
  const allFiles = fs.readdirSync(PRODUCTS_DIR).filter((f) => f !== "index.json");
  const pdfFiles = allFiles.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ext === ".pdf" && !SKIP_FILES.has(f);
  });
  const imageFiles = allFiles.filter((f) =>
    IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase())
  );

  console.log(`\n📁  Archivos encontrados: ${pdfFiles.length} PDFs, ${imageFiles.length} imágenes`);
  if (imageFiles.length > 0) {
    console.log(`   ℹ️  Imágenes omitidas (agregar soporte OCR si se necesita): ${imageFiles.join(", ")}`);
  }

  const updatedProducts: ProductEntry[] = [];
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const fileName of pdfFiles) {
    const filePath = path.join(PRODUCTS_DIR, fileName);
    const hash = fileHash(filePath);
    const existing = existingByFile[fileName];

    if (!FORCE && existing && existing.hash === hash) {
      console.log(`  ✅  Sin cambios: ${fileName}`);
      updatedProducts.push(existing);
      skipped++;
      continue;
    }

    console.log(`  🔄  Procesando: ${fileName}...`);

    try {
      const rawText = await extractPdfText(filePath);
      const entry = await buildProductEntry(filePath, rawText);

      updatedProducts.push({
        ...entry,
        id: entry.id || slugify(path.basename(fileName, ".pdf")),
        fuente: fileName,
        hash,
        updated_at: new Date().toISOString(),
      });

      processed++;
      console.log(`  ✅  Procesado: ${entry.nombre} (${entry.categoria})`);
    } catch (err) {
      console.error(`  ❌  Error procesando ${fileName}:`, err);
      // Keep existing entry if available to avoid losing data
      if (existing) {
        updatedProducts.push(existing);
        console.log(`     ↩️  Manteniendo versión anterior`);
      }
      errors++;
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500));
  }

  // Build final index
  const index: ProductIndex = {
    version: "1.0",
    updated_at: new Date().toISOString(),
    total: updatedProducts.length,
    products: updatedProducts,
  };

  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), "utf-8");

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Índice actualizado: ${INDEX_PATH}
   Productos: ${updatedProducts.length}
   Procesados: ${processed}
   Sin cambios: ${skipped}
   Errores: ${errors}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch((err) => {
  console.error("❌  Fatal:", err);
  process.exit(1);
});
