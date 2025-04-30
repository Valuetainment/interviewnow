-- Make tenant_id column nullable temporarily to allow inserts without it
ALTER TABLE companies ALTER COLUMN tenant_id DROP NOT NULL;

-- Modify the trigger function to set a default tenant_id if user's is not found
CREATE OR REPLACE FUNCTION set_tenant_id_on_company_insert()
RETURNS TRIGGER AS $$
DECLARE
  default_tenant_id UUID;
BEGIN
  -- Get the first tenant_id as a fallback
  SELECT id INTO default_tenant_id FROM tenants LIMIT 1;
  
  -- Set the tenant_id if it's NULL
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := default_tenant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create explicit function to get tenant ID for frontend
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID AS $$
DECLARE
  tenant_id UUID;
BEGIN
  -- Try to get from users table first
  SELECT u.tenant_id INTO tenant_id
  FROM public.users u
  WHERE u.id = auth.uid();
  
  -- If not found, get the first tenant as fallback
  IF tenant_id IS NULL THEN
    SELECT id INTO tenant_id FROM public.tenants LIMIT 1;
  END IF;
  
  RETURN tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a row for test data to ensure we have values
INSERT INTO tenants (name, plan_tier)
VALUES ('Default Test Tenant', 'free')
ON CONFLICT DO NOTHING; 