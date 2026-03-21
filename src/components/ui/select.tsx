"use client";

import { useId } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Select({
  label,
  options,
  error,
  placeholder = "Seleccionar...",
  value,
  onValueChange,
}: SelectProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block font-[family-name:var(--font-poppins)] text-xs text-[#8B9BB4] font-medium tracking-wide mb-1.5 uppercase"
        >
          {label}
        </label>
      )}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`
            w-full flex items-center justify-between gap-2
            bg-[#112038] border rounded-[10px] px-4 py-3
            font-[family-name:var(--font-poppins)] text-sm text-[#F0F4FA]
            data-[placeholder]:text-[#4A5A72]
            focus:outline-none focus:border-[#C9A84C]/60 focus:bg-[#1A3154]/50
            hover:border-white/[0.12]
            transition-all duration-200
            ${error ? "border-[#EF4444]/50 bg-[#EF4444]/5" : "border-white/[0.08]"}
          `}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4 text-[#8B9BB4] shrink-0" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="bg-[#112038] border border-white/[0.08] rounded-[12px] shadow-[0_8px_40px_rgba(0,0,0,0.6)] mt-1 z-50 overflow-hidden"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1.5">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className="
                    relative flex items-center gap-2 px-3 py-2.5 rounded-[8px]
                    cursor-pointer outline-none
                    font-[family-name:var(--font-poppins)] text-sm text-[#F0F4FA]
                    hover:bg-[#1A3154] data-[highlighted]:bg-[#1A3154]
                    data-[state=checked]:bg-[#C9A84C]/10 data-[state=checked]:text-[#C9A84C]
                    transition-colors duration-150
                  "
                >
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-3.5 w-3.5 text-[#C9A84C] shrink-0" />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 font-[family-name:var(--font-poppins)] text-xs text-[#EF4444]"
        >
          {error}
        </p>
      )}
    </div>
  );
}
