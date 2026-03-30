import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ClipboardList, LogOut, Shield } from "lucide-react";
import { TaskCard, type TaskStatus } from "@/components/TaskCard";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { HandoverModal } from "@/components/HandoverModal";
import { BulletinBoard } from "@/components/BulletinBoard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTasks } from "@/hooks/useTasks";
import { useAnnouncements } from "@/hooks/useAnnouncements";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "A Fazer",
  in_progress: "Em Andamento",
  done: "Concluído",
};

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { tasks, createTask, updateStatus, deleteTask, handoverTask } = useTasks();
  const { announcements, addAnnouncement, deleteAnnouncement } = useAnnouncements();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [handoverTaskData, setHandoverTaskData] = useState<typeof tasks[0] | null>(null);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; role: string }[]>([]);

  const isSupervisor = isAdmin || profile?.cargo === "Supervisor";

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, cargo, cargo_custom");
      if (data) {
        setAllUsers(
          data.map((u) => ({
            id: u.user_id,
            name: u.display_name || "Sem nome",
            role: u.cargo_custom || u.cargo || "",
          }))
        );
      }
    };
    fetchUsers();
  }, []);

  const handleAddAnnouncement = (title: string, message: string, priority: "normal" | "urgent") => {
    if (!user) return;
    addAnnouncement(title, message, priority, profile?.display_name || "Usuário", user.id);
  };

  const handleCreateTask = (title: string, description: string, assignee: string) => {
    if (!user) return;
    createTask(title, description, assignee || profile?.display_name || "Você", user.id);
    setShowCreateModal(false);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateStatus(taskId, newStatus);
  };

  const handleHandover = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) setHandoverTaskData(task);
  };

  const handleConfirmHandover = (recipientName: string) => {
    if (!handoverTaskData) return;
    handoverTask(handoverTaskData.id, recipientName);
    setHandoverTaskData(null);
  };

  const filteredTasks =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const statusOrder: TaskStatus[] = ["in_progress", "todo", "done"];
  const sortedTasks = [...filteredTasks].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  );

  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const currentUserName = profile?.display_name || "";

  return (
    <div className="min-h-screen bg-muted">
      <header className="sticky top-0 z-30 bg-primary shadow-md">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-primary-foreground" />
            <h1 className="text-xl font-heading font-bold text-primary-foreground">
              Painel Digital
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 hover:opacity-90 transition-opacity"
                title="Painel Admin"
              >
                <Shield className="h-5 w-5 text-destructive-foreground" />
                <span className="text-sm font-bold text-destructive-foreground hidden sm:inline">Admin</span>
              </button>
            )}
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 hover:opacity-90 transition-opacity"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-secondary-foreground">
                    {initials}
                  </span>
                </div>
              )}
              <span className="text-sm font-bold text-secondary-foreground hidden sm:inline">
                {profile?.display_name || "Perfil"}
              </span>
            </button>
            <button
              onClick={signOut}
              className="rounded-lg p-2 text-primary-foreground hover:bg-secondary/30 transition-colors"
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <BulletinBoard
          announcements={announcements}
          onAdd={handleAddAnnouncement}
          onDelete={deleteAnnouncement}
          isSupervisor={isSupervisor}
        />

        <hr className="border-border" />

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-3 rounded-lg bg-primary py-4 px-6 text-lg font-heading font-bold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            <Plus className="h-6 w-6" />
            Criar Nova Tarefa
          </button>
        )}

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
                task={{
                  ...task,
                  createdAt: new Date(task.created_at).toLocaleDateString("pt-BR"),
                }}
                onStatusChange={handleStatusChange}
                onHandover={handleHandover}
                onDelete={deleteTask}
                canDelete={isAdmin}
                isAssignee={task.assignee === currentUserName}
              />
            ))
          )}
        </div>
      </main>

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
          users={allUsers}
        />
      )}

      {handoverTaskData && (
        <HandoverModal
          task={{
            ...handoverTaskData,
            createdAt: new Date(handoverTaskData.created_at).toLocaleDateString("pt-BR"),
          }}
          users={allUsers}
          onClose={() => setHandoverTaskData(null)}
          onConfirm={handleConfirmHandover}
        />
      )}
    </div>
  );
};

export default Index;
