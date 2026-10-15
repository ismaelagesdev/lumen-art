create type public.app_role as enum ('admin','user');
create type public.order_status as enum ('aguardando_personalizacao','aguardando_aprovacao','em_producao','concluido','cancelado');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profile update" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), new.raw_user_meta_data->>'phone')
  on conflict do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "cat public read" on public.categories for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "cat admin write" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  customization_info text,
  price numeric(10,2),
  images text[] not null default '{}',
  featured boolean not null default false,
  made_to_order boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "prod public read" on public.products for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "prod admin write" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- choices: [{"label":"Dourado","price_delta":0}] ; kind: select | text
create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  kind text not null default 'select' check (kind in ('select','text')),
  choices jsonb not null default '[]',
  required boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0
);
grant select on public.product_options to anon, authenticated;
grant insert, update, delete on public.product_options to authenticated;
grant all on public.product_options to service_role;
alter table public.product_options enable row level security;
create policy "opt public read" on public.product_options for select to anon, authenticated using (active or public.has_role(auth.uid(),'admin'));
create policy "opt admin write" on public.product_options for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity unique,
  user_id uuid not null,
  kind text not null default 'compra' check (kind in ('compra','encomenda')),
  status order_status not null default 'aguardando_personalizacao',
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  shipping_address jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.orders to authenticated;
grant update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "orders read" on public.orders for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "orders admin update" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  options jsonb not null default '[]',
  line_total numeric(10,2) not null
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "items read" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null,
  from_staff boolean not null default false,
  body text,
  attachment_path text,
  attachment_name text,
  created_at timestamptz not null default now()
);
grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "msg read" on public.messages for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy "msg insert" on public.messages for insert to authenticated with check (
  sender_id = auth.uid()
  and from_staff = public.has_role(auth.uid(),'admin')
  and (body is not null and length(btrim(body)) between 1 and 4000 or attachment_path is not null)
  and exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin')))
);

create or replace function public.touch_order() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger orders_touch before update on public.orders for each row execute function public.touch_order();

-- Server-side order creation: prices are read from the database, never from the client.
create or replace function public.create_order(
  _items jsonb, _customer_name text, _customer_phone text, _shipping jsonb, _notes text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _order_id uuid;
  _item jsonb;
  _p public.products%rowtype;
  _opt public.product_options%rowtype;
  _qty int;
  _unit numeric;
  _sel jsonb;
  _chosen jsonb;
  _val text;
  _delta numeric;
  _subtotal numeric := 0;
  _email text;
begin
  if _uid is null then raise exception 'Faça login para finalizar o pedido.'; end if;
  if _items is null or jsonb_array_length(_items) = 0 then raise exception 'O carrinho está vazio.'; end if;
  if jsonb_array_length(_items) > 50 then raise exception 'Itens demais no pedido.'; end if;
  if coalesce(length(btrim(_customer_name)),0) < 2 or length(_customer_name) > 120 then raise exception 'Informe um nome válido.'; end if;
  if coalesce(length(regexp_replace(_customer_phone,'\D','','g')),0) not between 10 and 13 then raise exception 'Informe um telefone válido.'; end if;
  if _notes is not null and length(_notes) > 2000 then raise exception 'Observações muito longas.'; end if;
  select email into _email from auth.users where id = _uid;

  insert into public.orders (user_id, kind, customer_name, customer_phone, customer_email, shipping_address, notes)
  values (_uid, 'compra', btrim(_customer_name), _customer_phone, _email, _shipping, _notes)
  returning id into _order_id;

  for _item in select * from jsonb_array_elements(_items) loop
    select * into _p from public.products where id = (_item->>'product_id')::uuid and active;
    if not found then raise exception 'Produto indisponível.'; end if;
    if _p.price is null then raise exception 'O produto % é vendido sob consulta.', _p.name; end if;
    _qty := (_item->>'quantity')::int;
    if _qty is null or _qty < 1 or _qty > 1000 then raise exception 'Quantidade inválida.'; end if;
    _unit := _p.price;
    _chosen := '[]'::jsonb;
    for _opt in select * from public.product_options where product_id = _p.id and active order by sort_order loop
      _val := _item->'options'->>(_opt.id::text);
      if _val is null or btrim(_val) = '' then
        if _opt.required then raise exception 'Preencha a opção "%" de %.', _opt.name, _p.name; end if;
        continue;
      end if;
      if length(_val) > 300 then raise exception 'Texto de personalização muito longo.'; end if;
      _delta := 0;
      if _opt.kind = 'select' then
        select c into _sel from jsonb_array_elements(_opt.choices) c where c->>'label' = _val limit 1;
        if _sel is null then raise exception 'Opção inválida para %.', _opt.name; end if;
        _delta := coalesce((_sel->>'price_delta')::numeric, 0);
      end if;
      _unit := _unit + _delta;
      _chosen := _chosen || jsonb_build_array(jsonb_build_object('name', _opt.name, 'value', _val, 'price_delta', _delta));
    end loop;
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, options, line_total)
    values (_order_id, _p.id, _p.name, _unit, _qty, _chosen, _unit * _qty);
    _subtotal := _subtotal + _unit * _qty;
  end loop;

  update public.orders set subtotal = _subtotal, total = _subtotal where id = _order_id;
  return _order_id;
