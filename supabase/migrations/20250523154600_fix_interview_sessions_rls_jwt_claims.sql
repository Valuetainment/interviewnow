-- Migration: Fix interview_sessions RLS policies to handle JWT claims properly
-- Purpose: Update RLS policies to check both top-level tenant_id and app_metadata tenant_id
-- Date: 2025-05-23
-- Affected tables: interview_sessions
-- Special considerations: This handles cases where JWT custom claims hook may not be configured

-- drop existing policies
drop policy if exists "tenant_isolation_interview_sessions" on public.interview_sessions;
drop policy if exists "tenant_isolation_interview_sessions_insert" on public.interview_sessions;
drop policy if exists "tenant_isolation_interview_sessions_update" on public.interview_sessions;
drop policy if exists "tenant_isolation_interview_sessions_delete" on public.interview_sessions;

-- create helper function to get tenant_id from JWT
-- this function checks multiple locations for tenant_id to handle different JWT configurations
create or replace function auth.get_tenant_id()
returns uuid
language plpgsql
security definer
stable
as $$
declare
  tenant_id uuid;
begin
  -- first try to get tenant_id from top-level JWT claim (if custom claims hook is configured)
  tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;
  
  if tenant_id is not null then
    return tenant_id;
  end if;
  
  -- if not found, try app_metadata (standard location)
  tenant_id := (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
  
  if tenant_id is not null then
    return tenant_id;
  end if;
  
  -- if still not found, try user_metadata as fallback
  tenant_id := (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid;
  
  return tenant_id;
end;
$$;

-- grant execute permission to authenticated users
grant execute on function auth.get_tenant_id to authenticated;

-- add comment explaining the function
comment on function auth.get_tenant_id is 'Retrieves tenant_id from JWT, checking multiple locations for compatibility';

-- recreate select policy using the helper function
create policy "tenant_isolation_interview_sessions_select" on public.interview_sessions
for select to authenticated
using (
  tenant_id = auth.get_tenant_id()
  and (
    company_id is null
    or exists (
      select 1 from public.companies
      where companies.id = interview_sessions.company_id
      and companies.tenant_id = auth.get_tenant_id()
    )
  )
);

-- recreate insert policy using the helper function
create policy "tenant_isolation_interview_sessions_insert" on public.interview_sessions
for insert to authenticated
with check (
  tenant_id = auth.get_tenant_id()
  and (
    company_id is null
    or exists (
      select 1 from public.companies
      where companies.id = interview_sessions.company_id
      and companies.tenant_id = auth.get_tenant_id()
    )
  )
);

-- recreate update policy using the helper function
create policy "tenant_isolation_interview_sessions_update" on public.interview_sessions
for update to authenticated
using (
  tenant_id = auth.get_tenant_id()
  and (
    company_id is null
    or exists (
      select 1 from public.companies
      where companies.id = interview_sessions.company_id
      and companies.tenant_id = auth.get_tenant_id()
    )
  )
)
with check (
  tenant_id = auth.get_tenant_id()
  and (
    company_id is null
    or exists (
      select 1 from public.companies
      where companies.id = interview_sessions.company_id
      and companies.tenant_id = auth.get_tenant_id()
    )
  )
);

-- recreate delete policy using the helper function
create policy "tenant_isolation_interview_sessions_delete" on public.interview_sessions
for delete to authenticated
using (
  tenant_id = auth.get_tenant_id()
  and (
    company_id is null
    or exists (
      select 1 from public.companies
      where companies.id = interview_sessions.company_id
      and companies.tenant_id = auth.get_tenant_id()
    )
  )
);

-- add comment to explain the policies
comment on policy "tenant_isolation_interview_sessions_select" on public.interview_sessions is 'Allows authenticated users to select interview sessions for their tenant';
comment on policy "tenant_isolation_interview_sessions_insert" on public.interview_sessions is 'Allows authenticated users to insert interview sessions for their tenant';
comment on policy "tenant_isolation_interview_sessions_update" on public.interview_sessions is 'Allows authenticated users to update interview sessions for their tenant';
comment on policy "tenant_isolation_interview_sessions_delete" on public.interview_sessions is 'Allows authenticated users to delete interview sessions for their tenant';