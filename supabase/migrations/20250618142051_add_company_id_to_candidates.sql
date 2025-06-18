-- Migration: add_company_id_to_candidates
-- Created: Wed Jun 18 02:20:51 PM EDT 2025
-- 
-- Description: [Add description here]

-- Add your SQL here

-- Add company_id to candidates table
-- First add the column as nullable
ALTER TABLE candidates 
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- For existing candidates, assign them to the first company in their tenant
-- (or you could delete them if preferred)
UPDATE candidates c
SET company_id = (
  SELECT id 
  FROM companies 
  WHERE tenant_id = c.tenant_id 
  ORDER BY created_at ASC 
  LIMIT 1
)
WHERE company_id IS NULL;

-- Now make the column NOT NULL
ALTER TABLE candidates 
ALTER COLUMN company_id SET NOT NULL;

-- Create index for better query performance
CREATE INDEX idx_candidates_company_id ON candidates(company_id);

-- Update RLS policy to enforce company_id requirement
-- Drop the existing policy first
DROP POLICY IF EXISTS "candidates_access_policy" ON candidates;

-- Create new policy that enforces company association
CREATE POLICY "candidates_company_tenant_access" ON candidates
  FOR ALL
  USING (
    CASE 
      WHEN auth.role() = 'service_role' THEN true
      WHEN auth.role() = 'authenticated' THEN 
        tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
        OR email = auth.email()  -- Allow candidates to see their own profile
      ELSE false
    END
  )
  WITH CHECK (
    CASE 
      WHEN auth.role() = 'service_role' THEN true
      WHEN auth.role() = 'authenticated' THEN 
        tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
        AND company_id IS NOT NULL  -- Ensure company association is enforced
      ELSE false
    END
  );

-- Add comment to document the relationship
COMMENT ON COLUMN candidates.company_id IS 'Required reference to the company this candidate is associated with. Deleting a company will cascade delete all its candidates';

