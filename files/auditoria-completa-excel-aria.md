# Auditoría Completa: Modelo Excel vs ArIA

Revisión de inputs, cálculos y outputs del prototipo Excel vs la herramienta ArIA.

---

## 1. Mapeo de Inputs

### Excel → ArIA (por paso)

| Excel (Entrevista Patrimonio + Balance) | ArIA Store | Paso |
|----------------------------------------|------------|------|
| Nombre o alias | `perfil.nombre` | 1 |
| Edad actual | `perfil.edad` | 1 |
| Género | `perfil.genero` | 1 |
| Ocupación actual | `perfil.ocupacion` | 1 |
| Dependientes económicos | `perfil.dependientes` | 1 |
| Capacidad de Ahorro | `flujoMensual.ahorro` | 2 |
| Propiedades en renta (ingreso) | `flujoMensual.rentas` | 2 |
| Otros ingresos | `flujoMensual.otros` | 2 |
| Gastos básicos | `flujoMensual.gastos_basicos` | 2 |
| Obligaciones mensuales | `flujoMensual.obligaciones` | 2 |
| Créditos | `flujoMensual.creditos` | 2 |
| Ahorros liquidez inmediata | `patrimonio.liquidez` | 3 |
| Saldo otras inversiones | `patrimonio.inversiones` | 3 |
| Dotales / Seguros acumulación | `patrimonio.dotales` | 3 |
| Saldo Afore | `patrimonio.afore` | 3 |
| Saldo PPR | `patrimonio.ppr` | 3 |
| Plan privado pensión | `patrimonio.plan_privado` | 3 |
| Seguros retiro | `patrimonio.seguros_retiro` | 3 |
| Ley 73 (mensualidad) | `patrimonio.ley_73` | 3 |
| Valor casa | `patrimonio.casa` | 3 |
| Inmuebles renta | `patrimonio.inmuebles_renta` | 3 |
| Tierra | `patrimonio.tierra` | 3 |
| Negocio | `patrimonio.negocio` | 3 |
| Herencia | `patrimonio.herencia` | 3 |
| Hipoteca | `patrimonio.hipoteca` | 3 |
| Saldo planes (compromisos) | `patrimonio.saldo_planes` | 3 |
| Compromisos futuros | `patrimonio.compromisos` | 3 |
| Edad retiro | `retiro.edad_retiro` | 4 |
| Mensualidad deseada | `retiro.mensualidad_deseada` | 4 |
| Edad defunción | `retiro.edad_defuncion` | 4 |
| Aportación inicial | `objetivos.aportacion_inicial` | 5 |
| Aportación mensual | `objetivos.aportacion_mensual` | 5 |
| Lista objetivos (nombre, monto, plazo) | `objetivos.lista` | 5 |
| Seguro de vida | `proteccion.seguro_vida` | 6 |
| Propiedades aseguradas | `proteccion.propiedades_aseguradas` | 6 |
| SGMM | `proteccion.sgmm` | 6 |

**Conclusión inputs**: ✅ Todos los inputs del Excel están cubiertos en ArIA.

---

## 2. Mapeo de Cálculos (Motores)

### Excel Output 1 → Motor A
| Cálculo Excel | Motor A | Fórmula |
|---------------|---------|---------|
| Ingresos Totales | `ingresos_totales` | ahorro + rentas + otros |
| Gastos Totales | `gastos_totales` | gastos_basicos + obligaciones + creditos |
| Distribución | `distribucion` | obligaciones_pct, gastos_pct, ahorro_pct |
| Meses Reserva CP | `meses_cubiertos` | liquidez / gastos_basicos |
| Benchmark Reserva | `benchmark_reserva` | 3 * gastos_basicos |
| Remanente | `remanente` | ahorro |

✅ **Alineado**

### Excel Output 2 → Motor A
| Cálculo Excel | ArIA |
|---------------|------|
| Benchmark Reserva CP = 3 | PARAMS.BENCHMARK_RESERVA_MESES |
| Resultado (Excedido/Insuficiente) | resultado_reserva |
| Meses para cubrir CP | ReservaSemaforo |

✅ **Alineado**

### Excel Output 3 → Motor E + Motor A
| Cálculo Excel | ArIA |
|---------------|------|
| Saldo Acumulación | motorE.financiero |
| Meses Reserva Acumulación | financiero / gastos_basicos |
| Remanente | motorA.remanente |

✅ **Alineado** (SaldoAcumulacionCard)

### Excel Output 4 / 5 / 6 → Motor C
| Cálculo Excel | Motor C |
|---------------|---------|
| Mensualidad Afore/Voluntaria | mensualidad_esquemas (anualidad de saldo AFORE+PPR) |
| Pension Estimada (Ley 73) | ley_73 |
| Pension Total | ley_73 + rentas + mensualidad_esquemas |
| Mensualidad Actual | pension_total_mensual + mensualidad_posible |
| Grado de Avance | grado_avance |
| Deficit/Superavit | deficit_mensual |
| Fuentes ingreso (Rentas, Propiedades, Esquemas) | fuentes_ingreso |

✅ **Alineado** (corregido: saldo_esquemas ahora se convierte en mensualidad y se suma a pensión)

