"use client";

import { useRouter } from "next/navigation";
import { BarChart3, PenLine, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionProgressProps {
  completitudPct: number;
  categoriasFaltantes: string[];
  sesionMinutos: number;
  diagnosticoId: string;
  onGenerarBalance: () => void;
}

export function SessionProgress({
  completitudPct,
  categoriasFaltantes,
  sesionMinutos,
  diagnosticoId,
  onGenerarBalance,
}: SessionProgressProps) {
  const router = useRouter();

  const formatTime = (mins: number) => {
    const m = Math.floor(mins);
    const s = Math.floor((mins - m) * 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="border-t border-white/[0.06] px-4 py-3"
      style={{
        background: "rgba(12,24,41,0.95)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 h-2 bg-[#1A3154] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${completitudPct}%`,
              background:
                completitudPct >= 60
                  ? "linear-gradient(to right, #10B981, #34D399)"
                  : "linear-gradient(to right, #C9A84C, #E8C872)",
            }}
          />
        </div>
        <span className="text-xs font-mono text-[#C9A84C] font-semibold shrink-0">
          {completitudPct}%
        </span>
        <span className="text-xs font-mono text-[#8B9BB4] shrink-0">
          {formatTime(sesionMinutos)}
        </span>
      </div>

      {/* Faltantes */}
      {categoriasFaltantes.length > 0 && (
        <p className="text-[10px] text-[#5A6A85] mb-2">
          Faltan: {categoriasFaltantes.join(", ")}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="accent"
          size="sm"
          onClick={onGenerarBalance}
          disabled={completitudPct < 60}
          className="flex-1"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Generar balance
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/diagnosticos/${diagnosticoId}/paso/1`)}
          className="text-[#8B9BB4] shrink-0"
        >
          <PenLine className="w-3.5 h-3.5" />
          Captura manual
        </Button>
      </div>
    </div>
  );
}
