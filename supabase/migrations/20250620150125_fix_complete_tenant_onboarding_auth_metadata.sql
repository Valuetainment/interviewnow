-- Migration: fix_complete_tenant_onboarding_auth_metadata
-- Created: Fri Jun 20 03:01:25 PM EST 2025
-- 
-- Description: Fix the complete_tenant_onboarding function to update auth.users metadata for proper JWT tokens

-- Update the complete_tenant_onboarding function to include auth metadata update
CREATE OR REPLACE FUNCTION public.complete_tenant_onboarding(
  p_company_code text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_tenant_id uuid;
  v_tenant_name text;
  v_user_role text;
  v_invitation_id uuid;
  v_company_access jsonb;
  v_company_id uuid;
BEGIN
  -- Get the authenticated user's ID
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get the authenticated user's email
  v_user_email := auth.email();
  
  -- First check if this is a tenant invitation (from existing tenant)
  SELECT ti.id, ti.tenant_id, ti.tenant_name, ti.role, ti.company_access
  INTO v_invitation_id, v_tenant_id, v_tenant_name, v_user_role, v_company_access
  FROM public.tenant_invitations ti
  WHERE ti.company_code = p_company_code
  AND ti.email = v_user_email  -- Ensure email matches
  AND ti.expires_at > NOW()
  AND ti.accepted_at IS NULL
  LIMIT 1;
  
  -- If found, this is a tenant invitation
  IF v_invitation_id IS NOT NULL THEN
    -- Mark the invitation as accepted
    UPDATE public.tenant_invitations
    SET accepted_at = NOW()
    WHERE id = v_invitation_id;
    
    -- Insert or update the user with the tenant_id and role
    INSERT INTO public.users (id, tenant_id, role, created_at, updated_at)
    VALUES (
      v_user_id,
      v_tenant_id,
      COALESCE(v_user_role, 'tenant_interviewer'),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      tenant_id = v_tenant_id,
      role = COALESCE(v_user_role, 'tenant_interviewer'),
      updated_at = NOW();
    
    -- If role is tenant_interviewer and company_access is provided, create the access entries
    IF v_user_role = 'tenant_interviewer' AND v_company_access IS NOT NULL AND jsonb_array_length(v_company_access) > 0 THEN
      -- Insert company access for each company ID in the array
      INSERT INTO public.interviewer_company_access (user_id, company_id, tenant_id, granted_by)
      SELECT 
        v_user_id,
        (company_id::text)::uuid,
        v_tenant_id,
        (SELECT invited_by FROM public.tenant_invitations WHERE id = v_invitation_id)
      FROM jsonb_array_elements_text(v_company_access) AS company_id
      ON CONFLICT (user_id, company_id) DO NOTHING;
    END IF;
    
    -- UPDATE AUTH METADATA - THIS IS THE FIX
    -- Update the auth.users metadata to ensure JWT contains correct tenant_id and role
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'tenant_id', v_tenant_id,
        'role', COALESCE(v_user_role, 'tenant_interviewer')
      )
    WHERE id = v_user_id;
    
    RETURN json_build_object(
      'success', true, 
      'tenant_id', v_tenant_id,
      'tenant_name', v_tenant_name,
      'role', v_user_role
    );
  END IF;
  
  -- If not a tenant invitation, check company_codes table (system admin invitation)
  SELECT cc.tenant_id 
  INTO v_tenant_id
  FROM public.company_codes cc
  WHERE cc.code = p_company_code
  AND cc.expires_at > NOW()
  AND cc.used_at IS NULL
  LIMIT 1;
  
  IF v_tenant_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired company code');
  END IF;
  
  -- Get tenant name
  SELECT name INTO v_tenant_name FROM public.tenants WHERE id = v_tenant_id;
  
  -- Mark the company code as used
  UPDATE public.company_codes
  SET 
    used_at = NOW(),
    used_by = v_user_id
  WHERE code = p_company_code
  AND tenant_id = v_tenant_id;
  
  -- Insert or update the user with the tenant_id and default role
  INSERT INTO public.users (id, tenant_id, role, created_at, updated_at)
  VALUES (
    v_user_id,
    v_tenant_id,
    'tenant_admin',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    tenant_id = v_tenant_id,
    role = 'tenant_admin',
    updated_at = NOW();
  
  -- UPDATE AUTH METADATA FOR SYSTEM ADMIN INVITATIONS TOO
  -- Update the auth.users metadata to ensure JWT contains correct tenant_id and role
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'tenant_id', v_tenant_id,
      'role', 'tenant_admin'
    )
  WHERE id = v_user_id;
  
  RETURN json_build_object(
    'success', true, 
    'tenant_id', v_tenant_id,
    'tenant_name', v_tenant_name,
    'role', 'tenant_admin'
  );
END;
$$;

-- Update function comment with parameter type
COMMENT ON FUNCTION public.complete_tenant_onboarding(text) IS 
  'Securely completes the tenant onboarding process for authenticated users. This function bypasses RLS to create necessary records during signup and updates auth metadata for proper JWT tokens.';

