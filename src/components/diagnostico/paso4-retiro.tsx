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
import { Slider } from "@/components/ui/slider";
import { InfoBox } from "@/components/ui/info-box";
import { formatMXN } from "@/lib/format-currency";
import { ParejaLayout } from "./pareja-layout";
import { useVoiceStore } from "@/stores/voice-store";
import { useUIFeedbackStore } from "@/stores/ui-feedback-store";
import { useVoiceSuggestions } from "@/hooks/use-voice-suggestions";
import { SuggestionPill } from "@/components/voz/suggestion-pill";

export function Paso4Retiro() {
  const router = useRouter();
  const pathname = usePathname();
  const { diagnosticoId, isApiMode } = useDiagnosticoId();
  const {
    modo,
    perfil,
    pareja_perfil,
    flujoMensual,
    pareja_flujoMensual,
    retiro,
    pareja_retiro,
    updateRetiro,
    updateParejaRetiro,
    completarPaso,
    nextStep,
  } = useDiagnosticoStore();
  const id = diagnosticoId || pathname?.split("/diagnosticos/")[1]?.split("/")[0] || "demo";
  const [submitting, setSubmitting] = useState(false);

  const edad = perfil?.edad ?? 50;
  const gastosBasicos = flujoMensual?.gastos_basicos ?? 0;
  const obligaciones = flujoMensual?.obligaciones ?? 0;

  const schema = z.object({
    edad_retiro: z.number().min(edad + 1).max(70),
    mensualidad_deseada: z.number().min(0),
    edad_defuncion: z.number().min(60).max(95),
  });

  type FormData = z.infer<typeof schema>;

  const { handleSubmit, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      edad_retiro: retiro?.edad_retiro ?? 60,
      mensualidad_deseada: retiro?.mensualidad_deseada ?? 50000,
      edad_defuncion: retiro?.edad_defuncion ?? 90,
    },
  });

  const transcript = useVoiceStore((s) => s.transcript);
  const isRecording = useVoiceStore((s) => s.isRecording);
  const { sugerencias, aceptarSugerencia, rechazarSugerencia } = useVoiceSuggestions(
    transcript,
    isRecording,
    4,
    (campo, valor) => setValue(campo as keyof FormData, valor as number)
  );
  const notifySaved = useUIFeedbackStore((s) => s.notifySaved);

  const edadRetiro = watch("edad_retiro");

  const edadPareja = pareja_perfil?.edad ?? 48;
  const gastosPareja = pareja_flujoMensual?.gastos_basicos ?? 0;
  const obligPareja = pareja_flujoMensual?.obligaciones ?? 0;
  const schemaPareja = z.object({
    edad_retiro: z.number().min(edadPareja + 1).max(70),
    mensualidad_deseada: z.number().min(0),
    edad_defuncion: z.number().min(60).max(95),
  });
  type FormDataP = z.infer<typeof schemaPareja>;

  const parejaForm = useForm<FormDataP>({
    resolver: zodResolver(schemaPareja),
    defaultValues: {
      edad_retiro: pareja_retiro?.edad_retiro ?? 62,
      mensualidad_deseada: pareja_retiro?.mensualidad_deseada ?? 40000,
      edad_defuncion: pareja_retiro?.edad_defuncion ?? 90,
    },
  });

  const onSubmit = async (data: FormData) => {
    updateRetiro(data);
    completarPaso(4);
    if (isApiMode && id) {
      setSubmitting(true);
      try {
        await api.diagnosticos.putRetiro(id, data);
        notifySaved();
      } catch {
        // fallback to local
      }
      setSubmitting(false);
    } else {
      notifySaved();
    }
    nextStep();
    router.push(`/diagnosticos/${id}/paso/5`);
  };

  const onSubmitPareja = async (dataT: FormData, dataP: FormDataP) => {
    updateRetiro(dataT);
    updateParejaRetiro(dataP);
    completarPaso(4);
    if (isApiMode && id) {
      setSubmitting(true);
      try {
        await api.diagnosticos.putRetiro(id, dataT);
        notifySaved();
      } catch {
        // fallback to local
      }
      setSubmitting(false);
    } else {
      notifySaved();
    }
    nextStep();
    router.push(`/diagnosticos/${id}/paso/5`);
  };

  const parejaSubmit = handleSubmit(async (dataT) => {
    const valid = await parejaForm.trigger();
    if (!valid) return;
    await onSubmitPareja(dataT, parejaForm.getValues());
  });

  const renderRetiroFields = (role: "titular" | "pareja") => {
    const ed = role === "titular" ? edad : edadPareja;
    const gastos = role === "titular" ? gastosBasicos : gastosPareja;
    const oblig = role === "titular" ? obligaciones : obligPareja;
    const w = role === "titular" ? watch : parejaForm.watch;
    const s = role === "titular" ? setValue : parejaForm.setValue;
    return (
      <div className="space-y-6">
        <Slider label="Edad de retiro" min={ed + 1} max={70} step={1} value={[w("edad_retiro")]} onChange={(v) => s("edad_retiro", v[0])} formatValue={(v) => `${v} años`} />
        <div className="space-y-2">
          <CurrencyInput label="Mensualidad deseada en retiro" value={w("mensualidad_deseada")} onChange={(v) => s("mensualidad_deseada", v)} />
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">Sugerencia: {formatMXN(gastos + oblig)}/mes</p>
        </div>
        <Slider label="Edad de defunción estimada" min={w("edad_retiro")} max={95} step={1} value={[w("edad_defuncion")]} onChange={(v) => s("edad_defuncion", v[0])} formatValue={(v) => `${v} años`} />
      </div>
    );
  };

  if (modo === "pareja") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-bold font-[family-name:var(--font-poppins)] text-2xl text-white">
            Diseña tu retiro ideal
          </h2>
          <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85] mt-1">
            Titular y pareja
          </p>
        </div>
        <form onSubmit={parejaSubmit} className="space-y-6">
          <ParejaLayout
            titularNombre={perfil?.nombre ?? "Titular"}
            parejaNombre={pareja_perfil?.nombre ?? "Pareja"}
            titularSection={renderRetiroFields("titular")}
            parejaSection={renderRetiroFields("pareja")}
          />
          <div className="flex gap-4 pt-8">
            <Button type="button" variant="ghost" onClick={() => router.push(`/diagnosticos/${id}/paso/3`)}>
              <ArrowLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Guardando..." : <><span>Siguiente</span><ArrowRight className="h-4 w-4" /></>}
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
          Diseña tu retiro ideal
        </h2>
      </div>

      <InfoBox content="Cada año adicional de trabajo puede mejorar significativamente tu retiro.">
        <div className="flex flex-col">
          <Slider label="Edad de retiro" min={edad + 1} max={70} step={1} value={[watch("edad_retiro")]} onChange={(v) => setValue("edad_retiro", v[0])} formatValue={(v) => `${v} años`} />
          {sugerencias.has("edad_retiro") && <SuggestionPill sugerencia={sugerencias.get("edad_retiro")!} onAccept={() => aceptarSugerencia("edad_retiro")} onReject={() => rechazarSugerencia("edad_retiro")} />}
        </div>
      </InfoBox>

      <InfoBox content="¿Cuánto necesitas al mes para vivir cómodamente cuando te retires?">
        <div className="space-y-2 flex flex-col">
          <CurrencyInput label="Mensualidad deseada en retiro" value={watch("mensualidad_deseada")} onChange={(v) => setValue("mensualidad_deseada", v)} />
          {sugerencias.has("mensualidad_deseada") && <SuggestionPill sugerencia={sugerencias.get("mensualidad_deseada")!} onAccept={() => aceptarSugerencia("mensualidad_deseada")} onReject={() => rechazarSugerencia("mensualidad_deseada")} />}
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">Sugerencia: Tus gastos actuales: {formatMXN(gastosBasicos + obligaciones)}/mes</p>
        </div>
      </InfoBox>

      <InfoBox content="Esperanza de vida MX: 76 años. Para planeación se recomienda 85-90 por seguridad.">
        <div className="flex flex-col">
          <Slider label="Edad de defunción estimada" min={edadRetiro} max={95} step={1} value={[watch("edad_defuncion")]} onChange={(v) => setValue("edad_defuncion", v[0])} formatValue={(v) => `${v} años`} />
          {sugerencias.has("edad_defuncion") && <SuggestionPill sugerencia={sugerencias.get("edad_defuncion")!} onAccept={() => aceptarSugerencia("edad_defuncion")} onReject={() => rechazarSugerencia("edad_defuncion")} />}
        </div>
      </InfoBox>

      <div className="flex gap-4 pt-8">
        <Button type="button" variant="ghost" onClick={() => router.push(`/diagnosticos/${id}/paso/3`)}>
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Guardando..." : <><span>Siguiente</span><ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </form>
  );
}
