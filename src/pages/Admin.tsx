import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Shield, ClipboardList, Trash2, ShieldCheck, ShieldOff, Search, Pencil, X, Save } from "lucide-react";
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
  cpf: string | null;
  phone: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  created_at: string;
  is_admin?: boolean;
}

const CARGOS = [
  "Operador de Produção",
  "Administração",
  "Logística",
  "Supervisor",
  "Segurança",
  "Outro",
];

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading, user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({
    display_name: "",
    cargo: "",
    cargo_custom: "",
    cpf: "",
    phone: "",
    birth_date: "",
    email: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

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

  const isProtectedAdmin = (email: string) => email === "admin@gmail.com";

  const handleStartEdit = (u: UserProfile) => {
    setEditingUser(u);
    setEditForm({
      display_name: u.display_name || "",
      cargo: u.cargo || "",
      cargo_custom: u.cargo_custom || "",
      cpf: u.cpf || "",
      phone: u.phone || "",
      birth_date: u.birth_date || "",
      email: u.email || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: editForm.display_name.trim(),
          cargo: editForm.cargo,
          cargo_custom: editForm.cargo_custom.trim() || null,
          cpf: editForm.cpf.trim() || null,
          phone: editForm.phone.trim() || null,
          birth_date: editForm.birth_date || null,
          email: editForm.email.trim(),
        })
        .eq("user_id", editingUser.user_id);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === editingUser.user_id
            ? {
                ...u,
                display_name: editForm.display_name.trim(),
                cargo: editForm.cargo,
                cargo_custom: editForm.cargo_custom.trim() || null,
                cpf: editForm.cpf.trim() || null,
                phone: editForm.phone.trim() || null,
                birth_date: editForm.birth_date || null,
                email: editForm.email.trim(),
              }
            : u
        )
      );
      toast({ title: `Perfil de "${editForm.display_name}" atualizado` });
      setEditingUser(null);
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleAdmin = async (targetUserId: string, displayName: string, currentlyAdmin: boolean) => {
    setTogglingId(targetUserId);
    try {
      if (currentlyAdmin) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", targetUserId)
          .eq("role", "admin");
        if (error) throw error;
        await supabase.from("user_roles").upsert(
          { user_id: targetUserId, role: "user" as const },
          { onConflict: "user_id,role" }
        );
        toast({ title: `"${displayName}" rebaixado para usuário comum` });
      } else {
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
      toast({ title: "Erro ao alterar permissão", description: err.message, variant: "destructive" });
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
        toast({ title: "Erro ao excluir", description: data?.error || error?.message || "Erro desconhecido", variant: "destructive" });
      } else {
        toast({ title: "Colaborador excluído com sucesso" });
        setUsers((prev) => prev.filter((u) => u.user_id !== targetUserId));
      }
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
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
            <p className="text-2xl font-heading font-bold text-foreground">{users.length}</p>
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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome ou cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {loadingUsers ? (
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-6 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhum colaborador encontrado." : "Nenhum colaborador cadastrado."}
              </p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u.id}
                className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-secondary-foreground">
                      {u.display_name?.[0]?.toUpperCase() || "?"}
                    </span>
                  )}
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
                  <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                  <p className="text-xs text-secondary font-bold">
                    {u.cargo_custom || u.cargo || "Sem cargo"}
                  </p>
                </div>
                {u.user_id !== user?.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStartEdit(u)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      title="Editar informações"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>

                    {!isProtectedAdmin(u.email) && (
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
                            {u.is_admin ? <ShieldOff className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
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
                                : `Deseja promover "${u.display_name}" a administrador?`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleToggleAdmin(u.user_id, u.display_name, !!u.is_admin)}>
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {!isProtectedAdmin(u.email) && (
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
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40">
          <div className="w-full max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-xl animate-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border p-4 sticky top-0 bg-card z-10">
              <h2 className="font-heading font-bold text-lg text-foreground">
                Editar Colaborador
              </h2>
              <button onClick={() => setEditingUser(null)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Avatar preview (read-only) */}
              {editingUser.avatar_url && (
                <div className="flex justify-center">
                  <img src={editingUser.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-border" />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-sm font-bold text-foreground">Nome</label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm((f) => ({ ...f, display_name: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-foreground">E-mail</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-foreground">CPF</label>
                <input
                  type="text"
                  value={editForm.cpf}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                    setEditForm((f) => ({ ...f, cpf: digits }));
                  }}
                  placeholder="00000000000"
                  maxLength={11}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-foreground">Telefone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-foreground">Data de Nascimento</label>
                <input
                  type="date"
                  value={editForm.birth_date}
                  onChange={(e) => setEditForm((f) => ({ ...f, birth_date: e.target.value }))}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-bold text-foreground">Cargo</label>
                <select
                  value={editForm.cargo}
                  onChange={(e) => setEditForm((f) => ({ ...f, cargo: e.target.value, cargo_custom: e.target.value === "Outro" ? f.cargo_custom : "" }))}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecione</option>
                  {CARGOS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {editForm.cargo === "Outro" && (
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-foreground">Cargo personalizado</label>
                  <input
                    type="text"
                    value={editForm.cargo_custom}
                    onChange={(e) => setEditForm((f) => ({ ...f, cargo_custom: e.target.value }))}
                    placeholder="Digite o cargo"
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || !editForm.display_name.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-4 text-base font-heading font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {savingEdit ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
