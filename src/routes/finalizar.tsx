import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
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
    name: (user?.user_metadata?.full_name as string) ?? "",
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
      if (j.erro) return toast.error("CEP não encontrado.");
      setF((p) => ({ ...p, street: j.logradouro || p.street, district: j.bairro || p.district, city: j.localidade || p.city, uf: j.uf || p.uf }));
    } catch {
      /* preenchimento manual */
    }
  };

  if (cart.items.length === 0)
    return <Empty title="Seu carrinho está vazio"><Link to="/produtos" className="text-primary-glow underline">Explorar o catálogo</Link></Empty>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.cep.replace(/\D/g, "").length !== 8) return toast.error("Informe um CEP válido.");
    setBusy(true);
    const { data, error } = await supabase.rpc("create_order", {
      _items: cart.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, options: i.options })),
      _customer_name: f.name,
      _customer_phone: f.phone,
      _shipping: { cep: f.cep, logradouro: f.street, numero: f.number, complemento: f.complement, bairro: f.district, cidade: f.city, uf: f.uf },
      _notes: f.notes || null,
    } as never);
    setBusy(false);
    if (error) return toast.error(errorMessage(error));
    cart.clear();
    toast.success("Pedido criado com sucesso!");
    navigate({ to: "/conta/pedidos/$id", params: { id: data as string } });
  };

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <legend className="px-1 font-semibold">Seus dados</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="nome" label="Nome completo"><Input id="nome" required maxLength={120} value={f.name} onChange={set("name")} /></Field>
            <Field id="tel" label="Telefone / WhatsApp"><Input id="tel" required inputMode="tel" placeholder="(11) 91234-5678" value={f.phone} onChange={(e) => setF({ ...f, phone: formatPhone(e.target.value) })} /></Field>
          </div>
        </fieldset>
        <fieldset className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <legend className="px-1 font-semibold">Endereço de entrega</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="cep" label="CEP"><Input id="cep" required inputMode="numeric" placeholder="00000-000" value={f.cep} onChange={(e) => setF({ ...f, cep: formatCEP(e.target.value) })} onBlur={(e) => lookupCep(e.target.value)} /></Field>
            <div className="sm:col-span-2"><Field id="rua" label="Logradouro"><Input id="rua" required value={f.street} onChange={set("street")} /></Field></div>
            <Field id="num" label="Número"><Input id="num" required value={f.number} onChange={set("number")} /></Field>
            <div className="sm:col-span-2"><Field id="comp" label="Complemento (opcional)"><Input id="comp" value={f.complement} onChange={set("complement")} /></Field></div>
            <Field id="bairro" label="Bairro"><Input id="bairro" required value={f.district} onChange={set("district")} /></Field>
            <Field id="cidade" label="Cidade"><Input id="cidade" required value={f.city} onChange={set("city")} /></Field>
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
        <h2 className="font-sans font-semibold">Resumo</h2>
        <ul className="space-y-2 text-sm">
          {cart.items.map((i) => (
            <li key={i.key} className="flex justify-between gap-2"><span className="text-muted-foreground">{i.quantity}× {i.name}</span><span>{formatBRL(i.unit_price * i.quantity)}</span></li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-border pt-3 text-sm"><span>Frete</span><span className="text-muted-foreground">A combinar</span></div>
        <div className="flex justify-between text-lg font-semibold"><span>Total estimado</span><span>{formatBRL(cart.subtotal)}</span></div>
        <div className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
          O pagamento on-line ainda não está disponível. Após o envio, a equipe confirma a personalização, o frete e a forma de pagamento pelo atendimento do pedido.
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Enviando..." : "Confirmar pedido"}</Button>
      </aside>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}</div>;
}
