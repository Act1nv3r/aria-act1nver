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
import { AccordionItem } from "@/components/ui/accordion";
import { InfoBox } from "@/components/ui/info-box";
import { formatMXN } from "@/lib/format-currency";
import { ParejaLayout } from "./pareja-layout";
import { OwnershipChip } from "./ownership-chip";
import { useVoiceStore } from "@/stores/voice-store";
import { useUIFeedbackStore } from "@/stores/ui-feedback-store";
import { useVoiceSuggestions } from "@/hooks/use-voice-suggestions";
import { SuggestionPill } from "@/components/voz/suggestion-pill";

const schema = z.object({
  liquidez: z.number().min(0),
  inversiones: z.number().min(0),
  dotales: z.number().min(0),
  afore: z.number().min(0),
  ppr: z.number().min(0),
  plan_privado: z.number().min(0),
  seguros_retiro: z.number().min(0),
  ley_73: z.number().min(0).nullable(),
  casa: z.number().min(0),
  inmuebles_renta: z.number().min(0),
  tierra: z.number().min(0),
  negocio: z.number().min(0),
  herencia: z.number().min(0),
  hipoteca: z.number().min(0),
  saldo_planes: z.number().min(0),
  compromisos: z.number().min(0),
});

type FormData = z.infer<typeof schema>;

