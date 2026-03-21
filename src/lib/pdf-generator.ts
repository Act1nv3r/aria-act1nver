// NOTE: This module must only run client-side. All heavy imports (jspdf, html2canvas)
// are dynamic so they are excluded from the SSR bundle via serverExternalPackages in next.config.ts.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function capturarYDescargar(elementId: string, filename: string): Promise<void> {
  const contenedor = document.getElementById(elementId);
  if (!contenedor) {
    console.error(`PDF element #${elementId} not found`);
    return;
  }

  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(contenedor, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#F5F0E8",
    logging: false,
  });

  const Pdf = (await import("jspdf")).jsPDF;
  const pdf = new Pdf("p", "mm", "a4");
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const pageHeight = 297;
  let position = 0;
  let heightLeft = imgHeight;

  pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}

export async function generarBalancePDF(
  clienteNombre: string,
  options?: { diagnosticoId?: string; token?: string }
): Promise<void> {
  if (typeof window === "undefined") return;
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
        a.download = `Balance_Financiero_${clienteNombre.replace(/\s/g, "_")}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
        return;
      }
    } catch {
      // fallback to client-side
    }
  }
  await capturarYDescargar(
    "balance-pdf-template",
    `Balance_Financiero_${clienteNombre.replace(/\s/g, "_")}.pdf`
  );
}

export async function generarDiagnosticoPDF(
  clienteNombre: string,
  options?: { diagnosticoId?: string; token?: string }
): Promise<void> {
  if (typeof window === "undefined") return;
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
        a.download = `Diagnostico_Financiero_${clienteNombre.replace(/\s/g, "_")}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
        return;
      }
    } catch {
      // fallback to client-side
    }
  }
  await capturarYDescargar(
    "diagnostico-pdf-template",
    `Diagnostico_Financiero_${clienteNombre.replace(/\s/g, "_")}.pdf`
  );
}

// Keep for backward compatibility
export async function generarPDF(
  tipo: "patrimonio" | "balance" | "recomendaciones",
  clienteNombre: string,
  options?: { diagnosticoId?: string; token?: string }
): Promise<void> {
  if (tipo === "balance") return generarBalancePDF(clienteNombre, options);
  return generarDiagnosticoPDF(clienteNombre, options);
}
