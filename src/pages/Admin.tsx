import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Shield, ClipboardList, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  cargo: string;
  cargo_custom: string | null;
  created_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading, user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [loading, isAdmin, navigate]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(data || []);
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const handleDelete = async (targetUserId: string, displayName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o colaborador "${displayName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeletingId(targetUserId);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: targetUserId },
      });

      if (error || data?.error) {
        toast({
          title: "Erro ao excluir",
          description: data?.error || error?.message || "Erro desconhecido",
          variant: "destructive",
        });
      } else {
        toast({ title: "Colaborador excluído com sucesso" });
        setUsers((prev) => prev.filter((u) => u.user_id !== targetUserId));
      }
    } catch (err: any) {
      toast({
        title: "Erro ao excluir",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="sticky top-0 z-30 bg-primary shadow-md">
        <div className="container flex items-center gap-3 py-4">
          <button
            onClick={() => navigate("/")}
            className="rounded-lg p-2 text-primary-foreground hover:bg-secondary/30 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Shield className="h-6 w-6 text-primary-foreground" />
          <h1 className="text-xl font-heading font-bold text-primary-foreground">
            Painel Administrativo
          </h1>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-5 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-heading font-bold text-foreground">
              {users.length}
            </p>
            <p className="text-sm text-muted-foreground">Colaboradores</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 text-center">
            <ClipboardList className="h-8 w-8 text-secondary mx-auto mb-2" />
            <p className="text-2xl font-heading font-bold text-foreground">—</p>
            <p className="text-sm text-muted-foreground">Tarefas Ativas</p>
          </div>
        </div>

        {/* Users list */}
        <div className="space-y-3">
          <h2 className="text-lg font-heading font-bold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Colaboradores Cadastrados
          </h2>

          {loadingUsers ? (
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <p className="text-muted-foreground">
                Nenhum colaborador cadastrado.
              </p>
            </div>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-secondary-foreground">
                    {u.display_name?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">
                    {u.display_name || "Sem nome"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {u.email}
                  </p>
                  <p className="text-xs text-secondary font-bold">
                    {u.cargo_custom || u.cargo || "Sem cargo"}
                  </p>
                </div>
                {u.user_id !== user?.id && (
                  <button
                    onClick={() => handleDelete(u.user_id, u.display_name)}
                    disabled={deletingId === u.user_id}
                    className="shrink-0 rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    title="Excluir colaborador"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
