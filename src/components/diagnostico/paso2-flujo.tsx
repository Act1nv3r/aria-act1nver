"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { useDiagnosticoId } from "@/contexts/diagnostico-context";
import { api } from "@/lib/api-client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { InfoBox } from "@/components/ui/info-box";
import { ParejaLayout } from "./pareja-layout";
import { useVoiceStore } from "@/stores/voice-store";
import { useUIFeedbackStore } from "@/stores/ui-feedback-store";
import { useVoiceSuggestions } from "@/hooks/use-voice-suggestions";
import { SuggestionPill } from "@/components/voz/suggestion-pill";

const schema = z.object({
  ahorro: z.number().min(0),
  rentas: z.number().min(0),
  otros: z.number().min(0),
  gastos_basicos: z.number().min(1, "Debe ser mayor a $0"),
  obligaciones: z.number().min(0),
  creditos: z.number().min(0),
});

type FormData = z.infer<typeof schema>;

export function Paso2Flujo() {
  const router = useRouter();
  const pathname = usePathname();
  const { diagnosticoId, isApiMode } = useDiagnosticoId();
  const {
    modo,
    flujoMensual,
    pareja_flujoMensual,
    perfil,
    pareja_perfil,
    updateFlujoMensual,
    updateParejaFlujoMensual,
    completarPaso,
    nextStep,
    updateOutputs,
  } = useDiagnosticoStore();
  const id = diagnosticoId || pathname?.split("/diagnosticos/")[1]?.split("/")[0] || "demo";
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ahorro: flujoMensual?.ahorro ?? 0,
      rentas: flujoMensual?.rentas ?? 0,
      otros: flujoMensual?.otros ?? 0,
      gastos_basicos: flujoMensual?.gastos_basicos ?? 0,
      obligaciones: flujoMensual?.obligaciones ?? 0,
      creditos: flujoMensual?.creditos ?? 0,
    },
  });

  const transcript = useVoiceStore((s) => s.transcript);
  const isRecording = useVoiceStore((s) => s.isRecording);
  const { sugerencias, aceptarSugerencia, rechazarSugerencia } = useVoiceSuggestions(
    transcript,
    isRecording,
    2,
    (campo, valor) => setValue(campo as keyof FormData, valor as number)
  );
  const notifySaved = useUIFeedbackStore((s) => s.notifySaved);

  const parejaForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ahorro: pareja_flujoMensual?.ahorro ?? 0,
      rentas: pareja_flujoMensual?.rentas ?? 0,
      otros: pareja_flujoMensual?.otros ?? 0,
      gastos_basicos: pareja_flujoMensual?.gastos_basicos ?? 0,
      obligaciones: pareja_flujoMensual?.obligaciones ?? 0,
      creditos: pareja_flujoMensual?.creditos ?? 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    updateFlujoMensual(data);
    completarPaso(2);
    if (isApiMode && id) {
      setSubmitting(true);
      try {
        const res = await api.diagnosticos.putFlujoMensual(id, data);
        const outputs = res?.outputs as { motorA?: unknown } | undefined;
        if (outputs?.motorA) updateOutputs("motorA", outputs.motorA);
        notifySaved();
      } catch {
        // fallback to local
      }
      setSubmitting(false);
    } else {
      notifySaved();
    }
    nextStep();
    router.push(`/diagnosticos/${id}/paso/3`);
  };

  const onSubmitPareja = async (dataT: FormData, dataP: FormData) => {
    updateFlujoMensual(dataT);
    updateParejaFlujoMensual(dataP);
    completarPaso(2);
    if (isApiMode && id) {
      setSubmitting(true);
      try {
        const res = await api.diagnosticos.putFlujoMensual(id, dataT);
        const outputs = res?.outputs as { motorA?: unknown } | undefined;
        if (outputs?.motorA) updateOutputs("motorA", outputs.motorA);
        notifySaved();
      } catch {
        // fallback to local
      }
      setSubmitting(false);
    } else {
      notifySaved();
    }
    nextStep();
    router.push(`/diagnosticos/${id}/paso/3`);
  };

  const parejaSubmit = handleSubmit(async (dataT) => {
    const valid = await parejaForm.trigger();
    if (!valid) return;
    await onSubmitPareja(dataT, parejaForm.getValues());
  });

  const renderFlujoFields = (role: "titular" | "pareja") => {
    const w = role === "titular" ? watch : parejaForm.watch;
    const s = role === "titular" ? setValue : parejaForm.setValue;
    const errs = role === "titular" ? errors : parejaForm.formState.errors;
    return (
      <div className="space-y-6">
        <div className="space-y-5">
          <h3 className="font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">Ingresos</h3>
          <CurrencyInput label="Capacidad de ahorro mensual" value={w("ahorro")} onChange={(v) => s("ahorro", v)} />
          <CurrencyInput label="Ingresos por rentas" value={w("rentas")} onChange={(v) => s("rentas", v)} />
          <CurrencyInput label="Otros ingresos mensuales" value={w("otros")} onChange={(v) => s("otros", v)} />
        </div>
        <div className="space-y-5">
          <h3 className="font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">Gastos</h3>
          <CurrencyInput label="Gastos básicos mensuales" value={w("gastos_basicos")} onChange={(v) => s("gastos_basicos", v)} error={errs.gastos_basicos?.message} />
          <CurrencyInput label="Obligaciones financieras" value={w("obligaciones")} onChange={(v) => s("obligaciones", v)} />
          <CurrencyInput label="Créditos mensuales" value={w("creditos")} onChange={(v) => s("creditos", v)} />
        </div>
      </div>
    );
  };

  if (modo === "pareja") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-bold font-[family-name:var(--font-poppins)] text-2xl text-white">
            ¿Cómo se mueve tu dinero cada mes?
          </h2>
          <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85] mt-1">
            Titular y pareja
          </p>
        </div>
        <form onSubmit={parejaSubmit} className="space-y-6">
          <ParejaLayout
            titularNombre={perfil?.nombre ?? "Titular"}
            parejaNombre={pareja_perfil?.nombre ?? "Pareja"}
            titularSection={renderFlujoFields("titular")}
            parejaSection={renderFlujoFields("pareja")}
          />
          <div className="flex gap-4 pt-8">
            <Button type="button" variant="ghost" onClick={() => router.push(`/diagnosticos/${id}/paso/1`)}>
              ← Anterior
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Guardando..." : "Siguiente →"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="font-bold font-[family-name:var(--font-poppins)] text-2xl text-white">
          ¿Cómo se mueve tu dinero cada mes?
        </h2>
        <p className="text-sm text-[#8B9BB4] mt-1.5">
          Captura ingresos, gastos y capacidad de ahorro mensual
        </p>
      </div>

      <div className="space-y-6">
        <h3 className="font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">Ingresos</h3>
        <InfoBox content="El dinero que puedes apartar cada mes. Tu principal herramienta para construir patrimonio.">
          <div className="flex flex-col">
            <CurrencyInput label="Capacidad de ahorro mensual" value={watch("ahorro")} onChange={(v) => setValue("ahorro", v)} />
            {sugerencias.has("ahorro") && <SuggestionPill sugerencia={sugerencias.get("ahorro")!} onAccept={() => aceptarSugerencia("ahorro")} onReject={() => rechazarSugerencia("ahorro")} />}
          </div>
        </InfoBox>
        <InfoBox content="Ingresos recurrentes de propiedades en renta.">
          <div className="flex flex-col">
            <CurrencyInput label="Ingresos por rentas" value={watch("rentas")} onChange={(v) => setValue("rentas", v)} />
            {sugerencias.has("rentas") && <SuggestionPill sugerencia={sugerencias.get("rentas")!} onAccept={() => aceptarSugerencia("rentas")} onReject={() => rechazarSugerencia("rentas")} />}
          </div>
        </InfoBox>
        <div className="flex flex-col">
          <CurrencyInput label="Otros ingresos mensuales" value={watch("otros")} onChange={(v) => setValue("otros", v)} />
          {sugerencias.has("otros") && <SuggestionPill sugerencia={sugerencias.get("otros")!} onAccept={() => aceptarSugerencia("otros")} onReject={() => rechazarSugerencia("otros")} />}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">Gastos</h3>
        <InfoBox content="Alimentación, transporte, servicios, educación. No incluyas ahorros.">
          <div className="flex flex-col">
            <CurrencyInput label="Gastos básicos mensuales" value={watch("gastos_basicos")} onChange={(v) => setValue("gastos_basicos", v)} error={errors.gastos_basicos?.message} />
            {sugerencias.has("gastos_basicos") && <SuggestionPill sugerencia={sugerencias.get("gastos_basicos")!} onAccept={() => aceptarSugerencia("gastos_basicos")} onReject={() => rechazarSugerencia("gastos_basicos")} />}
          </div>
        </InfoBox>
        <InfoBox content="Pagos fijos: pensiones alimenticias, colegiaturas, seguros.">
          <div className="flex flex-col">
            <CurrencyInput label="Obligaciones financieras" value={watch("obligaciones")} onChange={(v) => setValue("obligaciones", v)} />
            {sugerencias.has("obligaciones") && <SuggestionPill sugerencia={sugerencias.get("obligaciones")!} onAccept={() => aceptarSugerencia("obligaciones")} onReject={() => rechazarSugerencia("obligaciones")} />}
          </div>
        </InfoBox>
        <InfoBox content="Pagos de créditos activos: hipoteca, auto, tarjetas.">
          <div className="flex flex-col">
            <CurrencyInput label="Créditos mensuales" value={watch("creditos")} onChange={(v) => setValue("creditos", v)} />
            {sugerencias.has("creditos") && <SuggestionPill sugerencia={sugerencias.get("creditos")!} onAccept={() => aceptarSugerencia("creditos")} onReject={() => rechazarSugerencia("creditos")} />}
          </div>
        </InfoBox>
      </div>

      <div className="flex gap-4 pt-8">
        <Button type="button" variant="ghost" onClick={() => router.push(`/diagnosticos/${id}/paso/1`)}>
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button type="submit" variant="accent" disabled={submitting}>
          {submitting ? "Guardando..." : <><span>Siguiente</span><ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </form>
  );
}
