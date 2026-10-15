# Lumen Print — checklist de conexão com o Supabase

Este checklist descreve o banco legado atualmente usado pela branch `adaptar-supabase-existente`. A branch não altera o banco remoto.

## 1. Variáveis de ambiente

Configure a URL do projeto Supabase correto e sua chave pública (`publishable` ou `anon`, conforme o projeto) nas variáveis de ambiente esperadas pelo ambiente de publicação. Nunca exponha uma chave `service_role` ou outra chave secreta em variáveis `VITE_*` nem no navegador.

## 2. Esquema legado esperado

O adaptador usa as estruturas existentes confirmadas:

- `public.produtos`: `id`, `nome`, `preco`, `ativo`, `criado_em`, `atualizado_em`.
- `public.pedidos`: dados do cliente, `status`, `itens` JSONB, `valor_total`, `observacoes` e timestamps.
- `public.perfis`: papel e dados básicos do usuário.
- `public.mensagens`: mensagens e metadados dos anexos vinculados a `pedido_id`.
- RPC `public.criar_pedido(...)` para registrar pedidos e recalcular valores oficiais.
- Bucket privado `personalizacoes` para arquivos associados a pedidos.

Não executar `0000_lumen_core.sql` nem seeds destinados ao esquema novo no banco existente: eles podem criar estruturas conflitantes e não fazem parte desta adaptação.

## 3. Limitações funcionais atuais

- O catálogo não recebe imagens, descrições, categorias ou opções porque esses dados não estão nas colunas confirmadas da tabela `produtos`.
- O checkout registra um pedido, mas não cobra pagamento, não confirma estoque e não calcula frete.
- Encomendas usam um produto existente como referência. O preço registrado é o preço-base do produto; o preço final da personalização precisa ser confirmado pela equipe.
- Nenhuma migração SQL foi executada nesta branch. Não houve alteração direta no Supabase.

## 4. Segurança a validar

- Confirmar RLS nas tabelas `pedidos`, `mensagens`, `perfis` e `produtos`.
- Testar com dois clientes diferentes e confirmar que cada um só acessa os próprios pedidos, mensagens e arquivos.
- Confirmar que apenas usuários com papel `equipe` ou `admin` conseguem consultar pedidos alheios e executar ações de equipe.
- Confirmar que os anexos permanecem privados e que os caminhos no bucket começam com o UUID do pedido autorizado.
- Confirmar que o cadastro de usuário comum não pode atribuir papel administrativo.
- Nunca colocar chaves secretas no frontend ou no repositório.

## 5. Testes de ponta a ponta antes da publicação

1. Aguardar CI verde no commit mais recente.
2. Abrir a página inicial e o catálogo e confirmar que os seis produtos ativos são carregados do projeto Supabase correto.
3. Abrir detalhes de produtos, adicionar itens, alterar quantidades e recarregar a página para testar a persistência do carrinho.
4. Criar uma conta de teste, entrar e confirmar que o perfil de cliente é criado corretamente.
5. Enviar um pedido de teste e conferir `numero_pedido`, itens e total calculados no servidor.
6. Conferir histórico e detalhes do pedido na área do cliente.
7. Enviar mensagens e anexos; abrir anexos com URL assinada e testar permissões com outro cliente.
8. Testar `/admin` com uma conta comum e com uma conta administrativa autorizada.
9. Confirmar quais valores de `status` são aceitos pelo fluxo administrativo antes de usá-lo em produção.
10. Testar em desktop e celular, incluindo estados de erro, carregamento e nova tentativa.

## Estado do pagamento

O checkout atual **não cobra pagamentos**. A indicação do Mercado Pago é apenas informativa; não divulgar a loja como capaz de receber pagamentos online até implementar e testar a integração, confirmação de pagamento e webhooks.