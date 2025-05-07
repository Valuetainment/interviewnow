-- Migration: Create transcript system in a single atomic migration
-- Purpose: Ensure everything is created in correct order
-- Date: 2025-05-07

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure dependency tables exist
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure interview_sessions table exists
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  position_id UUID,
  candidate_id UUID,
  title TEXT,
  description TEXT,
  scheduled_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add WebRTC fields if not already present
ALTER TABLE public.interview_sessions
ADD COLUMN IF NOT EXISTS webrtc_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS webrtc_server_url TEXT,
ADD COLUMN IF NOT EXISTS webrtc_session_id TEXT,
ADD COLUMN IF NOT EXISTS ice_candidates JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS sdp_offers JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS sdp_answers JSONB DEFAULT '[]';

-- Drop transcript tables and policies if they exist to ensure clean creation
DROP POLICY IF EXISTS "Users can view transcript entries for sessions they have access to" ON public.transcript_entries;
DROP POLICY IF EXISTS "Users can insert transcript entries for active sessions" ON public.transcript_entries;
DROP TRIGGER IF EXISTS update_transcript_entries_updated_at ON public.transcript_entries;
DROP TABLE IF EXISTS public.transcript_entries;

DROP POLICY IF EXISTS "Users can view video segments for sessions they have access to" ON public.video_segments;
DROP POLICY IF EXISTS "Users can insert video segments for active sessions" ON public.video_segments;
DROP TRIGGER IF EXISTS update_video_segments_updated_at ON public.video_segments;
DROP TABLE IF EXISTS public.video_segments;

-- Create or replace timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create transcript_entries table with correct column name
CREATE TABLE public.transcript_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  speaker TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create the trigger on transcript_entries
CREATE TRIGGER update_transcript_entries_updated_at
BEFORE UPDATE ON public.transcript_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create video_segments table with correct column name
CREATE TABLE public.video_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
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

-- Create the trigger on video_segments
CREATE TRIGGER update_video_segments_updated_at
BEFORE UPDATE ON public.video_segments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on tables
ALTER TABLE public.transcript_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_segments ENABLE ROW LEVEL SECURITY;

-- Create policies after tables and columns exist
CREATE POLICY "Users can view transcript entries for sessions they have access to"
  ON public.transcript_entries
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.interview_sessions s
    WHERE s.id = public.transcript_entries.interview_session_id
    AND (
      s.tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = (SELECT auth.uid()))
      OR s.candidate_id IN (SELECT id FROM public.candidates WHERE email = (SELECT auth.email()))
    )
  ));

CREATE POLICY "Users can insert transcript entries for active sessions"
  ON public.transcript_entries
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.interview_sessions s
    WHERE s.id = public.transcript_entries.interview_session_id
    AND s.status = 'in_progress'
    AND s.tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = (SELECT auth.uid()))
  ));

CREATE POLICY "Users can view video segments for sessions they have access to"
  ON public.video_segments
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.interview_sessions s
    WHERE s.id = public.video_segments.interview_session_id
    AND (
      s.tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = (SELECT auth.uid()))
      OR s.candidate_id IN (SELECT id FROM public.candidates WHERE email = (SELECT auth.email()))
    )
  ));

CREATE POLICY "Users can insert video segments for active sessions"
  ON public.video_segments
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.interview_sessions s
    WHERE s.id = public.video_segments.interview_session_id
    AND s.status = 'in_progress'
    AND s.tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = (SELECT auth.uid()))
  )); 