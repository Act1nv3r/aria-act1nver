"use client";

import { formatMXN } from "@/lib/format-currency";

interface PatrimonioNetoCardProps {
  neto: number;
  financiero: number;
  noFinanciero: number;
  pasivos: number;
}

export function PatrimonioNetoCard({
  neto,
  financiero,
  noFinanciero,
  pasivos,
}: PatrimonioNetoCardProps) {
  const total = financiero + noFinanciero + pasivos;
  const finPct = total > 0 ? (financiero / total) * 100 : 0;
  const noFinPct = total > 0 ? (noFinanciero / total) * 100 : 0;
  const pasPct = total > 0 ? (pasivos / total) * 100 : 0;

  return (
    <div className="min-w-0 space-y-2">
      <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
        Patrimonio Neto
      </p>
      <p className="font-bold font-[family-name:var(--font-poppins)] text-[32px] text-[#E6C78A] break-all">
        {formatMXN(neto)}
      </p>
      <div className="h-4 rounded-lg overflow-hidden flex mt-2">
        <div
          className="bg-[#314566]"
          style={{ width: `${finPct}%` }}
        />
        <div
          className="bg-[#E6C78A]"
          style={{ width: `${noFinPct}%` }}
        />
        <div
          className="bg-[#8B3A3A]"
          style={{ width: `${pasPct}%` }}
        />
      </div>
      <div className="flex gap-4 mt-2 font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
        <span>Financiero {finPct.toFixed(0)}%</span>
        <span>No financiero {noFinPct.toFixed(0)}%</span>
        <span>Pasivos {pasPct.toFixed(0)}%</span>
      </div>
    </div>
  );
}
