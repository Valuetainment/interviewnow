-- Migration: Add source_architecture column to transcript_entries
-- Description: Adds column to track which architecture (hybrid or sdp_proxy) generated the transcript
-- Date: 2025-06-10

-- Add source_architecture column if it doesn't exist
ALTER TABLE public.transcript_entries 
ADD COLUMN IF NOT EXISTS source_architecture text; 