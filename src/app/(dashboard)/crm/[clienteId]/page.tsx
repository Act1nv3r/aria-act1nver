"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Clock,
  Lightbulb,
  FileText,
  Phone,
  MessageSquare,
  Check,
  ChevronRight,
  ChevronDown,
  Trash2,
  CalendarClock,
  CirclePlay,
  CircleCheck,
  CircleX,
  AlertCircle,
  Shield,
  PiggyBank,
  Target,
  CreditCard,
  TrendingUp,
  Receipt,
  Building2,
  Heart,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api-client";
import {
  getPerfil,
  getActividades,
  updatePerfil as apiUpdatePerfil,
  syncPerfil,
  getOportunidades,
  updateOportunidadEstado,
  type PerfilAcumulado,
  type ActividadCliente as ActividadAPI,
  type OportunidadCliente,
} from "@/lib/crm-api";
import { useCRMStore, type CRMTask } from "@/stores/crm-store";
import { useDiagnosticoStore, type SessionInsight, type SavedSimulation, type SavedDocument } from "@/stores/diagnostico-store"; // eslint-disable-line @typescript-eslint/no-unused-vars
import { formatMXN } from "@/lib/format-currency";
import { generarBalancePDF, generarDiagnosticoPDF } from "@/lib/pdf-generator";
import { getAccessToken } from "@/lib/api-client";

type Tab = "resumen" | "perfil" | "historial" | "oportunidades" | "simulaciones" | "documentos";

interface DiagnosticoRow {
  id: string;
  estado: string;
  paso_actual: number;
  modo: string;
  created_at: string | null;
}