export function Paso3Patrimonio() {
  const router = useRouter();
  const pathname = usePathname();
  const { diagnosticoId, isApiMode } = useDiagnosticoId();
  const {
    modo,
    patrimonio,
    pareja_patrimonio,
    perfil,
    pareja_perfil,
    ownership,
    updatePatrimonio,
    updateParejaPatrimonio,
    updateOwnership,
    completarPaso,
    nextStep,
  } = useDiagnosticoStore();
  const id = diagnosticoId || pathname?.split("/diagnosticos/")[1]?.split("/")[0] || "demo";
  const [submitting, setSubmitting] = useState(false);
  const showLey73 = (perfil?.edad ?? 0) >= 46;
  const showLey73Pareja = (pareja_perfil?.edad ?? 0) >= 46;

  const { handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      liquidez: patrimonio?.liquidez ?? 0,
      inversiones: patrimonio?.inversiones ?? 0,
      dotales: patrimonio?.dotales ?? 0,
      afore: patrimonio?.afore ?? 0,
      ppr: patrimonio?.ppr ?? 0,
      plan_privado: patrimonio?.plan_privado ?? 0,
      seguros_retiro: patrimonio?.seguros_retiro ?? 0,
      ley_73: patrimonio?.ley_73 ?? null,
      casa: patrimonio?.casa ?? 0,
      inmuebles_renta: patrimonio?.inmuebles_renta ?? 0,
      tierra: patrimonio?.tierra ?? 0,
      negocio: patrimonio?.negocio ?? 0,
      herencia: patrimonio?.herencia ?? 0,
      hipoteca: patrimonio?.hipoteca ?? 0,
      saldo_planes: patrimonio?.saldo_planes ?? 0,
      compromisos: patrimonio?.compromisos ?? 0,
    },
  });

  const transcript = useVoiceStore((s) => s.transcript);
  const isRecording = useVoiceStore((s) => s.isRecording);
  const { sugerencias, aceptarSugerencia, rechazarSugerencia } = useVoiceSuggestions(
    transcript,
    isRecording,
    3,
    (campo, valor) => setValue(campo as keyof FormData, valor as number | null)
  );
  const notifySaved = useUIFeedbackStore((s) => s.notifySaved);

  const finTotal =
    watch("liquidez") + watch("inversiones") + watch("dotales");
  const pasivosTotal =
    watch("hipoteca") + watch("saldo_planes") + watch("compromisos");

  const parejaForm = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      liquidez: pareja_patrimonio?.liquidez ?? 100000,
      inversiones: pareja_patrimonio?.inversiones ?? 500000,
      dotales: pareja_patrimonio?.dotales ?? 0,
      afore: pareja_patrimonio?.afore ?? 600000,
      ppr: pareja_patrimonio?.ppr ?? 0,
      plan_privado: pareja_patrimonio?.plan_privado ?? 0,
      seguros_retiro: pareja_patrimonio?.seguros_retiro ?? 0,
      ley_73: pareja_patrimonio?.ley_73 ?? null,
      casa: pareja_patrimonio?.casa ?? 0,
      inmuebles_renta: pareja_patrimonio?.inmuebles_renta ?? 0,
      tierra: pareja_patrimonio?.tierra ?? 0,
      negocio: pareja_patrimonio?.negocio ?? 300000,
      herencia: pareja_patrimonio?.herencia ?? 0,
      hipoteca: pareja_patrimonio?.hipoteca ?? 0,
      saldo_planes: pareja_patrimonio?.saldo_planes ?? 0,
      compromisos: pareja_patrimonio?.compromisos ?? 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    updatePatrimonio(data);
    completarPaso(3);
    if (isApiMode && id) {
      setSubmitting(true);
      try {
        const payload = { ...data, ley_73: data.ley_73 ?? null };
        await api.diagnosticos.putPatrimonio(id, payload);
        notifySaved();
      } catch {
        // fallback to local
      }
      setSubmitting(false);
    } else {
      notifySaved();
    }
    nextStep();
    router.push(`/diagnosticos/${id}/paso/4`);
  };

  const onSubmitPareja = async (dataT: FormData, dataP: FormData) => {
    updatePatrimonio(dataT);
    updateParejaPatrimonio(dataP);
    completarPaso(3);
    if (isApiMode && id) {
      setSubmitting(true);
      try {
        await api.diagnosticos.putPatrimonio(id, dataT);
        notifySaved();
      } catch {
        // fallback to local
      }
      setSubmitting(false);
    } else {
      notifySaved();
    }
    nextStep();
    router.push(`/diagnosticos/${id}/paso/4`);
  };

  const parejaSubmit = handleSubmit(async (dataT) => {
    const valid = await parejaForm.trigger();
    if (!valid) return;
    await onSubmitPareja(dataT, parejaForm.getValues());
  });

  const renderPatrimonioFields = (role: "titular" | "pareja") => {
    const w = role === "titular" ? watch : parejaForm.watch;
    const s = role === "titular" ? setValue : parejaForm.setValue;
    const showLey = role === "titular" ? showLey73 : showLey73Pareja;
    const finT = w("liquidez") + w("inversiones") + w("dotales");
    const pasT = w("hipoteca") + w("saldo_planes") + w("compromisos");
    return (
      <div className="space-y-4">
        <AccordionItem title="Patrimonio Financiero" total={formatMXN(finT)} defaultOpen>
          <div className="space-y-4">
            <CurrencyInput label="Liquidez" value={w("liquidez")} onChange={(v) => s("liquidez", v)} />
            <CurrencyInput label="Inversiones" value={w("inversiones")} onChange={(v) => s("inversiones", v)} />
            <CurrencyInput label="Dotales" value={w("dotales")} onChange={(v) => s("dotales", v)} />
          </div>
        </AccordionItem>
        <AccordionItem title="Esquemas de Retiro" total="">
          <div className="space-y-4">
            <CurrencyInput label="Afore" value={w("afore")} onChange={(v) => s("afore", v)} />
            <CurrencyInput label="PPR" value={w("ppr")} onChange={(v) => s("ppr", v)} />
            <CurrencyInput label="Plan privado" value={w("plan_privado")} onChange={(v) => s("plan_privado", v)} />
            <CurrencyInput label="Seguros retiro" value={w("seguros_retiro")} onChange={(v) => s("seguros_retiro", v)} />
            {showLey && (
              <CurrencyInput label="Mensualidad Ley 73" value={w("ley_73") ?? 0} onChange={(v) => s("ley_73", v)} />
            )}
          </div>
        </AccordionItem>
        <AccordionItem title="Patrimonio No Financiero" total="">
          <div className="space-y-4">
            <CurrencyInput label="Casa" value={w("casa")} onChange={(v) => s("casa", v)} />
            <CurrencyInput label="Inmuebles renta" value={w("inmuebles_renta")} onChange={(v) => s("inmuebles_renta", v)} />
            <CurrencyInput label="Tierra" value={w("tierra")} onChange={(v) => s("tierra", v)} />
            <CurrencyInput label="Negocio" value={w("negocio")} onChange={(v) => s("negocio", v)} />
            <CurrencyInput label="Herencia" value={w("herencia")} onChange={(v) => s("herencia", v)} />
          </div>
        </AccordionItem>
        <AccordionItem title="Pasivos y Obligaciones" total={formatMXN(pasT)}>
          <div className="space-y-4">
            <CurrencyInput label="Hipoteca" value={w("hipoteca")} onChange={(v) => s("hipoteca", v)} />
            <CurrencyInput label="Saldo planes" value={w("saldo_planes")} onChange={(v) => s("saldo_planes", v)} />
            <CurrencyInput label="Compromisos" value={w("compromisos")} onChange={(v) => s("compromisos", v)} />
          </div>
        </AccordionItem>
      </div>
    );
  };

  const ownershipSection = (
    <div className="space-y-3">
      <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85] mb-2">
        Indica quién es dueño de cada activo o pasivo
      </p>
      <OwnershipChip asset="casa" label="Casa" value={ownership.casa ?? "titular"} onChange={updateOwnership} />
      <OwnershipChip asset="inmuebles_renta" label="Inmuebles renta" value={ownership.inmuebles_renta ?? "titular"} onChange={updateOwnership} />
      <OwnershipChip asset="tierra" label="Tierra" value={ownership.tierra ?? "titular"} onChange={updateOwnership} />
      <OwnershipChip asset="negocio" label="Negocio" value={ownership.negocio ?? "titular"} onChange={updateOwnership} />
      <OwnershipChip asset="herencia" label="Herencia" value={ownership.herencia ?? "titular"} onChange={updateOwnership} />
      <OwnershipChip asset="hipoteca" label="Hipoteca" value={ownership.hipoteca ?? "titular"} onChange={updateOwnership} />
      <OwnershipChip asset="saldo_planes" label="Saldo planes" value={ownership.saldo_planes ?? "titular"} onChange={updateOwnership} />
      <OwnershipChip asset="compromisos" label="Compromisos" value={ownership.compromisos ?? "titular"} onChange={updateOwnership} />
    </div>
  );

  if (modo === "pareja") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-bold font-[family-name:var(--font-poppins)] text-2xl text-white">
            El panorama completo de tu patrimonio
          </h2>
          <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85] mt-1">
            Titular y pareja
          </p>
        </div>
        <form onSubmit={parejaSubmit} className="space-y-6">
          <ParejaLayout
            titularNombre={perfil?.nombre ?? "Titular"}
            parejaNombre={pareja_perfil?.nombre ?? "Pareja"}
            titularSection={renderPatrimonioFields("titular")}
            parejaSection={renderPatrimonioFields("pareja")}
            sharedSection={ownershipSection}
          />
          <div className="flex gap-4 pt-8">
            <Button type="button" variant="ghost" onClick={() => router.push(`/diagnosticos/${id}/paso/2`)}>
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
          El panorama completo de tu patrimonio
        </h2>
      </div>

      <AccordionItem
        title="Patrimonio Financiero"
        total={formatMXN(finTotal)}
        defaultOpen
      >
        <div className="space-y-4">
          <InfoBox content="Dinero disponible hoy: saldo en cuentas de débito o instrumentos de inmediata liquidez.">
            <div className="flex flex-col">
              <CurrencyInput label="Liquidez" value={watch("liquidez")} onChange={(v) => setValue("liquidez", v)} />
              {sugerencias.has("liquidez") && <SuggestionPill sugerencia={sugerencias.get("liquidez")!} onAccept={() => aceptarSugerencia("liquidez")} onReject={() => rechazarSugerencia("liquidez")} />}
            </div>
          </InfoBox>
          <InfoBox content="Instrumentos que generan rendimientos: fondos, acciones, bonos, ETFs.">
            <div className="flex flex-col">
              <CurrencyInput label="Inversiones" value={watch("inversiones")} onChange={(v) => setValue("inversiones", v)} />
              {sugerencias.has("inversiones") && <SuggestionPill sugerencia={sugerencias.get("inversiones")!} onAccept={() => aceptarSugerencia("inversiones")} onReject={() => rechazarSugerencia("inversiones")} />}
            </div>
          </InfoBox>
          <InfoBox content="Seguros de ahorro que combinan protección con crecimiento a largo plazo.">
            <div className="flex flex-col">
              <CurrencyInput label="Dotales" value={watch("dotales")} onChange={(v) => setValue("dotales", v)} />
              {sugerencias.has("dotales") && <SuggestionPill sugerencia={sugerencias.get("dotales")!} onAccept={() => aceptarSugerencia("dotales")} onReject={() => rechazarSugerencia("dotales")} />}
            </div>
          </InfoBox>
        </div>
      </AccordionItem>

      <AccordionItem title="Esquemas de Retiro" total="">
        <div className="space-y-4">
          <InfoBox content="Tu cuenta de ahorro para el retiro administrada por una Afore.">
            <div className="flex flex-col">
              <CurrencyInput label="Afore" value={watch("afore")} onChange={(v) => setValue("afore", v)} />
              {sugerencias.has("afore") && <SuggestionPill sugerencia={sugerencias.get("afore")!} onAccept={() => aceptarSugerencia("afore")} onReject={() => rechazarSugerencia("afore")} />}
            </div>
          </InfoBox>
          <InfoBox content="Cuenta de ahorro para retiro voluntaria con beneficios fiscales.">
            <div className="flex flex-col">
              <CurrencyInput label="PPR" value={watch("ppr")} onChange={(v) => setValue("ppr", v)} />
              {sugerencias.has("ppr") && <SuggestionPill sugerencia={sugerencias.get("ppr")!} onAccept={() => aceptarSugerencia("ppr")} onReject={() => rechazarSugerencia("ppr")} />}
            </div>
          </InfoBox>
          <div className="flex flex-col">
            <CurrencyInput label="Plan privado" value={watch("plan_privado")} onChange={(v) => setValue("plan_privado", v)} />
            {sugerencias.has("plan_privado") && <SuggestionPill sugerencia={sugerencias.get("plan_privado")!} onAccept={() => aceptarSugerencia("plan_privado")} onReject={() => rechazarSugerencia("plan_privado")} />}
          </div>
          <div className="flex flex-col">
            <CurrencyInput label="Seguros retiro" value={watch("seguros_retiro")} onChange={(v) => setValue("seguros_retiro", v)} />
            {sugerencias.has("seguros_retiro") && <SuggestionPill sugerencia={sugerencias.get("seguros_retiro")!} onAccept={() => aceptarSugerencia("seguros_retiro")} onReject={() => rechazarSugerencia("seguros_retiro")} />}
          </div>
          {showLey73 && (
            <div className="space-y-2">
              <div className="bg-[#E6C78A]/10 rounded p-2 mb-2">
                <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#E6C78A]">Aplica si cotizaste antes de julio 1997</p>
              </div>
              <InfoBox content="Si cotizaste antes del 1 de julio de 1997, puedes recibir pensión con la ley anterior.">
                <div className="flex flex-col">
                  <CurrencyInput label="Mensualidad Ley 73" value={watch("ley_73") ?? 0} onChange={(v) => setValue("ley_73", v)} />
                  {sugerencias.has("ley_73") && <SuggestionPill sugerencia={sugerencias.get("ley_73")!} onAccept={() => aceptarSugerencia("ley_73")} onReject={() => rechazarSugerencia("ley_73")} />}
                </div>
              </InfoBox>
            </div>
          )}
        </div>
      </AccordionItem>

      <AccordionItem title="Patrimonio No Financiero" total="">
        <div className="space-y-4">
          <div className="flex flex-col">
            <CurrencyInput label="Casa" value={watch("casa")} onChange={(v) => setValue("casa", v)} />
            {sugerencias.has("casa") && <SuggestionPill sugerencia={sugerencias.get("casa")!} onAccept={() => aceptarSugerencia("casa")} onReject={() => rechazarSugerencia("casa")} />}
          </div>
          <InfoBox content="Bienes que generan ingresos: inmuebles en renta, locales comerciales.">
            <div className="flex flex-col">
              <CurrencyInput label="Inmuebles renta" value={watch("inmuebles_renta")} onChange={(v) => setValue("inmuebles_renta", v)} />
              {sugerencias.has("inmuebles_renta") && <SuggestionPill sugerencia={sugerencias.get("inmuebles_renta")!} onAccept={() => aceptarSugerencia("inmuebles_renta")} onReject={() => rechazarSugerencia("inmuebles_renta")} />}
            </div>
          </InfoBox>
          <div className="flex flex-col">
            <CurrencyInput label="Tierra" value={watch("tierra")} onChange={(v) => setValue("tierra", v)} />
            {sugerencias.has("tierra") && <SuggestionPill sugerencia={sugerencias.get("tierra")!} onAccept={() => aceptarSugerencia("tierra")} onReject={() => rechazarSugerencia("tierra")} />}
          </div>
          <div className="flex flex-col">
            <CurrencyInput label="Negocio" value={watch("negocio")} onChange={(v) => setValue("negocio", v)} />
            {sugerencias.has("negocio") && <SuggestionPill sugerencia={sugerencias.get("negocio")!} onAccept={() => aceptarSugerencia("negocio")} onReject={() => rechazarSugerencia("negocio")} />}
          </div>
          <div className="flex flex-col">
            <CurrencyInput label="Herencia" value={watch("herencia")} onChange={(v) => setValue("herencia", v)} />
            {sugerencias.has("herencia") && <SuggestionPill sugerencia={sugerencias.get("herencia")!} onAccept={() => aceptarSugerencia("herencia")} onReject={() => rechazarSugerencia("herencia")} />}
          </div>
        </div>
      </AccordionItem>

      <AccordionItem title="Pasivos y Obligaciones" total={formatMXN(pasivosTotal)}>
        <div className="space-y-4">
          <div className="flex flex-col">
            <CurrencyInput label="Hipoteca" value={watch("hipoteca")} onChange={(v) => setValue("hipoteca", v)} />
            {sugerencias.has("hipoteca") && <SuggestionPill sugerencia={sugerencias.get("hipoteca")!} onAccept={() => aceptarSugerencia("hipoteca")} onReject={() => rechazarSugerencia("hipoteca")} />}
          </div>
          <div className="flex flex-col">
            <CurrencyInput label="Saldo planes" value={watch("saldo_planes")} onChange={(v) => setValue("saldo_planes", v)} />
            {sugerencias.has("saldo_planes") && <SuggestionPill sugerencia={sugerencias.get("saldo_planes")!} onAccept={() => aceptarSugerencia("saldo_planes")} onReject={() => rechazarSugerencia("saldo_planes")} />}
          </div>
          <InfoBox content="Gastos grandes que sabes que vienen: bodas, cirugías, compromisos pendientes.">
            <div className="flex flex-col">
              <CurrencyInput label="Compromisos" value={watch("compromisos")} onChange={(v) => setValue("compromisos", v)} />
              {sugerencias.has("compromisos") && <SuggestionPill sugerencia={sugerencias.get("compromisos")!} onAccept={() => aceptarSugerencia("compromisos")} onReject={() => rechazarSugerencia("compromisos")} />}
            </div>
          </InfoBox>
        </div>
      </AccordionItem>

      <div className="flex gap-4 pt-8">
        <Button type="button" variant="ghost" onClick={() => router.push(`/diagnosticos/${id}/paso/2`)}>
          <ArrowLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Guardando..." : <><span>Siguiente</span><ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </form>
  );
}
