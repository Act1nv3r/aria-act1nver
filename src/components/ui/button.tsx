"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "accent" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#1A3154] border border-white/[0.08] text-[#F0F4FA] hover:bg-[#1A3154]/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:-translate-y-px",
  secondary:
    "bg-[#0C1829] border border-white/[0.08] text-[#F0F4FA] hover:bg-[#112038] hover:border-white/[0.12]",
  outline:
    "bg-transparent border border-white/[0.15] text-[#F0F4FA] hover:bg-[#0C1829] hover:border-white/[0.2]",
  ghost:
    "bg-transparent border-0 text-[#F0F4FA] hover:bg-[#1A3154]/30",
  accent:
    "bg-gradient-to-r from-[#C9A84C] via-[#E8C872] to-[#C9A84C] bg-[length:200%_100%] text-[#060D1A] font-bold hover:shadow-[0_0_32px_rgba(201,168,76,0.25)] hover:scale-[1.01] active:scale-100",
  danger:
    "bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20 hover:border-[#EF4444]/50",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      className = "",
      ...props
    },
    ref
  ) => {
    const isAccent = variant === "accent";
    const spinnerColor = isAccent ? "text-[#060D1A]" : "text-current";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2
          font-bold font-[family-name:var(--font-poppins)]
          rounded-[10px] transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${variantStyles[variant]} ${sizeStyles[size]} ${className}
        `}
        {...props}
      >
        {loading ? (
          <svg
            className={`animate-spin h-4 w-4 ${spinnerColor}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
