-- Migration: Optimize RLS policies for better performance
-- Purpose: Replace subqueries with JWT claims where possible for better performance
-- Date: 2025-01-15
-- Priority: MEDIUM

-- Note: This migration assumes that tenant_id is included in the JWT claims
-- If not, these policies will need to be reverted

-- Optimize candidates table policies
DROP POLICY IF EXISTS tenant_isolation_candidates ON public.candidates;

CREATE POLICY tenant_isolation_candidates ON public.candidates
  FOR ALL
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Optimize positions table policies
DROP POLICY IF EXISTS tenant_isolation_positions ON public.positions;

CREATE POLICY tenant_isolation_positions ON public.positions
  FOR ALL
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Optimize competencies table policies
DROP POLICY IF EXISTS tenant_isolation_competencies ON public.competencies;

CREATE POLICY tenant_isolation_competencies ON public.competencies
  FOR ALL
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Optimize position_competencies table policies
DROP POLICY IF EXISTS tenant_isolation_position_competencies ON public.position_competencies;

CREATE POLICY tenant_isolation_position_competencies ON public.position_competencies
  FOR ALL
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Optimize candidate_assessments table policies
DROP POLICY IF EXISTS tenant_isolation_candidate_assessments ON public.candidate_assessments;

CREATE POLICY tenant_isolation_candidate_assessments ON public.candidate_assessments
  FOR ALL
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Optimize interview_invitations table policies
DROP POLICY IF EXISTS tenant_isolation_interview_invitations ON public.interview_invitations;

CREATE POLICY tenant_isolation_interview_invitations ON public.interview_invitations
  FOR ALL
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Optimize usage_events table policies
DROP POLICY IF EXISTS tenant_isolation_usage_events ON public.usage_events;

CREATE POLICY tenant_isolation_usage_events ON public.usage_events
  FOR ALL
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- For companies table, keep the existing policy as it uses users table lookup
-- which is necessary since JWT might not always have tenant_id

-- Create a function to get current tenant_id efficiently
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'tenant_id')::uuid,
    (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );
$$;

COMMENT ON FUNCTION auth.tenant_id() IS 'Returns the current user tenant_id from JWT or user record';

-- Create optimized policies for interview_sessions that also check candidate access
DROP POLICY IF EXISTS "authenticated_select_interview_sessions" ON public.interview_sessions;
DROP POLICY IF EXISTS "authenticated_insert_interview_sessions" ON public.interview_sessions;
DROP POLICY IF EXISTS "authenticated_update_interview_sessions" ON public.interview_sessions;
DROP POLICY IF EXISTS "authenticated_delete_interview_sessions" ON public.interview_sessions;

-- Optimized select policy for interview_sessions
CREATE POLICY "authenticated_select_interview_sessions" ON public.interview_sessions
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = auth.tenant_id()
    OR candidate_id IN (SELECT id FROM public.candidates WHERE email = auth.email())
  );

-- Optimized insert policy for interview_sessions
CREATE POLICY "authenticated_insert_interview_sessions" ON public.interview_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = auth.tenant_id());

-- Optimized update policy for interview_sessions
CREATE POLICY "authenticated_update_interview_sessions" ON public.interview_sessions
  FOR UPDATE
  TO authenticated
  USING (tenant_id = auth.tenant_id())
  WITH CHECK (tenant_id = auth.tenant_id());

-- Optimized delete policy for interview_sessions
CREATE POLICY "authenticated_delete_interview_sessions" ON public.interview_sessions
  FOR DELETE
  TO authenticated
  USING (tenant_id = auth.tenant_id()); 