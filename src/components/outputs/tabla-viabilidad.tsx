"use client";

import { Check, X } from "lucide-react";
import { formatMXN } from "@/lib/format-currency";

interface ObjetivoRow {
  nombre: string;
  monto: number;
  plazo: number;
  viable: boolean;
}

interface TablaViabilidadProps {
  objetivos: ObjetivoRow[];
}

export function TablaViabilidad({ objetivos }: TablaViabilidadProps) {
  if (objetivos.length === 0) return null;

  return (
    <div className="space-y-2 min-w-0">
      <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
        Viabilidad de Objetivos
      </p>
      <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
        Estado de tus metas financieras según tu plan actual
      </p>
      <div className="overflow-x-auto rounded-lg min-w-0">
        <table className="w-full">
          <thead>
            <tr className="bg-[#314566]">
              <th className="px-3 py-2 text-left font-bold font-[family-name:var(--font-poppins)] text-xs text-white">
                #
              </th>
              <th className="px-3 py-2 text-left font-bold font-[family-name:var(--font-poppins)] text-xs text-white">
                Objetivo
              </th>
              <th className="px-3 py-2 text-left font-bold font-[family-name:var(--font-poppins)] text-xs text-white">
                Monto
              </th>
              <th className="px-3 py-2 text-left font-bold font-[family-name:var(--font-poppins)] text-xs text-white">
                Plazo
              </th>
              <th className="px-3 py-2 text-left font-bold font-[family-name:var(--font-poppins)] text-xs text-white">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {objetivos.map((obj, i) => (
              <tr key={i} className="bg-[#1A2433] border-b border-white/5">
                <td className="px-3 py-2 font-[family-name:var(--font-open-sans)] text-sm text-white">
                  {i + 1}
                </td>
                <td className="px-3 py-2 font-[family-name:var(--font-poppins)] text-sm text-white max-w-[180px] truncate" title={obj.nombre}>
                  {obj.nombre}
                </td>
                <td className="px-3 py-2 font-[family-name:var(--font-open-sans)] text-sm text-white break-all">
                  {formatMXN(obj.monto)}
                </td>
                <td className="px-3 py-2 font-[family-name:var(--font-open-sans)] text-sm text-white">
                  {obj.plazo} años
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                      obj.viable
                        ? "bg-[#317A70]/20 text-[#317A70]"
                        : "bg-[#8B3A3A]/20 text-[#8B3A3A]"
                    }`}
                  >
                    {obj.viable ? (
                      <>
                        <Check className="h-3 w-3" /> Viable
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3" /> Insuficiente
                      </>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
