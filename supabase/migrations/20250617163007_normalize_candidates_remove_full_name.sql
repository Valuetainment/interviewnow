-- Migration: normalize_candidates_remove_full_name
-- Created: Tue Jun 17 04:30:07 PM EDT 2025
-- 
-- Description: [Add description here]

-- Add your SQL here

-- Normalize candidates table by removing full_name column
-- The table already has first_name and last_name columns that should be used instead

-- First, ensure first_name and last_name are populated for any records that might only have full_name
-- This is a safety measure in case some old records exist
UPDATE candidates 
SET 
  first_name = COALESCE(first_name, split_part(full_name, ' ', 1)),
  last_name = COALESCE(last_name, 
    CASE 
      WHEN array_length(string_to_array(full_name, ' '), 1) > 1 
      THEN array_to_string(array_remove(string_to_array(full_name, ' '), split_part(full_name, ' ', 1)), ' ')
      ELSE ''
    END
  )
WHERE full_name IS NOT NULL 
  AND (first_name IS NULL OR last_name IS NULL);

-- Drop the index that uses full_name
DROP INDEX IF EXISTS idx_candidates_full_name_tenant;

-- Drop the full_name column
ALTER TABLE candidates DROP COLUMN IF EXISTS full_name;

-- Create new index on first_name and last_name for better query performance
CREATE INDEX IF NOT EXISTS idx_candidates_name_tenant ON candidates (first_name, last_name, tenant_id);

-- Update the comment on the table
COMMENT ON TABLE candidates IS 'Candidate profiles - uses first_name and last_name for normalization';

