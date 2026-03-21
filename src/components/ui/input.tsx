"use client";

import { InputHTMLAttributes, forwardRef, useId } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  register?: UseFormRegisterReturn;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, register, className = "", id: idProp, ...props }, ref) => {
    const inputRef = ref || register?.ref;
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const errorId = `${id}-error`;
    return (
      <div className="w-full min-w-0">
        {label && (
          <label
            htmlFor={id}
            className="block font-[family-name:var(--font-poppins)] text-xs text-[#8B9BB4] font-medium tracking-wide mb-2 uppercase leading-snug"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={inputRef}
          {...register}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`
            w-full bg-[#112038] border rounded-[10px] px-4 py-3
            font-[family-name:var(--font-poppins)] text-sm text-[#F0F4FA]
            placeholder:text-[#4A5A72]
            focus:outline-none focus:border-[#C9A84C]/60 focus:bg-[#1A3154]/50
            hover:border-white/[0.12]
            transition-all duration-200
            ${error ? "border-[#EF4444]/50 bg-[#EF4444]/5" : "border-white/[0.08]"}
            ${className}
          `}
          {...props}
        />
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
);

Input.displayName = "Input";
