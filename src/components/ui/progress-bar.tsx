"use client";

type ProgressSize = "sm" | "md" | "lg";

interface ProgressBarProps {
  value: number;
  size?: ProgressSize;
  showLabel?: boolean;
}

const sizeStyles: Record<ProgressSize, string> = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
};

export function ProgressBar({
  value,
  size = "md",
  showLabel = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full">
      <div
        className={`w-full rounded-full bg-[#5A6A85]/20 overflow-hidden ${sizeStyles[size]}`}
      >
        <div
          className="h-full bg-[#E6C78A] transition-all duration-[1.5s] ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-center font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
          {Math.round(clamped)}%
        </p>
      )}
    </div>
  );
}
