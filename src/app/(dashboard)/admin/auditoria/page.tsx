"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MOCK_LOGS = [
  { id: "1", fecha: "2025-03-18 10:30", asesor: "María González", accion: "Creó diagnóstico" },
  { id: "2", fecha: "2025-03-18 10:25", asesor: "María González", accion: "Creó cliente" },
  { id: "3", fecha: "2025-03-18 09:15", asesor: "Admin ArIA", accion: "Login" },
];

export default function AdminAuditoriaPage() {
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroAsesor, setFiltroAsesor] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="font-bold font-[family-name:var(--font-poppins)] text-[28px] text-white">
        Auditoría
      </h1>
      <div className="flex flex-wrap gap-4">
        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => setFiltroFecha(e.target.value)}
          placeholder="Fecha"
          className="bg-[#1A2433] border border-[#5A6A85]/30 rounded px-3 py-2 text-sm text-white font-[family-name:var(--font-open-sans)]"
        />
        <input
          type="text"
          value={filtroAsesor}
          onChange={(e) => setFiltroAsesor(e.target.value)}
          placeholder="Asesor"
          className="bg-[#1A2433] border border-[#5A6A85]/30 rounded px-3 py-2 text-sm text-white font-[family-name:var(--font-open-sans)] w-48"
        />
        <Button variant="outline" size="sm">Filtrar</Button>
        <Button variant="outline" size="sm" className="border-[#317A70] text-[#317A70]">Exportar CSV</Button>
      </div>
      <Card className="p-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#5A6A85]/30">
              <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">Fecha</th>
              <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">Asesor</th>
              <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">Acción</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_LOGS.map((log) => (
              <tr key={log.id} className="border-b border-[#5A6A85]/20">
                <td className="py-3 px-4 font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">{log.fecha}</td>
                <td className="py-3 px-4 font-[family-name:var(--font-open-sans)] text-sm text-white">{log.asesor}</td>
                <td className="py-3 px-4 font-[family-name:var(--font-open-sans)] text-sm text-white">{log.accion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
