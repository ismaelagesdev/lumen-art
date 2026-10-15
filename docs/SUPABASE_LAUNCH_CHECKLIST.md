# Lumen Print — checklist de conexão com o Supabase

Este documento registra o que precisa ser confirmado no projeto Supabase antes de considerar a loja pronta para receber pedidos reais.

## 1. Variáveis locais

Crie `.env.local` na raiz do projeto (ao lado de `package.json`) usando `.env.example` como modelo:

```dotenv
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publica_publishable
```

Use a URL e a chave pública do projeto correto em **Supabase → Project Settings → API** (ou a tela equivalente do painel atual). Não use valores de exemplo, chave `service_role` nem chave secreta em variáveis `VITE_*`. O arquivo `.env.local` não deve ser commitado.

Depois de salvar, reinicie o servidor de desenvolvimento.

## 2. Estrutura que o aplicativo espera

Confirme que o banco ativo contém as tabelas e colunas compatíveis com os tipos em `src/integrations/supabase/types.ts`:

- `categories`
- `products`
- `product_options`
- `profiles`
- `user_roles`
- `orders`
- `order_items`
- `messages`

As migrações do repositório incluem:
- `0001_security_hardening.sql` — impede que novos cadastros recebam automaticamente o papel administrativo.
- `0002_seed_initial_products.sql` — cadastra, se ainda não existirem, os dois kits confirmados: Kit Premium de Sinuca (R$ 140,00) e Kit Premium de Truco (R$ 146,30). As imagens começam vazias e precisam ser enviadas ao bucket e vinculadas aos produtos.

**Antes de aplicar SQL em um projeto existente, confira o histórico e o esquema no Supabase.** A migração inicial `0000_lumen_core.sql` cria as tabelas e funções e não deve ser executada novamente sobre tabelas já existentes. Aplique apenas as migrações pendentes, de acordo com o estado real do banco.

O código também chama as funções RPC:

- `create_order` — cria pedido e itens; o servidor precisa recalcular preços a partir dos produtos/opções atuais, sem confiar em preços enviados pelo navegador.
- `create_custom_request` — registra solicitação de projeto sob encomenda.
- `has_role` — consulta papel/permissão do usuário.

Os tipos TypeScript documentam o contrato esperado, mas **não provam** que as tabelas, funções, constraints ou políticas estejam implantadas no projeto remoto. Verifique o esquema no painel antes de testar.

## 3. Storage

O aplicativo espera dois buckets:

- `product-images` — imagens dos produtos; o código gera URLs assinadas.
- `attachments` — anexos enviados no atendimento dos pedidos.

Verifique políticas de leitura/escrita. Anexos de pedidos não devem ser publicamente acessíveis; o acesso precisa respeitar o usuário dono do pedido e a equipe autorizada.

## 4. Segurança obrigatória antes de publicar

- Ativar e validar RLS em todas as tabelas expostas pela API.
- Clientes autenticados só podem consultar e alterar seus próprios dados e pedidos.
- A equipe administrativa deve ser autorizada por uma política/função do banco; ocultar o painel no frontend não é controle de segurança.
- Impedir que usuários comuns atribuam a si mesmos o papel `admin`.
- Revisar os registros existentes em `user_roles`: a migração inicial antiga promovia o primeiro cadastro a administrador. Preserve apenas as contas administrativas confiáveis.
- RPCs de criação de pedidos devem validar quantidades, produtos ativos, opções válidas, preços e totais no servidor, idealmente dentro de uma transação.
- Proteger mensagens e anexos por pedido.
- Não armazenar chaves secretas no navegador ou no repositório.

## 5. Teste funcional de ponta a ponta

Depois de conectar o projeto correto:

1. Abrir a página inicial e o catálogo; verificar que produtos ativos e categorias carregam sem erros de rede.
2. Abrir a página de cada produto e confirmar preço, imagens e opções.
3. Adicionar/remover itens, alterar quantidades e recarregar a página para verificar a persistência do carrinho.
4. Criar uma conta de teste, entrar e confirmar o fluxo de sessão.
5. Enviar um pedido de teste e confirmar no banco que o pedido e os itens foram gravados com valores calculados pelo servidor.
6. Confirmar que o cliente vê apenas os próprios pedidos e mensagens.
7. Testar uma conta comum contra `/admin` (deve ser negado) e uma conta administrativa autorizada (deve conseguir alterar status).
8. Enviar e abrir um anexo de teste com as permissões corretas.
9. Testar em celular e desktop, além dos estados de carregamento, erro, vazio e nova tentativa.

## Estado de pagamento

O checkout atual **não cobra pagamentos**. O Mercado Pago está explicitamente marcado como integração em preparação. Não divulgar o checkout como pagamento online até implementar e testar a integração segura, a confirmação de pagamento e o tratamento de webhooks.
