-- Add WebRTC-related columns to interview_sessions table
-- These columns are needed by the interview-start edge function

ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS webrtc_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS webrtc_server_url TEXT,
ADD COLUMN IF NOT EXISTS webrtc_session_id TEXT,
ADD COLUMN IF NOT EXISTS webrtc_architecture TEXT,
ADD COLUMN IF NOT EXISTS webrtc_connection_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS webrtc_operation_id TEXT;

-- Add an index for faster lookups by webrtc_session_id
CREATE INDEX IF NOT EXISTS idx_interview_sessions_webrtc_session_id 
ON interview_sessions(webrtc_session_id) 
WHERE webrtc_session_id IS NOT NULL;