-- Migration: add_company_access_to_tenant_invitations
-- Created: Fri Jun 20 11:33:46 AM EDT 2025
-- 
-- Description: [Add description here]

-- Add your SQL here

-- Add company_access column to tenant_invitations table
ALTER TABLE public.tenant_invitations
ADD COLUMN company_access JSONB DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.tenant_invitations.company_access IS 'Array of company IDs that the invited user should have access to. Only applicable for tenant_interviewer role.';

-- Update the add_tenant_user function to support company access
CREATE OR REPLACE FUNCTION public.add_tenant_user(
  p_email TEXT,
  p_role TEXT,
  p_send_invite BOOLEAN DEFAULT true,
  p_company_ids UUID[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_user_tenant_id UUID;
  v_new_user_id UUID;
  v_invitation_token TEXT;
  v_tenant_name TEXT;
  v_company_access JSONB;
BEGIN
  -- Get the calling user's information
  v_user_id := auth.uid();
  
  -- Return error if not authenticated
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get user's role and tenant_id
  SELECT u.role, u.tenant_id 
  INTO v_user_role, v_user_tenant_id
  FROM public.users u
  WHERE u.id = v_user_id;
  
  -- Only tenant_admin can add users
  IF v_user_role != 'tenant_admin' THEN
    RETURN json_build_object('success', false, 'error', 'Only tenant admins can add users');
  END IF;
  
  -- Validate role
  IF p_role NOT IN ('tenant_admin', 'tenant_interviewer') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role. Must be tenant_admin or tenant_interviewer');
  END IF;
  
  -- Check if user already exists in this tenant
  SELECT u.id INTO v_new_user_id
  FROM public.users u
  JOIN auth.users au ON u.id = au.id
  WHERE au.email = p_email
  AND u.tenant_id = v_user_tenant_id;
  
  IF v_new_user_id IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'User already exists in this tenant');
  END IF;
  
  -- Validate company IDs if provided (only for tenant_interviewer role)
  IF p_role = 'tenant_interviewer' AND p_company_ids IS NOT NULL AND array_length(p_company_ids, 1) > 0 THEN
    -- Check if all company IDs belong to the tenant
    IF EXISTS (
      SELECT 1 FROM unnest(p_company_ids) AS company_id
      WHERE NOT EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_id
        AND c.tenant_id = v_user_tenant_id
      )
    ) THEN
      RETURN json_build_object('success', false, 'error', 'One or more company IDs are invalid or do not belong to your tenant');
    END IF;
    
    -- Convert array to JSONB
    v_company_access := to_jsonb(p_company_ids);
  ELSE
    v_company_access := '[]'::jsonb;
  END IF;
  
  -- For admin/interviewer roles, create an invitation
  IF p_send_invite THEN
    -- Generate invitation code using gen_random_uuid()
    v_invitation_token := replace(gen_random_uuid()::text, '-', '');
    
    -- Get tenant name
    SELECT name INTO v_tenant_name FROM public.tenants WHERE id = v_user_tenant_id;
    
    -- Create invitation record
    INSERT INTO public.tenant_invitations (
      email,
      tenant_name,
      company_code,
      tenancy_type,
      role,
      invited_by,
      tenant_id,
      company_access,
      expires_at
    ) VALUES (
      p_email,
      COALESCE(v_tenant_name, 'Unknown Tenant'),
      v_invitation_token,
      'enterprise',
      p_role,
      v_user_id,
      v_user_tenant_id,
      v_company_access,
      NOW() + INTERVAL '7 days'
    );
    
    RETURN json_build_object(
      'success', true,
      'invitation_code', v_invitation_token,
      'message', 'Invitation sent successfully'
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Direct user creation not implemented. Use invitations.'
    );
  END IF;
END;
$$;

-- Update the complete_tenant_onboarding function to handle company access
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
  
  RETURN json_build_object(
    'success', true, 
    'tenant_id', v_tenant_id,
    'tenant_name', v_tenant_name,
    'role', 'tenant_admin'
  );
END;
$$;

-- Update function comment
COMMENT ON FUNCTION public.add_tenant_user(TEXT, TEXT, BOOLEAN, UUID[]) IS 'Securely add a new user to the tenant. Only tenant admins can add users. Creates invitations for new users to join the organization. For tenant_interviewer role, can optionally specify company IDs they should have access to.';

