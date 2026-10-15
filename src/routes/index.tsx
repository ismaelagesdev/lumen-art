import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Layers, Scissors, Sparkles, Trophy, WandSparkles, PackageCheck } from "lucide-react";
import heroImg from "@/assets/hero-trofeu.jpg";
import { Button } from "@/components/ui/button";
import { categoriesQuery, productsQuery, useImageUrls } from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen Print — Troféus e peças com design exclusivo" },
      { name: "description", content: "Troféus para sinuca, truco e eventos, além de peças criativas produzidas com impressão 3D e corte a laser." },
      { property: "og:title", content: "Lumen Print — Troféus e peças com design exclusivo" },
      { property: "og:description", content: "Peças com personalidade para premiar, presentear e transformar ideias em objetos." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: products = [] } = useQuery(productsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery);
  const featured = (products.filter((p) => p.featured).length ? products.filter((p) => p.featured) : products).slice(0, 4);
  const { data: urls = {} } = useImageUrls(featured.map((p) => p.images[0]).filter(Boolean) as string[]);

  return (
    <>
      <section className="hero-surface relative isolate overflow-hidden">
        <div className="hero-orb hero-orb-one" aria-hidden="true" />
        <div className="hero-orb hero-orb-two" aria-hidden="true" />
        <div className="absolute inset-0 grid-lines opacity-40 [mask-image:radial-gradient(70%_70%_at_50%_35%,black,transparent)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-[1.02fr_.98fr] md:py-24 lg:gap-16">
          <div className="hero-copy space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary-glow">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Design autoral · Impressão 3D · Corte a laser
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
              Ideias que ganham forma. <span className="text-gradient">Conquistas que ficam.</span>
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Troféus e peças criativas para campeonatos, eventos e presentes especiais — com visual marcante e atenção aos detalhes.
            </p>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <Button asChild size="lg" className="group">
                <Link to="/produtos">
                  Explorar catálogo <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/encomenda">Tenho uma ideia para criar</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Trophy className="h-4 w-4 text-ember" /> Premiações com personalidade</span>
              <span className="inline-flex items-center gap-2"><WandSparkles className="h-4 w-4 text-primary-glow" /> Peças criativas e funcionais</span>
            </div>
          </div>
          <div className="hero-art relative mx-auto w-full max-w-xl">
            <div className="hero-art-halo absolute inset-8 rounded-full blur-3xl" aria-hidden="true" />
            <div className="relative rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.015] p-3 shadow-2xl">
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#121116]">
                <img src={heroImg} alt="Troféu de sinuca com acabamento escuro e detalhes iluminados" width={1280} height={1280} fetchPriority="high" className="aspect-square w-full object-cover transition-transform duration-700 hover:scale-[1.025]" />
              </div>
              <div className="absolute -bottom-4 left-5 right-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#19171f]/95 px-4 py-3 shadow-xl backdrop-blur-xl sm:left-8 sm:right-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-primary-glow">Feito para marcar</p>
                  <p className="mt-1 text-sm font-semibold">Do primeiro lugar ao detalhe final</p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white"><Trophy className="h-5 w-5" /></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Trophy, n: "01", t: "Premiações memoráveis", d: "Troféus para valorizar o esforço, a competição e cada conquista." },
            { icon: Layers, n: "02", t: "Impressão 3D", d: "Geometrias, volumes e detalhes que dão personalidade a cada peça." },
            { icon: Scissors, n: "03", t: "Corte a laser", d: "Recortes e gravações para compor projetos com acabamento preciso." },
          ].map(({ icon: Icon, n, t, d }) => (
            <article key={n} className="feature-card group rounded-2xl border border-border/80 bg-card/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary-glow transition-colors group-hover:bg-primary/20"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span className="font-mono text-xs tracking-widest text-muted-foreground/60">{n}</span>
              </div>
              <h2 className="mt-5 text-lg font-semibold">{t}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Escolhas em destaque</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Peças que chamam atenção</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Conheça os produtos disponíveis e encontre a peça certa para sua competição, seu espaço ou seu presente.</p>
          </div>
          <Link to="/produtos" className="inline-flex items-center gap-2 self-start text-sm font-semibold text-primary-glow transition-colors hover:text-foreground sm:self-auto">
            Ver todo o catálogo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {featured.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} slug={p.slug} name={p.name} price={p.price} category={p.categories?.name} imageUrl={urls[p.images[0] ?? ""]} madeToOrder={p.made_to_order} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <PackageCheck className="mx-auto h-8 w-8 text-primary-glow" aria-hidden="true" />
            <h3 className="mt-4 font-semibold">Estamos preparando o catálogo</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Enquanto os produtos são carregados, você já pode contar sua ideia para a equipe Lumen Print.</p>
            <Button asChild variant="outline" className="mt-5"><Link to="/encomenda">Solicitar orçamento</Link></Button>
          </div>
        )}
      </section>

      {categories.length > 0 && (
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
          <div className="mb-6">
            <p className="eyebrow">Explore por categoria</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Encontre o que você procura</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {categories.map((c, i) => (
              <Link key={c.id} to="/produtos" search={{ categoria: c.slug }} className="category-tile group rounded-2xl border border-border bg-card/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:bg-accent/40">
                <span className="font-mono text-xs text-primary-glow">0{i + 1}</span>
                <span className="mt-3 block font-display text-sm leading-6 sm:text-base">{c.name}</span>
                {c.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{c.description}</p>}
                <ArrowRight className="mt-4 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary-glow" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <div className="custom-cta relative isolate overflow-hidden rounded-3xl border border-primary/25 bg-card p-7 sm:p-12">
          <div className="absolute -right-12 -top-24 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-24 left-1/3 -z-10 h-56 w-56 rounded-full bg-magenta/10 blur-3xl" aria-hidden="true" />
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-sm text-primary-glow"><Sparkles className="h-4 w-4" /> Projetos sob encomenda</div>
              <h2 className="mt-3 max-w-2xl text-2xl font-semibold sm:text-3xl">Sua ideia merece sair do papel.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Conte o que imaginou, compartilhe referências e descreva os detalhes. A equipe poderá avaliar a melhor forma de transformar sua ideia em uma peça.</p>
            </div>
            <Button asChild size="lg" className="group w-full md:w-auto"><Link to="/encomenda">Começar um projeto <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
