"use client";

import { useMemo } from "react";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import {
  calcularMotorA,
  calcularMotorB,
  calcularMotorC,
  calcularMotorD,
  calcularMotorE,
} from "@/lib/motors";
import { PatrimonioHero } from "@/components/outputs/patrimonio-hero";
import { AssetMapVisual } from "@/components/outputs/asset-map-visual";
import { HealthScoreGrid } from "@/components/outputs/health-score-grid";
import { InlineScenarioSimulator } from "@/components/outputs/inline-scenario-simulator";
import { ActionPlanPriority } from "@/components/outputs/action-plan-priority";
import { LegadoFuturoSection } from "@/components/outputs/legado-futuro-section";
interface ActHeaderProps {
  number: string;
  title: string;
  subtitle: string;
}

function ActHeader({ number, title, subtitle }: ActHeaderProps) {
  return (
    <div className="mb-8">
      <p className="text-xs font-bold text-[#C9A84C]/60 uppercase tracking-[6px] mb-2">{number}</p>
      <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
      <p className="text-[#8B9BB4] text-base">{subtitle}</p>
    </div>
  );
}

function ActSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto">
      {children}
    </section>
  );
}

function Divider() {
  return (
    <div className="relative flex items-center justify-center py-2">
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />
    </div>
  );
}

interface Props {
  onDownloadPDF?: () => void;
}

export function WealthStoryScreen({ onDownloadPDF }: Props) {
  const perfil = useDiagnosticoStore((s) => s.perfil);
  const flujoMensual = useDiagnosticoStore((s) => s.flujoMensual);
  const patrimonio = useDiagnosticoStore((s) => s.patrimonio);
  const retiro = useDiagnosticoStore((s) => s.retiro);
  const objetivos = useDiagnosticoStore((s) => s.objetivos);
  const proteccion = useDiagnosticoStore((s) => s.proteccion);

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

    return { motorA, motorB, motorC, motorD, motorE, patrimonioFin };
  }, [perfil, flujoMensual, patrimonio, retiro, objetivos]);

  if (!motors || !perfil || !flujoMensual || !patrimonio) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <div>
          <p className="text-2xl font-bold text-white mb-2">Completa tu diagnóstico primero</p>
          <p className="text-[#8B9BB4]">Necesitamos tus datos para generar tu experiencia patrimonial.</p>
        </div>
      </div>
    );
  }

  const { motorA, motorB, motorC, motorD, motorE, patrimonioFin } = motors;

  const nombre = perfil.nombre ?? "";

  const patrimonioData = {
    liquidez: patrimonio.liquidez,
    inversiones: patrimonio.inversiones,
    dotales: patrimonio.dotales,
    afore: patrimonio.afore,
    ppr: patrimonio.ppr,
    plan_privado: patrimonio.plan_privado,
    seguros_retiro: patrimonio.seguros_retiro,
    casa: patrimonio.casa,
    inmuebles_renta: patrimonio.inmuebles_renta,
    tierra: patrimonio.tierra,
    negocio: patrimonio.negocio,
    herencia: patrimonio.herencia,
    hipoteca: patrimonio.hipoteca,
    saldo_planes: patrimonio.saldo_planes,
    compromisos: patrimonio.compromisos,
  };

  const proteccionData = proteccion
    ? {
        seguro_vida: proteccion.seguro_vida ?? null,
        propiedades_aseguradas: proteccion.propiedades_aseguradas ?? null,
        sgmm: proteccion.sgmm ?? null,
      }
    : null;

  const baseInputSimulador = retiro
    ? {
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
      }
    : null;

  return (
    <div className="bg-[#060D1A] min-h-screen">
      {/* ACTO 1 — Tu Patrimonio (fullscreen hero) */}
      <PatrimonioHero motorB={motorB} motorE={motorE} nombre={nombre} />

      <Divider />

      {/* ACTO 2 — Tu Fotografía Patrimonial */}
      <ActSection>
        <ActHeader
          number="02"
          title="Tu Fotografía Patrimonial"
          subtitle="Una vista completa de todo lo que has construido: activos, pasivos y tu posición neta."
        />
        <AssetMapVisual patrimonio={patrimonioData} motorE={motorE} proteccion={proteccionData} />
      </ActSection>

      <Divider />

      {/* ACTO 3 — Tu Salud Financiera */}
      <ActSection>
        <ActHeader
          number="03"
          title="Tu Salud Financiera"
          subtitle="Cuatro dimensiones que definen qué tan sólida es tu posición hoy."
        />
        <HealthScoreGrid motorA={motorA} motorB={motorB} motorC={motorC} proteccion={proteccionData} />
      </ActSection>

      <Divider />

      {/* ACTO 4 — Simula tu Futuro */}
      {motorC && baseInputSimulador && (
        <>
          <ActSection>
            <ActHeader
              number="04"
              title="Simula tu Futuro"
              subtitle="Explora cómo pequeños cambios hoy pueden transformar radicalmente tu retiro."
            />
            <InlineScenarioSimulator baseInput={baseInputSimulador} motorCBase={motorC} />
          </ActSection>
          <Divider />
        </>
      )}

      {/* ACTO 5 — Tu Plan de Acción */}
      <ActSection>
        <ActHeader
          number="05"
          title="Tu Plan de Acción"
          subtitle="Las oportunidades más importantes, ordenadas por impacto y urgencia."
        />
        <ActionPlanPriority
          motorA={motorA}
          motorB={motorB}
          motorC={motorC ?? calcularMotorC({
            patrimonio_financiero_total: patrimonioFin,
            saldo_esquemas: 0,
            ley_73: null,
            rentas: 0,
            edad: perfil.edad,
            edad_retiro: 65,
            edad_defuncion: 90,
            mensualidad_deseada: 0,
          })}
          motorE={motorE}
          proteccion={
            proteccion
              ? {
                  seguro_vida: proteccion.seguro_vida ?? false,
                  propiedades_aseguradas: proteccion.propiedades_aseguradas ?? null,
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
      </ActSection>

      <Divider />

      {/* ACTO 6 — Tu Legado & El Siguiente Paso */}
      <ActSection>
        <ActHeader
          number="06"
          title="Tu Legado & El Siguiente Paso"
          subtitle="El horizonte de tu patrimonio — y cómo Actinver puede ayudarte a maximizarlo."
        />
        <LegadoFuturoSection
          motorC={motorC}
          motorD={motorD}
          motorE={motorE}
          nombre={nombre}
          onDownloadPDF={onDownloadPDF}
        />
      </ActSection>

      {/* Bottom spacing */}
      <div className="h-20" />
    </div>
  );
}
