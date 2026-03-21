"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";

interface SliderProps {
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number[];
  onChange?: (value: number[]) => void;
  formatValue?: (value: number) => string;
}

export function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = (v) => v.toString(),
}: SliderProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        {label && (
          <span className="font-[family-name:var(--font-poppins)] text-sm text-white">
            {label}
          </span>
        )}
        <span className="font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">
          {formatValue(value[0] ?? min)}
        </span>
      </div>
      <SliderPrimitive.Root
        className="relative flex w-full touch-none select-none items-center"
        value={value}
        onValueChange={onChange}
        min={min}
        max={max}
        step={step}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow rounded-full bg-[#5A6A85]/30">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-[#E6C78A]" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="block h-5 w-5 rounded-full border-2 border-white bg-[#E6C78A] shadow-md hover:scale-110 transition-transform focus:outline-none"
        />
      </SliderPrimitive.Root>
    </div>
  );
}
