"use client";

import { AlertTriangle } from "lucide-react";

interface NaviAlertProps {
  faltantes: string[];
  minutosRestantes: number;
}

export function NaviAlert({ faltantes, minutosRestantes }: NaviAlertProps) {
  if (minutosRestantes > 5 || faltantes.length === 0) return null;

  return (
    <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-[14px] p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-[#EF4444]">
            Datos críticos faltantes
          </p>
          <p className="text-[11px] text-[#F0F4FA] mt-1 leading-relaxed">
            {faltantes.join(", ")}
          </p>
          <p className="text-[10px] text-[#8B9BB4] mt-2 italic">
            &ldquo;Antes de que terminemos, ayúdame con un par de datos más...&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
