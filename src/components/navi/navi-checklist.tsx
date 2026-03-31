"use client";

import { useState } from "react";
import {
  Check, ChevronDown, ChevronRight,
  User, Wallet, Building2, Palmtree, Target, Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CategoryField {
  nombre: string;
  campo: string;
  valor?: unknown;
  completado: boolean;
}

export interface DataCategory {
  id: string;
  nombre: string;
  icono: string;
  fields: CategoryField[];
}

interface NaviChecklistProps {
  categories: DataCategory[];
  onEditField?: (campo: string, valorActual: unknown) => void;
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  perfil: User,
  flujo: Wallet,
  patrimonio_fin: Building2,
  retiro: Palmtree,
  no_financiero: Target,
  proteccion: Shield,
};

function MiniRing({ filled, total, size = 24 }: { filled: number; total: number; size?: number }) {
  const r = (size - 4) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = total > 0 ? filled / total : 0;
  const offset = circumference * (1 - pct);
  const isComplete = filled === total && total > 0;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#1A3154"
        strokeWidth={2.5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={isComplete ? "#10B981" : "#C9A84C"}
        strokeWidth={2.5}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

function OverallRing({ pct }: { pct: number }) {
  const size = 80;
  const strokeW = 5;
  const r = (size - strokeW * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  const color = pct >= 60 ? "#10B981" : pct >= 40 ? "#C9A84C" : "#8B9BB4";

  return (
    <div className="flex justify-center py-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="#1A3154" strokeWidth={strokeW}
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={strokeW}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{Math.round(pct)}%</span>
        </div>
      </div>
    </div>
  );
}

export function NaviChecklist({ categories, onEditField }: NaviChecklistProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalFields = categories.reduce((s, c) => s + c.fields.length, 0);
  const totalFilled = categories.reduce((s, c) => s + c.fields.filter((f) => f.completado).length, 0);
  const overallPct = totalFields > 0 ? (totalFilled / totalFields) * 100 : 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <OverallRing pct={overallPct} />

      <p className="text-center text-[11px] text-[#8B9BB4] mb-4">
        {totalFilled} de {totalFields} datos recopilados
      </p>

      <div className="space-y-1 px-1">
        {categories.map((cat) => {
          const filled = cat.fields.filter((f) => f.completado).length;
          const total = cat.fields.length;
          const isExpanded = expanded === cat.id;
          const isComplete = filled === total;
          const Icon = CATEGORY_ICONS[cat.id] || User;

          return (
            <div key={cat.id}>
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : cat.id)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-left transition-all
                  ${isExpanded ? "bg-[#1A3154]/50" : "hover:bg-[#1A3154]/30"}
                `}
              >
                <MiniRing filled={filled} total={total} size={24} />
                <Icon className={`w-4 h-4 shrink-0 ${isComplete ? "text-[#10B981]" : "text-[#8B9BB4]"}`} />
                <span className={`text-xs font-semibold flex-1 ${isComplete ? "text-[#10B981]" : "text-[#F0F4FA]"}`}>
                  {cat.nombre}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#4A5A72]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#4A5A72]" />
                )}
              </button>

              {isExpanded && (
                <div className="ml-[52px] mt-1 mb-2 space-y-0.5">
                  {cat.fields.map((field) => (
                    <button
                      key={field.campo}
                      type="button"
                      onClick={() => field.completado && onEditField?.(field.campo, field.valor)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-[#1A3154]/30 transition-colors"
                    >
                      {field.completado ? (
                        <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded border border-[#4A5A72]/50 shrink-0" />
                      )}
                      <span className={`text-xs flex-1 ${field.completado ? "text-[#F0F4FA]" : "text-[#4A5A72]"}`}>
                        {field.nombre}
                      </span>
                      {field.completado && field.valor !== undefined && (
                        <span className="text-[10px] text-[#8B9BB4] font-mono truncate max-w-[80px]">
                          {String(field.valor)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
