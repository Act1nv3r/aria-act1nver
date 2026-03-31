import type { CRMTask } from "@/stores/crm-store";
import type { SessionInsight } from "@/stores/diagnostico-store";

interface ClienteProfile {
  id: string;
  nombre_alias: string;
  edad?: number;
  patrimonio_total?: number;
  dependientes?: boolean;
  seguro_vida?: boolean;
  solvencia?: number;
  edad_retiro?: number;
  diagnostico_fecha?: string;
  diagnostico_estado?: string;
}

export function generarTasksSeguimiento(
  clientes: ClienteProfile[],
  insights: SessionInsight[]
): Omit<CRMTask, "id" | "created_at">[] {
  const tasks: Omit<CRMTask, "id" | "created_at">[] = [];
  const today = new Date();

  for (const cliente of clientes) {
    // Rule 1: Stale diagnostics
    if (cliente.diagnostico_fecha) {
      const diagDate = new Date(cliente.diagnostico_fecha);
      const daysSince = Math.floor(
        (today.getTime() - diagDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSince > 180) {
        tasks.push({
          cliente_id: cliente.id,
          cliente_nombre: cliente.nombre_alias,
          tipo: "actualizacion",
          prioridad: "urgente",
          titulo: `Diagnóstico desactualizado de ${cliente.nombre_alias}`,
          descripcion: `El diagnóstico tiene ${daysSince} días. Es importante actualizarlo para mantener una estrategia vigente.`,
          sugerencia_accion:
            "Agendar sesión de actualización. Los datos financieros pueden haber cambiado significativamente.",
          estado: "pendiente",
          fecha_sugerida: today.toISOString().split("T")[0],
        });
      } else if (daysSince > 90) {
        tasks.push({
          cliente_id: cliente.id,
          cliente_nombre: cliente.nombre_alias,
          tipo: "actualizacion",
          prioridad: "media",
          titulo: `Actualizar diagnóstico de ${cliente.nombre_alias}`,
          descripcion: `El diagnóstico tiene ${daysSince} días. Considera agendar una actualización.`,
          sugerencia_accion: "Contactar al cliente para agendar revisión trimestral.",
          estado: "pendiente",
          fecha_sugerida: today.toISOString().split("T")[0],
        });
      }
    }

    // Rule 2: Session-based opportunities
    const clienteInsights = insights.filter(
      (i) => i.tipo === "oportunidad"
    );
    for (const insight of clienteInsights) {
      tasks.push({
        cliente_id: cliente.id,
        cliente_nombre: cliente.nombre_alias,
        tipo: "oportunidad",
        prioridad: "alta",
        titulo: `Oportunidad: ${insight.producto_sugerido || "producto"} para ${cliente.nombre_alias}`,
        descripcion: insight.texto,
        insight: insight.texto,
        sugerencia_accion: `Compartirle información sobre ${insight.producto_sugerido}. Mencionar el contexto de la conversación para generar confianza.`,
        estado: "pendiente",
        fecha_sugerida: today.toISOString().split("T")[0],
      });
    }

    // Rule 3: Life events
    if (cliente.edad) {
      const milestones = [30, 40, 45, 50, 55, 60];
      const currentYear = today.getFullYear();
      const birthYear = currentYear - cliente.edad;

      for (const m of milestones) {
        const milestoneYear = birthYear + m;
        if (milestoneYear === currentYear && cliente.edad === m) {
          tasks.push({
            cliente_id: cliente.id,
            cliente_nombre: cliente.nombre_alias,
            tipo: "evento_vida",
            prioridad: "media",
            titulo: `${cliente.nombre_alias} cumple ${m} años`,
            descripcion: `Edad clave para revisar plan financiero. A los ${m} las prioridades cambian.`,
            sugerencia_accion:
              "Felicitar y aprovechar para revisar estrategia financiera acorde a su nueva etapa.",
            estado: "pendiente",
            fecha_sugerida: today.toISOString().split("T")[0],
          });
        }
      }

      // Pre-retirement alert
      if (
        cliente.edad_retiro &&
        cliente.edad_retiro - cliente.edad <= 5 &&
        cliente.edad_retiro - cliente.edad > 0
      ) {
        tasks.push({
          cliente_id: cliente.id,
          cliente_nombre: cliente.nombre_alias,
          tipo: "evento_vida",
          prioridad: "urgente",
          titulo: `Revisión pre-retiro: ${cliente.nombre_alias}`,
          descripcion: `A ${cliente.edad_retiro - cliente.edad} años del retiro. Revisión urgente de estrategia.`,
          sugerencia_accion:
            "Agendar sesión dedicada de planeación pre-retiro. Revisar Afore, PPR, y proyección de desacumulación.",
          estado: "pendiente",
          fecha_sugerida: today.toISOString().split("T")[0],
        });
      }

      // Dependents without life insurance
      if (cliente.dependientes && !cliente.seguro_vida) {
        tasks.push({
          cliente_id: cliente.id,
          cliente_nombre: cliente.nombre_alias,
          tipo: "evento_vida",
          prioridad: "alta",
          titulo: `${cliente.nombre_alias}: dependientes sin seguro de vida`,
          descripcion:
            "El cliente tiene dependientes económicos pero no cuenta con seguro de vida.",
          sugerencia_accion:
            "Recomendar cotización de seguro de vida. Enfatizar la importancia de proteger a la familia.",
          estado: "pendiente",
          fecha_sugerida: today.toISOString().split("T")[0],
        });
      }

      // High debt
      if (cliente.solvencia && cliente.solvencia > 0.4) {
        tasks.push({
          cliente_id: cliente.id,
          cliente_nombre: cliente.nombre_alias,
          tipo: "ai_insight",
          prioridad: "alta",
          titulo: `Revisar estrategia de deuda: ${cliente.nombre_alias}`,
          descripcion: `Índice de solvencia elevado (${(cliente.solvencia * 100).toFixed(0)}%). Puede estar sobreexpuesto.`,
          sugerencia_accion:
            "Analizar opciones de reestructura o consolidación de deuda.",
          estado: "pendiente",
          fecha_sugerida: today.toISOString().split("T")[0],
        });
      }
    }
  }

  return tasks;
}
