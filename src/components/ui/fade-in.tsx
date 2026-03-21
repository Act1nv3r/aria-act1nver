"use client";

interface FadeInProps {
  children: React.ReactNode;
}

export function FadeIn({ children }: FadeInProps) {
  return <div className="animate-fade-in space-y-4">{children}</div>;
}
