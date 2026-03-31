"use client";

import { ChevronRight } from "lucide-react";
import type { NaviSuggestion } from "@/lib/navi-engine";

interface NaviSuggestionCardProps {
  suggestion: NaviSuggestion | null;
  onSkip: () => void;
}

export function NaviSuggestionCard({ suggestion, onSkip }: NaviSuggestionCardProps) {
  if (!suggestion) return null;

  return (
    <div className="bg-[#0C1829] border border-[#C9A84C]/30 rounded-[14px] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/5 to-transparent pointer-events-none" />

      <div className="relative flex items-start gap-3">
        {/* Navi orb */}
        <div className="shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#E8C872] flex items-center justify-center animate-pulse shadow-[0_0_12px_rgba(201,168,76,0.4)]">
            <span className="text-[#060D1A] text-xs font-bold">N</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-[#C9A84C] font-semibold mb-1.5">
            Siguiente pregunta
          </p>
          <p className="text-[#F0F4FA] text-sm font-[family-name:var(--font-open-sans)] leading-relaxed">
            {suggestion.texto}
          </p>
          {suggestion.campo_target && (
            <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-[#1A3154] text-[#8B9BB4]">
              {suggestion.categoria} · {suggestion.campo_target}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mt-3 flex items-center gap-1 text-xs text-[#8B9BB4] hover:text-[#C9A84C] transition-colors ml-11"
      >
        Siguiente <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}
