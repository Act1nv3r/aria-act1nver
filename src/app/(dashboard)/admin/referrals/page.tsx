"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";

type Referral = {
  id: string;
  referral_code: string;
  diagnostico_id: string;
  asesor: string;
  clicks: number;
  conversiones: number;
  tasa_conversion: number;
  created_at: string | null;
};

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin
      .referrals()
      .then((res) => setReferrals(res.referrals))
      .catch(() => setReferrals([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-bold font-[family-name:var(--font-poppins)] text-[28px] text-white">
        Referrals
      </h1>
      <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
        Clicks, conversiones y tasa de conversión de enlaces compartidos desde Wrapped.
      </p>
      <Card className="p-6 overflow-x-auto">
        {loading ? (
          <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
            Cargando...
          </p>
        ) : referrals.length === 0 ? (
          <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
            No hay referrals aún.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#5A6A85]/30">
                <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">
                  Código
                </th>
                <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">
                  Asesor
                </th>
                <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">
                  Clicks
                </th>
                <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">
                  Conversiones
                </th>
                <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">
                  Tasa %
                </th>
                <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id} className="border-b border-[#5A6A85]/20">
                  <td className="py-3 px-4 font-[family-name:var(--font-open-sans)] text-sm text-[#E6C78A] font-mono">
                    {r.referral_code}
                  </td>
                  <td className="py-3 px-4 font-[family-name:var(--font-open-sans)] text-sm text-white">
                    {r.asesor}
                  </td>
                  <td className="py-3 px-4 font-[family-name:var(--font-open-sans)] text-sm text-white">
                    {r.clicks}
                  </td>
                  <td className="py-3 px-4 font-[family-name:var(--font-open-sans)] text-sm text-[#317A70]">
                    {r.conversiones}
                  </td>
                  <td className="py-3 px-4 font-[family-name:var(--font-open-sans)] text-sm text-white">
                    {r.tasa_conversion}%
                  </td>
                  <td className="py-3 px-4 font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
