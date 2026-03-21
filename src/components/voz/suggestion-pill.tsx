"use client";

import { useEffect } from "react";
import { Check, X } from "lucide-react";
import type { Sugerencia } from "@/lib/voz-nlu";

interface SuggestionPillProps {
  sugerencia: Sugerencia;
  onAccept: () => void;
  onReject: () => void;
}

function formatValor(valor: string | number | boolean): string {
  if (typeof valor === "number") return valor.toLocaleString("es-MX");
  if (typeof valor === "boolean") return valor ? "Sí" : "No";
  return String(valor);
}

export function SuggestionPill({ sugerencia, onAccept, onReject }: SuggestionPillProps) {
  const { confianza, valor } = sugerencia;

  useEffect(() => {
    const t = setTimeout(() => onReject(), 30000);
    return () => clearTimeout(t);
  }, [onReject]);

  if (confianza < 0.7) return null;

  const isHigh = confianza > 0.9;
  const bg = isHigh ? "bg-[#317A70]/15" : "bg-[#E6C78A]/15";
  const border = isHigh ? "border-[#317A70]/30" : "border-[#E6C78A]/30";
  const text = isHigh ? "text-[#317A70]" : "text-[#E6C78A]";

  return (
    <div
      className={`mt-2 w-fit flex items-center gap-0.5 px-2 py-1 rounded-lg border ${bg} ${border} ${text} animate-[fadeIn_0.3s_ease-out]`}
      style={{ animation: "fadeIn 0.3s ease-out" }}
      role="status"
      aria-label="Sugerencia de voz"
    >
      <span className="font-[family-name:var(--font-open-sans)] text-xs opacity-80">Sugerencia:</span>
      <span className="font-bold font-[family-name:var(--font-open-sans)] text-[13px]">
        {formatValor(valor)}
      </span>
      <button
        type="button"
        onClick={onAccept}
        className="min-w-[44px] min-h-[44px] w-11 h-11 rounded flex items-center justify-center bg-[#317A70] text-white hover:opacity-90 -m-1"
        aria-label="Aceptar sugerencia"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onReject}
        className="min-w-[44px] min-h-[44px] w-11 h-11 rounded flex items-center justify-center bg-[#8B3A3A]/50 text-white hover:opacity-90 -m-1"
        aria-label="Rechazar sugerencia"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
