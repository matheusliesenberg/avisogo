import { ArrowRight, CheckCircle, Clock, CircleDot, UserPlus } from "lucide-react";

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee: string;
  createdAt: string;
}

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onHandover: (taskId: string) => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; borderClass: string; bgClass: string; icon: typeof Clock }> = {
  todo: {
    label: "A Fazer",
    borderClass: "border-l-accent",
    bgClass: "bg-accent/20 text-accent-foreground",
    icon: CircleDot,
  },
  in_progress: {
    label: "Em Andamento",
    borderClass: "border-l-secondary",
    bgClass: "bg-secondary/20 text-secondary",
    icon: Clock,
  },
  done: {
    label: "Concluído",
    borderClass: "border-l-success",
    bgClass: "bg-success/20 text-success",
    icon: CheckCircle,
  },
};

const NEXT_STATUS: Partial<Record<TaskStatus, { status: TaskStatus; label: string }>> = {
  todo: { status: "in_progress", label: "Iniciar a Tarefa" },
  in_progress: { status: "done", label: "Marcar como Concluído" },
};

export function TaskCard({ task, onStatusChange, onHandover }: TaskCardProps) {
  const config = STATUS_CONFIG[task.status];
  const next = NEXT_STATUS[task.status];
  const StatusIcon = config.icon;

  return (
    <div
      className={`rounded-lg bg-card border border-border border-l-4 ${config.borderClass} shadow-sm transition-all`}
    >
      <div className="p-4 space-y-3">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold ${config.bgClass}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground">{task.createdAt}</span>
        </div>

        {/* Title & description */}
        <h2 className="font-heading font-bold text-lg text-foreground leading-tight">
          {task.title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {task.description}
        </p>

        {/* Assignee */}
        <p className="text-sm font-bold text-foreground">
          Responsável: <span className="text-secondary">{task.assignee}</span>
        </p>

        {/* Actions - always visible */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {next && (
            <button
              onClick={() => onStatusChange(task.id, next.status)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 px-4 text-sm font-bold transition-colors ${
                next.status === "done"
                  ? "bg-success text-success-foreground hover:opacity-90"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              <ArrowRight className="h-4 w-4" />
              {next.label}
            </button>
          )}

          {task.status === "in_progress" && (
            <button
              onClick={() => onHandover(task.id)}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg py-3 px-4 text-sm font-bold bg-secondary text-secondary-foreground hover:opacity-90 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Finalizar e Passar para...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
