import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage, formatDate } from "@/lib/format";
import { validateUpload } from "@/lib/site";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loading } from "./States";

export async function uploadAttachment(orderId: string, file: File, userId: string, fromStaff: boolean) {
  const err = validateUpload(file);
  if (err) throw new Error(err);
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${orderId}/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage.from("personalizacoes").upload(path, file, { contentType: file.type });
  if (error) throw error;
  const { error: e2 } = await (supabase as any).from("mensagens").insert({
    pedido_id: orderId,
    remetente_id: userId,
    remetente_tipo: fromStaff ? "equipe" : "cliente",
    tipo_conteudo: "arquivo",
    conteudo: "",
    arquivo_path: path,
    arquivo_nome: file.name.slice(0, 200),
    arquivo_mime: file.type || null,
    arquivo_tamanho: file.size,
  });
  if (e2) throw e2;
}

export function OrderChat({ orderId }: { orderId: string }) {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const key = ["messages", orderId];

  const { data: messages, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("mensagens").select("*").eq("pedido_id", orderId).order("criado_em");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`msg-${orderId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens", filter: `pedido_id=eq.${orderId}` }, () =>
        qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => endRef.current?.scrollIntoView({ block: "nearest" }), [messages?.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !user) return;
    setBusy(true);
    const { error } = await (supabase as any).from("mensagens").insert({ pedido_id: orderId, remetente_id: user.id, remetente_tipo: isAdmin ? "equipe" : "cliente", tipo_conteudo: "texto", conteudo: body.slice(0, 4000) });
    setBusy(false);
    if (error) { toast.error(errorMessage(error)); return; }
    setText("");
    qc.invalidateQueries({ queryKey: key });
  };

  const onFile = async (f?: File) => {
    if (!f || !user) return;
    setBusy(true);
    try {
      await uploadAttachment(orderId, f, user.id, isAdmin);
      toast.success("Arquivo enviado.");
      qc.invalidateQueries({ queryKey: key });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const open = async (path: string) => {
    const { data, error } = await supabase.storage.from("personalizacoes").createSignedUrl(path, 300);
    if (error || !data) { toast.error("Não foi possível abrir o arquivo."); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  return (
    <section className="flex flex-col rounded-2xl border border-border bg-card" aria-label="Atendimento">
      <header className="border-b border-border px-5 py-3">
        <h2 className="font-sans text-base font-semibold">Atendimento</h2>
        <p className="text-xs text-muted-foreground">Converse com {isAdmin ? "o cliente" : "a equipe Lumen Print"} sobre este pedido.</p>
      </header>
      <div className="max-h-[28rem] min-h-48 space-y-3 overflow-y-auto p-5" aria-live="polite">
        {isLoading ? (
          <Loading />
        ) : !messages?.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>
        ) : (
          messages.map((m) => {
            const mine = m.remetente_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  <p className="mb-0.5 text-[11px] opacity-70">{m.remetente_tipo === "equipe" ? "Equipe Lumen Print" : "Cliente"} · {formatDate(m.criado_em)}</p>
                  {m.conteudo && <p className="whitespace-pre-line break-words">{m.conteudo}</p>}
                  {m.arquivo_path && (
                    <button onClick={() => open(m.attachment_path!)} className="mt-1 inline-flex items-center gap-1.5 underline">
                      <FileText className="h-4 w-4" /> {m.arquivo_nome ?? "Arquivo"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex items-end gap-2 border-t border-border p-3">
        <label className="cursor-pointer rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Anexar arquivo">
          <Paperclip className="h-5 w-5" />
          <input type="file" className="sr-only" accept=".jpg,.jpeg,.png,.webp,.svg,.pdf" disabled={busy} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        <label htmlFor={`msg-${orderId}`} className="sr-only">Mensagem</label>
        <Textarea id={`msg-${orderId}`} rows={1} value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva sua mensagem..." className="min-h-10 resize-none"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }} />
        <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="Enviar mensagem"><Send className="h-4 w-4" /></Button>
      </form>
    </section>
  );
}
