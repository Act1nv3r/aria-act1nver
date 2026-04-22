"use client";

import {
  Wallet, TrendingUp, Shield, Landmark, Home, Building2, MapPin,
  Briefcase, Gift, Heart, CreditCard, AlertCircle, CheckCircle2,
  AlertTriangle, Minus,
} from "lucide-react";
import { calcularMotorE } from "@/lib/motors/motor-e";
import { formatMXN } from "@/lib/format-currency";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface PatrimonioData {
  liquidez: number; inversiones: number; dotales: number;
  afore: number; ppr: number; plan_privado: number; seguros_retiro: number;
  casa: number; inmuebles_renta: number; tierra: number; negocio: number; herencia: number;
  hipoteca: number; saldo_planes: number; compromisos: number;
}

interface Props {
  patrimonio: PatrimonioData;
  motorE: ReturnType<typeof calcularMotorE>;
  proteccion: { seguro_vida: boolean | null; propiedades_aseguradas: boolean | null; sgmm: boolean | null } | null;
}

type BadgeStatus = "ok" | "warning" | "none";

function StatusBadge({ status }: { status: BadgeStatus }) {
  if (status === "ok") return <CheckCircle2 size={14} className="text-green-400 shrink-0" />;
  if (status === "warning") return <AlertTriangle size={14} className="text-yellow-400 shrink-0" />;
  return <Minus size={12} className="text-[#4A5A75] shrink-0" />;
}

interface AssetCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  total: number;
  status: BadgeStatus;
  color?: string;
}

function AssetCard({ icon: Icon, label, value, total, status, color = "#C9A84C" }: AssetCardProps) {
  if (value === 0) return null;
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="bg-[#0C1829] border border-white/[0.06] rounded-xl p-3 hover:border-[#C9A84C]/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
            <Icon size={14} style={{ color }} />
          </div>
          <span className="text-xs text-[#8B9BB4] leading-tight">{label}</span>
        </div>
        <StatusBadge status={status} />
      </div>
      <p className="text-sm font-bold text-white mb-2">{formatMXN(value)}</p>
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[10px] text-[#4A5A75] mt-1">{pct.toFixed(0)}% del total</p>
    </div>
  );
}

// Donut chart colors
const DONUT_COLORS = ["#4A6FA5", "#314566", "#C9A84C", "#1C2B4A", "#5A6A85"];
const DONUT_LABELS = ["Retiro", "Productivos", "Patrimoniales", "Inversiones", "Liquidez"];

