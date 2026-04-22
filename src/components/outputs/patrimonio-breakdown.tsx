"use client";

import { calcularMotorE } from "@/lib/motors/motor-e";
import { formatMXN } from "@/lib/format-currency";

interface PatrimonioData {
  liquidez: number;
  inversiones: number;
  dotales: number;
  afore: number;
  ppr: number;
  plan_privado: number;
  seguros_retiro: number;
  casa: number;
  inmuebles_renta: number;
  tierra: number;
  negocio: number;
  herencia: number;
  hipoteca: number;
  saldo_planes: number;
  compromisos: number;
}

interface Props {
  patrimonio: PatrimonioData;
  motorE: ReturnType<typeof calcularMotorE>;
}

function Row({ label, value, indent = false }: { label: string; value: number; indent?: boolean }) {
  if (value === 0) return null;
  return (
    <div className={`flex justify-between items-center py-1.5 border-b border-[#1C2B4A] ${indent ? "pl-4" : ""}`}>
      <span className={`text-sm ${indent ? "text-[#6A7A95]" : "text-[#8899BB]"}`}>{label}</span>
      <span className="text-sm font-semibold text-white">{formatMXN(value)}</span>
    </div>
  );
}

function ColHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-[#C9A96E] uppercase tracking-widest mb-2">{children}</p>
  );
}

