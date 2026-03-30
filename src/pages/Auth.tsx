import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const CARGOS = [
  "Operador de Produção",
  "Administração",
  "Logística",
  "Supervisor",
  "Segurança",
  "Outro",
];

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [emailPrefix, setEmailPrefix] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [cargo, setCargo] = useState("");
  const [cargoCustom, setCargoCustom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const email = emailPrefix.trim() ? `${emailPrefix.trim()}@gmail.com` : "";

  const validatePassword = (_pwd: string): string | null => {
    return null;
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!emailPrefix.trim()) errs.email = "E-mail é obrigatório";
    if (isLogin) {
      if (!password) errs.password = "Senha é obrigatória";
    } else {
      const pwdError = validatePassword(password);
      if (pwdError) errs.password = pwdError;
    }
    if (!isLogin) {
      if (!displayName.trim()) errs.displayName = "Nome é obrigatório";
      if (!cargo) errs.cargo = "Selecione um cargo";
      if (cargo === "Outro" && !cargoCustom.trim())
        errs.cargoCustom = "Informe o cargo";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (email === "admin@gmail.com") {
          navigate("/admin");
        } else {
          navigate("/");
        }
        toast.success("Login realizado com sucesso!");
      } else {
        const finalCargo = cargo === "Outro" ? cargoCustom.trim() : cargo;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName.trim(),
            },
          },
        });
        if (error) throw error;

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("profiles")
            .update({
              cargo: finalCargo,
              cargo_custom: cargo === "Outro" ? cargoCustom.trim() : null,
              display_name: displayName.trim(),
            })
            .eq("user_id", user.id);
        }

        if (email === "admin@gmail.com") {
          navigate("/admin");
        } else {
          navigate("/");
        }
        toast.success("Conta criada com sucesso!");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao autenticar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <ClipboardList className="h-8 w-8 text-primary-foreground" />
            <h1 className="text-2xl font-heading font-bold text-primary-foreground">
              Painel Digital
            </h1>
          </div>
          <p className="text-primary-foreground/80 text-sm">
            {isLogin ? "Acesse sua conta" : "Crie sua conta"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="block text-sm font-bold text-foreground">
                Nome de Usuário *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome completo"
                className={`w-full rounded-lg border px-4 py-3 text-base bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                  errors.displayName ? "border-destructive" : "border-input"
                }`}
              />
              {errors.displayName && (
                <p className="text-xs text-destructive font-bold">
                  {errors.displayName}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-bold text-foreground">
              E-mail *
            </label>
            <div className="flex items-stretch">
              <input
                type="text"
                value={emailPrefix}
                onChange={(e) => setEmailPrefix(e.target.value)}
                placeholder="seu.email"
                className={`flex-1 rounded-l-lg border border-r-0 px-4 py-3 text-base bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                  errors.email ? "border-destructive" : "border-input"
                }`}
              />
              <span className="inline-flex items-center rounded-r-lg border border-l-0 border-input bg-muted px-3 text-sm font-bold text-muted-foreground select-none">
                @gmail.com
              </span>
            </div>
            {errors.email && (
              <p className="text-xs text-destructive font-bold">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-bold text-foreground">
              Senha *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mín. 6 caracteres (1 letra + 1 número)"
                className={`w-full rounded-lg border px-4 py-3 pr-12 text-base bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                  errors.password ? "border-destructive" : "border-input"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive font-bold">
                {errors.password}
              </p>
            )}
          </div>

          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-foreground">
                  Cargo *
                </label>
                <select
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className={`w-full rounded-lg border px-4 py-3 text-base bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                    errors.cargo ? "border-destructive" : "border-input"
                  }`}
                >
                  <option value="">Selecione seu cargo</option>
                  {CARGOS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.cargo && (
                  <p className="text-xs text-destructive font-bold">
                    {errors.cargo}
                  </p>
                )}
              </div>

              {cargo === "Outro" && (
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-foreground">
                    Qual cargo? *
                  </label>
                  <input
                    type="text"
                    value={cargoCustom}
                    onChange={(e) => setCargoCustom(e.target.value)}
                    placeholder="Digite seu cargo"
                    className={`w-full rounded-lg border px-4 py-3 text-base bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.cargoCustom ? "border-destructive" : "border-input"
                    }`}
                  />
                  {errors.cargoCustom && (
                    <p className="text-xs text-destructive font-bold">
                      {errors.cargoCustom}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-primary py-4 text-base font-heading font-bold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting
              ? "Aguarde..."
              : isLogin
              ? "Entrar"
              : "Criar Conta"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="font-bold text-primary hover:underline"
            >
              {isLogin ? "Criar conta" : "Fazer login"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
