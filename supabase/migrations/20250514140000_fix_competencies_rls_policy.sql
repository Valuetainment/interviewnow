-- migration: fix competencies table rls policy
-- purpose: replace the current policy that uses jwt claim with more reliable user lookup
-- date: 2025-05-14
--
-- this migration fixes the issue where competencies could not be created because
-- the current rls policy relies on a jwt claim (request.jwt.claim.tenant_id) that doesn't exist.
-- instead, we'll look up the tenant_id from the users table based on the authenticated user's uuid.

-- first, drop the existing policy that's causing the issue
drop policy if exists tenant_isolation_competencies on competencies;

-- create explicit granular policies for each operation:

-- select policy - allow users to view competencies from their tenant
create policy competencies_select_policy on competencies
  for select
  to authenticated
  using (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));

-- insert policy - ensure new competencies are created in the user's tenant
create policy competencies_insert_policy on competencies
  for insert
  to authenticated
  with check (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));

-- update policy - ensure users can only update competencies in their tenant
create policy competencies_update_policy on competencies
  for update
  to authenticated
  using (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ))
  with check (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));

-- delete policy - ensure users can only delete competencies in their tenant
create policy competencies_delete_policy on competencies
  for delete
  to authenticated
  using (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));

-- fix position_competencies table policies too
drop policy if exists tenant_isolation_position_competencies on position_competencies;

-- select policy for position_competencies
create policy position_competencies_select_policy on position_competencies
  for select
  to authenticated
  using (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));

-- insert policy for position_competencies
create policy position_competencies_insert_policy on position_competencies
  for insert
  to authenticated
  with check (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));

-- update policy for position_competencies
create policy position_competencies_update_policy on position_competencies
  for update
  to authenticated
  using (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ))
  with check (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));

-- delete policy for position_competencies
create policy position_competencies_delete_policy on position_competencies
  for delete
  to authenticated
  using (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));

-- add detailed comments to document the policy changes
comment on table competencies is 'Competencies for positions with proper tenant-based RLS policies';
comment on table position_competencies is 'Junction table linking positions and competencies with proper tenant-based RLS policies'; 