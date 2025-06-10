-- Migration: Add Avatar Support to Interview Sessions
-- Description: Adds avatar-related columns to interview_sessions table for avatar integration
-- Date: 2025-06-04

-- Add avatar columns to interview_sessions table with conditional creation
DO $$ 
BEGIN
  -- Add avatar_enabled column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'interview_sessions' 
    AND column_name = 'avatar_enabled'
  ) THEN
    ALTER TABLE public.interview_sessions ADD COLUMN avatar_enabled BOOLEAN DEFAULT false;
  END IF;
  
  -- Add avatar_session_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'interview_sessions' 
    AND column_name = 'avatar_session_id'
  ) THEN
    ALTER TABLE public.interview_sessions ADD COLUMN avatar_session_id VARCHAR(255);
  END IF;
  
  -- Add avatar_provider column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'interview_sessions' 
    AND column_name = 'avatar_provider'
  ) THEN
    ALTER TABLE public.interview_sessions ADD COLUMN avatar_provider VARCHAR(50) DEFAULT 'akool';
  END IF;
END $$;
