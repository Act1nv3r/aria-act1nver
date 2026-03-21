"use client";

import { useState, useCallback, useEffect, InputHTMLAttributes, useId } from "react";

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  label?: string;
  error?: string;
  value?: number;
  onChange?: (value: number) => void;
}

function formatMXN(value: number): string {
  return new Intl.NumberFormat("es-MX", { style: "decimal" }).format(value);
}

function parseMXN(str: string): number {
  const cleaned = str.replace(/[^0-9]/g, "");
  return parseInt(cleaned, 10) || 0;
}

export function CurrencyInput({
  label,
  error,
  value = 0,
  onChange,
  placeholder = "$0",
  className = "",
  ...props
}: CurrencyInputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState(formatMXN(value));

  useEffect(() => {
    if (!isFocused) setDisplayValue(formatMXN(value));
  }, [value, isFocused]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setDisplayValue(value.toString());
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setDisplayValue(formatMXN(value));
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, "");
      const num = parseInt(raw, 10) || 0;
      onChange?.(num);
      setDisplayValue(raw);
    },
    [onChange]
  );

  const showValue = isFocused ? displayValue : formatMXN(value);

  return (
    <div className={`w-full min-w-0 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block font-[family-name:var(--font-poppins)] text-xs font-medium uppercase leading-snug tracking-wide text-[#8B9BB4]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 font-[family-name:var(--font-open-sans)] text-sm text-white/60"
          aria-hidden
        >
          $
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={showValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`
            w-full min-w-0 rounded-[10px] border bg-[#112038] py-3 pl-10 pr-4
            font-[family-name:var(--font-poppins)] text-sm text-[#F0F4FA]
            placeholder:text-[#4A5A72]
            transition-all duration-200
            focus:border-[#C9A84C]/60 focus:bg-[#1A3154]/50 focus:outline-none
            hover:border-white/[0.12]
            ${error ? "border-[#EF4444]/50 bg-[#EF4444]/5" : "border-white/[0.08]"}
          `}
          {...props}
        />
      </div>
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
