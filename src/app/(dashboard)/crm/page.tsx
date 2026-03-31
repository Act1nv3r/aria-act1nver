"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Search, User, UsersRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PendingActions } from "@/components/crm/pending-actions";
import { QuickMetrics } from "@/components/crm/quick-metrics";
import { ClientCard } from "@/components/crm/client-card";
import { api } from "@/lib/api-client";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { useCRMStore, type CRMTask } from "@/stores/crm-store";

export default function CRMPage() {
  const router = useRouter();
  const setModo = useDiagnosticoStore((s) => s.setModo);
  const {
    tasks,
    postponeTask,
    completeTask,
  } = useCRMStore();

  const [clientes, setClientes] = useState<
    Array<{
      id: string;
      nombre_alias: string;
      ultimo_diagnostico: {
        id: string;
        estado: string;
        paso_actual: number;
        modo: string;
        created_at: string | null;
      } | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "pendientes" | "recientes">("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"modo" | "nombre">("modo");
  const [modoSeleccionado, setModoSeleccionado] = useState<"individual" | "pareja">("individual");
  const [nuevoNombre, setNuevoNombre] = useState("");

  const refreshClientes = useCallback(async () => {
    try {
      const list = await api.clientes.list();
      setClientes(list);
    } catch {
      setClientes([]);
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
      const d = await api.diagnosticos.create(c.id, modoSeleccionado);
      setNuevoNombre("");
      setModalOpen(false);
      setModalStep("modo");
      router.push(`/diagnosticos/${d.id}/sesion`);
    } catch {
      router.push("/diagnosticos/demo/paso/1");
    }
  };

  const handleContact = (task: CRMTask) => {
    router.push(`/crm/${task.cliente_id}`);
  };

  const filteredClientes = clientes
    .filter((c) =>
      c.nombre_alias.toLowerCase().includes(search.toLowerCase())
    )
    .filter((c) => {
      if (filter === "pendientes") return c.ultimo_diagnostico?.estado !== "completo";
      if (filter === "recientes") {
        if (!c.ultimo_diagnostico?.created_at) return false;
        const days = (Date.now() - new Date(c.ultimo_diagnostico.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return days <= 30;
      }
      return true;
    });

  const totalClientes = clientes.length;
  const pendientes = tasks.filter((t) => t.estado === "pendiente").length;
  const diagEstaSmana = clientes.filter((c) => {
    if (!c.ultimo_diagnostico?.created_at) return false;
    const d = new Date(c.ultimo_diagnostico.created_at);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;
  const completados = clientes.filter(
    (c) => c.ultimo_diagnostico?.estado === "completo"
  ).length;
  const tasaCompletitud =
    totalClientes > 0 ? Math.round((completados / totalClientes) * 100) : 0;

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <h1 className="font-bold font-[family-name:var(--font-poppins)] text-2xl text-[#F0F4FA]">
          ArIA CRM
        </h1>
        <div className="flex-1" />
        <div className="relative max-w-[280px]">
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
        <Button
          variant="accent"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          Nueva sesión
        </Button>
      </div>

      {/* Quick Metrics */}
      <div className="mb-6 animate-slide-up">
        <QuickMetrics
          metrics={[
            { label: "Clientes activos", value: totalClientes },
            { label: "Pendientes seguimiento", value: pendientes, color: "#F59E0B" },
            { label: "Diagnósticos esta semana", value: diagEstaSmana },
            { label: "Tasa completitud", value: `${tasaCompletitud}%`, color: "#10B981" },
          ]}
        />
      </div>

      {/* Pending Actions */}
      {tasks.filter((t) => t.estado === "pendiente").length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-[#F0F4FA] mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
            Acciones pendientes
          </h2>
          <PendingActions
            tasks={tasks}
            onContact={handleContact}
            onPostpone={postponeTask}
            onComplete={completeTask}
          />
        </div>
      )}

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-bold text-[#F0F4FA] mr-2">Todos mis clientes</h2>
        {(["todos", "pendientes", "recientes"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`
              px-3 py-1 rounded-full text-xs font-medium transition-all
              ${filter === f
                ? "bg-[#1A3154] text-[#F0F4FA]"
                : "text-[#8B9BB4] hover:text-[#F0F4FA] hover:bg-[#1A3154]/50"
              }
            `}
          >
            {f === "todos" ? "Todos" : f === "pendientes" ? "Pendientes" : "Recientes"}
          </button>
        ))}
      </div>

      {/* Client grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#0C1829] border border-white/[0.06] rounded-[16px] p-5">
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="h-7 w-7 text-[#C9A84C]/40 mb-4" />
          <p className="text-sm text-[#8B9BB4]">
            {search
              ? `Sin resultados para "${search}"`
              : "Aún no tienes clientes. Inicia tu primera sesión."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClientes.map((c) => {
            const clienteTasks = tasks.filter(
              (t) => t.cliente_id === c.id && t.estado === "pendiente"
            );
            const oportunidades = clienteTasks
              .filter((t) => t.tipo === "oportunidad")
              .map((t) => t.titulo.split(":")[0].replace("Oportunidad", "").trim());

            return (
              <ClientCard
                key={c.id}
                id={c.id}
                nombre={c.nombre_alias}
                ultimoContacto={
                  c.ultimo_diagnostico?.created_at
                    ? new Date(c.ultimo_diagnostico.created_at).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                      })
                    : undefined
                }
                estado={
                  c.ultimo_diagnostico?.estado === "completo"
                    ? "activo"
                    : c.ultimo_diagnostico
                    ? "pendiente"
                    : "inactivo"
                }
                oportunidades={oportunidades}
                saludScore={
                  c.ultimo_diagnostico?.estado === "completo" ? 80 : c.ultimo_diagnostico ? 50 : 20
                }
                onClick={() => router.push(`/crm/${c.id}`)}
              />
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
        title={modalStep === "modo" ? "Tipo de diagnóstico" : "Nueva sesión"}
      >
        <div className="space-y-4">
          {modalStep === "modo" ? (
            <>
              <p className="text-sm text-[#8B9BB4] mb-4">
                Selecciona el tipo de diagnóstico
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModoSeleccionado("individual")}
                  className={`
                    flex flex-col items-center gap-3 p-5 rounded-[14px] border transition-all duration-200
                    ${modoSeleccionado === "individual"
                      ? "border-[#C9A84C] bg-[#C9A84C]/5 shadow-[0_0_16px_rgba(201,168,76,0.08)]"
                      : "border-white/[0.08] bg-[#112038] hover:border-white/[0.15]"
                    }
                  `}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    modoSeleccionado === "individual" ? "bg-[#C9A84C]/15" : "bg-[#1A3154]"
                  }`}>
                    <User className={`h-6 w-6 ${modoSeleccionado === "individual" ? "text-[#C9A84C]" : "text-[#8B9BB4]"}`} />
                  </div>
                  <span className={`font-bold text-sm ${modoSeleccionado === "individual" ? "text-[#C9A84C]" : "text-[#F0F4FA]"}`}>
                    Individual
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoSeleccionado("pareja")}
                  className={`
                    flex flex-col items-center gap-3 p-5 rounded-[14px] border transition-all duration-200
                    ${modoSeleccionado === "pareja"
                      ? "border-[#C9A84C] bg-[#C9A84C]/5 shadow-[0_0_16px_rgba(201,168,76,0.08)]"
                      : "border-white/[0.08] bg-[#112038] hover:border-white/[0.15]"
                    }
                  `}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    modoSeleccionado === "pareja" ? "bg-[#C9A84C]/15" : "bg-[#1A3154]"
                  }`}>
                    <UsersRound className={`h-6 w-6 ${modoSeleccionado === "pareja" ? "text-[#C9A84C]" : "text-[#8B9BB4]"}`} />
                  </div>
                  <span className={`font-bold text-sm ${modoSeleccionado === "pareja" ? "text-[#C9A84C]" : "text-[#F0F4FA]"}`}>
                    Pareja
                  </span>
                </button>
              </div>
              <Button variant="accent" className="w-full mt-2" onClick={() => setModalStep("nombre")}>
                Siguiente
              </Button>
            </>
          ) : (
            <>
              <Input
                label="Nombre del cliente"
                placeholder="Ej: Juan Pérez"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
              />
              <div className="flex flex-col gap-3 pt-2">
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={handleNuevoCliente}
                  disabled={!nuevoNombre.trim()}
                >
                  Crear e iniciar sesión
                </Button>
                <Button variant="ghost" onClick={() => setModalStep("modo")} className="w-full text-[#8B9BB4] justify-center">
                  <ArrowLeft className="h-4 w-4" /> Atrás
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
