"use client";

interface IndiceSolvenciaProps {
  valor: number;
  clasificacion: string;
}

export function IndiceSolvencia({ valor, clasificacion }: IndiceSolvenciaProps) {
  const pct = Math.min(1, Math.max(0, valor)) * 100;

  return (
    <div className="text-center space-y-2">
      <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
        Índice de Solvencia
      </p>
      <div className="font-bold font-[family-name:var(--font-poppins)] text-2xl text-white">
        {pct.toFixed(1)}%
      </div>
      <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#E6C78A]">
        {clasificacion}
      </p>
    </div>
  );
}
