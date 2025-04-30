-- Initial schema for AI Interview Insights Platform
-- This includes multi-tenant data isolation through tenant_id

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables with tenant isolation
-- 1. Tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan_tier TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users table (links to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Candidates table
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  resume_url TEXT,
  resume_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Positions table
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Competencies table
CREATE TABLE competencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Position competencies join table with weights
CREATE TABLE position_competencies (
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (position_id, competency_id)
);

-- 7. Interview sessions table
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Transcript entries table
CREATE TABLE transcript_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL,
  text TEXT NOT NULL,
  start_ms INTEGER NOT NULL,
  confidence REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Candidate assessments table
CREATE TABLE candidate_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  details JSONB NOT NULL,
  weighted_score REAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Interview invitations table
CREATE TABLE interview_invitations (
  token UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Usage events table for billing
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for tenant isolation
-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant isolation
CREATE POLICY tenant_isolation_tenants ON tenants
  USING (id = current_setting('request.jwt.claim.tenant_id')::uuid);

CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id = current_setting('request.jwt.claim.tenant_id')::uuid);

CREATE POLICY tenant_isolation_candidates ON candidates
  USING (tenant_id = current_setting('request.jwt.claim.tenant_id')::uuid);

CREATE POLICY tenant_isolation_positions ON positions
  USING (tenant_id = current_setting('request.jwt.claim.tenant_id')::uuid);

CREATE POLICY tenant_isolation_competencies ON competencies
  USING (tenant_id = current_setting('request.jwt.claim.tenant_id')::uuid);

CREATE POLICY tenant_isolation_position_competencies ON position_competencies
  USING (tenant_id = current_setting('request.jwt.claim.tenant_id')::uuid);

CREATE POLICY tenant_isolation_interview_sessions ON interview_sessions
  USING (tenant_id = current_setting('request.jwt.claim.tenant_id')::uuid);

CREATE POLICY tenant_isolation_transcript_entries ON transcript_entries
  USING (tenant_id = current_setting('request.jwt.claim.tenant_id')::uuid);

CREATE POLICY tenant_isolation_candidate_assessments ON candidate_assessments
  USING (tenant_id = current_setting('request.jwt.claim.tenant_id')::uuid);

CREATE POLICY tenant_isolation_interview_invitations ON interview_invitations
  USING (tenant_id = current_setting('request.jwt.claim.tenant_id')::uuid);

CREATE POLICY tenant_isolation_usage_events ON usage_events
  USING (tenant_id = current_setting('request.jwt.claim.tenant_id')::uuid);

-- Create trigger to validate position competency weights
CREATE OR REPLACE FUNCTION validate_position_competency_weights()
RETURNS TRIGGER AS $$
DECLARE
  total_weight INTEGER;
BEGIN
  -- Calculate the total weight for the position including the new/updated row
  SELECT SUM(weight) INTO total_weight
  FROM position_competencies
  WHERE position_id = NEW.position_id AND tenant_id = NEW.tenant_id;
  
  -- Check if the total weight exceeds 100
  IF total_weight > 100 THEN
    RAISE EXCEPTION 'Total weight for position competencies cannot exceed 100';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_position_competency_weights
BEFORE INSERT OR UPDATE ON position_competencies
FOR EACH ROW EXECUTE FUNCTION validate_position_competency_weights();

-- Create indexes for performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_candidates_tenant_id ON candidates(tenant_id);
CREATE INDEX idx_positions_tenant_id ON positions(tenant_id);
CREATE INDEX idx_competencies_tenant_id ON competencies(tenant_id);
CREATE INDEX idx_position_competencies_tenant_id ON position_competencies(tenant_id);
CREATE INDEX idx_interview_sessions_tenant_id ON interview_sessions(tenant_id);
CREATE INDEX idx_transcript_entries_tenant_id ON transcript_entries(tenant_id);
CREATE INDEX idx_transcript_entries_session_id ON transcript_entries(session_id);
CREATE INDEX idx_candidate_assessments_tenant_id ON candidate_assessments(tenant_id);
CREATE INDEX idx_interview_invitations_tenant_id ON interview_invitations(tenant_id);
CREATE INDEX idx_usage_events_tenant_id ON usage_events(tenant_id); 