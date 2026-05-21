"use client";

import { useMemo } from "react";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import {
  calcularMotorA,
  calcularMotorB,
  calcularMotorC,
  calcularMotorD,
  calcularMotorE,
  calcularMotorF,
} from "@/lib/motors";
import { ResumenEjecutivo } from "@/components/outputs/resumen-ejecutivo";
import { PlanAccionTable } from "@/components/outputs/plan-accion-table";
import { PatrimonioBreakdown } from "@/components/outputs/patrimonio-breakdown";
import { FlujoDisponibleSection } from "@/components/outputs/flujo-disponible-section";
import { PotencialBalanceSection } from "@/components/outputs/potencial-balance-section";
import { ProteccionDetallada } from "@/components/outputs/proteccion-detallada";
import { TrayectoriaFuentes } from "@/components/outputs/trayectoria-fuentes";
import { CriteriosTrayectoriaSection } from "@/components/outputs/criterios-trayectoria";

function SectionHeader({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-bold text-[#C9A84C]/70 uppercase tracking-widest mb-1">{label}</p>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-[#8899BB] mt-1">{subtitle}</p>}
      <div className="h-px bg-[#243555] mt-4" />
    </div>
  );
}

function Section({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="mb-16" style={{ scrollMarginTop: "60px" }}>
      {children}
    </div>
  );
}

export function BalanceResultsScreen() {
  const perfil = useDiagnosticoStore((s) => s.perfil);
  const flujoMensual = useDiagnosticoStore((s) => s.flujoMensual);
  const patrimonio = useDiagnosticoStore((s) => s.patrimonio);
  const retiro = useDiagnosticoStore((s) => s.retiro);
  const objetivos = useDiagnosticoStore((s) => s.objetivos);
  const proteccion = useDiagnosticoStore((s) => s.proteccion);
  const criterios = useDiagnosticoStore((s) => s.criterios_trayectoria);

  const motors = useMemo(() => {
    if (!perfil || !flujoMensual || !patrimonio) return null;

    const motorA = calcularMotorA({ ...flujoMensual, liquidez: patrimonio.liquidez });
    const motorB = calcularMotorB({
      liquidez: patrimonio.liquidez,
      inversiones: patrimonio.inversiones,
      dotales: patrimonio.dotales,
      afore: patrimonio.afore,
      ppr: patrimonio.ppr,
      plan_privado: patrimonio.plan_privado,
      seguros_retiro: patrimonio.seguros_retiro,
      edad: perfil.edad,
      gastos_basicos: flujoMensual.gastos_basicos,
      obligaciones: flujoMensual.obligaciones,
      creditos: flujoMensual.creditos,
    });
    const motorE = calcularMotorE(patrimonio);
    const patrimonioFin = patrimonio.liquidez + patrimonio.inversiones + patrimonio.dotales;

    const motorC = retiro
      ? calcularMotorC({
          liquidez: patrimonio.liquidez,
          inversiones: patrimonio.inversiones,
          dotales: patrimonio.dotales,
          afore: patrimonio.afore,
          ppr: patrimonio.ppr,
          plan_privado: patrimonio.plan_privado,
          seguros_retiro: patrimonio.seguros_retiro,
          ley_73: patrimonio.ley_73,
          rentas: flujoMensual.rentas,
          edad: perfil.edad,
          edad_retiro: retiro.edad_retiro,
          edad_defuncion: retiro.edad_defuncion,
          mensualidad_deseada: retiro.mensualidad_deseada,
        })
      : null;

    const motorD =
      retiro && objetivos
        ? calcularMotorD({
            aportacion_inicial: objetivos.aportacion_inicial,
            aportacion_mensual: objetivos.aportacion_mensual,
            lista: objetivos.lista,
            patrimonio_financiero: patrimonioFin,
            edad: perfil.edad,
            edad_retiro: retiro.edad_retiro,
            edad_defuncion: retiro.edad_defuncion,
          })
        : null;

    const motorF = proteccion
      ? calcularMotorF({
          seguro_vida: proteccion.seguro_vida ?? false,
          propiedades_aseguradas: proteccion.propiedades_aseguradas,
          sgmm: proteccion.sgmm ?? false,
          dependientes: perfil.dependientes ? 1 : 0,
          inversiones: patrimonio.inversiones,
          dotales: patrimonio.dotales,
          gastos_mensuales: flujoMensual.gastos_basicos + flujoMensual.obligaciones + flujoMensual.creditos,
          edad: perfil.edad,
          inmuebles_total: patrimonio.casa + patrimonio.inmuebles_renta,
          rentas_mensuales: flujoMensual.rentas,
        })
      : null;

    return { motorA, motorB, motorC, motorD, motorE, motorF };
  }, [perfil, flujoMensual, patrimonio, retiro, objetivos, proteccion]);

  if (!motors || !perfil || !flujoMensual || !patrimonio) {
    return (
      <div className="text-center py-20 text-[#4A5A75]">
        <p className="text-lg">Completa el diagnóstico para ver los resultados</p>
      </div>
    );
  }

  const { motorA, motorB, motorC, motorD, motorE, motorF } = motors;

  return (
    <div className="space-y-0">

      {/* C — Balance Patrimonial (primero — lo más importante para el cliente) */}
      <Section id="sec-patrimonio">
        <SectionHeader
          label="Balance General"
          title="Resultado del Diagnóstico Patrimonial"
          subtitle="Composición detallada de activos, pasivos y patrimonio neto"
        />
        <PatrimonioBreakdown patrimonio={patrimonio} motorE={motorE} />
      </Section>

      {/* A — Resumen Ejecutivo */}
      <Section id="sec-resumen">
        <SectionHeader
          label="Perspectiva Integral"
          title="Resumen Ejecutivo"
          subtitle="Panorama integral de tu situación patrimonial y financiera"
        />
        {motorC && (
          <ResumenEjecutivo
            motorB={motorB}
            motorC={motorC}
            motorE={motorE}
            motorD={motorD}
            perfil={perfil}
            objetivos={objetivos}
            mensualidad_deseada={retiro?.mensualidad_deseada ?? 0}
          />
        )}
      </Section>

      {/* D — Fuentes de Flujo Disponible */}
      <Section id="sec-flujo">
        <SectionHeader
          label="Flujo Mensual"
          title="Fuentes de Flujo Disponible"
          subtitle="Análisis de ingresos, gastos y rentabilidad de tus fuentes de flujo"
        />
        <FlujoDisponibleSection
          motorA={motorA}
          flujoMensual={flujoMensual}
          patrimonio={{ inmuebles_renta: patrimonio.inmuebles_renta, negocio: patrimonio.negocio }}
        />
      </Section>

      {/* G — Trayectoria Patrimonial */}
      {motorC && retiro && (
        <Section id="sec-retiro">
          <SectionHeader
            label="Proyección al Retiro"
            title="Trayectoria Patrimonial"
            subtitle="Proyección de ingresos en retiro por fuente y capital humano"
          />
          <TrayectoriaFuentes
            motorC={motorC}
            motorA={motorA}
            motorD={motorD}
            motorE={motorE}
            perfil={perfil}
            retiro={retiro}
          />
        </Section>
      )}

      {/* E — Potencial del Balance */}
      <Section id="sec-potencial">
        <SectionHeader
          label="Estructura Patrimonial"
          title="Potencial del Balance"
          subtitle="Solvencia, estructura patrimonial y distribución de activos"
        />
        <PotencialBalanceSection motorE={motorE} patrimonio={patrimonio} />
      </Section>

      {/* B — Plan de Acción */}
      <Section id="sec-plan">
        <SectionHeader
          label="Recomendaciones"
          title="Plan de Acción"
          subtitle="Situación actual, riesgo y recomendaciones por área patrimonial"
        />
        {motorC && (
          <PlanAccionTable
            motorA={motorA}
            motorB={motorB}
            motorC={motorC}
            motorE={motorE}
            proteccion={
              proteccion
                ? {
                    seguro_vida: proteccion.seguro_vida ?? false,
                    propiedades_aseguradas: proteccion.propiedades_aseguradas,
                    sgmm: proteccion.sgmm ?? false,
                  }
                : null
            }
            perfil={perfil ? { dependientes: perfil.dependientes ?? false, edad: perfil.edad } : null}
            patrimonio={
              patrimonio
                ? {
                    casa: patrimonio.casa,
                    tierra: patrimonio.tierra,
                    herencia: patrimonio.herencia,
                    inmuebles_renta: patrimonio.inmuebles_renta,
                    negocio: patrimonio.negocio,
                  }
                : null
            }
          />
        )}
      </Section>

      {/* F — Protección Patrimonial */}
      {motorF && (
        <Section id="sec-proteccion">
          <SectionHeader
            label="Cobertura y Riesgos"
            title="Protección Patrimonial"
            subtitle="Cobertura de seguros e impacto potencial en tu balance y flujo"
          />
          <ProteccionDetallada
            motorE={motorE}
            motorF={motorF}
            motorA={motorA}
            proteccion={{
              seguro_vida: proteccion?.seguro_vida ?? null,
              propiedades_aseguradas: proteccion?.propiedades_aseguradas ?? null,
              sgmm: proteccion?.sgmm ?? null,
            }}
            patrimonio={{ casa: patrimonio.casa, inmuebles_renta: patrimonio.inmuebles_renta }}
          />
        </Section>
      )}

      {/* H — Criterios de Trayectoria (Anexo) */}
      <Section id="sec-criterios">
        <SectionHeader
          label="Supuestos y Criterios"
          title="Anexo: Criterios de tu Trayectoria Patrimonial"
          subtitle="Supuestos sobre venta de activos y aportaciones utilizados en la proyección"
        />
        <CriteriosTrayectoriaSection
          criterios={criterios}
          patrimonio={{
            casa: patrimonio.casa,
            inmuebles_renta: patrimonio.inmuebles_renta,
            tierra: patrimonio.tierra,
            negocio: patrimonio.negocio,
            herencia: patrimonio.herencia,
          }}
          flujoMensual={{ rentas: flujoMensual.rentas, otros: flujoMensual.otros }}
          aportacion_mensual={objetivos?.aportacion_mensual ?? 0}
        />
      </Section>

    </div>
  );
}
