"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import type { NaviSuggestion } from "@/lib/navi-engine";

interface NaviSuggestionCardProps {
  suggestion: NaviSuggestion | null;
  onSkip: () => void;
}

export function NaviSuggestionCard({ suggestion, onSkip }: NaviSuggestionCardProps) {
  if (!suggestion) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#C9A84C]/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5 text-[#C9A84C] animate-pulse" />
          </div>
          <p className="text-xs text-[#5A6A85]">Analizando la conversación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden rounded-[14px] bg-[#0C1829] border border-[#C9A84C]/20">
      <div className="absolute inset-0 bg-gradient-to-br from-[#C9A84C]/[0.04] to-transparent pointer-events-none" />

      <div className="relative flex-1 flex flex-col p-5 gap-4">
        {/* Navi orb + label */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#E8C872] flex items-center justify-center shadow-[0_0_16px_rgba(201,168,76,0.35)] animate-pulse-glow shrink-0">
            <span className="text-[#060D1A] text-sm font-bold">N</span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#C9A84C] font-semibold">
              Siguiente pregunta
            </p>
            {suggestion.tipo === "alerta" && (
              <p className="text-[10px] text-[#EF4444] font-medium">Dato urgente</p>
            )}
          </div>
        </div>

        {/* Question text */}
        <p className="text-[#F0F4FA] text-base font-[family-name:var(--font-open-sans)] leading-relaxed flex-1">
          {suggestion.texto}
        </p>

        {/* Category tag */}
        {suggestion.campo_target && (
          <span className="inline-flex items-center self-start gap-1.5 px-3 py-1 rounded-full bg-[#1A3154] text-[11px] text-[#8B9BB4] font-medium border border-white/[0.06]">
            {suggestion.categoria} &middot; {suggestion.campo_target}
          </span>
        )}
      </div>

      {/* Skip button */}
      <button
        type="button"
        onClick={onSkip}
        className="relative flex items-center justify-center gap-1.5 px-5 py-3 text-xs font-semibold text-[#8B9BB4] hover:text-[#C9A84C] border-t border-white/[0.06] transition-colors"
      >
        Siguiente pregunta <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
