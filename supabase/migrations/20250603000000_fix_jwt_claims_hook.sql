-- Migration: Configure JWT Custom Claims Hook
-- Purpose: Ensure tenant_id is included in JWT claims for RLS policies
-- Date: 2025-06-03
--
-- This migration sets up the JWT hook to include tenant_id in the JWT claims
-- so that RLS policies checking (auth.jwt() ->> 'tenant_id') work correctly

-- First, ensure the additional_claims function exists and is correct
CREATE OR REPLACE FUNCTION auth.additional_claims(uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE 
  tenant_id uuid;
BEGIN
  -- Get the user's tenant_id from users table
  SELECT u.tenant_id INTO tenant_id
  FROM public.users u
  WHERE u.id = uid;
  
  -- Return the claims as JSONB
  -- This will be merged into the JWT at the top level
  RETURN jsonb_build_object('tenant_id', tenant_id);
END;
$$;

-- Grant execute permission to authenticated and service_role
GRANT EXECUTE ON FUNCTION auth.additional_claims TO authenticated, service_role;

-- Add a comment explaining the function
COMMENT ON FUNCTION auth.additional_claims IS 'Adds tenant_id to JWT claims for RLS policies';

-- Note: The actual JWT hook configuration needs to be done in the Supabase dashboard
-- Go to Authentication > Hooks and set the "Custom Access Token" hook to use this function 