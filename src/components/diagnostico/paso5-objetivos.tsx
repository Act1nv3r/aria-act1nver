"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { useDiagnosticoId } from "@/contexts/diagnostico-context";
import { api } from "@/lib/api-client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";
import { ParejaLayout } from "./pareja-layout";
import { useVoiceStore } from "@/stores/voice-store";
import { useUIFeedbackStore } from "@/stores/ui-feedback-store";
import { useVoiceSuggestions } from "@/hooks/use-voice-suggestions";
import { SuggestionPill } from "@/components/voz/suggestion-pill";

const objetivoSchema = z.object({
  nombre: z.string().max(40),
  monto: z.number().min(0),
  plazo: z.number().min(1),
});

const schema = z.object({
  aportacion_inicial: z.number().min(0),
  aportacion_mensual: z.number().min(0),
  lista: z.array(objetivoSchema).max(5),
});

type FormData = z.infer<typeof schema>;

export function Paso5Objetivos() {
  const router = useRouter();
  const pathname = usePathname();
  const { diagnosticoId, isApiMode } = useDiagnosticoId();
  const {
    modo,
    objetivos,
    pareja_objetivos,
    perfil,
    pareja_perfil,
    retiro,
    pareja_retiro,
    updateObjetivos,
    updateParejaObjetivos,
    completarPaso,
    nextStep,
  } = useDiagnosticoStore();
  const id = diagnosticoId || pathname?.split("/diagnosticos/")[1]?.split("/")[0] || "demo";
  const [submitting, setSubmitting] = useState(false);

  const edad = perfil?.edad ?? 50;
  const edadRetiro = retiro?.edad_retiro ?? 60;
  const maxPlazo = edadRetiro - edad;

  const { handleSubmit, control, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      aportacion_inicial: objetivos?.aportacion_inicial ?? 0,
      aportacion_mensual: objetivos?.aportacion_mensual ?? 0,
      lista: objetivos?.lista?.length ? objetivos.lista : [],
    },
  });

  const transcript = useVoiceStore((s) => s.transcript);
  const isRecording = useVoiceStore((s) => s.isRecording);
  const { sugerencias, aceptarSugerencia, rechazarSugerencia } = useVoiceSuggestions(
    transcript,
    isRecording,
    5,
    (campo, valor) => setValue(campo as keyof FormData, valor as number)
  );
  const notifySaved = useUIFeedbackStore((s) => s.notifySaved);

  const { fields, append, remove } = useFieldArray({ control, name: "lista" });

  const saveAndNext = async (data: FormData) => {
    updateObjetivos(data);
    completarPaso(5);
    if (isApiMode && id) {
      setSubmitting(true);
      try {
        await api.diagnosticos.putObjetivos(id, data);
        notifySaved();
      } catch {
        // fallback to local
      }
      setSubmitting(false);
    } else {
      notifySaved();
    }
    nextStep();
    router.push(`/diagnosticos/${id}/paso/6`);
  };

  const onSubmit = (data: FormData) => saveAndNext(data);

  const handleSkip = () => {
    const data = {
      aportacion_inicial: watch("aportacion_inicial"),
      aportacion_mensual: watch("aportacion_mensual"),
      lista: [] as Array<{ nombre: string; monto: number; plazo: number }>,
    };
    saveAndNext(data);
  };

  const edadPareja = pareja_perfil?.edad ?? 48;
  const edadRetiroPareja = pareja_retiro?.edad_retiro ?? 62;
  const maxPlazoPareja = edadRetiroPareja - edadPareja;
  const parejaForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      aportacion_inicial: pareja_objetivos?.aportacion_inicial ?? 200000,
      aportacion_mensual: pareja_objetivos?.aportacion_mensual ?? 10000,
      lista: pareja_objetivos?.lista?.length ? pareja_objetivos.lista : [],
    },
  });
  const { fields: fieldsPareja, append: appendPareja, remove: removePareja } = useFieldArray({ control: parejaForm.control, name: "lista" });

  const saveAndNextPareja = async (dataT: FormData, dataP: FormData) => {
    updateObjetivos(dataT);
    updateParejaObjetivos(dataP);
    completarPaso(5);
    if (isApiMode && id) {
      setSubmitting(true);
      try {
        await api.diagnosticos.putObjetivos(id, dataT);
        notifySaved();
      } catch {
        // fallback to local
      }
      setSubmitting(false);
    } else {
      notifySaved();
    }
    nextStep();
    router.push(`/diagnosticos/${id}/paso/6`);
  };

  const parejaSubmit = handleSubmit(async (dataT) => {
    const valid = await parejaForm.trigger();
    if (!valid) return;
    await saveAndNextPareja(dataT, parejaForm.getValues());
  });

  const renderObjetivosFields = (role: "titular" | "pareja") => {
    const f = role === "titular" ? { watch, setValue, control, fields: fields, append, remove } : { watch: parejaForm.watch, setValue: parejaForm.setValue, control: parejaForm.control, fields: fieldsPareja, append: appendPareja, remove: removePareja };
    const maxP = role === "titular" ? maxPlazo : maxPlazoPareja;
    return (
      <div className="space-y-4">
        <CurrencyInput label="Aportación inicial" value={f.watch("aportacion_inicial")} onChange={(v) => f.setValue("aportacion_inicial", v)} />
        <CurrencyInput label="Aportación mensual" value={f.watch("aportacion_mensual")} onChange={(v) => f.setValue("aportacion_mensual", v)} />
        {f.fields.map((field, idx) => (
          <Card key={field.id} className="relative">
            <button type="button" onClick={() => f.remove(idx)} className="absolute top-4 right-4 text-[#5A6A85] hover:text-[#8B3A3A]">
              <X className="h-4 w-4" />
            </button>
            <div className="space-y-4 pr-8">
              <Input label="Nombre del objetivo" placeholder="Ej: Educación hijos" maxLength={40} {...f.control.register(`lista.${idx}.nombre`)} />
              <CurrencyInput label="Monto" value={f.watch(`lista.${idx}.monto`)} onChange={(v) => f.setValue(`lista.${idx}.monto`, v)} />
              <Input label="Plazo (años)" type="number" min={1} max={maxP} {...f.control.register(`lista.${idx}.plazo`, { valueAsNumber: true })} />
            </div>
          </Card>
        ))}
        {f.fields.length < 5 && (
          <Button type="button" variant="outline" className="border-[#E6C78A] text-[#E6C78A] hover:bg-[#E6C78A]/10" onClick={() => f.append({ nombre: "", monto: 0, plazo: 1 })}>
            + Agregar objetivo
          </Button>
        )}
      </div>
    );
  };

  if (modo === "pareja") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-bold font-[family-name:var(--font-poppins)] text-2xl text-white">
            Tus metas personales
          </h2>
          <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85] mt-1">
            Titular y pareja · Paso opcional
          </p>
        </div>
        <form onSubmit={parejaSubmit} className="space-y-6">
          <ParejaLayout
            titularNombre={perfil?.nombre ?? "Titular"}
            parejaNombre={pareja_perfil?.nombre ?? "Pareja"}
            titularSection={renderObjetivosFields("titular")}
            parejaSection={renderObjetivosFields("pareja")}
          />
          <div className="flex gap-4 pt-8">
            <Button type="button" variant="ghost" onClick={() => router.push(`/diagnosticos/${id}/paso/4`)}>
              <ArrowLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                saveAndNextPareja(
                  { aportacion_inicial: watch("aportacion_inicial"), aportacion_mensual: watch("aportacion_mensual"), lista: [] },
                  { aportacion_inicial: parejaForm.watch("aportacion_inicial"), aportacion_mensual: parejaForm.watch("aportacion_mensual"), lista: [] }
                )
              }
            >
              Saltar este paso <ArrowRight className="h-4 w-4" />
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
          Tus metas personales
        </h2>
        <p className="text-sm text-[#8B9BB4] mt-1.5">
          Paso opcional — puedes omitirlo y continuar
        </p>
      </div>

      <div className="flex flex-col">
        <CurrencyInput label="Aportación inicial" value={watch("aportacion_inicial")} onChange={(v) => setValue("aportacion_inicial", v)} />
        {sugerencias.has("aportacion_inicial") && <SuggestionPill sugerencia={sugerencias.get("aportacion_inicial")!} onAccept={() => aceptarSugerencia("aportacion_inicial")} onReject={() => rechazarSugerencia("aportacion_inicial")} />}
      </div>
      <div className="flex flex-col">
        <CurrencyInput label="Aportación mensual" value={watch("aportacion_mensual")} onChange={(v) => setValue("aportacion_mensual", v)} />
        {sugerencias.has("aportacion_mensual") && <SuggestionPill sugerencia={sugerencias.get("aportacion_mensual")!} onAccept={() => aceptarSugerencia("aportacion_mensual")} onReject={() => rechazarSugerencia("aportacion_mensual")} />}
      </div>

      <div className="space-y-4">
        {fields.map((field, idx) => (
          <Card key={field.id} className="relative">
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute top-4 right-4 text-[#5A6A85] hover:text-[#8B3A3A]"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="space-y-4 pr-8">
              <Input
                label="Nombre del objetivo"
                placeholder="Ej: Educación hijos"
                maxLength={40}
                {...control.register(`lista.${idx}.nombre`)}
              />
              <CurrencyInput
                label="Monto"
                value={watch(`lista.${idx}.monto`)}
                onChange={(v) => setValue(`lista.${idx}.monto`, v)}
              />
              <Input
                label="Plazo (años)"
                type="number"
                min={1}
                max={maxPlazo}
                {...control.register(`lista.${idx}.plazo`, { valueAsNumber: true })}
                error={watch(`lista.${idx}.plazo`) > maxPlazo ? "El plazo excede tu edad de retiro" : undefined}
              />
            </div>
          </Card>
        ))}

        {fields.length < 5 && (
          <Button
            type="button"
            variant="outline"
            className="border-[#E6C78A] text-[#E6C78A] hover:bg-[#E6C78A]/10"
            onClick={() => append({ nombre: "", monto: 0, plazo: 1 })}
          >
            + Agregar objetivo
          </Button>
        )}
      </div>

      <div className="flex gap-4 pt-8">
        <Button type="button" variant="ghost" onClick={() => router.push(`/diagnosticos/${id}/paso/4`)}>
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button type="button" variant="ghost" onClick={handleSkip}>
          Saltar este paso <ArrowRight className="h-4 w-4" />
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Guardando..." : <><span>Siguiente</span><ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </form>
  );
}
