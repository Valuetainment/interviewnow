-- Ensure Acme Corp tenant exists
INSERT INTO tenants (name, plan_tier)
VALUES ('Acme Corp', 'free')
ON CONFLICT DO NOTHING;

-- Link authenticated user to Acme Corp
WITH acme_tenant AS (
  SELECT id FROM tenants WHERE name = 'Acme Corp' LIMIT 1
),
first_user AS (
  SELECT id FROM auth.users ORDER BY created_at LIMIT 1
)
INSERT INTO users (id, tenant_id, role)
SELECT first_user.id, acme_tenant.id, 'admin'
FROM first_user, acme_tenant
ON CONFLICT (id) DO UPDATE
SET tenant_id = EXCLUDED.tenant_id;

-- Make sure we grant appropriate permissions 
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create a test company for the tenant
WITH acme_tenant AS (
  SELECT id FROM tenants WHERE name = 'Acme Corp' LIMIT 1
)
INSERT INTO companies (name, tenant_id, culture, story, values, benefits)
SELECT 
  'Acme Test Company', 
  acme_tenant.id,
  'Innovative culture focused on growth',
  'Founded in 2020 with a mission to change the world',
  'Integrity, Excellence, Innovation',
  'Health insurance, 401k, unlimited PTO'
FROM acme_tenant
ON CONFLICT DO NOTHING; 