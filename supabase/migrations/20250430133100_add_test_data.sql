-- Add test tenant
INSERT INTO tenants (name, plan_tier)
VALUES ('Test Organization', 'free')
ON CONFLICT DO NOTHING;

-- Link first user to test tenant
WITH first_tenant AS (
  SELECT id FROM tenants ORDER BY created_at LIMIT 1
),
first_user AS (
  SELECT id FROM auth.users ORDER BY created_at LIMIT 1
)
INSERT INTO users (id, tenant_id, role)
SELECT first_user.id, first_tenant.id, 'admin'
FROM first_user, first_tenant
ON CONFLICT (id) DO UPDATE
SET tenant_id = EXCLUDED.tenant_id;

-- Add RLS policies for allow tenant members to insert data
DROP POLICY IF EXISTS tenant_insert_companies ON companies;
CREATE POLICY tenant_insert_companies ON companies 
  FOR INSERT WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS tenant_insert_candidates ON candidates;
CREATE POLICY tenant_insert_candidates ON candidates 
  FOR INSERT WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

DROP POLICY IF EXISTS tenant_insert_positions ON positions;
CREATE POLICY tenant_insert_positions ON positions 
  FOR INSERT WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  )); 