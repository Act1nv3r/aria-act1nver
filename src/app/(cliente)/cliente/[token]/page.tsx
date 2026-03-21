"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMXN } from "@/lib/format-currency";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ClienteReadonlyPage() {
  const params = useParams();
  const token = params?.token as string;
  const [data, setData] = useState<{
    diagnostico_id?: string;
    nombre: string;
    asesor_nombre: string;
    outputs: {
      patrimonio_neto?: number;
      meses_reserva?: number | null;
      grado_avance?: number;
      nivel_riqueza?: string;
      recomendaciones?: string[];
    };
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/v1/cliente/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0E12] flex flex-col items-center justify-center p-8">
        <Link href="/" className="font-bold font-[family-name:var(--font-poppins)] text-xl text-white mb-8">
          Actinver<span className="text-[#E6C78A]">·</span> ArIA
        </Link>
        <h2 className="font-bold font-[family-name:var(--font-poppins)] text-2xl text-[#E6C78A] mb-4">
          Este enlace ha expirado
        </h2>
        <p className="font-[family-name:var(--font-open-sans)] text-[#5A6A85] text-center max-w-md mb-8">
          Contacta a tu asesor para obtener un nuevo enlace.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0A0E12]">
        <header className="py-8 flex justify-center">
          <Skeleton className="h-8 w-48" />
        </header>
        <main className="max-w-[800px] mx-auto px-6 pb-16">
          <Skeleton className="h-9 w-64 mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 min-w-0">
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mt-2" />
              </Card>
            ))}
          </div>
          <Card className="p-6 mb-8 min-w-0">
            <Skeleton className="h-4 w-3/4 mb-4" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const out = data.outputs || {};

  return (
    <div className="min-h-screen bg-[#0A0E12]">
      <header className="py-8 flex justify-center">
        <Link href="/" className="font-bold font-[family-name:var(--font-poppins)] text-2xl text-white">
          Actinver<span className="text-[#E6C78A]">·</span> ArIA
        </Link>
      </header>

      <main className="max-w-[800px] mx-auto px-6 pb-16">
        <h1 className="font-bold font-[family-name:var(--font-poppins)] text-[28px] text-white mb-8 text-center">
          Hola {data.nombre}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-6 min-w-0">
            <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">Patrimonio Neto</p>
            <p className="font-bold font-[family-name:var(--font-poppins)] text-2xl text-[#E6C78A] mt-1 break-all">
              {formatMXN(out.patrimonio_neto ?? 0)}
            </p>
          </Card>
          <Card className="p-6 min-w-0">
            <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">Grado Avance</p>
            <div className="mt-2 w-20 h-20 rounded-full border-4 border-[#317A70] flex items-center justify-center">
              <span className="font-bold font-[family-name:var(--font-poppins)] text-xl text-white">
                {Math.round((out.grado_avance ?? 0) * 100)}%
              </span>
            </div>
          </Card>
          <Card className="p-6 min-w-0">
            <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">Nivel Riqueza</p>
            <p className="font-bold font-[family-name:var(--font-poppins)] text-xl text-white mt-1 break-words">
              {out.nivel_riqueza ?? "—"}
            </p>
          </Card>
          <Card className="p-6 min-w-0">
            <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">Reserva (meses)</p>
            <p className="font-bold font-[family-name:var(--font-poppins)] text-xl text-white mt-1 break-words">
              {out.meses_reserva != null ? `${out.meses_reserva.toFixed(1)} meses` : "—"}
            </p>
          </Card>
        </div>

        <Card className="p-6 mb-8 min-w-0">
          <h3 className="font-bold font-[family-name:var(--font-poppins)] text-base text-[#E6C78A] mb-4">
            Recomendaciones
          </h3>
          <ul className="space-y-2">
            {(out.recomendaciones ?? []).map((r, i) => (
              <li key={i} className="font-[family-name:var(--font-open-sans)] text-sm text-white flex items-start gap-2 break-words">
                <span className="text-[#317A70] shrink-0">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex justify-center gap-4 mb-12">
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.open(`${API_URL}/api/v1/cliente/${token}/pdf/patrimonio`, "_blank")}
          >
            Descargar mis resultados
          </Button>
        </div>

        <footer className="text-center pt-8 border-t border-[#5A6A85]/20">
          <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
            Tu asesor: {data.asesor_nombre || "—"}
          </p>
          <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85] mt-1">
            ¿Necesitas algo más? Contacta a tu asesor.
          </p>
        </footer>
      </main>
    </div>
  );
}
