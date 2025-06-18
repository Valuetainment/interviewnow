-- candidates table schema
-- stores candidate information

create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  skills text[],
  experience jsonb,
  education text,
  resume_url text,
  resume_text text,
  resume_analysis jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- enable row level security
alter table public.candidates enable row level security;

-- rls policies for anon role
create policy "anon_select_candidates"
  on public.candidates
  for select
  to anon
  using (false); -- anon users cannot view candidates

create policy "anon_insert_candidates"
  on public.candidates
  for insert
  to anon
  with check (false); -- anon users cannot insert candidates

create policy "anon_update_candidates"
  on public.candidates
  for update
  to anon
  using (false); -- anon users cannot update candidates

create policy "anon_delete_candidates"
  on public.candidates
  for delete
  to anon
  using (false); -- anon users cannot delete candidates

-- rls policies for authenticated role
create policy "authenticated_select_candidates"
  on public.candidates
  for select
  to authenticated
  using (
    tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid())
    or email = auth.email()
  );

create policy "authenticated_insert_candidates"
  on public.candidates
  for insert
  to authenticated
  with check (
    tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid())
  );

create policy "authenticated_update_candidates"
  on public.candidates
  for update
  to authenticated
  using (
    tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid())
  );

create policy "authenticated_delete_candidates"
  on public.candidates
  for delete
  to authenticated
  using (
    tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid())
  );

-- create indexes for performance
create index if not exists idx_candidates_tenant_id on public.candidates(tenant_id);
create index if not exists idx_candidates_email on public.candidates(email);