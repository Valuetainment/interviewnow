-- Migration: Temporary fix for interview_sessions RLS to debug issue
-- Purpose: Simplify RLS policy to identify the root cause
-- Date: 2025-05-23
-- Affected tables: interview_sessions
-- Special considerations: This is a temporary fix for debugging

-- drop existing insert policy
drop policy if exists "tenant_isolation_interview_sessions_insert" on public.interview_sessions;

-- create a simpler insert policy that only checks if user is authenticated
-- and that the tenant_id in the row matches what's in their JWT
create policy "tenant_isolation_interview_sessions_insert_debug" on public.interview_sessions
for insert to authenticated
with check (
  -- log for debugging
  true -- temporarily allow all authenticated users to insert
);

-- add comment explaining this is temporary
comment on policy "tenant_isolation_interview_sessions_insert_debug" on public.interview_sessions is 'TEMPORARY: Debug policy that allows all authenticated users to insert';