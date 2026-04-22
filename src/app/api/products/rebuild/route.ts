/**
 * POST /api/products/rebuild
 * ---------------------------------------------------------------------------
 * Regenera /Products/index.json procesando los PDFs de la carpeta Products/.
 * Solo re-procesa archivos nuevos o modificados (compara SHA-256).
 *
 * Protegido con header: x-rebuild-secret (env: PRODUCTS_REBUILD_SECRET)
 * Si no hay secret configurado, solo funciona en desarrollo.
 *
 * Body (opcional): { force: true }  → fuerza re-proceso de todos los archivos
 * ---------------------------------------------------------------------------
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { invalidateProductIndexCache, type ProductIndex, type ProductEntry } from "@/lib/product-index";

// pdf-parse v1.1.1: use internal path to avoid test-file-on-import issue in Next.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse") as (buf: Buffer, opts?: { max?: number }) => Promise<{ text: string }>;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const REBUILD_SECRET = process.env.PRODUCTS_REBUILD_SECRET || "";
const PRODUCTS_DIR = path.resolve(process.cwd(), "Products");
const INDEX_PATH = path.join(PRODUCTS_DIR, "index.json");

const SKIP_FILES = new Set(["PLD_Formato_492.pdf", "index.json"]);
const PDF_EXT = ".pdf";

function fileHash(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
}

async function extractPdfText(filePath: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer, { max: 30 });
  return data.text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{3,}/g, " ")
    .trim()
    .slice(0, 20000);
}

async function buildEntry(
  filePath: string,
  rawText: string
): Promise<Omit<ProductEntry, "hash" | "fuente" | "updated_at">> {
  const fileName = path.basename(filePath);

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
      system: `Eres un experto en productos financieros y seguros de Actinver México.
Analiza el documento y extrae una ficha estructurada. Responde SOLO con JSON válido, sin markdown.`,
      messages: [
        {
          role: "user",
          content: `Archivo: "${fileName}"\n\nContenido:\n${rawText}\n\nGenera este JSON exacto:\n{"id":"slug-kebab","nombre":"Nombre oficial","categoria":"proteccion|ahorro|retiro|inversion|credito|patrimonio|seguro|otro","subcategoria":"tipo específico","descripcion":"2-3 oraciones","beneficios_clave":["b1","b2","b3","b4"],"perfil_ideal":"cliente ideal concreto con edad/perfil/situación","triggers_de_venta":["situación 1","situación 2","situación 3","situación 4"],"cuando_no_proponer":"cuándo NO ofrecerlo","monto_minimo":null,"producto_sugerido_texto":"nombre exacto para recomendar al asesor"}`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);

  const data = await res.json();
  const content = (data?.content?.[0]?.text || "").trim();
  const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  // Auth check
  const secret = req.headers.get("x-rebuild-secret") || "";
  const isDev = process.env.NODE_ENV === "development";

  if (REBUILD_SECRET && secret !== REBUILD_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!REBUILD_SECRET && !isDev) {
    return NextResponse.json(
      { error: "PRODUCTS_REBUILD_SECRET not configured" },
      { status: 500 }
    );
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as { force?: boolean };
  const force = body.force === true;

  // Load existing index
  let existingProducts: ProductEntry[] = [];
  if (fs.existsSync(INDEX_PATH)) {
    try {
      const existing = JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8")) as ProductIndex;
      existingProducts = existing.products ?? [];
    } catch { /* ignore */ }
  }
  const existingByFile = Object.fromEntries(existingProducts.map((p) => [p.fuente, p]));

  // Scan PDFs
  const pdfFiles = fs
    .readdirSync(PRODUCTS_DIR)
    .filter((f) => path.extname(f).toLowerCase() === PDF_EXT && !SKIP_FILES.has(f));

  const results: { file: string; status: "processed" | "skipped" | "error"; name?: string; error?: string }[] = [];
  const updatedProducts: ProductEntry[] = [];

  for (const fileName of pdfFiles) {
    const filePath = path.join(PRODUCTS_DIR, fileName);
    const hash = fileHash(filePath);
    const existing = existingByFile[fileName];

    if (!force && existing && existing.hash === hash) {
      updatedProducts.push(existing);
      results.push({ file: fileName, status: "skipped" });
      continue;
    }

    try {
      const rawText = await extractPdfText(filePath);
      const entry = await buildEntry(filePath, rawText);
      const full: ProductEntry = {
        ...entry,
        fuente: fileName,
        hash,
        updated_at: new Date().toISOString(),
      };
      updatedProducts.push(full);
      results.push({ file: fileName, status: "processed", name: full.nombre });
    } catch (err) {
      if (existing) updatedProducts.push(existing);
      results.push({ file: fileName, status: "error", error: String(err) });
    }

    // Rate limit buffer
    await new Promise((r) => setTimeout(r, 400));
  }

  const index: ProductIndex = {
    version: "1.0",
    updated_at: new Date().toISOString(),
    total: updatedProducts.length,
    products: updatedProducts,
  };

  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), "utf-8");
  invalidateProductIndexCache();

  return NextResponse.json({
    ok: true,
    total: updatedProducts.length,
    processed: results.filter((r) => r.status === "processed").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    results,
  });
}
