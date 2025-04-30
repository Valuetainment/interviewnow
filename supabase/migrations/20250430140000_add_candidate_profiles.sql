-- Create candidate_profiles table for PDL-enriched data
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Personal Info
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  gender TEXT,
  birth_year INT,
  
  -- Location
  location_name TEXT,
  location_locality TEXT,
  location_region TEXT,
  location_country TEXT,
  location_continent TEXT,
  location_postal_code TEXT,
  location_street_address TEXT,
  location_geo TEXT,
  
  -- Job Info
  job_title TEXT,
  job_company_name TEXT,
  job_company_size TEXT,
  job_company_industry TEXT,
  job_start_date TEXT,
  job_last_updated TEXT,
  industry TEXT,
  
  -- Social Media
  linkedin_url TEXT,
  linkedin_username TEXT,
  linkedin_id TEXT,
  twitter_url TEXT,
  twitter_username TEXT,
  facebook_url TEXT,
  facebook_username TEXT,
  github_url TEXT,
  github_username TEXT,
  
  -- Skills and Interests
  skills TEXT[],
  interests TEXT[],
  countries TEXT[],
  
  -- Additional Info
  experience JSONB,
  education JSONB,
  job_title_levels TEXT[],
  
  -- PDL Metadata
  pdl_source_id TEXT,
  pdl_updated_at TIMESTAMPTZ,
  
  -- Create a unique constraint on candidate_id to ensure one profile per candidate
  CONSTRAINT unique_candidate_profile UNIQUE (candidate_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_tenant_id ON candidate_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_candidate_id ON candidate_profiles(candidate_id);

-- Enable Row-Level Security
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant isolation
CREATE POLICY tenant_isolation_candidate_profiles ON candidate_profiles
  USING (tenant_id = current_setting('request.jwt.claim.tenant_id')::UUID);

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON candidate_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON candidate_profiles TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE candidate_profiles IS 'Stores enriched candidate data from People Data Labs integration'; 