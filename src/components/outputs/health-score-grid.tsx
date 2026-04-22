"use client";

import { Shield, TrendingUp, Calendar, Lock } from "lucide-react";
import { calcularMotorA } from "@/lib/motors/motor-a";
import { calcularMotorB } from "@/lib/motors/motor-b";
import { calcularMotorC } from "@/lib/motors/motor-c";

interface Props {
  motorA: ReturnType<typeof calcularMotorA>;
  motorB: ReturnType<typeof calcularMotorB>;
  motorC: ReturnType<typeof calcularMotorC> | null;
  proteccion: { seguro_vida: boolean | null; propiedades_aseguradas: boolean | null; sgmm: boolean | null } | null;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#C9A84C";
  if (score >= 40) return "#F97316";
  return "#EF4444";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Buena";
  if (score >= 40) return "Mejorable";
  return "Urgente";
}

interface GaugeCardProps {
  icon: React.ElementType;
  title: string;
  score: number;
  label: string;
  detail: string;
}

function SemiGauge({ score, color }: { score: number; color: string }) {
  const clamped = Math.min(Math.max(score, 0), 100);
  // Semicircle path: start at left (180°), sweep to right (0°) = 180° arc
  // Using a simplified representation
  const cx = 60, cy = 58, r = 48;
  const startAngle = Math.PI; // 180° left
  const endAngle = 0;         // 0° right
  const totalAngle = Math.PI;
  const filledAngle = totalAngle * (clamped / 100);
  const arcAngle = startAngle - filledAngle;

  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(arcAngle);
  const y2 = cy + r * Math.sin(arcAngle);
  const largeArc = filledAngle > Math.PI / 2 ? 0 : 0;

  // Background track points (full semicircle)
  const bx1 = cx + r * Math.cos(Math.PI);
  const by1 = cy + r * Math.sin(Math.PI);
  const bx2 = cx + r * Math.cos(0);
  const by2 = cy + r * Math.sin(0);

  return (
    <svg width="120" height="70" viewBox="0 0 120 70" className="mx-auto">
      {/* Background track */}
      <path
        d={`M ${bx1} ${by1} A ${r} ${r} 0 0 1 ${bx2} ${by2}`}
        fill="none" stroke="#243555" strokeWidth="10" strokeLinecap="round"
      />
      {/* Filled arc */}
      {clamped > 0 && (
        <path
          d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          style={{ transition: "all 1.2s ease-out" }}
        />
      )}
      <text x="60" y="54" textAnchor="middle" fill="white" fontSize="17" fontWeight="bold">
        {Math.round(clamped)}
      </text>
    </svg>
  );
}

function ScoreCard({ icon: Icon, title, score, label, detail }: GaugeCardProps) {
  const color = scoreColor(score);
  const statusLabel = scoreLabel(score);

  return (
    <div className="bg-[#0C1829] border border-white/[0.06] rounded-2xl p-5 hover:border-[#C9A84C]/20 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
            <Icon size={16} style={{ color }} />
          </div>
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${color}20`, color }}
        >
          {statusLabel}
        </span>
      </div>

      <SemiGauge score={score} color={color} />

      <p className="text-center text-xs font-semibold text-[#8B9BB4] mt-1">{label}</p>
      <p className="text-center text-[10px] text-[#4A5A75] mt-0.5">{detail}</p>
    </div>
  );
}

export function HealthScoreGrid({ motorA, motorB, motorC, proteccion }: Props) {
  // Score 1: Liquidez
  const meses = motorA.meses_cubiertos ?? 0;
  const liquidezScore = Math.min((meses / 12) * 100, 100);
  const liquidezLabel = meses >= 12 ? "Reserva óptima" : meses >= 3 ? "Reserva adecuada" : "Reserva insuficiente";
  const liquidezDetail = `${meses.toFixed(1)} meses de gastos cubiertos`;

  // Score 2: Riqueza
  const benchmarkRiqueza = motorB.benchmark_para_edad;
  const riquezaScore = benchmarkRiqueza > 0 ? Math.min((motorB.ratio / benchmarkRiqueza) * 100, 100) : 0;
  const nivelLabels: Record<string, string> = { suficiente: "Suficiente", mejor: "Mejor", bien: "Bien", genial: "Genial", "on-fire": "On Fire" };
  const riquezaLabel = nivelLabels[motorB.nivel_riqueza] ?? motorB.nivel_riqueza;
  const riquezaDetail = `${motorB.ratio.toFixed(1)}x gastos anuales cubiertos`;

  // Score 3: Retiro
  const retiroScore = motorC ? Math.min(motorC.grado_avance * 100, 100) : 0;
  const retiroLabel = retiroScore >= 100 ? "Meta alcanzada" : retiroScore >= 60 ? "Buen avance" : "Requiere atención";
  const retiroDetail = motorC ? `${Math.round(retiroScore)}% de tu mensualidad deseada` : "Sin datos de retiro";

  // Score 4: Protección
  let protScore = 0;
  if (proteccion?.seguro_vida) protScore += 33;
  if (proteccion?.sgmm) protScore += 33;
  if (proteccion?.propiedades_aseguradas) protScore += 34;
  const protLabel = protScore >= 80 ? "Bien protegido" : protScore >= 33 ? "Cobertura parcial" : "Sin protección";
  const protDetail = `${protScore}% de coberturas presentes`;

  const globalScore = Math.round((liquidezScore + riquezaScore + retiroScore + protScore) / 4);
  const globalColor = scoreColor(globalScore);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <ScoreCard icon={Shield} title="Liquidez" score={liquidezScore} label={liquidezLabel} detail={liquidezDetail} />
        <ScoreCard icon={TrendingUp} title="Riqueza" score={riquezaScore} label={riquezaLabel} detail={riquezaDetail} />
        <ScoreCard icon={Calendar} title="Retiro" score={retiroScore} label={retiroLabel} detail={retiroDetail} />
        <ScoreCard icon={Lock} title="Protección" score={protScore} label={protLabel} detail={protDetail} />
      </div>

      {/* Global score banner */}
      <div
        className="rounded-2xl p-5 border flex items-center justify-between"
        style={{ background: `${globalColor}0A`, borderColor: `${globalColor}30` }}
      >
        <div>
          <p className="text-sm font-bold text-white">Salud Financiera General</p>
          <p className="text-xs text-[#8B9BB4] mt-0.5">{scoreLabel(globalScore)} — continúa optimizando con tu asesor</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold" style={{ color: globalColor }}>{globalScore}</p>
          <p className="text-xs text-[#4A5A75]">de 100</p>
        </div>
      </div>
    </div>
  );
}
