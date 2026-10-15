import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/site/RequireAuth";
import { PageHeader, Empty, Loading, StatusBadge } from "@/components/site/States";
import { Button } from "@/components/ui/button";
import { formatBRL, formatDate } from "@/lib/format";

export const Route = createFileRoute("/conta/")({
  head: () => ({
    meta: [
      { title: "Minha conta — Lumen Print" },
      { name: "description", content: "Acompanhe seus pedidos e o atendimento da Lumen Print." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const orders = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, number, kind, status, total, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <RequireAuth>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <PageHeader eyebrow="Área do cliente" title="Meus pedidos">
          Consulte o andamento das suas compras e acompanhe as conversas com a equipe.
        </PageHeader>
        {orders.isLoading ? <Loading label="Carregando seus pedidos..." /> : orders.error ? (
          <div className="rounded-xl border border-destructive/40 p-5 text-sm">
            <p>Não foi possível carregar seus pedidos agora.</p>
            <Button variant="outline" className="mt-3" onClick={() => orders.refetch()}>Tentar novamente</Button>
          </div>
        ) : !orders.data?.length ? (
          <Empty title="Você ainda não tem pedidos">
            <p>Quando fizer uma compra ou solicitar um projeto personalizado, ele aparecerá aqui.</p>
            <Button asChild className="mt-4"><Link to="/produtos">Explorar catálogo</Link></Button>
          </Empty>
        ) : (
          <div className="space-y-3">
            {orders.data.map((order) => (
              <Link key={order.id} to="/conta/pedidos/$id" params={{ id: order.id }} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary"><PackageSearch className="h-5 w-5 text-primary-glow" aria-hidden /></span>
                  <div>
                    <p className="font-semibold">Pedido #{order.number}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{order.kind === "encomenda" ? "Projeto sob encomenda" : "Compra"} · {formatDate(order.created_at)}</p>
                    <div className="mt-2"><StatusBadge status={order.status} /></div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="font-semibold">{formatBRL(order.total)}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
