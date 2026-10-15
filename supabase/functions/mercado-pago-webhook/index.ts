import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "null", "Content-Type": "application/json; charset=utf-8" };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

async function verifySignature(req: Request, dataId: string, secret: string) {
  const signature = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";
  const parts = Object.fromEntries(signature.split(",").map((part) => {
    const [key, ...rest] = part.trim().split("=");
    return [key, rest.join("=")];
  }));
  const ts = parts.ts;
  const received = parts.v1;
  if (!ts || !received || !requestId || !/^\d+$/.test(ts)) return false;
  // Mercado Pago may retry notifications later; validate the signed timestamp format without imposing a narrow age window.
  const timestamp = Number(ts);
  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) return false;
  if (!dataId || !/^[a-zA-Z0-9]+$/.test(dataId)) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest)));
  const expected = Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
  if (expected.length !== received.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ received.toLowerCase().charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
  const secret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  if (!secret || !supabaseUrl || !serviceKey || !accessToken) return json({ error: "Configuração incompleta." }, 503);

  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const queryDataId = url.searchParams.get("data.id");
    const bodyDataId = body?.data?.id;
    const topic = url.searchParams.get("type") ?? body?.type ?? body?.topic;
    if (topic !== "payment") {
      // Acknowledge unrelated Mercado Pago notifications without processing them.
      return json({ received: true });
    }
    // Signature verification must use the data.id query parameter included in Mercado Pago's manifest.
    if (!queryDataId || (bodyDataId !== undefined && String(bodyDataId).toLowerCase() !== queryDataId.toLowerCase())) {
      return json({ error: "Identificador da notificação ausente ou divergente." }, 400);
    }
    const paymentId = queryDataId;
    if (!/^\d{1,30}$/.test(paymentId)) return json({ error: "Identificador inválido." }, 400);
    if (!await verifySignature(req, queryDataId, secret)) return json({ error: "Assinatura inválida." }, 401);

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!mpResponse.ok) return json({ error: "Não foi possível validar o pagamento com o provedor." }, 502);
    const mp = await mpResponse.json();
    const paymentRecordId = String(mp.external_reference ?? "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(paymentRecordId)) {
      return json({ error: "Referência de pagamento inválida." }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: record, error } = await admin.from("pagamentos").select("*").eq("id", paymentRecordId).maybeSingle();
    if (error) throw error;
    if (!record) return json({ error: "Registro de pagamento não encontrado." }, 404);
    if (record.preferencia_id && (!mp.preference_id || String(mp.preference_id) !== String(record.preferencia_id))) {
      return json({ error: "Preferência do pagamento divergente." }, 409);
    }
    if (String(mp.currency_id) !== record.moeda || !Number.isFinite(Number(mp.transaction_amount)) || Math.round(Number(mp.transaction_amount) * 100) !== Math.round(Number(record.valor_total) * 100)) {
      await admin.from("pagamentos").update({ status: "em_analise", status_provedor: "valor_ou_moeda_divergente", atualizado_em: new Date().toISOString() }).eq("id", record.id);
      return json({ error: "Valor ou moeda divergente; encaminhado para revisão." }, 409);
    }

    const allowed: Record<string, string> = {
      approved: "aprovado",
      pending: "pendente",
      in_process: "em_analise",
      rejected: "recusado",
      cancelled: "cancelado",
      refunded: "reembolsado",
      charged_back: "em_analise",
    };
    let nextStatus = allowed[String(mp.status)] ?? "em_analise";
    // Never downgrade an already approved payment because of a delayed/replayed older event.
    const isChargeback = String(mp.status) === "charged_back";
    if (record.status === "aprovado" && nextStatus !== "reembolsado" && !isChargeback) nextStatus = "aprovado";
    if (record.status === "reembolsado" && nextStatus !== "reembolsado" && !isChargeback) nextStatus = "reembolsado";
    // Idempotent: repeated notifications update the same record, never create a second payment.
    const { error: updateError } = await admin.from("pagamentos").update({
      pagamento_externo_id: paymentId,
      status: nextStatus,
      status_provedor: String(mp.status_detail ?? mp.status ?? "unknown").slice(0, 100),
      atualizado_em: new Date().toISOString(),
      confirmado_em: nextStatus === "aprovado" ? (record.confirmado_em ?? new Date().toISOString()) : record.confirmado_em,
    }).eq("id", record.id);
    if (updateError) throw updateError;
    return json({ received: true });
  } catch (error) {
    console.error("mercado-pago-webhook error", error instanceof Error ? error.message : "unknown");
    return json({ error: "Falha ao processar notificação." }, 500);
  }
});
