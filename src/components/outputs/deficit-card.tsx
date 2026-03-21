"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMXN } from "@/lib/format-currency";

interface DeficitCardProps {
  deficit: number;
  simuladorUrl?: string;
}

export function DeficitCard({ deficit, simuladorUrl = "/simulador" }: DeficitCardProps) {
  const falta = deficit > 0;

  return (
    <div className="space-y-2 min-w-0">
      <p className="font-bold font-[family-name:var(--font-poppins)] text-sm text-white">
        Déficit/Superávit Retiro
      </p>
    <div
      className={`flex items-start gap-3 p-4 rounded-lg ${
        falta
          ? "border-l-4 border-[#8B3A3A]"
          : "border-l-4 border-[#317A70]"
      }`}
    >
      {falta ? (
        <AlertTriangle className="h-6 w-6 text-[#8B3A3A] shrink-0" />
      ) : (
        <CheckCircle className="h-6 w-6 text-[#317A70] shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-[family-name:var(--font-open-sans)] text-sm text-white break-words">
          {falta
            ? `Te faltan ${formatMXN(deficit)}/mes para tu retiro ideal`
            : `Tienes ${formatMXN(Math.abs(deficit))}/mes de excedente`}
        </p>
        {!falta && (
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#317A70] mt-1">
            Tu retiro está más que cubierto
          </p>
        )}
        {falta && (
          <Link href={simuladorUrl} className="inline-block mt-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#E6C78A] text-[#E6C78A] hover:bg-[#E6C78A]/10"
            >
              Simula cómo lograrlo →
            </Button>
          </Link>
        )}
      </div>
    </div>
    </div>
  );
}
