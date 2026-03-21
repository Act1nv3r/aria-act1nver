# PROMPT 1 — Setup Next.js + Design System + 14 Componentes UI + Login Mock
# Sprint 0 | Tiempo estimado: 1 día

Crea un proyecto Next.js 15 con App Router y TypeScript strict. Usa pnpm como package manager.

## CONFIGURACIÓN TAILWIND (tailwind.config.ts)

Extiende la paleta con estos colores custom del brandbook Actinver:

```
azul-grandeza: '#0A0E12'     → fondos principales, dark mode default
azul-acomp: '#1A2433'        → cards, paneles, tooltips, modals
azul-actinver: '#314566'     → botones primarios, links, data viz base
arena: '#F5F2EB'             → fondos light mode
sunset: '#E6C78A'            → highlights, badges, acentos, progreso
blanco: '#FFFFFF'            → texto principal sobre fondos oscuros
exito: '#317A70'             → estados positivos, pasos completados
alerta: '#B58657'            → warnings
error-brand: '#8B3A3A'       → errores, déficit
info: '#5A6A85'              → texto secundario, estados inactivos
```

Fuentes (importar desde Google Fonts en layout.tsx):
- Poppins (400, 500, 600, 700, 800) → headings, botones, labels
- Open Sans (300, 400, 600, 700) → body text, tooltips, legales

Spacing: escala de 8px (8, 16, 24, 32, 48, 64).
Border radius: 8px para cards, 4px para inputs, 12px para modals.
Dark mode como default (fondo azul-grandeza).

## COMPONENTES UI BASE en /components/ui/

Crear TODOS estos componentes:

### 1. button.tsx
Props: variant ('primary' | 'secondary' | 'outline' | 'ghost' | 'accent'), size ('sm' | 'md' | 'lg'), loading (boolean), disabled, children, onClick.
- primary: bg azul-actinver, text blanco, hover opacity 90%.
- accent: bg sunset, text azul-grandeza, hover glow sutil.
- outline: border 1px blanco, text blanco, hover bg blanco/10.
- ghost: sin fondo, text blanco, hover bg blanco/5.
- Loading: spinner SVG 16px reemplaza texto.
- Tipografía: Poppins Bold 14px. Padding: 12px 24px. Transition 200ms.

### 2. card.tsx
Fondo azul-acomp. Border-radius 8px. Padding 24px.
Sombra sutil: 0 2px 8px rgba(0,0,0,0.2).
Props: children, className (para override).

### 3. input.tsx
Label arriba en Poppins Regular 12px, color info.
Input: fondo transparente, border 1px blanco/20, border-radius 4px, padding 12px 16px.
Focus: border sunset. Texto: Open Sans Regular 16px blanco.
Error state: border error-brand, mensaje debajo en Open Sans 12px error-brand.
Props: label, error, placeholder, type, name, register (React Hook Form).

### 4. currency-input.tsx
Extiende input.tsx. Prefijo '$' fijo a la izquierda.
Al escribir: acepta solo números. Al blur: formatea con Intl.NumberFormat('es-MX', {style:'decimal'}).
Al focus: muestra número limpio para editar. Placeholder: '$0'.
En mobile: inputMode='numeric' para teclado numérico.
Props: mismas que input + value, onChange (manejar formato/deformato).

### 5. select.tsx
Usa @radix-ui/react-select. Trigger estilo igual que input.
Dropdown: fondo azul-acomp, items con hover bg azul-actinver/30.
Icono chevron-down (Lucide) a la derecha.
Props: label, options: {value, label}[], error, placeholder.

### 6. toggle.tsx
Switch estilo iOS. Track: inactivo=info/30, activo=sunset. Thumb: blanco.
Width 44px, height 24px. Transición 200ms.
Label a la izquierda en Poppins Regular 14px.
Props: label, checked, onChange.

### 7. slider.tsx
Usa @radix-ui/react-slider. Track: info/30. Fill: sunset.
Thumb: 20px círculo sunset con borde blanco 2px. Hover: scale 1.1.
Label izquierda: nombre variable. Label derecha: valor actual formateado.
Props: label, min, max, step, value, onChange, formatValue (función).

### 8. info-box.tsx
Wrapper que agrega tooltip contextual a cualquier término.
Desktop: hover 300ms → popover con @floating-ui/react.
Mobile: detectar touch → mostrar icono ⓘ (12px, azul-actinver) → click abre bottom sheet.
Tooltip: fondo azul-acomp, padding 16px, border-radius 8px, sombra, Open Sans 14px blanco, max 280px width.
Flecha 8px apuntando al trigger. Max 40 palabras de contenido.
Click en desktop "ancla" el tooltip (borde sunset 1px). Segundo click o Escape cierra.
Props: content (string), children (ReactNode).

### 9. accordion.tsx
Usa @radix-ui/react-accordion. Header: Poppins Bold 14px, icono chevron animado 200ms.
Abierto: fondo sunset/10, borde izquierdo 3px sunset. Cerrado: fondo transparente.
Total parcial alineado a la derecha del header en Poppins Regular 12px sunset.
Props: title, total (string formateado), defaultOpen, children.

### 10. badge.tsx
Chip redondeado con texto + color de fondo. Poppins Bold 12px.
Variantes: 'suficiente'(azul-actinver/20), 'mejor'(exito/20), 'bien'(sunset/20), 'genial'(#7A6391/20), 'on-fire'(gradient).
Props: variant, children.

### 11. progress-bar.tsx
Track: info/20. Fill: sunset con animation width 1.5s ease-out.
Porcentaje centrado encima: Poppins Bold.
Props: value (0-100), size ('sm'|'md'|'lg'), showLabel.

### 12. skeleton.tsx
Fondo azul-acomp con shimmer animation (gradiente sliding).
Props: width, height, borderRadius.

### 13. modal.tsx
Usa @radix-ui/react-dialog. Overlay: negro/50. Card centrada: azul-acomp, border-radius 12px.
Close button (X) esquina superior derecha. Título: Poppins Bold 20px.
Props: open, onClose, title, children.

### 14. toast.tsx
Notificación flotante bottom-right. Auto-dismiss configurable.
Variantes: success (exito), error (error-brand), info (azul-actinver).
Animación: slide-in desde derecha, fade-out al dismiss.

## PANTALLA DE LOGIN en /app/(auth)/login/page.tsx

Fondo: gradiente radial de azul-grandeza (centro) a azul-acomp (bordes).
Centrado vertical y horizontal.
Card (max-width 400px): fondo azul-acomp, padding 40px.
Logo: texto 'Actinver' en Poppins Bold 28px blanco, con un punto '·' en sunset (simula punto diacrítico).
Debajo del logo: 'ArIA' en Poppins Light 14px sunset, letter-spacing 4px.
Campos: Email + Password con los componentes input.tsx.
Botón 'Entrar' primary full-width.
POR AHORA: login mock — cualquier email/pass redirige a /dashboard. No implementar auth real.

## DEPENDENCIAS

```bash
pnpm add @radix-ui/react-select @radix-ui/react-slider @radix-ui/react-dialog @radix-ui/react-accordion @radix-ui/react-switch @floating-ui/react lucide-react react-hook-form @hookform/resolvers zod zustand @tanstack/react-query recharts
```
