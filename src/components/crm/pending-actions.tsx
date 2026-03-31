"use client";

import { Phone, Clock, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CRMTask } from "@/stores/crm-store";

interface PendingActionsProps {
  tasks: CRMTask[];
  onContact: (task: CRMTask) => void;
  onPostpone: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

const prioridadColors: Record<string, string> = {
  urgente: "border-l-[#EF4444] bg-[#EF4444]/5",
  alta: "border-l-[#F59E0B] bg-[#F59E0B]/5",
  media: "border-l-[#C9A84C] bg-[#C9A84C]/5",
  baja: "border-l-[#8B9BB4] bg-transparent",
};

const prioridadBadge: Record<string, { bg: string; text: string }> = {
  urgente: { bg: "bg-[#EF4444]/15", text: "text-[#EF4444]" },
  alta: { bg: "bg-[#F59E0B]/15", text: "text-[#F59E0B]" },
  media: { bg: "bg-[#C9A84C]/15", text: "text-[#C9A84C]" },
  baja: { bg: "bg-[#8B9BB4]/15", text: "text-[#8B9BB4]" },
};

export function PendingActions({
  tasks,
  onContact,
  onPostpone,
  onComplete,
}: PendingActionsProps) {
  const pendingTasks = tasks
    .filter((t) => t.estado === "pendiente" || t.estado === "pospuesta")
    .sort((a, b) => {
      const order = { urgente: 0, alta: 1, media: 2, baja: 3 };
      return (order[a.prioridad] ?? 3) - (order[b.prioridad] ?? 3);
    });

  if (pendingTasks.length === 0) {
    return (
      <div className="bg-[#0C1829] border border-white/[0.06] rounded-[16px] p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#10B981]/10 flex items-center justify-center">
          <Check className="w-6 h-6 text-[#10B981]" />
        </div>
        <p className="text-sm text-[#F0F4FA] font-semibold">¡Todo al día!</p>
        <p className="text-xs text-[#8B9BB4] mt-1">No tienes acciones pendientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pendingTasks.slice(0, 5).map((task) => (
        <div
          key={task.id}
          className={`
            bg-[#0C1829] border border-white/[0.06] rounded-[14px] p-4
            border-l-4 ${prioridadColors[task.prioridad]}
            transition-all hover:border-white/[0.1]
          `}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${prioridadBadge[task.prioridad]?.bg} ${prioridadBadge[task.prioridad]?.text}`}
                >
                  {task.prioridad}
                </span>
                <span className="text-[10px] text-[#5A6A85]">{task.tipo}</span>
              </div>
              <p className="text-sm font-semibold text-[#F0F4FA]">{task.titulo}</p>
              {task.insight && (
                <p className="text-xs text-[#8B9BB4] mt-1 italic">
                  Insight: {task.insight}
                </p>
              )}
              {task.sugerencia_accion && (
                <p className="text-xs text-[#C9A84C] mt-1">
                  {task.sugerencia_accion}
                </p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-[#4A5A72] shrink-0 mt-1" />
          </div>

          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.04]">
            <Button
              variant="accent"
              size="sm"
              onClick={() => onContact(task)}
              className="text-xs"
            >
              <Phone className="w-3 h-3" />
              Contactar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPostpone(task.id)}
              className="text-xs text-[#8B9BB4]"
            >
              <Clock className="w-3 h-3" />
              Posponer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onComplete(task.id)}
              className="text-xs text-[#10B981]"
            >
              <Check className="w-3 h-3" />
              Completado
            </Button>
          </div>
        </div>
      ))}

      {pendingTasks.length > 5 && (
        <p className="text-xs text-[#5A6A85] text-center py-2">
          +{pendingTasks.length - 5} acciones más
        </p>
      )}
    </div>
  );
}
