-- INICIO DEL SQL
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  industry text,
  phone_e164 text,
  created_at timestamptz default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text,
  phone_e164 text unique,
  role text not null default 'owner',
  created_at timestamptz default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text,
  phone_e164 text not null,
  source text,
  status text not null default 'new',
  meta jsonb,
  created_at timestamptz default now()
);
create index on public.leads (tenant_id, created_at);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  starts_at timestamptz not null,
  ends_at   timestamptz not null,
  status text not null default 'confirmed',
  created_at timestamptz default now()
);
create index on public.bookings (tenant_id, starts_at);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  provider text not null,
  amount_cents int not null,
  currency text not null default 'MXN',
  status text not null default 'pending',
  provider_ref text,
  created_at timestamptz default now()
);
create index on public.payments (tenant_id, created_at);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  direction text not null,
  channel text not null default 'whatsapp',
  body text not null,
  payload jsonb,
  created_at timestamptz default now()
);
create index on public.messages (tenant_id, created_at);

create table public.action_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor text not null,
  action text not null,
  ref_type text,
  ref_id uuid,
  details jsonb,
  created_at timestamptz default now()
);
create index on public.action_log (tenant_id, created_at);

create table public.outbox (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  target text not null,
  payload jsonb not null,
  status text not null default 'pending',
  attempt int not null default 0,
  last_error text,
  created_at timestamptz default now()
);
create index on public.outbox (tenant_id, status, created_at);

-- RLS
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.messages enable row level security;
alter table public.action_log enable row level security;
alter table public.outbox enable row level security;

create or replace function public.current_tenant_id()
returns uuid language sql stable as $$
  select tenant_id from public.profiles where id = auth.uid()
$$;

create policy p_tenants_ro on public.tenants
  for select using (id = public.current_tenant_id());

create policy p_profiles_rw on public.profiles
  for select using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy p_leads_rw on public.leads
  for select using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy p_bookings_rw on public.bookings
  for select using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy p_payments_rw on public.payments
  for select using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy p_messages_rw on public.messages
  for select using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy p_action_log_rw on public.action_log
  for select using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy p_outbox_rw on public.outbox
  for select using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
-- FIN DEL SQL
