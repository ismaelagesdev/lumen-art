import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function Loading({ label = "Carregando..." }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <p className="font-display text-lg">{title}</p>
      {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    aguardando_personalizacao: "bg-ember/15 text-ember",
    aguardandoPersonalizacao: "bg-ember/15 text-ember",
    aguardando_aprovacao: "bg-magenta/15 text-magenta",
    aguardandoAprovacao: "bg-magenta/15 text-magenta",
    em_producao: "bg-primary/20 text-primary-glow",
    emProducao: "bg-primary/20 text-primary-glow",
    concluido: "bg-success/15 text-success",
    cancelado: "bg-destructive/15 text-destructive",
  };
  const labels: Record<string, string> = {
    aguardando_personalizacao: "Aguardando personalização",
    aguardandoPersonalizacao: "Aguardando personalização",
    aguardando_aprovacao: "Aguardando aprovação",
    aguardandoAprovacao: "Aguardando aprovação",
    em_producao: "Em produção",
    emProducao: "Em produção",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cls[status] ?? ""}`}>{labels[status] ?? status}</span>;
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-8 space-y-2">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
      {children && <div className="max-w-2xl text-muted-foreground">{children}</div>}
    </div>
  );
}
