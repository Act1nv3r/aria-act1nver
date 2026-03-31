"use client";

import { Lightbulb } from "lucide-react";
import type { Oportunidad } from "@/lib/navi-opportunities";

interface NaviOpportunitiesProps {
  oportunidades: Oportunidad[];
}

export function NaviOpportunities({ oportunidades }: NaviOpportunitiesProps) {
  if (oportunidades.length === 0) return null;

  return (
    <div className="bg-[#0C1829] border border-white/[0.06] rounded-[14px] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-[#C9A84C]" />
        <p className="text-[10px] uppercase tracking-widest text-[#8B9BB4] font-semibold">
          Oportunidades detectadas
        </p>
      </div>

      <div className="space-y-2">
        {oportunidades.map((op) => (
          <div
            key={op.id}
            className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#1A3154]/30"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] mt-1.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-[#F0F4FA] font-medium">
                {op.oportunidad}
              </p>
              <p className="text-[10px] text-[#8B9BB4] mt-0.5">
                {op.producto_sugerido}
              </p>
              {op.razon && (
                <p className="text-[10px] text-[#5A6A85] mt-0.5 italic">
                  {op.razon}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
