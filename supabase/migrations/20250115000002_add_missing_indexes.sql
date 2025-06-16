-- Migration: Add missing performance indexes
-- Purpose: Add indexes on frequently queried columns for better performance
-- Date: 2025-01-15
-- Priority: HIGH

-- Candidates table indexes
CREATE INDEX IF NOT EXISTS idx_candidates_email 
  ON public.candidates(email);

CREATE INDEX IF NOT EXISTS idx_candidates_tenant_email 
  ON public.candidates(tenant_id, email);

COMMENT ON INDEX idx_candidates_email IS 'Speed up candidate lookups by email (used in RLS policies)';
COMMENT ON INDEX idx_candidates_tenant_email IS 'Composite index for tenant-scoped email lookups';

-- Interview sessions table indexes
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status 
  ON public.interview_sessions(status);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_scheduled_time 
  ON public.interview_sessions(scheduled_time)
  WHERE scheduled_time IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_interview_sessions_tenant_status 
  ON public.interview_sessions(tenant_id, status);

COMMENT ON INDEX idx_interview_sessions_status IS 'Speed up filtering by interview status';
COMMENT ON INDEX idx_interview_sessions_scheduled_time IS 'Speed up queries for upcoming interviews';
COMMENT ON INDEX idx_interview_sessions_tenant_status IS 'Composite index for tenant-scoped status queries';

-- Positions table indexes
CREATE INDEX IF NOT EXISTS idx_positions_title 
  ON public.positions(title);

CREATE INDEX IF NOT EXISTS idx_positions_title_trgm 
  ON public.positions USING gin(title gin_trgm_ops);

COMMENT ON INDEX idx_positions_title IS 'Speed up position title searches';
COMMENT ON INDEX idx_positions_title_trgm IS 'Trigram index for fuzzy position title searches';

-- Companies table indexes
CREATE INDEX IF NOT EXISTS idx_companies_name 
  ON public.companies(name);

COMMENT ON INDEX idx_companies_name IS 'Speed up company name searches';

-- Transcript entries additional indexes
CREATE INDEX IF NOT EXISTS idx_transcript_entries_timestamp 
  ON public.transcript_entries(timestamp);

CREATE INDEX IF NOT EXISTS idx_transcript_entries_session_timestamp 
  ON public.transcript_entries(session_id, timestamp);

COMMENT ON INDEX idx_transcript_entries_timestamp IS 'Speed up chronological transcript queries';
COMMENT ON INDEX idx_transcript_entries_session_timestamp IS 'Composite index for session transcript ordering';

-- Candidate assessments indexes
CREATE INDEX IF NOT EXISTS idx_candidate_assessments_session_id 
  ON public.candidate_assessments(session_id);

CREATE INDEX IF NOT EXISTS idx_candidate_assessments_weighted_score 
  ON public.candidate_assessments(weighted_score DESC);

COMMENT ON INDEX idx_candidate_assessments_session_id IS 'Speed up assessment lookups by session';
COMMENT ON INDEX idx_candidate_assessments_weighted_score IS 'Speed up ranking queries';

-- Usage events indexes for billing queries
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_created 
  ON public.usage_events(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_event_type 
  ON public.usage_events(event_type, created_at DESC);

COMMENT ON INDEX idx_usage_events_tenant_created IS 'Speed up tenant usage reports';
COMMENT ON INDEX idx_usage_events_event_type IS 'Speed up usage analytics by event type';

-- Ensure pg_trgm extension is enabled for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm; 