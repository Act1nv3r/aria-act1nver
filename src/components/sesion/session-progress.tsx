"use client";

import { useRouter } from "next/navigation";
import { BarChart3, PenLine, ChevronRight, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionProgressProps {
  completitudPct: number;
  categoriasFaltantes: string[];
  sesionMinutos: number;
  diagnosticoId: string;
  totalDatos: number;
  onGenerarBalance: () => void;
  onStopRecording?: () => void;
}

export function SessionProgress({
  completitudPct,
  categoriasFaltantes,
  sesionMinutos,
  diagnosticoId,
  totalDatos,
  onGenerarBalance,
  onStopRecording,
}: SessionProgressProps) {
  const router = useRouter();

  const formatTime = (mins: number) => {
    const m = Math.floor(mins);
    const s = Math.floor((mins - m) * 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="shrink-0 border-t border-white/[0.06] px-4 flex items-center justify-between gap-4"
      style={{
        height: "52px",
        background: "rgba(12,24,41,0.92)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Left: timer + data count */}
      <div className="flex items-center gap-4">
        <span className="text-lg font-mono font-bold text-[#F0F4FA] tabular-nums tracking-wide">
          {formatTime(sesionMinutos)}
        </span>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1A3154] border border-white/[0.06]">
          <Database className="w-3 h-3 text-[#8B9BB4]" />
          <span className="text-[11px] text-[#8B9BB4] font-semibold">{totalDatos} datos</span>
        </div>
        {categoriasFaltantes.length > 0 && categoriasFaltantes.length <= 3 && (
          <p className="text-[11px] text-[#5A6A85] hidden lg:block">
            Faltan: {categoriasFaltantes.join(", ")}
          </p>
        )}
      </div>

      {/* Right: action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onStopRecording?.();
            router.push(`/diagnosticos/${diagnosticoId}/paso/1`);
          }}
          className="text-[#8B9BB4] text-xs"
        >
          <PenLine className="w-3.5 h-3.5" />
          Captura manual
        </Button>
        <Button
          variant="accent"
          size="sm"
          onClick={onGenerarBalance}
          disabled={completitudPct < 60}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Generar balance
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
