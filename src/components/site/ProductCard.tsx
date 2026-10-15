import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Box } from "lucide-react";
import { formatBRL } from "@/lib/format";

type Props = {
  slug: string;
  name: string;
  price: number | null;
  category?: string | null | undefined;
  imageUrl?: string | undefined;
  madeToOrder?: boolean;
};

export function ProductCard({ slug, name, price, category, imageUrl, madeToOrder }: Props) {
  return (
    <Link
      to="/produtos/$slug"
      params={{ slug }}
      className="product-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/80 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-glow focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="product-card-image relative aspect-square overflow-hidden bg-[#15131a]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/[0.025]" aria-hidden="true" />
        {imageUrl ? (
          <img src={imageUrl} alt={name} loading="lazy" className="relative h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="grid h-full place-items-center grid-lines text-muted-foreground">
            <Box className="h-10 w-10" aria-hidden="true" />
          </div>
        )}
        {madeToOrder && (
          <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-background/85 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-foreground backdrop-blur">
            Sob encomenda
          </span>
        )}
        <span className="absolute bottom-3 right-3 grid h-8 w-8 translate-y-2 place-items-center rounded-full bg-background/90 text-foreground opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        {category && <p className="eyebrow text-[10px]">{category}</p>}
        <h3 className="line-clamp-2 min-h-[2.75rem] font-sans text-sm font-semibold leading-5 sm:text-base">{name}</h3>
        <div className="mt-auto border-t border-border/70 pt-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{price == null ? "Preço" : "Valor do produto"}</p>
          <p className="mt-1 text-sm font-semibold text-primary-glow sm:text-base">{price == null ? "Sob consulta" : formatBRL(price)}</p>
        </div>
      </div>
    </Link>
  );
}
