const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (v: number | string | null | undefined) =>
  v == null || v === "" ? "Sob consulta" : brl.format(Number(v));

export const formatDate = (d: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

export function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function formatCEP(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const STATUS_LABEL: Record<string, string> = {
  aguardando_personalizacao: "Aguardando personalização",
  aguardando_aprovacao: "Aguardando aprovação",
  em_producao: "Em produção",
  concluido: "Concluído",
  cancelado: "Cancelado",
};
export const STATUS_ORDER = [
  "aguardando_personalizacao",
  "aguardando_aprovacao",
  "em_producao",
  "concluido",
  "cancelado",
] as const;

export const errorMessage = (e: unknown) =>
  e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : "Ocorreu um erro inesperado. Tente novamente.";
