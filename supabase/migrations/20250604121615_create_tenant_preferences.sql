-- Migration: Create Tenant Preferences Table
-- Description: Creates tenant_preferences table for avatar configuration and limits
-- Date: 2025-06-04

-- Create tenant_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tenant_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) UNIQUE,
  avatar_enabled_default BOOLEAN DEFAULT false,
  default_avatar_id VARCHAR(100) DEFAULT 'dvp_Tristan_cloth2_1080P',
  avatar_provider VARCHAR(50) DEFAULT 'akool',
  avatar_monthly_limit INTEGER DEFAULT 100,
  avatar_usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tenant_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant isolation
DO $$
BEGIN
  -- Drop policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tenant_preferences' 
    AND policyname = 'tenant_preferences_isolation'
  ) THEN
    DROP POLICY tenant_preferences_isolation ON public.tenant_preferences;
  END IF;
  
  -- Create policy
  EXECUTE 'CREATE POLICY tenant_preferences_isolation ON public.tenant_preferences
    FOR ALL
    USING (tenant_id IN (
      SELECT u.tenant_id FROM public.users u
      WHERE u.id = auth.uid()
    ))';
END $$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_tenant_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS tenant_preferences_updated_at ON public.tenant_preferences;
CREATE TRIGGER tenant_preferences_updated_at
  BEFORE UPDATE ON public.tenant_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tenant_preferences_updated_at();

-- Verify table was created (for manual verification)
-- Run this query to confirm:
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'tenant_preferences'
-- ORDER BY ordinal_position; 