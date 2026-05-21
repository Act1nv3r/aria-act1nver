"use client";

import { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { useDiagnosticoId } from "@/contexts/diagnostico-context";
import { api } from "@/lib/api-client";

/**
 * Legacy hub page — now redirects straight to the unified results screen.
 * Side effects (mark as complete) are preserved here so old bookmarks
 * and nav flows still trigger them before landing on presentacion-b.
 */
export default function ResultadosHubPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id as string;
  const { isApiMode } = useDiagnosticoId();
  const perfil = useDiagnosticoStore((s) => s.perfil);
  const modo = useDiagnosticoStore((s) => s.modo);
  const marcarDiagnosticoCompleto = useDiagnosticoStore((s) => s.marcarDiagnosticoCompleto);
  const currentClienteId = useDiagnosticoStore((s) => s.currentClienteId);
  const clienteId = searchParams.get("clienteId") ?? currentClienteId;

  useEffect(() => {
    if (!id || id === "demo") return;
    const nombre = perfil?.nombre ?? "Cliente";
    marcarDiagnosticoCompleto(id, nombre, modo);
    if (isApiMode) {
      api.diagnosticos.completar(id).catch(() => {});
    }
    const qp = clienteId ? `?clienteId=${encodeURIComponent(clienteId)}` : "";
    router.replace(`/diagnosticos/${id}/presentacion-b${qp}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return null;
}
