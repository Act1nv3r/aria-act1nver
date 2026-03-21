export const PARAMS = {
  TASA_REAL_ANUAL: 0.01,
  COSTO_SEGURO_POR_MILLON: 7000,
  CAP_RATE: 0.05,
  EDAD_DEFUNCION_DEFAULT: 90,
  BENCHMARK_RESERVA_MESES: 3,
} as const;

export const BENCHMARK_RIQUEZA = [
  [25, 0, 0.1, 0.25, 0.4, 0.6],
  [30, 0.5, 0.75, 1, 1.5, 2],
  [35, 1, 2, 3, 4, 6],
  [40, 2, 4, 6, 8, 10],
  [45, 3, 6, 8, 10, 12],
  [50, 4, 7, 9, 12, 15],
  [55, 5, 8, 11, 14, 18],
  [60, 6, 9, 13, 16, 20],
] as const;

export const NIVELES = ["suficiente", "mejor", "bien", "genial", "on-fire"] as const;
