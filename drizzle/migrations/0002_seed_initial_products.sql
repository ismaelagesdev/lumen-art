-- Seed the two confirmed ready-made kits. Existing catalog entries are preserved.
-- Product images can be added later through the product-images bucket and the products.images column.

insert into public.products (
  category_id, name, slug, description, price, images, featured, made_to_order, active
)
select
  c.id,
  'Kit Premium de Sinuca',
  'kit-premium-sinuca',
  'Kit Premium de Sinuca.',
  140.00,
  array[]::text[],
  true,
  false,
  true
from public.categories c
where c.slug = 'trofeus'
on conflict (slug) do nothing;

insert into public.products (
  category_id, name, slug, description, price, images, featured, made_to_order, active
)
select
  c.id,
  'Kit Premium de Truco',
  'kit-premium-truco',
  'Kit Premium de Truco.',
  146.30,
  array[]::text[],
  true,
  false,
  true
from public.categories c
where c.slug = 'trofeus'
on conflict (slug) do nothing;
