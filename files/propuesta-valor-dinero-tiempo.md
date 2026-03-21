# Propuesta: Gráfica Valor Dinero en el Tiempo (Regla 72)

## Objetivo

Implementar la visualización completa "I) VALOR DINERO EN EL TIEMPO (Liquidez Invertida + Portafolio de Inversión)" con:
- Gráfica de crecimiento exponencial (3 líneas: 8%, 12%, 14%)
- Inputs de monto a invertir y reserva corto plazo
- Leyenda con tiempos de duplicación
- Disclaimer de rendimientos

---

## 1. Datos necesarios

| Campo | Origen | Descripción |
|-------|--------|-------------|
| **Monto a invertir** | `patrimonio.liquidez + patrimonio.inversiones` | Patrimonio financiero líquido/invertible (excluye AFORE, PPR, etc.) |
| **Reserva corto plazo** | `patrimonio.liquidez` | Ahorros disponibles de forma inmediata |
| **Edad inicio** | `perfil.edad` | Edad actual del titular |
| **Edad fin** | `retiro?.edad_defuncion ?? 90` | Hasta qué edad proyectar |

**Alternativa**: Si se prefiere usar el patrimonio financiero total como base de inversión:
- `montoInversion = patrimonio.liquidez + patrimonio.inversiones + patrimonio.dotales`

---

## 2. Estructura del componente

### Nuevo archivo: `src/components/outputs/valor-dinero-tiempo-chart.tsx`

```
ValorDineroTiempoChart
├── Título: "Valor Dinero en el Tiempo"
├── Subtitle: "REGLA 72: Tiempo en duplicar tu inversión (72/tasa)"
├── Inputs (readonly o editables)
│   ├── Monto a invertir (formato MXN)
│   └── Reserva corto plazo (formato MXN)
├── LineChart (Recharts)
│   ├── X-axis: años (edad actual → edad defunción, cada 5 años)
│   ├── 3 líneas: 8% (verde), 12% (dorado), 14% (azul oscuro)
│   └── Data labels en puntos clave (cada 5–10 años)
├── Leyenda
│   ├── 8%: "Duplica cada 9 años" (deuda mexicana)
│   ├── 12%: "Duplica cada 6 años" (portafolio balanceado)
│   └── 14%: "Duplica cada 5 años" (equity americano)
└── Disclaimer: "*Rendimientos pasados no garantizan rendimientos futuros"
```

---

## 3. Fórmula de proyección

Para cada tasa `r` y año `t` (desde 0 hasta `edadFin - edadInicio`):

```
valor[t] = montoInversion × (1 + r)^t
```

Donde:
- `r` = 0.08, 0.12, 0.14
- `t` = años transcurridos desde hoy

---

## 4. Props del componente

```typescript
interface ValorDineroTiempoChartProps {
  montoInversion: number;      // liquidez + inversiones
  reservaCortoPlazo: number;   // liquidez
  edadInicio: number;          // perfil.edad
  edadDefuncion: number;       // retiro.edad_defuncion ?? 90
}
```

---

## 5. Integración en OutputPanel

**Ubicación**: Junto a `Regla72Table`, dentro del bloque `{motorB && motorE && (...)}`.

**Opciones**:
- **A)** Reemplazar `Regla72Table` por `ValorDineroTiempoChart` (la gráfica incluye la info de la tabla).
- **B)** Mantener ambos: tabla arriba, gráfica abajo en la misma Card o en Cards separadas.

**Recomendación**: Opción B — tabla compacta para referencia rápida + gráfica para visualización.

```tsx
{motorB && motorE && (
  <FadeIn>
    {/* ... otras cards ... */}
    <Card>
      <Regla72Table patrimonio={motorE.patrimonio_neto} />
    </Card>
    <Card>
      <ValorDineroTiempoChart
        montoInversion={(patrimonio?.liquidez ?? 0) + (patrimonio?.inversiones ?? 0)}
        reservaCortoPlazo={patrimonio?.liquidez ?? 0}
        edadInicio={perfilActivo?.edad ?? 40}
        edadDefuncion={retiroActivo?.edad_defuncion ?? 90}
      />
    </Card>
  </FadeIn>
)}
```

---

## 6. Modo Pareja

En modo pareja, usar datos del tab activo (titular/pareja/hogar):
- `patrimonio` y `perfil` según `tabPareja`
- `retiro` según `tabPareja` (hogar usa `outHogar?.retiro`)

---

## 7. Colores (brandbook)

| Tasa | Color | Uso |
|------|-------|-----|
| 8% | `#317A70` | Verde (deuda mexicana) |
| 12% | `#E6C78A` | Dorado (balanceado) |
| 14% | `#314566` | Azul Actinver (equity) |

---

## 8. Consideraciones UX

- **Responsive**: El chart debe tener altura fija (ej. 280–320px) y `ResponsiveContainer` en ancho.
- **Tooltip**: Mostrar edad + valor formateado MXN al pasar el cursor.
- **Labels**: Mostrar valores en puntos cada 10–15 años para no saturar (o solo en hover).
- **Eje Y**: Formato escalado (ej. `$1.5M`, `$100M`) para números grandes.

---

## 9. Orden de implementación

1. Crear `ValorDineroTiempoChart` con datos mock.
2. Generar series de datos (8%, 12%, 14%) con la fórmula exponencial.
3. Integrar `LineChart` de Recharts con 3 `Line`.
4. Añadir inputs (readonly inicialmente).
5. Añadir leyenda y disclaimer.
6. Integrar en `OutputPanel` con datos reales.
7. Ajustar modo pareja si aplica.
8. (Opcional) Hacer inputs editables para simulación en vivo.

---

## 10. Dependencias

- **Recharts**: Ya usado en el proyecto (`LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `ResponsiveContainer`).
- Sin dependencias nuevas.
