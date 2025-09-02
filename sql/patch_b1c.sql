-- Patch B1C: Estados de lead y métricas estrictas
-- Ejecutar en SQL Editor de Supabase

-- Campos extra para trazabilidad de estado
alter table public.leads
  add column if not exists last_status_change timestamptz default now(),
  add column if not exists lost_reason text;

-- Índices útiles
create index if not exists idx_leads_tenant_status on public.leads (tenant_id, status);
create index if not exists idx_payments_tenant_status_created on public.payments (tenant_id, status, created_at);
