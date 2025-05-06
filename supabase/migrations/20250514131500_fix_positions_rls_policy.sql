-- migration: fix positions table rls policy
-- purpose: replace the current policy that uses jwt claim with more reliable user lookup
-- date: 2025-05-14
--
-- this migration fixes the issue where positions could not be created because
-- the current rls policy relies on a jwt claim (request.jwt.claim.tenant_id) that doesn't exist.
-- instead, we'll look up the tenant_id from the users table based on the authenticated user's uuid.

-- first, drop the existing policy that's causing the issue
drop policy if exists tenant_isolation_positions on positions;

-- create explicit granular policies for each operation:

-- select policy - allow users to view positions from their tenant
create policy positions_select_policy on positions
  for select
  to authenticated
  using (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));

-- insert policy - ensure new positions are created in the user's tenant
create policy positions_insert_policy on positions
  for insert
  to authenticated
  with check (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));

-- update policy - ensure users can only update positions in their tenant
create policy positions_update_policy on positions
  for update
  to authenticated
  using (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ))
  with check (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));

-- delete policy - ensure users can only delete positions in their tenant
create policy positions_delete_policy on positions
  for delete
  to authenticated
  using (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));

-- add a detailed comment to document the policy change
comment on table positions is 'Job positions with detailed description sections for interviewing candidates. Secured with tenant-based RLS policies.'; 