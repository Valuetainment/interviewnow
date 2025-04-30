-- Fix users policy to prevent infinite recursion
DROP POLICY IF EXISTS tenant_isolation_users ON users;

-- Simpler policy that just checks if the user ID matches
CREATE POLICY tenant_isolation_users ON users
  USING (id = auth.uid());

-- Add explicit FOR ALL to company policy to ensure all operations work
DROP POLICY IF EXISTS tenant_isolation_companies ON companies;
CREATE POLICY tenant_isolation_companies ON companies
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- Add explicit policy for adding companies
DROP POLICY IF EXISTS tenant_all_operations_companies ON companies;
CREATE POLICY tenant_all_operations_companies ON companies
  FOR ALL TO authenticated
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ))
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  )); 