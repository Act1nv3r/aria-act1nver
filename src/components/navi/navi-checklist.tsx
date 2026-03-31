"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";

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

export function NaviChecklist({ categories, onEditField }: NaviChecklistProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-widest text-[#8B9BB4] font-semibold mb-2 px-1">
        Datos recopilados
      </p>
      {categories.map((cat) => {
        const filled = cat.fields.filter((f) => f.completado).length;
        const total = cat.fields.length;
        const isExpanded = expanded === cat.id;
        const isComplete = filled === total;

        return (
          <div key={cat.id}>
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : cat.id)}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-left transition-all
                ${isExpanded ? "bg-[#1A3154]/50" : "hover:bg-[#1A3154]/30"}
              `}
            >
              <span className="text-sm">{cat.icono}</span>
              <span className={`text-xs font-semibold flex-1 ${isComplete ? "text-[#10B981]" : "text-[#F0F4FA]"}`}>
                {cat.nombre}
              </span>
              <span className={`text-[10px] font-mono ${isComplete ? "text-[#10B981]" : "text-[#8B9BB4]"}`}>
                {filled}/{total}
              </span>
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-[#4A5A72]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#4A5A72]" />
              )}
            </button>

            {isExpanded && (
              <div className="ml-8 mt-1 mb-2 space-y-0.5">
                {cat.fields.map((field) => (
                  <button
                    key={field.campo}
                    type="button"
                    onClick={() => field.completado && onEditField?.(field.campo, field.valor)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-[#1A3154]/30 transition-colors"
                  >
                    {field.completado ? (
                      <Check className="w-3 h-3 text-[#10B981] shrink-0" />
                    ) : (
                      <div className="w-3 h-3 rounded-sm border border-[#4A5A72]/50 shrink-0" />
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
  );
}
