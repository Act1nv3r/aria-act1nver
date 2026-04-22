// NOTE: This module must only run client-side. All heavy imports (jspdf, html2canvas)
// are dynamic so they are excluded from the SSR bundle via serverExternalPackages in next.config.ts.

import { useDiagnosticoStore } from "@/stores/diagnostico-store";
import { sanitizeClonedDocumentForHtml2Canvas } from "@/lib/html2canvas-color-fix";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// A4 dimensions in mm
const A4_W = 210;
const A4_H = 297;

function trackDocument(
  tipo: "balance" | "diagnostico",
  filename: string,
  clienteNombre: string,
  diagnosticoId?: string,
) {
  try {
    useDiagnosticoStore.getState().addDocumento({
      tipo,
      nombre_archivo: filename,
      cliente_nombre: clienteNombre,
      diagnostico_id: diagnosticoId,
    });
  } catch {
    // store not available during SSR
  }
}

/**
 * Captures each [data-pdf-page] child element of the template container
 * individually, one per PDF page. This guarantees page breaks always fall
 * at the exact boundary between sections — never mid-title or mid-chart.
 *
 * Each page is rendered at scale:2 (high-DPI) and scaled to fit A4 width.
 * If a page's natural height exceeds A4, it is scaled down uniformly so
 * all content remains visible. Short pages simply leave whitespace at the
 * bottom of the PDF page.
 */
async function capturarYDescargar(elementId: string, filename: string): Promise<boolean> {
  const contenedor = document.getElementById(elementId);
  if (!contenedor) {
    // Template not rendered on this page — caller should redirect to a page where it is.
    return false;
  }

  const html2canvas = (await import("html2canvas")).default;
  const Pdf = (await import("jspdf")).jsPDF;

  // Shared html2canvas options
  const h2cOptions = {
    scale: 2,
    useCORS: true,
    backgroundColor: "#F5F0E8",
    logging: false,
    // Prevent html2canvas from scrolling the page during capture
    scrollX: 0,
    scrollY: 0,
    onclone: (_clonedDoc: Document) => {
      sanitizeClonedDocumentForHtml2Canvas(_clonedDoc);
    },
  } as Parameters<typeof html2canvas>[1];

  const pageEls = Array.from(
    contenedor.querySelectorAll<HTMLElement>("[data-pdf-page]")
  );

  // Fallback: if no page markers found, capture the whole container as before
  if (pageEls.length === 0) {
    const canvas = await html2canvas(contenedor, h2cOptions);
    const pdf = new Pdf("p", "mm", "a4");
    const imgW = A4_W;
    const imgH = (canvas.height * A4_W) / canvas.width;
    let heightLeft = imgH;
    let pos = 0;
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    pdf.addImage(imgData, "JPEG", 0, pos, imgW, imgH);
    heightLeft -= A4_H;
    while (heightLeft > 0) {
      pos = heightLeft - imgH;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, pos, imgW, imgH);
      heightLeft -= A4_H;
    }
    pdf.save(filename);
    return true;
  }

  const pdf = new Pdf("p", "mm", "a4");

  for (let i = 0; i < pageEls.length; i++) {
    const pageEl = pageEls[i];

    const canvas = await html2canvas(pageEl, h2cOptions);
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // Rendered height in PDF mm (keeping aspect ratio at A4 width)
    const renderedH = (canvas.height * A4_W) / canvas.width;

    if (i > 0) pdf.addPage();

    if (renderedH <= A4_H) {
      // Page fits: place at top, remainder is blank white space
      pdf.addImage(imgData, "JPEG", 0, 0, A4_W, renderedH);
    } else {
      // Page taller than A4: scale uniformly to fit — all content stays visible
      const scale = A4_H / renderedH;
      const scaledW = A4_W * scale;
      const xOffset = (A4_W - scaledW) / 2;
      pdf.addImage(imgData, "JPEG", xOffset, 0, scaledW, A4_H);
    }
  }

  pdf.save(filename);
  return true;
}

export async function generarBalancePDF(
  clienteNombre: string,
  options?: { diagnosticoId?: string; token?: string }
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const filename = `Balance_Patrimonial_${clienteNombre.replace(/\s/g, "_")}.pdf`;

  if (options?.diagnosticoId) {
    try {
      const url = `${API_URL}/api/v1/diagnosticos/${options.diagnosticoId}/pdf/balance`;
      const headers: Record<string, string> = {};
      if (options.token) headers["Authorization"] = `Bearer ${options.token}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
        trackDocument("balance", filename, clienteNombre, options.diagnosticoId);
        return true;
      }
    } catch {
      // fallback to client-side DOM capture
    }
  }
  const ok = await capturarYDescargar("balance-pdf-template", filename);
  if (ok) trackDocument("balance", filename, clienteNombre, options?.diagnosticoId);
  return ok;
}

export async function generarDiagnosticoPDF(
  clienteNombre: string,
  options?: { diagnosticoId?: string; token?: string }
): Promise<void> {
  if (typeof window === "undefined") return;
  const filename = `Diagnostico_Financiero_${clienteNombre.replace(/\s/g, "_")}.pdf`;

  if (options?.diagnosticoId) {
    try {
      const url = `${API_URL}/api/v1/diagnosticos/${options.diagnosticoId}/pdf/diagnostico`;
      const headers: Record<string, string> = {};
      if (options.token) headers["Authorization"] = `Bearer ${options.token}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
        trackDocument("diagnostico", filename, clienteNombre, options.diagnosticoId);
        return;
      }
    } catch {
      // fallback to client-side
    }
  }
  await capturarYDescargar("diagnostico-pdf-template", filename);
  trackDocument("diagnostico", filename, clienteNombre, options?.diagnosticoId);
}

// Keep for backward compatibility
export async function generarPDF(
  tipo: "patrimonio" | "balance" | "recomendaciones",
  clienteNombre: string,
  options?: { diagnosticoId?: string; token?: string }
): Promise<void> {
  if (tipo === "balance") { await generarBalancePDF(clienteNombre, options); return; }
  return generarDiagnosticoPDF(clienteNombre, options);
}