### Excel Output 7 → Motor F
| Cálculo Excel | Motor F |
|---------------|---------|
| Seguro vida | recomendaciones |
| Propiedades aseguradas | recomendaciones |
| SGMM | recomendaciones |

✅ **Alineado**

### Patrimonio Neto / Balance → Motor E
| Cálculo Excel | Motor E |
|---------------|---------|
| Patrimonio Financiero | financiero |
| Activos No Financieros | noFinanciero |
| Obligaciones | pasivos_total |
| Patrimonio Neto | patrimonio_neto |
| Índice Deuda/Activo | indice_solvencia |
| Potencial Apalancamiento | potencial_apalancamiento |

✅ **Alineado**

### Nivel Riqueza → Motor B
| Cálculo Excel | Motor B |
|---------------|---------|
| Ratio patrimonio/gastos | ratio |
| Nivel (Insuficiente...On fire) | nivel_riqueza |
| Benchmark por edad | benchmark_para_edad |

✅ **Alineado**

### Regla 72 / Valor Dinero Tiempo
| Cálculo Excel | ArIA |
|---------------|------|
| 72/8, 72/12, 72/14 | Regla72Table |
| Proyección exponencial | ValorDineroTiempoChart |

✅ **Alineado**

### Desacumulación / Objetivos
| Cálculo Excel | ArIA |
|---------------|------|
| Curva saldo por edad | CurvaDesacumulacion |
| Trayectoria con déficit | TrayectoriaRetiroChart |
| Viabilidad objetivos | TablaViabilidad |
| Legado | LegadoCard |

✅ **Alineado**

---

## 3. Consideración: Patrimonio Financiero en Motor C

**Excel**: "Patrimonio Financiero (Acumulación)" = 2,300,000 = liquidez + inversiones + dotales (excluye AFORE/PPR para proyección de crecimiento).

**ArIA**: `patrimonioFin = liquidez + inversiones + dotales` (mismo criterio).

**Motor C** proyecta el saldo desde hoy hasta edad_retiro usando solo este patrimonio. Los esquemas (AFORE, PPR) se consideran en `saldo_esquemas` para el cálculo de mensualidad. ✅ **Alineado**

---

## 4. Consideración: Ingresos en Motor A

**Excel**: "Ingresos Totales" = Capacidad Ahorro + Propiedades Renta + Otros = 110,000.

**ArIA**: `ingresos_totales = ahorro + rentas + otros`.

En el Excel, "Capacidad de Ahorro" se trata como componente de ingreso (ahorro disponible). ✅ **Alineado**

---

## 5. Outputs Visualizados en Pantalla

| Componente | Output Excel | Estado |
|------------|--------------|--------|
| DonutChart | Output 1 | ✅ |
| ReservaSemaforo | Output 2 | ✅ |
| SaldoAcumulacionCard | Output 3 | ✅ |
| GradoAvanceBar | Output 4/6 | ✅ |
| FuentesIngreso | Output 5 | ✅ |
| DeficitCard | Output 6 | ✅ |
| Protección | Output 7 | ✅ |
| PatrimonioNetoCard | Balance | ✅ |
| NivelRiquezaBadge | Nivel Riqueza | ✅ |
| IndiceSolvencia | Índice Solvencia | ✅ |
| PotencialApalancamientoCard | Potencial | ✅ |
| EsquemasPensionChart | Esquemas | ✅ |
| Regla72Table | Regla 72 | ✅ |
| ValorDineroTiempoChart | Valor Dinero | ✅ |
| CurvaDesacumulacion | Desacumulación | ✅ |
| TrayectoriaRetiroChart | Trayectoria | ✅ |
| TablaViabilidad | Objetivos | ✅ |
| LegadoCard | Legado | ✅ |

---

## 6. Diferencias Menores / Notas

1. **Tasa real**: Excel 0.01 (1%), ArIA PARAMS.TASA_REAL_ANUAL = 0.01. ✅
2. **Benchmark reserva**: Excel 3 meses, ArIA 3 meses. ✅
3. **Costo seguro por millón**: Excel 7000, ArIA PARAMS.COSTO_SEGURO_POR_MILLON = 7000. ✅
4. **Ley 73**: Solo para ≥46 años en ambos. ✅

---

## 7. Corrección aplicada durante la auditoría

**Gap detectado**: El Motor C recibía `saldo_esquemas` (AFORE + PPR + plan privado + seguros retiro) pero **no lo utilizaba** en el cálculo de la pensión. En el Excel, la "Mensualidad Afore" y "Mensualidad Voluntaria" se calculan como anualidad del saldo y se suman a la pensión total.

**Corrección**: Se añadió en `motor-c.ts`:
- Proyección del saldo de esquemas hasta la edad de retiro
- Cálculo de `mensualidad_esquemas` (anualidad PMT sobre ese saldo)
- Suma a `pension_total_mensual` y a `fuentes_ingreso.pension`

---

## 8. Conclusión

| Categoría | Estado |
|-----------|--------|
| Inputs | ✅ 100% cubiertos |
| Cálculos (motores) | ✅ Alineados con Excel |
| Outputs visualizados | ✅ 18/18 componentes |
| Modelo completo | ✅ **Desarrollado y visualizado correctamente** |

El modelo del Excel está bien implementado en ArIA y todos los resultados se muestran en la pantalla de resultados.
