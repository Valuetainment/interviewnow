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
