-- Migration: Fix auth function references in policies
-- Purpose: Update policy function references to use (SELECT ...) for better performance
-- Date: 2025-05-07

-- Drop and recreate transcript_entries policies with correct auth function calls
DROP POLICY IF EXISTS "Users can view transcript entries for sessions they have access to" ON transcript_entries;
DROP POLICY IF EXISTS "Users can insert transcript entries for active sessions" ON transcript_entries;

-- Recreate with proper (SELECT auth.uid()) pattern
CREATE POLICY "Users can view transcript entries for sessions they have access to"
  ON transcript_entries
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM interview_sessions s
    WHERE s.id = transcript_entries.interview_session_id
    AND (
      s.tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = (SELECT auth.uid()))
      OR s.candidate_id IN (SELECT id FROM candidates WHERE email = (SELECT auth.email()))
    )
  ));

CREATE POLICY "Users can insert transcript entries for active sessions"
  ON transcript_entries
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM interview_sessions s
    WHERE s.id = transcript_entries.interview_session_id
    AND s.status = 'in_progress'
    AND s.tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = (SELECT auth.uid()))
  ));

-- Drop and recreate video_segments policies with correct auth function calls
DROP POLICY IF EXISTS "Users can view video segments for sessions they have access to" ON video_segments;
DROP POLICY IF EXISTS "Users can insert video segments for active sessions" ON video_segments;

-- Recreate with proper (SELECT auth.uid()) pattern
CREATE POLICY "Users can view video segments for sessions they have access to"
  ON video_segments
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM interview_sessions s
    WHERE s.id = video_segments.interview_session_id
    AND (
      s.tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = (SELECT auth.uid()))
      OR s.candidate_id IN (SELECT id FROM candidates WHERE email = (SELECT auth.email()))
    )
  ));

CREATE POLICY "Users can insert video segments for active sessions"
  ON video_segments
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM interview_sessions s
    WHERE s.id = video_segments.interview_session_id
    AND s.status = 'in_progress'
    AND s.tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = (SELECT auth.uid()))
  )); 