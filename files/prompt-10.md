# PROMPT 10 — PDF Client-Side + Pantalla "Tu Aria Está Lista"
# Sprint 3 | Tiempo estimado: 1 día
# PREREQUISITO: Prompts 1-9 completados

## Generación de PDF (Client-Side para Prototipo)

Instalar: pnpm add html2canvas jspdf

Crear /lib/pdf-generator.ts:

```typescript
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function generarPDF(
  tipo: 'patrimonio' | 'balance' | 'recomendaciones',
  clienteNombre: string
): Promise<void> {
  // 1. Buscar el contenedor del tab activo
  const contenedor = document.getElementById(`tab-content-${tipo}`);
  if (!contenedor) return;
  
  // 2. Crear wrapper temporal con estilos de impresión
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed; top:-9999px; left:-9999px; width:800px; padding:40px; background:#F5F2EB; color:#0A0E12;';
  
  // Header
  const header = document.createElement('div');
  header.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid #314566;">
      <div>
        <span style="font-family:Poppins; font-size:20px; font-weight:700; color:#0A0E12;">Actinver</span>
        <span style="font-family:Poppins; font-size:20px; color:#E6C78A;">·</span>
        <span style="font-family:Poppins; font-size:12px; color:#E6C78A; letter-spacing:4px; margin-left:8px;">ArIA</span>
      </div>
      <div style="text-align:right; font-family:Open Sans; font-size:12px; color:#5A6A85;">
        <div>${clienteNombre}</div>
        <div>${new Date().toLocaleDateString('es-MX', { year:'numeric', month:'long', day:'numeric' })}</div>
      </div>
    </div>
  `;
  
  // Clonar contenido del tab
  const contenido = contenedor.cloneNode(true) as HTMLElement;
  // Ajustar estilos para impresión (fondo claro)
  contenido.querySelectorAll('*').forEach(el => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style) {
      // Convertir fondos oscuros a claros
      const bg = getComputedStyle(htmlEl).backgroundColor;
      if (bg.includes('26, 36, 51') || bg.includes('10, 14, 18')) {
        htmlEl.style.backgroundColor = '#FFFFFF';
        htmlEl.style.color = '#0A0E12';
      }
    }
  });
  
  // Footer / Disclaimer
  const footer = document.createElement('div');
  footer.innerHTML = `
    <div style="margin-top:32px; padding-top:16px; border-top:1px solid #CCCCCC; font-family:Open Sans; font-size:10px; color:#999999; text-align:center;">
      Este documento es informativo y no constituye una recomendación, consejo o sugerencia para la toma de decisiones de inversión. ArIA by Actinver.
    </div>
  `;
  
  wrapper.appendChild(header);
  wrapper.appendChild(contenido);
  wrapper.appendChild(footer);
  document.body.appendChild(wrapper);
  
  // 3. Capturar como imagen
  const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true });
  
  // 4. Crear PDF
  const pdf = new jsPDF('p', 'mm', 'letter');
  const imgWidth = 216; // carta en mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  // Si es más alto que una página, dividir en múltiples páginas
  const pageHeight = 279; // carta height mm
  let position = 0;
  let heightLeft = imgHeight;
  
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;
  
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  
  // 5. Descargar
  const tipos = { patrimonio: 'Patrimonio_Financiero', balance: 'Balance_General', recomendaciones: 'Plan_de_Accion' };
  pdf.save(`ArIA_${tipos[tipo]}_${clienteNombre.replace(/\s/g, '_')}.pdf`);
  
  // Limpiar
  document.body.removeChild(wrapper);
}
```

NOTA: Esta es una solución TEMPORAL para el prototipo. En el MVP (Sprint 20) se reemplaza por WeasyPrint en backend con templates Jinja2 mucho más profesionales.

Agregar id="tab-content-{tipo}" al contenedor de cada tab en resultados/page.tsx para que el generador lo encuentre.

Conectar el botón "Descargar PDF" en la vista de resultados:
```typescript
<Button onClick={() => generarPDF(activeTab, perfil.nombre)}>
  Descargar PDF
</Button>
```

## Pantalla de Éxito — /diagnosticos/[id]/completado/page.tsx

Instalar: pnpm add canvas-confetti

```typescript
'use client';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CompletadoPage() {
  useEffect(() => {
    // Confetti con colores Actinver
    const duration = 3000;
    const end = Date.now() + duration;
    
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#E6C78A', '#FFFFFF', '#314566'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#E6C78A', '#FFFFFF', '#314566'],
      });
      
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-radial from-azul-grandeza to-azul-acomp flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-8">
        {/* Logo */}
        <div className="animate-scale-in">
          <span className="font-poppins font-bold text-2xl text-white">Actinver</span>
          <span className="font-poppins text-2xl text-sunset">·</span>
        </div>
        
        {/* Subtítulo ArIA */}
        <div className="animate-fade-in-delay-300">
          <span className="font-poppins font-light text-sm text-sunset tracking-[4px]">ArIA</span>
        </div>
        
        {/* Título */}
        <h1 className="font-poppins font-bold text-4xl text-white animate-fade-in-delay-500">
          Tu aria está lista
        </h1>
        
        {/* Subtítulo */}
        <p className="font-open-sans text-base text-info animate-fade-in-delay-800">
          Construye tu grandeza. Actinver te acompaña.
        </p>
        
        {/* Botones */}
        <div className="space-y-3 animate-fade-in-delay-1000">
          <Link href="/diagnosticos/demo/resultados" className="block">
            <Button variant="primary" className="w-full">Ver resultados completos</Button>
          </Link>
          <Button variant="outline" className="w-full" onClick={() => generarPDF('patrimonio', 'Juan Pérez')}>
            Descargar PDF
          </Button>
          <Link href="/diagnosticos/demo/simulador" className="block">
            <Button variant="ghost" className="w-full text-sunset border-sunset">
              Simular escenarios
            </Button>
          </Link>
          <Link href="/diagnosticos/demo/wrapped" className="block">
            <Button variant="ghost" className="w-full text-sunset">
              Mi Financial Wrapped 🎵
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

Agregar las animaciones CSS en globals.css:
```css
.animate-scale-in { animation: scaleIn 0.5s ease-out forwards; }
.animate-fade-in-delay-300 { animation: fadeIn 0.5s ease-out 0.3s forwards; opacity: 0; }
.animate-fade-in-delay-500 { animation: fadeIn 0.5s ease-out 0.5s forwards; opacity: 0; }
.animate-fade-in-delay-800 { animation: fadeIn 0.5s ease-out 0.8s forwards; opacity: 0; }
.animate-fade-in-delay-1000 { animation: fadeIn 0.5s ease-out 1s forwards; opacity: 0; }
@keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
```

ACTUALIZAR la navegación: Paso 6 "Finalizar" → redirect a /diagnosticos/demo/completado.
