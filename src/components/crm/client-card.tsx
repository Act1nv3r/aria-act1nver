"use client";

import { ChevronRight } from "lucide-react";

interface ClientCardProps {
  id: string;
  nombre: string;
  ultimoContacto?: string;
  estado: "activo" | "pendiente" | "inactivo";
  oportunidades: string[];
  saludScore: number;
  onClick: () => void;
}

const estadoBadge: Record<string, { bg: string; text: string; label: string }> = {
  activo: { bg: "bg-[#10B981]/15", text: "text-[#10B981]", label: "Activo" },
  pendiente: { bg: "bg-[#F59E0B]/15", text: "text-[#F59E0B]", label: "Pendiente" },
  inactivo: { bg: "bg-[#8B9BB4]/15", text: "text-[#8B9BB4]", label: "Inactivo" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ClientCard({
  nombre,
  ultimoContacto,
  estado,
  oportunidades,
  saludScore,
  onClick,
}: ClientCardProps) {
  const badge = estadoBadge[estado];

  return (
    <div
      onClick={onClick}
      className="
        bg-[#0C1829] border border-white/[0.06] rounded-[16px] p-5
        cursor-pointer hover:border-[#C9A84C]/30 hover:shadow-[0_0_24px_rgba(201,168,76,0.08)]
        transition-all duration-300 group
      "
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#1A3154] border border-[#C9A84C]/10 flex items-center justify-center shrink-0">
          <span className="text-[#C9A84C] font-bold text-sm">{getInitials(nombre)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#F0F4FA] text-sm truncate">{nombre}</p>
          <p className="text-xs text-[#8B9BB4] mt-0.5">
            {ultimoContacto ? `Último contacto: ${ultimoContacto}` : "Sin contacto previo"}
          </p>
        </div>

        <ChevronRight className="h-4 w-4 text-[#4A5A72] group-hover:text-[#C9A84C] transition-colors shrink-0 mt-0.5" />
      </div>

      {/* Health bar */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-[#1A3154] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${saludScore}%`,
              background:
                saludScore > 70
                  ? "linear-gradient(to right, #10B981, #34D399)"
                  : saludScore > 40
                  ? "linear-gradient(to right, #C9A84C, #E8C872)"
                  : "linear-gradient(to right, #EF4444, #F59E0B)",
            }}
          />
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.bg} ${badge.text}`}>
          {badge.label}
        </span>
      </div>

      {/* Opportunity chips */}
      {oportunidades.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {oportunidades.slice(0, 3).map((op) => (
            <span
              key={op}
              className="text-[9px] px-2 py-0.5 rounded-full bg-[#C9A84C]/10 text-[#C9A84C] font-medium"
            >
              {op}
            </span>
          ))}
          {oportunidades.length > 3 && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#1A3154] text-[#8B9BB4]">
              +{oportunidades.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
