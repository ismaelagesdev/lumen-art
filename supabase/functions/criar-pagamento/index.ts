import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Método não permitido." }, 405);

  // Shipping is deliberately settled separately after product payment.
  // No carrier quote is invented without verified package dimensions and weight.
  const shippingMode = Deno.env.get("LUMEN_SHIPPING_MODE");
  if (!Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")) return response({ error: "Pagamento ainda não configurado." }, 503);
  if (shippingMode !== "manual_after_payment") {
    return response({ error: "Configure o modo de envio manual após o pagamento no servidor." }, 409);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return response({ error: "Autenticação necessária." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const token = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
  const siteUrl = Deno.env.get("SITE_URL");
  if (!supabaseUrl || !anonKey || !serviceKey || !token || !siteUrl) {
    return response({ error: "Configuração incompleta no servidor." }, 503);
  }

  try {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return response({ error: "Sessão inválida." }, 401);

    const body = await req.json().catch(() => null);
    const orderId = typeof body?.order_id === "string" ? body.order_id : "";
    const destinationCep = typeof body?.destination_cep === "string" ? body.destination_cep.replace(/\D/g, "") : "";
    if (!/^\d{8}$/.test(destinationCep)) {
      return response({ error: "Informe um CEP de entrega válido." }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: order, error: orderError } = await admin.from("pedidos")
      .select("id, numero_pedido, cliente_id, nome_cliente, email_cliente, telefone_cliente, itens, valor_total")
      .eq("id", orderId).maybeSingle();
    if (orderError) throw orderError;
    if (!order || order.cliente_id !== user.id) return response({ error: "Pedido não encontrado." }, 404);

    const items = Array.isArray(order.itens) ? order.itens : [];
    if (!items.length || items.length > 100) return response({ error: "Os itens do pedido são inválidos." }, 400);
    const cents = (value: unknown) => {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0) throw new Error("Valor inválido no pedido.");
      return Math.round(n * 100);
    };
    const itemsCents = items.reduce((sum: number, item: Record<string, unknown>) => {
      const qty = Number(item.quantidade);
      if (!Number.isInteger(qty) || qty < 1 || qty > 999) throw new Error("Quantidade inválida.");
      return sum + cents(item.preco) * qty;
    }, 0);
    if (itemsCents <= 0 || itemsCents !== cents(order.valor_total)) {
      return response({ error: "O valor dos itens não confere com o pedido. Solicite revisão da equipe." }, 409);
    }
    // Reached only after a verified provider quote has been implemented above.
    const shippingCents = 0;
    const totalCents = itemsCents + shippingCents;
    if (totalCents <= 0) return response({ error: "O total precisa ser maior que zero." }, 400);

    // Prevent a second active checkout for the same order.
    const { data: active } = await admin.from("pagamentos").select("id, status")
      .eq("pedido_id", orderId).in("status", ["iniciando", "pendente", "em_analise"]).limit(1).maybeSingle();
    if (active) return response({ error: "Este pedido já possui uma tentativa de pagamento em andamento. Entre em contato com a equipe para verificar o status." }, 409);

    const mpItems = items.map((item: Record<string, unknown>) => ({
      id: String(item.id),
      title: String(item.nome ?? "Produto Lumen Print").slice(0, 256),
      quantity: Number(item.quantidade),
      currency_id: "BRL",
      unit_price: Number((cents(item.preco) / 100).toFixed(2)),
    }));
    if (shippingCents > 0) {
      mpItems.push({
        id: "frete",
        title: "Frete",
        quantity: 1,
        currency_id: "BRL",
        unit_price: Number((shippingCents / 100).toFixed(2)),
      });
    }

    const { data: payment, error: insertError } = await admin.from("pagamentos").insert({
      pedido_id: order.id,
      status: "iniciando",
      valor_itens: Number((itemsCents / 100).toFixed(2)),
      valor_frete: Number((shippingCents / 100).toFixed(2)),
      valor_total: Number((totalCents / 100).toFixed(2)),
      moeda: "BRL",
    }).select("id").single();
    if (insertError) throw insertError;

    const preferencePayload = {
      items: mpItems,
      external_reference: payment.id,
      metadata: { payment_record_id: payment.id, order_id: order.id, order_number: order.numero_pedido },
      payer: {
        name: String(order.nome_cliente ?? "").slice(0, 120),
        email: user.email ?? order.email_cliente ?? undefined,
        phone: order.telefone_cliente ? { number: String(order.telefone_cliente).replace(/\D/g, "").slice(-15) } : undefined,
      },
      back_urls: {
        success: `${siteUrl}/pagamento/retorno?status=success`,
        pending: `${siteUrl}/pagamento/retorno?status=pending`,
        failure: `${siteUrl}/pagamento/retorno?status=failure`,
      },
      auto_return: "approved",
      notification_url: `${supabaseUrl}/functions/v1/mercado-pago-webhook`,
      statement_descriptor: "LUMEN PRINT",
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-Idempotency-Key": payment.id },
      body: JSON.stringify(preferencePayload),
    });
    const preference = await mpResponse.json().catch(() => ({}));
    if (!mpResponse.ok || !preference.id || !preference.init_point) {
      await admin.from("pagamentos").update({ status: "erro", atualizado_em: new Date().toISOString() }).eq("id", payment.id);
      console.error("Mercado Pago preference creation failed", { status: mpResponse.status, cause: preference?.message ?? "unknown" });
      return response({ error: "Não foi possível iniciar o pagamento. Nenhuma cobrança foi confirmada." }, 502);
    }

    const { error: updateError } = await admin.from("pagamentos").update({
      preferencia_id: String(preference.id), status: "pendente", atualizado_em: new Date().toISOString(),
    }).eq("id", payment.id);
    if (updateError) throw updateError;

    return response({ checkout_url: preference.init_point, payment_id: payment.id });
  } catch (error) {
    console.error("criar-pagamento error", error instanceof Error ? error.message : "unknown");
    return response({ error: "Falha ao preparar o pagamento." }, 500);
  }
});
