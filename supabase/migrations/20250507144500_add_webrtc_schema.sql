-- Add WebRTC fields to interview_sessions table
ALTER TABLE interview_sessions
ADD COLUMN IF NOT EXISTS webrtc_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS webrtc_server_url TEXT,
ADD COLUMN IF NOT EXISTS webrtc_session_id TEXT,
ADD COLUMN IF NOT EXISTS ice_candidates JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS sdp_offers JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS sdp_answers JSONB DEFAULT '[]';

-- Create transcript_entries table for storing real-time transcript data
CREATE TABLE IF NOT EXISTS transcript_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  speaker TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create video_segments table for recording management
CREATE TABLE IF NOT EXISTS video_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  segment_url TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'processing',
  video_provider TEXT DEFAULT 'api.video',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies

-- Enable RLS on new tables
ALTER TABLE transcript_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_segments ENABLE ROW LEVEL SECURITY;

-- NOTE: We moved policies creation to a later migration (20250507144600_fix_auth_functions.sql)
-- to ensure they are created after tables exist and with proper column references.
-- The following statements have been commented out to prevent SQL errors:

/*
-- Transcript entries policies
CREATE POLICY "Users can view transcript entries for sessions they have access to"
  ON transcript_entries
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM interview_sessions s
    WHERE s.id = transcript_entries.interview_session_id
    AND (
      s.tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
      OR s.candidate_id IN (SELECT id FROM candidates WHERE email = auth.email())
    )
  ));

CREATE POLICY "Users can insert transcript entries for active sessions"
  ON transcript_entries
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM interview_sessions s
    WHERE s.id = transcript_entries.interview_session_id
    AND s.status = 'in_progress'
    AND s.tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  ));

-- Video segments policies
CREATE POLICY "Users can view video segments for sessions they have access to"
  ON video_segments
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM interview_sessions s
    WHERE s.id = video_segments.interview_session_id
    AND (
      s.tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
      OR s.candidate_id IN (SELECT id FROM candidates WHERE email = auth.email())
    )
  ));

CREATE POLICY "Users can insert video segments for active sessions"
  ON video_segments
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM interview_sessions s
    WHERE s.id = video_segments.interview_session_id
    AND s.status = 'in_progress'
    AND s.tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  ));
*/

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Conditionally create triggers for updated_at timestamp
DO $$ 
BEGIN
    -- Check if transcript_entries trigger exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_transcript_entries_updated_at'
    ) THEN
        EXECUTE 'CREATE TRIGGER update_transcript_entries_updated_at
                BEFORE UPDATE ON transcript_entries
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()';
    END IF;
    
    -- Check if video_segments table exists before trying to create its trigger
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = 'video_segments'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_video_segments_updated_at'
    ) THEN
        EXECUTE 'CREATE TRIGGER update_video_segments_updated_at
                BEFORE UPDATE ON video_segments
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column()';
    END IF;
END $$; 