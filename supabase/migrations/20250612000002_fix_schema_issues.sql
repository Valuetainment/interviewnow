-- Migration: Fix Schema Issues
-- Purpose: Address identified schema issues and add missing constraints
-- Date: 2025-06-12

-- 1. Fix missing foreign key constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_interview_sessions_position'
  ) THEN
    ALTER TABLE interview_sessions
      ADD CONSTRAINT fk_interview_sessions_position 
      FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_interview_sessions_candidate'
  ) THEN
    ALTER TABLE interview_sessions
      ADD CONSTRAINT fk_interview_sessions_candidate 
      FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Add missing unique constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'candidates_email_tenant_unique'
  ) THEN
    ALTER TABLE candidates
      ADD CONSTRAINT candidates_email_tenant_unique 
      UNIQUE (email, tenant_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'positions_title_tenant_unique'
  ) THEN
    ALTER TABLE positions
      ADD CONSTRAINT positions_title_tenant_unique 
      UNIQUE (title, tenant_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'competencies_name_tenant_unique'
  ) THEN
    ALTER TABLE competencies
      ADD CONSTRAINT competencies_name_tenant_unique 
      UNIQUE (name, tenant_id);
  END IF;
END $$;

-- 3. Add missing check constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'interview_sessions_status_check'
  ) THEN
    ALTER TABLE interview_sessions
      ADD CONSTRAINT interview_sessions_status_check 
      CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'failed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'interview_sessions_time_check'
  ) THEN
    ALTER TABLE interview_sessions
      ADD CONSTRAINT interview_sessions_time_check 
      CHECK (end_time IS NULL OR end_time > start_time);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'interview_invitations_status_check'
  ) THEN
    ALTER TABLE interview_invitations
      ADD CONSTRAINT interview_invitations_status_check 
      CHECK (status IN ('pending', 'accepted', 'declined', 'expired'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'interview_invitations_expires_check'
  ) THEN
    ALTER TABLE interview_invitations
      ADD CONSTRAINT interview_invitations_expires_check 
      CHECK (expires_at > created_at);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'usage_events_quantity_check'
  ) THEN
    ALTER TABLE usage_events
      ADD CONSTRAINT usage_events_quantity_check 
      CHECK (quantity > 0);
  END IF;
END $$;

-- 4. Add missing NOT NULL constraints
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interview_sessions' 
    AND column_name = 'start_time' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE interview_sessions
      ALTER COLUMN start_time SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transcript_entries' 
    AND column_name = 'speaker' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE transcript_entries
      ALTER COLUMN speaker SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transcript_entries' 
    AND column_name = 'text' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE transcript_entries
      ALTER COLUMN text SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transcript_entries' 
    AND column_name = 'start_ms' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE transcript_entries
      ALTER COLUMN start_ms SET NOT NULL;
  END IF;
END $$;

-- 5. Add missing indexes for common queries
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate_status 
ON interview_sessions (candidate_id, status);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_position_status 
ON interview_sessions (position_id, status);

CREATE INDEX IF NOT EXISTS idx_interview_invitations_token_status 
ON interview_invitations (token, status);

CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_type 
ON usage_events (tenant_id, event_type);

-- 6. Add missing GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_candidates_resume_analysis_gin 
ON candidates USING gin (resume_analysis);

CREATE INDEX IF NOT EXISTS idx_candidate_assessments_details_gin 
ON candidate_assessments USING gin (details);

-- 7. Add missing functions for data validation
CREATE OR REPLACE FUNCTION validate_interview_invitation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the session exists and belongs to the tenant
  IF NOT EXISTS (
    SELECT 1 FROM interview_sessions 
    WHERE id = NEW.session_id 
    AND tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'Invalid session_id or session does not belong to tenant';
  END IF;

  -- Check if the candidate exists and belongs to the tenant
  IF NOT EXISTS (
    SELECT 1 FROM candidates 
    WHERE id = NEW.candidate_id 
    AND tenant_id = NEW.tenant_id
  ) THEN
    RAISE EXCEPTION 'Invalid candidate_id or candidate does not belong to tenant';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'validate_interview_invitation_insert'
  ) THEN
    CREATE TRIGGER validate_interview_invitation_insert
      BEFORE INSERT ON interview_invitations
      FOR EACH ROW
      EXECUTE FUNCTION validate_interview_invitation();
  END IF;
END $$;

-- 8. Add missing comments
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_description 
    WHERE objoid = 'tenants'::regclass
  ) THEN
    COMMENT ON TABLE tenants IS 'Stores tenant information for multi-tenant architecture';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_description 
    WHERE objoid = 'users'::regclass
  ) THEN
    COMMENT ON TABLE users IS 'Links Supabase Auth users to tenants with roles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_description 
    WHERE objoid = 'candidates'::regclass
  ) THEN
    COMMENT ON TABLE candidates IS 'Stores candidate information and resume data';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_description 
    WHERE objoid = 'positions'::regclass
  ) THEN
    COMMENT ON TABLE positions IS 'Stores job positions with descriptions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_description 
    WHERE objoid = 'competencies'::regclass
  ) THEN
    COMMENT ON TABLE competencies IS 'Stores skills and competencies for positions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_description 
    WHERE objoid = 'position_competencies'::regclass
  ) THEN
    COMMENT ON TABLE position_competencies IS 'Links positions to competencies with weights';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_description 
    WHERE objoid = 'interview_sessions'::regclass
  ) THEN
    COMMENT ON TABLE interview_sessions IS 'Stores interview session information';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_description 
    WHERE objoid = 'transcript_entries'::regclass
  ) THEN
    COMMENT ON TABLE transcript_entries IS 'Stores interview transcript entries';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_description 
    WHERE objoid = 'candidate_assessments'::regclass
  ) THEN
    COMMENT ON TABLE candidate_assessments IS 'Stores candidate interview assessments';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_description 
    WHERE objoid = 'interview_invitations'::regclass
  ) THEN
    COMMENT ON TABLE interview_invitations IS 'Stores interview invitation tokens';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_description 
    WHERE objoid = 'usage_events'::regclass
  ) THEN
    COMMENT ON TABLE usage_events IS 'Stores usage events for billing';
  END IF;
END $$; 