"use client";

import { ChevronRight, Clock, Lightbulb } from "lucide-react";

interface ClientCardProps {
  id: string;
  nombre: string;
  ultimoContacto?: string;
  estado: "activo" | "pendiente" | "inactivo";
  oportunidades: string[];
  saludScore: number;
  onClick: () => void;
}

const estadoConfig: Record<string, { dot: string; text: string; label: string }> = {
  activo:    { dot: "bg-[#10B981]", text: "text-[#10B981]", label: "Activo" },
  pendiente: { dot: "bg-[#F59E0B]", text: "text-[#F59E0B]", label: "Pendiente" },
  inactivo:  { dot: "bg-[#5A6A85]", text: "text-[#5A6A85]", label: "Inactivo" },
};

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function scoreColor(s: number) {
  if (s > 70) return "#10B981";
  if (s > 40) return "#C9A84C";
  return "#EF4444";
}

export function ClientCard({ nombre, ultimoContacto, estado, oportunidades, saludScore, onClick }: ClientCardProps) {
  const cfg = estadoConfig[estado];
  const color = scoreColor(saludScore);

  return (
    <div
      onClick={onClick}
      className="bg-[#0C1829] border border-white/[0.06] rounded-[16px] p-4 cursor-pointer hover:border-[#C9A84C]/25 hover:bg-[#0e1e38] transition-all duration-200 group"
    >
      {/* Row 1: Avatar + Name + Chevron */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#1A3154] flex items-center justify-center shrink-0">
          <span className="text-[#C9A84C] font-bold text-xs">{getInitials(nombre)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#F0F4FA] text-sm truncate leading-tight">{nombre}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
            <span className={`text-[11px] font-medium ${cfg.text}`}>{cfg.label}</span>
            {ultimoContacto && (
              <>
                <span className="text-[#3A4A62] text-[10px]">·</span>
                <Clock className="w-2.5 h-2.5 text-[#5A6A85]" />
                <span className="text-[10px] text-[#5A6A85]">{ultimoContacto}</span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-[#3A4A62] group-hover:text-[#C9A84C] transition-colors shrink-0" />
      </div>

      {/* Row 2: Health bar with score */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1 h-1 bg-[#1A3154] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${saludScore}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{saludScore}%</span>
      </div>

      {/* Row 3: Opportunity chips */}
      {oportunidades.length > 0 && (
        <div className="flex items-center gap-1 mt-2.5 overflow-hidden">
          <Lightbulb className="w-3 h-3 text-[#C9A84C]/60 shrink-0" />
          {oportunidades.slice(0, 2).map((op) => (
            <span
              key={op}
              className="text-[9px] px-1.5 py-0.5 rounded bg-[#C9A84C]/10 text-[#C9A84C] font-medium truncate max-w-[90px]"
            >
              {op}
            </span>
          ))}
          {oportunidades.length > 2 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A3154] text-[#5A6A85] shrink-0">
              +{oportunidades.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
