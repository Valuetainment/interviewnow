-- Drop existing policies to clean up
DROP POLICY IF EXISTS tenant_isolation_companies ON companies;
DROP POLICY IF EXISTS tenant_all_operations_companies ON companies;
DROP POLICY IF EXISTS tenant_insert_companies ON companies;

-- Create simplified policies
-- For SELECT
CREATE POLICY tenant_select_companies ON companies
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- For INSERT
CREATE POLICY tenant_insert_companies ON companies
  FOR INSERT WITH CHECK (
    -- Allow insert if tenant_id matches user's tenant
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- For UPDATE
CREATE POLICY tenant_update_companies ON companies
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  )
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- For DELETE
CREATE POLICY tenant_delete_companies ON companies
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

-- Function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  tenant_id UUID;
BEGIN
  SELECT u.tenant_id INTO tenant_id
  FROM users u
  WHERE u.id = auth.uid();
  
  RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 