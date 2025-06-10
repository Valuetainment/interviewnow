-- Migration to update the interview_sessions table for hybrid WebRTC architecture

-- Add webrtc_architecture column to track which architecture is used
ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS webrtc_architecture TEXT DEFAULT 'sdp_proxy';

-- Add openai_configuration column for hybrid architecture settings
ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS openai_configuration JSONB DEFAULT '{}'::jsonb;

-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_webrtc_status 
ON interview_sessions(webrtc_status);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_webrtc_architecture 
ON interview_sessions(webrtc_architecture);

-- Update transcript_entries table to support speaker identification
ALTER TABLE transcript_entries 
ADD COLUMN IF NOT EXISTS speaker TEXT DEFAULT 'unknown';

-- Add index for faster transcript queries by speaker
CREATE INDEX IF NOT EXISTS idx_transcript_entries_speaker 
ON transcript_entries(speaker);

-- Enhance RLS policies for transcript entries to ensure proper tenant isolation
ALTER TABLE transcript_entries ENABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON COLUMN interview_sessions.webrtc_architecture IS 'Architecture used for WebRTC: "hybrid" or "sdp_proxy"';
COMMENT ON COLUMN interview_sessions.openai_configuration IS 'JSON configuration for OpenAI API when using hybrid architecture';
COMMENT ON COLUMN transcript_entries.speaker IS 'Speaker identification: "candidate", "ai", or "unknown"';