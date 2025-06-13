-- Migration: Optimize Interview Sessions and Transcripts
-- Purpose: Add proper indexes, constraints, and consolidate RLS policies for interview-related tables
-- Date: 2025-06-12

-- 1. Add proper indexes for interview sessions
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate_tenant 
ON interview_sessions (candidate_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_position_tenant 
ON interview_sessions (position_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_start_time 
ON interview_sessions (start_time DESC);

-- 2. Add proper indexes for transcript entries
CREATE INDEX IF NOT EXISTS idx_transcript_entries_tenant_speaker 
ON transcript_entries (tenant_id, speaker);

CREATE INDEX IF NOT EXISTS idx_transcript_entries_confidence 
ON transcript_entries (confidence) 
WHERE confidence IS NOT NULL;

-- 3. Add proper constraints
ALTER TABLE transcript_entries
  ADD CONSTRAINT transcript_entries_confidence_check 
  CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  ADD CONSTRAINT transcript_entries_speaker_check 
  CHECK (speaker IN ('interviewer', 'candidate', 'system'));

-- 4. Consolidate RLS policies for interview sessions
DROP POLICY IF EXISTS "interview_sessions_select_policy" ON interview_sessions;
DROP POLICY IF EXISTS "interview_sessions_insert_policy" ON interview_sessions;
DROP POLICY IF EXISTS "interview_sessions_update_policy" ON interview_sessions;
DROP POLICY IF EXISTS "interview_sessions_delete_policy" ON interview_sessions;

CREATE POLICY "interview_sessions_access_policy" ON interview_sessions
  FOR ALL
  USING (
    CASE 
      WHEN auth.role() = 'service_role' THEN true
      WHEN auth.role() = 'authenticated' THEN 
        tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
        OR candidate_id IN (
          SELECT id FROM candidates 
          WHERE email = auth.email()
        )
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

-- 5. Consolidate RLS policies for transcript entries
DROP POLICY IF EXISTS "transcript_entries_select_policy" ON transcript_entries;
DROP POLICY IF EXISTS "transcript_entries_insert_policy" ON transcript_entries;
DROP POLICY IF EXISTS "transcript_entries_update_policy" ON transcript_entries;
DROP POLICY IF EXISTS "transcript_entries_delete_policy" ON transcript_entries;

CREATE POLICY "transcript_entries_access_policy" ON transcript_entries
  FOR ALL
  USING (
    CASE 
      WHEN auth.role() = 'service_role' THEN true
      WHEN auth.role() = 'authenticated' THEN 
        tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
        OR session_id IN (
          SELECT id FROM interview_sessions 
          WHERE candidate_id IN (
            SELECT id FROM candidates 
            WHERE email = auth.email()
          )
        )
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

-- 6. Add proper comments
COMMENT ON TABLE interview_sessions IS 'Stores interview session information including status and timing';
COMMENT ON COLUMN interview_sessions.status IS 'Current status of the interview (scheduled, in_progress, completed, cancelled, failed)';
COMMENT ON COLUMN interview_sessions.video_url IS 'URL to the recorded interview video';

COMMENT ON TABLE transcript_entries IS 'Stores transcript entries for interview sessions';
COMMENT ON COLUMN transcript_entries.confidence IS 'Confidence score of the transcription (0-1)';
COMMENT ON COLUMN transcript_entries.speaker IS 'Speaker identifier (interviewer, candidate, system)';

-- 7. Add triggers for updated_at
CREATE TRIGGER update_interview_sessions_updated_at
    BEFORE UPDATE ON interview_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Add validation function for interview sessions
CREATE OR REPLACE FUNCTION validate_interview_session()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure end_time is after start_time
    IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
        IF NEW.end_time <= NEW.start_time THEN
            RAISE EXCEPTION 'end_time must be after start_time';
        END IF;
    END IF;
    
    -- Ensure status transitions are valid
    IF OLD.status IS NOT NULL AND NEW.status != OLD.status THEN
        CASE OLD.status
            WHEN 'scheduled' THEN
                IF NEW.status NOT IN ('in_progress', 'cancelled') THEN
                    RAISE EXCEPTION 'Invalid status transition from scheduled';
                END IF;
            WHEN 'in_progress' THEN
                IF NEW.status NOT IN ('completed', 'failed') THEN
                    RAISE EXCEPTION 'Invalid status transition from in_progress';
                END IF;
            WHEN 'completed' THEN
                RAISE EXCEPTION 'Cannot change status of completed interview';
            WHEN 'cancelled' THEN
                RAISE EXCEPTION 'Cannot change status of cancelled interview';
            WHEN 'failed' THEN
                RAISE EXCEPTION 'Cannot change status of failed interview';
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER validate_interview_session_changes
    BEFORE INSERT OR UPDATE ON interview_sessions
    FOR EACH ROW
    EXECUTE FUNCTION validate_interview_session(); 