import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productsQuery } from "@/lib/catalog";
import { z } from "zod";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage, formatPhone } from "@/lib/format";
import { validateUpload } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/site/States";
import { RequireAuth } from "@/components/site/RequireAuth";
import { uploadAttachment } from "@/components/site/OrderChat";

export const Route = createFileRoute("/encomenda")({
  validateSearch: z.object({ produto: z.string().regex(/^[1-9][0-9]{0,8}$/).optional() }),
  head: () => ({
    meta: [
      { title: "Projeto sob encomenda — Lumen Print" },
      { name: "description", content: "Solicite troféus e peças personalizadas sob encomenda com impressão 3D e corte a laser." },
      { property: "og:title", content: "Projeto sob encomenda — Lumen Print" },
      { property: "og:description", content: "Envie sua ideia, referências e logotipos para a equipe Lumen Print." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader eyebrow="Sob encomenda" title="Conte sua ideia">
        Descreva o que você precisa — evento, quantidade, medidas, cores, textos e prazo desejado. Você poderá enviar referências e acompanhar a conversa com a equipe.
      </PageHeader>
      <RequireAuth><RequestForm /></RequireAuth>
    </div>
  ),
});

function RequestForm() {
  const { produto } = Route.useSearch();
  const { user } = useAuth();
  const products = useQuery(productsQuery);
  const [selectedProduct, setSelectedProduct] = useState(produto ?? "");
  const navigate = useNavigate();
  const [name, setName] = useState((user?.user_metadata?.["full_name"] as string) ?? "");
  const [phone, setPhone] = useState("");
  const [desc, setDesc] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const onFiles = (list: FileList | null) => {
    const arr = Array.from(list ?? []);
    for (const f of arr) {
      const err = validateUpload(f);
      if (err) { toast.error(`${f.name}: ${err}`); return; }
    }
    setFiles(arr.slice(0, 5));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (!selectedProduct) throw new Error("Selecione um produto de referência.");
      const { data, error } = await (supabase as any).rpc("criar_pedido", {
        p_nome_cliente: name,
        p_email_cliente: user?.email ?? null,
        p_telefone_cliente: phone,
        p_observacoes: "SOLICITAÇÃO SOB ENCOMENDA | Produto de referência: " + selectedProduct + "\nDescrição: " + desc,
        p_itens: [{ id: selectedProduct, quantidade: 1, cor: null, personalizado: true }],
      });
      if (error) throw error;
      const pedido = data as { id?: string; numero_pedido?: string };
      if (!pedido?.id) throw new Error("O banco não retornou o identificador do pedido.");
      for (const f of files) await uploadAttachment(pedido.id, f, user!.id, false);
      toast.success("Solicitação enviada! A equipe responderá pelo atendimento do pedido.");
      navigate({ to: "/conta/pedidos/$id", params: { id: pedido.id } });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-card p-6">
      <div className="space-y-2"><Label htmlFor="produto">Produto de referência</Label><select id="produto" required value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} disabled={products.isLoading || !!products.error} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">{products.isLoading ? "Carregando produtos..." : "Selecione um produto"}</option>{(products.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} — {p.price == null ? "Sob consulta" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.price)}</option>)}</select>{products.error && <p className="text-sm text-destructive">Não foi possível carregar o catálogo. Recarregue a página e tente novamente.</p>}<p className="text-xs text-muted-foreground">O valor exibido no pedido é uma referência inicial; a equipe avaliará a personalização descrita abaixo.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome completo</Label>
          <Input id="nome" required value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tel">Telefone / WhatsApp</Label>
          <Input id="tel" required inputMode="tel" placeholder="(11) 91234-5678" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="desc">Descrição do projeto</Label>
        <Textarea id="desc" required minLength={10} maxLength={4000} rows={7} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: 12 troféus para o campeonato de sinuca, 1º ao 3º lugar, com logotipo do clube, entrega até..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="arquivos">Referências (opcional)</Label>
        <label htmlFor="arquivos" className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-input px-4 py-3 text-sm text-muted-foreground hover:border-primary">
          <Paperclip className="h-4 w-4" /> {files.length ? files.map((f) => f.name).join(", ") : "JPG, PNG, WEBP, SVG ou PDF — até 10 MB cada, máximo 5 arquivos"}
        </label>
        <input id="arquivos" type="file" multiple className="sr-only" accept=".jpg,.jpeg,.png,.webp,.svg,.pdf" onChange={(e) => onFiles(e.target.files)} />
      </div>
      <Button type="submit" size="lg" disabled={busy || products.isLoading || !!products.error || !selectedProduct}>{busy ? "Enviando..." : "Enviar solicitação"}</Button>
      <p className="text-xs text-muted-foreground">
        Os valores são definidos após a análise do projeto. Acompanhe tudo em <Link to="/conta" className="underline">Minha conta</Link>.
      </p>
    </form>
  );
}
