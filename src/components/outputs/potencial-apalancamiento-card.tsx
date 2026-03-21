"use client";

import { formatMXN } from "@/lib/format-currency";

interface PotencialApalancamientoCardProps {
  potencialApalancamiento: number;
  activosTotales: number;
  capacidadApalancamiento: boolean;
}

export function PotencialApalancamientoCard({
  potencialApalancamiento,
  activosTotales,
  capacidadApalancamiento,
}: PotencialApalancamientoCardProps) {
  const minimoSeguridad = potencialApalancamiento * 0.5;

  return (
    <div className="space-y-3 min-w-0">
      <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
        Potencial de Apalancamiento
      </p>
      <p className="font-bold font-[family-name:var(--font-poppins)] text-2xl text-[#E6C78A] break-all">
        {formatMXN(potencialApalancamiento)}
      </p>
      <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
        Capacidad de apalancamiento:{" "}
        <span className={capacidadApalancamiento ? "text-[#317A70]" : "text-[#8B3A3A]"}>
          {capacidadApalancamiento ? "Sí" : "No"}
        </span>
      </p>
      <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
        Mínimo seguridad (2x): {formatMXN(minimoSeguridad)}
      </p>
    </div>
  );
}
