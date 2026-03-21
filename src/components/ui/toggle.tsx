"use client";

import { useId } from "react";

interface ToggleProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function Toggle({ label, checked = false, onChange }: ToggleProps) {
  const labelId = useId();

  const segmentBase =
    "min-w-[3.25rem] px-3.5 py-2 rounded-lg text-xs font-semibold font-[family-name:var(--font-poppins)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060D1A]";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      {label && (
        <label
          id={`${labelId}-label`}
          className="font-[family-name:var(--font-poppins)] text-sm text-[#F0F4FA] leading-snug sm:max-w-[min(100%,28rem)]"
        >
          {label}
        </label>
      )}
      <div
        role="radiogroup"
        aria-labelledby={label ? `${labelId}-label` : undefined}
        className="inline-flex shrink-0 items-center gap-0.5 rounded-[11px] border border-white/[0.08] bg-[#070F1A] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      >
        <button
          type="button"
          role="radio"
          aria-checked={!checked}
          className={`${segmentBase} ${
            !checked
              ? "bg-[#1A3154] text-[#F0F4FA] shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
              : "text-[#6B7C95] hover:bg-white/[0.04] hover:text-[#B8C4D6]"
          }`}
          onClick={() => onChange?.(false)}
        >
          No
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={checked}
          className={`${segmentBase} ${
            checked
              ? "bg-gradient-to-br from-[#C9A84C] to-[#D4B55E] text-[#0C1829] shadow-[0_1px_3px_rgba(201,168,76,0.35)]"
              : "text-[#6B7C95] hover:bg-white/[0.04] hover:text-[#B8C4D6]"
          }`}
          onClick={() => onChange?.(true)}
        >
          Sí
        </button>
      </div>
    </div>
  );
}
