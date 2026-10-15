import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type LegacyProductRow = {
  id: number;
  nome: string;
  preco: number | string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

/**
 * Adaptador temporário para o esquema português já existente no Supabase.
 * Não cria tabelas, não altera registros e não depende das tabelas da migração nova.
 */
export type Product = {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  images: string[];
  featured: boolean;
  made_to_order: boolean;
  active: boolean;
  created_at: string;
  description: string | null;
  customization_info: string | null;
  categories: { name: string; slug: string } | null;
  product_options: [];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
};
export type ProductOption = never;
export type Choice = { label: string; price_delta?: number };

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function adaptProduct(row: LegacyProductRow): Product {
  return {
    id: String(row.id),
    name: row.nome,
    slug: slugify(row.nome),
    price: row.preco == null ? null : Number(row.preco),
    images: [],
    featured: row.id === 1 || row.id === 2,
    made_to_order: true,
    active: row.ativo,
    created_at: row.criado_em,
    description: null,
    customization_info: null,
    categories: null,
    product_options: [],
  };
}

type LegacyQueryResult = { data: unknown[] | null; error: { message: string } | null };
type LegacyQuery = {
  select: (columns: string) => {
    eq: (column: string, value: boolean) => {
      order: (column: string, options: { ascending: boolean }) => Promise<LegacyQueryResult>;
    };
  };
};

async function fetchLegacyProducts(): Promise<Product[]> {
  // O cliente gerado não conhece a tabela legada; esta tipagem local evita alterar
  // os tipos gerados do projeto inteiro só para consultar a tabela existente.
  const legacyClient = supabase as unknown as { from: (table: string) => LegacyQuery };
  const { data, error } = await legacyClient
    .from("produtos")
    .select("id, nome, preco, ativo, criado_em, atualizado_em")
    .eq("ativo", true)
    .order("id", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as LegacyProductRow[]).map(adaptProduct);
}

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async (): Promise<Category[]> => [],
  staleTime: 1000 * 60 * 10,
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  retry: 1,
  retryDelay: 1000,
  queryFn: fetchLegacyProducts,
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    retry: 1,
    retryDelay: 1000,
    queryFn: async () => {
      const products = await fetchLegacyProducts();
      return products.find((product) => product.slug === slug) ?? null;
    },
  });

/** Mantido para compatibilidade; os registros legados ainda não possuem imagens associadas. */
export function useImageUrls(paths: string[]) {
  return useQuery({
    queryKey: ["img", paths],
    enabled: false,
    queryFn: async (): Promise<Record<string, string>> => ({}),
  });
}
