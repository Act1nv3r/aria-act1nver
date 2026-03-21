"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { calcularMotorC } from "@/lib/motors";
import { PARAMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { GradoAvanceBar } from "@/components/outputs/grado-avance-bar";
import { DeficitCard } from "@/components/outputs/deficit-card";
import { CurvaDesacumulacion } from "@/components/outputs/curva-desacumulacion";
import { TrayectoriaRetiroChart } from "@/components/outputs/trayectoria-retiro-chart";
import { formatMXN } from "@/lib/format-currency";

export default function SimuladorPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname?.split("/diagnosticos/")[1]?.split("/")[0] || "demo";
  const { perfil, flujoMensual, patrimonio, retiro } = useDiagnosticoStore();

  const patrimonioFin =
    (patrimonio?.liquidez ?? 0) +
    (patrimonio?.inversiones ?? 0) +
    (patrimonio?.dotales ?? 0);
  const edad = perfil?.edad ?? 50;
  const retiroBase = retiro ?? {
    edad_retiro: 60,
    mensualidad_deseada: 50000,
    edad_defuncion: 90,
  };
  const flujoBase = flujoMensual ?? {
    ahorro: 50000,
    rentas: 10000,
    otros: 0,
    gastos_basicos: 40000,
    obligaciones: 20000,
    creditos: 0,
  };

  const [sliderValues, setSliderValues] = useState({
    edad_retiro: retiroBase.edad_retiro,
    ahorro: flujoBase.ahorro,
    mensualidad_deseada: retiroBase.mensualidad_deseada,
    tasa_real: PARAMS.TASA_REAL_ANUAL * 100,
    aportacion_extra: 0,
  });

  const motorCInput = {
    patrimonio_financiero_total: patrimonioFin,
    saldo_esquemas: 0,
    ley_73: patrimonio?.ley_73 ?? 35000,
    rentas: flujoBase.rentas,
    edad,
    edad_retiro: retiroBase.edad_retiro,
    edad_defuncion: retiroBase.edad_defuncion,
    mensualidad_deseada: retiroBase.mensualidad_deseada,
  };

  const resultadoBase = useMemo(
    () => calcularMotorC(motorCInput),
    []
  );

  const resultadoSimulado = useMemo(() => {
    const patrimonioAjustado = patrimonioFin + sliderValues.aportacion_extra;
    return calcularMotorC({
      ...motorCInput,
      patrimonio_financiero_total: patrimonioAjustado,
      edad_retiro: sliderValues.edad_retiro,
      mensualidad_deseada: sliderValues.mensualidad_deseada,
      tasa_real_anual: sliderValues.tasa_real / 100,
    });
  }, [sliderValues, patrimonioFin]);

  const resetValues = () => {
    setSliderValues({
      edad_retiro: retiroBase.edad_retiro,
      ahorro: flujoBase.ahorro,
      mensualidad_deseada: retiroBase.mensualidad_deseada,
      tasa_real: PARAMS.TASA_REAL_ANUAL * 100,
      aportacion_extra: 0,
    });
  };

  const diffGrado =
    (resultadoSimulado.grado_avance - resultadoBase.grado_avance) * 100;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="font-bold font-[family-name:var(--font-poppins)] text-[28px] text-white">
          Simula tu futuro
        </h1>
        <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85] mt-1">
          Mueve los controles y observa cómo cambia tu retiro
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <Slider
              label="Edad de retiro"
              min={edad + 1}
              max={70}
              step={1}
              value={[sliderValues.edad_retiro]}
              onChange={(v) =>
                setSliderValues((s) => ({ ...s, edad_retiro: v[0] }))
              }
              formatValue={(v) => `${v} años`}
            />
            <p className="mt-1 font-[family-name:var(--font-open-sans)] text-[11px] text-[#5A6A85]">
              Base: {retiroBase.edad_retiro} años
            </p>
          </Card>

          <Card>
            <Slider
              label="Capacidad de ahorro mensual"
              min={0}
              max={flujoBase.ahorro * 3}
              step={5000}
              value={[sliderValues.ahorro]}
              onChange={(v) =>
                setSliderValues((s) => ({ ...s, ahorro: v[0] }))
              }
              formatValue={(v) => formatMXN(v) + "/mes"}
            />
            <p className="mt-1 font-[family-name:var(--font-open-sans)] text-[11px] text-[#5A6A85]">
              Base: {formatMXN(flujoBase.ahorro)}/mes
            </p>
          </Card>

          <Card>
            <Slider
              label="Mensualidad deseada en retiro"
              min={10000}
              max={200000}
              step={5000}
              value={[sliderValues.mensualidad_deseada]}
              onChange={(v) =>
                setSliderValues((s) => ({
                  ...s,
                  mensualidad_deseada: v[0],
                }))
              }
              formatValue={(v) => formatMXN(v) + "/mes"}
            />
          </Card>

          <Card>
            <Slider
              label="Tasa real anual"
              min={0}
              max={5}
              step={0.5}
              value={[sliderValues.tasa_real]}
              onChange={(v) =>
                setSliderValues((s) => ({ ...s, tasa_real: v[0] }))
              }
              formatValue={(v) => `${v}%`}
            />
          </Card>

          <Card>
            <Slider
              label="Aportación extra única"
              min={0}
              max={5000000}
              step={100000}
              value={[sliderValues.aportacion_extra]}
              onChange={(v) =>
                setSliderValues((s) => ({ ...s, aportacion_extra: v[0] }))
              }
              formatValue={(v) => formatMXN(v)}
            />
            <p className="mt-1 font-[family-name:var(--font-open-sans)] text-[11px] text-[#5A6A85]">
              Un monto adicional que podrías invertir hoy
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <GradoAvanceBar porcentaje={resultadoSimulado.grado_avance} />
            <p
              className={`mt-2 font-bold font-[family-name:var(--font-poppins)] text-xs ${
                diffGrado >= 0 ? "text-[#317A70]" : "text-[#8B3A3A]"
              }`}
            >
              {diffGrado >= 0 ? "▲" : "▼"} {Math.abs(diffGrado).toFixed(1)}% vs
              base
            </p>
          </Card>

          <Card>
            <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
              Mensualidad posible
            </p>
            <p className="font-bold font-[family-name:var(--font-poppins)] text-[28px] text-white">
              {formatMXN(resultadoSimulado.mensualidad_posible)}
            </p>
          </Card>

          <Card>
            <DeficitCard deficit={resultadoSimulado.deficit_mensual} />
          </Card>

          <Card>
            <CurvaDesacumulacion
              key={JSON.stringify(sliderValues)}
              curva={resultadoSimulado.curva}
              edadRetiro={sliderValues.edad_retiro}
              edadDefuncion={retiroBase.edad_defuncion}
            />
          </Card>

          <Card>
            <TrayectoriaRetiroChart
              saldoInicioJubilacion={resultadoSimulado.saldo_inicio_jubilacion}
              pensionTotalMensual={resultadoSimulado.pension_total_mensual}
              mensualidadDeseada={sliderValues.mensualidad_deseada}
              edadRetiro={sliderValues.edad_retiro}
              edadDefuncion={retiroBase.edad_defuncion}
              patrimonioFinancieroActual={patrimonioFin + sliderValues.aportacion_extra}
              tasaRealAnual={sliderValues.tasa_real / 100}
            />
          </Card>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/diagnosticos/${id}/completado`)}
        >
          Volver al diagnóstico
        </Button>
        <Button variant="outline" onClick={resetValues}>
          Resetear valores
        </Button>
      </div>
    </div>
  );
}
