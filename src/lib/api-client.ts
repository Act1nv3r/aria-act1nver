const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let accessToken: string | null = null;

export function setAccessToken(token: string) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearAuth() {
  accessToken = null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (accessToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;
  }
  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    const onDeployedSite =
      typeof window !== "undefined" &&
      !["localhost", "127.0.0.1"].includes(window.location.hostname);
    const apiLooksLocal =
      API_URL.includes("localhost") || API_URL.includes("127.0.0.1");
    if (onDeployedSite && apiLooksLocal) {
      throw new Error(
        "El sitio no tiene configurada la API en producción. En Vercel: Project → Settings → Environment Variables → añade NEXT_PUBLIC_API_URL con la URL https de tu backend (no uses localhost). Luego redeploy."
      );
    }
    throw new Error("No se pudo conectar al servidor. Verifica tu conexión e intenta de nuevo.");
  }
  if (res.status === 401) {
    clearAuth();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<{ access_token: string; user: { id: string; nombre: string; email: string; rol: string } }>(
        "/api/v1/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }
      ),
  },
  clientes: {
    list: (search?: string) =>
      apiFetch<
        Array<{
          id: string;
          nombre_alias: string;
          activo: boolean;
          ultimo_diagnostico: {
            id: string;
            estado: string;
            paso_actual: number;
            modo: string;
            created_at: string | null;
          } | null;
        }>
      >(`/api/v1/clientes?search=${search || ""}`),
    create: (nombre_alias: string) =>
      apiFetch<{ id: string; nombre_alias: string; activo: boolean }>("/api/v1/clientes", {
        method: "POST",
        body: JSON.stringify({ nombre_alias }),
      }),
    get: (id: string) =>
      apiFetch<{ id: string; nombre_alias: string; activo: boolean }>(`/api/v1/clientes/${id}`),
    listDiagnosticos: (clienteId: string) =>
      apiFetch<
        Array<{
          id: string;
          cliente_id: string;
          estado: string;
          paso_actual: number;
          modo: string;
          created_at: string | null;
        }>
      >(`/api/v1/clientes/${clienteId}/diagnosticos`),
    delete: (id: string) =>
      apiFetch<void>(`/api/v1/clientes/${id}`, { method: "DELETE" }),
  },
  diagnosticos: {
    create: (cliente_id: string, modo?: string, referral_code?: string | null) =>
      apiFetch<{ id: string; cliente_id: string; estado: string; paso_actual: number }>(
        "/api/v1/diagnosticos",
        { method: "POST", body: JSON.stringify({ cliente_id, modo: modo || "individual", referral_code: referral_code || undefined }) }
      ),
    get: (id: string) =>
      apiFetch<Record<string, unknown>>(`/api/v1/diagnosticos/${id}`),
    delete: (id: string) =>
      apiFetch<void>(`/api/v1/diagnosticos/${id}`, { method: "DELETE" }),
    putPerfil: (id: string, data: Record<string, unknown>) =>
      apiFetch<{ data: unknown; outputs?: unknown; condicionales?: unknown }>(
        `/api/v1/diagnosticos/${id}/perfil`,
        { method: "PUT", body: JSON.stringify(data) }
      ),
    putFlujoMensual: (id: string, data: Record<string, unknown>) =>
      apiFetch<{ data: unknown; outputs?: unknown }>(
        `/api/v1/diagnosticos/${id}/flujo-mensual`,
        { method: "PUT", body: JSON.stringify(data) }
      ),
    putPatrimonio: (id: string, data: Record<string, unknown>) =>
      apiFetch<{ data: unknown; outputs?: unknown }>(
        `/api/v1/diagnosticos/${id}/patrimonio`,
        { method: "PUT", body: JSON.stringify(data) }
      ),
    putRetiro: (id: string, data: Record<string, unknown>) =>
      apiFetch<{ data: unknown; outputs?: unknown }>(
        `/api/v1/diagnosticos/${id}/retiro`,
        { method: "PUT", body: JSON.stringify(data) }
      ),
    putObjetivos: (id: string, data: Record<string, unknown>) =>
      apiFetch<{ data: unknown; outputs?: unknown }>(
        `/api/v1/diagnosticos/${id}/objetivos`,
        { method: "PUT", body: JSON.stringify(data) }
      ),
    compartir: (id: string) =>
      apiFetch<{ url: string; token: string; expires_at: string }>(`/api/v1/diagnosticos/${id}/compartir`, {
        method: "POST",
      }),
    putProteccion: (id: string, data: Record<string, unknown>) =>
      apiFetch<{ data: unknown; outputs?: unknown }>(
        `/api/v1/diagnosticos/${id}/proteccion`,
        { method: "PUT", body: JSON.stringify(data) }
      ),
    wrapped: (id: string) =>
      apiFetch<Array<{ tipo: string; imagen_url: string }>>(`/api/v1/diagnosticos/${id}/wrapped`, {
        method: "POST",
      }),
    wrappedShare: (id: string) =>
      apiFetch<{ referral_code: string; referral_url: string }>(`/api/v1/diagnosticos/${id}/wrapped/share`, {
        method: "POST",
      }),
  },
  admin: {
    referrals: () =>
      apiFetch<{ referrals: Array<{ id: string; referral_code: string; diagnostico_id: string; asesor: string; clicks: number; conversiones: number; tasa_conversion: number; created_at: string | null }> }>(
        "/api/v1/admin/referrals"
      ),
  },
};
