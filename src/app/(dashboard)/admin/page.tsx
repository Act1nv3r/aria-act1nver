"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const MOCK_METRICAS = {
  diagnosticosCompletados: 142,
  funnelPorPaso: [
    { paso: 1, completados: 142 },
    { paso: 2, completados: 138 },
    { paso: 3, completados: 125 },
    { paso: 4, completados: 118 },
    { paso: 5, completados: 110 },
    { paso: 6, completados: 98 },
  ],
  porMes: [
    { mes: "Ene", total: 28 },
    { mes: "Feb", total: 35 },
    { mes: "Mar", total: 42 },
    { mes: "Abr", total: 37 },
  ],
  adopcionVoz: [
    { name: "Voz", value: 65, color: "#317A70" },
    { name: "Manual", value: 35, color: "#5A6A85" },
  ],
  individualVsPareja: [
    { name: "Individual", value: 72, color: "#314566" },
    { name: "Pareja", value: 28, color: "#E6C78A" },
  ],
  usoSimulador: [
    { mes: "Ene", usos: 12 },
    { mes: "Feb", usos: 18 },
    { mes: "Mar", usos: 25 },
    { mes: "Abr", usos: 22 },
  ],
  topAsesores: [
    { nombre: "María González", diagnosticos: 45 },
    { nombre: "Carlos Ruiz", diagnosticos: 38 },
    { nombre: "Ana López", diagnosticos: 32 },
  ],
  wrapsGenerados: 89,
  pdfsGenerados: 156,
};

export default function AdminDashboardPage() {
  const [dateFrom, setDateFrom] = useState("2025-01-01");
  const [dateTo, setDateTo] = useState("2025-04-30");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-bold font-[family-name:var(--font-poppins)] text-[28px] text-white">
          Dashboard Admin
        </h1>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-[#1A2433] border border-[#5A6A85]/30 rounded px-3 py-2 text-sm text-white font-[family-name:var(--font-open-sans)]"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-[#1A2433] border border-[#5A6A85]/30 rounded px-3 py-2 text-sm text-white font-[family-name:var(--font-open-sans)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">Diagnósticos completados</p>
          <p className="font-bold font-[family-name:var(--font-poppins)] text-3xl text-[#E6C78A] mt-1">
            {MOCK_METRICAS.diagnosticosCompletados}
          </p>
        </Card>
        <Card className="p-6">
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">Wraps generados</p>
          <p className="font-bold font-[family-name:var(--font-poppins)] text-3xl text-[#317A70] mt-1">
            {MOCK_METRICAS.wrapsGenerados}
          </p>
        </Card>
        <Card className="p-6">
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">PDFs generados</p>
          <p className="font-bold font-[family-name:var(--font-poppins)] text-3xl text-[#314566] mt-1">
            {MOCK_METRICAS.pdfsGenerados}
          </p>
        </Card>
        <Card className="p-6">
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">Tiempo promedio</p>
          <p className="font-bold font-[family-name:var(--font-poppins)] text-3xl text-white mt-1">
            12 min
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold font-[family-name:var(--font-poppins)] text-base text-white mb-4">
            Diagnósticos por mes
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_METRICAS.porMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#5A6A85" opacity={0.3} />
                <XAxis dataKey="mes" stroke="#5A6A85" fontSize={12} />
                <YAxis stroke="#5A6A85" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#1A2433", border: "1px solid #5A6A85" }} />
                <Bar dataKey="total" fill="#E6C78A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold font-[family-name:var(--font-poppins)] text-base text-white mb-4">
            Funnel completitud
          </h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_METRICAS.funnelPorPaso} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#5A6A85" opacity={0.3} />
                <XAxis type="number" stroke="#5A6A85" fontSize={12} />
                <YAxis dataKey="paso" type="category" stroke="#5A6A85" fontSize={12} tickFormatter={(v) => `Paso ${v}`} />
                <Tooltip contentStyle={{ backgroundColor: "#1A2433", border: "1px solid #5A6A85" }} />
                <Bar dataKey="completados" fill="#317A70" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold font-[family-name:var(--font-poppins)] text-base text-white mb-4">
            Adopción voz vs manual
          </h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_METRICAS.adopcionVoz}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {MOCK_METRICAS.adopcionVoz.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1A2433", border: "1px solid #5A6A85" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold font-[family-name:var(--font-poppins)] text-base text-white mb-4">
            Individual vs Pareja
          </h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_METRICAS.individualVsPareja}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {MOCK_METRICAS.individualVsPareja.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1A2433", border: "1px solid #5A6A85" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold font-[family-name:var(--font-poppins)] text-base text-white mb-4">
            Uso simulador
          </h3>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_METRICAS.usoSimulador}>
                <CartesianGrid strokeDasharray="3 3" stroke="#5A6A85" opacity={0.3} />
                <XAxis dataKey="mes" stroke="#5A6A85" fontSize={12} />
                <YAxis stroke="#5A6A85" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#1A2433", border: "1px solid #5A6A85" }} />
                <Line type="monotone" dataKey="usos" stroke="#E6C78A" strokeWidth={2} dot={{ fill: "#E6C78A" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold font-[family-name:var(--font-poppins)] text-base text-white mb-4">
            Top 5 asesores
          </h3>
          <div className="space-y-2">
            {MOCK_METRICAS.topAsesores.map((a, i) => (
              <div key={i} className="flex justify-between items-center gap-2 py-2 border-b border-[#5A6A85]/20 last:border-0 min-w-0">
                <span className="font-[family-name:var(--font-open-sans)] text-sm text-white truncate">{a.nombre}</span>
                <span className="font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A] shrink-0">{a.diagnosticos}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-bold font-[family-name:var(--font-poppins)] text-base text-white mb-4">
          Alertas errores recientes
        </h3>
        <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
          No hay alertas recientes.
        </p>
      </Card>
    </div>
  );
}
