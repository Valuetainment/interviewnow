-- Drop existing RLS policies
DROP POLICY IF EXISTS tenant_isolation_tenants ON tenants;
DROP POLICY IF EXISTS tenant_isolation_users ON users;
DROP POLICY IF EXISTS tenant_isolation_candidates ON candidates;
DROP POLICY IF EXISTS tenant_isolation_positions ON positions;
DROP POLICY IF EXISTS tenant_isolation_competencies ON competencies;
DROP POLICY IF EXISTS tenant_isolation_position_competencies ON position_competencies;
DROP POLICY IF EXISTS tenant_isolation_interview_sessions ON interview_sessions;
DROP POLICY IF EXISTS tenant_isolation_transcript_entries ON transcript_entries;
DROP POLICY IF EXISTS tenant_isolation_candidate_assessments ON candidate_assessments;
DROP POLICY IF EXISTS tenant_isolation_interview_invitations ON interview_invitations;
DROP POLICY IF EXISTS tenant_isolation_usage_events ON usage_events;

-- Create updated policies for tenant isolation
CREATE POLICY tenant_isolation_tenants ON tenants
  USING (id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY tenant_isolation_users ON users
  USING (id = auth.uid() OR tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY tenant_isolation_candidates ON candidates
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY tenant_isolation_positions ON positions
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY tenant_isolation_competencies ON competencies
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY tenant_isolation_position_competencies ON position_competencies
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY tenant_isolation_interview_sessions ON interview_sessions
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY tenant_isolation_transcript_entries ON transcript_entries
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY tenant_isolation_candidate_assessments ON candidate_assessments
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY tenant_isolation_interview_invitations ON interview_invitations
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY tenant_isolation_usage_events ON usage_events
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  )); 