import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Box, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { productQuery, useImageUrls, type Choice } from "@/lib/catalog";
import { formatBRL } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empty, Loading } from "@/components/site/States";

export const Route = createFileRoute("/produtos/$slug")({
  head: () => ({
    meta: [
      { title: "Produto — Lumen Print" },
      { name: "description", content: "Detalhes, opções de personalização e preço do produto Lumen Print." },
      { property: "og:title", content: "Produto — Lumen Print" },
      { property: "og:description", content: "Produto personalizado com impressão 3D e corte a laser." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p, isLoading } = useQuery(productQuery(slug));
  const { data: urls = {} } = useImageUrls(p?.images ?? []);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [opts, setOpts] = useState<Record<string, string>>({});
  const cart = useCart();
  const navigate = useNavigate();

  if (isLoading) return <Loading />;
  if (!p)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Empty title="Produto não encontrado"><Link to="/produtos" className="text-primary-glow">Voltar ao catálogo</Link></Empty>
      </div>
    );

  const options = (p.product_options ?? []).filter((o) => o.active).sort((a, b) => a.sort_order - b.sort_order);
  const delta = options.reduce((s, o) => {
    if (o.kind !== "select") return s;
    const c = (o.choices as Choice[]).find((c) => c.label === opts[o.id]);
    return s + Number(c?.price_delta ?? 0);
  }, 0);
  const unit = p.price == null ? null : Number(p.price) + delta;

  const addToCart = (goToCart: boolean) => {
    const missing = options.find((o) => o.required && !opts[o.id]?.trim());
    if (missing) return toast.error(`Preencha a opção "${missing.name}".`);
    if (unit == null) return;
    cart.add({
      product_id: p.id,
      slug: p.slug,
      name: p.name,
      image: p.images[0],
      unit_price: unit,
      quantity: qty,
      options: Object.fromEntries(Object.entries(opts).filter(([, v]) => v.trim())),
      option_labels: options.filter((o) => opts[o.id]?.trim()).map((o) => ({ name: o.name, value: opts[o.id] })),
    });
    toast.success("Produto adicionado ao carrinho.");
    if (goToCart) navigate({ to: "/carrinho" });
  };

  const img = urls[p.images[active]];
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2">
      <div className="space-y-3">
        <div className="aspect-square overflow-hidden rounded-3xl border border-border bg-secondary">
          {img ? <img src={img} alt={p.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center grid-lines"><Box className="h-12 w-12 text-muted-foreground" aria-hidden /></div>}
        </div>
        {p.images.length > 1 && (
          <div className="flex gap-2">
            {p.images.map((path, i) => (
              <button key={path} onClick={() => setActive(i)} aria-label={`Ver imagem ${i + 1}`} className={`h-16 w-16 overflow-hidden rounded-lg border ${i === active ? "border-primary" : "border-border"}`}>
                {urls[path] && <img src={urls[path]} alt="" className="h-full w-full object-cover" />}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-6">
        <div>
          {p.categories && <p className="eyebrow">{p.categories.name}</p>}
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{p.name}</h1>
          <p className="mt-3 text-2xl font-semibold text-primary-glow">{unit == null ? "Sob consulta" : formatBRL(unit)}</p>
        </div>
        {p.description && <p className="whitespace-pre-line text-muted-foreground">{p.description}</p>}

        {options.length > 0 && unit != null && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            {options.map((o) => (
              <div key={o.id} className="space-y-2">
                <label htmlFor={`opt-${o.id}`} className="text-sm font-medium">
                  {o.name} {o.required && <span className="text-magenta">*</span>}
                </label>
                {o.kind === "select" ? (
                  <select id={`opt-${o.id}`} value={opts[o.id] ?? ""} onChange={(e) => setOpts({ ...opts, [o.id]: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Selecione</option>
                    {(o.choices as Choice[]).map((c) => (
                      <option key={c.label} value={c.label}>
                        {c.label}{Number(c.price_delta) ? ` (+ ${formatBRL(c.price_delta!)})` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input id={`opt-${o.id}`} maxLength={300} value={opts[o.id] ?? ""} onChange={(e) => setOpts({ ...opts, [o.id]: e.target.value })} placeholder="Digite aqui" />
                )}
              </div>
            ))}
          </div>
        )}

        {p.customization_info && (
          <div className="rounded-2xl border border-primary/30 bg-accent/40 p-5 text-sm">
            <p className="mb-1 font-semibold">Informações de personalização</p>
            <p className="whitespace-pre-line text-muted-foreground">{p.customization_info}</p>
          </div>
        )}

        {unit != null ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-md border border-input" role="group" aria-label="Quantidade">
              <Button variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Diminuir"><Minus className="h-4 w-4" /></Button>
              <input aria-label="Quantidade" value={qty} onChange={(e) => setQty(Math.max(1, Math.min(1000, Number(e.target.value.replace(/\D/g, "")) || 1)))} className="w-12 bg-transparent text-center text-sm" inputMode="numeric" />
              <Button variant="ghost" size="icon" onClick={() => setQty(Math.min(1000, qty + 1))} aria-label="Aumentar"><Plus className="h-4 w-4" /></Button>
            </div>
            <Button size="lg" onClick={() => addToCart(false)}>Adicionar ao carrinho</Button>
            <Button size="lg" variant="outline" onClick={() => addToCart(true)}>Comprar agora</Button>
          </div>
        ) : (
          <Button asChild size="lg"><Link to="/encomenda" search={{ produto: p.id }}>Solicitar orçamento</Link></Button>
        )}
        {p.made_to_order && unit != null && (
          <p className="text-sm text-muted-foreground">
            Precisa de algo diferente? <Link to="/encomenda" search={{ produto: p.id }} className="text-primary-glow underline">Solicite sob encomenda</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
