-- Migration: add_company_about_mission_vision_columns
-- Created: Thu Jun 19 05:51:14 PM EDT 2025
-- 
-- Description: [Add description here]

-- Add about, mission, and vision columns to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS about TEXT,
ADD COLUMN IF NOT EXISTS mission TEXT,
ADD COLUMN IF NOT EXISTS vision TEXT;

-- Add comments for clarity
COMMENT ON COLUMN companies.about IS 'General description about the company';
COMMENT ON COLUMN companies.mission IS 'Company mission statement';
COMMENT ON COLUMN companies.vision IS 'Company vision statement';

-- Add your SQL here

