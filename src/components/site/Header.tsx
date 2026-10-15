import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, ShoppingBag, User, LogOut, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Lumen Print — início">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-brand shadow-glow">
        <span className="h-3 w-3 rotate-45 rounded-sm bg-background" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">
        Lumen<span className="text-primary-glow">Print</span>
      </span>
    </Link>
  );
}

const nav = [
  { to: "/produtos", label: "Catálogo" },
  { to: "/encomenda", label: "Sob encomenda" },
  { to: "/conta", label: "Minha conta" },
] as const;

export function Header() {
  const { user, isAdmin } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="rounded-md px-3 py-2 text-sm text-primary-glow hover:text-foreground">
              Painel
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label={`Carrinho, ${count} itens`}>
            <Link to="/carrinho" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="icon" aria-label="Minha conta" className="hidden sm:inline-flex">
                <Link to="/conta">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair" className="hidden sm:inline-flex">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link to="/entrar">Entrar</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Abrir menu" aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-border/60 px-4 py-3 md:hidden" aria-label="Menu móvel">
          <div className="flex flex-col gap-1">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-secondary">
                {n.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-primary-glow hover:bg-secondary">
                <ShieldCheck className="h-4 w-4" /> Painel administrativo
              </Link>
            )}
            {user ? (
              <>
                <Link to="/conta" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-secondary">
                  Minha conta
                </Link>
                <button onClick={signOut} className="rounded-md px-3 py-2 text-left text-sm hover:bg-secondary">
                  Sair
                </button>
              </>
            ) : (
              <Link to="/entrar" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-secondary">
                Entrar ou criar conta
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
