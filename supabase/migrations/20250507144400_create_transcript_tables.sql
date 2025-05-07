-- Migration: Create transcript and video tables before policies
-- Purpose: Ensure tables exist with correct column names before policies are created
-- Date: 2025-05-07 (timestamp just before 144500)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure interview_sessions table exists before creating foreign keys
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

-- Create transcript_entries table with correct column name
CREATE TABLE IF NOT EXISTS public.transcript_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  speaker TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_transcript_interview_session FOREIGN KEY (interview_session_id) 
    REFERENCES public.interview_sessions(id) ON DELETE CASCADE
);

-- Create video_segments table with correct column name
CREATE TABLE IF NOT EXISTS public.video_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_session_id UUID NOT NULL,
  segment_url TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'processing',
  video_provider TEXT DEFAULT 'api.video',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_video_interview_session FOREIGN KEY (interview_session_id) 
    REFERENCES public.interview_sessions(id) ON DELETE CASCADE
);

-- Ensure tenant_users table exists
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

-- Ensure candidates table exists with email field
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure tenants table exists
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
); 