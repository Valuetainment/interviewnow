-- Add more detailed fields to positions table
ALTER TABLE positions 
ADD COLUMN IF NOT EXISTS role_overview TEXT,
ADD COLUMN IF NOT EXISTS key_responsibilities TEXT,
ADD COLUMN IF NOT EXISTS required_qualifications TEXT,
ADD COLUMN IF NOT EXISTS preferred_qualifications TEXT,
ADD COLUMN IF NOT EXISTS benefits TEXT,
ADD COLUMN IF NOT EXISTS key_competencies_section TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Create index for company_id for better performance
CREATE INDEX IF NOT EXISTS idx_positions_company_id ON positions(company_id);

-- Add comment to explain the migration
COMMENT ON TABLE positions IS 'Enhanced positions table with detailed fields for job descriptions'; 