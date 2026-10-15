import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Layers, Scissors, Sparkles, Trophy } from "lucide-react";
import heroImg from "@/assets/hero-trofeu.jpg";
import { Button } from "@/components/ui/button";
import { categoriesQuery, productsQuery, useImageUrls } from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen Print — Troféus personalizados para campeonatos e eventos" },
      { name: "description", content: "Troféus personalizados para sinuca, truco, torneios e eventos. Impressão 3D e corte a laser sob medida." },
      { property: "og:title", content: "Lumen Print — Troféus personalizados" },
      { property: "og:description", content: "Troféus para sinuca, truco e torneios, fabricados com impressão 3D e corte a laser." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: products = [] } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const featured = (products.filter((p) => p.featured).length ? products.filter((p) => p.featured) : products).slice(0, 8);
  const { data: urls = {} } = useImageUrls(featured.map((p) => p.images[0]).filter(Boolean) as string[]);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-lines opacity-60 [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <p className="eyebrow">Impressão 3D · Corte a laser · Sob medida</p>
            <h1 className="text-4xl font-semibold leading-[1.05] sm:text-6xl">
              Troféus que fazem o <span className="text-gradient">campeão</span> brilhar.
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Troféus personalizados para campeonatos de sinuca, truco, torneios e eventos — projetados e fabricados com precisão.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/produtos" search={{ categoria: "trofeus" }}>
                  Ver troféus <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/encomenda">Solicitar projeto sob encomenda</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-glow blur-2xl" aria-hidden />
            <img src={heroImg} alt="Troféu de sinuca facetado em preto com bordas iluminadas em roxo" width={1280} height={1280} className="relative mx-auto w-full max-w-lg rounded-3xl border border-border" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Trophy, t: "Troféus personalizados", d: "Nome do evento, categoria, colocação e logotipo gravados em cada peça." },
            { icon: Layers, t: "Impressão 3D", d: "Formas exclusivas e detalhes que a fabricação tradicional não alcança." },
            { icon: Scissors, t: "Corte a laser", d: "Acrílico, MDF e madeira com acabamento preciso e gravação nítida." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-border bg-card p-6">
              <Icon className="h-6 w-6 text-primary-glow" aria-hidden />
              <h2 className="mt-4 font-sans text-lg font-semibold">{t}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Destaques</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Produtos em evidência</h2>
          </div>
          <Link to="/produtos" className="text-sm text-primary-glow hover:underline">Ver catálogo completo</Link>
        </div>
        {featured.length ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} slug={p.slug} name={p.name} price={p.price} category={p.categories?.name} imageUrl={urls[p.images[0] ?? ""]} madeToOrder={p.made_to_order} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            O catálogo está sendo preparado. Enquanto isso, conte para nós o que você precisa.
            <div className="mt-4">
              <Button asChild variant="outline"><Link to="/encomenda">Solicitar orçamento</Link></Button>
            </div>
          </div>
        )}
      </section>

      {categories.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
          <p className="eyebrow">Categorias</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {categories.map((c) => (
              <Link key={c.id} to="/produtos" search={{ categoria: c.slug }} className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/60">
                <span className="font-display text-base">{c.name}</span>
                {c.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-12">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-brand opacity-25 blur-3xl" aria-hidden />
          <Sparkles className="h-6 w-6 text-ember" aria-hidden />
          <h2 className="mt-4 max-w-xl text-2xl font-semibold sm:text-3xl">Tem uma ideia diferente? A gente fabrica.</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Envie referências, logotipos e medidas. Nossa equipe analisa e responde pelo atendimento da sua conta.
          </p>
          <Button asChild className="mt-6" size="lg"><Link to="/encomenda">Começar meu projeto</Link></Button>
        </div>
      </section>
    </>
  );
}
