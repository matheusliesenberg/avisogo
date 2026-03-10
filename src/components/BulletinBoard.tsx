import { useState } from "react";
import { Megaphone, Plus, X, Trash2 } from "lucide-react";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  author: string;
  createdAt: string;
  priority: "normal" | "urgent";
}

interface BulletinBoardProps {
  announcements: Announcement[];
  onAdd: (title: string, message: string, priority: "normal" | "urgent") => void;
  onDelete: (id: string) => void;
  isSupervisor: boolean;
}

export function BulletinBoard({ announcements, onAdd, onDelete, isSupervisor }: BulletinBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");

  const handleSubmit = () => {
    if (!title.trim() || !message.trim()) return;
    onAdd(title.trim(), message.trim(), priority);
    setTitle("");
    setMessage("");
    setPriority("normal");
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-heading font-bold text-foreground">
            Mural de Avisos
          </h2>
        </div>
        {isSupervisor && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancelar" : "Novo Aviso"}
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-lg bg-card border border-border p-4 space-y-3">
          <input
            type="text"
            placeholder="Título do aviso"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            placeholder="Escreva o comunicado aqui..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setPriority("normal")}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
                priority === "normal"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setPriority("urgent")}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
                priority === "urgent"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              🚨 Urgente
            </button>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !message.trim()}
            className="w-full rounded-lg bg-primary py-3 text-base font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Publicar Aviso
          </button>
        </div>
      )}

      {/* Announcements */}
      {announcements.length === 0 ? (
        <div className="rounded-lg bg-card border border-border p-6 text-center">
          <p className="text-muted-foreground">Nenhum aviso no momento.</p>
        </div>
      ) : (
        announcements.map((a) => (
          <div
            key={a.id}
            className={`rounded-lg bg-card border-l-4 border border-border shadow-sm p-4 space-y-2 ${
              a.priority === "urgent" ? "border-l-destructive" : "border-l-secondary"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {a.priority === "urgent" && (
                  <span className="inline-flex items-center rounded-md bg-destructive/15 px-2 py-0.5 text-xs font-bold text-destructive">
                    🚨 URGENTE
                  </span>
                )}
                <h3 className="font-heading font-bold text-foreground">{a.title}</h3>
              </div>
              {isSupervisor && (
                <button
                  onClick={() => onDelete(a.id)}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {a.message}
            </p>
            <p className="text-xs text-muted-foreground">
              {a.author} · {a.createdAt}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
