-- Enhanced Positions table schema
-- Includes basic fields plus detailed job description sections

create table if not exists public.positions (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  description text,
  role_overview text,
  key_responsibilities text,
  required_qualifications text,
  preferred_qualifications text,
  benefits text,
  key_competencies_section text,
  experience_level text,
  company_id uuid references public.companies(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.positions is 'Job positions with detailed description sections for interviewing candidates';

-- Create index for better query performance
create index if not exists idx_positions_tenant_id on public.positions(tenant_id);
create index if not exists idx_positions_company_id on public.positions(company_id);

-- Enable RLS
alter table public.positions enable row level security;

-- RLS policy for tenant isolation
create policy tenant_isolation_positions on public.positions 
  using (tenant_id = (current_setting('request.jwt.claim.tenant_id')::uuid)); 