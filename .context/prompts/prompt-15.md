# PROMPT 15 - Financial Wrapped: 7 Tarjetas PNG + Carousel + ZIP
# Sprint 5B | 2 dias

Instalar: pnpm add html2canvas jszip file-saver

REGLA ABSOLUTA: NINGUNA tarjeta muestra montos en pesos. Solo %, badges, conteos.

## /lib/wrapped-generator.ts
7 tarjetas como divs HTML renderizados a 1080x1920px (9:16 Instagram Stories).
Fondo: gradiente lineal azul-grandeza a azul-acomp. Tipografia Poppins. Acentos sunset.
Logo ArIA by Actinver en bottom de cada tarjeta.

Tarjeta 1 INTRO: Tu diagnostico financiero + nombre + fecha
Tarjeta 2 NIVEL: badge grande nivel riqueza (SIN ratio ni montos)
Tarjeta 3 RETIRO: circulo progress + grado_avance % en 72px Poppins Bold sunset
Tarjeta 4 RESERVA: {meses} meses en 64px + circulos visuales
Tarjeta 5 AHORRO: {pct}% de tus ingresos + comparacion vs 10%
Tarjeta 6 OBJETIVOS (si Paso 5): {count} objetivos + nombres sin montos + viables
Tarjeta 7 CTA: Haz tu diagnostico + ArIA by Actinver

Renderizar: div oculto -> html2canvas -> canvas.toBlob() -> PNG.

## /diagnosticos/[id]/wrapped/page.tsx
Titulo: Tu Financial Wrapped. Subtitulo: Comparte tu progreso. Sin montos, solo logros.
Carousel: array de img con flechas + dots + swipe touch. Aspect 9:16, max-h 70vh.
Toggle por tarjeta: switch en esquina. Inactivo=greyscale+opacity 0.4.
Boton Descargar para Stories (accent) -> JSZip con PNGs activas -> saveAs ArIA_Wrapped_{nombre}.zip
Loading: skeleton 9:16 con shimmer mientras genera.
Agregar boton en /completado: Mi Financial Wrapped (outline sunset)
