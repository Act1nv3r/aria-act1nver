"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Share, SlidersHorizontal, Download, Lightbulb, ChevronRight, ChevronDown, TrendingUp, Shield, PiggyBank, Target, CreditCard, Receipt, Building2, Home, User, PenLine, Phone, CalendarCheck, MessageCircle, Heart, Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OutputPanel } from "@/components/diagnostico/output-panel";
import { FinancialTimeline } from "@/components/outputs/financial-timeline";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { useDiagnosticoId } from "@/contexts/diagnostico-context";
import { generarBalancePDF } from "@/lib/pdf-generator";
import { getAccessToken } from "@/lib/api-client";
import { useDeepgram, type TranscriptLine } from "@/hooks/use-deepgram";
import { detectarOportunidades, detectarOportunidadesDesdeDatos, type Oportunidad } from "@/lib/navi-opportunities";
import { BalancePDFTemplate } from "@/components/pdf/balance-pdf-template";
import { calcularMotorC, calcularMotorA, calcularMotorB, calcularMotorE, calcularMotorF } from "@/lib/motors";
import { calcularSaludFinanciera } from "@/lib/motors/salud-scores";
import { RadarSaludFinanciera } from "@/components/outputs/radar-salud-financiera";
import { bulkCreateOportunidades } from "@/lib/crm-api";
import { registrarBalanceGenerado } from "@/lib/guardar-sesion-crm";
import confetti from "canvas-confetti";
import { api } from "@/lib/api-client";

const CAT_ICONS: Record<string, typeof Shield> = {
  proteccion: Shield,
  ahorro: PiggyBank,
  retiro: Target,
  deuda: CreditCard,
  inversion: TrendingUp,
  fiscal: Receipt,
  patrimonio: Building2,
  seguimiento: Lightbulb,
};

const CAT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  proteccion: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", glow: "shadow-red-500/10" },
  ahorro: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", glow: "shadow-amber-500/10" },
  retiro: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", glow: "shadow-emerald-500/10" },
  deuda: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", glow: "shadow-orange-500/10" },
  inversion: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", glow: "shadow-blue-500/10" },
  fiscal: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", glow: "shadow-purple-500/10" },
  patrimonio: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", glow: "shadow-cyan-500/10" },
  seguimiento: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", glow: "shadow-violet-500/10" },
};

