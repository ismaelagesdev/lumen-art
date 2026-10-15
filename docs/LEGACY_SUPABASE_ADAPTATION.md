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

## Limites importantes desta etapa

Esta alteração adapta **a leitura do catálogo**, não o fluxo completo de venda. O restante do projeto ainda referencia tabelas e RPCs do esquema novo, como `orders`, `order_items`, `product_options`, `create_order` e `create_custom_request`. O banco existente usa `pedidos`, `mensagens` e outras funções em português, com contratos diferentes.

Até uma etapa posterior adaptar e testar esses contratos, não considerar checkout, solicitação sob encomenda ou mensagens integrados ao banco existente. Não executar as migrações `0000_lumen_core.sql` ou seeds existentes no Supabase atual como parte desta adaptação.

## Próximas etapas seguras

1. Validar a compilação do adaptador e o carregamento dos seis produtos no ambiente conectado ao Supabase correto.
2. Mapear imagens e descrições reais, sem atribuir arquivos a produtos por suposição.
3. Inspecionar a assinatura e a implementação de `criar_pedido` e `criar_perfil_cliente` antes de adaptar pedidos/autenticação.
4. Planejar mudanças de esquema somente se forem necessárias, com SQL aditivo, revisado e separado; preservar dados e políticas existentes.
