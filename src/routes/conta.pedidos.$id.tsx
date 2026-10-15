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
  const { user } = useAuth();
  const order = useQuery({
    queryKey: ["order", id, user?.id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const items = useQuery({
    queryKey: ["order-items", id, user?.id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", id);
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
            <PageHeader eyebrow={order.data.kind === "encomenda" ? "Projeto sob encomenda" : "Compra"} title={`Pedido #${order.data.number}`}>
              Criado em {formatDate(order.data.created_at)}.
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
                <OrderChat orderId={id} />
              </div>
              <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5">
                <h2 className="font-semibold">Resumo do pedido</h2>
                {items.isLoading ? <Loading label="Carregando itens..." /> : items.error ? (
                  <p className="text-sm text-muted-foreground">Não foi possível carregar os itens.</p>
                ) : items.data?.length ? (
                  <ul className="space-y-3">
                    {items.data.map((item) => (
                      <li key={item.id} className="flex gap-3 text-sm">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary"><Package className="h-4 w-4" aria-hidden /></span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{item.quantity}× {item.product_name}</p>
                          <p className="text-xs text-muted-foreground">{formatBRL(item.unit_price)} cada</p>
                          <p className="text-sm">{formatBRL(item.line_total)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">Nenhum item detalhado neste pedido.</p>}
                <div className="space-y-2 border-t border-border pt-4 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(order.data.subtotal)}</span></div>
                  <div className="flex justify-between text-base font-semibold"><span>Total estimado</span><span>{formatBRL(order.data.total)}</span></div>
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
