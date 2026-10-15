import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Search } from "lucide-react";
import { categoriesQuery, productsQuery, useImageUrls } from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";
import { Empty, Loading, PageHeader } from "@/components/site/States";
import { Input } from "@/components/ui/input";

const search = z.object({
  q: z.string().optional(),
  categoria: z.string().optional(),
  ordem: z.enum(["recentes", "menor", "maior", "nome"]).optional(),
  encomenda: z.boolean().optional(),
});

export const Route = createFileRoute("/produtos/")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Catálogo — Lumen Print" },
      { name: "description", content: "Troféus, presentes personalizados, decoração e acessórios feitos com impressão 3D e corte a laser." },
      { property: "og:title", content: "Catálogo — Lumen Print" },
      { property: "og:description", content: "Explore troféus e produtos personalizados da Lumen Print." },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/produtos/" });
  const set = (patch: Partial<z.infer<typeof search>>) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  const { data: products, isLoading, error } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);

  const q = (s.q ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let list = (products ?? []).filter((p) => {
    if (s.categoria && p.categories?.slug !== s.categoria) return false;
    if (s.encomenda && !p.made_to_order) return false;
    if (q) {
      const hay = `${p.name} ${p.description ?? ""}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const ordem = s.ordem ?? "recentes";
  list = [...list].sort((a, b) => {
    if (ordem === "nome") return a.name.localeCompare(b.name, "pt-BR");
    if (ordem === "menor") return (a.price ?? Infinity) - (b.price ?? Infinity);
    if (ordem === "maior") return (b.price ?? -1) - (a.price ?? -1);
    return 0;
  });
  const { data: urls = {} } = useImageUrls(list.map((p) => p.images[0]).filter(Boolean) as string[]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <PageHeader eyebrow="Catálogo" title="Produtos Lumen Print" />
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <label htmlFor="busca" className="sr-only">Pesquisar produtos</label>
          <Input id="busca" placeholder="Pesquisar produtos..." className="pl-9" value={s.q ?? ""} onChange={(e) => set({ q: e.target.value || undefined })} />
        </div>
        <label className="sr-only" htmlFor="ordem">Ordenar por</label>
        <select id="ordem" value={ordem} onChange={(e) => set({ ordem: e.target.value as "recentes" | "menor" | "maior" | "nome" })} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="recentes">Mais recentes</option>
          <option value="menor">Menor preço</option>
          <option value="maior">Maior preço</option>
          <option value="nome">Nome (A–Z)</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={!!s.encomenda} onChange={(e) => set({ encomenda: e.target.checked || undefined })} className="accent-primary" />
          Somente sob encomenda
        </label>
      </div>
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
        <Chip active={!s.categoria} onClick={() => set({ categoria: undefined })}>Todas</Chip>
        {categories.map((c) => (
          <Chip key={c.id} active={s.categoria === c.slug} onClick={() => set({ categoria: c.slug })}>{c.name}</Chip>
        ))}
      </div>
      {isLoading ? (
        <Loading label="Carregando produtos..." />
      ) : error ? (
        <Empty title="Não foi possível carregar o catálogo">Tente novamente em instantes.</Empty>
      ) : list.length === 0 ? (
        <Empty title="Nenhum produto encontrado">Ajuste os filtros ou solicite um projeto sob encomenda.</Empty>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} slug={p.slug} name={p.name} price={p.price} category={p.categories?.name} imageUrl={urls[p.images[0] ?? ""]} madeToOrder={p.made_to_order} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${active ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}
