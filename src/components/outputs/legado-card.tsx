"use client";

import { Gift } from "lucide-react";
import { formatMXN } from "@/lib/format-currency";

interface LegadoCardProps {
  monto: number;
  edadDefuncion: number;
}

export function LegadoCard({ monto, edadDefuncion }: LegadoCardProps) {
  return (
    <div className="text-center space-y-2 min-w-0">
      <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
        Legado Estimado
      </p>
      <Gift className="h-8 w-8 text-[#E6C78A] mx-auto" />
      <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
        Legado estimado
      </p>
      <p className="font-bold font-[family-name:var(--font-poppins)] text-[28px] text-[#E6C78A] break-all">
        {formatMXN(monto)}
      </p>
      <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
        a los {edadDefuncion} años
      </p>
      <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
        El patrimonio que podrías dejar a tus beneficiarios
      </p>
    </div>
  );
}
