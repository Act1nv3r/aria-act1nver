"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { DonutChart } from "@/components/outputs/donut-chart";
import { ReservaSemaforo } from "@/components/outputs/reserva-semaforo";
import { PatrimonioNetoCard } from "@/components/outputs/patrimonio-neto-card";
import { NivelRiquezaBadge } from "@/components/outputs/nivel-riqueza-badge";
import { TrayectoriaRetiroChart } from "@/components/outputs/trayectoria-retiro-chart";
import { GradoAvanceBar } from "@/components/outputs/grado-avance-bar";
import { DeficitCard } from "@/components/outputs/deficit-card";
import { FuentesIngreso } from "@/components/outputs/fuentes-ingreso";
import { IndiceSolvencia } from "@/components/outputs/indice-solvencia";
import { Regla72Table } from "@/components/outputs/regla72-table";
import { ValorDineroTiempoChart } from "@/components/outputs/valor-dinero-tiempo-chart";
import { TablaViabilidad } from "@/components/outputs/tabla-viabilidad";
import { LegadoCard } from "@/components/outputs/legado-card";
import { PotencialApalancamientoCard } from "@/components/outputs/potencial-apalancamiento-card";
import { SaldoAcumulacionCard } from "@/components/outputs/saldo-acumulacion-card";
import { EsquemasPensionChart } from "@/components/outputs/esquemas-pension-chart";
import {
  calcularMotorA,
  calcularMotorB,
  calcularMotorC,
  calcularMotorD,
  calcularMotorE,
  calcularMotorF,
} from "@/lib/motors";
import { consolidar } from "@/lib/motors/consolidacion";
import { formatMXN } from "@/lib/format-currency";

type MotorOutputs = {
  motorA: Awaited<ReturnType<typeof calcularMotorA>> | null;
  motorB: Awaited<ReturnType<typeof calcularMotorB>> | null;
  motorC: Awaited<ReturnType<typeof calcularMotorC>> | null;
  motorD: Awaited<ReturnType<typeof calcularMotorD>> | null;
  motorE: Awaited<ReturnType<typeof calcularMotorE>> | null;
  motorF: Awaited<ReturnType<typeof calcularMotorF>> | null;
};

function runMotorsForPersona(
  flujo: { ahorro: number; rentas: number; otros: number; gastos_basicos: number; obligaciones: number; creditos: number },
  patrimonio: { liquidez: number; inversiones: number; dotales: number; afore: number; ppr: number; plan_privado: number; seguros_retiro: number; ley_73: number | null; casa: number; inmuebles_renta: number; tierra: number; negocio: number; herencia: number; hipoteca: number; saldo_planes: number; compromisos: number },
  retiro: { edad_retiro: number; mensualidad_deseada: number; edad_defuncion: number } | null,
  objetivos: { aportacion_inicial: number; aportacion_mensual: number; lista: Array<{ nombre: string; monto: number; plazo: number }> } | null,
  proteccion: { seguro_vida: boolean; propiedades_aseguradas: boolean | null; sgmm: boolean } | null,
  perfil: { edad: number; dependientes: boolean }
): MotorOutputs {
  const motorA = calcularMotorA({ ...flujo, liquidez: patrimonio.liquidez });
  const motorB = calcularMotorB({
    liquidez: patrimonio.liquidez,
    inversiones: patrimonio.inversiones,
    dotales: patrimonio.dotales,
    afore: patrimonio.afore,
    ppr: patrimonio.ppr,
    plan_privado: patrimonio.plan_privado,
    seguros_retiro: patrimonio.seguros_retiro,
    edad: perfil.edad,
    gastos_basicos: flujo.gastos_basicos,
    obligaciones: flujo.obligaciones,
    creditos: flujo.creditos,
  });
  const motorE = calcularMotorE(patrimonio);
  const patrimonioFin = patrimonio.liquidez + patrimonio.inversiones + patrimonio.dotales;

  let motorC: MotorOutputs["motorC"] = null;
  let motorD: MotorOutputs["motorD"] = null;
  if (retiro) {
    motorC = calcularMotorC({
      patrimonio_financiero_total: patrimonioFin,
      saldo_esquemas: patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado + patrimonio.seguros_retiro,
      ley_73: patrimonio.ley_73,
      rentas: flujo.rentas,
      edad: perfil.edad,
      edad_retiro: retiro.edad_retiro,
      edad_defuncion: retiro.edad_defuncion,
      mensualidad_deseada: retiro.mensualidad_deseada,
    });
    if (objetivos) {
      motorD = calcularMotorD({
        aportacion_inicial: objetivos.aportacion_inicial,
        aportacion_mensual: objetivos.aportacion_mensual,
        lista: objetivos.lista,
        patrimonio_financiero: patrimonioFin,
        edad: perfil.edad,
        edad_retiro: retiro.edad_retiro,
        edad_defuncion: retiro.edad_defuncion,
      });
    }
  }

  let motorF: MotorOutputs["motorF"] = null;
  if (proteccion) {
    motorF = calcularMotorF({
      seguro_vida: proteccion.seguro_vida,
      propiedades_aseguradas: proteccion.propiedades_aseguradas,
      sgmm: proteccion.sgmm,
      dependientes: perfil.dependientes,
      patrimonio_neto: motorE.patrimonio_neto,
      inmuebles_total: patrimonio.casa + patrimonio.inmuebles_renta + patrimonio.tierra,
      edad: perfil.edad,
    });
  }

  return { motorA, motorB, motorC, motorD, motorE, motorF };
}

