"use client";

import { formatMXN } from "@/lib/format-currency";

interface Regla72TableProps {
  patrimonio: number;
}

export function Regla72Table({ patrimonio }: Regla72TableProps) {
  const rows = [
    { tasa: "8%", años: 9, duplicado: patrimonio * 2 },
    { tasa: "12%", años: 6, duplicado: patrimonio * 2 },
    { tasa: "14%", años: 5.14, duplicado: patrimonio * 2 },
  ];

  return (
    <div className="space-y-2 min-w-0">
      <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
        Regla del 72
      </p>
      <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
        Años para duplicar tu patrimonio según tasa de rendimiento
      </p>
      <div className="overflow-hidden rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-[#314566]">
            <th className="px-4 py-2 text-left font-bold font-[family-name:var(--font-poppins)] text-xs text-white">
              Tasa anual
            </th>
            <th className="px-4 py-2 text-left font-bold font-[family-name:var(--font-poppins)] text-xs text-white">
              Años para duplicar
            </th>
            <th className="px-4 py-2 text-left font-bold font-[family-name:var(--font-poppins)] text-xs text-white">
              Tu patrimonio en X años
            </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`bg-[#1A2433] font-[family-name:var(--font-open-sans)] text-sm text-white ${
                  i % 2 ? "bg-[#1A2433]/80" : ""
                }`}
              >
                <td className="px-4 py-2">{row.tasa}</td>
                <td className="px-4 py-2">{row.años} años</td>
                <td className="px-4 py-2">{formatMXN(row.duplicado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
