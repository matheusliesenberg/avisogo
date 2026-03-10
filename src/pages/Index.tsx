import { useState } from "react";
import { Plus, User, ClipboardList } from "lucide-react";
import { TaskCard, type Task, type TaskStatus } from "@/components/TaskCard";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { HandoverModal } from "@/components/HandoverModal";
import { BulletinBoard, type Announcement } from "@/components/BulletinBoard";

const MOCK_USERS = [
  { id: "1", name: "Carlos Silva", role: "Operador" },
  { id: "2", name: "Ana Souza", role: "Supervisora" },
  { id: "3", name: "João Santos", role: "Técnico" },
  { id: "4", name: "Maria Oliveira", role: "Coordenadora" },
];

const INITIAL_TASKS: Task[] = [
  {
    id: "1",
    title: "Verificar estoque de peças",
    description: "Conferir quantidade de parafusos M8 no almoxarifado central.",
    status: "todo",
    assignee: "Carlos Silva",
    createdAt: new Date().toLocaleDateString("pt-BR"),
  },
  {
    id: "2",
    title: "Relatório de produção semanal",
    description: "Preencher o relatório da linha 3 com os dados de segunda a sexta.",
    status: "in_progress",
    assignee: "Ana Souza",
    createdAt: new Date().toLocaleDateString("pt-BR"),
  },
  {
    id: "3",
    title: "Manutenção preventiva - Máquina 7",
    description: "Lubrificação e troca de filtros conforme checklist padrão.",
    status: "done",
    assignee: "João Santos",
    createdAt: new Date().toLocaleDateString("pt-BR"),
  },
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "A Fazer",
  in_progress: "Em Andamento",
  done: "Concluído",
};

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [handoverTask, setHandoverTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");

  const handleCreateTask = (title: string, description: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      description,
      status: "todo",
      assignee: "Você",
      createdAt: new Date().toLocaleDateString("pt-BR"),
    };
    setTasks((prev) => [newTask, ...prev]);
    setShowCreateModal(false);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const handleHandover = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) setHandoverTask(task);
  };

  const handleConfirmHandover = (recipientName: string) => {
    if (!handoverTask) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === handoverTask.id
          ? { ...t, status: "done" as TaskStatus, assignee: recipientName }
          : t
      )
    );
    setHandoverTask(null);
  };

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const statusOrder: TaskStatus[] = ["in_progress", "todo", "done"];
  const sortedTasks = [...filteredTasks].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  );

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-primary shadow-md">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-primary-foreground" />
            <h1 className="text-xl font-heading font-bold text-primary-foreground">
              Painel Digital
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
              <User className="h-5 w-5 text-secondary-foreground" />
              <span className="text-sm font-bold text-secondary-foreground hidden sm:inline">
                Carlos Silva
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6 space-y-5">
        {/* Create button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full flex items-center justify-center gap-3 rounded-lg bg-primary py-4 px-6 text-lg font-heading font-bold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          <Plus className="h-6 w-6" />
          Criar Nova Tarefa
        </button>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "todo", "in_progress", "done"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                filter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border border-border hover:bg-accent"
              }`}
            >
              {s === "all" ? "Todas" : STATUS_LABELS[s]}
              <span className="ml-2 text-xs opacity-75">
                ({s === "all" ? tasks.length : tasks.filter((t) => t.status === s).length})
              </span>
            </button>
          ))}
        </div>

        {/* Task feed */}
        <div className="space-y-4">
          {sortedTasks.length === 0 ? (
            <div className="rounded-lg bg-card p-8 text-center">
              <p className="text-muted-foreground text-lg">
                Nenhuma tarefa encontrada.
              </p>
            </div>
          ) : (
            sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onHandover={handleHandover}
              />
            ))
          )}
        </div>
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
        />
      )}

      {handoverTask && (
        <HandoverModal
          task={handoverTask}
          users={MOCK_USERS}
          onClose={() => setHandoverTask(null)}
          onConfirm={handleConfirmHandover}
        />
      )}
    </div>
  );
};

export default Index;
