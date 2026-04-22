"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Flame, Star, TrendingUp, Award, Zap } from "lucide-react";
import { calcularMotorB } from "@/lib/motors/motor-b";
import { calcularMotorE } from "@/lib/motors/motor-e";
import { formatMXN } from "@/lib/format-currency";

const NIVEL_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  suficiente: { label: "Suficiente", icon: Star, color: "#60A5FA", bg: "#1E3A5F" },
  mejor: { label: "Mejor", icon: TrendingUp, color: "#10B981", bg: "#0D3320" },
  bien: { label: "Bien", icon: Award, color: "#C9A84C", bg: "#2A1F00" },
  genial: { label: "Genial", icon: Zap, color: "#A78BFA", bg: "#2A1040" },
  "on-fire": { label: "On Fire", icon: Flame, color: "#F97316", bg: "#3A1200" },
};

const NIVELES_ORDER = ["suficiente", "mejor", "bien", "genial", "on-fire"];

function useCountUp(target: number, duration = 1500) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);
  return display;
}

interface Props {
  motorB: ReturnType<typeof calcularMotorB>;
  motorE: ReturnType<typeof calcularMotorE>;
  nombre: string;
}

export function PatrimonioHero({ motorB, motorE, nombre }: Props) {
  const animatedValue = useCountUp(motorE.patrimonio_neto);
  const cfg = NIVEL_CONFIG[motorB.nivel_riqueza] ?? NIVEL_CONFIG.suficiente;
  const NivelIcon = cfg.icon;

  const longevidad = Math.round(motorB.longevidad_recursos);

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 80% 60% at 20% 30%, #1C2B4A 0%, #060D1A 50%, #0F1E36 100%)",
      }}
    >
      {/* Animated aurora overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 80% 70%, #C9A84C22 0%, transparent 60%)",
          animation: "aurora-pulse 8s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes aurora-pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
        @keyframes float-chevron {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
      `}</style>

      {/* Actinver watermark */}
      <p className="absolute top-6 left-8 text-xs font-bold text-[#C9A84C]/40 uppercase tracking-widest">
        Actinver Banca Privada
      </p>

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* Nivel badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 border"
          style={{ background: cfg.bg, borderColor: `${cfg.color}44` }}
        >
          <NivelIcon size={16} style={{ color: cfg.color }} />
          <span className="text-sm font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
            Nivel {cfg.label}
          </span>
        </div>

        {/* Patrimonio counter */}
        <div className="mb-4">
          <p className="text-[13px] font-medium text-[#5A6A85] uppercase tracking-[4px] mb-2">
            Tu Patrimonio
          </p>
          <h1
            className="font-bold leading-none tracking-tight"
            style={{
              fontSize: "clamp(3rem, 10vw, 6rem)",
              background: "linear-gradient(135deg, #FFFFFF 0%, #C9A84C 60%, #E8C872 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {formatMXN(animatedValue)}
          </h1>
        </div>

        {/* Personalized subtitle */}
        <p className="text-lg text-[#8B9BB4] mb-12">
          {nombre ? (
            <><span className="text-white font-semibold">{nombre}</span>, esto es lo que has construido.</>
          ) : (
            "Esto es lo que has construido."
          )}
        </p>

        {/* 3 stat chips */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <p className="text-[10px] text-[#5A6A85] uppercase tracking-wide mb-1">Activos Totales</p>
            <p className="text-base font-bold text-white">{formatMXN(motorE.activos_total)}</p>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <p className="text-[10px] text-[#5A6A85] uppercase tracking-wide mb-1">Tu dinero dura</p>
            <p className="text-base font-bold text-[#C9A84C]">{longevidad > 0 ? `${longevidad} años` : "∞"}</p>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <p className="text-[10px] text-[#5A6A85] uppercase tracking-wide mb-1">Solvencia</p>
            <p className="text-base font-bold text-white">{Math.round(motorE.indice_solvencia * 100)}%</p>
            <p className="text-[10px] text-[#5A6A85]">{motorE.clasificacion_solvencia}</p>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[#5A6A85] flex flex-col items-center gap-1"
        style={{ animation: "float-chevron 2s ease-in-out infinite" }}
      >
        <p className="text-[10px] uppercase tracking-widest">Descubre tu diagnóstico</p>
        <ChevronDown size={20} />
      </div>

      {/* Nivel track pills */}
      <div className="absolute bottom-10 right-8 flex gap-1.5">
        {NIVELES_ORDER.map((n) => {
          const isCurrent = n === motorB.nivel_riqueza;
          const isBelow = NIVELES_ORDER.indexOf(n) <= NIVELES_ORDER.indexOf(motorB.nivel_riqueza);
          return (
            <div
              key={n}
              className="w-6 h-1.5 rounded-full transition-all"
              style={{
                background: isCurrent ? cfg.color : isBelow ? `${cfg.color}55` : "#243555",
              }}
              title={NIVEL_CONFIG[n]?.label}
            />
          );
        })}
      </div>
    </div>
  );
}