export function AssetMapVisual({ patrimonio, motorE, proteccion }: Props) {
  const total = motorE.activos_total;
  const retiro = patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado + patrimonio.seguros_retiro;
  const productivos = patrimonio.inmuebles_renta + patrimonio.negocio;
  const patrimoniales = patrimonio.casa + patrimonio.tierra + patrimonio.herencia;
  const invFinancieras = patrimonio.inversiones + patrimonio.dotales;
  const liquidez = patrimonio.liquidez;

  const donutData = [
    { name: "Retiro", value: retiro },
    { name: "Productivos", value: productivos },
    { name: "Patrimoniales", value: patrimoniales },
    { name: "Inversiones", value: invFinancieras },
    { name: "Liquidez", value: liquidez },
  ].filter((d) => d.value > 0);

  // Solvencia gauge (SVG semicircle)
  const solvenciaPct = Math.round(motorE.indice_solvencia * 100);
  const r = 52;
  const circ = Math.PI * r;
  const filled = circ * Math.min(solvenciaPct / 100, 1);

  let solvenciaColor = "#10B981";
  if (solvenciaPct < 60) solvenciaColor = "#EF4444";
  else if (solvenciaPct < 80) solvenciaColor = "#F97316";

  return (
    <div className="space-y-6">
      {/* Central net worth + gauge */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-1 bg-gradient-to-br from-[#0C1829] to-[#162236] border border-[#C9A84C]/20 rounded-2xl p-6">
          <p className="text-xs text-[#5A6A85] uppercase tracking-widest mb-1">Patrimonio Neto</p>
          <p className="text-3xl font-bold text-white mb-1">{formatMXN(motorE.patrimonio_neto)}</p>
          <p className="text-xs text-[#8B9BB4]">{motorE.clasificacion_solvencia}</p>

          {/* 4-column summary bar */}
          <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/[0.06]">
            {[
              { label: "Financiero", val: motorE.financiero, color: "#1C2B4A" },
              { label: "No Financiero", val: motorE.noFinanciero, color: "#314566" },
              { label: "Pasivos", val: motorE.pasivos_total, color: "#8B3A3A" },
              { label: "Neto", val: motorE.patrimonio_neto, color: "#C9A84C" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="w-full h-1 rounded-full mb-2" style={{ background: item.color }} />
                <p className="text-[9px] text-[#4A5A75] uppercase tracking-wide">{item.label}</p>
                <p className="text-xs font-bold text-white">{formatMXN(item.val)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Solvency gauge */}
        <div className="bg-[#0C1829] border border-white/[0.06] rounded-2xl p-5 flex flex-col items-center min-w-[140px]">
          <svg width="120" height="70" viewBox="0 0 120 70">
            {/* Background arc */}
            <path
              d="M 10 65 A 50 50 0 0 1 110 65"
              fill="none"
              stroke="#243555"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <path
              d="M 10 65 A 50 50 0 0 1 110 65"
              fill="none"
              stroke={solvenciaColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(filled / circ) * 157} 157`}
              style={{ transition: "stroke-dasharray 1.2s ease-out" }}
            />
            <text x="60" y="58" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
              {solvenciaPct}%
            </text>
          </svg>
          <p className="text-[10px] text-[#5A6A85] uppercase tracking-wide mt-1">Solvencia</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: solvenciaColor }}>
            {motorE.clasificacion_solvencia}
          </p>
        </div>
      </div>

      {/* 3-column asset grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Financiero */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-widest mb-3">Activos Financieros</p>
          <AssetCard icon={Wallet} label="Ahorro / Liquidez" value={patrimonio.liquidez} total={total} status="ok" color="#60A5FA" />
          <AssetCard icon={TrendingUp} label="Inversiones" value={patrimonio.inversiones} total={total} status="ok" color="#10B981" />
          <AssetCard icon={Landmark} label="Dotales" value={patrimonio.dotales} total={total} status="ok" color="#A78BFA" />
          <AssetCard icon={Shield} label="AFORE" value={patrimonio.afore} total={total} status="ok" color="#C9A84C" />
          <AssetCard icon={Landmark} label="PPR" value={patrimonio.ppr} total={total} status="ok" color="#C9A84C" />
          <AssetCard icon={Landmark} label="Plan Privado" value={patrimonio.plan_privado} total={total} status="ok" color="#C9A84C" />
          <AssetCard icon={Shield} label="Seguros Retiro" value={patrimonio.seguros_retiro} total={total} status="ok" color="#C9A84C" />
        </div>

        {/* No Financiero */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-widest mb-3">Activos No Financieros</p>
          <AssetCard icon={Home} label="Casa Propia" value={patrimonio.casa} total={total} status={proteccion?.propiedades_aseguradas ? "ok" : "warning"} color="#F97316" />
          <AssetCard icon={Building2} label="Inmuebles en Renta" value={patrimonio.inmuebles_renta} total={total} status={proteccion?.propiedades_aseguradas ? "ok" : "warning"} color="#F97316" />
          <AssetCard icon={MapPin} label="Tierra" value={patrimonio.tierra} total={total} status="none" color="#F97316" />
          <AssetCard icon={Briefcase} label="Negocio" value={patrimonio.negocio} total={total} status="none" color="#A78BFA" />
          <AssetCard icon={Gift} label="Herencia" value={patrimonio.herencia} total={total} status="none" color="#5A6A85" />
        </div>

        {/* Protección & Pasivos */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-widest mb-3">Protección & Obligaciones</p>
          <div className={`bg-[#0C1829] border rounded-xl p-3 ${proteccion?.seguro_vida ? "border-green-600/30" : "border-red-600/30"}`}>
            <div className="flex items-center gap-2 mb-1">
              <Heart size={14} className={proteccion?.seguro_vida ? "text-green-400" : "text-red-400"} />
              <span className="text-xs text-[#8B9BB4]">Seguro de Vida</span>
              <StatusBadge status={proteccion?.seguro_vida ? "ok" : "warning"} />
            </div>
            <p className="text-xs font-bold text-white">{proteccion?.seguro_vida ? "Vigente" : "Sin cobertura"}</p>
          </div>
          <div className={`bg-[#0C1829] border rounded-xl p-3 ${proteccion?.sgmm ? "border-green-600/30" : "border-yellow-600/30"}`}>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className={proteccion?.sgmm ? "text-green-400" : "text-yellow-400"} />
              <span className="text-xs text-[#8B9BB4]">SGMM</span>
              <StatusBadge status={proteccion?.sgmm ? "ok" : "warning"} />
            </div>
            <p className="text-xs font-bold text-white">{proteccion?.sgmm ? "Vigente" : "Sin cobertura"}</p>
          </div>
          {patrimonio.hipoteca > 0 && (
            <AssetCard icon={CreditCard} label="Hipoteca" value={patrimonio.hipoteca} total={motorE.pasivos_total} status="none" color="#EF4444" />
          )}
          {patrimonio.saldo_planes > 0 && (
            <AssetCard icon={CreditCard} label="Planes / Créditos" value={patrimonio.saldo_planes} total={motorE.pasivos_total} status="none" color="#EF4444" />
          )}
          {patrimonio.compromisos > 0 && (
            <AssetCard icon={AlertCircle} label="Otros Compromisos" value={patrimonio.compromisos} total={motorE.pasivos_total} status="none" color="#EF4444" />
          )}
          {motorE.pasivos_total === 0 && (
            <div className="bg-green-900/20 border border-green-600/30 rounded-xl p-3 text-center">
              <CheckCircle2 size={20} className="text-green-400 mx-auto mb-1" />
              <p className="text-xs text-green-400 font-semibold">Sin obligaciones</p>
            </div>
          )}
        </div>
      </div>

      {/* Donut chart distribution */}
      {donutData.length > 0 && (
        <div className="bg-[#0C1829] border border-white/[0.06] rounded-2xl p-5">
          <p className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest mb-4">Distribución de tu Patrimonio</p>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-60 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatMXN(Number(v))} contentStyle={{ background: "#0C1829", border: "1px solid #243555", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              {donutData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                  <div>
                    <p className="text-xs text-[#8B9BB4]">{DONUT_LABELS[i] ?? d.name}</p>
                    <p className="text-xs font-semibold text-white">{formatMXN(d.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