interface OutputPanelProps {
  variant?: "sidebar" | "full";
}

export function OutputPanel({ variant = "sidebar" }: OutputPanelProps) {
  const pathname = usePathname();
  const id = pathname?.split("/diagnosticos/")[1]?.split("/")[0] || "demo";
  const [tabPareja, setTabPareja] = useState<"titular" | "pareja" | "hogar">("titular");
  const {
    modo,
    outputs,
    perfil,
    pareja_perfil,
    flujoMensual,
    pareja_flujoMensual,
    patrimonio,
    pareja_patrimonio,
    retiro,
    pareja_retiro,
    objetivos,
    pareja_objetivos,
    proteccion,
    pareja_proteccion,
    ownership,
    updateOutputs,
  } = useDiagnosticoStore();

  useEffect(() => {
    if (!flujoMensual || !perfil) return;

    if (modo === "pareja" && pareja_flujoMensual && pareja_patrimonio && pareja_perfil) {
      const patTit = patrimonio ?? {
        liquidez: 0, inversiones: 0, dotales: 0, afore: 0, ppr: 0, plan_privado: 0, seguros_retiro: 0, ley_73: null,
        casa: 0, inmuebles_renta: 0, tierra: 0, negocio: 0, herencia: 0, hipoteca: 0, saldo_planes: 0, compromisos: 0,
      };
      const titularOut = runMotorsForPersona(
        flujoMensual,
        patTit,
        retiro,
        objetivos,
        proteccion,
        perfil
      );
      const parejaOut = runMotorsForPersona(
        pareja_flujoMensual,
        pareja_patrimonio,
        pareja_retiro,
        pareja_objetivos,
        pareja_proteccion,
        pareja_perfil
      );
      const hogar = consolidar(
        {
          flujo: flujoMensual,
          patrimonio: patTit,
          retiro: retiro ?? { edad_retiro: 65, mensualidad_deseada: 50000, edad_defuncion: 90 },
          objetivos: objetivos ?? { aportacion_inicial: 0, aportacion_mensual: 0, lista: [] },
          proteccion: proteccion ?? { seguro_vida: false, propiedades_aseguradas: null, sgmm: false },
        },
        {
          flujo: pareja_flujoMensual,
          patrimonio: pareja_patrimonio,
          retiro: pareja_retiro ?? { edad_retiro: 65, mensualidad_deseada: 50000, edad_defuncion: 90 },
          objetivos: pareja_objetivos ?? { aportacion_inicial: 0, aportacion_mensual: 0, lista: [] },
          proteccion: pareja_proteccion ?? { seguro_vida: false, propiedades_aseguradas: null, sgmm: false },
        },
        ownership
      );
      const hogarOut = runMotorsForPersona(
        hogar.flujo,
        hogar.patrimonio,
        hogar.retiro,
        hogar.objetivos,
        hogar.proteccion,
        { edad: Math.round((perfil.edad + pareja_perfil.edad) / 2), dependientes: perfil.dependientes || pareja_perfil.dependientes }
      );
      updateOutputs("titular", titularOut);
      updateOutputs("pareja", parejaOut);
      updateOutputs("hogar", { ...hogarOut, dependencia_financiera: hogar.dependencia_financiera, retiro: hogar.retiro });
    } else {
      if (!patrimonio) return;
      const motorA = calcularMotorA({ ...flujoMensual, liquidez: patrimonio.liquidez });
      updateOutputs("motorA", motorA);
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
      updateOutputs("motorB", motorB);
      const motorE = calcularMotorE(patrimonio);
      updateOutputs("motorE", motorE);
      const patrimonioFin = patrimonio.liquidez + patrimonio.inversiones + patrimonio.dotales;
      if (retiro) {
        const motorC = calcularMotorC({
          patrimonio_financiero_total: patrimonioFin,
          saldo_esquemas: patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado + patrimonio.seguros_retiro,
          ley_73: patrimonio.ley_73,
          rentas: flujoMensual.rentas,
          edad: perfil.edad,
          edad_retiro: retiro.edad_retiro,
          edad_defuncion: retiro.edad_defuncion,
          mensualidad_deseada: retiro.mensualidad_deseada,
        });
        updateOutputs("motorC", motorC);
        if (objetivos) {
          const motorD = calcularMotorD({
            aportacion_inicial: objetivos.aportacion_inicial,
            aportacion_mensual: objetivos.aportacion_mensual,
            lista: objetivos.lista,
            patrimonio_financiero: patrimonioFin,
            edad: perfil.edad,
            edad_retiro: retiro.edad_retiro,
            edad_defuncion: retiro.edad_defuncion,
          });
          updateOutputs("motorD", motorD);
        }
      }
      if (proteccion) {
        const motorF = calcularMotorF({
          seguro_vida: proteccion.seguro_vida,
          propiedades_aseguradas: proteccion.propiedades_aseguradas,
          sgmm: proteccion.sgmm,
          dependientes: perfil.dependientes,
          patrimonio_neto: motorE.patrimonio_neto,
          inmuebles_total: patrimonio.casa + patrimonio.inmuebles_renta + patrimonio.tierra,
          edad: perfil.edad,
        });
        updateOutputs("motorF", motorF);
      }
    }
  }, [modo, flujoMensual, pareja_flujoMensual, patrimonio, pareja_patrimonio, retiro, pareja_retiro, objetivos, pareja_objetivos, proteccion, pareja_proteccion, perfil, pareja_perfil, ownership, updateOutputs]);

  const outTitular = outputs.titular as (MotorOutputs & { dependencia_financiera?: never }) | null;
  const outPareja = outputs.pareja as MotorOutputs | null;
  const outHogar = outputs.hogar as (MotorOutputs & { dependencia_financiera?: { titular_pct: number; pareja_pct: number; dependiente: string }; retiro?: { edad_retiro: number; edad_defuncion: number } }) | null;

  const motorA = (modo === "pareja" ? (tabPareja === "titular" ? outTitular?.motorA : tabPareja === "pareja" ? outPareja?.motorA : outHogar?.motorA) : outputs.motorA) as Awaited<ReturnType<typeof calcularMotorA>> | null;
  const motorB = (modo === "pareja" ? (tabPareja === "titular" ? outTitular?.motorB : tabPareja === "pareja" ? outPareja?.motorB : outHogar?.motorB) : outputs.motorB) as Awaited<ReturnType<typeof calcularMotorB>> | null;
  const motorC = (modo === "pareja" ? (tabPareja === "titular" ? outTitular?.motorC : tabPareja === "pareja" ? outPareja?.motorC : outHogar?.motorC) : outputs.motorC) as Awaited<ReturnType<typeof calcularMotorC>> | null;
  const motorD = (modo === "pareja" ? (tabPareja === "titular" ? outTitular?.motorD : tabPareja === "pareja" ? outPareja?.motorD : outHogar?.motorD) : outputs.motorD) as Awaited<ReturnType<typeof calcularMotorD>> | null;
  const motorE = (modo === "pareja" ? (tabPareja === "titular" ? outTitular?.motorE : tabPareja === "pareja" ? outPareja?.motorE : outHogar?.motorE) : outputs.motorE) as Awaited<ReturnType<typeof calcularMotorE>> | null;
  const motorF = (modo === "pareja" ? (tabPareja === "titular" ? outTitular?.motorF : tabPareja === "pareja" ? outPareja?.motorF : outHogar?.motorF) : outputs.motorF) as Awaited<ReturnType<typeof calcularMotorF>> | null;

  const retiroActivo = modo === "pareja"
    ? (tabPareja === "titular" ? retiro : tabPareja === "pareja" ? pareja_retiro : outHogar?.retiro ?? retiro)
    : retiro;
  const flujoActivo = modo === "pareja"
    ? (tabPareja === "titular" ? flujoMensual : tabPareja === "pareja" ? pareja_flujoMensual : flujoMensual)
    : flujoMensual;
  const perfilActivo = modo === "pareja"
    ? (tabPareja === "titular" ? perfil : tabPareja === "pareja" ? pareja_perfil : perfil)
    : perfil;

  const patrimonioActivo = useMemo(() => {
    if (modo !== "pareja") return patrimonio;
    if (tabPareja === "titular") return patrimonio;
    if (tabPareja === "pareja") return pareja_patrimonio;
    if (tabPareja === "hogar" && patrimonio && pareja_patrimonio) {
      const hogar = consolidar(
        {
          flujo: flujoMensual!,
          patrimonio,
          retiro: retiro ?? { edad_retiro: 65, mensualidad_deseada: 50000, edad_defuncion: 90 },
          objetivos: objetivos ?? { aportacion_inicial: 0, aportacion_mensual: 0, lista: [] },
          proteccion: proteccion ?? { seguro_vida: false, propiedades_aseguradas: null, sgmm: false },
        },
        {
          flujo: pareja_flujoMensual!,
          patrimonio: pareja_patrimonio,
          retiro: pareja_retiro ?? { edad_retiro: 65, mensualidad_deseada: 50000, edad_defuncion: 90 },
          objetivos: pareja_objetivos ?? { aportacion_inicial: 0, aportacion_mensual: 0, lista: [] },
          proteccion: pareja_proteccion ?? { seguro_vida: false, propiedades_aseguradas: null, sgmm: false },
        },
        ownership ?? {}
      );
      return hogar.patrimonio;
    }
    return patrimonio;
  }, [modo, tabPareja, patrimonio, pareja_patrimonio, flujoMensual, pareja_flujoMensual, retiro, pareja_retiro, objetivos, pareja_objetivos, proteccion, pareja_proteccion, ownership]);

  const donutData = motorA
    ? [
        {
          name: "Obligaciones",
          value: motorA.distribucion.obligaciones_pct * motorA.ingresos_totales,
          color: "#314566",
        },
        {
          name: "Gastos básicos",
          value: motorA.distribucion.gastos_pct * motorA.ingresos_totales,
          color: "#5A6A85",
        },
        {
          name: "Ahorro",
          value: motorA.distribucion.ahorro_pct * motorA.ingresos_totales,
          color: "#E6C78A",
        },
      ].filter((d) => d.value > 0)
    : [];

  const isFull = variant === "full";

  return (
    <div className={isFull ? "space-y-6" : "space-y-4"}>
      <h3 className="font-bold font-[family-name:var(--font-poppins)] text-base text-[#E6C78A]">
        Tus resultados
      </h3>

      <div className={isFull ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full" : "space-y-4"}>
      {modo === "pareja" && outHogar?.dependencia_financiera && (
        <FadeIn>
          <Card className={isFull ? "md:col-span-2" : ""}>
            <div className="space-y-2 min-w-0">
              <p className="font-[family-name:var(--font-poppins)] text-sm font-bold text-white">
                Dependencia financiera
              </p>
              <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
                Titular: {Math.round(outHogar.dependencia_financiera.titular_pct * 100)}% · Pareja: {Math.round(outHogar.dependencia_financiera.pareja_pct * 100)}%
              </p>
              <p className="font-[family-name:var(--font-open-sans)] text-sm text-white">
                {outHogar.dependencia_financiera.dependiente === "equilibrado"
                  ? "Equilibrado"
                  : outHogar.dependencia_financiera.dependiente === "titular"
                    ? "El titular aporta más"
                    : "La pareja aporta más"}
              </p>
            </div>
          </Card>
        </FadeIn>
      )}

      {modo === "pareja" && (
        <div className="flex gap-1 border-b border-[#5A6A85]/20 pb-2">
          {(["titular", "pareja", "hogar"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTabPareja(t)}
              className={`px-3 py-1.5 font-[family-name:var(--font-poppins)] text-xs font-medium transition-colors rounded ${
                tabPareja === t ? "bg-[#317A70] text-white" : "text-[#5A6A85] hover:text-white"
              }`}
            >
              {t === "titular" ? perfil?.nombre ?? "Titular" : t === "pareja" ? pareja_perfil?.nombre ?? "Pareja" : "Hogar"}
            </button>
          ))}
        </div>
      )}

      {/* Orden según Excel: Cálculos Edo.Res → Desacumulación → Objetivos → Balance → Potencial → Patrimonio Financiero → Esquemas → Output 7 */}

      {/* Output 1 — Análisis Ingreso/Gasto */}
      {motorA && donutData.length > 0 && (
        <FadeIn>
          <Card>
            <DonutChart data={donutData} total={motorA.ingresos_totales} />
          </Card>
        </FadeIn>
      )}

      {/* Output 2 — Reserva de Emergencia */}
      {motorA && (
        <FadeIn>
          <Card>
            <ReservaSemaforo
              meses={motorA.meses_cubiertos}
              benchmark={3}
              faltante={
                motorA.meses_cubiertos !== null && motorA.meses_cubiertos < 3
                  ? (3 - motorA.meses_cubiertos) * (flujoActivo?.gastos_basicos ?? 0)
                  : 0
              }
            />
          </Card>
        </FadeIn>
      )}

      {/* Output 3 — Saldo Acumulación */}
      {motorA && motorE && (
        <FadeIn>
          <Card>
            <SaldoAcumulacionCard
              saldoAcumulacion={motorE.financiero}
              mesesReservaAcumulacion={
                (flujoActivo?.gastos_basicos ?? 0) > 0
                  ? motorE.financiero / (flujoActivo?.gastos_basicos ?? 1)
                  : 0
              }
              remanenteObjetivos={motorA.remanente}
            />
          </Card>
        </FadeIn>
      )}

      {/* Regla del 72 */}
      {motorE && (
        <FadeIn>
          <Card>
            <Regla72Table patrimonio={motorE.patrimonio_neto} />
          </Card>
        </FadeIn>
      )}

      {/* Output 4/5/6 — Retiro: Grado Avance, Fuentes Ingreso, Déficit */}
      {motorC && (
        <FadeIn>
          <Card>
            <GradoAvanceBar porcentaje={motorC.grado_avance} />
          </Card>
          <Card>
            <FuentesIngreso
              rentas={motorC.fuentes_ingreso.rentas}
              pension={motorC.fuentes_ingreso.pension}
              patrimonio={motorC.fuentes_ingreso.patrimonio}
            />
          </Card>
          <Card>
            <DeficitCard
              deficit={motorC.deficit_mensual}
              simuladorUrl={`/diagnosticos/${id}/simulador`}
            />
          </Card>
        </FadeIn>
      )}

      {/* Índice Patrimonial */}
      {motorC && retiroActivo && (
        <FadeIn>
          <Card>
            <div className="space-y-3 min-w-0">
              <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
                Índice Patrimonial
              </p>
              <div className="space-y-2">
                {[
                  { label: "Calidad de vida objetivo", value: (retiroActivo as { mensualidad_deseada?: number }).mensualidad_deseada ?? 0, highlight: false },
                  { label: "Total ingresos en retiro", value: motorC.pension_total_mensual + (motorC.fuentes_ingreso?.rentas ?? 0), highlight: false },
                  { label: "Faltante / Superávit mensual", value: motorC.deficit_mensual, highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/[0.06]">
                    <span className="font-[family-name:var(--font-open-sans)] text-xs text-[#8B9BB4]">{label}</span>
                    <span className={`font-bold font-[family-name:var(--font-poppins)] text-sm ${
                      highlight ? (value < 0 ? 'text-[#EF4444]' : 'text-[#10B981]') : 'text-[#E6C78A]'
                    }`}>
                      {highlight && value < 0 ? '-' : ''}{formatMXN(Math.abs(value))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </FadeIn>
      )}

      {/* Desacumulación: Curva, Trayectoria */}
      {motorC && (
        <FadeIn>
          <Card>
            <TrayectoriaRetiroChart
              saldoInicioJubilacion={motorC.saldo_inicio_jubilacion}
              pensionTotalMensual={motorC.pension_total_mensual}
              mensualidadDeseada={(retiroActivo as { mensualidad_deseada?: number })?.mensualidad_deseada ?? 50000}
              edadRetiro={retiroActivo?.edad_retiro ?? 60}
              edadDefuncion={retiroActivo?.edad_defuncion ?? 90}
              patrimonioFinancieroActual={
                (patrimonioActivo?.liquidez ?? 0) +
                (patrimonioActivo?.inversiones ?? 0) +
                (patrimonioActivo?.dotales ?? 0)
              }
            />
          </Card>
        </FadeIn>
      )}

      {/* Objetivos: Tabla Viabilidad, Legado */}
      {motorD && (
        <FadeIn>
          <Card>
            <TablaViabilidad objetivos={motorD.resultados} />
          </Card>
          <Card>
            <LegadoCard
              monto={motorD.legado}
              edadDefuncion={retiroActivo?.edad_defuncion ?? 90}
            />
          </Card>
        </FadeIn>
      )}

      {/* Balance: Patrimonio Neto, Nivel Riqueza */}
      {motorB && motorE && (
        <FadeIn>
          <Card>
            <PatrimonioNetoCard
              neto={motorE.patrimonio_neto}
              financiero={motorE.financiero}
              noFinanciero={motorE.noFinanciero}
              pasivos={motorE.pasivos_total}
            />
          </Card>
          <Card>
            <NivelRiquezaBadge
              nivel={motorB.nivel_riqueza}
              ratio={motorB.ratio}
              benchmarkEdad={motorB.benchmark_para_edad}
              edad={perfilActivo?.edad ?? 0}
            />
          </Card>
        </FadeIn>
      )}

      {/* Potencial del balance: Potencial Apalancamiento, Índice Solvencia */}
      {motorE && (
        <FadeIn>
          <Card>
            <PotencialApalancamientoCard
              potencialApalancamiento={motorE.potencial_apalancamiento}
              activosTotales={motorE.activos_total}
              capacidadApalancamiento={motorE.potencial_apalancamiento > 0}
            />
          </Card>
          <Card>
            <IndiceSolvencia
              valor={motorE.indice_solvencia}
              clasificacion={motorE.clasificacion_solvencia}
            />
          </Card>
        </FadeIn>
      )}

      {/* Patrimonio Financiero: Valor Dinero en el Tiempo */}
      {motorE && (
        <FadeIn>
          <Card>
            <ValorDineroTiempoChart
              montoInversion={(patrimonioActivo?.liquidez ?? 0) + (patrimonioActivo?.inversiones ?? 0)}
              reservaCortoPlazo={patrimonioActivo?.liquidez ?? 0}
              edadInicio={perfilActivo?.edad ?? 40}
              edadDefuncion={retiroActivo?.edad_defuncion ?? 90}
            />
          </Card>
        </FadeIn>
      )}

      {/* Esquemas de Pensión */}
      {motorE && (
        <FadeIn>
          <Card>
            <EsquemasPensionChart
              afore={patrimonioActivo?.afore ?? 0}
              ppr={patrimonioActivo?.ppr ?? 0}
              planPrivado={patrimonioActivo?.plan_privado ?? 0}
              segurosRetiro={patrimonioActivo?.seguros_retiro ?? 0}
              ley73={patrimonioActivo?.ley_73 ?? null}
            />
          </Card>
        </FadeIn>
      )}

      {/* Output 7 — Protección */}
      {motorF && (
        <FadeIn>
          <Card>
            <div className="space-y-2 min-w-0">
              <p className="font-[family-name:var(--font-poppins)] text-sm font-bold text-white">
                Protección Patrimonial
              </p>
              {motorF.recomendaciones.map((r, i) => (
                <p key={i} className="font-[family-name:var(--font-open-sans)] text-sm text-white break-words">
                  {r}
                </p>
              ))}
            </div>
          </Card>
        </FadeIn>
      )}

      {!motorA && (
        <div className="text-center py-12">
          <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
            Completa los primeros pasos para ver tus resultados
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
