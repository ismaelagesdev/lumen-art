import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/site/RequireAuth";
import { Empty, Loading, PageHeader, StatusBadge } from "@/components/site/States";
import { OrderChat } from "@/components/site/OrderChat";
import { Button } from "@/components/ui/button";
import { formatBRL, formatDate } from "@/lib/format";

export const Route = createFileRoute("/conta/pedidos/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes do pedido — Lumen Print" },
      { name: "description", content: "Acompanhe o status, os itens e o atendimento do seu pedido Lumen Print." },
    ],
  }),
  component: OrderDetailsPage,
});

function OrderDetailsPage() {
  const { id } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const order = useQuery({
    queryKey: ["order", id, user?.id, isAdmin],
    enabled: !!user && !!id,
    queryFn: async () => {
      let query = (supabase as any).from("pedidos").select("*").eq("id", id);
      // A equipe pode abrir qualquer pedido; clientes continuam limitados aos próprios pedidos pela consulta e pelo RLS.
      if (!isAdmin) query = query.eq("cliente_id", user!.id);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  return (
    <RequireAuth>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Button asChild variant="ghost" className="mb-5 -ml-3"><Link to="/conta"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos pedidos</Link></Button>
        {order.isLoading ? <Loading label="Carregando pedido..." /> : order.error ? (
          <Empty title="Não foi possível carregar o pedido">Tente novamente em instantes.</Empty>
        ) : !order.data ? (
          <Empty title="Pedido não encontrado">Este pedido não existe ou você não tem permissão para visualizá-lo.</Empty>
        ) : (
          <>
            <PageHeader eyebrow={"Pedido"} title={`Pedido #${order.data.numero_pedido}`}>
              Criado em {formatDate(order.data.criado_em)}.
            </PageHeader>
            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                <section className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-semibold">Andamento</h2>
                    <StatusBadge status={order.data.status} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    A equipe atualizará o status e poderá solicitar informações adicionais pelo atendimento abaixo.
                  </p>
                </section>
                {order.data.observacoes && <section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold">Observações e entrega</h2><p className="mt-3 whitespace-pre-line break-words text-sm text-muted-foreground">{order.data.observacoes}</p></section>}
                <OrderChat orderId={id} />
              </div>
              <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5">
                <h2 className="font-semibold">Resumo do pedido</h2>
                {Array.isArray(order.data.itens) && order.data.itens.length ? (
                  <ul className="space-y-3">
                    {order.data.itens.map((item: { id?: number; nome?: string; quantidade?: number; preco?: number; subtotal?: number; cor?: string | null; personalizado?: boolean }, index: number) => (
                      <li key={`${item.id ?? "item"}-${index}`} className="flex gap-3 text-sm">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary"><Package className="h-4 w-4" aria-hidden /></span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{item.quantidade ?? 1}× {item.nome ?? "Produto"}</p>
                          {item.cor && <p className="text-xs text-muted-foreground">{item.cor}</p>}
                          <p className="text-xs text-muted-foreground">{formatBRL(item.preco ?? 0)} cada</p>
                          <p className="text-sm">{formatBRL(item.subtotal ?? Number(item.preco ?? 0) * Number(item.quantidade ?? 1))}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">Nenhum item detalhado neste pedido.</p>}
                <div className="space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(order.data.valor_total)}</span></div>
                  <div className="flex justify-between text-base font-semibold"><span>Total do pedido</span><span>{formatBRL(order.data.valor_total)}</span></div>
                  <p className="text-xs text-muted-foreground">Frete e forma de pagamento são confirmados pela equipe antes da conclusão.</p>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </RequireAuth>
  );
}
