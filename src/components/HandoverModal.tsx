import { useState } from "react";
import { X, Check } from "lucide-react";
import type { Task } from "@/components/TaskCard";

interface HandoverUser {
  id: string;
  name: string;
  role: string;
}

interface HandoverModalProps {
  task: Task;
  users: HandoverUser[];
  onClose: () => void;
  onConfirm: (recipientName: string) => void;
}

export function HandoverModal({ task, users, onClose, onConfirm }: HandoverModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [recipientName, setRecipientName] = useState("");

  const handleConfirm = () => {
    if (!selected) return;
    const user = users.find((u) => u.id === selected);
    if (!user) return;
    setRecipientName(user.name);
    setConfirmed(true);
    onConfirm(user.name);
    setTimeout(() => onClose(), 2500);
  };

  if (confirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 text-center space-y-4 animate-in zoom-in-95">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h2 className="font-heading font-bold text-xl text-foreground">
            Tarefa Enviada!
          </h2>
          <p className="text-muted-foreground">
            <strong className="text-foreground">{task.title}</strong> foi enviada para{" "}
            <strong className="text-secondary">{recipientName}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40">
      <div className="w-full max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-xl animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-heading font-bold text-lg text-foreground">
            Finalizar e Passar para...
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground mb-2">
            Selecione quem vai receber a tarefa:
          </p>

          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => setSelected(user.id)}
              className={`w-full flex items-center gap-4 rounded-lg p-4 border-2 transition-all text-left ${
                selected === user.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-accent"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-secondary-foreground">
                  {user.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-bold text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.role}</p>
              </div>
              {selected === user.id && (
                <Check className="h-5 w-5 text-primary ml-auto" />
              )}
            </button>
          ))}

          <button
            onClick={handleConfirm}
            disabled={!selected}
            className="w-full rounded-lg bg-success py-4 text-base font-heading font-bold text-success-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            Confirmar Envio
          </button>
        </div>
      </div>
    </div>
  );
}
