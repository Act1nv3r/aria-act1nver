"use client";

import type { OwnershipValue } from "@/lib/motors/consolidacion";

interface OwnershipChipProps {
  asset: string;
  label: string;
  value: OwnershipValue;
  onChange: (asset: string, value: OwnershipValue) => void;
}

const options: { value: OwnershipValue; label: string }[] = [
  { value: "titular", label: "Titular" },
  { value: "pareja", label: "Pareja" },
  { value: "compartido", label: "Compartido" },
];

export function OwnershipChip({ asset, label, value, onChange }: OwnershipChipProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
        {label}:
      </span>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(asset, opt.value)}
            className={`px-3 py-1 rounded-full font-[family-name:var(--font-poppins)] text-xs transition-colors ${
              value === opt.value
                ? "bg-[#317A70] text-white"
                : "bg-[#1A2433] text-[#5A6A85] hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
