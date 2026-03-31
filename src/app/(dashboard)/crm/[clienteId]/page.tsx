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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { useCRMStore, type CRMTask } from "@/stores/crm-store";
import { useDiagnosticoStore, type SessionInsight } from "@/stores/diagnostico-store";

type Tab = "resumen" | "historial" | "oportunidades" | "simulaciones" | "documentos";

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

  const tasks = useCRMStore((s) => s.tasks).filter((t) => t.cliente_id === clienteId);
  const completeTask = useCRMStore((s) => s.completeTask);
  const addContactLog = useCRMStore((s) => s.addContactLog);
  const sessionInsights = useDiagnosticoStore((s) => s.sesion_insights);

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
  }, [clienteId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNewSession = async () => {
    try {
      const d = await api.diagnosticos.create(clienteId, "individual");
      router.push(`/diagnosticos/${d.id}/sesion`);
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "resumen", label: "Resumen", icon: <FileText className="w-3.5 h-3.5" /> },
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
              <p className="text-xs text-[#8B9BB4]">Tasks pendientes</p>
              <p className="text-lg font-bold text-[#F59E0B] mt-1">
                {tasks.filter((t) => t.estado === "pendiente").length}
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

      {tab === "historial" && (
        <div className="space-y-3">
          {diagnosticos.length === 0 ? (
            <p className="text-sm text-[#8B9BB4] text-center py-8">Sin historial</p>
          ) : (
            diagnosticos.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-4 bg-[#0C1829] border border-white/[0.06] rounded-[14px] p-4 hover:border-white/[0.1] transition-colors cursor-pointer"
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
                <ChevronRight className="w-4 h-4 text-[#4A5A72]" />
              </div>
            ))
          )}
        </div>
      )}

      {tab === "oportunidades" && (
        <div className="space-y-3">
          {sessionInsights.filter((i) => i.tipo === "oportunidad").length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="w-8 h-8 text-[#C9A84C]/30 mx-auto mb-3" />
              <p className="text-sm text-[#8B9BB4]">
                Las oportunidades se detectan durante las sesiones conversacionales.
              </p>
              <Button
                variant="accent"
                size="sm"
                className="mt-4"
                onClick={handleNewSession}
              >
                Iniciar sesión para detectar oportunidades
              </Button>
            </div>
          ) : (
            sessionInsights
              .filter((i) => i.tipo === "oportunidad")
              .map((insight) => (
                <div
                  key={insight.id}
                  className="bg-[#0C1829] border border-white/[0.06] rounded-[14px] p-4"
                >
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-[#C9A84C] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-[#F0F4FA]">{insight.texto}</p>
                      {insight.producto_sugerido && (
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#C9A84C]/10 text-[#C9A84C]">
                          {insight.producto_sugerido}
                        </span>
                      )}
                      <p className="text-[10px] text-[#5A6A85] mt-1">
                        {insight.fase === "conversacion" ? "Detectado en conversación" : "Detectado en simulación"} ·{" "}
                        {new Date(insight.created_at).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {tab === "simulaciones" && (
        <div className="text-center py-12">
          <p className="text-sm text-[#8B9BB4]">
            Las simulaciones guardadas aparecerán aquí.
          </p>
          {lastDiag && (
            <Link href={`/diagnosticos/${lastDiag.id}/simulador`}>
              <Button variant="accent" size="sm" className="mt-4">
                Abrir simulador
              </Button>
            </Link>
          )}
        </div>
      )}

      {tab === "documentos" && (
        <div className="text-center py-12">
          <p className="text-sm text-[#8B9BB4]">
            Los PDFs generados y diagnósticos previos aparecerán aquí.
          </p>
          {lastDiag?.estado === "completo" && (
            <Link href={`/diagnosticos/${lastDiag.id}/completado`}>
              <Button variant="accent" size="sm" className="mt-4">
                Ver último diagnóstico
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
