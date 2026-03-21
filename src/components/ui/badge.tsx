type BadgeVariant = "suficiente" | "mejor" | "bien" | "genial" | "on-fire";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  suficiente:
    "bg-[#60A5FA]/10 text-[#60A5FA] border border-[#60A5FA]/20",
  mejor:
    "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20",
  bien:
    "bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20",
  genial:
    "bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20",
  "on-fire":
    "bg-gradient-to-r from-[#C9A84C] to-[#E8C872] text-[#060D1A] border-0 font-bold",
};

export function Badge({ variant = "suficiente", children }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full
        font-bold font-[family-name:var(--font-poppins)] text-xs
        ${variantStyles[variant]}
      `}
    >
      {children}
    </span>
  );
}
