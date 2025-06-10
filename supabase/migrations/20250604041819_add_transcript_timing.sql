-- Migration: Add Transcript Timing Columns
-- Description: Adds timing columns to transcript_entries table for avatar synchronization
-- Date: 2025-06-04

-- Add timing columns to transcript_entries table with conditional creation
DO $$ 
BEGIN
  -- Add actual_start_ms column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'transcript_entries' 
    AND column_name = 'actual_start_ms'
  ) THEN
    ALTER TABLE public.transcript_entries ADD COLUMN actual_start_ms INTEGER;
  END IF;
  
  -- Add duration_ms column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'transcript_entries' 
    AND column_name = 'duration_ms'
  ) THEN
    ALTER TABLE public.transcript_entries ADD COLUMN duration_ms INTEGER;
  END IF;
END $$;

-- Add comments to document the purpose of these columns
COMMENT ON COLUMN public.transcript_entries.actual_start_ms IS 'Actual timestamp when the transcript segment started (in milliseconds from session start)';
COMMENT ON COLUMN public.transcript_entries.duration_ms IS 'Duration of the transcript segment in milliseconds';
