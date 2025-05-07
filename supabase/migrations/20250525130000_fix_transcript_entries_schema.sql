-- Migration: Fix transcript_entries schema issues
-- Purpose: Ensure interview_session_id column exists and RLS policies reference it correctly
-- Date: 2025-05-25

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view transcript entries for sessions they have access to" ON transcript_entries;
DROP POLICY IF EXISTS "Users can insert transcript entries for active sessions" ON transcript_entries;

-- If the table doesn't exist yet, create it with proper column names
CREATE TABLE IF NOT EXISTS transcript_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  speaker TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_transcript_interview_session FOREIGN KEY (interview_session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
);

-- Ensure RLS is enabled
ALTER TABLE transcript_entries ENABLE ROW LEVEL SECURITY;

-- Recreate policies with table-qualified column references to avoid ambiguity
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

-- Fix video_segments policies as well
DROP POLICY IF EXISTS "Users can view video segments for sessions they have access to" ON video_segments;
DROP POLICY IF EXISTS "Users can insert video segments for active sessions" ON video_segments;

-- Ensure the video_segments table exists with proper structure
CREATE TABLE IF NOT EXISTS video_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID NOT NULL,
  segment_url TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'processing',
  video_provider TEXT DEFAULT 'api.video',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_video_interview_session FOREIGN KEY (interview_session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
);

-- Ensure RLS is enabled
ALTER TABLE video_segments ENABLE ROW LEVEL SECURITY;

-- Recreate policies with table-qualified column references to avoid ambiguity
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