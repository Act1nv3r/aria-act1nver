import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CRMTask {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  tipo: "actualizacion" | "oportunidad" | "evento_vida" | "ai_insight";
  prioridad: "urgente" | "alta" | "media" | "baja";
  titulo: string;
  descripcion: string;
  insight?: string;
  sugerencia_accion?: string;
  estado: "pendiente" | "pospuesta" | "completada" | "descartada";
  fecha_sugerida: string;
  fecha_completada?: string;
  created_at: number;
}

export interface ContactLog {
  id: string;
  cliente_id: string;
  tipo: "llamada" | "email" | "whatsapp" | "presencial";
  notas: string;
  task_id?: string;
  created_at: number;
}

export interface CRMClienteSummary {
  id: string;
  nombre_alias: string;
  ultimo_contacto?: number;
  diagnostico_edad_dias?: number;
  oportunidades: string[];
  salud_score: number;
  estado: "activo" | "pendiente" | "inactivo";
}

interface CRMStore {
  tasks: CRMTask[];
  contactLog: ContactLog[];
  clientes: CRMClienteSummary[];

  addTask: (task: Omit<CRMTask, "id" | "created_at">) => void;
  updateTaskEstado: (taskId: string, estado: CRMTask["estado"]) => void;
  postponeTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  addContactLog: (log: Omit<ContactLog, "id" | "created_at">) => void;
  setClientes: (clientes: CRMClienteSummary[]) => void;
  setTasks: (tasks: CRMTask[]) => void;
}

export const useCRMStore = create<CRMStore>()(
  persist(
    (set) => ({
      tasks: [],
      contactLog: [],
      clientes: [],

      addTask: (task) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            { ...task, id: crypto.randomUUID(), created_at: Date.now() },
          ],
        })),

      updateTaskEstado: (taskId, estado) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  estado,
                  fecha_completada:
                    estado === "completada"
                      ? new Date().toISOString()
                      : t.fecha_completada,
                }
              : t
          ),
        })),

      postponeTask: (taskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, estado: "pospuesta" as const } : t
          ),
        })),

      completeTask: (taskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  estado: "completada" as const,
                  fecha_completada: new Date().toISOString(),
                }
              : t
          ),
        })),

      addContactLog: (log) =>
        set((s) => ({
          contactLog: [
            ...s.contactLog,
            { ...log, id: crypto.randomUUID(), created_at: Date.now() },
          ],
        })),

      setClientes: (clientes) => set({ clientes }),
      setTasks: (tasks) => set({ tasks }),
    }),
    {
      name: "crm-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? sessionStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
    }
  )
);
