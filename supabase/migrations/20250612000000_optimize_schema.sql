-- Migration: Optimize Database Schema
-- Purpose: Add proper indexes, constraints, and consolidate RLS policies
-- Date: 2025-06-12

-- 1. Add proper indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_candidates_skills_gin ON candidates USING gin (skills);
CREATE INDEX IF NOT EXISTS idx_candidates_email_tenant ON candidates (email, tenant_id);
CREATE INDEX IF NOT EXISTS idx_candidates_full_name_tenant ON candidates (full_name, tenant_id);

-- Add composite index for transcript entries
CREATE INDEX IF NOT EXISTS idx_transcript_entries_session_timestamp 
ON transcript_entries (session_id, timestamp DESC);

-- Add index for interview sessions status lookups
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status_tenant 
ON interview_sessions (status, tenant_id);

-- 2. Add proper constraints
ALTER TABLE candidates
  ADD CONSTRAINT candidates_email_tenant_unique UNIQUE (email, tenant_id),
  ADD CONSTRAINT candidates_phone_format CHECK (phone ~ '^\+?[1-9]\d{1,14}$');

ALTER TABLE interview_sessions
  ADD CONSTRAINT interview_sessions_status_check 
  CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'failed')),
  ADD CONSTRAINT interview_sessions_time_check 
  CHECK (end_time IS NULL OR end_time > start_time);

-- 3. Consolidate RLS policies for candidates table
DROP POLICY IF EXISTS "anon_select_candidates" ON candidates;
DROP POLICY IF EXISTS "anon_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "anon_update_candidates" ON candidates;
DROP POLICY IF EXISTS "anon_delete_candidates" ON candidates;
DROP POLICY IF EXISTS "authenticated_select_candidates" ON candidates;
DROP POLICY IF EXISTS "authenticated_insert_candidates" ON candidates;
DROP POLICY IF EXISTS "authenticated_update_candidates" ON candidates;
DROP POLICY IF EXISTS "authenticated_delete_candidates" ON candidates;

-- Create consolidated policies
CREATE POLICY "candidates_access_policy" ON candidates
  FOR ALL
  USING (
    CASE 
      WHEN auth.role() = 'service_role' THEN true
      WHEN auth.role() = 'authenticated' THEN 
        tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
        OR email = auth.email()
      ELSE false
    END
  )
  WITH CHECK (
    CASE 
      WHEN auth.role() = 'service_role' THEN true
      WHEN auth.role() = 'authenticated' THEN 
        tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
      ELSE false
    END
  );

-- 4. Add proper comments
COMMENT ON TABLE candidates IS 'Stores candidate information with resume analysis and skills';
COMMENT ON COLUMN candidates.resume_url IS 'URL to the candidate''s resume file';
COMMENT ON COLUMN candidates.resume_text IS 'Raw text extracted from the resume PDF';
COMMENT ON COLUMN candidates.resume_analysis IS 'Structured analysis of the resume including skills, experience, and education';
COMMENT ON COLUMN candidates.skills IS 'Array of skills extracted from resume analysis';

-- 5. Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Add validation function for resume_analysis
CREATE OR REPLACE FUNCTION validate_resume_analysis()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.resume_analysis IS NOT NULL THEN
        -- Ensure resume_analysis has required structure
        IF NOT (
            NEW.resume_analysis ? 'skills' AND
            NEW.resume_analysis ? 'experience' AND
            NEW.resume_analysis ? 'education'
        ) THEN
            RAISE EXCEPTION 'resume_analysis must contain skills, experience, and education fields';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_candidate_resume_analysis
    BEFORE INSERT OR UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION validate_resume_analysis(); 