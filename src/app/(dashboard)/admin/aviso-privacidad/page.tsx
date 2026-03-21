"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DEFAULT_AVISO = `En cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), Actinver informa que los datos personales recabados serán utilizados para la prestación del servicio de diagnóstico financiero ArIA. Los datos no serán compartidos con terceros sin su consentimiento. Usted puede ejercer sus derechos de acceso, rectificación, cancelación y oposición contactando a su asesor.`;

export default function AdminAvisoPrivacidadPage() {
  const [texto, setTexto] = useState(DEFAULT_AVISO);

  return (
    <div className="space-y-6">
      <h1 className="font-bold font-[family-name:var(--font-poppins)] text-[28px] text-white">
        Aviso de privacidad
      </h1>
      <Card className="p-6">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={12}
          className="w-full bg-[#1A2433] border border-[#5A6A85]/30 rounded px-4 py-3 text-sm text-white font-[family-name:var(--font-open-sans)] resize-y"
          placeholder="Texto del aviso de privacidad (LFPDPPP)"
        />
        <Button variant="primary" className="mt-4">Guardar</Button>
      </Card>
    </div>
  );
}
