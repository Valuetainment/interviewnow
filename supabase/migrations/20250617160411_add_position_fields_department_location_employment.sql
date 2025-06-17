-- Migration: add_position_fields_department_location_employment
-- Created: Tue Jun 17 04:04:11 PM EDT 2025
-- 
-- Description: [Add description here]

-- Add your SQL here

-- Add new fields to positions table for enhanced job listings
ALTER TABLE positions 
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS employment_type text,
ADD COLUMN IF NOT EXISTS salary_range text,
ADD COLUMN IF NOT EXISTS application_deadline date,
ADD COLUMN IF NOT EXISTS reference_number text,
ADD COLUMN IF NOT EXISTS travel_requirements text,
ADD COLUMN IF NOT EXISTS work_authorization text;

-- Add check constraint for employment_type
ALTER TABLE positions 
DROP CONSTRAINT IF EXISTS positions_employment_type_check;

ALTER TABLE positions
ADD CONSTRAINT positions_employment_type_check 
CHECK (employment_type IN ('Full-Time', 'Part-Time', 'Contract', 'Internship') OR employment_type IS NULL);

-- Add comment to document the new fields
COMMENT ON COLUMN positions.department IS 'Department or team the position belongs to';
COMMENT ON COLUMN positions.location IS 'Location of the position (e.g. Remote, New York, London)';
COMMENT ON COLUMN positions.employment_type IS 'Type of employment: Full-Time, Part-Time, Contract, or Internship';
COMMENT ON COLUMN positions.salary_range IS 'Salary range for the position (e.g. $80,000 - $100,000)';
COMMENT ON COLUMN positions.application_deadline IS 'Deadline for applications';
COMMENT ON COLUMN positions.reference_number IS 'Internal reference number for the position';
COMMENT ON COLUMN positions.travel_requirements IS 'Travel requirements for the role (e.g. 25% travel)';
COMMENT ON COLUMN positions.work_authorization IS 'Work authorization requirements (e.g. Must be authorized to work in US)';

