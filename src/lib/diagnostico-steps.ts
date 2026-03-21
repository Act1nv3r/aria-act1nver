/** Wizard steps (single source for stepper + dashboard). */
export const DIAGNOSTICO_STEPS = [
  { id: 1, label: "Perfil" },
  { id: 2, label: "Flujo" },
  { id: 3, label: "Patrimonio" },
  { id: 4, label: "Retiro" },
  { id: 5, label: "Objetivos" },
  { id: 6, label: "Protección" },
] as const;

export const DIAGNOSTICO_PASO_LABELS: Record<number, string> = Object.fromEntries(
  DIAGNOSTICO_STEPS.map((s) => [s.id, s.label])
) as Record<number, string>;

export function labelForPaso(paso: number): string {
  const n = Math.min(6, Math.max(1, paso));
  return DIAGNOSTICO_PASO_LABELS[n] ?? `Paso ${n}`;
}
