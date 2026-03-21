"use client";

import { Badge } from "@/components/ui/badge";

interface NivelRiquezaBadgeProps {
  nivel: string;
  ratio: number;
  benchmarkEdad: number;
  edad: number;
}

export function NivelRiquezaBadge({
  nivel,
  ratio,
  benchmarkEdad,
  edad,
}: NivelRiquezaBadgeProps) {
  const variant = nivel as "suficiente" | "mejor" | "bien" | "genial" | "on-fire";

  return (
    <div className="animate-fade-in min-w-0 space-y-2">
      <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
        Nivel de Riqueza
      </p>
      <Badge variant={variant}>
        {nivel.replace("-", " ")}
      </Badge>
      <p className="mt-2 font-[family-name:var(--font-open-sans)] text-sm text-white">
        Tu patrimonio cubre {ratio.toFixed(1)}x tus gastos anuales
      </p>
      <p className="mt-1 font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
        Para tu edad ({edad} años), el benchmark es {benchmarkEdad}x
      </p>
    </div>
  );
}
