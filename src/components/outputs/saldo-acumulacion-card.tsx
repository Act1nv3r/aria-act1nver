"use client";

import { formatMXN } from "@/lib/format-currency";

interface SaldoAcumulacionCardProps {
  saldoAcumulacion: number;
  mesesReservaAcumulacion: number;
  remanenteObjetivos: number;
}

export function SaldoAcumulacionCard({
  saldoAcumulacion,
  mesesReservaAcumulacion,
  remanenteObjetivos,
}: SaldoAcumulacionCardProps) {
  const excedido = mesesReservaAcumulacion >= 3;

  return (
    <div className="space-y-3 min-w-0">
      <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
        Patrimonio de Acumulación
      </p>
      <div className="space-y-2">
        <div>
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
            Saldo Acumulación
          </p>
          <p className="font-bold font-[family-name:var(--font-poppins)] text-lg text-[#E6C78A] break-all">
            {formatMXN(saldoAcumulacion)}
          </p>
        </div>
        <div>
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
            Meses de Reserva Acumulación
          </p>
          <p className="font-bold font-[family-name:var(--font-poppins)] text-lg text-white">
            {mesesReservaAcumulacion.toFixed(1)} meses
          </p>
          <p className="font-[family-name:var(--font-open-sans)] text-xs mt-0.5">
            <span className={excedido ? "text-[#317A70]" : "text-[#E6C78A]"}>
              {excedido ? "Excedido" : "Por debajo del benchmark (3 meses)"}
            </span>
          </p>
        </div>
        <div>
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
            Remanente para otros objetivos
          </p>
          <p className="font-bold font-[family-name:var(--font-poppins)] text-base text-white break-all">
            {formatMXN(remanenteObjetivos)}/mes
          </p>
        </div>
      </div>
    </div>
  );
}