export function PatrimonioBreakdown({ patrimonio, motorE }: Props) {
  const retiro = patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado + patrimonio.seguros_retiro;

  // Patrimonio Financiero Neto (excluye retiro)
  const patrimonioFinanciero = patrimonio.liquidez + patrimonio.inversiones + patrimonio.dotales;
  const patrimonioFinancieroNeto = patrimonioFinanciero - patrimonio.hipoteca - patrimonio.saldo_planes - patrimonio.compromisos;

  // Índice de Liquidez
  const indiceLiquidez = motorE.pasivos_total > 0
    ? (patrimonio.liquidez + patrimonio.inversiones) / motorE.pasivos_total
    : 999;
  const liquidezOk = indiceLiquidez >= 1;

  // Bar proportions for stacked bar
  const total = motorE.activos_total;
  const finPct = total > 0 ? (motorE.financiero / total) * 100 : 0;
  const noFinPct = total > 0 ? (motorE.noFinanciero / total) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Asset grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Financiero */}
        <div className="bg-[#162236] rounded-xl p-4 border border-[#243555]">
          <ColHeader>Patrimonio Financiero</ColHeader>
          <Row label="Ahorro / Liquidez" value={patrimonio.liquidez} />
          <Row label="Inversiones" value={patrimonio.inversiones} />
          <Row label="Dotales" value={patrimonio.dotales} />
          <Row label="AFORE" value={patrimonio.afore} />
          <Row label="PPR" value={patrimonio.ppr} />
          <Row label="Plan Privado" value={patrimonio.plan_privado} />
          <Row label="Seguros Retiro" value={patrimonio.seguros_retiro} />
          <div className="mt-2 pt-2 border-t border-[#243555] flex justify-between">
            <span className="text-xs text-[#8899BB]">Total Financiero</span>
            <span className="text-sm font-bold text-[#C9A96E]">{formatMXN(motorE.financiero)}</span>
          </div>
        </div>

        {/* No Financiero */}
        <div className="bg-[#162236] rounded-xl p-4 border border-[#243555]">
          <ColHeader>Activos No Financieros</ColHeader>
          <Row label="Casa Propia" value={patrimonio.casa} />
          <Row label="Inmuebles en Renta" value={patrimonio.inmuebles_renta} />
          <Row label="Tierra" value={patrimonio.tierra} />
          <Row label="Negocio" value={patrimonio.negocio} />
          <Row label="Herencia" value={patrimonio.herencia} />
          <div className="mt-2 pt-2 border-t border-[#243555] flex justify-between">
            <span className="text-xs text-[#8899BB]">Total No Financiero</span>
            <span className="text-sm font-bold text-[#C9A96E]">{formatMXN(motorE.noFinanciero)}</span>
          </div>
        </div>

        {/* Pasivos */}
        <div className="bg-[#162236] rounded-xl p-4 border border-[#243555]">
          <ColHeader>Obligaciones / Pasivos</ColHeader>
          <Row label="Hipoteca" value={patrimonio.hipoteca} />
          <Row label="Planes / Seguros" value={patrimonio.saldo_planes} />
          <Row label="Otros Compromisos" value={patrimonio.compromisos} />
          <div className="mt-2 pt-2 border-t border-[#243555] flex justify-between">
            <span className="text-xs text-[#8899BB]">Total Obligaciones</span>
            <span className="text-sm font-bold text-red-400">{formatMXN(motorE.pasivos_total)}</span>
          </div>
          <div className="mt-2 pt-2 border-t border-[#243555] flex justify-between">
            <span className="text-xs font-bold text-white">Patrimonio Neto</span>
            <span className="text-sm font-bold text-[#C9A96E]">{formatMXN(motorE.patrimonio_neto)}</span>
          </div>
        </div>
      </div>

      {/* Stacked bar visual */}
      <div className="bg-[#162236] rounded-xl p-4 border border-[#243555]">
        <p className="text-xs font-bold text-[#C9A96E] uppercase tracking-widest mb-3">Estructura del Patrimonio</p>
        <div className="h-5 rounded-full overflow-hidden flex">
          <div style={{ width: `${finPct}%` }} className="bg-[#1C2B4A] transition-all" title={`Financiero ${finPct.toFixed(0)}%`} />
          <div style={{ width: `${noFinPct}%` }} className="bg-[#314566] transition-all" title={`No Financiero ${noFinPct.toFixed(0)}%`} />
        </div>
        <div className="flex gap-6 mt-2 text-xs text-[#8899BB]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1C2B4A] inline-block" />Financiero {finPct.toFixed(0)}%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#314566] inline-block" />No Financiero {noFinPct.toFixed(0)}%</span>
        </div>
      </div>

      {/* Patrimonio Financiero Neto */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#162236] rounded-xl p-4 border border-[#243555]">
          <p className="text-xs text-[#8899BB] mb-1">Patrimonio Financiero Neto</p>
          <p className="text-xs text-[#4A5A75] mb-2">(excluye activos de retiro)</p>
          <p className={`text-xl font-bold ${patrimonioFinancieroNeto >= 0 ? "text-white" : "text-red-400"}`}>
            {formatMXN(patrimonioFinancieroNeto)}
          </p>
        </div>

        {/* Índice de Liquidez */}
        <div className={`rounded-xl p-4 border ${liquidezOk ? "bg-green-900/20 border-green-600/30" : "bg-red-900/20 border-red-600/30"}`}>
          <p className="text-xs text-[#8899BB] mb-1">Índice de Liquidez</p>
          <p className={`text-xl font-bold ${liquidezOk ? "text-green-400" : "text-red-400"}`}>
            {motorE.pasivos_total > 0 ? indiceLiquidez.toFixed(2) : "∞"}x
          </p>
          <p className={`text-xs mt-1 ${liquidezOk ? "text-green-400" : "text-red-400"}`}>
            {liquidezOk
              ? "Suficiente para hacer frente a tus obligaciones"
              : "Por debajo del mínimo recomendado"}
          </p>
        </div>
      </div>

      {/* Retiro summary */}
      {retiro > 0 && (
        <div className="bg-[#0F1E36] rounded-xl p-4 border border-[#243555] flex justify-between items-center">
          <div>
            <p className="text-xs text-[#8899BB]">Total Esquemas de Retiro</p>
            <p className="text-xs text-[#4A5A75]">(AFORE + PPR + Plan Privado + Seguros Retiro)</p>
          </div>
          <p className="text-xl font-bold text-[#C9A96E]">{formatMXN(retiro)}</p>
        </div>
      )}
    </div>
  );
}
