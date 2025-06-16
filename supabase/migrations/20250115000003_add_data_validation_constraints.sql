-- Migration: Add data validation constraints
-- Purpose: Enforce business rules at the database level
-- Date: 2025-01-15
-- Priority: HIGH

-- Add email uniqueness constraint per tenant for candidates
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_candidate_email_per_tenant'
  ) THEN
    ALTER TABLE public.candidates 
      ADD CONSTRAINT unique_candidate_email_per_tenant 
      UNIQUE (tenant_id, email);
  END IF;
END $$;

-- Add check constraints for interview session status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_interview_status'
  ) THEN
    ALTER TABLE public.interview_sessions 
      ADD CONSTRAINT valid_interview_status 
      CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'));
  END IF;
END $$;

-- Add check constraints for WebRTC status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_webrtc_status'
  ) THEN
    ALTER TABLE public.interview_sessions 
      ADD CONSTRAINT valid_webrtc_status 
      CHECK (webrtc_status IN ('pending', 'connecting', 'connected', 'failed', 'completed', 'disconnected'));
  END IF;
END $$;

-- Add check constraints for position competency weights
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_competency_weight'
  ) THEN
    ALTER TABLE public.position_competencies 
      ADD CONSTRAINT valid_competency_weight 
      CHECK (weight >= 0 AND weight <= 100);
  END IF;
END $$;

-- Add check constraints for tenant plan tiers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_tenant_plan'
  ) THEN
    ALTER TABLE public.tenants 
      ADD CONSTRAINT valid_tenant_plan 
      CHECK (plan_tier IN ('free', 'starter', 'professional', 'enterprise'));
  END IF;
END $$;

-- Add check constraints for user roles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_user_role'
  ) THEN
    ALTER TABLE public.users 
      ADD CONSTRAINT valid_user_role 
      CHECK (role IN ('admin', 'interviewer', 'viewer', 'user'));
  END IF;
END $$;

-- Add check constraints for transcript speaker types
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_transcript_speaker'
  ) THEN
    ALTER TABLE public.transcript_entries 
      ADD CONSTRAINT valid_transcript_speaker 
      CHECK (speaker IN ('interviewer', 'candidate', 'system', 'ai_assistant'));
  END IF;
END $$;

-- Add check constraints for transcript confidence scores
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_confidence_score'
  ) THEN
    ALTER TABLE public.transcript_entries 
      ADD CONSTRAINT valid_confidence_score 
      CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1));
  END IF;
END $$;

-- Add check constraints for video segment status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_video_status'
  ) THEN
    ALTER TABLE public.video_segments 
      ADD CONSTRAINT valid_video_status 
      CHECK (status IN ('processing', 'ready', 'failed', 'deleted'));
  END IF;
END $$;

-- Add check constraints for invitation status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_invitation_status'
  ) THEN
    ALTER TABLE public.interview_invitations 
      ADD CONSTRAINT valid_invitation_status 
      CHECK (status IN ('pending', 'sent', 'opened', 'accepted', 'declined', 'expired'));
  END IF;
END $$;

-- Add check constraint to ensure interview end_time is after start_time
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_interview_times'
  ) THEN
    ALTER TABLE public.interview_sessions 
      ADD CONSTRAINT valid_interview_times 
      CHECK (end_time IS NULL OR end_time > start_time);
  END IF;
END $$;

-- Add check constraint for assessment scores
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_assessment_score'
  ) THEN
    ALTER TABLE public.candidate_assessments 
      ADD CONSTRAINT valid_assessment_score 
      CHECK (weighted_score >= 0 AND weighted_score <= 10);
  END IF;
END $$;

-- Add check constraint for position experience years
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_experience_range'
  ) THEN
    ALTER TABLE public.positions 
      ADD CONSTRAINT valid_experience_range 
      CHECK (
        (min_experience IS NULL AND max_experience IS NULL) OR
        (min_experience IS NULL AND max_experience >= 0) OR
        (max_experience IS NULL AND min_experience >= 0) OR
        (min_experience >= 0 AND max_experience >= min_experience)
      );
  END IF;
END $$;

-- Add documentation comments
COMMENT ON CONSTRAINT unique_candidate_email_per_tenant ON public.candidates 
  IS 'Ensures candidate emails are unique within each tenant';

COMMENT ON CONSTRAINT valid_interview_status ON public.interview_sessions 
  IS 'Restricts interview status to valid values';

COMMENT ON CONSTRAINT valid_competency_weight ON public.position_competencies 
  IS 'Ensures competency weights are between 0 and 100'; 