const PRI_BADGE: Record<string, { label: string; cls: string }> = {
  alta: { label: "Alta", cls: "bg-red-500/20 text-red-300 border-red-500/30" },
  media: { label: "Media", cls: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  baja: { label: "Baja", cls: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
};

type ClusterDef = {
  key: string;
  label: string;
  Icon: typeof Shield;
  bg: string;
  border: string;
  text: string;
  headerBg: string;
  isGancho?: boolean;
};

const CLUSTER_DEFS: ClusterDef[] = [
  {
    key: "gancho_conversacion",
    label: "Conexión con el cliente",
    Icon: Heart,
    bg: "bg-[#C9A84C]/8",
    border: "border-[#C9A84C]/25",
    text: "text-[#C9A84C]",
    headerBg: "bg-gradient-to-r from-[#C9A84C]/15 to-[#C9A84C]/5",
    isGancho: true,
  },
  {
    key: "proteccion",
    label: "Protección",
    Icon: Shield,
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    text: "text-red-400",
    headerBg: "bg-red-500/10",
  },
  {
    key: "ahorro",
    label: "Ahorro",
    Icon: PiggyBank,
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    text: "text-amber-400",
    headerBg: "bg-amber-500/10",
  },
  {
    key: "retiro",
    label: "Retiro",
    Icon: Target,
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    headerBg: "bg-emerald-500/10",
  },
  {
    key: "inversion",
    label: "Inversión",
    Icon: TrendingUp,
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    text: "text-blue-400",
    headerBg: "bg-blue-500/10",
  },
  {
    key: "deuda",
    label: "Deuda",
    Icon: CreditCard,
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
    text: "text-orange-400",
    headerBg: "bg-orange-500/10",
  },
  {
    key: "fiscal",
    label: "Fiscal",
    Icon: Receipt,
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
    text: "text-purple-400",
    headerBg: "bg-purple-500/10",
  },
  {
    key: "patrimonio",
    label: "Patrimonio",
    Icon: Building2,
    bg: "bg-cyan-500/5",
    border: "border-cyan-500/20",
    text: "text-cyan-400",
    headerBg: "bg-cyan-500/10",
  },
  {
    key: "seguimiento",
    label: "Seguimiento",
    Icon: MessageCircle,
    bg: "bg-violet-500/5",
    border: "border-violet-500/20",
    text: "text-violet-400",
    headerBg: "bg-violet-500/10",
  },
];

export default function PresentacionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const diagnosticoId = params.id as string;
  const { isApiMode } = useDiagnosticoId();
  const store = useDiagnosticoStore();
  const { perfil, flujoMensual, patrimonio, retiro, proteccion, addSessionInsight, sesion_insights, currentClienteId, agregarOportunidadesSnapshot } = store;

  // clienteId from query param or store
  const clienteId = searchParams.get("clienteId") ?? currentClienteId;
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const opsRef = useRef<Oportunidad[]>([]);
  const [opportunities, setOpportunities] = useState<Oportunidad[]>([]);

  // Stop any confetti still running (e.g. after premium) so the technical report stays calm
  useEffect(() => {
    confetti.reset();
  }, []);

  // ── Reconstruct store from backend snapshot if local state was cleared ──────
  // This makes the page work after a page refresh, device change, or cache clear.
  // We only hydrate if the critical financial data is missing from the local store.
  useEffect(() => {
    const needsHydration = !perfil?.nombre || !flujoMensual || !patrimonio;
    if (!needsHydration || !isApiMode) return;

    api.diagnosticos.get(diagnosticoId).then((diag) => {
      const snap = (diag as Record<string, unknown>)?.parametros_snapshot as Record<string, unknown> | null;

      // Hydrate from section data (always authoritative)
      const backendPerfil = (diag as Record<string, unknown>).perfil as Record<string, unknown> | undefined;
      const backendFlujo = (diag as Record<string, unknown>).flujoMensual as Record<string, unknown> | undefined;
      const backendPatrimonio = (diag as Record<string, unknown>).patrimonio as Record<string, unknown> | undefined;
      const backendRetiro = (diag as Record<string, unknown>).retiro as Record<string, unknown> | undefined;
      const backendProteccion = (diag as Record<string, unknown>).proteccion as Record<string, unknown> | undefined;

      const { updatePerfil, updateFlujoMensual, updatePatrimonio, updateRetiro, updateProteccion,
              updateParejaPerfil, updateParejaFlujoMensual, updateParejaPatrimonio, updateParejaRetiro, updateParejaProteccion,
              updateCriteriosTrayectoria, addSessionInsight: addInsight, setModo } = useDiagnosticoStore.getState();

      if (backendPerfil) updatePerfil(backendPerfil as Parameters<typeof updatePerfil>[0]);
      if (backendFlujo) updateFlujoMensual(backendFlujo as Parameters<typeof updateFlujoMensual>[0]);
      if (backendPatrimonio) updatePatrimonio(backendPatrimonio as Parameters<typeof updatePatrimonio>[0]);
      if (backendRetiro) updateRetiro(backendRetiro as Parameters<typeof updateRetiro>[0]);
      if (backendProteccion) updateProteccion(backendProteccion as Parameters<typeof updateProteccion>[0]);

      if (!snap) return;

      // Restore from snapshot what the section endpoints don't cover
      if (snap.modo) setModo(snap.modo as "individual" | "pareja");
      if (snap.criterios_trayectoria) updateCriteriosTrayectoria(snap.criterios_trayectoria as Parameters<typeof updateCriteriosTrayectoria>[0]);
      if (snap.pareja_perfil) updateParejaPerfil(snap.pareja_perfil as Parameters<typeof updateParejaPerfil>[0]);
      if (snap.pareja_flujoMensual) updateParejaFlujoMensual(snap.pareja_flujoMensual as Parameters<typeof updateParejaFlujoMensual>[0]);
      if (snap.pareja_patrimonio) updateParejaPatrimonio(snap.pareja_patrimonio as Parameters<typeof updateParejaPatrimonio>[0]);
      if (snap.pareja_retiro) updateParejaRetiro(snap.pareja_retiro as Parameters<typeof updateParejaRetiro>[0]);
      if (snap.pareja_proteccion) updateParejaProteccion(snap.pareja_proteccion as Parameters<typeof updateParejaProteccion>[0]);

      // Restore session insights (oportunidades, contexto, etc.)
      if (Array.isArray(snap.sesion_insights)) {
        const currentInsights = useDiagnosticoStore.getState().sesion_insights;
        for (const ins of snap.sesion_insights as Array<Record<string, unknown>>) {
          const already = currentInsights.some((ci) => ci.id === ins.id);
          if (!already) {
            addInsight({
              tipo: ins.tipo as "oportunidad" | "insight" | "contexto" | "seguimiento",
              texto: ins.texto as string,
              producto_sugerido: ins.producto_sugerido as string | undefined,
              confianza: (ins.confianza as number) ?? 0,
              fase: ins.fase as "conversacion" | "simulacion" | "presentacion",
              señal_detectada: ins.señal_detectada as string | undefined,
              contexto_seguimiento: ins.contexto_seguimiento as string | undefined,
              accion_sugerida: ins.accion_sugerida as string | undefined,
            });
          }
        }
      }
    }).catch(() => {
      // Reconstruction is best-effort; never block the UI
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagnosticoId]);

  // Generate opportunities from captured data on mount + save to CRM
  useEffect(() => {
    const storeSnapshot = { perfil, flujoMensual, patrimonio, retiro, proteccion };

    // Also check session insights for transcript-based keywords
    const transcriptInsights = sesion_insights
      .filter((i) => i.tipo === "oportunidad")
      .map((i) => i.texto)
      .join(" ");

    void detectarOportunidades(transcriptInsights, [], storeSnapshot).then((combined) => {
      opsRef.current = combined;
      setOpportunities(combined);

      for (const op of combined) {
        const alreadyRecorded = sesion_insights.some(
          (si) => si.tipo === "oportunidad" && si.producto_sugerido === op.producto_sugerido
        );
        if (!alreadyRecorded) {
          addSessionInsight({
            tipo: "oportunidad",
            texto: `${op.oportunidad}: ${op.razon}`,
            producto_sugerido: op.producto_sugerido,
            confianza: op.confianza,
            fase: "presentacion",
            clienteId: clienteId ?? undefined,
          });
        }
      }

      // Persist to local snapshot (survives navigation + session resets)
      if (clienteId && combined.length > 0) {
        agregarOportunidadesSnapshot(
          clienteId,
          combined.map((op) => ({
            id: op.id,
            titulo: op.oportunidad,
            descripcion: op.razon,
            producto_sugerido: op.producto_sugerido,
            categoria: op.categoria,
            prioridad: op.prioridad,
            confianza: op.confianza,
            estado: "pendiente" as const,
            created_at: op.detected_at,
          }))
        );
      }

      // Persist opportunities to CRM backend if a client is linked
      if (clienteId && combined.length > 0) {
        void bulkCreateOportunidades(
          clienteId,
          combined.map((op) => ({
            tipo: "oportunidad" as const,
            categoria: op.categoria,
            prioridad: op.prioridad,
            fuente: op.fuente ?? "datos",
            titulo: op.oportunidad,
            descripcion: op.razon,
            producto_sugerido: op.producto_sugerido,
            señal_detectada: op.señal_detectada,
            contexto_seguimiento: op.contexto_seguimiento,
            accion_sugerida: op.accion_sugerida,
            confianza: op.confianza,
          })),
          diagnosticoId  // passed as query param ?diagnostico_id=...
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Silent listening during presentation for additional keyword opportunities
  const onTranscript = useCallback(
    (lines: TranscriptLine[]) => {
      const finals = lines.filter((l) => l.isFinal);
      if (finals.length === 0) return;
      const speakers = new Set(finals.map((l) => l.speaker));
      const recent =
        speakers.size >= 2
          ? finals.filter((l) => l.speaker === 1).slice(-3)
          : finals.slice(-3);
      if (recent.length === 0) return;

      const text = recent.map((l) => l.text).join(" ");
      const storeSnapshot = { perfil, flujoMensual, patrimonio, retiro, proteccion };
      void detectarOportunidades(text, opsRef.current, storeSnapshot).then((ops) => {
        const newOps = ops.filter(
          (o) => !opsRef.current.some((e) => e.oportunidad === o.oportunidad)
        );
        opsRef.current = ops;
        setOpportunities(ops);
        for (const op of newOps) {
          addSessionInsight({
            tipo: "oportunidad",
            texto: `${op.oportunidad}: ${op.razon}`,
            producto_sugerido: op.producto_sugerido,
            confianza: op.confianza,
            fase: "simulacion",
            clienteId: clienteId ?? undefined,
          });
        }
      });
    },
    [addSessionInsight, perfil, flujoMensual, patrimonio, retiro, proteccion]
  );

  const { isRecording, startRecording, stopRecording } = useDeepgram(onTranscript);

  // Cleanup only — do NOT auto-start: user explicitly stopped voice when clicking "Generar Balance"
  useEffect(() => {
    return () => {
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const nombre = perfil?.nombre || "Cliente";

  // Agrupar por cluster
  const clusterMap = useMemo(() => {
    const map: Record<string, Oportunidad[]> = {};
    for (const op of opportunities) {
      const key = (op.tipo === "gancho_conversacion") ? "gancho_conversacion" : (op.categoria ?? "seguimiento");
      if (!map[key]) map[key] = [];
      map[key].push(op);
    }
    return map;
  }, [opportunities]);

  // Solo clusters con items, en el orden definido
  const activeClusters = useMemo(
    () => CLUSTER_DEFS.filter((c) => (clusterMap[c.key]?.length ?? 0) > 0),
    [clusterMap]
  );

  // ── Salud Financiera motors ───────────────────────────────────
  const motorA = useMemo(
    () => flujoMensual ? calcularMotorA({ ...flujoMensual, liquidez: patrimonio?.liquidez ?? 0 }) : null,
    [flujoMensual, patrimonio]
  );
  const motorB = useMemo(
    () => patrimonio && flujoMensual
      ? calcularMotorB({
          liquidez: patrimonio.liquidez, inversiones: patrimonio.inversiones,
          dotales: patrimonio.dotales, afore: patrimonio.afore, ppr: patrimonio.ppr,
          plan_privado: patrimonio.plan_privado, seguros_retiro: patrimonio.seguros_retiro,
          edad: perfil?.edad ?? 50,
          gastos_basicos: flujoMensual.gastos_basicos, obligaciones: flujoMensual.obligaciones,
          creditos: flujoMensual.creditos,
        })
      : null,
    [patrimonio, flujoMensual, perfil]
  );
  const motorE = useMemo(
    () => patrimonio
      ? calcularMotorE({
          liquidez: patrimonio.liquidez, inversiones: patrimonio.inversiones,
          dotales: patrimonio.dotales, afore: patrimonio.afore, ppr: patrimonio.ppr,
          plan_privado: patrimonio.plan_privado, seguros_retiro: patrimonio.seguros_retiro,
          casa: patrimonio.casa, inmuebles_renta: patrimonio.inmuebles_renta,
          tierra: patrimonio.tierra, negocio: patrimonio.negocio, herencia: patrimonio.herencia,
          hipoteca: patrimonio.hipoteca, saldo_planes: 0, compromisos: 0,
        })
      : null,
    [patrimonio]
  );
  const motorF = useMemo(() => {
    if (!motorE || !proteccion || !perfil) return null;
    const inmuebles_total = (patrimonio?.casa ?? 0) + (patrimonio?.inmuebles_renta ?? 0) + (patrimonio?.tierra ?? 0);
    return calcularMotorF({
      seguro_vida: proteccion.seguro_vida ?? false,
      propiedades_aseguradas: proteccion.propiedades_aseguradas,
      sgmm: proteccion.sgmm ?? false,
      dependientes: perfil.dependientes ?? false,
      patrimonio_neto: motorE.patrimonio_neto,
      inmuebles_total,
      edad: perfil.edad,
    });
  }, [motorE, proteccion, perfil, patrimonio]);

  const motorCBase = useMemo(() => {
    if (!perfil || !retiro || !patrimonio || !flujoMensual) return null;
    const patrimonioFin = (patrimonio.liquidez ?? 0) + (patrimonio.inversiones ?? 0) + (patrimonio.dotales ?? 0);
    return calcularMotorC({
      patrimonio_financiero_total: patrimonioFin,
      saldo_esquemas: (patrimonio.afore ?? 0) + (patrimonio.ppr ?? 0) + (patrimonio.plan_privado ?? 0) + (patrimonio.seguros_retiro ?? 0),
      ley_73: patrimonio.ley_73,
      rentas: flujoMensual.rentas,
      edad: perfil.edad,
      edad_retiro: retiro.edad_retiro,
      edad_defuncion: retiro.edad_defuncion,
      mensualidad_deseada: retiro.mensualidad_deseada,
    });
  }, [perfil, retiro, patrimonio, flujoMensual]);

  const saludBase = useMemo(
    () => calcularSaludFinanciera({
      motorA, motorB, motorC: motorCBase, motorE, motorF,
      patrimonio: patrimonio
        ? { casa: patrimonio.casa, inmuebles_renta: patrimonio.inmuebles_renta, tierra: patrimonio.tierra, negocio: patrimonio.negocio, herencia: patrimonio.herencia }
        : null,
      proteccion: proteccion ?? null,
      perfil: perfil ? { dependientes: perfil.dependientes } : null,
    }),
    [motorA, motorB, motorCBase, motorE, motorF, patrimonio, proteccion, perfil]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060D1A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#E8C872] flex items-center justify-center animate-pulse">
            <span className="text-[#060D1A] text-xl font-bold">A</span>
          </div>
          <h2 className="text-xl font-bold text-[#F0F4FA] mb-2">
            ArIA está componiendo tu Balance Patrimonial...
          </h2>
          <p className="text-sm text-[#8B9BB4]">
            Procesando datos de {nombre}
          </p>
          <div className="flex gap-1 justify-center mt-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-[#C9A84C] animate-bounce"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const nombreInitials = nombre
    .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const edad = perfil?.edad ?? 0;
  const ocupacion = perfil?.ocupacion ?? "";
  const patrimonioTotal =
    (patrimonio?.liquidez ?? 0) +
    (patrimonio?.inversiones ?? 0) +
    (patrimonio?.dotales ?? 0) +
    (patrimonio?.casa ?? 0) +
    (patrimonio?.negocio ?? 0);
  const formatMXN = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${Math.round(n / 1_000)}k`
        : `$${n.toLocaleString("es-MX")}`;

  const premiumHref = `/diagnosticos/${diagnosticoId}/presentacion-b${clienteId ? `?clienteId=${encodeURIComponent(clienteId)}` : ""}`;

  return (
    <div className="min-h-screen bg-[#060D1A] pb-24 sm:pb-20">
      {/* Slide-over menu (acciones secundarias) */}
      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-[2px]"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="fixed top-0 left-0 bottom-0 z-[70] w-[min(20rem,88vw)] flex flex-col border-r border-white/[0.08] shadow-2xl"
            style={{ background: "rgba(12,24,41,0.98)", backdropFilter: "blur(16px)" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-[#F0F4FA] font-semibold text-sm">Más acciones</span>
              <button
                type="button"
                className="p-2 rounded-lg text-[#8B9BB4] hover:text-[#F0F4FA] hover:bg-white/[0.06]"
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
              <Link
                href={`/diagnosticos/${diagnosticoId}/sesion${clienteId ? `?clienteId=${encodeURIComponent(clienteId)}` : ""}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#F0F4FA] hover:bg-white/[0.06]"
                onClick={() => setMenuOpen(false)}
              >
                <Phone className="w-4 h-4 text-[#C9A84C] shrink-0" />
                Volver a la sesión
              </Link>
              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#F0F4FA] hover:bg-white/[0.06] w-full text-left"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/dashboard");
                }}
              >
                <Home className="w-4 h-4 text-[#C9A84C] shrink-0" />
                Inicio
              </button>
              {clienteId && (
                <Link
                  href={`/crm/${clienteId}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#F0F4FA] hover:bg-white/[0.06]"
                  onClick={() => setMenuOpen(false)}
                >
                  <User className="w-4 h-4 text-[#C9A84C] shrink-0" />
                  Ver perfil en CRM
                </Link>
              )}
              <Link
                href={`/diagnosticos/${diagnosticoId}/paso/1${clienteId ? `?clienteId=${encodeURIComponent(clienteId)}` : ""}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#F0F4FA] hover:bg-white/[0.06]"
                onClick={() => setMenuOpen(false)}
              >
                <PenLine className="w-4 h-4 text-[#C9A84C] shrink-0" />
                Editar / completar datos
              </Link>
              <button
                type="button"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#F0F4FA] hover:bg-white/[0.06] w-full text-left"
                onClick={() => {
                  setMenuOpen(false);
                  if (isRecording) stopRecording();
                  router.push(`/diagnosticos/${diagnosticoId}/completado${clienteId ? `?clienteId=${encodeURIComponent(clienteId)}` : ""}`);
                }}
              >
                <CalendarCheck className="w-4 h-4 text-[#C9A84C] shrink-0" />
                Agendar seguimiento
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Top bar */}
      <header
        className="sticky top-0 z-50 flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-white/[0.06]"
        style={{
          background: "rgba(6,13,26,0.9)",
          backdropFilter: "blur(20px)",
        }}
      >
        <button
          type="button"
          className="shrink-0 p-2 rounded-lg text-[#8B9BB4] hover:text-[#F0F4FA] hover:bg-white/[0.06] border border-white/[0.08]"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-[#F0F4FA] font-bold text-base sm:text-lg truncate min-w-0 flex-1">
          Balance Patrimonial de {nombre}
        </h1>
      </header>

      {/* Client summary card */}
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-6">
        <div
          className="rounded-2xl border border-white/[0.08] p-5 flex flex-col sm:flex-row sm:items-center gap-5"
          style={{ background: "rgba(12,24,41,0.6)", backdropFilter: "blur(12px)" }}
        >
          {/* Avatar + name */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-[#C9A84C]/30 to-[#C9A84C]/10 border-2 border-[#C9A84C]/30 flex items-center justify-center">
              <span className="text-[#C9A84C] font-bold text-lg">{nombreInitials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[#F0F4FA] font-bold text-base leading-tight truncate">{nombre}</p>
              <p className="text-[#8B9BB4] text-sm mt-0.5">
                {edad > 0 ? `${edad} años` : ""}
                {edad > 0 && ocupacion ? " · " : ""}
                {ocupacion}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-4 shrink-0 flex-wrap">
            {patrimonioTotal > 0 && (
              <div className="text-center">
                <p className="text-[10px] text-[#5A6A85] uppercase tracking-wider font-semibold">Patrimonio</p>
                <p className="text-[#C9A84C] font-bold text-sm">{formatMXN(patrimonioTotal)}</p>
              </div>
            )}
            {flujoMensual?.ahorro != null && flujoMensual.ahorro > 0 && (
              <div className="text-center">
                <p className="text-[10px] text-[#5A6A85] uppercase tracking-wider font-semibold">Ingreso/mes</p>
                <p className="text-[#10B981] font-bold text-sm">{formatMXN(flujoMensual.ahorro)}</p>
              </div>
            )}
            {retiro?.edad_retiro && (
              <div className="text-center">
                <p className="text-[10px] text-[#5A6A85] uppercase tracking-wider font-semibold">Retiro</p>
                <p className="text-[#F0F4FA] font-bold text-sm">{retiro.edad_retiro} años</p>
              </div>
            )}
            {opportunities.length > 0 && (
              <div className="text-center">
                <p className="text-[10px] text-[#5A6A85] uppercase tracking-wider font-semibold">Oportunidades</p>
                <p className="text-[#8B5CF6] font-bold text-sm">{opportunities.length}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero: Financial Timeline */}
      {perfil && retiro && patrimonio && flujoMensual && (
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-8">
          <Card>
            <FinancialTimeline
              edadActual={perfil.edad}
              edadRetiro={retiro.edad_retiro}
              edadDefuncion={retiro.edad_defuncion}
              patrimonioActual={
                (patrimonio.liquidez ?? 0) +
                (patrimonio.inversiones ?? 0) +
                (patrimonio.dotales ?? 0)
              }
              ahorroMensual={flujoMensual.ahorro}
              pensionMensual={
                (() => {
                  const mc = calcularMotorC({
                    patrimonio_financiero_total:
                      (patrimonio.liquidez ?? 0) + (patrimonio.inversiones ?? 0) + (patrimonio.dotales ?? 0),
                    saldo_esquemas:
                      (patrimonio.afore ?? 0) + (patrimonio.ppr ?? 0) +
                      (patrimonio.plan_privado ?? 0) + (patrimonio.seguros_retiro ?? 0),
                    ley_73: patrimonio.ley_73,
                    rentas: flujoMensual.rentas,
                    edad: perfil.edad,
                    edad_retiro: retiro.edad_retiro,
                    edad_defuncion: retiro.edad_defuncion,
                    mensualidad_deseada: retiro.mensualidad_deseada,
                  });
                  return mc.pension_total_mensual;
                })()
              }
              rentasMensuales={flujoMensual.rentas}
              mensualidadDeseada={retiro.mensualidad_deseada}
              modo="presentacion"
              showMetrics={true}
            />
          </Card>
        </div>
      )}

      {/* SALUD FINANCIERA RADAR */}
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-8">
        <Card>
          <RadarSaludFinanciera base={saludBase} />
        </Card>
      </div>

      {/* OPORTUNIDADES SECTION */}
      {opportunities.length > 0 && (
        <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 pt-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#E8C872] flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-[#060D1A]" />
                </div>
                <div>
                  <h2 className="font-bold text-xl text-[#F0F4FA]">
                    Oportunidades detectadas
                  </h2>
                  <p className="text-sm text-[#8B9BB4]">
                    {opportunities.filter(o => o.tipo !== "gancho_conversacion").length} oportunidades · {opportunities.filter(o => o.tipo === "gancho_conversacion").length} ganchos de conexión para {nombre}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {opportunities.filter(o => o.prioridad === "alta" && o.tipo !== "gancho_conversacion").length > 0 && (
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                    {opportunities.filter(o => o.prioridad === "alta" && o.tipo !== "gancho_conversacion").length} prioridad alta
                  </span>
                )}
              </div>
            </div>

            {/* 3-column cluster grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeClusters.map((cluster) => (
                <ClusterCard
                  key={cluster.key}
                  cluster={cluster}
                  ops={clusterMap[cluster.key] ?? []}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content — command center layout */}
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <OutputPanel variant="full" />
      </div>

      {/* Barra principal: solo las 5 acciones solicitadas */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] px-3 py-2 sm:px-4 sm:py-3"
        style={{ background: "rgba(6,13,26,0.95)", backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-stretch justify-center gap-2 sm:gap-2">
          <Button
            variant="accent"
            size="sm"
            className="flex-1 min-w-[140px] sm:min-w-0 sm:flex-initial gap-1.5 text-[11px] sm:text-xs"
            onClick={() => {
              generarBalancePDF(
                nombre,
                isApiMode && diagnosticoId
                  ? { diagnosticoId, token: getAccessToken() ?? undefined }
                  : undefined
              );
              if (clienteId) {
                void registrarBalanceGenerado(clienteId, diagnosticoId, "pdf");
              }
            }}
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Descargar Balance Patrimonial</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 min-w-[120px] sm:min-w-0 sm:flex-initial gap-1.5 text-[11px] sm:text-xs"
            onClick={() => {
              if (isRecording) stopRecording();
              if (clienteId) void registrarBalanceGenerado(clienteId, diagnosticoId, "compartido");
              router.push(`/diagnosticos/${diagnosticoId}/completado${clienteId ? `?clienteId=${encodeURIComponent(clienteId)}` : ""}`);
            }}
          >
            <Share className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Compartir con el cliente</span>
          </Button>
          <Link href={premiumHref} className="flex-1 min-w-[120px] sm:min-w-0 sm:flex-initial">
            <Button variant="secondary" size="sm" className="w-full gap-1.5 text-[11px] sm:text-xs">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Presentación premium</span>
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 min-w-[120px] sm:min-w-0 sm:flex-initial gap-1.5 text-[11px] sm:text-xs"
            onClick={() => {
              if (isRecording) stopRecording();
              router.push(`/diagnosticos/${diagnosticoId}/simulador${clienteId ? `?clienteId=${encodeURIComponent(clienteId)}` : ""}`);
            }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Simular escenarios</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 min-w-[120px] sm:min-w-0 sm:flex-initial gap-1.5 text-[11px] sm:text-xs"
            onClick={() => router.push("/dashboard")}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Mis clientes</span>
          </Button>
        </div>
      </div>


      {/* Hidden PDF template */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          pointerEvents: "none",
          opacity: 0,
          zIndex: -1,
        }}
      >
        <BalancePDFTemplate />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cluster Card — colapsable                                          */
/* ------------------------------------------------------------------ */

function ClusterCard({ cluster, ops }: { cluster: ClusterDef; ops: Oportunidad[] }) {
  const [open, setOpen] = useState(true);
  const { Icon, label, bg, border, text, headerBg, isGancho } = cluster;
  const highCount = ops.filter((o) => o.prioridad === "alta").length;

  return (
    <div
      className={`rounded-2xl border ${border} ${bg} overflow-hidden transition-all duration-300`}
      style={{ backdropFilter: "blur(8px)" }}
    >
      {/* Cluster header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 ${headerBg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4 h-4 ${text} shrink-0`} />
          <span className={`font-bold text-sm ${text}`}>{label}</span>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${text} border border-current/20`}
            style={{ backgroundColor: "color-mix(in srgb, currentColor 12%, transparent)" }}
          >
            {ops.length}
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
        <ChevronDown
          className={`w-4 h-4 ${text} transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Ops list */}
      <div
        className={`transition-all duration-300 overflow-hidden ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="divide-y divide-white/[0.04]">
          {ops.map((op) =>
            isGancho || op.tipo === "gancho_conversacion" ? (
              <GanchoItem key={op.id} op={op} />
            ) : (
              <OpportunityItem key={op.id} op={op} />
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Opportunity Item — compacto, dentro de cluster                    */
/* ------------------------------------------------------------------ */

function OpportunityItem({ op }: { op: Oportunidad }) {
  const [expanded, setExpanded] = useState(false);
  const colors = CAT_COLORS[op.categoria] ?? CAT_COLORS.proteccion;
  const pri = PRI_BADGE[op.prioridad] ?? PRI_BADGE.media;
  const Icon = CAT_ICONS[op.categoria] ?? Lightbulb;
  const hasDetails = !!(op.señal_detectada || op.accion_sugerida || op.contexto_seguimiento);

  return (
    <div className="px-4 py-3 group hover:bg-white/[0.02] transition-colors">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`shrink-0 mt-0.5 w-7 h-7 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[#F0F4FA] font-semibold text-xs leading-snug">
              {op.oportunidad}
              {op.fuente === "ai" && (
                <span className="ml-1.5 px-1 py-0.5 text-[8px] font-bold rounded bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/20 align-middle">
                  AI
                </span>
              )}
            </p>
            <span className={`shrink-0 px-1.5 py-0.5 text-[9px] font-semibold rounded-full border ${pri.cls}`}>
              {pri.label}
            </span>
          </div>

          <p className="text-[11px] text-[#8B9BB4] leading-relaxed line-clamp-2">
            {op.razon}
          </p>

          {op.producto_sugerido && op.producto_sugerido !== "—" && (
            <p className="text-[10px] font-semibold text-[#C9A84C]">
              {op.producto_sugerido}
            </p>
          )}

          {/* Expandable details */}
          {hasDetails && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[10px] text-[#5A6A85] hover:text-[#8B9BB4] transition-colors mt-1"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
              {expanded ? "Menos detalle" : "Ver detalle"}
            </button>
          )}

          {expanded && (
            <div className="space-y-2 pt-1">
              {op.señal_detectada && (
                <div className="rounded-lg bg-[#1A3154]/40 border-l-2 border-[#8B5CF6]/40 px-2.5 py-1.5">
                  <p className="text-[9px] text-[#5A6A85] uppercase tracking-wider font-semibold mb-0.5">Señal detectada</p>
                  <p className="text-[10px] text-[#B4BED0] italic leading-relaxed">
                    &ldquo;{op.señal_detectada}&rdquo;
                  </p>
                </div>
              )}
              {op.accion_sugerida && (
                <div className="flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 text-[#10B981] mt-0.5 shrink-0" />
                  <p className="text-[10px] text-[#10B981] font-medium leading-relaxed">
                    {op.accion_sugerida}
                  </p>
                </div>
              )}
              {op.contexto_seguimiento && (
                <div className="rounded-lg bg-[#0C1829] border border-white/[0.04] px-2.5 py-1.5">
                  <p className="text-[9px] text-[#5A6A85] uppercase tracking-wider font-semibold mb-0.5">Contexto</p>
                  <p className="text-[10px] text-[#8B9BB4] leading-relaxed">
                    {op.contexto_seguimiento}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Gancho Item — estilo cálido, para conexión personal               */
/* ------------------------------------------------------------------ */

function GanchoItem({ op }: { op: Oportunidad }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-4 py-3 group hover:bg-[#C9A84C]/[0.03] transition-colors">
      <div className="flex items-start gap-3">
        {/* Emoji icon */}
        <div className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center text-sm">
          {op.icono || "💬"}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-[#E8C872] font-semibold text-xs leading-snug">
            {op.oportunidad}
          </p>

          {op.señal_detectada && (
            <p className="text-[11px] text-[#8B9BB4] italic leading-relaxed">
              &ldquo;{op.señal_detectada}&rdquo;
            </p>
          )}

          {op.accion_sugerida && (
            <div className="rounded-lg bg-[#C9A84C]/8 border border-[#C9A84C]/15 px-2.5 py-1.5 mt-1.5">
              <p className="text-[9px] text-[#C9A84C] uppercase tracking-wider font-semibold mb-0.5">Cómo usarlo</p>
              <p className="text-[10px] text-[#D4B86A] leading-relaxed">
                {op.accion_sugerida}
              </p>
            </div>
          )}

          {(op.contexto_seguimiento || op.razon) && (
            <>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-[10px] text-[#5A6A85] hover:text-[#C9A84C] transition-colors mt-1"
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
                {expanded ? "Ocultar contexto" : "Ver contexto"}
              </button>
              {expanded && (
                <div className="rounded-lg bg-[#0C1829] border border-[#C9A84C]/10 px-2.5 py-1.5 mt-1">
                  <p className="text-[10px] text-[#8B9BB4] leading-relaxed">
                    {op.contexto_seguimiento || op.razon}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
