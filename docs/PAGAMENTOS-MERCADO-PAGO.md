# Integração Mercado Pago — Checkout Pro

## O que já foi preparado nesta branch

- Migração aditiva `supabase/migrations/20261015000000_payment_records.sql`: cria a tabela isolada `public.pagamentos`, sem alterar `pedidos.status`, produtos ou registros existentes.
- Edge Function `criar-pagamento`: exige sessão autenticada, confere a propriedade do pedido, valida o total usando o pedido salvo no Supabase, cria preferência Checkout Pro no servidor e mantém o Access Token fora do navegador.
- Edge Function `mercado-pago-webhook`: valida a assinatura HMAC da notificação, consulta o pagamento diretamente na API do Mercado Pago, compara moeda e valor, e atualiza o mesmo registro de forma idempotente.
- O webhook não confia na página de retorno do navegador como prova de pagamento. A tabela de pagamento é separada do status de produção do pedido.
- O checkout agora tenta iniciar a preferência após criar o pedido. Se a função estiver indisponível ou o frete não estiver configurado, preserva o pedido e leva o cliente aos detalhes sem fingir que houve cobrança.
- A página `/pagamento/retorno` explica que o retorno do navegador não confirma pagamento.

**Ainda não está ativo para cobrança.** O checkout atual do site continua criando pedidos sem cobrar. Não foi executada migração no Supabase e nenhuma função foi implantada automaticamente.

## Política de frete adotada nesta etapa

Para destravar o checkout sem inventar dados de embalagem, a primeira versão cobra **somente os produtos** via Mercado Pago. O frete dos Correios será cotado separadamente depois da compra e comunicado ao cliente; o envio só deve ocorrer após o cliente aceitar e pagar/combinar o valor de entrega. O valor do frete não está incluído no pagamento inicial e isso deve estar explícito no checkout.

O CEP de origem informado é `18530-000`. A cotação manual permite começar sem integração automática de transportadora, token de frete ou dimensões/peso cadastrados no site. Quando a loja tiver os dados reais das embalagens e acesso adequado às APIs, a cotação automática poderá ser adicionada.

A API oficial de preços dos Correios também exige peso e, para pacotes, dimensões; seu acesso é restrito a clientes com contrato e permissão de API. Trocar diretamente para essa API não elimina os dados de embalagem. Consulte o [manual oficial de preço](https://www.correios.com.br/atendimento/developers/manuais/manual-api-preco-1) e a [página oficial de desenvolvedores](https://www.correios.com.br/atendimento/developers).

## Configuração necessária no projeto Supabase

1. Revisar e executar manualmente a migração SQL no projeto correto.
2. Implantar as funções `criar-pagamento` e `mercado-pago-webhook`.
3. Definir os segredos no Supabase Functions, nunca no frontend, GitHub ou variáveis `VITE_*`:
   - `MERCADOPAGO_ACCESS_TOKEN`: Access Token de teste primeiro; trocar para produção somente após homologação.
   - `MERCADOPAGO_WEBHOOK_SECRET`: chave secreta de assinatura de webhook gerada/configurada no painel de integrações do Mercado Pago.
   - `SITE_URL`: URL HTTPS pública real do site.
   - `LUMEN_SHIPPING_MODE=manual_after_payment`.
   - `LUMEN_ORIGIN_CEP=18530-000`.
4. As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são usadas pelo runtime da função; a chave service role nunca deve ser enviada ao navegador.
5. Configurar a URL de webhook como `https://<PROJECT_REF>.supabase.co/functions/v1/mercado-pago-webhook` no painel do Mercado Pago.
6. Fazer um pagamento de teste aprovado, recusado e pendente; testar notificação duplicada, assinatura inválida, valor divergente e retorno sem webhook.

## Integração frontend e trabalho restante

O checkout chama `supabase.functions.invoke("criar-pagamento", { body: { order_id, destination_cep } })` depois de criar o pedido. Com `LUMEN_SHIPPING_MODE=manual_after_payment`, a função cobra somente o total oficial dos produtos; o frete não é incluído. A equipe deve cotar os Correios, comunicar o valor e obter a aceitação do cliente antes de despachar. Se a função não estiver pronta, o pedido permanece registrado e o cliente é encaminhado aos detalhes. A página de retorno é informativa; ela não declara o pagamento aprovado. Ainda falta disponibilizar uma consulta autenticada do estado de pagamento para o cliente e testar ponta a ponta depois de implantar migração e funções.

## Fontes oficiais

- [Mercado Pago — API de preferências do Checkout Pro](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-preferences/overview)
- [Mercado Pago — Criar preferência](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-preferences/create-preference/post)
- [Supabase — Secrets para Edge Functions](https://supabase.com/docs/guides/functions/secrets)
- [Supabase — Configuração de autenticação de Edge Functions](https://supabase.com/docs/guides/functions/auth)


## Bloqueios operacionais específicos do frete

A documentação oficial do Melhor Envio exige CEPs de origem/destino e dados reais dos produtos ou volumes; recomenda utilizar `custom_price` e `custom_delivery_time` quando retornados. A cotação deve ser apresentada ao comprador antes de confirmar o pagamento, e a opção escolhida e o valor cotado devem ser preservados para evitar divergência. Para a primeira versão, a cotação automática foi adiada: o pagamento inicial inclui somente os produtos e o frete será tratado separadamente. Uma futura cotação automática exigirá dimensões/peso reais e acesso ao provedor.

- [API oficial — cálculo de fretes](https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos)
- [API oficial — introdução à integração](https://docs.melhorenvio.com.br/docs/introducao-a-integracao)
