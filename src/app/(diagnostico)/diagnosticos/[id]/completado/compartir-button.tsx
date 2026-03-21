"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";

export function CompartirButton({ diagnosticoId }: { diagnosticoId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompartir = async () => {
    setLoading(true);
    try {
      const res = await api.diagnosticos.compartir(diagnosticoId);
      setUrl(res.url);
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(res.url);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  if (url) {
    return (
      <div className="flex flex-col gap-2">
        <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#317A70]">
          Enlace copiado al portapapeles
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-[family-name:var(--font-open-sans)] text-sm text-[#E6C78A] break-all"
        >
          {url}
        </a>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className="border-[#317A70] text-[#317A70] hover:bg-[#317A70]/10"
      onClick={handleCompartir}
      disabled={loading}
    >
      {loading ? "Generando..." : "Compartir con cliente"}
    </Button>
  );
}
