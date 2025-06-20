-- Migration: update_get_tenant_users_add_names
-- Created: Fri Jun 20 05:46:55 PM EDT 2025
-- 
-- Description: [Add description here]

-- Drop the existing function first since we're changing the return type
DROP FUNCTION IF EXISTS public.get_tenant_users(UUID);

-- Recreate the function with additional name columns
CREATE OR REPLACE FUNCTION public.get_tenant_users(p_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  tenant_id UUID,
  first_name TEXT,
  last_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_user_tenant_id UUID;
BEGIN
  -- Get the calling user's information
  v_user_id := auth.uid();
  
  -- Return empty if not authenticated
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Get user's role and tenant_id directly to avoid recursion
  SELECT u.role, u.tenant_id 
  INTO v_user_role, v_user_tenant_id
  FROM public.users u
  WHERE u.id = v_user_id;
  
  -- Check permissions
  IF v_user_role = 'system_admin' THEN
    -- System admins can see all users, optionally filtered by tenant
    RETURN QUERY
    SELECT 
      u.id,
      COALESCE(au.email::TEXT, 'Unknown'::TEXT) as email,
      u.role::TEXT,
      u.created_at,
      u.tenant_id,
      COALESCE(au.raw_user_meta_data->>'first_name', '')::TEXT as first_name,
      COALESCE(au.raw_user_meta_data->>'last_name', '')::TEXT as last_name
    FROM public.users u
    LEFT JOIN auth.users au ON u.id = au.id
    WHERE (p_tenant_id IS NULL OR u.tenant_id = p_tenant_id)
    ORDER BY u.created_at DESC;
    
  ELSIF v_user_role IN ('tenant_admin', 'tenant_interviewer') THEN
    -- Tenant admins and interviewers can only see users in their own tenant
    RETURN QUERY
    SELECT 
      u.id,
      COALESCE(au.email::TEXT, 'Unknown'::TEXT) as email,
      u.role::TEXT,
      u.created_at,
      u.tenant_id,
      COALESCE(au.raw_user_meta_data->>'first_name', '')::TEXT as first_name,
      COALESCE(au.raw_user_meta_data->>'last_name', '')::TEXT as last_name
    FROM public.users u
    LEFT JOIN auth.users au ON u.id = au.id
    WHERE u.tenant_id = v_user_tenant_id
    ORDER BY u.created_at DESC;
  END IF;
  
  -- Return empty for other roles
  RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_tenant_users TO authenticated;

-- Update the comment to reflect the new columns
COMMENT ON FUNCTION public.get_tenant_users IS 'Securely fetch all users in a tenant without hitting RLS recursion issues. Returns user details including names from auth metadata. System admins see all, tenant admins/interviewers see only their tenant.';

