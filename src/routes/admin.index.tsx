import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/site/RequireAuth";
import { Loading, PageHeader, StatusBadge } from "@/components/site/States";
import { Button } from "@/components/ui/button";
import { formatBRL, formatDate } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — Lumen Print" },
      { name: "description", content: "Gerencie o status dos pedidos da Lumen Print." },
    ],
  }),
  component: AdminPage,
});

const statuses = [
  { value: "aguardandoPersonalizacao", label: "Aguardando personalização" },
  { value: "aguardandoAprovacao", label: "Aguardando aprovação" },
  { value: "emProducao", label: "Em produção" },
  { value: "concluido", label: "Concluído" },
] as const;

function AdminPage() {
  const qc = useQueryClient();
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pedidos")
        .select("id, numero_pedido, status, valor_total, criado_em, nome_cliente, telefone_cliente")
        .order("criado_em", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const changeStatus = async (id: string, status: (typeof statuses)[number]["value"]) => {
    const { error } = await (supabase as any).from("pedidos").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message || "Não foi possível atualizar o pedido.");
      return;
    }
    toast.success("Status do pedido atualizado.");
    await qc.invalidateQueries({ queryKey: ["admin-orders"] });
    await qc.invalidateQueries({ queryKey: ["my-orders"] });
    await qc.invalidateQueries({ queryKey: ["order", id] });
  };

  return (
    <RequireAuth admin>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <PageHeader eyebrow="Equipe Lumen Print" title="Painel de pedidos">
          Consulte os pedidos recentes e mantenha o cliente informado sobre cada etapa.
        </PageHeader>
        {orders.isLoading ? <Loading label="Carregando pedidos..." /> : orders.error ? (
          <div className="rounded-xl border border-destructive/40 p-5 text-sm">
            <p>Não foi possível carregar os pedidos.</p>
            <Button variant="outline" className="mt-3" onClick={() => orders.refetch()}>Tentar novamente</Button>
          </div>
        ) : !orders.data?.length ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">Ainda não há pedidos registrados.</div>
        ) : (
          <div className="space-y-3">
            {orders.data.map((order) => (
              <article key={order.id} className="grid gap-4 rounded-2xl border border-border bg-card p-5 lg:grid-cols-[1fr_220px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2><Link to="/conta/pedidos/$id" params={{ id: order.id }} className="font-semibold underline decoration-primary/40 underline-offset-4 hover:text-primary">Pedido #{order.numero_pedido}</Link></h2>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{"Pedido"} · {formatDate(order.criado_em)}</p>
                  <p className="mt-2 text-sm">{order.nome_cliente} · {order.telefone_cliente}</p>
                  <p className="mt-1 font-semibold">{formatBRL(order.valor_total)}</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor={`status-${order.id}`} className="text-xs font-medium text-muted-foreground">Atualizar status</label>
                  <select
                    id={`status-${order.id}`}
                    value={order.status}
                    onChange={(e) => changeStatus(order.id, e.target.value as (typeof statuses)[number]["value"])}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                  </select>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
