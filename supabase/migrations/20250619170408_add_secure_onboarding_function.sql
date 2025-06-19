-- Migration: add_secure_onboarding_function
-- Created: Wed Jun 19 05:04:08 PM EDT 2025
-- 
-- Description: Add a secure database function to handle tenant onboarding that bypasses RLS for this specific operation

-- This function handles the complete onboarding process for new tenants
-- It runs with SECURITY DEFINER to bypass RLS policies during the critical setup phase
CREATE OR REPLACE FUNCTION public.complete_tenant_onboarding(
  p_user_id uuid,
  p_invitation_id uuid,
  p_tenant_name text,
  p_tenancy_type text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_result jsonb;
BEGIN
  -- Validate that the user is authenticated and matches the provided user_id
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: User must be authenticated';
  END IF;

  -- Validate the invitation exists and hasn't been used
  IF NOT EXISTS (
    SELECT 1 FROM tenant_invitations 
    WHERE id = p_invitation_id 
    AND accepted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Invalid or already used invitation';
  END IF;

  -- Start transaction
  BEGIN
    -- 1. Create the user profile record
    INSERT INTO users (id, tenant_id, role)
    VALUES (p_user_id, NULL, 'tenant_admin')
    ON CONFLICT (id) DO NOTHING; -- In case of race condition

    -- 2. Create the tenant
    INSERT INTO tenants (name, plan_tier, tenancy_type)
    VALUES (p_tenant_name, 'free', p_tenancy_type)
    RETURNING id INTO v_tenant_id;

    -- 3. Update the user with the tenant_id
    UPDATE users 
    SET tenant_id = v_tenant_id
    WHERE id = p_user_id;

    -- 4. Update the invitation as accepted
    UPDATE tenant_invitations
    SET 
      accepted_at = now(),
      tenant_id = v_tenant_id
    WHERE id = p_invitation_id;

    -- 5. Update the auth.users metadata
    -- This ensures the JWT contains the correct tenant_id and role
    UPDATE auth.users
    SET raw_app_meta_data = 
      raw_app_meta_data || 
      jsonb_build_object(
        'tenant_id', v_tenant_id,
        'role', 'tenant_admin'
      )
    WHERE id = p_user_id;

    -- Return success with the tenant_id
    v_result := jsonb_build_object(
      'success', true,
      'tenant_id', v_tenant_id
    );

    RETURN v_result;

  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback will happen automatically
      RAISE;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.complete_tenant_onboarding TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.complete_tenant_onboarding IS 
  'Securely completes the tenant onboarding process for authenticated users. This function bypasses RLS to create necessary records during signup.';

