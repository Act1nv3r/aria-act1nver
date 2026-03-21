# PROMPT 6 — 12 Gráficas Interactivas con Recharts
# Sprint 2 | Tiempo estimado: 2 días
# PREREQUISITO: Prompt 5 completado (motores generan datos para las gráficas)

Crea los 12 componentes de visualización en /components/outputs/.
TODAS las gráficas usan la paleta del brandbook Actinver.
TODAS tienen animación de entrada y tooltips on hover.
Los tooltips tienen estilo InfoBox: fondo azul-acomp (#1A2433), texto blanco, Open Sans 14px, border-radius 8px, sombra.

## 1. /components/outputs/donut-chart.tsx

Recharts PieChart con innerRadius={60} outerRadius={100}.
3 segmentos con estos colores exactos:
- Obligaciones: #314566 (azul-actinver)
- Gastos básicos: #5A6A85 (info)
- Ahorro: #E6C78A (sunset)

Cada segmento tiene label AFUERA con el nombre + % en Poppins Bold 12px.
En el CENTRO del donut: "Total" en Open Sans 12px info + monto formateado MXN en Poppins Bold 16px blanco.
Animación: los segmentos crecen desde 0 en 1 segundo (isAnimationActive=true, animationDuration=1000).
Responsive: width="100%", height={250}.

Props:
```typescript
interface DonutChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  total: number;
}
```

## 2. /components/outputs/reserva-semaforo.tsx

Card con layout horizontal: círculo indicador a la izquierda + texto a la derecha.
Círculo: 48px diámetro. Verde (#317A70) si meses >= 3. Rojo (#8B3A3A) si < 3. Con icono Check o AlertTriangle (Lucide) centrado en blanco.
Texto: "{meses} meses cubiertos de {benchmark} recomendados" en Open Sans Regular 14px blanco.
Subtexto condicional:
- Si cubierto: "Tu colchón financiero está listo ✓" en Open Sans 12px exito.
- Si insuficiente: "Te faltan ${faltante} para completar tu reserva" en Open Sans 12px sunset.

Props: meses: number, benchmark: number, faltante?: number.

## 3. /components/outputs/patrimonio-neto-card.tsx

Número grande arriba: formato MXN del patrimonio neto en Poppins Bold 32px sunset.
Debajo: barra horizontal apilada (height 16px, border-radius 8px):
- Segmento Financiero: #314566 (azul-actinver)
- Segmento No Financiero: #E6C78A (sunset)
- Segmento Pasivos: #8B3A3A (error-brand) — se resta visualmente
Labels debajo de la barra: "Financiero {%}" + "No financiero {%}" + "Pasivos {%}" en Open Sans 12px info.

Props: neto: number, financiero: number, noFinanciero: number, pasivos: number.

## 4. /components/outputs/nivel-riqueza-badge.tsx

<Badge> grande con el nivel de riqueza (componente badge.tsx ya creado).
Debajo: "Tu patrimonio cubre {ratio}x tus gastos anuales" en Open Sans 14px blanco.
Debajo: "Para tu edad ({edad} años), el benchmark es {benchmark}x" en Open Sans 12px info.
Animación: fade-in + scale de 0.8 a 1.0 en 500ms.

Props: nivel: string, ratio: number, benchmarkEdad: number, edad: number.

## 5. /components/outputs/curva-desacumulacion.tsx — ★★★ HERO VISUAL ★★★

ESTA GRÁFICA VENDE EL PROYECTO. Debe verse ESPECTACULAR.

Recharts AreaChart con los datos de Motor C.
- Eje X: edad (desde edad_retiro hasta edad_defuncion). Label "Edad" en Open Sans 12px info.
- Eje Y: saldo en MXN. Label formateado (ej: "$2.5M", "$1M", "$0"). Open Sans 12px info.
- Área (fill): linearGradient vertical de azul-actinver (#314566) opacity 0.6 (arriba) a transparente (abajo).
  ```jsx
  <defs>
    <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#314566" stopOpacity={0.6} />
      <stop offset="95%" stopColor="#314566" stopOpacity={0} />
    </linearGradient>
  </defs>
  ```
- Línea: 2.5px sunset (#E6C78A). Smooth (type="monotone").
- Dots: ocultos por default. Visibles en hover: 6px sunset con borde blanco 2px.
- Tooltip on hover: card con "A los {edad} años tendrás {formatMXN(saldo)} disponibles" + "Quedan {meses} meses de retiro".
  Tooltip estilo: bg azul-acomp, text blanco, padding 12px, border-radius 8px, shadow.
- Grid: horizontal sutil (stroke info/10). Sin grid vertical.
- CartesianGrid: strokeDasharray="3 3" stroke="rgba(90,106,133,0.1)"
- Responsive: width="100%", height={320} en desktop, height={240} en mobile.
- Animación: draw-line de izquierda a derecha (animationDuration=2000, animationBegin=0).

Props:
```typescript
interface CurvaDesacumulacionProps {
  curva: Array<{ edad: number; saldo: number }>;
  edadRetiro: number;
  edadDefuncion: number;
}
```

## 6. /components/outputs/grado-avance-bar.tsx

Instalar: pnpm add react-countup

Layout vertical centrado:
- Número grande: Poppins Bold 48px. Color sunset si < 100%, exito si >= 100%.
  Animación: react-countup de 0 al valor en 1.5 segundos. Suffix "%" con decimales (ej: 77.1%).
- Texto debajo: "de tu retiro ideal cubierto" en Open Sans Regular 16px info.
- ProgressBar debajo: height 12px, width 100%. Track: info/20. Fill: sunset (o exito si >= 100%).
  Animación del fill: width de 0% al valor en 1.5s ease-out.

Props: porcentaje: number (decimal 0-1, se muestra como %).

## 7. /components/outputs/deficit-card.tsx

Card condicional según el signo del déficit:

Si deficit > 0 (FALTA dinero):
- Borde izquierdo 4px error-brand (#8B3A3A).
- Icono AlertTriangle (Lucide) 24px en error-brand, margen derecho 12px.
- Texto: "Te faltan {formatMXN(deficit)}/mes para tu retiro ideal" en Open Sans Regular 14px blanco.
- Botón: "Simula cómo lograrlo →" (variant outline, size sm, color sunset) → navegar a /simulador.

Si deficit <= 0 (SOBRA dinero):
- Borde izquierdo 4px exito (#317A70).
- Icono CheckCircle (Lucide) 24px en exito.
- Texto: "Tienes {formatMXN(Math.abs(deficit))}/mes de excedente" en Open Sans Regular 14px blanco.
- Subtexto: "Tu retiro está más que cubierto" en Open Sans 12px exito.

Props: deficit: number (positivo = falta, negativo = sobra).

## 8. /components/outputs/fuentes-ingreso.tsx

Recharts horizontal BarChart (layout="vertical") apilado.
3 segmentos con colores categóricos del brandbook:
- Rentas: #317A70 (exito)
- Pensión (Ley73+Afore): #E6C78A (sunset)
- Patrimonio (mensualidad posible): #314566 (azul-actinver)

Labels con monto formateado MXN dentro de cada segmento si cabe (width > 60px), afuera si no.
Leyenda abajo: 3 items con color dot + nombre + monto. Open Sans 12px.
Height: 60px (una sola barra horizontal). Width: 100%.

Props: rentas: number, pension: number, patrimonio: number.

## 9. /components/outputs/indice-solvencia.tsx

Gauge semicircular usando Recharts PieChart:
- startAngle={180} endAngle={0}
- 5 segmentos de color representando los rangos:
  <0.1: #317A70 (exito) — "Muy saludable"
  0.1-0.3: #317A70 opacity 70%  — "Recomendable"
  0.3-0.4: #E6C78A (sunset) — "Aceptable"
  0.4-0.5: #B58657 (alerta) — "Elevado"
  >0.5: #8B3A3A (error) — "Crítico"
- Needle/pointer al valor actual (implementar con un <line> o <path> SVG custom sobre el PieChart).
  Si needle es complejo, alternativa: resaltar el segmento activo con opacity 1 y los demás con 0.3.
- Valor numérico centrado debajo del gauge: Poppins Bold 24px blanco.
- Clasificación debajo del valor: Open Sans 14px (color del segmento activo).

Props: valor: number (0-1), clasificacion: string.

## 10. /components/outputs/regla72-table.tsx

Tabla simple con estilo del brandbook:
- Header row: fondo azul-actinver, texto blanco Poppins Bold 12px.
- Body rows: fondo azul-acomp, texto Open Sans Regular 14px blanco. Alternating rows con opacity sutil.
- 3 columnas: "Tasa anual", "Años para duplicar", "Tu patrimonio en X años".
- 3 filas:
  8% → 72/8 = 9 años → patrimonio * 2 formateado MXN
  12% → 72/12 = 6 años → patrimonio * 2
  14% → 72/14 = 5.14 años → patrimonio * 2
- Border-radius 8px en la tabla.

Props: patrimonio: number.

## 11. /components/outputs/tabla-viabilidad.tsx

Tabla de objetivos con semáforo de viabilidad:
- Columnas: "#", "Objetivo", "Monto", "Plazo", "Estado"
- Cada fila:
  - # (número secuencial 1-5)
  - Objetivo: nombre en Poppins Regular 14px
  - Monto: formateado MXN en Open Sans 14px
  - Plazo: "X años" Open Sans 14px
  - Estado: chip/badge:
    Viable: fondo exito/20, texto exito, icono Check 12px → "✓ Viable"
    Insuficiente: fondo error-brand/20, texto error-brand, icono X 12px → "✗ Insuficiente"

Props: objetivos: Array<{ nombre: string; monto: number; plazo: number; viable: boolean }>.

## 12. /components/outputs/legado-card.tsx

Card con:
- Icono Gift (Lucide) 32px en sunset, arriba.
- "Legado estimado" en Open Sans 12px info.
- Monto: Poppins Bold 28px sunset → formateado MXN.
- "a los {edadDefuncion} años" en Open Sans 14px info.
- Subtexto: "El patrimonio que podrías dejar a tus beneficiarios" Open Sans 12px info.

Props: monto: number, edadDefuncion: number.
