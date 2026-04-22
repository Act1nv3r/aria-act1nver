/**
 * CRM API client — typed wrappers for /api/v1/crm endpoints.
 * Mirrors the FastAPI CRM router (backend/app/api/v1/crm.py).
 */
import { apiFetch } from "./api-client";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface PerfilAcumulado {
  id: string;
  cliente_id: string;
  nombre: string | null;
  edad: number | null;
  genero: string | null;
  ocupacion: string | null;
  dependientes: boolean | null;
  email: string | null;
  telefono: string | null;
  whatsapp: string | null;
  empresa: string | null;
  cargo: string | null;
  ciudad: string | null;
  patrimonio_total: number | null;
  liquidez_total: number | null;
  ahorro_mensual: number | null;
  nivel_riqueza: string | null;
  grado_avance_retiro: number | null;
  tiene_seguro_vida: boolean | null;
  tiene_sgmm: boolean | null;
  tags: string[];
  notas_generales: string | null;
  salud_score: number;
  ultimo_diagnostico_id: string | null;
  ultima_actualizacion_diagnostico: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ActividadCliente {
  id: string;
  cliente_id: string;
  asesor_id: string;
  tipo: "llamada" | "email" | "whatsapp" | "presencial" | "diagnostico" | "nota" | "tarea_completada" | "oportunidad_descartada";
  titulo: string;
  descripcion: string | null;
  resultado: string | null;
  diagnostico_id: string | null;
  oportunidad_id: string | null;
  duracion_minutos: number | null;
  fecha_actividad: string | null;
  metadata_extra: Record<string, unknown> | null;
  created_at: string | null;
}

export interface OportunidadCliente {
  id: string;
  cliente_id: string;
  asesor_id: string;
  diagnostico_id: string | null;
  tipo: "oportunidad" | "seguimiento";
  categoria: string | null;
  prioridad: "alta" | "media" | "baja";
  fuente: "ai" | "datos" | "keyword" | "manual";
  titulo: string;
  descripcion: string | null;
  producto_sugerido: string | null;
  señal_detectada: string | null;
  contexto_seguimiento: string | null;
  accion_sugerida: string | null;
  confianza: number | null;
  estado_tarea: "pendiente" | "en_proceso" | "completada" | "descartada";
  justificacion_descarte: string | null;
  fecha_objetivo: string | null;
  fecha_inicio_proceso: string | null;
  fecha_completada: string | null;
  historial_estados: Array<{ estado: string; fecha: string; nota?: string }>;
  valor_estimado_mxn: number | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─────────────────────────────────────────────
// Perfil endpoints
// ─────────────────────────────────────────────

export function getPerfil(clienteId: string): Promise<PerfilAcumulado> {
  return apiFetch(`/api/v1/crm/clientes/${clienteId}/perfil`);
}

export function updatePerfil(
  clienteId: string,
  data: Partial<Pick<PerfilAcumulado, "email" | "telefono" | "whatsapp" | "empresa" | "cargo" | "ciudad" | "notas_generales" | "tags">>
): Promise<PerfilAcumulado> {
  return apiFetch(`/api/v1/crm/clientes/${clienteId}/perfil`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function syncPerfil(clienteId: string): Promise<PerfilAcumulado> {
  return apiFetch(`/api/v1/crm/clientes/${clienteId}/perfil/sync`, {
    method: "POST",
  });
}

// ─────────────────────────────────────────────
// Actividades endpoints
// ─────────────────────────────────────────────

export function getActividades(clienteId: string, limit = 50): Promise<ActividadCliente[]> {
  return apiFetch(`/api/v1/crm/clientes/${clienteId}/actividades?limit=${limit}`);
}

export function createActividad(
  clienteId: string,
  data: {
    tipo: ActividadCliente["tipo"];
    titulo: string;
    descripcion?: string;
    resultado?: string;
    diagnostico_id?: string;
    oportunidad_id?: string;
    duracion_minutos?: number;
    fecha_actividad?: string;
    metadata_extra?: Record<string, unknown>;
  }
): Promise<ActividadCliente> {
  return apiFetch(`/api/v1/crm/clientes/${clienteId}/actividades`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─────────────────────────────────────────────
// Oportunidades endpoints
// ─────────────────────────────────────────────

export function getOportunidades(clienteId: string, estado?: OportunidadCliente["estado_tarea"]): Promise<OportunidadCliente[]> {
  const qs = estado ? `?estado=${estado}` : "";
  return apiFetch(`/api/v1/crm/clientes/${clienteId}/oportunidades${qs}`);
}

export function createOportunidad(
  clienteId: string,
  data: Omit<OportunidadCliente, "id" | "cliente_id" | "asesor_id" | "estado_tarea" | "historial_estados" | "created_at" | "updated_at" | "fecha_inicio_proceso" | "fecha_completada">
): Promise<OportunidadCliente> {
  return apiFetch(`/api/v1/crm/clientes/${clienteId}/oportunidades`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateOportunidadEstado(
  clienteId: string,
  opId: string,
  data: {
    estado_tarea: OportunidadCliente["estado_tarea"];
    justificacion_descarte?: string;
    nota?: string;
  }
): Promise<OportunidadCliente> {
  return apiFetch(`/api/v1/crm/clientes/${clienteId}/oportunidades/${opId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function bulkCreateOportunidades(
  clienteId: string,
  oportunidades: Array<{
    tipo: OportunidadCliente["tipo"];
    categoria?: string;
    prioridad?: OportunidadCliente["prioridad"];
    fuente?: OportunidadCliente["fuente"];
    titulo: string;
    descripcion?: string;
    producto_sugerido?: string;
    señal_detectada?: string;
    contexto_seguimiento?: string;
    accion_sugerida?: string;
    confianza?: number;
  }>,
  diagnostico_id?: string
): Promise<{ created: number }> {
  const qs = diagnostico_id ? `?diagnostico_id=${diagnostico_id}` : "";
  return apiFetch(`/api/v1/crm/clientes/${clienteId}/oportunidades/bulk${qs}`, {
    method: "POST",
    body: JSON.stringify(oportunidades),
  });
}
