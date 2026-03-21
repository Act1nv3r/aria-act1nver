"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PARAMS = [
  { key: "benchmark_reserva_meses", label: "Meses reserva (benchmark)", value: 3 },
  { key: "costo_seguro_millon", label: "Costo seguro por millón (MXN)", value: 15000 },
  { key: "inflacion_tasa", label: "Tasa inflación anual (%)", value: 4.5 },
  { key: "rendimiento_tasa", label: "Tasa rendimiento esperado (%)", value: 8 },
  { key: "edad_max_retiro", label: "Edad máxima retiro", value: 70 },
];

export default function AdminParametrosPage() {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(PARAMS.map((p) => [p.key, p.value]))
  );

  return (
    <div className="space-y-6">
      <h1 className="font-bold font-[family-name:var(--font-poppins)] text-[28px] text-white">
        Parámetros globales
      </h1>
      <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
        Los cambios solo aplican a diagnósticos futuros.
      </p>
      <Card className="p-6 max-w-md">
        <div className="space-y-4">
          {PARAMS.map((p) => (
            <div key={p.key}>
              <label className="block font-[family-name:var(--font-open-sans)] text-sm text-white mb-1">
                {p.label}
              </label>
              <Input
                type="number"
                value={values[p.key] ?? p.value}
                onChange={(e) => setValues((v) => ({ ...v, [p.key]: Number(e.target.value) }))}
              />
            </div>
          ))}
          <Button variant="primary" className="mt-4">Guardar cambios</Button>
        </div>
      </Card>
    </div>
  );
}
