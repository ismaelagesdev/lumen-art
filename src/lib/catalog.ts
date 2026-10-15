import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type ProductOption = Database["public"]["Tables"]["product_options"]["Row"];
export type Choice = { label: string; price_delta?: number };

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  retry: 1,
  retryDelay: 1000,
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").eq("active", true).order("sort_order");
    if (error) throw error;
    return data;
  },
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  retry: 1,
  retryDelay: 1000,
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name, slug)")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    retry: 1,
    retryDelay: 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug), product_options(*)")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

/** Gera URLs assinadas para imagens do bucket privado de produtos. */
export function useImageUrls(paths: string[]) {
  return useQuery({
    queryKey: ["img", paths],
    retry: 1,
    retryDelay: 1000,
    enabled: paths.length > 0,
    staleTime: 1000 * 60 * 50,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("product-images").createSignedUrls(paths, 3600);
      if (error) throw error;
      const map: Record<string, string> = {};
      data.forEach((d) => d.path && d.signedUrl && (map[d.path] = d.signedUrl));
      return map;
    },
  });
}
