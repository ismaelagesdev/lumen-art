import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Clock3, CircleX, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/site/States";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pagamento/retorno")({
  head: () => ({
    meta: [
      { title: "Retorno do pagamento — Lumen Print" },
      { name: "description", content: "Consulte seu pedido Lumen Print após retornar do ambiente de pagamento." },
    ],
  }),
  component: PaymentReturnPage,
});

function PaymentReturnPage() {
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const status = params.get("status");
  const pending = status === "pending";
  const failure = status === "failure";

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-10">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-secondary">
          {pending ? <Clock3 className="h-6 w-6 text-primary-glow" aria-hidden /> : failure ? <CircleX className="h-6 w-6 text-destructive" aria-hidden /> : <CheckCircle2 className="h-6 w-6 text-primary-glow" aria-hidden />}
        </div>
        <PageHeader eyebrow="Mercado Pago" title={pending ? "Pagamento em processamento" : failure ? "Pagamento não concluído" : "Retorno do pagamento"}>
          {pending
            ? "O provedor informou que o pagamento ainda está em processamento. Confira o pedido novamente mais tarde."
            : failure
              ? "O pagamento não foi concluído. O pedido pode continuar registrado; consulte os detalhes antes de tentar novamente."
              : "Você voltou do ambiente de pagamento. O retorno do navegador, sozinho, não confirma que o pagamento foi aprovado."}
        </PageHeader>
        <div className="mb-6 flex gap-3 rounded-xl border border-border p-4 text-sm text-muted-foreground">
          <ShieldCheck className="h-5 w-5 shrink-0 text-primary-glow" aria-hidden />
          <p>A confirmação oficial depende da notificação validada do Mercado Pago. Não faça outro pagamento apenas com base nesta página; confira o pedido ou fale com a equipe.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link to="/conta">Consultar meus pedidos</Link></Button>
          <Button asChild variant="outline"><Link to="/produtos">Voltar ao catálogo</Link></Button>
        </div>
      </div>
    </div>
  );
}
