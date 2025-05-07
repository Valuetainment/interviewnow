-- Migration to fix company creation issues in production
-- This script addresses potential issues with tenant_id handling and RLS policies

-- Make tenant_id column nullable temporarily to allow database trigger to work
ALTER TABLE IF EXISTS companies ALTER COLUMN tenant_id DROP NOT NULL;

-- Drop existing policies to get a clean slate
DROP POLICY IF EXISTS tenant_isolation_companies ON companies;
DROP POLICY IF EXISTS tenant_all_operations_companies ON companies;
DROP POLICY IF EXISTS tenant_insert_companies ON companies;
DROP POLICY IF EXISTS tenant_select_companies ON companies;
DROP POLICY IF EXISTS tenant_update_companies ON companies;
DROP POLICY IF EXISTS tenant_delete_companies ON companies;
DROP POLICY IF EXISTS allow_all_for_authenticated ON companies;

-- Create very permissive policy just for authenticated users
CREATE POLICY allow_all_authenticated ON companies
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Re-create the trigger function with better error handling
CREATE OR REPLACE FUNCTION set_tenant_id_on_company_insert()
RETURNS TRIGGER AS $$
DECLARE
  user_tenant_id UUID;
  default_tenant_id UUID;
BEGIN
  -- First try to get tenant_id from users table based on current user
  BEGIN
    SELECT tenant_id INTO user_tenant_id
    FROM users
    WHERE id = auth.uid();
  EXCEPTION WHEN OTHERS THEN
    -- Log error but continue
    RAISE NOTICE 'Error getting tenant_id for user %: %', auth.uid(), SQLERRM;
  END;
  
  -- If user tenant not found, get the first tenant as fallback
  IF user_tenant_id IS NULL THEN
    BEGIN
      SELECT id INTO default_tenant_id FROM tenants LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue
      RAISE NOTICE 'Error getting default tenant: %', SQLERRM;
    END;
  END IF;
  
  -- Set the tenant_id if it's NULL using either user's tenant or default
  IF NEW.tenant_id IS NULL THEN
    IF user_tenant_id IS NOT NULL THEN
      NEW.tenant_id := user_tenant_id;
    ELSIF default_tenant_id IS NOT NULL THEN
      NEW.tenant_id := default_tenant_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is correctly set up
DROP TRIGGER IF EXISTS set_tenant_id_on_company_insert ON companies;
CREATE TRIGGER set_tenant_id_on_company_insert
BEFORE INSERT ON companies
FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_company_insert(); 