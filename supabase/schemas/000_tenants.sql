-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Tenants table schema
create table if not exists public.tenants (
  id uuid primary key default extensions.uuid_generate_v4(),
  name text not null,
  plan_tier text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.tenants is 'Organizations using the platform with multi-tenant isolation';

-- Enable RLS
alter table public.tenants enable row level security;

-- RLS policy for viewing tenants
create policy tenant_view_policy on public.tenants 
  for select 
  using (
    id = (select users.tenant_id from public.users where users.id = auth.uid()) 
    or auth.role() = 'service_role'
  );

-- RLS policy for tenant isolation
create policy tenant_isolation_tenants on public.tenants 
  using (id = (current_setting('request.jwt.claim.tenant_id')::uuid)); 