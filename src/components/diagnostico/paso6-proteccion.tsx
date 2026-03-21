"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { useDiagnosticoId } from "@/contexts/diagnostico-context";
import { api } from "@/lib/api-client";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { InfoBox } from "@/components/ui/info-box";
import { ParejaLayout } from "./pareja-layout";
import { useVoiceStore } from "@/stores/voice-store";
import { useUIFeedbackStore } from "@/stores/ui-feedback-store";
import { useVoiceSuggestions } from "@/hooks/use-voice-suggestions";
import { SuggestionPill } from "@/components/voz/suggestion-pill";

const schema = z.object({
  seguro_vida: z.boolean(),
  propiedades_aseguradas: z.boolean().nullable(),
  sgmm: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function Paso6Proteccion() {
  const router = useRouter();
  const pathname = usePathname();
  const { diagnosticoId, isApiMode } = useDiagnosticoId();
  const {
    modo,
    patrimonio,
    pareja_patrimonio,
    perfil,
    pareja_perfil,
    proteccion,
    pareja_proteccion,
    updateProteccion,
    updateParejaProteccion,
    completarPaso,
  } = useDiagnosticoStore();
  const id = diagnosticoId || pathname?.split("/diagnosticos/")[1]?.split("/")[0] || "demo";
  const [submitting, setSubmitting] = useState(false);

  const tieneInmuebles =
    (patrimonio?.casa ?? 0) + (patrimonio?.inmuebles_renta ?? 0) + (patrimonio?.tierra ?? 0) > 0;

  const { handleSubmit, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      seguro_vida: proteccion?.seguro_vida ?? false,
      propiedades_aseguradas: tieneInmuebles ? (proteccion?.propiedades_aseguradas ?? false) : null,
      sgmm: proteccion?.sgmm ?? false,
    },
  });

  const transcript = useVoiceStore((s) => s.transcript);
  const isRecording = useVoiceStore((s) => s.isRecording);
  const { sugerencias, aceptarSugerencia, rechazarSugerencia } = useVoiceSuggestions(
    transcript,
    isRecording,
    6,
    (campo, valor) => setValue(campo as keyof FormData, valor as boolean)
  );
  const notifySaved = useUIFeedbackStore((s) => s.notifySaved);

  const tieneInmueblesPareja =
    (pareja_patrimonio?.casa ?? 0) + (pareja_patrimonio?.inmuebles_renta ?? 0) + (pareja_patrimonio?.tierra ?? 0) > 0;

  const parejaForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      seguro_vida: pareja_proteccion?.seguro_vida ?? true,
      propiedades_aseguradas: tieneInmueblesPareja ? (pareja_proteccion?.propiedades_aseguradas ?? false) : null,
      sgmm: pareja_proteccion?.sgmm ?? false,
    },
  });

  const onSubmit = async (data: FormData) => {
    updateProteccion(data);
    completarPaso(6);
    if (isApiMode && id) {
      setSubmitting(true);
      try {
        await api.diagnosticos.putProteccion(id, data);
        notifySaved();
      } catch {
        // fallback to local
      }
      setSubmitting(false);
    } else {
      notifySaved();
    }
    router.push(`/diagnosticos/${id}/completado`);
  };

  const onSubmitPareja = async (dataT: FormData, dataP: FormData) => {
    updateProteccion(dataT);
    updateParejaProteccion(dataP);
    completarPaso(6);
    if (isApiMode && id) {
      setSubmitting(true);
      try {
        await api.diagnosticos.putProteccion(id, dataT);
        notifySaved();
      } catch {
        // fallback to local
      }
      setSubmitting(false);
    } else {
      notifySaved();
    }
    router.push(`/diagnosticos/${id}/completado`);
  };

  const parejaSubmit = handleSubmit(async (dataT) => {
    const valid = await parejaForm.trigger();
    if (!valid) return;
    await onSubmitPareja(dataT, parejaForm.getValues());
  });

  const renderProteccionFields = (role: "titular" | "pareja") => {
    const w = role === "titular" ? watch : parejaForm.watch;
    const s = role === "titular" ? setValue : parejaForm.setValue;
    const tieneInv = role === "titular" ? tieneInmuebles : tieneInmueblesPareja;
    return (
      <div className="space-y-6">
        <Toggle label="¿Cuenta con seguro de vida?" checked={w("seguro_vida")} onChange={(c) => s("seguro_vida", c)} />
        {tieneInv && <Toggle label="¿Propiedades aseguradas?" checked={w("propiedades_aseguradas") ?? false} onChange={(c) => s("propiedades_aseguradas", c)} />}
        <Toggle label="¿Cuenta con SGMM?" checked={w("sgmm")} onChange={(c) => s("sgmm", c)} />
      </div>
    );
  };

  if (modo === "pareja") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-bold font-[family-name:var(--font-poppins)] text-2xl text-white">
            Protege lo que construiste
          </h2>
          <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85] mt-1">
            Titular y pareja
          </p>
        </div>
        <form onSubmit={parejaSubmit} className="space-y-6">
          <ParejaLayout
            titularNombre={perfil?.nombre ?? "Titular"}
            parejaNombre={pareja_perfil?.nombre ?? "Pareja"}
            titularSection={renderProteccionFields("titular")}
            parejaSection={renderProteccionFields("pareja")}
          />
          <div className="flex gap-4 pt-8">
            <Button type="button" variant="ghost" onClick={() => router.push(`/diagnosticos/${id}/paso/5`)}>
              <ArrowLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button type="submit" variant="accent" className="w-full" size="lg" disabled={submitting}>
              {!submitting && <CheckCircle2 className="h-4 w-4" />}
              {submitting ? "Guardando..." : "Finalizar diagnóstico"}
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
          Protege lo que construiste
        </h2>
      </div>

      <InfoBox content="Protege a tus dependientes económicos.">
        <div className="flex flex-col">
          <Toggle label="¿Cuenta con seguro de vida?" checked={watch("seguro_vida")} onChange={(checked) => setValue("seguro_vida", checked)} />
          {sugerencias.has("seguro_vida") && <SuggestionPill sugerencia={sugerencias.get("seguro_vida")!} onAccept={() => aceptarSugerencia("seguro_vida")} onReject={() => rechazarSugerencia("seguro_vida")} />}
        </div>
      </InfoBox>

      {tieneInmuebles && (
        <div className="flex flex-col">
          <Toggle label="¿Propiedades aseguradas?" checked={watch("propiedades_aseguradas") ?? false} onChange={(checked) => setValue("propiedades_aseguradas", checked)} />
          {sugerencias.has("propiedades_aseguradas") && <SuggestionPill sugerencia={sugerencias.get("propiedades_aseguradas")!} onAccept={() => aceptarSugerencia("propiedades_aseguradas")} onReject={() => rechazarSugerencia("propiedades_aseguradas")} />}
        </div>
      )}

      <InfoBox content="Seguro de Gastos Médicos Mayores. Sin él, una emergencia puede comprometer años de ahorro.">
        <div className="flex flex-col">
          <Toggle label="¿Cuenta con SGMM?" checked={watch("sgmm")} onChange={(checked) => setValue("sgmm", checked)} />
          {sugerencias.has("sgmm") && <SuggestionPill sugerencia={sugerencias.get("sgmm")!} onAccept={() => aceptarSugerencia("sgmm")} onReject={() => rechazarSugerencia("sgmm")} />}
        </div>
      </InfoBox>

      <div className="flex gap-4 pt-8">
        <Button type="button" variant="ghost" onClick={() => router.push(`/diagnosticos/${id}/paso/5`)}>
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button type="submit" variant="accent" className="w-full" size="lg" disabled={submitting}>
          {!submitting && <CheckCircle2 className="h-4 w-4" />}
          {submitting ? "Guardando..." : "Finalizar diagnóstico"}
        </Button>
      </div>
    </form>
  );
}
