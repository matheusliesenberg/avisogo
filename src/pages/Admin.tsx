import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Shield, ClipboardList, Trash2, ShieldCheck, ShieldOff, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  cargo: string;
  cargo_custom: string | null;
  created_at: string;
  is_admin?: boolean;
}

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading, user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const cargo = (u.cargo_custom || u.cargo || "").toLowerCase();
    const name = (u.display_name || "").toLowerCase();
    return name.includes(q) || cargo.includes(q);
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [loading, isAdmin, navigate]);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!profiles) {
      setUsers([]);
      setLoadingUsers(false);
      return;
    }

    // Check admin status for each user
    const usersWithRoles = await Promise.all(
      profiles.map(async (p) => {
        const { data: isAdminUser } = await supabase.rpc("has_role", {
          _user_id: p.user_id,
          _role: "admin",
        });
        return { ...p, is_admin: isAdminUser === true };
      })
    );

    setUsers(usersWithRoles);
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const handleToggleAdmin = async (targetUserId: string, displayName: string, currentlyAdmin: boolean) => {
    setTogglingId(targetUserId);
    try {
      if (currentlyAdmin) {
        // Demote: delete admin role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", targetUserId)
          .eq("role", "admin");

        if (error) throw error;

        // Ensure they have 'user' role
        await supabase.from("user_roles").upsert(
          { user_id: targetUserId, role: "user" as const },
          { onConflict: "user_id,role" }
        );

        toast({ title: `"${displayName}" rebaixado para usuário comum` });
      } else {
        // Promote: add admin role
        await supabase.from("user_roles").insert({
          user_id: targetUserId,
          role: "admin" as const,
        });

        toast({ title: `"${displayName}" promovido a administrador` });
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === targetUserId ? { ...u, is_admin: !currentlyAdmin } : u
        )
      );
    } catch (err: any) {
      toast({
        title: "Erro ao alterar permissão",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (targetUserId: string, displayName: string) => {
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
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground truncate">
                      {u.display_name || "Sem nome"}
                    </p>
                    {u.is_admin && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        <Shield className="h-3 w-3" />
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {u.email}
                  </p>
                  <p className="text-xs text-secondary font-bold">
                    {u.cargo_custom || u.cargo || "Sem cargo"}
                  </p>
                </div>
                {u.user_id !== user?.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          disabled={togglingId === u.user_id}
                          className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                            u.is_admin
                              ? "text-amber-600 hover:bg-amber-100"
                              : "text-primary hover:bg-primary/10"
                          }`}
                          title={u.is_admin ? "Rebaixar para usuário" : "Promover a admin"}
                        >
                          {u.is_admin ? (
                            <ShieldOff className="h-5 w-5" />
                          ) : (
                            <ShieldCheck className="h-5 w-5" />
                          )}
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {u.is_admin ? "Rebaixar usuário" : "Promover a administrador"}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {u.is_admin
                              ? `Deseja remover os privilégios de administrador de "${u.display_name}"?`
                              : `Deseja promover "${u.display_name}" a administrador? Ele terá acesso total ao painel.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleToggleAdmin(u.user_id, u.display_name, !!u.is_admin)}
                          >
                            Confirmar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          disabled={deletingId === u.user_id}
                          className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                          title="Excluir colaborador"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir colaborador</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir "{u.display_name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(u.user_id, u.display_name)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
