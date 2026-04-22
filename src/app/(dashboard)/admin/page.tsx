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
  AreaChart,
  Area,
  Legend,
} from "recharts";
import {
  Mic,
  Brain,
  Users,
  TrendingUp,
  Target,
  Clock,
  Lightbulb,
  DollarSign,
  BarChart3,
  Activity,
  Zap,
  FileText,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const TOOLTIP_STYLE = { backgroundColor: "#0C1829", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px" };

const MOCK = {
  kpis: {
    sesionesTotales: 1842,
    sesionesEsteMes: 287,
    sesionesChange: 12.4,
    clientesActivos: 4250,
    clientesNuevosMes: 186,
    clientesChange: 8.2,
    tasaCompletitud: 87,
    tasaCompletitudChange: 3.1,
    tiempoPromedioSesion: 18.4,
    tiempoChange: -2.1,
    oportunidadesDetectadas: 956,
    oportunidadesConvertidas: 234,
    conversionRate: 24.5,
    pdfsGenerados: 1456,
    wrapsGenerados: 389,
    simulacionesGuardadas: 672,
  },
  sesionesPorMes: [
    { mes: "Oct", voz: 120, manual: 85, mixto: 20 },
    { mes: "Nov", voz: 145, manual: 72, mixto: 28 },
    { mes: "Dic", voz: 98, manual: 65, mixto: 15 },
    { mes: "Ene", voz: 178, manual: 58, mixto: 32 },
    { mes: "Feb", voz: 210, manual: 45, mixto: 38 },
    { mes: "Mar", voz: 245, manual: 32, mixto: 42 },
  ],
  adopcionVoz: [
    { name: "Sesión de voz", value: 68, color: "#10B981" },
    { name: "Mixto", value: 18, color: "#C9A84C" },
    { name: "Manual", value: 14, color: "#5A6A85" },
  ],
  naviPerformance: {
    extraccionesAuto: 12450,
    extraccionesConfirmadas: 2180,
    extraccionesRechazadas: 320,
    tasaAutoAceptacion: 83.2,
    promedioExtraccionesSesion: 8.4,
    camposMasFrecuentes: [
      { campo: "nombre", extracciones: 1842, tasa: 100 },
      { campo: "edad", extracciones: 1780, tasa: 96.6 },
      { campo: "ahorro", extracciones: 1520, tasa: 82.5 },
      { campo: "gastos_basicos", extracciones: 1480, tasa: 80.3 },
      { campo: "creditos", extracciones: 1350, tasa: 73.3 },
      { campo: "edad_retiro", extracciones: 1200, tasa: 65.1 },
      { campo: "dependientes", extracciones: 1180, tasa: 64.1 },
      { campo: "seguro_vida", extracciones: 980, tasa: 53.2 },
    ],
  },
  completitudDistribucion: [
    { rango: "0-25%", sesiones: 45 },
    { rango: "25-50%", sesiones: 120 },
    { rango: "50-75%", sesiones: 380 },
    { rango: "75-90%", sesiones: 520 },
    { rango: "90-100%", sesiones: 777 },
  ],
  oportunidadesPorTipo: [
    { tipo: "Retiro/PPR", detectadas: 312, convertidas: 89 },
    { tipo: "Seguro vida", detectadas: 245, convertidas: 56 },
    { tipo: "SGMM", detectadas: 198, convertidas: 42 },
    { tipo: "Inversiones", detectadas: 142, convertidas: 28 },
    { tipo: "Crédito hipotecario", detectadas: 59, convertidas: 19 },
  ],
  crmMetrics: {
    tareasGeneradas: 3420,
    tareasCompletadas: 2180,
    tareasPendientes: 890,
    tasaCompletitudTareas: 63.7,
    tiempoPromedioSeguimiento: 4.2,
    contactosRegistrados: 5640,
  },
  crmTasksPorTipo: [
    { name: "Oportunidad", value: 42, color: "#C9A84C" },
    { name: "Actualización", value: 28, color: "#3B82F6" },
    { name: "Evento vida", value: 18, color: "#10B981" },
    { name: "AI insight", value: 12, color: "#8B5CF6" },
  ],
  costosPorMes: [
    { mes: "Oct", deepgram: 320, haiku: 480, infra: 100 },
    { mes: "Nov", deepgram: 380, haiku: 560, infra: 100 },
    { mes: "Dic", deepgram: 280, haiku: 420, infra: 100 },
    { mes: "Ene", deepgram: 420, haiku: 650, infra: 100 },
    { mes: "Feb", deepgram: 480, haiku: 720, infra: 100 },
    { mes: "Mar", deepgram: 540, haiku: 800, infra: 100 },
  ],
  topAsesores: [
    { nombre: "María González", sesiones: 68, oportunidades: 42, conversion: 31, score: 94 },
    { nombre: "Carlos Ruiz", sesiones: 55, oportunidades: 38, conversion: 24, score: 88 },
    { nombre: "Ana López", sesiones: 52, oportunidades: 35, conversion: 22, score: 85 },
    { nombre: "Roberto Hernández", sesiones: 48, oportunidades: 28, conversion: 18, score: 79 },
    { nombre: "Laura Martínez", sesiones: 45, oportunidades: 32, conversion: 15, score: 76 },
  ],
  tiempoSesionTrend: [
    { mes: "Oct", promedio: 24.5, mediana: 22 },
    { mes: "Nov", promedio: 22.1, mediana: 20 },
    { mes: "Dic", promedio: 21.3, mediana: 19 },
    { mes: "Ene", promedio: 19.8, mediana: 18 },
    { mes: "Feb", promedio: 19.2, mediana: 17.5 },
    { mes: "Mar", promedio: 18.4, mediana: 17 },
  ],
};

function KpiCard({ label, value, change, icon: Icon, color, suffix }: {
  label: string; value: string | number; change?: number; icon: typeof Mic; color: string; suffix?: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#5A6A85] font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1" style={{ color }}>
            {value}{suffix}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
          {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)}% vs mes anterior
        </div>
      )}
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [dateFrom, setDateFrom] = useState("2025-10-01");
  const [dateTo, setDateTo] = useState("2026-03-31");

  const costoTotal = MOCK.costosPorMes.reduce((s, m) => s + m.deepgram + m.haiku + m.infra, 0);
  const costoPorSesion = (costoTotal / MOCK.kpis.sesionesTotales).toFixed(2);
  const costoPorSesionMXN = (parseFloat(costoPorSesion) * 17.5).toFixed(0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-[28px] text-white">ArIA v2 — Centro de Control</h1>
          <p className="text-sm text-[#5A6A85] mt-1">Vista ejecutiva del companion conversacional</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-[#0C1829] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-[#0C1829] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white"
          />
        </div>
      </div>

      {/* KPI Row 1 — Core metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Sesiones totales" value={MOCK.kpis.sesionesTotales.toLocaleString()} change={MOCK.kpis.sesionesChange} icon={Mic} color="#10B981" />
        <KpiCard label="Clientes activos" value={MOCK.kpis.clientesActivos.toLocaleString()} change={MOCK.kpis.clientesChange} icon={Users} color="#3B82F6" />
        <KpiCard label="Tasa completitud" value={MOCK.kpis.tasaCompletitud} change={MOCK.kpis.tasaCompletitudChange} icon={Target} color="#C9A84C" suffix="%" />
        <KpiCard label="Tiempo promedio sesión" value={MOCK.kpis.tiempoPromedioSesion} change={MOCK.kpis.tiempoChange} icon={Clock} color="#8B5CF6" suffix=" min" />
      </div>

      {/* KPI Row 2 — AI & conversion */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Oportunidades detectadas" value={MOCK.kpis.oportunidadesDetectadas.toLocaleString()} icon={Lightbulb} color="#F59E0B" />
        <KpiCard label="Tasa conversión oportunidades" value={MOCK.kpis.conversionRate} icon={TrendingUp} color="#10B981" suffix="%" />
        <KpiCard label="PDFs generados" value={MOCK.kpis.pdfsGenerados.toLocaleString()} icon={FileText} color="#6366F1" />
        <KpiCard label="Costo por sesión" value={`$${costoPorSesion} USD`} icon={DollarSign} color="#EF4444" />
      </div>

      {/* Row: Sessions trend + Adoption */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#C9A84C]" />
            Sesiones por mes (fuente de datos)
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK.sesionesPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#5A6A85" opacity={0.15} />
                <XAxis dataKey="mes" stroke="#5A6A85" fontSize={12} />
                <YAxis stroke="#5A6A85" fontSize={12} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Bar dataKey="voz" name="Voz" fill="#10B981" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="mixto" name="Mixto" fill="#C9A84C" radius={[0, 0, 0, 0]} stackId="a" />
                <Bar dataKey="manual" name="Manual" fill="#5A6A85" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
            <Mic className="w-4 h-4 text-[#10B981]" />
            Adopción de voz
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK.adopcionVoz}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {MOCK.adopcionVoz.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs text-[#5A6A85] mt-2">
            {MOCK.adopcionVoz[0].value}% de sesiones usan voz como fuente principal
          </p>
        </Card>
      </div>

      {/* Row: Navi AI performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#8B5CF6]" />
            Rendimiento Navi (extracción AI)
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#10B981]">{MOCK.naviPerformance.tasaAutoAceptacion}%</p>
              <p className="text-[10px] text-[#5A6A85] mt-1">Tasa auto-aceptación</p>
            </div>
            <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#C9A84C]">{MOCK.naviPerformance.promedioExtraccionesSesion}</p>
              <p className="text-[10px] text-[#5A6A85] mt-1">Extracciones / sesión</p>
            </div>
          </div>
          <div className="space-y-2">
            {MOCK.naviPerformance.camposMasFrecuentes.map((c) => (
              <div key={c.campo} className="flex items-center gap-3">
                <span className="text-xs text-[#8B9BB4] w-28 shrink-0 truncate">{c.campo}</span>
                <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full bg-[#C9A84C] rounded-full transition-all" style={{ width: `${c.tasa}%` }} />
                </div>
                <span className="text-xs text-[#5A6A85] w-10 text-right shrink-0">{c.tasa}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#C9A84C]" />
            Distribución de completitud
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK.completitudDistribucion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#5A6A85" opacity={0.15} />
                <XAxis dataKey="rango" stroke="#5A6A85" fontSize={11} />
                <YAxis stroke="#5A6A85" fontSize={12} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="sesiones" fill="#C9A84C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs text-[#5A6A85] mt-2">
            {MOCK.completitudDistribucion.slice(-2).reduce((s, r) => s + r.sesiones, 0).toLocaleString()} sesiones con &gt;75% completitud
          </p>
        </Card>
      </div>

      {/* Row: Opportunities + CRM tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#F59E0B]" />
            Oportunidades por tipo
          </h3>
          <div className="space-y-3">
            {MOCK.oportunidadesPorTipo.map((o) => {
              const convRate = ((o.convertidas / o.detectadas) * 100).toFixed(0);
              return (
                <div key={o.tipo} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#F0F4FA] font-medium">{o.tipo}</span>
                    <span className="text-[#5A6A85]">
                      {o.detectadas} detectadas · <span className="text-[#10B981] font-medium">{o.convertidas} convertidas ({convRate}%)</span>
                    </span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="bg-[#F59E0B]/30 rounded-full overflow-hidden flex-1">
                      <div className="h-full bg-[#10B981] rounded-full" style={{ width: `${convRate}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center justify-between">
            <span className="text-xs text-[#5A6A85]">Conversión global</span>
            <span className="text-sm font-bold text-[#10B981]">{MOCK.kpis.conversionRate}%</span>
          </div>
        </Card>
        <Card>
          <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#3B82F6]" />
            Motor de seguimiento
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-[#3B82F6]">{MOCK.crmMetrics.tareasGeneradas.toLocaleString()}</p>
              <p className="text-[10px] text-[#5A6A85] mt-1">Tareas generadas</p>
            </div>
            <div className="bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-[#10B981]">{MOCK.crmMetrics.tasaCompletitudTareas}%</p>
              <p className="text-[10px] text-[#5A6A85] mt-1">Completadas</p>
            </div>
          </div>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK.crmTasksPorTipo}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {MOCK.crmTasksPorTipo.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Row: Session duration trend + Costs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#8B5CF6]" />
            Evolución duración de sesión
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK.tiempoSesionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#5A6A85" opacity={0.15} />
                <XAxis dataKey="mes" stroke="#5A6A85" fontSize={12} />
                <YAxis stroke="#5A6A85" fontSize={12} unit=" min" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                <Line type="monotone" dataKey="promedio" name="Promedio" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: "#8B5CF6" }} />
                <Line type="monotone" dataKey="mediana" name="Mediana" stroke="#C9A84C" strokeWidth={2} dot={{ fill: "#C9A84C" }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs text-[#10B981] mt-2">
            ↓ 25% reducción en tiempo promedio desde el lanzamiento de v2
          </p>
        </Card>
        <Card>
          <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#EF4444]" />
            Costos operativos (USD)
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK.costosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#5A6A85" opacity={0.15} />
                <XAxis dataKey="mes" stroke="#5A6A85" fontSize={12} />
                <YAxis stroke="#5A6A85" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => `$${v} USD`} />
                <Legend />
                <Area type="monotone" dataKey="haiku" name="Claude Haiku" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                <Area type="monotone" dataKey="deepgram" name="Deepgram STT" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                <Area type="monotone" dataKey="infra" name="Infraestructura" stackId="1" stroke="#5A6A85" fill="#5A6A85" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-[#5A6A85]">Costo por diagnóstico</span>
            <span className="font-bold text-[#F0F4FA]">${costoPorSesion} USD (~${costoPorSesionMXN} MXN)</span>
          </div>
        </Card>
      </div>

      {/* Row: Top advisors */}
      <Card>
        <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#C9A84C]" />
          Top asesores — rendimiento v2
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-[#5A6A85] text-xs font-medium py-3 pr-4">#</th>
                <th className="text-left text-[#5A6A85] text-xs font-medium py-3 pr-4">Asesor</th>
                <th className="text-right text-[#5A6A85] text-xs font-medium py-3 px-4">Sesiones</th>
                <th className="text-right text-[#5A6A85] text-xs font-medium py-3 px-4">Oportunidades</th>
                <th className="text-right text-[#5A6A85] text-xs font-medium py-3 px-4">Conversiones</th>
                <th className="text-right text-[#5A6A85] text-xs font-medium py-3 pl-4">Score</th>
              </tr>
            </thead>
            <tbody>
              {MOCK.topAsesores.map((a, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4 text-[#5A6A85] font-mono">{i + 1}</td>
                  <td className="py-3 pr-4 text-[#F0F4FA] font-medium">{a.nombre}</td>
                  <td className="py-3 px-4 text-right text-[#F0F4FA]">{a.sesiones}</td>
                  <td className="py-3 px-4 text-right text-[#F59E0B]">{a.oportunidades}</td>
                  <td className="py-3 px-4 text-right text-[#10B981]">{a.conversion}</td>
                  <td className="py-3 pl-4 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                      a.score >= 90 ? "bg-[#10B981]/15 text-[#10B981]" :
                      a.score >= 75 ? "bg-[#C9A84C]/15 text-[#C9A84C]" :
                      "bg-[#5A6A85]/15 text-[#5A6A85]"
                    }`}>
                      {a.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
