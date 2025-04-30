-- Drop all company policies for a clean slate
DROP POLICY IF EXISTS tenant_isolation_companies ON companies;
DROP POLICY IF EXISTS tenant_all_operations_companies ON companies;
DROP POLICY IF EXISTS tenant_insert_companies ON companies;
DROP POLICY IF EXISTS tenant_select_companies ON companies;
DROP POLICY IF EXISTS tenant_update_companies ON companies;
DROP POLICY IF EXISTS tenant_delete_companies ON companies;

-- Create a simple policy for authenticated users to do anything
CREATE POLICY allow_all_for_authenticated ON companies
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create a trigger to automatically set tenant_id on insert
CREATE OR REPLACE FUNCTION set_tenant_id_on_company_insert()
RETURNS TRIGGER AS $$
DECLARE
  user_tenant_id UUID;
BEGIN
  -- Get tenant_id from users table based on current user
  SELECT tenant_id INTO user_tenant_id
  FROM users
  WHERE id = auth.uid();
  
  -- Set the tenant_id if it's NULL
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := user_tenant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for companies table
DROP TRIGGER IF EXISTS set_tenant_id_on_company_insert ON companies;
CREATE TRIGGER set_tenant_id_on_company_insert
BEFORE INSERT ON companies
FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_company_insert(); 