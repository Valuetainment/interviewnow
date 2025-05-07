-- Migration to ensure companies table exists
-- This migration safely creates the companies table only if it doesn't already exist

-- First, check if the companies table exists
DO $check_and_create$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'companies'
    ) THEN
        -- Create companies table for organization profiles
        CREATE TABLE companies (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          name TEXT NOT NULL,
          culture TEXT,
          story TEXT,
          values TEXT,
          benefits TEXT,
          core_values JSONB DEFAULT '[]'::jsonb,
          benefits_list JSONB DEFAULT '[]'::jsonb,
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE
        );

        -- Enable RLS
        ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

        -- Create policy for tenant isolation - using user_id lookup instead of direct JWT claim
        CREATE POLICY tenant_isolation_companies ON companies
          USING (tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
          ));

        -- Create index for performance
        CREATE INDEX idx_companies_tenant_id ON companies(tenant_id);
        
        -- Create function for setting tenant_id if not provided
        CREATE OR REPLACE FUNCTION set_tenant_id_on_company_insert()
        RETURNS TRIGGER AS $trigger_func$
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
        $trigger_func$ LANGUAGE plpgsql;

        -- Add trigger to set tenant_id automatically on company creation
        CREATE TRIGGER set_tenant_id_on_company_insert
        BEFORE INSERT ON companies
        FOR EACH ROW EXECUTE FUNCTION set_tenant_id_on_company_insert();
        
        RAISE NOTICE 'Created companies table and associated policies/triggers';
    ELSE
        RAISE NOTICE 'Companies table already exists, no action taken';
    END IF;
END $check_and_create$; 