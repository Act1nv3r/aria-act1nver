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
