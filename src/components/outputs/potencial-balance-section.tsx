"use client";

import { calcularMotorE } from "@/lib/motors/motor-e";
import { formatMXN } from "@/lib/format-currency";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

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
  motorE: ReturnType<typeof calcularMotorE>;
  patrimonio: PatrimonioData;
}

const COLORS = {
  retiro: "#4A6FA5",
  productivos: "#314566",
  patrimoniales: "#E8C87A",
  inversiones: "#1C2B4A",
  liquidez: "#5A6A85",
};

const solvenciaMsg: Record<string, string> = {
  "Muy saludable": "Tu nivel de solvencia actual te permite aprovechar tus activos como palanca de crecimiento.",
  Recomendable: "Tu estructura de deuda es saludable. Mantén este nivel para optimizar tu capacidad de inversión.",
  Aceptable: "Tu nivel de endeudamiento es manejable, pero hay oportunidad de mejora.",
  Elevado: "Tu nivel de endeudamiento requiere atención. Considera estrategias de reducción de pasivos.",
  Crítico: "Tu nivel de endeudamiento es crítico. Es prioritario reducir pasivos para proteger tu patrimonio.",
};

export function PotencialBalanceSection({ motorE, patrimonio }: Props) {
  const retiro = patrimonio.afore + patrimonio.ppr + patrimonio.plan_privado + patrimonio.seguros_retiro;
  const productivos = patrimonio.inmuebles_renta + patrimonio.negocio;
  const patrimoniales = patrimonio.casa + patrimonio.tierra + patrimonio.herencia;
  const invFinancieras = patrimonio.inversiones + patrimonio.dotales;
  const liquidez = patrimonio.liquidez;
  const total = motorE.activos_total;

  const categorias = [
    { name: "Retiro", value: retiro, color: COLORS.retiro, desc: "AFORE, PPR, Plan Privado, Seguros Retiro" },
    { name: "Productivos", value: productivos, color: COLORS.productivos, desc: "Propiedades en renta y negocio" },
    { name: "Patrimoniales", value: patrimoniales, color: COLORS.patrimoniales, desc: "Casa propia, tierra, herencia" },
    { name: "Inversiones", value: invFinancieras, color: COLORS.inversiones, desc: "Inversiones y dotales" },
    { name: "Liquidez", value: liquidez, color: COLORS.liquidez, desc: "Ahorro y liquidez inmediata" },
  ].filter((c) => c.value > 0);

  const solvenciaPct = Math.round(motorE.indice_solvencia * 100);
  const clasificacion = motorE.clasificacion_solvencia;

  let solvenciaColor = "text-green-400";
  if (clasificacion === "Elevado" || clasificacion === "Crítico") solvenciaColor = "text-red-400";
  else if (clasificacion === "Aceptable") solvenciaColor = "text-yellow-400";
  else if (clasificacion === "Recomendable") solvenciaColor = "text-blue-400";

  return (
    <div className="space-y-5">
      {/* Solvencia bar */}
      <div className="bg-[#162236] rounded-xl p-5 border border-[#243555]">
        <p className="text-xs font-bold text-[#C9A96E] uppercase tracking-widest mb-1">Solvencia (excluyendo activos de retiro)</p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex-1 h-4 bg-[#0F1E36] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#C9A96E] rounded-full transition-all"
              style={{ width: `${Math.min(100, solvenciaPct)}%` }}
            />
          </div>
          <span className={`text-xl font-bold ${solvenciaColor}`}>{solvenciaPct}%</span>
        </div>
        <div className="mt-3 bg-[#0F1E36] rounded-lg p-3 border border-[#243555]">
          <p className="text-xs text-[#8899BB]">
            <span className={`font-bold ${solvenciaColor}`}>{clasificacion}</span>
            {" — "}{solvenciaMsg[clasificacion] ?? ""}
          </p>
        </div>
      </div>

      {/* Estructura categorías */}
      <div className="bg-[#162236] rounded-xl p-5 border border-[#243555]">
        <p className="text-xs font-bold text-[#C9A96E] uppercase tracking-widest mb-4">Estructura de tu Patrimonio</p>
        <div className="space-y-3">
          {categorias.map((cat) => {
            const pct = total > 0 ? (cat.value / total) * 100 : 0;
            return (
              <div key={cat.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-[#8899BB]">{cat.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#4A5A75]">{pct.toFixed(0)}%</span>
                    <span className="text-sm font-semibold text-white w-32 text-right">{formatMXN(cat.value)}</span>
                  </div>
                </div>
                <div className="h-2 bg-[#0F1E36] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: cat.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donut chart */}
      {categorias.length > 0 && (
        <div className="bg-[#162236] rounded-xl p-5 border border-[#243555]">
          <p className="text-xs font-bold text-[#C9A96E] uppercase tracking-widest mb-4">Distribución Patrimonial</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categorias}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                dataKey="value"
                paddingAngle={2}
              >
                {categorias.map((cat) => (
                  <Cell key={cat.name} fill={cat.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatMXN(Number(value))}
                contentStyle={{ background: "#0F1E36", border: "1px solid #243555", borderRadius: "8px", color: "#fff" }}
              />
              <Legend
                formatter={(value) => <span className="text-xs text-[#8899BB]">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-xs text-[#4A5A75] text-center mt-2">
            Liquidez · Inversiones · Patrimoniales · Productivos · Retiro
          </p>
        </div>
      )}
    </div>
  );
}
