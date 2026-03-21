import { PARAMS } from "../constants";

export interface MotorFInput {
  seguro_vida: boolean;
  propiedades_aseguradas: boolean | null;
  sgmm: boolean;
  dependientes: boolean;
  patrimonio_neto: number;
  inmuebles_total: number;
  edad: number;
}

export interface MotorFOutput {
  recomendaciones: string[];
  suma_asegurada_vida?: number;
  costo_prima_vida?: number;
  seguro_hogar_sugerido?: number;
  costo_hogar_anual?: number;
  sgmm_estimado?: number;
}

export function calcularMotorF(input: MotorFInput): MotorFOutput {
  const recomendaciones: string[] = [];

  if (input.dependientes && !input.seguro_vida) {
    const suma_asegurada = input.patrimonio_neto * 0.7;
    const costo_prima =
      (suma_asegurada / 1_000_000) * PARAMS.COSTO_SEGURO_POR_MILLON;
    recomendaciones.push(
      `Sugerencia: Seguro de vida con suma asegurada de ${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(suma_asegurada)}`
    );
    return {
      recomendaciones,
      suma_asegurada_vida: suma_asegurada,
      costo_prima_vida: costo_prima,
    };
  }

  if (input.inmuebles_total > 0 && !input.propiedades_aseguradas) {
    const seguro_hogar = input.inmuebles_total * 1.0;
    const costo_hogar = seguro_hogar * 0.003;
    recomendaciones.push(
      `Considera asegurar tus propiedades por ${new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(seguro_hogar)}`
    );
    return {
      recomendaciones,
      seguro_hogar_sugerido: seguro_hogar,
      costo_hogar_anual: costo_hogar,
    };
  }

  if (!input.sgmm) {
    const sgmm_estimado = input.edad >= 50 ? 30000 : 15000;
    recomendaciones.push(
      "SGMM recomendado: $15,000-$30,000/año según edad"
    );
    return {
      recomendaciones,
      sgmm_estimado,
    };
  }

  return { recomendaciones };
}