end $$;
revoke execute on function public.create_order(jsonb,text,text,jsonb,text) from public, anon;
grant execute on function public.create_order(jsonb,text,text,jsonb,text) to authenticated;

create or replace function public.create_custom_request(
  _description text, _customer_name text, _customer_phone text, _product_id uuid
) returns uuid language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _id uuid; _email text;
begin
  if _uid is null then raise exception 'Faça login para enviar a solicitação.'; end if;
  if coalesce(length(btrim(_description)),0) < 10 or length(_description) > 4000 then raise exception 'Descreva o pedido com pelo menos 10 caracteres.'; end if;
  if coalesce(length(btrim(_customer_name)),0) < 2 then raise exception 'Informe um nome válido.'; end if;
  if coalesce(length(regexp_replace(_customer_phone,'\D','','g')),0) not between 10 and 13 then raise exception 'Informe um telefone válido.'; end if;
  select email into _email from auth.users where id = _uid;
  insert into public.orders (user_id, kind, customer_name, customer_phone, customer_email, notes)
  values (_uid, 'encomenda', btrim(_customer_name), _customer_phone, _email, _description) returning id into _id;
  if _product_id is not null then
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    select _id, p.id, p.name, 0, 1, 0 from public.products p where p.id = _product_id;
  end if;
  insert into public.messages (order_id, sender_id, from_staff, body) values (_id, _uid, false, _description);
  return _id;
end $$;
revoke execute on function public.create_custom_request(text,text,text,uuid) from public, anon;
grant execute on function public.create_custom_request(text,text,text,uuid) to authenticated;

alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.messages;

-- Storage: attachments/<order_id>/<file>
create policy "att read" on storage.objects for select to authenticated using (
  bucket_id = 'attachments' and exists (select 1 from public.orders o where o.id::text = (storage.foldername(name))[1] and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy "att insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'attachments' and exists (select 1 from public.orders o where o.id::text = (storage.foldername(name))[1] and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));
create policy "img read" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
create policy "img admin write" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.has_role(auth.uid(),'admin'));
create policy "img admin delete" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.has_role(auth.uid(),'admin'));

insert into public.categories (name, slug, description, sort_order) values
 ('Troféus', 'trofeus', 'Troféus personalizados para campeonatos de sinuca, truco, torneios e eventos.', 1),
 ('Presentes personalizados', 'presentes', 'Presentes feitos sob medida com impressão 3D e corte a laser.', 2),
 ('Decoração', 'decoracao', 'Objetos decorativos fabricados com precisão.', 3),
 ('Acessórios', 'acessorios', 'Acessórios funcionais e personalizados.', 4);