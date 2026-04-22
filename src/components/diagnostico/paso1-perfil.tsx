"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { useUIFeedbackStore } from "@/stores/ui-feedback-store";
import { useDiagnosticoId } from "@/contexts/diagnostico-context";
import { api } from "@/lib/api-client";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { InfoBox } from "@/components/ui/info-box";
import { useVoiceStore } from "@/stores/voice-store";
import { useVoiceSuggestions } from "@/hooks/use-voice-suggestions";
import { SuggestionPill } from "@/components/voz/suggestion-pill";
import { ParejaLayout } from "./pareja-layout";

const schema = z.object({
  nombre: z.string().min(1, "Requerido").max(80),
  edad: z.number().min(18).max(90),
  genero: z.enum(["H", "M", "O", "N"]),
  ocupacion: z.enum(["asalariado", "independiente", "empresario"]),
  dependientes: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const generoOptions = [
  { value: "H", label: "Hombre" },
  { value: "M", label: "Mujer" },
  { value: "O", label: "Otro" },
  { value: "N", label: "Prefiero no decir" },
];

const ocupacionOptions = [
  { value: "asalariado", label: "Asalariado" },
  { value: "independiente", label: "Independiente" },
  { value: "empresario", label: "Empresario" },
];

export function Paso1Perfil() {
  const router = useRouter();
  const pathname = usePathname();
  const { diagnosticoId, isApiMode } = useDiagnosticoId();
  const {
    modo,
    perfil,
    pareja_perfil,
    updatePerfil,
    updateParejaPerfil,
    completarPaso,
    nextStep,
  } = useDiagnosticoStore();
  const id = diagnosticoId || pathname?.split("/diagnosticos/")[1]?.split("/")[0] || "demo";
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: perfil?.nombre ?? "",
      edad: perfil?.edad || undefined,
      genero: (perfil?.genero as "H" | "M" | "O" | "N") || ("" as "H"),
      ocupacion: (perfil?.ocupacion as "asalariado" | "independiente" | "empresario") || ("" as "asalariado"),
      dependientes: perfil?.dependientes ?? false,
    },
  });

  const dependientes = watch("dependientes");
  const transcript = useVoiceStore((s) => s.transcript);
  const isRecording = useVoiceStore((s) => s.isRecording);
  const { sugerencias, aceptarSugerencia, rechazarSugerencia } = useVoiceSuggestions(
    transcript,
    isRecording,
    1,
    (campo, valor) => setValue(campo as keyof FormData, valor as string | number | boolean)
  );

  const notifySaved = useUIFeedbackStore((s) => s.notifySaved);

  const onSubmit = async (data: FormData) => {
    updatePerfil(data);
    completarPaso(1);
    if (isApiMode && id) {
      setSubmitting(true);
      try {
        await api.diagnosticos.putPerfil(id, data);
        notifySaved();
      } catch {
        // fallback to local
      }
      setSubmitting(false);
    } else {
      notifySaved();
    }
    nextStep();
    router.push(`/diagnosticos/${id}/paso/2`);
  };

  const parejaSchema = z.object({
    nombre: z.string().min(1, "Requerido").max(80),
    edad: z.number().min(18).max(90),
    genero: z.enum(["H", "M", "O", "N"]),
    ocupacion: z.enum(["asalariado", "independiente", "empresario"]),
    dependientes: z.boolean(),
  });
  const parejaForm = useForm<FormData>({
    resolver: zodResolver(parejaSchema),
    defaultValues: {
      nombre: pareja_perfil?.nombre ?? "",
      edad: pareja_perfil?.edad || undefined,
      genero: (pareja_perfil?.genero as "H" | "M" | "O" | "N") || ("" as "H"),
      ocupacion: (pareja_perfil?.ocupacion as "asalariado" | "independiente" | "empresario") || ("" as "asalariado"),
      dependientes: pareja_perfil?.dependientes ?? false,
    },
  });

  const onSubmitPareja = async (dataTitular: FormData, dataPareja: FormData) => {
    updatePerfil(dataTitular);
    updateParejaPerfil(dataPareja);
    completarPaso(1);
    if (isApiMode && id) {
      setSubmitting(true);
      try {
        await api.diagnosticos.putPerfil(id, dataTitular);
        notifySaved();
      } catch {
        // fallback to local
      }
      setSubmitting(false);
    } else {
      notifySaved();
    }
    nextStep();
    router.push(`/diagnosticos/${id}/paso/2`);
  };

  const parejaSubmit = handleSubmit(async (dataT) => {
    const validP = await parejaForm.trigger();
    if (!validP) return;
    const dataP = parejaForm.getValues();
    await onSubmitPareja(dataT, dataP);
  });

  const formContent = (role: "titular" | "pareja") => {
    const r = role === "titular" ? register : parejaForm.register;
    const w = role === "titular" ? watch : parejaForm.watch;
    const s = role === "titular" ? setValue : parejaForm.setValue;
    const errs = role === "titular" ? errors : parejaForm.formState.errors;
    return (
      <div className="space-y-5">
        <Input
          label="Nombre o alias"
          placeholder="Ej: Juan Pérez"
          maxLength={80}
          error={errs.nombre?.message}
          {...r("nombre")}
        />
        <Input
          label="Edad actual"
          type="number"
          min={18}
          max={90}
          error={errs.edad?.message}
          {...r("edad", { valueAsNumber: true })}
        />
        <Select
          label="Género"
          options={generoOptions}
          value={w("genero")}
          onValueChange={(v) => s("genero", v as "H" | "M" | "O" | "N")}
        />
        <Select
          label="Ocupación"
          options={ocupacionOptions}
          value={w("ocupacion")}
          onValueChange={(v) => s("ocupacion", v as "asalariado" | "independiente" | "empresario")}
        />
        <Toggle
          label="¿Tiene dependientes económicos?"
          checked={w("dependientes")}
          onChange={(checked) => s("dependientes", checked)}
        />
      </div>
    );
  };

  if (modo === "pareja") {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-bold font-[family-name:var(--font-poppins)] text-2xl text-[#F0F4FA]">
            ¿Quiénes son tus clientes?
          </h2>
          <p className="text-sm text-[#8B9BB4] mt-1.5">
            Datos del titular y la pareja
          </p>
        </div>
        <form onSubmit={parejaSubmit} className="space-y-5">
          <ParejaLayout
            titularNombre={perfil?.nombre || watch("nombre") || "Titular"}
            parejaNombre={pareja_perfil?.nombre || parejaForm.watch("nombre") || "Pareja"}
            titularSection={formContent("titular")}
            parejaSection={formContent("pareja")}
          />
          <div className="flex gap-4 pt-8">
            <Button type="submit" variant="accent" loading={submitting} disabled={submitting}>
              {!submitting && <ArrowRight className="h-4 w-4" />}
              {submitting ? "Guardando..." : "Continuar"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h2 className="font-bold font-[family-name:var(--font-poppins)] text-2xl text-[#F0F4FA]">
          ¿Quién es tu cliente?
        </h2>
        <p className="text-sm text-[#8B9BB4] mt-1.5">
          Estos datos personalizan el diagnóstico
        </p>
      </div>

      <InfoBox content="El nombre se usa solo para identificar el diagnóstico. Puedes usar un alias.">
        <div className="flex flex-col">
          <Input
            label="Nombre o alias"
            placeholder="Ej: Juan Pérez"
            maxLength={80}
            error={errors.nombre?.message}
            {...register("nombre")}
          />
          {sugerencias.has("nombre") && (
            <SuggestionPill sugerencia={sugerencias.get("nombre")!} onAccept={() => aceptarSugerencia("nombre")} onReject={() => rechazarSugerencia("nombre")} />
          )}
        </div>
      </InfoBox>

      <InfoBox content="La edad determina el horizonte de inversión y los benchmarks de patrimonio.">
        <div className="flex flex-col">
          <Input
            label="Edad actual"
            type="number"
            min={18}
            max={90}
            error={errors.edad?.message}
            {...register("edad", { valueAsNumber: true })}
          />
          {sugerencias.has("edad") && (
            <SuggestionPill sugerencia={sugerencias.get("edad")!} onAccept={() => aceptarSugerencia("edad")} onReject={() => rechazarSugerencia("edad")} />
          )}
        </div>
      </InfoBox>

      <div className="flex flex-col">
        <Select
          label="Género"
          options={generoOptions}
          error={errors.genero?.message}
          value={watch("genero")}
          onValueChange={(v) => setValue("genero", v as "H" | "M" | "O" | "N")}
        />
        {sugerencias.has("genero") && (
          <SuggestionPill sugerencia={sugerencias.get("genero")!} onAccept={() => aceptarSugerencia("genero")} onReject={() => rechazarSugerencia("genero")} />
        )}
      </div>

      <InfoBox content="La ocupación influye en las fuentes de ingreso para tu plan de retiro.">
        <div className="flex flex-col">
          <Select
            label="Ocupación"
            options={ocupacionOptions}
            error={errors.ocupacion?.message}
            value={watch("ocupacion")}
            onValueChange={(v) => setValue("ocupacion", v as "asalariado" | "independiente" | "empresario")}
          />
          {sugerencias.has("ocupacion") && (
            <SuggestionPill sugerencia={sugerencias.get("ocupacion")!} onAccept={() => aceptarSugerencia("ocupacion")} onReject={() => rechazarSugerencia("ocupacion")} />
          )}
        </div>
      </InfoBox>

      <InfoBox content="Si tienes personas que dependen de ti, las recomendaciones de protección se ajustan.">
        <div className="flex flex-col">
          <Toggle
            label="¿Tiene dependientes económicos?"
            checked={dependientes}
            onChange={(checked) => setValue("dependientes", checked)}
          />
          {sugerencias.has("dependientes") && (
            <SuggestionPill sugerencia={sugerencias.get("dependientes")!} onAccept={() => aceptarSugerencia("dependientes")} onReject={() => rechazarSugerencia("dependientes")} />
          )}
        </div>
      </InfoBox>

      <div className="flex gap-4 pt-8">
        <Button type="submit" variant="accent" loading={submitting} disabled={submitting}>
          {!submitting && <ArrowRight className="h-4 w-4" />}
          {submitting ? "Guardando..." : "Continuar"}
        </Button>
      </div>
    </form>
  );
}
