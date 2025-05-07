-- Competencies table schema
create table if not exists public.competencies (
  id uuid primary key default extensions.uuid_generate_v4(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.competencies is 'Skills and competencies required for positions';

-- Create index for better query performance
create index if not exists idx_competencies_tenant_id on public.competencies(tenant_id);

-- Enable RLS
alter table public.competencies enable row level security;

-- RLS policy for tenant isolation
create policy tenant_isolation_competencies on public.competencies
  using (tenant_id = (current_setting('request.jwt.claim.tenant_id')::uuid));

-- Position competencies join table with weights
create table if not exists public.position_competencies (
  position_id uuid not null references public.positions(id) on delete cascade,
  competency_id uuid not null references public.competencies(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  weight integer not null check (weight >= 0 and weight <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (position_id, competency_id)
);

comment on table public.position_competencies is 'Join table connecting positions with competencies and their weights';

-- Create index for better query performance
create index if not exists idx_position_competencies_tenant_id on public.position_competencies(tenant_id);

-- Enable RLS
alter table public.position_competencies enable row level security;

-- RLS policy for tenant isolation
create policy tenant_isolation_position_competencies on public.position_competencies
  using (tenant_id = (current_setting('request.jwt.claim.tenant_id')::uuid));

-- Create trigger function to validate position competency weights
create or replace function public.validate_position_competency_weights()
returns trigger as $$
declare
  total_weight integer;
begin
  -- Calculate the total weight for the position including the new/updated row
  select sum(weight) into total_weight
  from public.position_competencies
  where position_id = new.position_id and tenant_id = new.tenant_id;
  
  -- Check if the total weight exceeds 100
  if total_weight > 100 then
    raise exception 'Total weight for position competencies cannot exceed 100';
  end if;
  
  return new;
end;
$$ language plpgsql security invoker set search_path = '';

-- Create trigger for the function
create trigger check_position_competency_weights
before insert or update on public.position_competencies
for each row execute function public.validate_position_competency_weights(); 