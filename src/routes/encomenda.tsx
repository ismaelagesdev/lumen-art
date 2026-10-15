import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
  validateSearch: z.object({ produto: z.string().uuid().optional() }),
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
  const navigate = useNavigate();
  const [name, setName] = useState((user?.user_metadata?.full_name as string) ?? "");
  const [phone, setPhone] = useState("");
  const [desc, setDesc] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const onFiles = (list: FileList | null) => {
    const arr = Array.from(list ?? []);
    for (const f of arr) {
      const err = validateUpload(f);
      if (err) return toast.error(`${f.name}: ${err}`);
    }
    setFiles(arr.slice(0, 5));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data: id, error } = await supabase.rpc("create_custom_request", {
        _description: desc,
        _customer_name: name,
        _customer_phone: phone,
        _product_id: produto ?? null,
      } as never);
      if (error) throw error;
      for (const f of files) await uploadAttachment(id as string, f, user!.id, false);
      toast.success("Solicitação enviada! A equipe responderá pelo atendimento do pedido.");
      navigate({ to: "/conta/pedidos/$id", params: { id: id as string } });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-card p-6">
      {produto && <p className="text-sm text-muted-foreground">Solicitação vinculada ao produto selecionado no catálogo.</p>}
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
      <Button type="submit" size="lg" disabled={busy}>{busy ? "Enviando..." : "Enviar solicitação"}</Button>
      <p className="text-xs text-muted-foreground">
        Os valores são definidos após a análise do projeto. Acompanhe tudo em <Link to="/conta" className="underline">Minha conta</Link>.
      </p>
    </form>
  );
}
