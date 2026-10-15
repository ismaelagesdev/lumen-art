import { Link } from "@tanstack/react-router";
import { Box } from "lucide-react";
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
      className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/60 hover:shadow-glow"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {imageUrl ? (
          <img src={imageUrl} alt={name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center grid-lines text-muted-foreground">
            <Box className="h-10 w-10" aria-hidden />
          </div>
        )}
        {madeToOrder && (
          <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium backdrop-blur">
            Sob encomenda
          </span>
        )}
      </div>
      <div className="space-y-1 p-4">
        {category && <p className="eyebrow">{category}</p>}
        <h3 className="font-sans text-base font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">{price == null ? "Sob consulta" : formatBRL(price)}</p>
      </div>
    </Link>
  );
}
