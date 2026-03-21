"use client";

import { Check, AlertTriangle } from "lucide-react";

interface ReservaSemaforoProps {
  meses: number | null;
  benchmark: number;
  faltante?: number;
}

export function ReservaSemaforo({
  meses,
  benchmark,
  faltante = 0,
}: ReservaSemaforoProps) {
  const cubierto = meses !== null && meses >= benchmark;

  return (
    <div className="space-y-2 min-w-0">
      <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
        Reserva de Emergencia
      </p>
    <div className="flex items-center gap-4 min-w-0">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center ${
          meses === null
            ? "bg-[#5A6A85]/30"
            : cubierto
            ? "bg-[#317A70]"
            : "bg-[#8B3A3A]"
        }`}
      >
        {meses === null ? (
          <span className="text-white text-xs">?</span>
        ) : cubierto ? (
          <Check className="h-6 w-6 text-white" />
        ) : (
          <AlertTriangle className="h-6 w-6 text-white" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-[family-name:var(--font-open-sans)] text-sm text-white break-words">
          {meses !== null
            ? `${meses.toFixed(1)} meses cubiertos de ${benchmark} recomendados`
            : "Completa Paso 3 para ver reserva"}
        </p>
        {meses !== null && (
          <p
            className={`font-[family-name:var(--font-open-sans)] text-xs mt-1 break-words ${
              cubierto ? "text-[#317A70]" : "text-[#E6C78A]"
            }`}
          >
            {cubierto
              ? "Tu colchón financiero está listo ✓"
              : `Te faltan $${faltante.toLocaleString("es-MX")} para completar tu reserva`}
          </p>
        )}
      </div>
    </div>
    </div>
  );
}
