-- Migration: Add company_id to interview_sessions table
-- Description: Adds a company_id column to the interview_sessions table to track which specific company an interview is for
-- Date: 2025-05-21

-- add company_id column to interview_sessions table
alter table public.interview_sessions
add column company_id uuid references public.companies(id);

-- add an index for the new column for better query performance
create index idx_interview_sessions_company_id on public.interview_sessions(company_id);

-- update tenant isolation policy to include checking company_id's tenant matches the user's tenant
-- this helps ensure that users can only access interviews for companies in their tenant
drop policy if exists "tenant_isolation_interview_sessions" on public.interview_sessions;

-- recreate the policy with company tenant verification
create policy "tenant_isolation_interview_sessions" on public.interview_sessions
for select to authenticated
using (
  tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid
  and
  exists (
    select 1 from public.companies
    where companies.id = interview_sessions.company_id
    and companies.tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid
  )
);

-- add specific policies for insert, update, and delete
create policy "tenant_isolation_interview_sessions_insert" on public.interview_sessions
for insert to authenticated
with check (
  tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid
  and
  exists (
    select 1 from public.companies
    where companies.id = interview_sessions.company_id
    and companies.tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid
  )
);

create policy "tenant_isolation_interview_sessions_update" on public.interview_sessions
for update to authenticated
using (
  tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid
  and
  exists (
    select 1 from public.companies
    where companies.id = interview_sessions.company_id
    and companies.tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid
  )
)
with check (
  tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid
  and
  exists (
    select 1 from public.companies
    where companies.id = interview_sessions.company_id
    and companies.tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid
  )
);

create policy "tenant_isolation_interview_sessions_delete" on public.interview_sessions
for delete to authenticated
using (
  tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid
  and
  exists (
    select 1 from public.companies
    where companies.id = interview_sessions.company_id
    and companies.tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid
  )
); 