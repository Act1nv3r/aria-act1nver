/**
 * product-index.ts
 * ---------------------------------------------------------------------------
 * Módulo singleton para leer /Products/index.json.
 * Cachea el índice en memoria por 5 minutos y lo recarga si el archivo cambia.
 * ---------------------------------------------------------------------------
 */

import fs from "fs";
import path from "path";

export interface ProductEntry {
  id: string;
  nombre: string;
  categoria: string;
  subcategoria?: string;
  descripcion: string;
  beneficios_clave: string[];
  perfil_ideal: string;
  triggers_de_venta: string[];
  cuando_no_proponer: string;
  monto_minimo?: number | null;
  producto_sugerido_texto: string;
  fuente: string;
  hash: string;
  updated_at: string;
}

export interface ProductIndex {
  version: string;
  updated_at: string;
  total: number;
  products: ProductEntry[];
}

const INDEX_PATH = path.resolve(process.cwd(), "Products/index.json");
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let _cache: ProductIndex | null = null;
let _cacheTime = 0;
let _cacheHash = "";

function readIndexFromDisk(): ProductIndex | null {
  if (!fs.existsSync(INDEX_PATH)) return null;
  try {
    const raw = fs.readFileSync(INDEX_PATH, "utf-8");
    return JSON.parse(raw) as ProductIndex;
  } catch {
    return null;
  }
}

function fileModTime(): number {
  try {
    return fs.statSync(INDEX_PATH).mtimeMs;
  } catch {
    return 0;
  }
}

/**
 * Returns the product index, using an in-memory cache.
 * Reloads from disk if the file was modified or cache is stale.
 */
export function getProductIndex(): ProductIndex | null {
  const mtime = fileModTime();
  const now = Date.now();
  const stale = now - _cacheTime > CACHE_TTL_MS;
  const changed = String(mtime) !== _cacheHash;

  if (_cache && !stale && !changed) return _cache;

  const index = readIndexFromDisk();
  if (index) {
    _cache = index;
    _cacheTime = now;
    _cacheHash = String(mtime);
  }
  return index;
}

/**
 * Invalidates the in-memory cache (call after rebuilding the index).
 */
export function invalidateProductIndexCache() {
  _cache = null;
  _cacheTime = 0;
  _cacheHash = "";
}

/**
 * Builds a compact text summary of the product catalog for injection into prompts.
 * Keeps token usage low (~80-120 tokens per product).
 */
export function buildProductCatalogPrompt(index: ProductIndex): string {
  const lines: string[] = [
    `CATÁLOGO DE PRODUCTOS ACTINVER (${index.products.length} productos disponibles):`,
    "",
  ];

  for (const p of index.products) {
    lines.push(`## ${p.nombre} [${p.categoria}]`);
    lines.push(`Descripción: ${p.descripcion}`);
    lines.push(`Perfil ideal: ${p.perfil_ideal}`);
    lines.push(`Cuándo proponer:`);
    for (const t of p.triggers_de_venta) {
      lines.push(`  - ${t}`);
    }
    lines.push(`Beneficios: ${p.beneficios_clave.join(" · ")}`);
    lines.push(`Nombre a usar: "${p.producto_sugerido_texto}"`);
    lines.push("");
  }

  return lines.join("\n");
}
