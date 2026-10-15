import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Loading } from "./States";

export function RequireAuth({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Entre na sua conta</h1>
        <p className="mt-2 text-muted-foreground">Você precisa estar conectado para acessar esta página.</p>
        <Button asChild className="mt-6"><Link to="/entrar" search={{ redirect: location.pathname }}>Entrar ou criar conta</Link></Button>
      </div>
    );
  if (admin && !isAdmin)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Acesso restrito</h1>
        <p className="mt-2 text-muted-foreground">Esta área é exclusiva para a equipe autorizada da Lumen Print.</p>
        <Button asChild variant="outline" className="mt-6"><Link to="/">Voltar ao início</Link></Button>
      </div>
    );
  return <>{children}</>;
}
