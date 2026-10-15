# Plano de integração de pagamentos — Mercado Pago

## Estado atual

O checkout coleta dados do cliente e cria um pedido pela função `create_order` do Supabase. Ele **não cobra pagamentos online**; o frete e a forma de pagamento ainda são confirmados pela equipe. Não mostrar um pedido como pago apenas porque o cliente voltou de uma página externa.

## Arquitetura recomendada

1. O cliente confirma o carrinho e endereço no frontend.
2. Uma função backend confiável (preferencialmente Supabase Edge Function) valida a sessão do usuário, consulta produtos e preços diretamente no banco, calcula o total e cria/associa uma tentativa de pagamento ao pedido.
3. O backend cria uma preferência de pagamento no Mercado Pago usando o Access Token guardado como segredo do servidor. Nunca expor Access Token em código de navegador, `VITE_*`, repositório ou logs.
4. O frontend redireciona para a URL de checkout hospedado retornada pelo Mercado Pago.
5. Um webhook do Mercado Pago valida a notificação consultando a API oficial, verifica o pagamento e atualiza o estado do pedido de forma idempotente. A página de retorno do navegador não é prova de pagamento.
6. O cliente vê os estados: aguardando pagamento, aprovado, recusado, cancelado ou em análise. Só marcar como pago após confirmação autenticada no backend.

## Antes de ativar em produção

- Criar tabela/campos de pagamento com identificador externo único, status, valor e timestamps; não armazenar dados de cartão.
- Criar Edge Function para iniciar checkout e outra rota segura para webhook (ou uma função única com validação por tipo).
- Validar preço, disponibilidade, quantidade e propriedade do pedido no servidor; não confiar em total enviado pelo navegador.
- Configurar `MERCADOPAGO_ACCESS_TOKEN` como segredo do servidor/Supabase, nunca como variável `VITE_*`.
- Configurar URL HTTPS pública para webhook e usar credenciais de teste primeiro.
- Testar pagamento aprovado, recusado, pendente, notificações repetidas, valor divergente e retorno sem webhook.
- Definir frete antes da cobrança: hoje o checkout informa que é “a combinar”, então não deve cobrar um total final sem resolver essa regra.
- Confirmar com a empresa conta Mercado Pago, política de cancelamento/reembolso, prazo de produção, entrega e termos de privacidade.

## Próxima implementação

A etapa segura seguinte é modelar persistência e estados de pagamento no banco e implementar a função de backend. Não adicionar um botão de pagamento falso no frontend nem inserir token privado no repositório.
