import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
}

export function Card({ children, className = "", glow = false, ...props }: CardProps) {
  return (
    <div
      className={`
        bg-[#0C1829] border border-white/[0.06] rounded-[16px]
        shadow-[0_4px_24px_rgba(0,0,0,0.4)]
        overflow-hidden min-w-0 break-words
        transition-all duration-300
        ${glow ? "shadow-[0_0_32px_rgba(201,168,76,0.12)] border-[#C9A84C]/20" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
