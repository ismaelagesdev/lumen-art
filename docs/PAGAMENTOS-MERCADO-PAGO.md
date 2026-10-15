# Integração Mercado Pago — Checkout Pro

## O que já foi preparado nesta branch

- Migração aditiva `supabase/migrations/20261015000000_payment_records.sql`: cria a tabela isolada `public.pagamentos`, sem alterar `pedidos.status`, produtos ou registros existentes.
- Edge Function `criar-pagamento`: exige sessão autenticada, confere a propriedade do pedido, valida o total usando o pedido salvo no Supabase, cria preferência Checkout Pro no servidor e mantém o Access Token fora do navegador.
- Edge Function `mercado-pago-webhook`: valida a assinatura HMAC da notificação, consulta o pagamento diretamente na API do Mercado Pago, compara moeda e valor, e atualiza o mesmo registro de forma idempotente.
- O webhook não confia na página de retorno do navegador como prova de pagamento. A tabela de pagamento é separada do status de produção do pedido.

**Ainda não está ativo para cobrança.** O checkout atual do site continua criando pedidos sem cobrar. Não foi executada migração no Supabase e nenhuma função foi implantada automaticamente.

## Bloqueio obrigatório: frete

O checkout atual coleta endereço, mas não calcula frete. A função `criar-pagamento` falha de forma fechada até o modo de frete ser configurado no servidor:
- `LUMEN_SHIPPING_MODE=free` somente se a loja decidir que o frete será grátis; ou
- `LUMEN_SHIPPING_MODE=fixed` e `LUMEN_FIXED_SHIPPING_CENTS` com o valor fixo em centavos, se a loja adotar uma tarifa fixa.

Não configure nenhuma dessas opções até a regra comercial ser confirmada. Para frete variável por CEP/peso, a integração deve consultar um serviço de frete antes de criar a preferência.

## Configuração necessária no projeto Supabase

1. Revisar e executar manualmente a migração SQL no projeto correto.
2. Implantar as funções `criar-pagamento` e `mercado-pago-webhook`.
3. Definir os segredos no Supabase Functions, nunca no frontend, GitHub ou variáveis `VITE_*`:
   - `MERCADOPAGO_ACCESS_TOKEN`: Access Token de teste primeiro; trocar para produção somente após homologação.
   - `MERCADOPAGO_WEBHOOK_SECRET`: chave secreta de assinatura de webhook gerada/configurada no painel de integrações do Mercado Pago.
   - `SITE_URL`: URL HTTPS pública real do site.
   - `LUMEN_SHIPPING_MODE` e, se aplicável, `LUMEN_FIXED_SHIPPING_CENTS`: somente após definição do frete.
4. As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são usadas pelo runtime da função; a chave service role nunca deve ser enviada ao navegador.
5. Configurar a URL de webhook como `https://<PROJECT_REF>.supabase.co/functions/v1/mercado-pago-webhook` no painel do Mercado Pago.
6. Fazer um pagamento de teste aprovado, recusado e pendente; testar notificação duplicada, assinatura inválida, valor divergente e retorno sem webhook.

## Próximo passo para conectar o frontend

Quando frete e credenciais estiverem configurados, o checkout poderá chamar `supabase.functions.invoke("criar-pagamento", { body: { order_id } })` depois de criar o pedido e redirecionar para `checkout_url`. A interface de retorno deverá consultar o status no backend e nunca considerar o parâmetro da URL como confirmação de pagamento.

## Fontes oficiais

- [Mercado Pago — API de preferências do Checkout Pro](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-preferences/overview)
- [Mercado Pago — Criar preferência](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-preferences/create-preference/post)
- [Supabase — Secrets para Edge Functions](https://supabase.com/docs/guides/functions/secrets)
- [Supabase — Configuração de autenticação de Edge Functions](https://supabase.com/docs/guides/functions/auth)
