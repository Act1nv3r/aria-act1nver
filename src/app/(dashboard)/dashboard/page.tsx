"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  ClipboardPlus,
  Users,
  User,
  UsersRound,
  ChevronRight,
  Search,
  ArrowLeft,
  Pencil,
  Trash2,
  BarChart3,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { labelForPaso } from "@/lib/diagnostico-steps";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { QuickMetrics } from "@/components/crm/quick-metrics";

type ClienteEstado = "nuevo" | "borrador" | "completo";

interface ClienteItem {
  id: string;
  nombre_alias: string;
  ultimoDiagnostico?: string | null;
  estado: ClienteEstado;
  pasoActual?: number;
  diagnosticoId?: string;
  modo?: "individual" | "pareja";
}

function mapClienteFromApi(c: {
  id: string;
  nombre_alias: string;
  ultimo_diagnostico: {
    id: string;
    estado: string;
    paso_actual: number;
    modo: string;
    created_at: string | null;
  } | null;
}): ClienteItem {
  const u = c.ultimo_diagnostico;
  if (!u) {
    return {
      id: c.id,
      nombre_alias: c.nombre_alias,
      estado: "nuevo",
      ultimoDiagnostico: null,
    };
  }
  const estado: ClienteEstado = u.estado === "completo" ? "completo" : "borrador";
  const modo = u.modo === "pareja" ? "pareja" : "individual";
  return {
    id: c.id,
    nombre_alias: c.nombre_alias,
    estado,
    pasoActual: u.paso_actual,
    diagnosticoId: u.id,
    modo,
    ultimoDiagnostico: u.created_at
      ? new Date(u.created_at).toLocaleDateString("es-MX", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null,
  };
}

interface DiagnosticoRow {
  id: string;
  cliente_id: string;
  estado: string;
  paso_actual: number;
  modo: string;
  created_at: string | null;
}

type PendingDelete =
  | { kind: "diagnostico"; row: DiagnosticoRow }
  | { kind: "cliente"; id: string; nombre_alias: string };

const REFERRAL_KEY = "aria_referral_code";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardPage() {
  const router = useRouter();
  const setModo = useDiagnosticoStore((s) => s.setModo);
  const diagnosticosCompletados = useDiagnosticoStore((s) => s.diagnosticos_completados);
  const [clientes, setClientes] = useState<ClienteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"modo" | "nombre">("modo");
  const [modoSeleccionado, setModoSeleccionado] = useState<"individual" | "pareja">("individual");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) sessionStorage.setItem(REFERRAL_KEY, ref);
  }, []);

  const getReferralCode = () => {
    if (typeof window === "undefined") return null;
    const code = sessionStorage.getItem(REFERRAL_KEY);
    if (code) {
      sessionStorage.removeItem(REFERRAL_KEY);
      return code;
    }
    return null;
  };

  const refreshClientes = useCallback(async () => {
    try {
      const list = await api.clientes.list();
      const mapped = list.map(mapClienteFromApi);
      // Merge local completion data: if the store knows a diagnostic is complete, override
      const completados = useDiagnosticoStore.getState().diagnosticos_completados;
      const merged = mapped.map((c) => {
        if (c.diagnosticoId && completados[c.diagnosticoId] && c.estado !== "completo") {
          return { ...c, estado: "completo" as ClienteEstado };
        }
        return c;
      });
      setClientes(merged);
    } catch {
      // API unavailable — build cards from local completion data
      const completados = useDiagnosticoStore.getState().diagnosticos_completados;
      const localClientes: ClienteItem[] = Object.entries(completados).map(([diagId, info]) => ({
        id: diagId,
        nombre_alias: info.nombre,
        estado: "completo" as ClienteEstado,
        diagnosticoId: diagId,
        modo: info.modo as "individual" | "pareja",
        ultimoDiagnostico: new Date(info.completed_at).toLocaleDateString("es-MX", {
          day: "numeric", month: "short", year: "numeric",
        }),
      }));
      setClientes(localClientes);
    }
  }, []);

  useEffect(() => {
    refreshClientes().finally(() => setLoading(false));
  }, [refreshClientes]);

  const handleNuevoCliente = async () => {
    if (!nuevoNombre.trim()) return;
    setModo(modoSeleccionado);
    try {
      const c = await api.clientes.create(nuevoNombre.trim());
      const refCode = getReferralCode();
      const d = await api.diagnosticos.create(c.id, modoSeleccionado, refCode);
      setClientes((prev) => [
        ...prev,
        {
          id: c.id,
          nombre_alias: c.nombre_alias,
          estado: "borrador",
          pasoActual: d.paso_actual ?? 1,
          diagnosticoId: d.id,
          modo: modoSeleccionado,
          ultimoDiagnostico: new Date().toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        },
      ]);
      setNuevoNombre("");
      setModalOpen(false);
      setModalStep("modo");
      router.push(`/diagnosticos/${d.id}/sesion?clienteId=${c.id}`);
    } catch {
      router.push("/diagnosticos/demo/paso/1");
    }
  };

  const handleNuevoDiagnosticoForCliente = async (cliente: ClienteItem) => {
    setModo("individual");
    try {
      const refCode = getReferralCode();
      const d = await api.diagnosticos.create(cliente.id, "individual", refCode);
      router.push(`/diagnosticos/${d.id}/sesion?clienteId=${cliente.id}`);
      await refreshClientes();
    } catch {
      router.push("/diagnosticos/demo/paso/1");
    }
  };

  const handleCardClick = (cliente: ClienteItem) => {
    router.push(`/crm/${cliente.id}`);
  };

  const handleEditFromCard = (cliente: ClienteItem) => {
    if (!cliente.diagnosticoId) return;
    if (cliente.modo) setModo(cliente.modo);
    const paso = Math.min(6, Math.max(1, cliente.pasoActual ?? 1));
    router.push(`/diagnosticos/${cliente.diagnosticoId}/paso/${paso}`);
  };

  const handleDeleteFromCard = (cliente: ClienteItem) => {
    setPendingDelete({
      kind: "cliente",
      id: cliente.id,
      nombre_alias: cliente.nombre_alias,
    });
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.kind === "diagnostico") {
        await api.diagnosticos.delete(pendingDelete.row.id);
      } else {
        await api.clientes.delete(pendingDelete.id);
      }
      await refreshClientes();
    } catch {
      // If API fails, remove from local state
      if (pendingDelete.kind === "cliente") {
        setClientes((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      }
    }
    setPendingDelete(null);
  };

  const filteredClientes = clientes.filter((c) =>
    c.nombre_alias.toLowerCase().includes(search.toLowerCase())
  );

  const totalClientes = clientes.length;
  const enProgreso = clientes.filter((c) => c.estado === "borrador").length;
  const completados = clientes.filter((c) => c.estado === "completo").length;

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-8">

      {/* Welcome banner — tool explanation */}
      <div className="mb-8 rounded-[20px] overflow-hidden border border-[#C9A84C]/15"
        style={{ background: "linear-gradient(135deg, #0C1829 0%, #112038 100%)" }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-5">
          <div className="w-11 h-11 rounded-[14px] bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5 text-[#C9A84C]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#F0F4FA] font-semibold text-sm leading-snug">
              Convierte una conversación de 15 minutos en un diagnóstico financiero completo
            </p>
            <p className="text-[#8B9BB4] text-xs mt-1 leading-relaxed">
              Registra los datos de tu cliente, ArIA calcula su situación patrimonial y genera un reporte profesional listo para presentar — sin hojas de cálculo.
            </p>
          </div>
        </div>
      </div>

      {/* Header row */}
      <div className="flex items-center gap-3 mb-6">
        <div className="shrink-0">
          <h1 className="font-bold font-[family-name:var(--font-poppins)] text-xl text-[#F0F4FA] leading-tight">
            Mis clientes
          </h1>
          <p className="text-[11px] text-[#5A6A85] mt-0.5">{totalClientes} cliente{totalClientes !== 1 ? "s" : ""}</p>
        </div>
        {totalClientes > 0 && (
          <div className="flex-1 relative mx-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4A5A72]" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0C1829] border border-white/[0.08] rounded-full pl-9 pr-4 py-2
                         text-sm text-[#F0F4FA] placeholder:text-[#4A5A72]
                         focus:outline-none focus:border-[#C9A84C]/40
                         transition-colors duration-200"
            />
          </div>
        )}
        <Button
          variant="accent"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo cliente
        </Button>
      </div>

      {/* Quick metrics */}
      {totalClientes > 0 && (
        <div className="mb-6 animate-slide-up">
          <QuickMetrics
            metrics={[
              { label: "Total clientes", value: totalClientes, icon: <Users />, sublabel: "en tu cartera" },
              { label: "En progreso", value: enProgreso, color: "#F59E0B", icon: <BarChart3 />, sublabel: "diagnósticos activos" },
              { label: "Completados", value: completados, color: "#10B981", icon: <CheckCircle2 />, sublabel: "diagnósticos listos" },
            ]}
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#0C1829] border border-white/[0.06] rounded-[16px] p-5">
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredClientes.length === 0 && search ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-[20px] bg-[#0C1829] border border-white/[0.06] flex items-center justify-center mb-4">
            <Search className="h-7 w-7 text-[#C9A84C]/40" />
          </div>
          <p className="text-base font-semibold text-[#F0F4FA] mt-4">Sin resultados</p>
          <p className="text-sm text-[#8B9BB4] mt-2">
            No se encontraron clientes con &ldquo;{search}&rdquo;
          </p>
        </div>
      ) : clientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-[20px] bg-[#0C1829] border border-white/[0.06] flex items-center justify-center">
            <Users className="h-7 w-7 text-[#C9A84C]/40" />
          </div>
          <p className="text-lg font-semibold text-[#F0F4FA] mt-4">Aún no tienes clientes</p>
          <p className="text-sm text-[#8B9BB4] mt-2">
            Crea tu primer diagnóstico financiero
          </p>
          <Button variant="accent" size="sm" onClick={() => setModalOpen(true)} className="mt-6 flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClientes.map((cliente) => {
            const paso = Math.min(6, Math.max(1, cliente.pasoActual ?? 1));
            const etapaLabel = labelForPaso(paso);
            return (
            <div
              key={cliente.id}
              onClick={() => handleCardClick(cliente)}
              className="
                bg-[#0C1829] border border-white/[0.06] rounded-[16px] p-5
                cursor-pointer
                hover:border-[#C9A84C]/30 hover:shadow-[0_0_24px_rgba(201,168,76,0.08)]
                transition-all duration-300
                group
              "
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#1A3154] border border-[#C9A84C]/10 flex items-center justify-center shrink-0">
                  <span className="text-[#C9A84C] font-bold text-sm">
                    {getInitials(cliente.nombre_alias)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#F0F4FA] text-sm truncate">
                    {cliente.nombre_alias}
                  </p>
                  <p className="text-xs text-[#8B9BB4] mt-0.5 truncate">
                    {cliente.ultimoDiagnostico
                      ? `Último diagnóstico · ${cliente.ultimoDiagnostico}`
                      : "Sin diagnósticos"}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-4 w-4 text-[#4A5A72] group-hover:text-[#C9A84C] transition-colors shrink-0 mt-0.5" />
              </div>

              {/* Status */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {cliente.estado === "completo" && (
                  <>
                    <Badge variant="mejor">
                      <span className="inline-flex items-center gap-1">
                        <BarChart3 className="h-3 w-3 shrink-0" />
                        Completado
                      </span>
                    </Badge>
                    <span className="text-[11px] text-[#5A6A85]">
                      Toca la tarjeta para ver resultados
                    </span>
                  </>
                )}
                {cliente.estado === "borrador" && (
                  <>
                    <Badge variant="suficiente">En proceso</Badge>
                    <span className="text-xs text-[#8B9BB4]">
                      Etapa: <span className="text-[#F0F4FA] font-medium">{etapaLabel}</span>
                      <span className="text-[#5A6A85]"> ({paso}/6)</span>
                    </span>
                  </>
                )}
                {cliente.estado === "nuevo" && (
                  <Badge variant="bien">Sin diagnóstico</Badge>
                )}
              </div>

              {/* Bottom row: hints + actions */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-white/[0.04]">
                <p className="text-[11px] text-[#5A6A85] min-w-0">
                  Ver perfil
                </p>
                <div className="flex items-center gap-0.5 shrink-0">
                  {cliente.estado === "borrador" && cliente.diagnosticoId && (
                    <button
                      type="button"
                      aria-label="Continuar diagnóstico"
                      title="Continuar diagnóstico"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditFromCard(cliente);
                      }}
                      className="p-2 rounded-lg text-[#8B9BB4] hover:text-[#C9A84C] hover:bg-white/[0.04] transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label="Nuevo diagnóstico"
                    title="Nuevo diagnóstico"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleNuevoDiagnosticoForCliente(cliente);
                    }}
                    className="p-2 rounded-lg text-[#8B9BB4] hover:text-[#C9A84C] hover:bg-white/[0.04] transition-colors"
                  >
                    <ClipboardPlus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Eliminar cliente"
                    title="Eliminar cliente y todos sus diagnósticos"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFromCard(cliente);
                    }}
                    className="p-2 rounded-lg text-[#8B9BB4] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* New Client Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalStep("modo");
        }}
        title={modalStep === "modo" ? "Tipo de diagnóstico" : "Nuevo cliente"}
      >
        <div className="space-y-4">
          {modalStep === "modo" ? (
            <div
              onKeyDown={(e) => { if (e.key === "Enter") setModalStep("nombre"); }}
            >
              <p className="text-sm text-[#8B9BB4] mb-4">
                Selecciona el tipo de diagnóstico
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Individual option */}
                <button
                  type="button"
                  onClick={() => setModoSeleccionado("individual")}
                  className={`
                    flex flex-col items-center gap-3 p-5 rounded-[14px] border transition-all duration-200
                    ${
                      modoSeleccionado === "individual"
                        ? "border-[#C9A84C] bg-[#C9A84C]/5 shadow-[0_0_16px_rgba(201,168,76,0.08)]"
                        : "border-white/[0.08] bg-[#112038] hover:border-white/[0.15]"
                    }
                  `}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      modoSeleccionado === "individual"
                        ? "bg-[#C9A84C]/15"
                        : "bg-[#1A3154]"
                    }`}
                  >
                    <User
                      className={`h-6 w-6 ${
                        modoSeleccionado === "individual" ? "text-[#C9A84C]" : "text-[#8B9BB4]"
                      }`}
                    />
                  </div>
                  <span
                    className={`font-bold text-sm ${
                      modoSeleccionado === "individual" ? "text-[#C9A84C]" : "text-[#F0F4FA]"
                    }`}
                  >
                    Individual
                  </span>
                </button>

                {/* Pareja option */}
                <button
                  type="button"
                  onClick={() => setModoSeleccionado("pareja")}
                  className={`
                    flex flex-col items-center gap-3 p-5 rounded-[14px] border transition-all duration-200
                    ${
                      modoSeleccionado === "pareja"
                        ? "border-[#C9A84C] bg-[#C9A84C]/5 shadow-[0_0_16px_rgba(201,168,76,0.08)]"
                        : "border-white/[0.08] bg-[#112038] hover:border-white/[0.15]"
                    }
                  `}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      modoSeleccionado === "pareja"
                        ? "bg-[#C9A84C]/15"
                        : "bg-[#1A3154]"
                    }`}
                  >
                    <UsersRound
                      className={`h-6 w-6 ${
                        modoSeleccionado === "pareja" ? "text-[#C9A84C]" : "text-[#8B9BB4]"
                      }`}
                    />
                  </div>
                  <span
                    className={`font-bold text-sm ${
                      modoSeleccionado === "pareja" ? "text-[#C9A84C]" : "text-[#F0F4FA]"
                    }`}
                  >
                    Pareja
                  </span>
                </button>
              </div>
              <Button
                variant="accent"
                className="w-full mt-2"
                onClick={() => setModalStep("nombre")}
                autoFocus
              >
                Siguiente
              </Button>
            </div>
          ) : (
            <>
              <Input
                label="Nombre del cliente"
                placeholder="Ej: Juan Pérez"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && nuevoNombre.trim()) void handleNuevoCliente(); }}
                autoFocus
              />
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={handleNuevoCliente}
                  disabled={!nuevoNombre.trim()}
                >
                  Crear y comenzar
                </Button>
                <Button variant="ghost" onClick={() => setModalStep("modo")} className="w-full text-[#8B9BB4] justify-center">
                  <ArrowLeft className="h-4 w-4" /> Atrás
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="¿Eliminar cliente?"
      >
        {pendingDelete?.kind === "cliente" && (
          <>
            <p className="text-sm text-[#8B9BB4]">
              Se eliminará el cliente{" "}
              <span className="font-medium text-[#F0F4FA]">{pendingDelete.nombre_alias}</span> junto
              con todos sus diagnósticos. Esta acción no se puede deshacer.
            </p>
          </>
        )}
        {pendingDelete?.kind === "diagnostico" && (
          <>
            <p className="text-sm text-[#8B9BB4]">
              Se borrarán los datos de este diagnóstico y no se puede deshacer.
            </p>
          </>
        )}
        <div className="mt-6 flex gap-3 justify-end">
          <Button type="button" variant="ghost" onClick={() => setPendingDelete(null)} className="text-[#8B9BB4]">
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={() => void handleConfirmDelete()}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
