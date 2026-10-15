import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/entrar")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Lumen Print" },
      { name: "description", content: "Acesse sua conta para acompanhar pedidos e conversar com a equipe Lumen Print." },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const { redirect } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Conta criada. Confira seu e-mail para confirmar o cadastro antes de entrar.");
          setMode("login");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }

      toast.success(mode === "signup" ? "Conta criada com sucesso!" : "Login realizado.");
      const destination = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/conta";
      window.location.assign(destination);
    } catch (error) {
      const message = error && typeof error === "object" && "message" in error
        ? String((error as { message: string }).message)
        : "Não foi possível concluir. Tente novamente.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <p className="eyebrow">Área do cliente</p>
        <h1 className="mt-2 text-3xl font-semibold">{mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre para acompanhar seus pedidos e conversar com a equipe Lumen Print.
        </p>
        <div className="mt-6 grid grid-cols-2 rounded-lg bg-secondary p-1" role="group" aria-label="Tipo de acesso">
          <button type="button" onClick={() => setMode("login")} aria-pressed={mode === "login"} className={`rounded-md px-3 py-2 text-sm ${mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Entrar</button>
          <button type="button" onClick={() => setMode("signup")} aria-pressed={mode === "signup"} className={`rounded-md px-3 py-2 text-sm ${mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>Criar conta</button>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" autoComplete="name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-muted-foreground">Use pelo menos 6 caracteres.</p>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>
      </div>
    </div>
  );
}
