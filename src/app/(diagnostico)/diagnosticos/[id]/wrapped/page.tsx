"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { generarWrappedZip } from "@/lib/wrapped-generator";
import { api } from "@/lib/api-client";

const CARDS = ["intro", "nivel", "retiro", "reserva", "ahorro", "objetivos", "cta"] as const;

export default function WrappedPage() {
  const params = useParams();
  const id = params?.id as string;
  const { perfil, outputs } = useDiagnosticoStore();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeCards, setActiveCards] = useState<Set<string>>(new Set(CARDS));
  const [referralUrl, setReferralUrl] = useState<string | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);

  const motorA = outputs.motorA as { grado_avance?: number; meses_cubiertos?: number | null; distribucion?: { ahorro_pct?: number } } | null;
  const motorB = outputs.motorB as { nivel_riqueza?: string } | null;
  const motorC = outputs.motorC as { grado_avance?: number } | null;
  const motorD = outputs.motorD as { resultados?: Array<{ nombre: string; viable: boolean }> } | null;

  const nombre = perfil?.nombre ?? "Cliente";
  const nivel = motorB?.nivel_riqueza ?? "suficiente";
  const gradoAvance = (motorC?.grado_avance ?? 0) * 100;
  const mesesReserva = motorA?.meses_cubiertos ?? 0;
  const ahorroPct = ((motorA?.distribucion?.ahorro_pct ?? 0) * 100).toFixed(0);
  const objetivos = motorD?.resultados ?? [];
  const viables = objetivos.filter((o) => o.viable).length;

  const toggleCard = useCallback((cardId: string) => {
    setActiveCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }, []);

  const handleDownload = useCallback(() => {
    generarWrappedZip(
      { nombre, nivel, gradoAvance, mesesReserva, ahorroPct, objetivosCount: objetivos.length, viablesCount: viables },
      activeCards
    );
  }, [nombre, nivel, gradoAvance, mesesReserva, ahorroPct, objetivos.length, viables, activeCards]);

  const handleCompartirReferral = useCallback(async () => {
    if (!id) return;
    setReferralLoading(true);
    try {
      const res = await api.diagnosticos.wrappedShare(id);
      setReferralUrl(res.referral_url);
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(res.referral_url);
      }
    } catch {
      // ignore
    }
    setReferralLoading(false);
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="font-bold font-[family-name:var(--font-poppins)] text-2xl text-white mb-2">
        Tu Financial Wrapped
      </h1>
      <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85] mb-8">
        Comparte tu progreso. Sin montos, solo logros.
      </p>

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
        >
          <div
            id="wrapped-card-intro"
            className="min-w-full aspect-[9/16] max-h-[70vh] rounded-xl p-6 flex flex-col justify-between shrink-0"
          style={{
            background: "linear-gradient(180deg, #0A0E12 0%, #1A2433 100%)",
            border: "1px solid rgba(90,106,133,0.2)",
          }}
        >
          <div className="min-w-0 overflow-hidden">
            <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
              Tu diagnóstico financiero
            </p>
            <p className="font-bold font-[family-name:var(--font-poppins)] text-xl text-white mt-1 truncate">
              {nombre}
            </p>
            <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85] mt-2">
              {new Date().toLocaleDateString("es-MX", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-center">
            <span className="font-[family-name:var(--font-poppins)] text-xs text-[#E6C78A] tracking-widest">
              ArIA by Actinver
            </span>
          </div>
        </div>

        <div
          id="wrapped-card-nivel"
          className="min-w-full aspect-[9/16] max-h-[70vh] rounded-xl p-6 flex flex-col justify-center items-center gap-4 shrink-0"
          style={{
            background: "linear-gradient(180deg, #0A0E12 0%, #1A2433 100%)",
            border: "1px solid rgba(90,106,133,0.2)",
          }}
        >
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
            Nivel de riqueza
          </p>
          <Badge variant={nivel as "suficiente" | "mejor" | "bien" | "genial" | "on-fire"}>
            {nivel.replace("-", " ")}
          </Badge>
          <span className="font-[family-name:var(--font-poppins)] text-xs text-[#E6C78A] tracking-widest">
            ArIA by Actinver
          </span>
        </div>

        <div
          id="wrapped-card-retiro"
          className="min-w-full aspect-[9/16] max-h-[70vh] rounded-xl p-6 flex flex-col justify-center items-center gap-6 shrink-0"
          style={{
            background: "linear-gradient(180deg, #0A0E12 0%, #1A2433 100%)",
            border: "1px solid rgba(90,106,133,0.2)",
          }}
        >
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
            Grado de avance retiro
          </p>
          <p className="font-bold font-[family-name:var(--font-poppins)] text-7xl text-[#E6C78A]">
            {Math.round(gradoAvance)}%
          </p>
          <ProgressBar value={Math.min(100, gradoAvance)} size="lg" showLabel={false} />
          <span className="font-[family-name:var(--font-poppins)] text-xs text-[#E6C78A] tracking-widest">
            ArIA by Actinver
          </span>
        </div>

        <div
          id="wrapped-card-reserva"
          className="min-w-full aspect-[9/16] max-h-[70vh] rounded-xl p-6 flex flex-col justify-center items-center gap-4 shrink-0"
          style={{
            background: "linear-gradient(180deg, #0A0E12 0%, #1A2433 100%)",
            border: "1px solid rgba(90,106,133,0.2)",
          }}
        >
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
            Reserva de emergencia
          </p>
          <p className="font-bold font-[family-name:var(--font-poppins)] text-6xl text-white">
            {mesesReserva.toFixed(0)} meses
          </p>
          <span className="font-[family-name:var(--font-poppins)] text-xs text-[#E6C78A] tracking-widest">
            ArIA by Actinver
          </span>
        </div>

        <div
          id="wrapped-card-ahorro"
          className="min-w-full aspect-[9/16] max-h-[70vh] rounded-xl p-6 flex flex-col justify-center items-center gap-4 shrink-0"
          style={{
            background: "linear-gradient(180deg, #0A0E12 0%, #1A2433 100%)",
            border: "1px solid rgba(90,106,133,0.2)",
          }}
        >
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
            Ahorro vs ingresos
          </p>
          <p className="font-bold font-[family-name:var(--font-poppins)] text-6xl text-[#E6C78A]">
            {ahorroPct}%
          </p>
          <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
            vs 10% recomendado
          </p>
          <span className="font-[family-name:var(--font-poppins)] text-xs text-[#E6C78A] tracking-widest">
            ArIA by Actinver
          </span>
        </div>

        <div
          id="wrapped-card-objetivos"
          className="min-w-full aspect-[9/16] max-h-[70vh] rounded-xl p-6 flex flex-col justify-center gap-4 shrink-0"
            style={{
              background: "linear-gradient(180deg, #0A0E12 0%, #1A2433 100%)",
              border: "1px solid rgba(90,106,133,0.2)",
            }}
          >
            <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85] text-center">
              Objetivos
            </p>
            <p className="font-bold font-[family-name:var(--font-poppins)] text-4xl text-white text-center">
              {objetivos.length} objetivos
            </p>
            <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#317A70] text-center">
              {viables} viables
            </p>
            <span className="font-[family-name:var(--font-poppins)] text-xs text-[#E6C78A] tracking-widest text-center block mt-auto">
              ArIA by Actinver
            </span>
          </div>
        <div
          id="wrapped-card-cta"
          className="min-w-full aspect-[9/16] max-h-[70vh] rounded-xl p-6 flex flex-col justify-center items-center gap-4 shrink-0"
          style={{
            background: "linear-gradient(180deg, #0A0E12 0%, #1A2433 100%)",
            border: "1px solid rgba(90,106,133,0.2)",
          }}
        >
          <p className="font-bold font-[family-name:var(--font-poppins)] text-xl text-white text-center">
            Haz tu diagnóstico
          </p>
          <span className="font-[family-name:var(--font-poppins)] text-xs text-[#E6C78A] tracking-widest">
            ArIA by Actinver
          </span>
        </div>
        </div>
        <button
          type="button"
          onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={() => setCarouselIndex((i) => Math.min(CARDS.length - 1, i + 1))}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white"
          aria-label="Siguiente"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
      <div className="flex justify-center gap-1 mt-4">
        {CARDS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCarouselIndex(i)}
            className={`w-2 h-2 rounded-full transition-colors ${i === carouselIndex ? "bg-[#E6C78A]" : "bg-[#5A6A85]/50"}`}
            aria-label={`Ir a tarjeta ${i + 1}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {CARDS.map((c) => (
          <label key={c} className="flex items-center gap-1 text-xs text-[#5A6A85]">
            <input
              type="checkbox"
              checked={activeCards.has(c)}
              onChange={() => toggleCard(c)}
              className="rounded"
            />
            {c}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-4 mt-6">
        <Button variant="accent" onClick={handleDownload}>
          Descargar para Stories
        </Button>
        <Button
          variant="outline"
          className="border-[#317A70] text-[#317A70] hover:bg-[#317A70]/10"
          onClick={handleCompartirReferral}
          disabled={referralLoading}
        >
          {referralLoading ? "Generando..." : "Compartir enlace referral"}
        </Button>
      </div>
      {referralUrl && (
        <div className="mt-4 p-4 rounded-lg bg-[#1A2433] border border-[#5A6A85]/30 max-w-lg mx-auto">
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#317A70] mb-1">
            Enlace copiado al portapapeles
          </p>
          <a
            href={referralUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-[family-name:var(--font-open-sans)] text-sm text-[#E6C78A] break-all"
          >
            {referralUrl}
          </a>
        </div>
      )}

      <p className="mt-8 font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85] text-center">
        Haz tu diagnóstico en ArIA by Actinver
      </p>
    </div>
  );
}
