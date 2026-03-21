"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";

export default function DiagnosticoPage() {
  const router = useRouter();
  const params = useParams();
  const pasoActual = useDiagnosticoStore((s) => s.pasoActual);
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/diagnosticos/${id}/paso/${pasoActual}`);
    }
  }, [id, pasoActual, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-[#5A6A85]">Redirigiendo...</div>
    </div>
  );
}
