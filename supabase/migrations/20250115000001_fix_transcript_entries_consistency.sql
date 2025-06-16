-- Migration: Fix transcript_entries table consistency
-- Purpose: Standardize column names and remove redundant tenant_id
-- Date: 2025-01-15
-- Priority: CRITICAL

-- Step 1: Rename interview_session_id to session_id for consistency
DO $$ 
BEGIN
  -- Only rename if the column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transcript_entries' 
    AND column_name = 'interview_session_id'
  ) THEN
    ALTER TABLE public.transcript_entries 
      RENAME COLUMN interview_session_id TO session_id;
  END IF;
END $$;

-- Step 2: Drop redundant tenant_id column if it exists
-- (tenant_id can be derived from the interview_session)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transcript_entries' 
    AND column_name = 'tenant_id'
  ) THEN
    -- First drop any policies that reference tenant_id
    DROP POLICY IF EXISTS tenant_isolation_transcript_entries ON public.transcript_entries;
    
    -- Then drop the column
    ALTER TABLE public.transcript_entries DROP COLUMN tenant_id;
  END IF;
END $$;

-- Step 3: Ensure we have the correct columns
ALTER TABLE public.transcript_entries 
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS text TEXT,
  ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS speaker TEXT,
  ADD COLUMN IF NOT EXISTS confidence FLOAT,
  ADD COLUMN IF NOT EXISTS actual_start_ms INTEGER,
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

-- Step 4: Make required columns NOT NULL
DO $$ 
BEGIN
  -- Make session_id NOT NULL if it isn't already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transcript_entries' 
    AND column_name = 'session_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.transcript_entries 
      ALTER COLUMN session_id SET NOT NULL;
  END IF;

  -- Make text NOT NULL if it isn't already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transcript_entries' 
    AND column_name = 'text'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.transcript_entries 
      ALTER COLUMN text SET NOT NULL;
  END IF;
END $$;

-- Step 5: Update RLS policies to use consistent column names
DROP POLICY IF EXISTS "Users can view transcript entries for sessions they have access to" ON public.transcript_entries;
DROP POLICY IF EXISTS "Users can insert transcript entries for active sessions" ON public.transcript_entries;

CREATE POLICY "Users can view transcript entries for sessions they have access to"
  ON public.transcript_entries
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.interview_sessions s
    WHERE s.id = transcript_entries.session_id
    AND (
      s.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
      OR s.candidate_id IN (SELECT id FROM public.candidates WHERE email = auth.email())
    )
  ));

CREATE POLICY "Users can insert transcript entries for active sessions"
  ON public.transcript_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.interview_sessions s
    WHERE s.id = transcript_entries.session_id
    AND s.status = 'in_progress'
    AND s.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  ));

-- Step 6: Create index on session_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_transcript_entries_session_id 
  ON public.transcript_entries(session_id);

-- Add comments for documentation
COMMENT ON TABLE public.transcript_entries IS 'Stores transcript segments from interview sessions';
COMMENT ON COLUMN public.transcript_entries.session_id IS 'Reference to the interview session';
COMMENT ON COLUMN public.transcript_entries.text IS 'The transcribed text content';
COMMENT ON COLUMN public.transcript_entries.timestamp IS 'When this transcript segment was recorded';
COMMENT ON COLUMN public.transcript_entries.speaker IS 'Who spoke this segment (interviewer, candidate, etc)';
COMMENT ON COLUMN public.transcript_entries.confidence IS 'Speech recognition confidence score (0-1)';
COMMENT ON COLUMN public.transcript_entries.actual_start_ms IS 'Milliseconds from session start when segment began';
COMMENT ON COLUMN public.transcript_entries.duration_ms IS 'Duration of this segment in milliseconds'; 