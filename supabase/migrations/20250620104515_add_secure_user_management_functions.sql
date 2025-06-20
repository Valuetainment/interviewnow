-- Migration: add_secure_user_management_functions
-- Description: Create secure functions for complete user management (add, edit, delete)
-- with proper tenant isolation and security checks

-- Ensure pgcrypto extension is enabled for token generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add role column to tenant_invitations table if it doesn't exist
ALTER TABLE public.tenant_invitations 
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('tenant_admin', 'tenant_interviewer'));

-- Function to add a new user to the tenant
CREATE OR REPLACE FUNCTION public.add_tenant_user(
  p_email TEXT,
  p_role TEXT,
  p_send_invite BOOLEAN DEFAULT true
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
      expires_at
    ) VALUES (
      p_email,
      COALESCE(v_tenant_name, 'Unknown Tenant'),
      v_invitation_token,
      'enterprise',
      p_role,
      v_user_id,
      v_user_tenant_id,
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

-- Function to update an existing user
CREATE OR REPLACE FUNCTION public.update_tenant_user(
  p_user_id UUID,
  p_role TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
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
  v_target_tenant_id UUID;
  v_target_role TEXT;
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
  
  -- Only tenant_admin can update users
  IF v_user_role != 'tenant_admin' THEN
    RETURN json_build_object('success', false, 'error', 'Only tenant admins can update users');
  END IF;
  
  -- Get target user's info
  SELECT u.tenant_id, u.role
  INTO v_target_tenant_id, v_target_role
  FROM public.users u
  WHERE u.id = p_user_id;
  
  -- Check if target user exists
  IF v_target_tenant_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Ensure target user is in same tenant
  IF v_target_tenant_id != v_user_tenant_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot update users from other tenants');
  END IF;
  
  -- Prevent changing to system_admin role
  IF p_role = 'system_admin' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot promote to system admin');
  END IF;
  
  -- Validate new role if provided
  IF p_role IS NOT NULL AND p_role NOT IN ('tenant_admin', 'tenant_interviewer') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid role. Must be tenant_admin or tenant_interviewer');
  END IF;
  
  -- Update the user
  UPDATE public.users
  SET 
    role = COALESCE(p_role, role),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Update email in auth.users if provided and user is not a candidate
  IF p_email IS NOT NULL AND v_target_role != 'tenant_candidate' THEN
    -- This would require admin API access, so we'll skip for now
    -- Just return a note about this limitation
    RETURN json_build_object(
      'success', true,
      'message', 'User role updated successfully. Email updates require admin API access.'
    );
  END IF;
  
  RETURN json_build_object('success', true, 'message', 'User updated successfully');
END;
$$;

-- Function to delete a user
CREATE OR REPLACE FUNCTION public.delete_tenant_user(
  p_user_id UUID
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
  v_target_tenant_id UUID;
  v_target_role TEXT;
  v_target_email TEXT;
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
  
  -- Only tenant_admin can delete users
  IF v_user_role != 'tenant_admin' THEN
    RETURN json_build_object('success', false, 'error', 'Only tenant admins can delete users');
  END IF;
  
  -- Prevent self-deletion
  IF p_user_id = v_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot delete your own account');
  END IF;
  
  -- Get target user's info
  SELECT u.tenant_id, u.role, au.email
  INTO v_target_tenant_id, v_target_role, v_target_email
  FROM public.users u
  LEFT JOIN auth.users au ON u.id = au.id
  WHERE u.id = p_user_id;
  
  -- Check if target user exists
  IF v_target_tenant_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Ensure target user is in same tenant
  IF v_target_tenant_id != v_user_tenant_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot delete users from other tenants');
  END IF;
  
  -- Prevent deletion of system admins
  IF v_target_role = 'system_admin' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot delete system administrators');
  END IF;
  
  -- Delete user (cascade will handle related records)
  DELETE FROM public.users WHERE id = p_user_id;
  
  -- Note: Deleting from auth.users requires admin API access
  -- The user record in auth.users will remain but they won't be able to access this tenant
  
  RETURN json_build_object(
    'success', true,
    'message', 'User removed from tenant successfully',
    'deleted_user_id', p_user_id,
    'deleted_user_email', v_target_email
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.add_tenant_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_tenant_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_tenant_user TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.add_tenant_user IS 'Securely add a new user to the tenant. Only tenant admins can add users. Creates invitations for new users to join the organization.';
COMMENT ON FUNCTION public.update_tenant_user IS 'Securely update a user in the tenant. Only tenant admins can update users. Cannot promote to system_admin.';
COMMENT ON FUNCTION public.delete_tenant_user IS 'Securely remove a user from the tenant. Only tenant admins can delete users. Cannot delete yourself or system admins.';

