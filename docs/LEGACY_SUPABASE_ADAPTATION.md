# Adaptação ao Supabase existente

## Objetivo

Permitir que o catálogo leia os produtos já existentes em `public.produtos`, sem recriar tabelas, alterar registros ou exigir mudanças no projeto local.

## Mapeamento atual

| Banco existente | Modelo usado no catálogo |
| --- | --- |
| `produtos.id` (integer) | `id` convertido para string |
| `produtos.nome` | `name` |
| `produtos.preco` | `price` |
| `produtos.ativo` | `active` |
| `produtos.criado_em` | `created_at` |
| nome do produto | `slug` gerado no cliente |

A consulta lê somente produtos com `ativo = true`. As imagens, descrições, categorias e opções não existem nas colunas confirmadas da tabela legada; por isso, o adaptador não inventa esses dados. O catálogo mostra um espaço reservado de imagem até que exista um mapeamento de imagens aprovado.

Os dois kits de troféus (IDs 1 e 2) ficam destacados no catálogo. Essa escolha é baseada na prioridade comercial informada para a loja, não em uma alteração no banco.

## Fluxos adaptados nesta branch

- **Checkout:** chama `criar_pedido` com os parâmetros e o formato JSON confirmados; o banco valida produtos, quantidades e preços. O endereço e as observações ficam no campo `pedidos.observacoes`.
- **Encomendas:** o cliente seleciona um produto de referência e descreve a personalização. O pedido registra o preço-base oficial do produto; isso não é uma cotação final da personalização.
- **Histórico e detalhes:** consultam `public.pedidos`; os itens são lidos do JSONB `pedidos.itens`.
- **Atendimento:** consulta e grava `public.mensagens`; anexos usam o bucket privado `personalizacoes` com caminho iniciado pelo UUID do pedido.
- **Acesso administrativo:** a checagem de papel usa `public.perfis` em vez da tabela inexistente `user_roles`.

## Limites e validação

O checkout registra solicitações de pedido; não processa pagamento, não confirma estoque e não calcula frete. As imagens, descrições, categorias e opções de produtos não existem nas colunas confirmadas de `public.produtos`, então a interface mantém espaços reservados e não inventa esses dados.

Nenhuma migração SQL foi executada e nenhum registro ou política do Supabase foi alterado por esta adaptação. Não executar `0000_lumen_core.sql` nem seeds no banco existente. A branch deve permanecer separada da `main` até o CI passar e os fluxos serem testados com a URL, chave pública e políticas RLS do projeto correto.

## Testes pendentes antes de publicar

1. Confirmar o CI do commit mais recente.
2. Verificar catálogo, autenticação, checkout, histórico, mensagens e anexos no ambiente ligado ao Supabase correto.
3. Confirmar com contas de cliente e equipe que RLS impede acesso cruzado entre pedidos.
4. Validar os estados permitidos para atualização administrativa e revisar o tratamento de frete, pagamento e preço final de encomendas.
5. Mapear imagens e descrições reais apenas depois de obter os arquivos e os textos corretos.
