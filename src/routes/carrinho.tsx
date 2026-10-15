import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useImageUrls } from "@/lib/catalog";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Empty, PageHeader } from "@/components/site/States";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — Lumen Print" },
      { name: "description", content: "Revise os produtos do seu carrinho na Lumen Print." },
      { property: "og:title", content: "Carrinho — Lumen Print" },
      { property: "og:description", content: "Seu carrinho de compras Lumen Print." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();
  const { data: urls = {} } = useImageUrls(items.map((i) => i.image).filter(Boolean) as string[]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <PageHeader eyebrow="Compra" title="Seu carrinho" />
      {items.length === 0 ? (
        <Empty title="Seu carrinho está vazio">
          <Link to="/produtos" className="text-primary-glow underline">Explorar o catálogo</Link>
        </Empty>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.key} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
                  {i.image && urls[i.image] ? <img src={urls[i.image]} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Box className="h-6 w-6 text-muted-foreground" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <Link to="/produtos/$slug" params={{ slug: i.slug }} className="font-semibold hover:underline">{i.name}</Link>
                  {i.option_labels.map((o) => (
                    <p key={o.name} className="text-xs text-muted-foreground">{o.name}: {o.value}</p>
                  ))}
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded-md border border-input">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty(i.key, i.quantity - 1)} aria-label="Diminuir quantidade"><Minus className="h-3 w-3" /></Button>
                      <span className="w-8 text-center text-sm" aria-label="Quantidade">{i.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty(i.key, i.quantity + 1)} aria-label="Aumentar quantidade"><Plus className="h-3 w-3" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(i.key)} aria-label={`Remover ${i.name}`}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatBRL(i.unit_price * i.quantity)}</p>
                  <p className="text-xs text-muted-foreground">{formatBRL(i.unit_price)} cada</p>
                </div>
              </li>
            ))}
          </ul>
          <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
            <div className="flex justify-between text-sm text-muted-foreground"><span>Frete</span><span>A combinar</span></div>
            <div className="flex justify-between border-t border-border pt-4 text-lg font-semibold"><span>Total</span><span>{formatBRL(subtotal)}</span></div>
            <Button asChild size="lg" className="w-full"><Link to="/finalizar">Finalizar pedido</Link></Button>
            <p className="text-xs text-muted-foreground">Os valores são conferidos novamente no momento da finalização.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
