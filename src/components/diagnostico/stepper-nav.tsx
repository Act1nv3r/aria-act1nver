"use client";

import { Check } from "lucide-react";
import { DIAGNOSTICO_STEPS } from "@/lib/diagnostico-steps";

const steps = DIAGNOSTICO_STEPS;

interface StepperNavProps {
  pasoActual: number;
  pasosCompletados: number[];
  onStepClick: (paso: number) => void;
}

/**
 * Mobile-only compact horizontal stepper.
 * On desktop this is replaced by the sidebar stepper in the diagnostico layout.
 */
export function StepperNav({
  pasoActual,
  pasosCompletados,
  onStepClick,
}: StepperNavProps) {
  return (
    <nav
      role="navigation"
      aria-label="Pasos del diagnóstico"
      className="flex items-center justify-center gap-1 py-3 px-4 lg:hidden"
    >
      {steps.map((step, idx) => {
        const isCurrent = pasoActual === step.id;
        const isCompleted = pasosCompletados.includes(step.id);
        const isFuture = !isCurrent && !isCompleted;

        return (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              onClick={() => isCompleted && onStepClick(step.id)}
              disabled={isFuture}
              aria-label={`${step.label}${isCurrent ? " (actual)" : isCompleted ? " (completado)" : ""}`}
              aria-current={isCurrent ? "step" : undefined}
              className={`
                w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                transition-all duration-200
                ${isCurrent ? "bg-[#C9A84C] text-[#060D1A]" : ""}
                ${isCompleted ? "bg-[#10B981]/20 text-[#10B981] cursor-pointer" : ""}
                ${isFuture ? "bg-[#1A3154] text-[#4A5A72] cursor-not-allowed" : ""}
              `}
            >
              {isCompleted ? <Check className="w-3 h-3" /> : step.id}
            </button>

            <span
              className={`
                hidden sm:inline ml-1 mr-2 text-[10px] font-medium
                ${isCurrent ? "text-[#F0F4FA]" : ""}
                ${isCompleted ? "text-[#10B981]" : ""}
                ${isFuture ? "text-[#4A5A72]" : ""}
              `}
            >
              {step.label}
            </span>

            {idx < steps.length - 1 && (
              <div
                className={`w-4 h-px mx-0.5 sm:hidden ${
                  isCompleted ? "bg-[#10B981]/40" : "bg-[#1A3154]"
                }`}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
