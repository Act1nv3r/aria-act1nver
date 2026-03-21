"use client";

import { useEffect, useState } from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onDismiss?: () => void;
}

const variantStyles: Record<ToastVariant, string> = {
  success: "bg-[#317A70] text-white",
  error: "bg-[#8B3A3A] text-white",
  info: "bg-[#314566] text-white",
};

export function Toast({
  message,
  variant = "info",
  duration = 5000,
  onDismiss,
}: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg
        font-[family-name:var(--font-open-sans)] text-sm
        animate-in slide-in-from-right-5 fade-in
        ${variantStyles[variant]}
      `}
    >
      {message}
    </div>
  );
}
