import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { Logo } from "./Header";
import { whatsappLink } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Troféus personalizados, impressão 3D e corte a laser feitos sob medida.
          </p>
        </div>
        <nav className="flex flex-col gap-2 text-sm" aria-label="Rodapé">
          <span className="eyebrow mb-1">Navegação</span>
          <Link to="/produtos" className="text-muted-foreground hover:text-foreground">Catálogo</Link>
          <Link to="/encomenda" className="text-muted-foreground hover:text-foreground">Solicitar sob encomenda</Link>
          <Link to="/conta" className="text-muted-foreground hover:text-foreground">Meus pedidos e atendimento</Link>
        </nav>
        <WhatsAppLink />
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lumen Print. Todos os direitos reservados.
      </div>
    </footer>
  );
}

function WhatsAppLink() {
  const href = whatsappLink();
  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="eyebrow mb-1">Contato</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <MessageCircle className="h-4 w-4" /> WhatsApp comercial
        </a>
      ) : (
        <span className="text-muted-foreground">Fale com a equipe pelo atendimento da sua conta.</span>
      )}
    </div>
  );
}

export function WhatsAppFloat() {
  const href = whatsappLink();
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Conversar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-success text-background shadow-glow transition-transform hover:scale-105"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
