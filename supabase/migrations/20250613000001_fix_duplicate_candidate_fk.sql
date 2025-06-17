-- Fix duplicate foreign key constraint on interview_sessions
-- This removes the duplicate constraint added by 20250612000002_fix_schema_issues.sql

-- Drop the duplicate foreign key constraint
-- The original constraint 'interview_sessions_candidate_id_fkey' should remain
ALTER TABLE public.interview_sessions 
DROP CONSTRAINT IF EXISTS fk_interview_sessions_candidate;

-- Also drop the duplicate position constraint if it exists
ALTER TABLE public.interview_sessions 
DROP CONSTRAINT IF EXISTS fk_interview_sessions_position;

-- Log what we've done
DO $$
BEGIN
  RAISE NOTICE 'Removed duplicate foreign key constraints from interview_sessions';
END $$; 