export default function Client360Page() {
  const params = useParams();
  const router = useRouter();
  const clienteId = params.clienteId as string;
  const [tab, setTab] = useState<Tab>("resumen");
  const [cliente, setCliente] = useState<{ id: string; nombre_alias: string } | null>(null);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [diagToDelete, setDiagToDelete] = useState<DiagnosticoRow | null>(null);
  const [perfil, setPerfil] = useState<PerfilAcumulado | null>(null);
  const [actividades, setActividades] = useState<ActividadAPI[]>([]);
  const [oportunidadesAPI, setOportunidadesAPI] = useState<OportunidadCliente[]>([]);
  const [editingPerfil, setEditingPerfil] = useState(false);
  const [perfilDraft, setPerfilDraft] = useState<Partial<PerfilAcumulado>>({});
  const [savingPerfil, setSavingPerfil] = useState(false);
  const [discardAPITarget, setDiscardAPITarget] = useState<OportunidadCliente | null>(null);
  const [justificacionAPI, setJustificacionAPI] = useState("");

  const tasks = useCRMStore((s) => s.tasks).filter((t) => t.cliente_id === clienteId);
  const completeTask = useCRMStore((s) => s.completeTask);
  const addContactLog = useCRMStore((s) => s.addContactLog);
  const sessionInsights = useDiagnosticoStore((s) => s.sesion_insights);
  const updateInsightEstado = useDiagnosticoStore((s) => s.updateInsightEstado);
  const simulaciones = useDiagnosticoStore((s) => s.simulaciones_guardadas);
  const removeSimulacion = useDiagnosticoStore((s) => s.removeSimulacion);
  const documentos = useDiagnosticoStore((s) => s.documentos_guardados);
  const removeDocumento = useDiagnosticoStore((s) => s.removeDocumento);
  // Persistent snapshot saved when "Generar Balance" was clicked — survives session resets
  const clienteSnapshot = useDiagnosticoStore((s) => s.perfiles_completados[clienteId] ?? null);
  const actualizarEstadoOportunidadSnapshot = useDiagnosticoStore((s) => s.actualizarEstadoOportunidadSnapshot);
  const saludScore = useDiagnosticoStore((s) => s.salud_scores[clienteId] ?? 0);

  // Discard justification modal state
  const [discardTarget, setDiscardTarget] = useState<SessionInsight | null>(null);
  const [justificacion, setJustificacion] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [c, diags] = await Promise.all([
        api.clientes.get(clienteId),
        api.clientes.listDiagnosticos(clienteId),
      ]);
      setCliente(c);
      setDiagnosticos(diags);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
    // Load CRM data in parallel (non-blocking)
    try {
      const [p, acts, ops] = await Promise.all([
        getPerfil(clienteId),
        getActividades(clienteId, 50),
        getOportunidades(clienteId),
      ]);
      setPerfil(p);
      setActividades(acts);
      setOportunidadesAPI(ops);
    } catch {
      // Backend CRM data unavailable — continue with local state only
    }
    // Silently re-sync the accumulated profile to get the latest diagnostic data
    syncPerfil(clienteId)
      .then((updated) => { if (updated) setPerfil(updated); })
      .catch(() => null);
  }, [clienteId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNewSession = async () => {
    try {
      const d = await api.diagnosticos.create(clienteId, "individual");
      router.push(`/diagnosticos/${d.id}/sesion?clienteId=${clienteId}`);
    } catch {
      // handle error
    }
  };

  const handleLogContact = (tipo: "llamada" | "email" | "whatsapp") => {
    addContactLog({
      cliente_id: clienteId,
      tipo,
      notas: `Contacto registrado desde CRM`,
    });
  };

  const handleDeleteDiagnostico = async () => {
    if (!diagToDelete) return;
    try {
      await api.diagnosticos.delete(diagToDelete.id);
    } catch {
      // API may fail; remove from local state anyway
    }
    setDiagnosticos((prev) => prev.filter((d) => d.id !== diagToDelete.id));
    setDiagToDelete(null);
  };

  const handleOportunidadEstado = async (
    opId: string,
    estado: OportunidadCliente["estado_tarea"],
    justif?: string
  ) => {
    try {
      const updated = await updateOportunidadEstado(clienteId, opId, {
        estado_tarea: estado,
        justificacion_descarte: justif,
      });
      setOportunidadesAPI((prev) => prev.map((o) => (o.id === opId ? updated : o)));
    } catch {
      // ignore — state update is best-effort
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-[#1A3154] rounded animate-pulse" />
          <div className="h-4 w-32 bg-[#1A3154] rounded animate-pulse" />
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[#0C1829] rounded-[16px] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const nombre = cliente?.nombre_alias || "Cliente";
  const nombreInitials = nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const lastDiag = diagnosticos[0];

  // Build a local fallback profile from the persistent snapshot saved when balance was generated
  const localPerfil: PerfilAcumulado | null =
    !perfil && clienteSnapshot
      ? {
          id: "local",
          cliente_id: clienteId,
          nombre: clienteSnapshot.perfil?.nombre || cliente?.nombre_alias || "Cliente",
          edad: clienteSnapshot.perfil.edad || null,
          genero: clienteSnapshot.perfil.genero || null,
          ocupacion: clienteSnapshot.perfil.ocupacion || null,
          dependientes: clienteSnapshot.perfil.dependientes,
          email: null,
          telefono: null,
          whatsapp: null,
          empresa: null,
          cargo: null,
          ciudad: null,
          patrimonio_total: clienteSnapshot.patrimonio
            ? (clienteSnapshot.patrimonio.liquidez ?? 0) + (clienteSnapshot.patrimonio.inversiones ?? 0) +
              (clienteSnapshot.patrimonio.dotales ?? 0) + (clienteSnapshot.patrimonio.casa ?? 0) +
              (clienteSnapshot.patrimonio.negocio ?? 0)
            : null,
          liquidez_total: clienteSnapshot.patrimonio?.liquidez ?? null,
          ahorro_mensual: clienteSnapshot.flujoMensual?.ahorro ?? null,
          nivel_riqueza: null,
          grado_avance_retiro: null,
          tiene_seguro_vida: clienteSnapshot.proteccion?.seguro_vida ?? null,
          tiene_sgmm: clienteSnapshot.proteccion?.sgmm ?? null,
          tags: [],
          notas_generales: null,
          salud_score: saludScore || 30,
          ultimo_diagnostico_id: clienteSnapshot.diagnostico_id ?? lastDiag?.id ?? null,
          ultima_actualizacion_diagnostico: new Date(clienteSnapshot.completed_at).toISOString(),
          created_at: null,
          updated_at: null,
        }
      : null;

  // Use backend profile when available, fall back to local store data
  const perfilToShow = perfil ?? localPerfil;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "resumen", label: "Resumen", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "perfil", label: "Perfil", icon: <UserPlus className="w-3.5 h-3.5" /> },
    { id: "historial", label: "Historial", icon: <Clock className="w-3.5 h-3.5" /> },
    { id: "oportunidades", label: "Oportunidades", icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { id: "simulaciones", label: "Simulaciones", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "documentos", label: "Documentos", icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/crm" className="text-[#8B9BB4] hover:text-[#F0F4FA] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-12 h-12 rounded-full bg-[#1A3154] border border-[#C9A84C]/20 flex items-center justify-center">
          <span className="text-[#C9A84C] font-bold">{nombreInitials}</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#F0F4FA]">{nombre}</h1>
          <p className="text-sm text-[#8B9BB4]">
            {diagnosticos.length} diagnóstico{diagnosticos.length !== 1 ? "s" : ""}{" "}
            {lastDiag?.created_at &&
              `· Último: ${new Date(lastDiag.created_at).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`}
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleLogContact("llamada")}>
            <Phone className="w-3.5 h-3.5" /> Llamar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleLogContact("whatsapp")}>
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
          </Button>
          <Button variant="accent" size="sm" onClick={handleNewSession}>
            <UserPlus className="w-3.5 h-3.5" /> Nueva sesión
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/[0.06] pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-xs font-medium transition-all
              ${tab === t.id
                ? "bg-[#1A3154] text-[#F0F4FA] border-b-2 border-[#C9A84C]"
                : "text-[#8B9BB4] hover:text-[#F0F4FA] hover:bg-[#1A3154]/30"
              }
            `}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "resumen" && (
        <div className="space-y-4">
          {/* Key metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#0C1829] border border-white/[0.06] rounded-[14px] p-4">
              <p className="text-xs text-[#8B9BB4]">Estado</p>
              <p className="text-lg font-bold text-[#F0F4FA] mt-1">
                {lastDiag?.estado === "completo" ? "Activo" : lastDiag ? "En progreso" : "Nuevo"}
              </p>
            </div>
            <div className="bg-[#0C1829] border border-white/[0.06] rounded-[14px] p-4">
              <p className="text-xs text-[#8B9BB4]">Diagnósticos</p>
              <p className="text-lg font-bold text-[#C9A84C] mt-1">{diagnosticos.length}</p>
            </div>
            <div className="bg-[#0C1829] border border-white/[0.06] rounded-[14px] p-4">
              <p className="text-xs text-[#8B9BB4]">Salud del perfil</p>
              <p className={`text-lg font-bold mt-1 ${perfilToShow ? (perfilToShow.salud_score >= 70 ? "text-[#10B981]" : perfilToShow.salud_score >= 40 ? "text-[#C9A84C]" : "text-[#EF4444]") : "text-[#5A6A85]"}`}>
                {perfilToShow ? `${perfilToShow.salud_score}/100` : "—"}
              </p>
            </div>
          </div>

          {/* Pending tasks */}
          {tasks.filter((t) => t.estado === "pendiente").length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[#F0F4FA] mb-2">Tareas pendientes</h3>
              {tasks
                .filter((t) => t.estado === "pendiente")
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 bg-[#0C1829] border border-white/[0.06] rounded-[12px] p-3 mb-2"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-[#F0F4FA]">{task.titulo}</p>
                      {task.sugerencia_accion && (
                        <p className="text-xs text-[#C9A84C] mt-0.5">{task.sugerencia_accion}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => completeTask(task.id)}
                      className="text-[#10B981]"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
            </div>
          )}

          {/* Quick actions */}
          <div className="flex gap-3">
            {lastDiag && (
              <>
                <Link href={`/diagnosticos/${lastDiag.id}/completado`}>
                  <Button variant="secondary" size="sm">
                    Ver resultados
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
                <Link href={`/diagnosticos/${lastDiag.id}/simulador`}>
                  <Button variant="ghost" size="sm">Simulador</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "perfil" && (
        <div className="space-y-4">
          {/* Health score */}
          {perfilToShow && (
            <div className="bg-[#0C1829] border border-white/[0.06] rounded-[14px] p-4 flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#1A3154" strokeWidth="6" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke={perfilToShow.salud_score >= 70 ? "#10B981" : perfilToShow.salud_score >= 40 ? "#C9A84C" : "#EF4444"} strokeWidth="6"
                    strokeDasharray={`${(perfilToShow.salud_score / 100) * 175.9} 175.9`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#F0F4FA]">{perfilToShow.salud_score}</span>
              </div>
              <div>
                <p className="text-xs text-[#8B9BB4]">Salud del perfil</p>
                <p className="text-base font-bold text-[#F0F4FA]">
                  {perfilToShow.salud_score >= 70 ? "Perfil completo" : perfilToShow.salud_score >= 40 ? "Perfil parcial" : "Perfil básico"}
                </p>
                <p className="text-[11px] text-[#5A6A85] mt-0.5">
                  {perfilToShow.ultima_actualizacion_diagnostico
                    ? `Sincronizado ${new Date(perfilToShow.ultima_actualizacion_diagnostico).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}`
                    : clienteSnapshot ? `Sesión del ${new Date(clienteSnapshot.completed_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}` : "Sin diagnóstico completado"}
                </p>
              </div>
              <div className="flex-1" />
              {perfil && (
                <button
                  type="button"
                  onClick={() => { setEditingPerfil(true); setPerfilDraft({ email: perfil.email ?? "", telefono: perfil.telefono ?? "", whatsapp: perfil.whatsapp ?? "", empresa: perfil.empresa ?? "", cargo: perfil.cargo ?? "", ciudad: perfil.ciudad ?? "", notas_generales: perfil.notas_generales ?? "" }); }}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-[#1A3154] text-[#8B9BB4] hover:text-[#F0F4FA] transition-colors"
                >
                  Editar contacto
                </button>
              )}
            </div>
          )}

          {/* Demographics (read-only, from diagnostic) */}
          {perfilToShow?.nombre && (
            <div className="bg-[#0C1829] border border-white/[0.06] rounded-[14px] p-4">
              <p className="text-xs font-semibold text-[#5A6A85] uppercase tracking-wider mb-3">Datos demográficos</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Nombre", value: perfilToShow.nombre },
                  { label: "Edad", value: perfilToShow.edad ? `${perfilToShow.edad} años` : null },
                  { label: "Género", value: perfilToShow.genero === "H" ? "Hombre" : perfilToShow.genero === "M" ? "Mujer" : perfilToShow.genero },
                  { label: "Ocupación", value: perfilToShow.ocupacion },
                  { label: "Dependientes", value: perfilToShow.dependientes != null ? (perfilToShow.dependientes ? "Sí" : "No") : null },
                  { label: "Ciudad", value: perfilToShow.ciudad },
                ].filter(f => f.value).map(f => (
                  <div key={f.label}>
                    <p className="text-[10px] text-[#5A6A85]">{f.label}</p>
                    <p className="text-sm text-[#F0F4FA] font-medium mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial summary */}
          {perfilToShow && (perfilToShow.patrimonio_total || perfilToShow.ahorro_mensual) && (
            <div className="bg-[#0C1829] border border-white/[0.06] rounded-[14px] p-4">
              <p className="text-xs font-semibold text-[#5A6A85] uppercase tracking-wider mb-3">Resumen financiero</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {perfilToShow.patrimonio_total != null && (
                  <div>
                    <p className="text-[10px] text-[#5A6A85]">Patrimonio total</p>
                    <p className="text-sm text-[#C9A84C] font-bold mt-0.5">{formatMXN(perfilToShow.patrimonio_total)}</p>
                  </div>
                )}
                {perfilToShow.liquidez_total != null && (
                  <div>
                    <p className="text-[10px] text-[#5A6A85]">Liquidez</p>
                    <p className="text-sm text-[#F0F4FA] font-medium mt-0.5">{formatMXN(perfilToShow.liquidez_total)}</p>
                  </div>
                )}
                {perfilToShow.ahorro_mensual != null && (
                  <div>
                    <p className="text-[10px] text-[#5A6A85]">Ahorro mensual</p>
                    <p className="text-sm text-[#10B981] font-medium mt-0.5">{formatMXN(perfilToShow.ahorro_mensual)}</p>
                  </div>
                )}
                {perfilToShow.tiene_seguro_vida != null && (
                  <div>
                    <p className="text-[10px] text-[#5A6A85]">Seguro de vida</p>
                    <p className={`text-sm font-medium mt-0.5 ${perfilToShow.tiene_seguro_vida ? "text-[#10B981]" : "text-[#EF4444]"}`}>{perfilToShow.tiene_seguro_vida ? "Sí" : "No"}</p>
                  </div>
                )}
                {perfilToShow.tiene_sgmm != null && (
                  <div>
                    <p className="text-[10px] text-[#5A6A85]">SGMM</p>
                    <p className={`text-sm font-medium mt-0.5 ${perfilToShow.tiene_sgmm ? "text-[#10B981]" : "text-[#EF4444]"}`}>{perfilToShow.tiene_sgmm ? "Sí" : "No"}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact info */}
          {perfilToShow && (
            <div className="bg-[#0C1829] border border-white/[0.06] rounded-[14px] p-4">
              <p className="text-xs font-semibold text-[#5A6A85] uppercase tracking-wider mb-3">Información de contacto</p>
              {!editingPerfil ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Email", value: perfilToShow.email },
                    { label: "Teléfono", value: perfilToShow.telefono },
                    { label: "WhatsApp", value: perfilToShow.whatsapp },
                    { label: "Empresa", value: perfilToShow.empresa },
                    { label: "Cargo", value: perfilToShow.cargo },
                    { label: "Ciudad", value: perfilToShow.ciudad },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-[10px] text-[#5A6A85]">{f.label}</p>
                      <p className="text-sm text-[#F0F4FA] mt-0.5">{f.value || <span className="text-[#3A4A62]">—</span>}</p>
                    </div>
                  ))}
                  {perfilToShow.notas_generales && (
                    <div className="col-span-2">
                      <p className="text-[10px] text-[#5A6A85]">Notas</p>
                      <p className="text-sm text-[#8B9BB4] mt-0.5">{perfilToShow.notas_generales}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(["email", "telefono", "whatsapp", "empresa", "cargo", "ciudad"] as const).map(field => (
                      <div key={field}>
                        <label className="text-[10px] text-[#5A6A85] capitalize">{field}</label>
                        <input
                          className="w-full mt-1 bg-[#0A1628] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-[#F0F4FA] focus:outline-none focus:border-[#C9A84C]/40"
                          value={(perfilDraft[field] as string) ?? ""}
                          onChange={(e) => setPerfilDraft(d => ({ ...d, [field]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-[10px] text-[#5A6A85]">Notas</label>
                    <textarea
                      className="w-full mt-1 bg-[#0A1628] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F0F4FA] focus:outline-none focus:border-[#C9A84C]/40 resize-none"
                      rows={3}
                      value={perfilDraft.notas_generales ?? ""}
                      onChange={(e) => setPerfilDraft(d => ({ ...d, notas_generales: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setEditingPerfil(false)}>Cancelar</Button>
                    <Button
                      variant="accent"
                      size="sm"
                      disabled={savingPerfil}
                      onClick={async () => {
                        setSavingPerfil(true);
                        try {
                          const updated = await apiUpdatePerfil(clienteId, perfilDraft);
                          setPerfil(updated);
                          setEditingPerfil(false);
                        } catch {
                          // silent
                        } finally {
                          setSavingPerfil(false);
                        }
                      }}
                    >
                      {savingPerfil ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!perfilToShow && (
            <div className="text-center py-12">
              <p className="text-sm text-[#8B9BB4]">Completa un diagnóstico para crear el perfil del cliente.</p>
            </div>
          )}
        </div>
      )}

      {tab === "historial" && (
        <div className="space-y-3">
          {/* Backend activity timeline */}
          {actividades.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-[#5A6A85] uppercase tracking-wider mb-3">Actividad reciente</p>
              <div className="space-y-2">
                {actividades.map((act) => {
                  const iconMap: Record<string, string> = { llamada: "📞", email: "✉️", whatsapp: "💬", presencial: "🤝", diagnostico: "📋", nota: "📝", tarea_completada: "✅", oportunidad_descartada: "🚫" };
                  return (
                    <div key={act.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-[#0A1628] border border-white/[0.04]">
                      <span className="text-base shrink-0 mt-0.5">{iconMap[act.tipo] ?? "•"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#F0F4FA] font-medium">{act.titulo}</p>
                        {act.descripcion && <p className="text-[11px] text-[#8B9BB4] mt-0.5 truncate">{act.descripcion}</p>}
                      </div>
                      <p className="text-[10px] text-[#5A6A85] shrink-0">
                        {act.fecha_actividad ? new Date(act.fecha_actividad).toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <p className="text-xs font-semibold text-[#5A6A85] uppercase tracking-wider mb-2">Diagnósticos</p>
          {diagnosticos.length === 0 ? (
            <p className="text-sm text-[#8B9BB4] text-center py-8">Sin historial</p>
          ) : (
            diagnosticos.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-4 bg-[#0C1829] border border-white/[0.06] rounded-[14px] p-4 hover:border-white/[0.1] transition-colors cursor-pointer group"
                onClick={() =>
                  router.push(
                    d.estado === "completo"
                      ? `/diagnosticos/${d.id}/completado`
                      : `/diagnosticos/${d.id}/paso/${d.paso_actual}`
                  )
                }
              >
                <div className="w-2 h-2 rounded-full bg-[#C9A84C]" />
                <div className="flex-1">
                  <p className="text-sm text-[#F0F4FA] font-medium">
                    Diagnóstico {d.modo}
                  </p>
                  <p className="text-xs text-[#8B9BB4]">
                    {d.created_at
                      ? new Date(d.created_at).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Sin fecha"}
                  </p>
                </div>
                <Badge variant={d.estado === "completo" ? "mejor" : "suficiente"}>
                  {d.estado === "completo" ? "Completo" : `Paso ${d.paso_actual}/6`}
                </Badge>
                <button
                  type="button"
                  title="Eliminar diagnóstico"
                  onClick={(e) => { e.stopPropagation(); setDiagToDelete(d); }}
                  className="p-1.5 rounded-lg text-[#5A6A85] opacity-0 group-hover:opacity-100 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-4 h-4 text-[#4A5A72]" />
              </div>
            ))
          )}
        </div>
      )}

      {tab === "oportunidades" && (() => {
        // ── Dedup oportunidadesAPI por título (misma op guardada en múltiples sesiones) ──
        const ESTADO_PRIORITY: Record<string, number> = { en_proceso: 0, pendiente: 1, completada: 2, descartada: 3 };
        const apiDeduped: OportunidadCliente[] = Object.values(
          oportunidadesAPI.reduce<Record<string, OportunidadCliente>>((acc, op) => {
            const key = op.titulo.trim().toLowerCase();
            const existing = acc[key];
            if (!existing) {
              acc[key] = op;
            } else {
              // Keep the one with the most actionable estado
              const existPri = ESTADO_PRIORITY[existing.estado_tarea] ?? 4;
              const newPri = ESTADO_PRIORITY[op.estado_tarea] ?? 4;
              if (newPri < existPri) acc[key] = op;
            }
            return acc;
          }, {})
        );
        const apiTitles = new Set(apiDeduped.map((o) => o.titulo.trim().toLowerCase()));

        // ── Fuentes de datos ────────────────────────────────────────────
        const snapshotOps = (clienteSnapshot?.oportunidades ?? []).filter(
          (o) => !apiTitles.has(o.titulo.trim().toLowerCase())
        );
        const snapshotTitles = new Set(snapshotOps.map((o) => o.titulo.trim().toLowerCase()));

        const localInsights = sessionInsights.filter((i) => {
          if (i.tipo !== "oportunidad" || i.clienteId !== clienteId) return false;
          const t = (i.texto.includes(":") ? i.texto.split(":")[0] : i.texto).trim().toLowerCase();
          return !apiTitles.has(t) && !snapshotTitles.has(t);
        });

        const totalCount = apiDeduped.length + snapshotOps.length + localInsights.length;

        // ── Helpers ─────────────────────────────────────────────────────
        const estadoBadge = (estado: string) => {
          if (estado === "completada") return { icon: <CircleCheck className="w-3 h-3" />, label: "Completada", cls: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20" };
          if (estado === "en_proceso") return { icon: <CirclePlay className="w-3 h-3" />, label: "En proceso", cls: "text-[#C9A84C] bg-[#C9A84C]/10 border-[#C9A84C]/20" };
          if (estado === "descartada") return { icon: <CircleX className="w-3 h-3" />, label: "Descartada", cls: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20" };
          return { icon: <AlertCircle className="w-3 h-3" />, label: "Pendiente", cls: "text-[#8B9BB4] bg-[#1A3154] border-white/[0.08]" };
        };

        const PRI_BADGE_CRM: Record<string, string> = {
          alta: "bg-red-500/20 text-red-300 border border-red-500/30",
          media: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
          baja: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
        };

        // ── Cluster config ───────────────────────────────────────────────
        type CRMCluster = {
          key: string;
          label: string;
          Icon: React.ElementType;
          border: string;
          bg: string;
          text: string;
          headerBg: string;
          isGancho?: boolean;
        };
        const CRM_CLUSTERS: CRMCluster[] = [
          { key: "gancho", label: "Conexión con el cliente", Icon: Heart, border: "border-[#C9A84C]/25", bg: "bg-[#C9A84C]/5", text: "text-[#C9A84C]", headerBg: "bg-gradient-to-r from-[#C9A84C]/15 to-[#C9A84C]/5", isGancho: true },
          { key: "proteccion", label: "Protección", Icon: Shield, border: "border-red-500/20", bg: "bg-red-500/5", text: "text-red-400", headerBg: "bg-red-500/10" },
          { key: "ahorro", label: "Ahorro", Icon: PiggyBank, border: "border-amber-500/20", bg: "bg-amber-500/5", text: "text-amber-400", headerBg: "bg-amber-500/10" },
          { key: "retiro", label: "Retiro", Icon: Target, border: "border-emerald-500/20", bg: "bg-emerald-500/5", text: "text-emerald-400", headerBg: "bg-emerald-500/10" },
          { key: "inversion", label: "Inversión", Icon: TrendingUp, border: "border-blue-500/20", bg: "bg-blue-500/5", text: "text-blue-400", headerBg: "bg-blue-500/10" },
          { key: "deuda", label: "Deuda", Icon: CreditCard, border: "border-orange-500/20", bg: "bg-orange-500/5", text: "text-orange-400", headerBg: "bg-orange-500/10" },
          { key: "fiscal", label: "Fiscal", Icon: Receipt, border: "border-purple-500/20", bg: "bg-purple-500/5", text: "text-purple-400", headerBg: "bg-purple-500/10" },
          { key: "patrimonio", label: "Patrimonio", Icon: Building2, border: "border-cyan-500/20", bg: "bg-cyan-500/5", text: "text-cyan-400", headerBg: "bg-cyan-500/10" },
          { key: "seguimiento", label: "Seguimiento", Icon: MessageCircle, border: "border-violet-500/20", bg: "bg-violet-500/5", text: "text-violet-400", headerBg: "bg-violet-500/10" },
        ];

        // Clasifica cada op en un cluster key
        const clusterKeyFor = (cat?: string, tipo?: string, tipoCRM?: string): string => {
          if (tipo === "gancho_conversacion") return "gancho";
          if (tipoCRM === "seguimiento") return "seguimiento";
          return cat ?? "seguimiento";
        };

        // Unifica todas las ops en un solo mapa de clusters
        type AnyOp =
          | { source: "api"; op: OportunidadCliente }
          | { source: "snapshot"; op: NonNullable<typeof clienteSnapshot>["oportunidades"][number] }
          | { source: "local"; op: typeof localInsights[number] };

        const clusterMap: Record<string, AnyOp[]> = {};
        const addToCluster = (key: string, item: AnyOp) => {
          if (!clusterMap[key]) clusterMap[key] = [];
          clusterMap[key].push(item);
        };

        for (const op of apiDeduped) {
          addToCluster(clusterKeyFor(op.categoria ?? undefined, undefined, op.tipo), { source: "api", op });
        }
        for (const op of snapshotOps) {
          addToCluster(clusterKeyFor(op.categoria ?? undefined, undefined, undefined), { source: "snapshot", op });
        }
        for (const ins of localInsights) {
          addToCluster("seguimiento", { source: "local", op: ins });
        }

        const activeClusters = CRM_CLUSTERS.filter((c) => (clusterMap[c.key]?.length ?? 0) > 0);

        // ── Estadísticas ────────────────────────────────────────────────
        const pendientes = apiDeduped.filter((o) => o.estado_tarea === "pendiente").length
          + localInsights.filter((i) => i.estado_tarea === "pendiente").length
          + snapshotOps.filter((o) => o.estado === "pendiente").length;
        const enProceso = apiDeduped.filter((o) => o.estado_tarea === "en_proceso").length
          + localInsights.filter((i) => i.estado_tarea === "en_proceso").length
          + snapshotOps.filter((o) => o.estado === "en_proceso").length;
        const completadas = apiDeduped.filter((o) => o.estado_tarea === "completada").length
          + localInsights.filter((i) => i.estado_tarea === "completada").length
          + snapshotOps.filter((o) => o.estado === "completada").length;

        if (totalCount === 0) {
          return (
            <div className="text-center py-12">
              <Lightbulb className="w-8 h-8 text-[#C9A84C]/30 mx-auto mb-3" />
              <p className="text-sm text-[#8B9BB4]">
                Las oportunidades se detectan automáticamente al generar el Balance Patrimonial.
              </p>
              <Button variant="accent" size="sm" className="mt-4" onClick={handleNewSession}>
                Iniciar nueva sesión
              </Button>
            </div>
          );
        }

        // ── Render de cada item dentro del cluster ───────────────────────
        const renderAnyOp = (item: AnyOp) => {
          if (item.source === "api") {
            const op = item.op;
            const badge = estadoBadge(op.estado_tarea);
            const isActionable = op.estado_tarea !== "completada" && op.estado_tarea !== "descartada";
            const isGancho = op.tipo === "seguimiento";
            return (
              <div key={op.id} className={`px-4 py-3 hover:bg-white/[0.02] transition-colors ${op.estado_tarea === "completada" ? "opacity-50" : ""}`}>
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-semibold leading-snug ${isGancho ? "text-[#E8C872]" : "text-[#F0F4FA]"}`}>{op.titulo}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${badge.cls}`}>
                        {badge.icon}{badge.label}
                      </span>
                      {op.prioridad && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${PRI_BADGE_CRM[op.prioridad] ?? PRI_BADGE_CRM.media}`}>
                          {op.prioridad.charAt(0).toUpperCase() + op.prioridad.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  {op.descripcion && <p className="text-[11px] text-[#8B9BB4] leading-relaxed line-clamp-2">{op.descripcion}</p>}
                  {op.señal_detectada && (
                    <p className="text-[10px] text-[#8B9BB4] italic">&ldquo;{op.señal_detectada}&rdquo;</p>
                  )}
                  {op.accion_sugerida && (
                    <p className="text-[10px] text-[#10B981] font-medium">→ {op.accion_sugerida}</p>
                  )}
                  {op.producto_sugerido && op.producto_sugerido !== "—" && (
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#1A3154] text-[#C9A84C] font-medium">
                      {op.producto_sugerido}
                    </span>
                  )}
                  {op.justificacion_descarte && (
                    <div className="rounded-lg bg-[#EF4444]/[0.05] border border-[#EF4444]/10 px-2.5 py-1.5">
                      <p className="text-[10px] text-[#EF4444]/80 font-medium">Motivo: {op.justificacion_descarte}</p>
                    </div>
                  )}
                  {isActionable && (
                    <div className="flex gap-1.5 pt-1.5 border-t border-white/[0.04] mt-1.5">
                      {op.estado_tarea === "pendiente" && (
                        <button type="button" onClick={() => void handleOportunidadEstado(op.id, "en_proceso")}
                          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-colors">
                          <CirclePlay className="w-3 h-3" /> Iniciar
                        </button>
                      )}
                      {op.estado_tarea === "en_proceso" && (
                        <button type="button" onClick={() => void handleOportunidadEstado(op.id, "pendiente")}
                          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#1A3154] text-[#8B9BB4] hover:bg-[#1A3154]/80 transition-colors">
                          Pausar
                        </button>
                      )}
                      <button type="button" onClick={() => void handleOportunidadEstado(op.id, "completada")}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 transition-colors">
                        <CircleCheck className="w-3 h-3" /> Completar
                      </button>
                      <button type="button" onClick={() => { setDiscardAPITarget(op); setJustificacionAPI(""); }}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors ml-auto">
                        <CircleX className="w-3 h-3" /> Descartar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (item.source === "snapshot") {
            const op = item.op;
            const badge = estadoBadge(op.estado);
            const isActionable = op.estado !== "completada" && op.estado !== "descartada";
            return (
              <div key={op.id} className={`px-4 py-3 hover:bg-white/[0.02] transition-colors ${op.estado === "completada" ? "opacity-50" : ""}`}>
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-[#F0F4FA] leading-snug">{op.titulo}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${badge.cls}`}>
                        {badge.icon}{badge.label}
                      </span>
                      {op.prioridad && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${PRI_BADGE_CRM[op.prioridad] ?? PRI_BADGE_CRM.media}`}>
                          {op.prioridad.charAt(0).toUpperCase() + op.prioridad.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  {op.descripcion && <p className="text-[11px] text-[#8B9BB4] leading-relaxed line-clamp-2">{op.descripcion}</p>}
                  {op.producto_sugerido && op.producto_sugerido !== "—" && (
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#1A3154] text-[#C9A84C] font-medium">
                      {op.producto_sugerido}
                    </span>
                  )}
                  {isActionable && (
                    <div className="flex gap-1.5 pt-1.5 border-t border-white/[0.04] mt-1.5">
                      {op.estado === "pendiente" && (
                        <button type="button" onClick={() => actualizarEstadoOportunidadSnapshot(clienteId, op.id, "en_proceso")}
                          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-colors">
                          <CirclePlay className="w-3 h-3" /> Iniciar
                        </button>
                      )}
                      {op.estado === "en_proceso" && (
                        <button type="button" onClick={() => actualizarEstadoOportunidadSnapshot(clienteId, op.id, "pendiente")}
                          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#1A3154] text-[#8B9BB4] hover:bg-[#1A3154]/80 transition-colors">
                          Pausar
                        </button>
                      )}
                      <button type="button" onClick={() => actualizarEstadoOportunidadSnapshot(clienteId, op.id, "completada")}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 transition-colors">
                        <CircleCheck className="w-3 h-3" /> Completar
                      </button>
                      <button type="button" onClick={() => actualizarEstadoOportunidadSnapshot(clienteId, op.id, "descartada")}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors ml-auto">
                        <CircleX className="w-3 h-3" /> Descartar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // local insight
          const ins = item.op;
          const badge = estadoBadge(ins.estado_tarea);
          const isActionable = ins.estado_tarea !== "completada" && ins.estado_tarea !== "descartada";
          const titulo = ins.texto.includes(":") ? ins.texto.split(":")[0] : ins.texto;
          const descripcion = ins.texto.includes(":") ? ins.texto.split(":").slice(1).join(":").trim() : null;
          return (
            <div key={ins.id} className={`px-4 py-3 hover:bg-white/[0.02] transition-colors ${ins.estado_tarea === "completada" ? "opacity-50" : ""}`}>
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-[#F0F4FA] leading-snug">{titulo}</p>
                  <span className={`inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full border font-semibold shrink-0 ${badge.cls}`}>
                    {badge.icon}{badge.label}
                  </span>
                </div>
                {descripcion && <p className="text-[11px] text-[#8B9BB4] leading-relaxed line-clamp-2">{descripcion}</p>}
                {ins.producto_sugerido && (
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#1A3154] text-[#C9A84C] font-medium">
                    {ins.producto_sugerido}
                  </span>
                )}
                {isActionable && (
                  <div className="flex gap-1.5 pt-1.5 border-t border-white/[0.04] mt-1.5">
                    {ins.estado_tarea === "pendiente" && (
                      <button type="button" onClick={() => updateInsightEstado(ins.id, "en_proceso")}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#C9A84C]/10 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-colors">
                        <CirclePlay className="w-3 h-3" /> Iniciar
                      </button>
                    )}
                    {ins.estado_tarea === "en_proceso" && (
                      <button type="button" onClick={() => updateInsightEstado(ins.id, "pendiente")}
                        className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#1A3154] text-[#8B9BB4] hover:bg-[#1A3154]/80 transition-colors">
                        Pausar
                      </button>
                    )}
                    <button type="button" onClick={() => updateInsightEstado(ins.id, "completada")}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 transition-colors">
                      <CircleCheck className="w-3 h-3" /> Completar
                    </button>
                    <button type="button" onClick={() => updateInsightEstado(ins.id, "descartada")}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors ml-auto">
                      <CircleX className="w-3 h-3" /> Descartar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        };

        // ── Cluster colapsable ───────────────────────────────────────────
        const CRMClusterCard = ({ cluster, items }: { cluster: CRMCluster; items: AnyOp[] }) => {
          const [open, setOpen] = useState(true);
          const { Icon, label, bg, border, text, headerBg, isGancho } = cluster;
          const highCount = items.filter((i) =>
            i.source === "api" ? i.op.prioridad === "alta" :
            i.source === "snapshot" ? i.op.prioridad === "alta" : false
          ).length;

          return (
            <div className={`rounded-2xl border ${border} ${bg} overflow-hidden`} style={{ backdropFilter: "blur(8px)" }}>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 ${headerBg} hover:opacity-90 transition-opacity`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${text} shrink-0`} />
                  <span className={`font-bold text-sm ${text}`}>{label}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-current/20 ${text}`}
                    style={{ backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)" }}>
                    {items.length}
                  </span>
                  {highCount > 0 && !isGancho && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/25 text-red-300 border border-red-500/30">
                      {highCount} alta
                    </span>
                  )}
                  {isGancho && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30">
                      ganchos
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 ${text} transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
              </button>
              <div className={`transition-all duration-300 overflow-hidden ${open ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="divide-y divide-white/[0.04]">
                  {items.map((item) => renderAnyOp(item))}
                </div>
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-5">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Total", value: totalCount, color: "text-[#F0F4FA]" },
                { label: "Pendientes", value: pendientes, color: "text-[#8B9BB4]" },
                { label: "En proceso", value: enProceso, color: "text-[#C9A84C]" },
                { label: "Completadas", value: completadas, color: "text-[#10B981]" },
              ].map((s) => (
                <div key={s.label} className="bg-[#0A1628] rounded-xl p-3 text-center border border-white/[0.04]">
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-[#5A6A85]">{s.label}</p>
                </div>
              ))}
            </div>

            {/* 3-column cluster grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {activeClusters.map((cluster) => (
                <CRMClusterCard key={cluster.key} cluster={cluster} items={clusterMap[cluster.key] ?? []} />
              ))}
            </div>
          </div>
        );
      })()}

      {tab === "simulaciones" && (
        <div>
          {simulaciones.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-[#8B9BB4]">
                No hay simulaciones guardadas. Usa el simulador para crear y guardar escenarios.
              </p>
              {lastDiag && (
                <Link href={`/diagnosticos/${lastDiag.id}/simulador`}>
                  <Button variant="accent" size="sm" className="mt-4">
                    Abrir simulador
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#8B9BB4]">{simulaciones.length} simulación{simulaciones.length !== 1 ? "es" : ""} guardada{simulaciones.length !== 1 ? "s" : ""}</p>
                {lastDiag && (
                  <Link href={`/diagnosticos/${lastDiag.id}/simulador`}>
                    <Button variant="accent" size="sm">Abrir simulador</Button>
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {simulaciones.map((sim) => {
                  const avancePct = (sim.resultados.grado_avance * 100).toFixed(0);
                  const dateStr = new Date(sim.created_at).toLocaleDateString("es-MX", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                  });
                  return (
                    <div key={sim.id} className="bg-[#0C1829] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-[#F0F4FA] truncate">{sim.nombre}</h4>
                          <p className="text-[11px] text-[#5A6A85] mt-0.5">{dateStr}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSimulacion(sim.id)}
                          className="p-1.5 rounded-lg text-[#5A6A85] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors shrink-0"
                          title="Eliminar"
                        >
                          <span className="text-xs">✕</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-[#5A6A85]">Grado avance</span><p className={`font-bold ${Number(avancePct) >= 100 ? "text-[#10B981]" : Number(avancePct) >= 70 ? "text-[#C9A84C]" : "text-[#EF4444]"}`}>{avancePct}%</p></div>
                        <div><span className="text-[#5A6A85]">Mensualidad</span><p className="font-bold text-[#F0F4FA]">{formatMXN(sim.resultados.mensualidad_posible)}</p></div>
                        <div><span className="text-[#5A6A85]">Retiro</span><p className="font-bold text-[#F0F4FA]">{sim.params.edad_retiro} años</p></div>
                        <div><span className="text-[#5A6A85]">Déficit</span><p className={`font-bold ${sim.resultados.deficit_mensual < 0 ? "text-[#EF4444]" : "text-[#10B981]"}`}>{formatMXN(Math.abs(sim.resultados.deficit_mensual))}</p></div>
                      </div>
                      <div className="text-[11px] text-[#5A6A85] pt-1 border-t border-white/[0.04]">
                        Ahorro: {formatMXN(sim.params.ahorro)}/mes · Tasa: {sim.params.tasa_real}% · Extra: {formatMXN(sim.params.aportacion_extra)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "documentos" && (
        <div>
          {(() => {
            // Backend-persisted document activities:
            //   • tipo "nota" with title containing "balance"/"pdf"/"descargado"/"compartido"
            //     (created by guardarSesionEnCRM and registrarBalanceGenerado)
            const actividadesDocumentos = actividades.filter(
              (a) =>
                a.tipo === "nota" &&
                (a.titulo.toLowerCase().includes("balance") ||
                  a.titulo.toLowerCase().includes("pdf") ||
                  a.titulo.toLowerCase().includes("descargado") ||
                  a.titulo.toLowerCase().includes("compartido"))
            );

            // Deduplicate: hide local docs whose diagnostico_id is already represented in
            // the backend activities list — backend is the source of truth after saving.
            const backendDiagIds = new Set(
              actividadesDocumentos.map((a) => a.diagnostico_id).filter(Boolean)
            );
            const localDocsFiltered = documentos.filter(
              (d) => !d.diagnostico_id || !backendDiagIds.has(d.diagnostico_id)
            );

            const totalDocs = actividadesDocumentos.length + localDocsFiltered.length;
            const hasAny = totalDocs > 0;

            if (!hasAny) {
              return (
                <div className="text-center py-12">
                  <FileText className="w-8 h-8 text-[#C9A84C]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#8B9BB4]">
                    Los documentos aparecen aquí al generar el Balance Patrimonial.
                  </p>
                  {lastDiag && (
                    <Link href={`/diagnosticos/${lastDiag.id}/presentacion`}>
                      <Button variant="accent" size="sm" className="mt-4">
                        Ir al balance
                      </Button>
                    </Link>
                  )}
                </div>
              );
            }

            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#8B9BB4]">
                    {totalDocs} documento{totalDocs !== 1 ? "s" : ""}
                  </p>
                  {lastDiag && (
                    <Link href={`/diagnosticos/${lastDiag.id}/presentacion`}>
                      <Button variant="accent" size="sm">Ir al balance</Button>
                    </Link>
                  )}
                </div>
                <div className="space-y-3">
                  {/* Backend-persisted document activities */}
                  {actividadesDocumentos.map((act) => {
                    const isBalance = act.titulo.toLowerCase().includes("balance");
                    const meta = act.metadata_extra as Record<string, unknown> | null;
                    const descLabel = meta?.tipo_documento === "balance" ? "Balance Patrimonial" : isBalance ? "Balance Patrimonial" : "Diagnóstico";
                    const dateStr = act.fecha_actividad
                      ? new Date(act.fecha_actividad).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
                      : "";
                    return (
                      <div key={act.id} className="bg-[#0C1829] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isBalance ? "bg-[#C9A84C]/10 border border-[#C9A84C]/20" : "bg-blue-500/10 border border-blue-500/20"}`}>
                          <FileText className={`w-5 h-5 ${isBalance ? "text-[#C9A84C]" : "text-blue-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-[#F0F4FA] truncate">{act.titulo}</h4>
                          <p className="text-[11px] text-[#5A6A85] mt-0.5">
                            {descLabel} · {dateStr}
                          </p>
                        </div>
                        {act.diagnostico_id && (
                          <div className="shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                const opts = { diagnosticoId: act.diagnostico_id!, token: getAccessToken() ?? undefined };
                                if (isBalance) {
                                  const ok = await generarBalancePDF(nombre, opts);
                                  // Template not rendered here — navigate to the presentation page where it is
                                  if (!ok) router.push(`/diagnosticos/${act.diagnostico_id}/presentacion-b?clienteId=${clienteId}`);
                                } else {
                                  void generarDiagnosticoPDF(nombre, opts);
                                }
                              }}
                            >
                              Descargar
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Local session docs — only shown when not yet backed by the API */}
                  {localDocsFiltered.map((doc) => {
                  const dateStr = new Date(doc.created_at).toLocaleDateString("es-MX", {
                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                  });
                  const isBalance = doc.tipo === "balance";
                  return (
                    <div
                      key={doc.id}
                      className="bg-[#0C1829] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isBalance ? "bg-[#C9A84C]/10 border border-[#C9A84C]/20" : "bg-blue-500/10 border border-blue-500/20"}`}>
                        <FileText className={`w-5 h-5 ${isBalance ? "text-[#C9A84C]" : "text-blue-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-[#F0F4FA] truncate">{doc.nombre_archivo}</h4>
                        <p className="text-[11px] text-[#5A6A85] mt-0.5">
                          {isBalance ? "Balance Patrimonial" : "Diagnóstico"} · {dateStr}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const opts = doc.diagnostico_id ? { diagnosticoId: doc.diagnostico_id, token: getAccessToken() ?? undefined } : undefined;
                            if (isBalance) {
                              const ok = await generarBalancePDF(doc.cliente_nombre, opts);
                              if (!ok && doc.diagnostico_id) {
                                router.push(`/diagnosticos/${doc.diagnostico_id}/presentacion-b?clienteId=${clienteId}`);
                              }
                            } else {
                              void generarDiagnosticoPDF(doc.cliente_nombre, opts);
                            }
                          }}
                        >
                          Descargar
                        </Button>
                        <button
                          type="button"
                          onClick={() => removeDocumento(doc.id)}
                          className="p-1.5 rounded-lg text-[#5A6A85] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                          title="Eliminar"
                        >
                          <span className="text-xs">✕</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            );
          })()}
        </div>
      )}
      {/* Delete diagnostic confirmation */}
      <Modal
        open={!!diagToDelete}
        onClose={() => setDiagToDelete(null)}
        title="¿Eliminar diagnóstico?"
      >
        <p className="text-sm text-[#8B9BB4]">
          Se borrarán los datos de este diagnóstico y no se puede deshacer. Los enlaces de compartir dejarán de funcionar.
        </p>
        {diagToDelete && (
          <p className="mt-2 text-xs text-[#5A6A85]">
            Diagnóstico {diagToDelete.modo} · {diagToDelete.created_at
              ? new Date(diagToDelete.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
              : "Sin fecha"}
          </p>
        )}
        <div className="mt-6 flex gap-3 justify-end">
          <Button type="button" variant="ghost" onClick={() => setDiagToDelete(null)} className="text-[#8B9BB4]">
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={() => void handleDeleteDiagnostico()}>
            Eliminar diagnóstico
          </Button>
        </div>
      </Modal>

      {/* Discard opportunity justification modal (session insights) */}
      <Modal
        open={!!discardTarget}
        onClose={() => { setDiscardTarget(null); setJustificacion(""); }}
        title="Justificar descarte"
      >
        {discardTarget && (
          <>
            <div className="rounded-xl bg-[#0A1628] border border-white/[0.06] p-3 mb-4">
              <p className="text-sm text-[#F0F4FA] font-medium">{discardTarget.texto}</p>
              {discardTarget.producto_sugerido && (
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#C9A84C]/10 text-[#C9A84C]">
                  {discardTarget.producto_sugerido}
                </span>
              )}
            </div>
            <p className="text-sm text-[#8B9BB4] mb-2">
              ¿Por qué no se va a trabajar esta oportunidad? Este registro queda guardado para auditoría.
            </p>
            <textarea
              className="w-full rounded-xl bg-[#0C1829] border border-white/[0.08] text-sm text-[#F0F4FA] p-3 resize-none focus:outline-none focus:border-[#C9A84C]/40 placeholder:text-[#4A5A72]"
              rows={3}
              placeholder="Ej: El cliente ya cuenta con este producto con otra institución. / El cliente no está interesado en este momento. / Requiere revisión en 6 meses..."
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
            />
            <div className="mt-4 flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setDiscardTarget(null); setJustificacion(""); }}
                className="text-[#8B9BB4]"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={!justificacion.trim()}
                onClick={() => {
                  updateInsightEstado(discardTarget.id, "descartada", justificacion.trim());
                  setDiscardTarget(null);
                  setJustificacion("");
                }}
              >
                <CircleX className="w-3.5 h-3.5" /> Descartar oportunidad
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Discard API oportunidad modal */}
      <Modal
        open={!!discardAPITarget}
        onClose={() => { setDiscardAPITarget(null); setJustificacionAPI(""); }}
        title="Justificar descarte"
      >
        {discardAPITarget && (
          <>
            <div className="rounded-xl bg-[#0A1628] border border-white/[0.06] p-3 mb-4">
              <p className="text-sm text-[#F0F4FA] font-medium">{discardAPITarget.titulo}</p>
              {discardAPITarget.producto_sugerido && (
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#C9A84C]/10 text-[#C9A84C]">
                  {discardAPITarget.producto_sugerido}
                </span>
              )}
            </div>
            <p className="text-sm text-[#8B9BB4] mb-2">
              ¿Por qué no se va a trabajar esta oportunidad? Este registro queda guardado para auditoría.
            </p>
            <textarea
              className="w-full rounded-xl bg-[#0C1829] border border-white/[0.08] text-sm text-[#F0F4FA] p-3 resize-none focus:outline-none focus:border-[#C9A84C]/40 placeholder:text-[#4A5A72]"
              rows={3}
              placeholder="Ej: El cliente ya cuenta con este producto con otra institución. / El cliente no está interesado en este momento. / Requiere revisión en 6 meses..."
              value={justificacionAPI}
              onChange={(e) => setJustificacionAPI(e.target.value)}
            />
            <div className="mt-4 flex gap-3 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setDiscardAPITarget(null); setJustificacionAPI(""); }}
                className="text-[#8B9BB4]"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={!justificacionAPI.trim()}
                onClick={() => {
                  void handleOportunidadEstado(discardAPITarget.id, "descartada", justificacionAPI.trim());
                  setDiscardAPITarget(null);
                  setJustificacionAPI("");
                }}
              >
                <CircleX className="w-3.5 h-3.5" /> Descartar oportunidad
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
