"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MOCK_ASESORES = [
  { id: "1", nombre: "Admin Actinver", email: "admin@actinver.com", rol: "admin", activo: true, diagnosticos: 0, ultimoAcceso: "Hoy" },
  { id: "3", nombre: "Luis Tinajero", email: "ltinajero@actinver.com.mx", rol: "admin", activo: true, diagnosticos: 0, ultimoAcceso: "Hoy" },
  { id: "2", nombre: "María González", email: "maria@actinver.com", rol: "asesor", activo: true, diagnosticos: 12, ultimoAcceso: "Hace 2h" },
];

export default function AdminAsesoresPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-bold font-[family-name:var(--font-poppins)] text-[28px] text-white">
        Asesores
      </h1>
      <Card className="p-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#5A6A85]/30">
              <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">Nombre</th>
              <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">Email</th>
              <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">Rol</th>
              <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">Activo</th>
              <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">Diagnósticos</th>
              <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">Último acceso</th>
              <th className="text-left py-3 px-4 font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ASESORES.map((a) => (
              <tr key={a.id} className="border-b border-[#5A6A85]/20">
                <td className="py-3 px-4 font-[family-name:var(--font-open-sans)] text-sm text-white">{a.nombre}</td>
                <td className="py-3 px-4 font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">{a.email}</td>
                <td className="py-3 px-4 font-[family-name:var(--font-open-sans)] text-sm text-white">{a.rol}</td>
                <td className="py-3 px-4 font-[family-name:var(--font-open-sans)] text-sm text-white">{a.activo ? "Sí" : "No"}</td>
                <td className="py-3 px-4 font-[family-name:var(--font-open-sans)] text-sm text-white">{a.diagnosticos}</td>
                <td className="py-3 px-4 font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">{a.ultimoAcceso}</td>
                <td className="py-3 px-4">
                  <Button variant="ghost" size="sm">Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
