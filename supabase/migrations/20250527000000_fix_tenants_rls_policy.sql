-- Migration: Fix tenants table RLS policy
-- Purpose: Replace policy using request.jwt.claim.tenant_id with proper tenant lookup
-- Date: 2025-05-27
--
-- This migration resolves the error: "unrecognized configuration parameter 'request.jwt.claim.tenant_id'"
-- by replacing policies that use JWT claims with proper tenant lookups through the users table.
-- It also adds comprehensive RLS policies for all operations and roles.

-- Drop all existing policies on tenants table to start fresh
drop policy if exists tenant_isolation_tenants on public.tenants;
drop policy if exists tenant_view_policy on public.tenants;

-- SELECT policies - one for each role
create policy "tenants are viewable by authenticated users who belong to them" 
on public.tenants
for select 
to authenticated
using (
  id in (select tenant_id from public.users where id = (select auth.uid()))
);

create policy "tenants are viewable by service role" 
on public.tenants
for select 
to service_role
using (true);

create policy "tenants are viewable by anon users during initial loading" 
on public.tenants
for select 
to anon
using (true);

-- INSERT policies
create policy "tenants can only be created by service role" 
on public.tenants
for insert 
to service_role
with check (true);

-- UPDATE policies
create policy "tenants can only be updated by authenticated users who belong to them" 
on public.tenants
for update 
to authenticated
using (
  id in (select tenant_id from public.users where id = (select auth.uid()))
)
with check (
  id in (select tenant_id from public.users where id = (select auth.uid()))
);

create policy "tenants can be updated by service role" 
on public.tenants
for update 
to service_role
using (true)
with check (true);

-- DELETE policies
create policy "tenants can only be deleted by service role" 
on public.tenants
for delete 
to service_role
using (true);

-- Add comments documenting the approach
comment on table public.tenants 
  is 'Organizations using the platform with multi-tenant isolation. Secured with comprehensive RLS policies.'; 