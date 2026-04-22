"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api-client";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isDiagnosticoId(id: string | null | undefined): boolean {
  return !!id && id !== "demo" && UUID_REGEX.test(id);
}

const DiagnosticoContext = createContext<{ diagnosticoId: string | null; isApiMode: boolean }>({
  diagnosticoId: null,
  isApiMode: false,
});

export function useDiagnosticoId() {
  return useContext(DiagnosticoContext);
}

export function DiagnosticoProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const id = pathname?.split("/diagnosticos/")[1]?.split("/")[0] || null;
  const isApiMode = isDiagnosticoId(id);
  const [loading, setLoading] = useState(isApiMode);
  const prevIdRef = useRef<string | null>(null);
  const reset = useDiagnosticoStore((s) => s.reset);
  const setModo = useDiagnosticoStore((s) => s.setModo);
  const setPaso = useDiagnosticoStore((s) => s.setPaso);
  const {
    updatePerfil,
    updateFlujoMensual,
    updatePatrimonio,
    updateRetiro,
    updateObjetivos,
    updateProteccion,
  } = useDiagnosticoStore();

  useEffect(() => {
    if (!isApiMode || !id) {
      prevIdRef.current = null;
      setLoading(false);
      return;
    }
    if (prevIdRef.current !== id) {
      reset();
      prevIdRef.current = id;
    }
    setLoading(true);
    api.diagnosticos
      .get(id)
      .then((d) => {
        setModo(d.modo === "pareja" ? "pareja" : "individual");
        const paso = Math.min(6, Math.max(1, Number(d.paso_actual ?? 1)));
        setPaso(paso);
        useDiagnosticoStore.setState({
          pasosCompletados: Array.from({ length: paso }, (_, i) => i + 1),
        });
        if (d.perfil) {
          const p = d.perfil as Record<string, unknown>;
          updatePerfil({
            nombre: String(p.nombre ?? ""),
            edad: Number(p.edad ?? 50),
            genero: String(p.genero ?? "H"),
            ocupacion: String(p.ocupacion ?? "asalariado"),
            dependientes: Boolean(p.dependientes),
          });
        }
        if (d.flujoMensual) {
          const f = d.flujoMensual as Record<string, unknown>;
          updateFlujoMensual({
            ahorro: Number(f.ahorro ?? 0),
            rentas: Number(f.rentas ?? 0),
            otros: Number(f.otros ?? 0),
            gastos_basicos: Number(f.gastos_basicos ?? 0),
            obligaciones: Number(f.obligaciones ?? 0),
            creditos: Number(f.creditos ?? 0),
          });
        }
        if (d.patrimonio) {
          const p = d.patrimonio as Record<string, unknown>;
          updatePatrimonio({
            liquidez: Number(p.liquidez ?? 0),
            inversiones: Number(p.inversiones ?? 0),
            dotales: Number(p.dotales ?? 0),
            afore: Number(p.afore ?? 0),
            ppr: Number(p.ppr ?? 0),
            plan_privado: Number(p.plan_privado ?? 0),
            seguros_retiro: Number(p.seguros_retiro ?? 0),
            ley_73: p.ley_73 != null ? Number(p.ley_73) : null,
            casa: Number(p.casa ?? 0),
            inmuebles_renta: Number(p.inmuebles_renta ?? 0),
            tierra: Number(p.tierra ?? 0),
            negocio: Number(p.negocio ?? 0),
            herencia: Number(p.herencia ?? 0),
            hipoteca: Number(p.hipoteca ?? 0),
            saldo_planes: Number(p.saldo_planes ?? 0),
            compromisos: Number(p.compromisos ?? 0),
          });
        }
        if (d.retiro) {
          const r = d.retiro as Record<string, unknown>;
          updateRetiro({
            edad_retiro: Number(r.edad_retiro ?? 60),
            mensualidad_deseada: Number(r.mensualidad_deseada ?? 0),
            edad_defuncion: Number(r.edad_defuncion ?? 90),
          });
        }
        if (d.objetivos) {
          const o = d.objetivos as Record<string, unknown>;
          const lista = (o.lista as Array<{ nombre: string; monto: number; plazo: number }>) ?? [];
          updateObjetivos({
            aportacion_inicial: Number(o.aportacion_inicial ?? 0),
            aportacion_mensual: Number(o.aportacion_mensual ?? 0),
            lista: lista.map((x) => ({ nombre: x.nombre, monto: x.monto, plazo: x.plazo })),
          });
        }
        if (d.proteccion) {
          const pr = d.proteccion as Record<string, unknown>;
          updateProteccion({
            // Preserve null so unanswered fields stay in "faltantes" and NLU keeps trying.
            // Boolean(null) = false would incorrectly mark the field as answered.
            seguro_vida: pr.seguro_vida == null ? null : Boolean(pr.seguro_vida),
            propiedades_aseguradas: pr.propiedades_aseguradas == null ? null : Boolean(pr.propiedades_aseguradas),
            sgmm: pr.sgmm == null ? null : Boolean(pr.sgmm),
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [
    id,
    isApiMode,
    reset,
    setModo,
    setPaso,
    updatePerfil,
    updateFlujoMensual,
    updatePatrimonio,
    updateRetiro,
    updateObjetivos,
    updateProteccion,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-[#5A6A85]">
        Cargando diagnóstico...
      </div>
    );
  }

  return (
    <DiagnosticoContext.Provider value={{ diagnosticoId: id, isApiMode }}>
      {children}
    </DiagnosticoContext.Provider>
  );
}
