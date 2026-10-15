-- Additive only: does not alter existing orders, products, or order status constraints.
-- Apply manually to the existing Supabase project only after reviewing this migration.
create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete restrict,
  provedor text not null default 'mercado_pago' check (provedor = 'mercado_pago'),
  preferencia_id text unique,
  pagamento_externo_id text unique,
  status text not null default 'iniciando'
    check (status in ('iniciando', 'pendente', 'aprovado', 'recusado', 'cancelado', 'reembolsado', 'em_analise', 'erro')),
  valor_itens numeric(12,2) not null check (valor_itens >= 0),
  valor_frete numeric(12,2) not null default 0 check (valor_frete >= 0),
  valor_total numeric(12,2) not null check (valor_total > 0),
  moeda text not null default 'BRL' check (moeda = 'BRL'),
  status_provedor text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  confirmado_em timestamptz
);

create index if not exists pagamentos_pedido_id_idx on public.pagamentos(pedido_id);
create index if not exists pagamentos_status_idx on public.pagamentos(status);

alter table public.pagamentos enable row level security;

-- All reads/writes go through trusted Edge Functions. No client policy is granted.
revoke all on table public.pagamentos from anon, authenticated;
grant all on table public.pagamentos to service_role;

comment on table public.pagamentos is
  'Tentativas de pagamento Mercado Pago. Não armazena dados de cartão; acesso apenas pelo backend.';
