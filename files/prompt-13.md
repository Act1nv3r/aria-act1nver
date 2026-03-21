# PROMPT 13 - Toggle Pareja + Layout Dual + Ownership
# Sprint 5A | 2 dias

## Activacion
Modal en dashboard al crear diagnostico: 2 cards (User+Individual | Users+Pareja).
Card seleccionada: borde sunset 2px. Set modo en store.

## Store: agregar campos pareja
pareja_perfil, pareja_flujoMensual, pareja_patrimonio, pareja_retiro, pareja_objetivos, pareja_proteccion.
ownership: Record<string, titular|pareja|compartido>
Defaults: casa=compartido, inmuebles_renta=titular, hipoteca=compartido.
Prellenar pareja demo: Ana Garcia, 48, independiente, ahorro 30K, inversiones 500K, afore 600K, negocio 300K.

## /components/diagnostico/pareja-layout.tsx
Desktop: grid 2 cols 50/50, separador vertical 1px info/20.
  Col izq: header Titular borde izq 3px azul-actinver + nombre.
  Col der: header Pareja borde izq 3px sunset + nombre.
  Debajo: Compartidos full-width bg azul-acomp/30 (si hay sharedSection).
Tablet: tabs Titular|Pareja|Compartidos.

## Ownership toggle en Paso 3
Por cada activo en No Financiero y Pasivos: 3 chips inline (Titular azul-actinver / Pareja sunset / Compartido exito).

## Modificar paso1-paso6
Si modo=individual: renderizar normal.
Si modo=pareja: envolver en ParejaLayout que renderiza formulario 2 veces (titular y pareja).
