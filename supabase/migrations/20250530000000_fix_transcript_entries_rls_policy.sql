-- Fix transcript_entries RLS policies that use non-existent JWT claim
-- This resolves the error: "unrecognized configuration parameter 'request.jwt.claim.tenant_id'"

-- Drop existing policies that use the problematic JWT claim
DROP POLICY IF EXISTS "Transcript entries are accessible within tenant" ON transcript_entries;

-- Create new policy for SELECT operations
CREATE POLICY "Users can view transcript entries within their tenant"
  ON transcript_entries
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Create policy for INSERT operations
CREATE POLICY "Users can insert transcript entries within their tenant"
  ON transcript_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Create policy for UPDATE operations
CREATE POLICY "Users can update transcript entries within their tenant"
  ON transcript_entries
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Create policy for DELETE operations
CREATE POLICY "Users can delete transcript entries within their tenant"
  ON transcript_entries
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM users 
      WHERE id = auth.uid()
    )
  );

-- Create policy for service role (full access)
CREATE POLICY "Service role has full access to transcript entries"
  ON transcript_entries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment to document the fix
COMMENT ON TABLE transcript_entries IS 'Stores interview transcript entries with proper tenant-based RLS policies that use user table lookup instead of JWT claims';