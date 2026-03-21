# PROMPT 4 — Dashboard Mock + Navegación Completa de la App
# Sprint 1 | Tiempo estimado: 0.5 días
# PREREQUISITO: Prompts 1-3 completados

Crea el dashboard del asesor y asegura que la navegación funciona end-to-end.

## /app/(dashboard)/layout.tsx — Layout del Dashboard

Header sticky:
- Height 64px. Fondo azul-acomp (#1A2433). Border-bottom 1px rgba(90,106,133,0.2).
- Izquierda: texto 'Actinver' en Poppins Bold 20px blanco + carácter '·' en sunset (#E6C78A) + espacio 8px + texto 'ArIA' en Poppins Light 12px sunset con letter-spacing 4px.
- Derecha: "Asesor: María González" en Open Sans Regular 14px blanco + separador '|' + botón 'Cerrar sesión' (variant ghost, size sm). Click cerrar sesión → limpiar sessionStorage → redirect /login.
- Responsive: en tablet (<1024px), ocultar nombre del asesor, solo mostrar icono User + 'Salir'.

## /app/(dashboard)/dashboard/page.tsx — Lista de Clientes

Contenido:
- Padding 32px. Max-width 1200px centrado.
- Header flex justify-between:
  - Izquierda: "Mis clientes" en Poppins Bold 28px blanco.
  - Derecha: Botón "Nuevo Cliente" variant accent (sunset). Icono UserPlus (Lucide) antes del texto.
  - Click "Nuevo Cliente" → abre Modal con Input "Nombre del cliente" + botón "Crear y comenzar" → agrega al array local + navega a /diagnosticos/demo/paso/1.

Lista de 3 clientes mock como array hardcodeado:
```typescript
const clientesMock = [
  { id: 'demo', nombre: 'Juan Pérez', ultimoDiagnostico: '15/03/2026', estado: 'completo' },
  { id: 'demo2', nombre: 'María López', ultimoDiagnostico: '10/03/2026', estado: 'borrador', pasoActual: 3 },
  { id: 'demo3', nombre: 'Carlos Ruiz', ultimoDiagnostico: null, estado: 'nuevo' },
];
```

Cada cliente se renderiza como <Card>:
- Hover: borde sunset 1px (transition 200ms). Cursor pointer.
- Layout dentro de la card:
  - Nombre: Poppins Bold 16px blanco.
  - Fecha: Open Sans Regular 12px info (#5A6A85). Si null: "Sin diagnósticos".
  - Badge de estado:
    - 'completo': <Badge variant="mejor">Completo</Badge> (verde)
    - 'borrador': <Badge variant="suficiente">Borrador - Paso {pasoActual}</Badge> (azul)
    - 'nuevo': <Badge>Nuevo</Badge> (gris default)
  - Botón "Abrir →" (variant ghost, size sm) alineado a la derecha.
- Click en toda la card O en el botón → navegar a /diagnosticos/demo/paso/1
  (por ahora TODOS los clientes abren el mismo diagnóstico con datos de Juan Pérez prellenados).

Grid de cards:
- Desktop (≥1024px): grid-cols-3 gap-6
- Tablet (≥768px): grid-cols-2 gap-4
- Mobile (<768px): grid-cols-1 gap-4

Empty state (si no hay clientes, no aplica al mock pero preparar el componente):
- Centrado vertical. Icono Users (Lucide) 64px en info/30.
- "Crea tu primer cliente para comenzar" Poppins Regular 16px info.
- Botón "Nuevo Cliente" accent centrado debajo.

## Navegación End-to-End (VERIFICAR QUE TODO FUNCIONA):

Flujo 1: Primera visita
  / → redirect a /login (no hay sesión)
  /login → llenar cualquier email/pass → click Entrar → redirect a /dashboard

Flujo 2: Diagnóstico
  /dashboard → click "Juan Pérez" → /diagnosticos/demo/paso/1
  /paso/1 → llenar → Siguiente → /paso/2
  /paso/2 → llenar → Siguiente → /paso/3
  ... hasta /paso/6 → Finalizar → /diagnosticos/demo/completado (página vacía por ahora, se crea en Prompt 10)

Flujo 3: Navegación lateral
  En cualquier paso → click en paso completado del stepper → navega a ese paso sin perder datos
  En cualquier paso → logo "Actinver·ArIA" en header → ¿debería navegar a /dashboard? Sí.

Flujo 4: Sesión
  Después de login, guardar flag 'isAuthenticated' en sessionStorage.
  Si accedo a /dashboard sin flag → redirect a /login.
  Click "Cerrar sesión" → borrar flag + borrar datos de diagnostico-store → redirect /login.

VERIFICAR: Navegar por TODOS los flujos. Si algo no conecta, arreglarlo ahora.
