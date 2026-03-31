export interface Sugerencia {
  campo: string;
  valor: string | number | boolean;
  confianza: number;
  texto_fuente: string;
}

import { getAccessToken } from "./api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function extraerEntidades(
  texto: string,
  pasoActual: number
): Promise<Sugerencia[]> {
  if (!texto.trim()) return [];

  try {
    const token = getAccessToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/api/v1/voz/extraer`, {
      method: "POST",
      headers,
      body: JSON.stringify({ texto, paso_actual: pasoActual }),
    });
    if (!res.ok) return [];
    const parsed = await res.json();
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * v2: Continuous extraction for conversational session.
 * Extracts entities from recent client speech without requiring a specific step.
 * Supports auto-accept threshold and missing-fields-only extraction.
 */
export async function extraerEntidadesContinuo(
  texto: string,
  datosFaltantes: string[]
): Promise<Sugerencia[]> {
  if (!texto.trim() || datosFaltantes.length === 0) return [];

  try {
    const token = getAccessToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/api/v1/voz/extraer-continuo`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        texto,
        datos_faltantes: datosFaltantes,
      }),
    });

    if (!res.ok) {
      // Fallback: use the original endpoint with paso_actual=0 (all fields)
      return extraerEntidades(texto, 0);
    }

    const parsed = await res.json();
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return extraerEntidades(texto, 0);
  }
}

const COLLOQUIAL_MAP: Record<string, string> = {
  "lo que me queda al mes": "ahorro",
  "lo que ahorro": "ahorro",
  "lo que gasto en la casa": "gastos_basicos",
  "mis gastos": "gastos_basicos",
  "lo que pago de carro": "creditos",
  "mis créditos": "creditos",
  "lo que debo": "creditos",
  "lo que tengo en el banco": "liquidez",
  "en mi cuenta": "liquidez",
  "mi departamento que rento": "inmuebles_renta",
  "lo que me van a dar del seguro social": "ley_73",
  "mi pensión del imss": "ley_73",
  "me quiero retirar a los": "edad_retiro",
  "jubilarme a los": "edad_retiro",
  "necesito como": "mensualidad_deseada",
  "quiero recibir": "mensualidad_deseada",
  "gano": "ahorro",
  "mi sueldo": "ahorro",
  "mi afore": "afore",
  "tengo un seguro": "seguro_vida",
  "seguro de vida": "seguro_vida",
  "gastos médicos": "sgmm",
};

/**
 * Client-side colloquial expression mapper.
 * Attempts quick regex/keyword matching before hitting the API.
 */
export function mapearExpresionColoquial(texto: string): string | null {
  const lower = texto.toLowerCase().trim();
  for (const [expr, campo] of Object.entries(COLLOQUIAL_MAP)) {
    if (lower.includes(expr)) return campo;
  }
  return null;
}

/**
 * Determines if a field should be auto-accepted based on confidence.
 */
export function shouldAutoAccept(confianza: number): "auto" | "confirm" | "ignore" {
  if (confianza >= 0.85) return "auto";
  if (confianza >= 0.7) return "confirm";
  return "ignore";
}
