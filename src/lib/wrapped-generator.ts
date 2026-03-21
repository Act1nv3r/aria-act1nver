import JSZip from "jszip";
import { sanitizeClonedDocumentForHtml2Canvas } from "@/lib/html2canvas-color-fix";

function saveBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export interface WrappedData {
  nombre: string;
  nivel: string;
  gradoAvance: number;
  mesesReserva: number;
  ahorroPct: string;
  objetivosCount: number;
  viablesCount: number;
}

const CARD_IDS = ["intro", "nivel", "retiro", "reserva", "ahorro", "objetivos", "cta"] as const;

export async function generarWrappedZip(
  data: WrappedData,
  activeCards: Set<string>
): Promise<void> {
  if (typeof window === "undefined") return;
  const html2canvas = (await import("html2canvas")).default;
  const zip = new JSZip();

  for (const id of CARD_IDS) {
    const el = document.getElementById(`wrapped-card-${id}`);
    if (!el || !activeCards.has(id)) continue;
    const canvas = await html2canvas(el, {
      scale: 2,
      width: 1080,
      height: 1920,
      useCORS: true,
      backgroundColor: "#0A0E12",
      onclone: (clonedDoc) => sanitizeClonedDocumentForHtml2Canvas(clonedDoc),
    });
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/png", 0.95)
    );
    zip.file(`ArIA_${id}.png`, blob);
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveBlob(content, `ArIA_Wrapped_${data.nombre.replace(/\s/g, "_")}.zip`);
}
