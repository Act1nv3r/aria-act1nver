"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { NaviSuggestionCard } from "./navi-suggestion";
import { NaviChecklist, type DataCategory } from "./navi-checklist";
import { NaviOpportunities } from "./navi-opportunities";
import { NaviAlert } from "./navi-alert";
import {
  generarSugerenciaNavi,
  getDatosFaltantes,
  type NaviSuggestion,
} from "@/lib/navi-engine";
import { detectarOportunidades, type Oportunidad } from "@/lib/navi-opportunities";

interface NaviPanelProps {
  transcripcion: string;
  sesionMinutos: number;
  maxMinutos?: number;
}

export function NaviPanel({
  transcripcion,
  sesionMinutos,
  maxMinutos = 20,
}: NaviPanelProps) {
  const store = useDiagnosticoStore();
  const [suggestion, setSuggestion] = useState<NaviSuggestion | null>(null);
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([]);
  const opsRef = useRef<Oportunidad[]>([]);

  const datosFaltantes = getDatosFaltantes({
    perfil: store.perfil,
    flujoMensual: store.flujoMensual,
    patrimonio: store.patrimonio,
    retiro: store.retiro,
    proteccion: store.proteccion,
  });

  const fetchSuggestion = useCallback(async () => {
    const result = await generarSugerenciaNavi({
      transcripcion,
      datosRecopilados: {
        ...(store.perfil ?? {}),
        ...(store.flujoMensual ?? {}),
        ...(store.patrimonio ?? {}),
        ...(store.retiro ?? {}),
        ...(store.proteccion ?? {}),
      },
      datosFaltantes,
      contextoCliente: {
        edad: store.perfil?.edad,
        ocupacion: store.perfil?.ocupacion,
        dependientes: store.perfil?.dependientes,
        nombre: store.perfil?.nombre,
      },
    });
    setSuggestion(result);
  }, [transcripcion, datosFaltantes, store.perfil, store.flujoMensual, store.patrimonio, store.retiro, store.proteccion]);

  const fetchOpportunities = useCallback(async () => {
    const result = await detectarOportunidades(transcripcion, opsRef.current);
    opsRef.current = result;
    setOportunidades(result);
  }, [transcripcion]);

  useEffect(() => {
    fetchSuggestion();
    const interval = setInterval(fetchSuggestion, 15_000);
    return () => clearInterval(interval);
  }, [fetchSuggestion]);

  useEffect(() => {
    fetchOpportunities();
    const interval = setInterval(fetchOpportunities, 30_000);
    return () => clearInterval(interval);
  }, [fetchOpportunities]);

  const categories: DataCategory[] = [
    {
      id: "perfil",
      nombre: "Perfil",
      icono: "👤",
      fields: [
        { nombre: "Nombre", campo: "nombre", valor: store.perfil?.nombre, completado: !!store.perfil?.nombre },
        { nombre: "Edad", campo: "edad", valor: store.perfil?.edad, completado: (store.perfil?.edad ?? 18) !== 18 },
        { nombre: "Género", campo: "genero", valor: store.perfil?.genero, completado: !!store.perfil?.genero },
        { nombre: "Ocupación", campo: "ocupacion", valor: store.perfil?.ocupacion, completado: !!store.perfil?.ocupacion },
        { nombre: "Dependientes", campo: "dependientes", valor: store.perfil?.dependientes, completado: store.perfil?.dependientes !== undefined },
      ],
    },
    {
      id: "flujo",
      nombre: "Flujo mensual",
      icono: "💰",
      fields: [
        { nombre: "Ahorro", campo: "ahorro", valor: store.flujoMensual?.ahorro, completado: (store.flujoMensual?.ahorro ?? 0) > 0 },
        { nombre: "Rentas", campo: "rentas", valor: store.flujoMensual?.rentas, completado: (store.flujoMensual?.rentas ?? 0) > 0 },
        { nombre: "Gastos básicos", campo: "gastos_basicos", valor: store.flujoMensual?.gastos_basicos, completado: (store.flujoMensual?.gastos_basicos ?? 0) > 0 },
        { nombre: "Obligaciones", campo: "obligaciones", valor: store.flujoMensual?.obligaciones, completado: (store.flujoMensual?.obligaciones ?? 0) > 0 },
        { nombre: "Otros ingresos", campo: "otros", valor: store.flujoMensual?.otros, completado: (store.flujoMensual?.otros ?? 0) > 0 },
        { nombre: "Créditos", campo: "creditos", valor: store.flujoMensual?.creditos, completado: (store.flujoMensual?.creditos ?? 0) > 0 },
      ],
    },
    {
      id: "patrimonio_fin",
      nombre: "Patrimonio financiero",
      icono: "🏦",
      fields: [
        { nombre: "Liquidez", campo: "liquidez", valor: store.patrimonio?.liquidez, completado: (store.patrimonio?.liquidez ?? 0) > 0 },
        { nombre: "Inversiones", campo: "inversiones", valor: store.patrimonio?.inversiones, completado: (store.patrimonio?.inversiones ?? 0) > 0 },
        { nombre: "Dotales", campo: "dotales", valor: store.patrimonio?.dotales, completado: (store.patrimonio?.dotales ?? 0) > 0 },
      ],
    },
    {
      id: "retiro",
      nombre: "Esquemas retiro",
      icono: "🏖️",
      fields: [
        { nombre: "Afore", campo: "afore", valor: store.patrimonio?.afore, completado: (store.patrimonio?.afore ?? 0) > 0 },
        { nombre: "PPR", campo: "ppr", valor: store.patrimonio?.ppr, completado: (store.patrimonio?.ppr ?? 0) > 0 },
        { nombre: "Plan privado", campo: "plan_privado", valor: store.patrimonio?.plan_privado, completado: (store.patrimonio?.plan_privado ?? 0) > 0 },
        { nombre: "Seguros retiro", campo: "seguros_retiro", valor: store.patrimonio?.seguros_retiro, completado: (store.patrimonio?.seguros_retiro ?? 0) > 0 },
        { nombre: "Ley 73", campo: "ley_73", valor: store.patrimonio?.ley_73, completado: store.patrimonio?.ley_73 !== null && store.patrimonio?.ley_73 !== undefined },
      ],
    },
    {
      id: "no_financiero",
      nombre: "No financiero",
      icono: "🏠",
      fields: [
        { nombre: "Casa", campo: "casa", valor: store.patrimonio?.casa, completado: (store.patrimonio?.casa ?? 0) > 0 },
        { nombre: "Inmuebles renta", campo: "inmuebles_renta", valor: store.patrimonio?.inmuebles_renta, completado: (store.patrimonio?.inmuebles_renta ?? 0) > 0 },
        { nombre: "Tierra", campo: "tierra", valor: store.patrimonio?.tierra, completado: (store.patrimonio?.tierra ?? 0) > 0 },
        { nombre: "Negocio", campo: "negocio", valor: store.patrimonio?.negocio, completado: (store.patrimonio?.negocio ?? 0) > 0 },
        { nombre: "Herencia", campo: "herencia", valor: store.patrimonio?.herencia, completado: (store.patrimonio?.herencia ?? 0) > 0 },
      ],
    },
    {
      id: "proteccion",
      nombre: "Protección",
      icono: "🛡️",
      fields: [
        { nombre: "Seguro de vida", campo: "seguro_vida", valor: store.proteccion?.seguro_vida, completado: !!store.proteccion?.seguro_vida },
        { nombre: "Propiedades aseguradas", campo: "propiedades_aseguradas", valor: store.proteccion?.propiedades_aseguradas, completado: store.proteccion?.propiedades_aseguradas !== null },
        { nombre: "SGMM", campo: "sgmm", valor: store.proteccion?.sgmm, completado: !!store.proteccion?.sgmm },
      ],
    },
  ];

  const minutosRestantes = maxMinutos - sesionMinutos;
  const categoriasFaltantes = categories
    .filter((c) => c.fields.some((f) => !f.completado))
    .map((c) => c.nombre);

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-4">
      {/* Navi suggestion */}
      <NaviSuggestionCard
        suggestion={suggestion}
        onSkip={fetchSuggestion}
      />

      {/* Data checklist */}
      <div className="bg-[#0C1829] border border-white/[0.06] rounded-[14px] p-4">
        <NaviChecklist categories={categories} />
      </div>

      {/* Opportunities */}
      <NaviOpportunities oportunidades={oportunidades} />

      {/* Alert for missing critical data */}
      <NaviAlert
        faltantes={categoriasFaltantes}
        minutosRestantes={minutosRestantes}
      />
    </div>
  );
}
