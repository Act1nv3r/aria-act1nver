"use client";

import {
  Wallet, TrendingUp, BarChart2, Home, ShieldCheck,
  Users, Calendar, Crown, ArrowRight, Flame,
} from "lucide-react";
import { buildPlanDeAccion, PlanRow } from "@/lib/plan-accion";
import { calcularMotorA } from "@/lib/motors/motor-a";
import { calcularMotorB } from "@/lib/motors/motor-b";
import { calcularMotorC } from "@/lib/motors/motor-c";
import { calcularMotorE } from "@/lib/motors/motor-e";
import { formatMXN } from "@/lib/format-currency";

interface Props {
  motorA: ReturnType<typeof calcularMotorA>;
  motorB: ReturnType<typeof calcularMotorB>;
  motorC: ReturnType<typeof calcularMotorC>;
  motorE: ReturnType<typeof calcularMotorE>;
  proteccion: { seguro_vida: boolean; propiedades_aseguradas: boolean | null; sgmm: boolean } | null;
  perfil: { dependientes: boolean; edad: number } | null;
  patrimonio: { casa: number; tierra: number; herencia: number; inmuebles_renta: number; negocio: number } | null;
}

const ASPECTO_CONFIG: Record<string, { icon: React.ElementType; impact: (m: Props) => string }> = {
  Liquidez: { icon: Wallet, impact: ({ motorA }) => `Optimiza ${formatMXN(motorA.remanente)} de excedente mensual` },
  "Riqueza Financiera": { icon: TrendingUp, impact: ({ motorE }) => `Crecimiento sobre ${formatMXN(motorE.financiero)}` },
  Inversión: { icon: BarChart2, impact: ({ motorA }) => `${Math.round(motorA.remanente / Math.max(motorA.ingresos_totales, 1) * 100)}% de ingresos disponible` },
  Inmuebles: { icon: Home, impact: ({ motorE }) => `${formatMXN(motorE.noFinanciero)} en activos inmobiliarios` },
  Seguros: { icon: ShieldCheck, impact: ({ motorE }) => `Protege ${formatMXN(motorE.patrimonio_neto)} de patrimonio neto` },
  Dependientes: { icon: Users, impact: () => "Asegura el bienestar de tu familia" },
  Retiro: { icon: Calendar, impact: ({ motorC }) => `Meta: ${formatMXN(motorC.mensualidad_posible + motorC.pension_total_mensual)}/mes` },
  Sucesión: { icon: Crown, impact: ({ motorE }) => `Planifica ${formatMXN(motorE.patrimonio_neto)} para tus herederos` },
};

const urgencyMap: Record<string, "urgente" | "importante" | "optimizar"> = {
  Alto: "urgente",
  "Muy Alto": "urgente",
  Medio: "importante",
  Bajo: "optimizar",
};

const urgencyConfig = {
  urgente: { label: "Urgente", color: "#EF4444", bg: "#EF444415", border: "#EF444430" },
  importante: { label: "Importante", color: "#F97316", bg: "#F9731615", border: "#F9731630" },
  optimizar: { label: "Optimizar", color: "#10B981", bg: "#10B98115", border: "#10B98130" },
};

// Convert situación + riesgo → imperative action title
function toActionTitle(row: PlanRow): string {
  const map: Record<string, string> = {
    Liquidez: row.riesgo === "Bajo" ? "Diversifica tu excedente de liquidez" : "Construye tu reserva de emergencia",
    "Riqueza Financiera": row.riesgo === "Bajo" ? "Optimiza el rendimiento de tu portafolio" : "Fortalece tu patrimonio financiero",
    Inversión: row.riesgo === "Bajo" ? "Maximiza tu estrategia de inversión" : "Incrementa tu tasa de ahorro",
    Inmuebles: "Potencia tus activos inmobiliarios",
    Seguros: row.riesgo !== "Bajo" ? "Contrata coberturas de protección" : "Revisa tus sumas aseguradas",
    Dependientes: row.riesgo !== "Bajo" ? "Protege a quienes dependen de ti" : "Verifica la cobertura familiar",
    Retiro: row.riesgo !== "Bajo" ? "Acelera tu plan de retiro" : "Optimiza tus esquemas de pensión",
    Sucesión: "Planifica el legado de tu patrimonio",
  };
  return map[row.aspecto] ?? row.recomendacion;
}

export function ActionPlanPriority(props: Props) {
  const rows = buildPlanDeAccion(props);

  // Sort: urgente first, then importante, then optimizar; max 5 cards
  const sorted = [...rows]
    .map((r) => ({ ...r, urgency: urgencyMap[r.riesgo] ?? "optimizar" }))
    .sort((a, b) => {
      const order = { urgente: 0, importante: 1, optimizar: 2 };
      return order[a.urgency] - order[b.urgency];
    })
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {sorted.map((row) => {
          const cfg = urgencyConfig[row.urgency];
          const aspectoCfg = ASPECTO_CONFIG[row.aspecto];
          const Icon = aspectoCfg?.icon ?? Flame;
          const impact = aspectoCfg?.impact(props) ?? "";

          return (
            <div
              key={row.aspecto}
              className="flex items-start gap-4 rounded-2xl p-5 border transition-all hover:scale-[1.01]"
              style={{ background: cfg.bg, borderColor: cfg.border }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${cfg.color}20` }}
              >
                <Icon size={18} style={{ color: cfg.color }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                    style={{ background: `${cfg.color}20`, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-[#5A6A85]">{row.aspecto}</span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{toActionTitle(row)}</h4>
                <p className="text-xs text-[#8B9BB4] mb-2">{impact}</p>
                <p className="text-xs text-[#5A6A85] italic">{row.recomendacion}</p>
              </div>

              {/* CTA */}
              <button
                className="flex items-center gap-1 text-xs font-semibold shrink-0 mt-1 px-3 py-2 rounded-lg transition-colors"
                style={{ color: cfg.color, background: `${cfg.color}10` }}
              >
                Ver <ArrowRight size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Actinver banner */}
      <div className="bg-[#C9A84C]/[0.06] border border-[#C9A84C]/20 rounded-2xl p-4 text-center">
        <p className="text-sm text-[#C9A84C] font-semibold">
          Actinver puede ayudarte a resolver todas estas oportunidades hoy.
        </p>
        <p className="text-xs text-[#5A6A85] mt-1">
          Tu asesor tiene las herramientas y los productos para optimizar cada área de tu patrimonio.
        </p>
      </div>
    </div>
  );
}
