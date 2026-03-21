"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MOCK_TERMINOS = [
  { termino: "Afore", definicion: "Administradora de Fondos para el Retiro" },
  { termino: "PPR", definicion: "Plan Personal de Retiro" },
  { termino: "SGMM", definicion: "Seguro de Gastos Médicos Mayores" },
];

export default function AdminGlosarioPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-bold font-[family-name:var(--font-poppins)] text-[28px] text-white">
        Glosario
      </h1>
      <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
        Términos financieros. Cache Redis se invalida al editar.
      </p>
      <Card className="p-6">
        <div className="space-y-4">
          {MOCK_TERMINOS.map((t, i) => (
            <div key={i} className="flex justify-between items-start gap-4 py-2 border-b border-[#5A6A85]/20 last:border-0 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">{t.termino}</p>
                <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85] break-words">{t.definicion}</p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0">Editar</Button>
            </div>
          ))}
          <Button variant="outline" className="mt-4 border-[#E6C78A] text-[#E6C78A] hover:bg-[#E6C78A]/10">
            + Agregar término
          </Button>
        </div>
      </Card>
    </div>
  );
}
