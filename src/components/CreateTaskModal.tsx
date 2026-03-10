import { useState } from "react";
import { X } from "lucide-react";

interface CreateTaskModalProps {
  onClose: () => void;
  onCreate: (title: string, description: string, assignee: string) => void;
  users: { id: string; name: string; role: string }[];
}

export function CreateTaskModal({ onClose, onCreate, users }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate(title.trim(), description.trim(), assignee || "Você");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40">
      <div className="w-full max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-xl animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-heading font-bold text-lg text-foreground">
            Criar Nova Tarefa
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-foreground">
              Título da Tarefa
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Verificar equipamento"
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-foreground">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que precisa ser feito..."
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="w-full rounded-lg bg-primary py-4 text-base font-heading font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Criar Tarefa
          </button>
        </div>
      </div>
    </div>
  );
}
