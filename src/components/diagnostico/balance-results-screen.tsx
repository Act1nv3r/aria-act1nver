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

function SectionHeader({ letter, title, subtitle }: { letter: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-[#C9A96E] uppercase tracking-widest mb-1">{letter}</p>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      {subtitle && <p className="text-sm text-[#8899BB] mt-1">{subtitle}</p>}
      <div className="h-px bg-[#243555] mt-4" />
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="mb-16">{children}</div>;
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
          patrimonio_financiero_total: patrimonioFin,
          saldo_esquemas: patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado + patrimonio.seguros_retiro,
          saldo_esquemas_pension: patrimonio.afore,
          saldo_esquemas_voluntarios: patrimonio.ppr + patrimonio.plan_privado + patrimonio.seguros_retiro,
          ley_73: patrimonio.ley_73,
          rentas: flujoMensual.rentas,
          ingresos_negocio: flujoMensual.otros,
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
          dependientes: perfil.dependientes ?? false,
          patrimonio_neto: motorE.patrimonio_neto,
          inmuebles_total: patrimonio.casa + patrimonio.inmuebles_renta,
          edad: perfil.edad,
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
      {/* A — Resumen Ejecutivo */}
      <Section>
        <SectionHeader
          letter="A"
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

      {/* B — Plan de Acción */}
      <Section>
        <SectionHeader
          letter="B"
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

      {/* C — Diagnóstico Patrimonial */}
      <Section>
        <SectionHeader
          letter="C"
          title="Resultado del Diagnóstico Patrimonial"
          subtitle="Composición detallada de activos, pasivos y patrimonio neto"
        />
        <PatrimonioBreakdown patrimonio={patrimonio} motorE={motorE} />
      </Section>

      {/* D — Fuentes de Flujo Disponible */}
      <Section>
        <SectionHeader
          letter="D"
          title="Fuentes de Flujo Disponible"
          subtitle="Análisis de ingresos, gastos y rentabilidad de tus fuentes de flujo"
        />
        <FlujoDisponibleSection
          motorA={motorA}
          flujoMensual={flujoMensual}
          patrimonio={{ inmuebles_renta: patrimonio.inmuebles_renta, negocio: patrimonio.negocio }}
        />
      </Section>

      {/* E — Potencial del Balance */}
      <Section>
        <SectionHeader
          letter="E"
          title="Potencial del Balance"
          subtitle="Solvencia, estructura patrimonial y distribución de activos"
        />
        <PotencialBalanceSection motorE={motorE} patrimonio={patrimonio} />
      </Section>

      {/* F — Protección Patrimonial */}
      {motorF && (
        <Section>
          <SectionHeader
            letter="F"
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

      {/* G — Trayectoria Patrimonial */}
      {motorC && retiro && (
        <Section>
          <SectionHeader
            letter="G"
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

      {/* H — Criterios de Trayectoria */}
      <Section>
        <SectionHeader
          letter="H"
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
