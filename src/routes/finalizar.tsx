import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { errorMessage, formatBRL, formatCEP, formatPhone } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Empty, PageHeader } from "@/components/site/States";
import { RequireAuth } from "@/components/site/RequireAuth";

export const Route = createFileRoute("/finalizar")({
  head: () => ({
    meta: [
      { title: "Finalizar pedido — Lumen Print" },
      { name: "description", content: "Informe seus dados e endereço para concluir o pedido na Lumen Print." },
      { property: "og:title", content: "Finalizar pedido — Lumen Print" },
      { property: "og:description", content: "Conclua seu pedido Lumen Print." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <PageHeader eyebrow="Compra" title="Finalizar pedido" />
      <RequireAuth><Checkout /></RequireAuth>
    </div>
  ),
});

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

function Checkout() {
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    name: (user?.user_metadata?.["full_name"] as string) ?? "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    uf: "",
    notes: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const lookupCep = async (cep: string) => {
    const d = cep.replace(/\D/g, "");
    if (d.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const j = await r.json();
      if (j.erro) { toast.error("CEP não encontrado."); return; }
      setF((p) => ({ ...p, street: j.logradouro || p.street, district: j.bairro || p.district, city: j.localidade || p.city, uf: j.uf || p.uf }));
    } catch {
      /* preenchimento manual */
    }
  };

  if (cart.items.length === 0)
    return <Empty title="Seu carrinho está vazio"><Link to="/produtos" className="text-primary-glow underline">Explorar o catálogo</Link></Empty>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.cep.replace(/\D/g, "").length !== 8) { toast.error("Informe um CEP válido."); return; }
    setBusy(true);
    try {
      const endereco = [
        `Entrega: ${f.street}, ${f.number}`,
        f.complement ? `Complemento: ${f.complement}` : "",
        `Bairro: ${f.district}`,
        `Cidade/UF: ${f.city}/${f.uf}`,
        `CEP: ${f.cep}`,
      ].filter(Boolean).join(" | ");
      const observacoes = [endereco, f.notes.trim()].filter(Boolean).join("\nObservações: ");
      const itens = cart.items.map((item) => ({
        id: item.product_id,
        quantidade: item.quantity,
        cor: item.option_labels.length
          ? item.option_labels.map((option) => `${option.name}: ${option.value}`).join("; ").slice(0, 100)
          : null,
        personalizado: item.option_labels.length > 0,
      }));

      const { data, error } = await supabase.rpc("criar_pedido", {
        p_nome_cliente: f.name,
        p_email_cliente: user?.email ?? null,
        p_telefone_cliente: f.phone,
        p_observacoes: observacoes || null,
        p_itens: itens,
      } as never);
      if (error) throw error;
      const pedido = data as { id?: string; numero_pedido?: string; valor_total?: number | string; status?: string };
      if (!pedido.id) throw new Error("O banco não retornou o identificador do pedido.");
      // The order is persisted first. If payment setup is unavailable, preserve the order
      // and route the customer to it instead of inviting them to submit a duplicate.
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke("criar-pagamento", {
        body: { order_id: pedido.id },
      });
      cart.clear();
      if (paymentError || !paymentData?.checkout_url) {
        toast.warning(`Pedido ${pedido.numero_pedido ?? "criado"} registrado, mas o pagamento não foi iniciado. A equipe precisará confirmar o frete e os próximos passos.`);
        navigate({ to: "/conta/pedidos/$id", params: { id: pedido.id } });
        return;
      }
      toast.success("Pedido registrado. Redirecionando para o ambiente seguro do Mercado Pago…");
      window.location.assign(String(paymentData.checkout_url));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <legend className="px-1 font-semibold">Seus dados</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="nome" label="Nome completo"><Input id="nome" autoComplete="name" required maxLength={120} value={f.name} onChange={set("name")} /></Field>
            <Field id="tel" label="Telefone / WhatsApp"><Input id="tel" autoComplete="tel" required inputMode="tel" placeholder="(11) 91234-5678" value={f.phone} onChange={(e) => setF({ ...f, phone: formatPhone(e.target.value) })} /></Field>
          </div>
        </fieldset>
        <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <legend className="px-1 font-semibold">Endereço de entrega</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="cep" label="CEP"><Input id="cep" autoComplete="postal-code" required inputMode="numeric" placeholder="00000-000" value={f.cep} onChange={(e) => setF({ ...f, cep: formatCEP(e.target.value) })} onBlur={(e) => lookupCep(e.target.value)} /></Field>
            <div className="sm:col-span-2"><Field id="rua" label="Logradouro"><Input id="rua" autoComplete="street-address" required value={f.street} onChange={set("street")} /></Field></div>
            <Field id="num" label="Número"><Input id="num" required value={f.number} onChange={set("number")} /></Field>
            <div className="sm:col-span-2"><Field id="comp" label="Complemento (opcional)"><Input id="comp" value={f.complement} onChange={set("complement")} /></Field></div>
            <Field id="bairro" label="Bairro"><Input id="bairro" required value={f.district} onChange={set("district")} /></Field>
            <Field id="cidade" label="Cidade"><Input id="cidade" autoComplete="address-level2" required value={f.city} onChange={set("city")} /></Field>
            <Field id="uf" label="Estado">
              <select id="uf" required value={f.uf} onChange={set("uf")} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Selecione</option>
                {UFS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
          </div>
          <Field id="obs" label="Observações (opcional)"><Textarea id="obs" maxLength={2000} value={f.notes} onChange={set("notes")} /></Field>
        </fieldset>
      </div>
      <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-sans font-semibold">Resumo do pedido</h2>
        <ul className="space-y-2 text-sm">
          {cart.items.map((i) => (
            <li key={i.key} className="flex justify-between gap-2"><span className="text-muted-foreground">{i.quantity}× {i.name}</span><span>{formatBRL(i.unit_price * i.quantity)}</span></li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-border pt-3 text-sm"><span>Subtotal</span><span>{formatBRL(cart.subtotal)}</span></div>
        <div className="flex justify-between text-sm"><span>Frete</span><span className="text-muted-foreground">A confirmar</span></div>
        <div className="flex justify-between text-lg font-semibold"><span>Total estimado</span><span>{formatBRL(cart.subtotal)}</span></div>

        <section className="space-y-3 rounded-xl border border-primary/40 bg-primary/5 p-4" aria-labelledby="pagamento-titulo">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary-glow" aria-hidden />
            <h3 id="pagamento-titulo" className="font-semibold">Forma de pagamento</h3>
          </div>
          <div className="rounded-lg border border-primary/40 bg-background p-3">
            <div className="flex items-center gap-2 font-medium">
              <span className="grid h-4 w-4 place-items-center rounded-full border border-primary"><span className="h-2 w-2 rounded-full bg-primary" /></span>
              Mercado Pago
              <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Preferencial</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Planejado para cartão, Pix e demais opções habilitadas na conta Mercado Pago.</p>
            <p className="mt-2 text-xs font-medium text-amber-600">Integração em preparação — nenhum pagamento será cobrado nesta etapa.</p>
          </div>
          <p className="flex gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" aria-hidden /> O pagamento será habilitado somente após a confirmação do frete e a configuração segura do checkout.</p>
        </section>

        <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Enviando..." : "Solicitar pedido"}</Button>
        <p className="text-xs text-muted-foreground">Ao continuar, você envia uma solicitação de pedido; não está realizando uma compra paga ainda.</p>
      </aside>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}</div>;
}
