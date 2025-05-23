-- Migration: Fix interview_sessions RLS with proper authentication checks
-- Purpose: Update RLS policies to properly handle JWT claims and authentication
-- Date: 2025-05-23
-- Affected tables: interview_sessions
-- Special considerations: Handles edge cases where JWT might not be properly populated

-- drop temporary debug policy if it exists
drop policy if exists "tenant_isolation_interview_sessions_insert_debug" on public.interview_sessions;

-- drop existing policies
drop policy if exists "tenant_isolation_interview_sessions_insert" on public.interview_sessions;
drop policy if exists "tenant_isolation_interview_sessions_select" on public.interview_sessions;
drop policy if exists "tenant_isolation_interview_sessions_update" on public.interview_sessions;
drop policy if exists "tenant_isolation_interview_sessions_delete" on public.interview_sessions;

-- update the get_tenant_id function to handle auth context better
create or replace function auth.get_tenant_id()
returns uuid
language plpgsql
security definer
stable
as $$
declare
  tenant_id uuid;
  current_user_id uuid;
begin
  -- get the current user id
  current_user_id := auth.uid();
  
  -- if no user is authenticated, return null
  if current_user_id is null then
    return null;
  end if;
  
  -- first try to get tenant_id from top-level JWT claim
  tenant_id := nullif(auth.jwt() ->> 'tenant_id', '')::uuid;
  
  if tenant_id is not null then
    return tenant_id;
  end if;
  
  -- try app_metadata
  tenant_id := nullif(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::uuid;
  
  if tenant_id is not null then
    return tenant_id;
  end if;
  
  -- try user_metadata
  tenant_id := nullif(auth.jwt() -> 'user_metadata' ->> 'tenant_id', '')::uuid;
  
  if tenant_id is not null then
    return tenant_id;
  end if;
  
  -- if still not found, try to get from users table
  select u.tenant_id into tenant_id
  from public.users u
  where u.id = current_user_id;
  
  return tenant_id;
end;
$$;

-- recreate policies with better error handling

-- select policy
create policy "tenant_isolation_interview_sessions_select" on public.interview_sessions
for select to authenticated
using (
  -- user must be authenticated
  auth.uid() is not null
  and
  -- tenant_id must match
  tenant_id = auth.get_tenant_id()
  and
  -- company must belong to same tenant or be null
  (
    company_id is null
    or exists (
      select 1 from public.companies c
      where c.id = interview_sessions.company_id
      and c.tenant_id = auth.get_tenant_id()
    )
  )
);

-- insert policy - more permissive to help debug
create policy "tenant_isolation_interview_sessions_insert" on public.interview_sessions
for insert to authenticated
with check (
  -- user must be authenticated
  auth.uid() is not null
  and
  -- the tenant_id being inserted must match user's tenant
  tenant_id = auth.get_tenant_id()
  and
  -- if a company_id is provided, it must belong to the same tenant
  (
    company_id is null
    or exists (
      select 1 from public.companies c
      where c.id = interview_sessions.company_id
      and c.tenant_id = tenant_id -- use the tenant_id from the insert
    )
  )
);

-- update policy
create policy "tenant_isolation_interview_sessions_update" on public.interview_sessions
for update to authenticated
using (
  auth.uid() is not null
  and tenant_id = auth.get_tenant_id()
  and (
    company_id is null
    or exists (
      select 1 from public.companies c
      where c.id = interview_sessions.company_id
      and c.tenant_id = auth.get_tenant_id()
    )
  )
)
with check (
  auth.uid() is not null
  and tenant_id = auth.get_tenant_id()
  and (
    company_id is null
    or exists (
      select 1 from public.companies c
      where c.id = interview_sessions.company_id
      and c.tenant_id = auth.get_tenant_id()
    )
  )
);

-- delete policy
create policy "tenant_isolation_interview_sessions_delete" on public.interview_sessions
for delete to authenticated
using (
  auth.uid() is not null
  and tenant_id = auth.get_tenant_id()
  and (
    company_id is null
    or exists (
      select 1 from public.companies c
      where c.id = interview_sessions.company_id
      and c.tenant_id = auth.get_tenant_id()
    )
  )
);

-- add helpful comments
comment on function auth.get_tenant_id is 'Gets tenant_id from JWT claims or users table, with proper null handling';
comment on policy "tenant_isolation_interview_sessions_select" on public.interview_sessions is 'Allows authenticated users to view their tenant interview sessions';
comment on policy "tenant_isolation_interview_sessions_insert" on public.interview_sessions is 'Allows authenticated users to create interview sessions for their tenant';
comment on policy "tenant_isolation_interview_sessions_update" on public.interview_sessions is 'Allows authenticated users to update their tenant interview sessions';
comment on policy "tenant_isolation_interview_sessions_delete" on public.interview_sessions is 'Allows authenticated users to delete their tenant interview sessions';