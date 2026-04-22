import { calcularMotorA } from "./motors/motor-a";
import { calcularMotorB } from "./motors/motor-b";
import { calcularMotorC } from "./motors/motor-c";
import { calcularMotorE } from "./motors/motor-e";

export type RiesgoNivel = "Alto" | "Medio" | "Bajo" | "Muy Alto";

export interface PlanRow {
  aspecto: string;
  situacion: string;
  riesgo: RiesgoNivel;
  recomendacion: string;
}

export function buildPlanDeAccion({
  motorA,
  motorB,
  motorC,
  motorE,
  proteccion,
  perfil,
  patrimonio,
}: {
  motorA: ReturnType<typeof calcularMotorA>;
  motorB: ReturnType<typeof calcularMotorB>;
  motorC: ReturnType<typeof calcularMotorC>;
  motorE: ReturnType<typeof calcularMotorE>;
  proteccion: { seguro_vida: boolean; propiedades_aseguradas: boolean | null; sgmm: boolean } | null;
  perfil: { dependientes: boolean; edad: number } | null;
  patrimonio: { casa: number; tierra: number; herencia: number; inmuebles_renta: number; negocio: number } | null;
}): PlanRow[] {
  const rows: PlanRow[] = [];

  // Liquidez
  const meses = motorA.meses_cubiertos ?? 0;
  if (meses >= 12) {
    rows.push({ aspecto: "Liquidez", situacion: "En exceso", riesgo: "Bajo", recomendacion: "Diversificar excedente hacia inversiones de mayor rendimiento" });
  } else if (meses >= 3) {
    rows.push({ aspecto: "Liquidez", situacion: "Reserva adecuada", riesgo: "Bajo", recomendacion: "Mantener reserva de emergencia y optimizar el excedente" });
  } else {
    rows.push({ aspecto: "Liquidez", situacion: "Reserva insuficiente", riesgo: "Alto", recomendacion: "Incrementar reserva de emergencia a mínimo 3 meses de gastos" });
  }

  // Riqueza Financiera
  const ratio = motorB.ratio;
  if (ratio >= 5) {
    rows.push({ aspecto: "Riqueza Financiera", situacion: "Sólida y en crecimiento", riesgo: "Bajo", recomendacion: "Optimizar rendimientos y diversificar portafolio" });
  } else if (ratio >= 2) {
    rows.push({ aspecto: "Riqueza Financiera", situacion: "En crecimiento", riesgo: "Bajo", recomendacion: "Incrementar Patrimonio Financiero Disponible" });
  } else {
    rows.push({ aspecto: "Riqueza Financiera", situacion: "Comprometida por obligaciones", riesgo: "Medio", recomendacion: "Incrementar Patrimonio Financiero Disponible y reducir pasivos" });
  }

  // Inversión (% del ingreso)
  const invPct = motorA.ingresos_totales > 0 ? Math.round((motorA.remanente / motorA.ingresos_totales) * 100) : 0;
  if (invPct >= 40) {
    rows.push({ aspecto: "Inversión", situacion: `${invPct}% Ingresos — Excelente`, riesgo: "Bajo", recomendacion: "Incrementar Patrimonio Financiero con excedente" });
  } else if (invPct >= 20) {
    rows.push({ aspecto: "Inversión", situacion: `${invPct}% Ingresos — Moderado`, riesgo: "Medio", recomendacion: "Aumentar tasa de ahorro / inversión hasta 40%" });
  } else {
    rows.push({ aspecto: "Inversión", situacion: `${invPct}% Ingresos — Bajo`, riesgo: "Alto", recomendacion: "Reestructurar gastos e incrementar aportación mensual" });
  }

  // Inmuebles
  const noFin = motorE.noFinanciero;
  if (noFin > motorE.financiero * 2) {
    rows.push({ aspecto: "Inmuebles", situacion: "Alta participación patrimonial", riesgo: "Bajo", recomendacion: "Posibilidad de crédito para inversión financiera" });
  } else if (noFin > 0) {
    rows.push({ aspecto: "Inmuebles", situacion: "Participación normal", riesgo: "Bajo", recomendacion: "Mantener y valorizar activos inmobiliarios" });
  } else {
    rows.push({ aspecto: "Inmuebles", situacion: "Sin activos inmobiliarios", riesgo: "Bajo", recomendacion: "Considerar adquisición de bien raíz a mediano plazo" });
  }

  // Seguros
  const tieneVida = proteccion?.seguro_vida ?? false;
  const tieneSGMM = proteccion?.sgmm ?? false;
  if (!tieneVida && !tieneSGMM) {
    rows.push({ aspecto: "Seguros", situacion: "Insuficientes", riesgo: "Alto", recomendacion: "Contratar póliza de vida y Seguro de Gastos Médicos Mayores" });
  } else if (!tieneVida) {
    rows.push({ aspecto: "Seguros", situacion: "Sin seguro de vida", riesgo: "Alto", recomendacion: "Contratar póliza de protección de vida" });
  } else if (!tieneSGMM) {
    rows.push({ aspecto: "Seguros", situacion: "Sin SGMM", riesgo: "Medio", recomendacion: "Contratar Seguro de Gastos Médicos Mayores" });
  } else {
    rows.push({ aspecto: "Seguros", situacion: "Coberturas vigentes", riesgo: "Bajo", recomendacion: "Revisar sumas aseguradas anualmente" });
  }

  // Dependientes
  const tieneDep = perfil?.dependientes ?? false;
  if (tieneDep && !tieneVida) {
    rows.push({ aspecto: "Dependientes", situacion: "Expuestos — sin seguro de vida", riesgo: "Alto", recomendacion: "Contratar seguro de vida con suma asegurada suficiente" });
  } else if (tieneDep && tieneVida) {
    rows.push({ aspecto: "Dependientes", situacion: "Cubiertos parcialmente", riesgo: "Bajo", recomendacion: "Verificar suma asegurada cubra 3 años de gastos" });
  } else {
    rows.push({ aspecto: "Dependientes", situacion: "Sin dependientes económicos", riesgo: "Bajo", recomendacion: "Planificar en caso de cambios de vida futuros" });
  }

  // Retiro
  const grado = motorC.grado_avance;
  if (grado >= 1) {
    rows.push({ aspecto: "Retiro", situacion: "Suficiente para calidad de vida deseada", riesgo: "Bajo", recomendacion: "Optimizar rendimiento de los esquemas de retiro" });
  } else if (grado >= 0.6) {
    rows.push({ aspecto: "Retiro", situacion: `Avance al ${Math.round(grado * 100)}% de meta`, riesgo: "Medio", recomendacion: "Incrementar aportación a plan de pensiones privado" });
  } else {
    rows.push({ aspecto: "Retiro", situacion: "Insuficiente para calidad de vida deseada", riesgo: "Medio", recomendacion: "Aportar plan de pensiones privado de manera urgente" });
  }

  // Sucesión
  const hayInmuebles = (patrimonio?.casa ?? 0) + (patrimonio?.tierra ?? 0) + (patrimonio?.inmuebles_renta ?? 0) > 0;
  const hayNegocio = (patrimonio?.negocio ?? 0) > 0;
  if (hayInmuebles || hayNegocio) {
    rows.push({ aspecto: "Sucesión", situacion: "Bienes inmuebles" + (hayNegocio ? " y empresa" : ""), riesgo: "Bajo", recomendacion: "Planificar vehículo de sucesión (fideicomiso / testamento)" });
  } else {
    rows.push({ aspecto: "Sucesión", situacion: "Sin activos físicos registrados", riesgo: "Bajo", recomendacion: "Contemplar testamento y planificación patrimonial preventiva" });
  }

  return rows;
}
