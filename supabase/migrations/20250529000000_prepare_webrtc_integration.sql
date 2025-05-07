-- Migration: Prepare WebRTC integration
-- Purpose: Ensure all required database schemas and policies are in place for WebRTC integration
-- Date: 2025-05-29

-- Ensure interview_sessions has all required fields for WebRTC
ALTER TABLE interview_sessions
ADD COLUMN IF NOT EXISTS ai_persona TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS fly_machine_id TEXT,
ADD COLUMN IF NOT EXISTS fly_region TEXT DEFAULT 'mia',
ADD COLUMN IF NOT EXISTS webrtc_connection_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS webrtc_disconnection_time TIMESTAMP WITH TIME ZONE;

-- Create an index on interview_session_id in transcript_entries for faster lookups
CREATE INDEX IF NOT EXISTS idx_transcript_entries_session_id
    ON transcript_entries(interview_session_id);
    
-- Add tenant_id to transcript_entries if not exists to support RLS policies
ALTER TABLE transcript_entries
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Create function to automatically set tenant_id from interview_session
CREATE OR REPLACE FUNCTION set_tenant_id_from_session()
RETURNS TRIGGER AS $$
BEGIN
    -- Look up tenant_id from the referenced interview_session
    SELECT tenant_id INTO NEW.tenant_id
    FROM interview_sessions
    WHERE id = NEW.interview_session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically set tenant_id for transcript entries
DROP TRIGGER IF EXISTS set_transcript_tenant_id ON transcript_entries;
CREATE TRIGGER set_transcript_tenant_id
BEFORE INSERT ON transcript_entries
FOR EACH ROW
EXECUTE FUNCTION set_tenant_id_from_session();

-- Check if video_segments table exists before operating on it
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'video_segments') THEN
        -- Create an index on session_id in video_segments for faster lookups
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_video_segments_session_id
            ON video_segments(interview_session_id)';
            
        -- Add tenant_id to video_segments if not exists to support RLS policies
        EXECUTE 'ALTER TABLE video_segments
        ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id)';
        
        -- Create triggers to automatically set tenant_id for video segments
        EXECUTE 'DROP TRIGGER IF EXISTS set_video_segment_tenant_id ON video_segments';
        EXECUTE 'CREATE TRIGGER set_video_segment_tenant_id
        BEFORE INSERT ON video_segments
        FOR EACH ROW
        EXECUTE FUNCTION set_tenant_id_from_session()';
        
        -- Update video segments policies
        EXECUTE 'DROP POLICY IF EXISTS "Users can view video segments for sessions they have access to" ON video_segments';
        EXECUTE 'CREATE POLICY "Users can view video segments for sessions they have access to"
          ON video_segments
          FOR SELECT
          USING (
            tenant_id IN (
              SELECT tenant_id FROM tenant_users WHERE user_id = (SELECT auth.uid())
            )
            OR 
            interview_session_id IN (
              SELECT id FROM interview_sessions 
              WHERE candidate_id IN (
                SELECT id FROM candidates WHERE email = (SELECT auth.email())
              )
            )
          )';

        EXECUTE 'DROP POLICY IF EXISTS "Users can insert video segments for active sessions" ON video_segments';
        EXECUTE 'CREATE POLICY "Users can insert video segments for active sessions"
          ON video_segments
          FOR INSERT
          WITH CHECK (EXISTS (
            SELECT 1 FROM interview_sessions s
            WHERE s.id = video_segments.interview_session_id
            AND s.status = ''in_progress''
            AND s.tenant_id IN (
              SELECT tenant_id FROM tenant_users WHERE user_id = (SELECT auth.uid())
            )
          ))';
    END IF;
END $$;

-- Ensure RLS policies are properly set up
-- Transcript entries
DROP POLICY IF EXISTS "Users can view transcript entries for sessions they have access to" ON transcript_entries;
CREATE POLICY "Users can view transcript entries for sessions they have access to"
  ON transcript_entries
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = (SELECT auth.uid())
    )
    OR 
    interview_session_id IN (
      SELECT id FROM interview_sessions 
      WHERE candidate_id IN (
        SELECT id FROM candidates WHERE email = (SELECT auth.email())
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert transcript entries for active sessions" ON transcript_entries;
CREATE POLICY "Users can insert transcript entries for active sessions"
  ON transcript_entries
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM interview_sessions s
    WHERE s.id = transcript_entries.interview_session_id
    AND s.status = 'in_progress'
    AND s.tenant_id IN (
      SELECT tenant_id FROM tenant_users WHERE user_id = (SELECT auth.uid())
    )
  )); 