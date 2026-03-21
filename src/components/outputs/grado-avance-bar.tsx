"use client";

import CountUp from "react-countup";

interface GradoAvanceBarProps {
  porcentaje: number;
}

export function GradoAvanceBar({ porcentaje }: GradoAvanceBarProps) {
  const pct = Math.min(2, Math.max(0, porcentaje)) * 100;
  const isComplete = pct >= 100;

  return (
    <div className="space-y-4 min-w-0">
      <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
        Grado de Avance al Retiro
      </p>
      <div className="text-center">
        <p
          className={`font-bold font-[family-name:var(--font-poppins)] text-5xl ${
            isComplete ? "text-[#317A70]" : "text-[#E6C78A]"
          }`}
        >
          <CountUp
            start={0}
            end={pct}
            duration={1.5}
            decimals={1}
            suffix="%"
          />
        </p>
        <p className="font-[family-name:var(--font-open-sans)] text-base text-[#5A6A85] mt-1">
          de tu retiro ideal cubierto
        </p>
      </div>
      <div className="h-3 w-full rounded-full bg-[#5A6A85]/20 overflow-hidden">
        <div
          className={`h-full transition-all duration-[1.5s] ease-out ${
            isComplete ? "bg-[#317A70]" : "bg-[#E6C78A]"
          }`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
