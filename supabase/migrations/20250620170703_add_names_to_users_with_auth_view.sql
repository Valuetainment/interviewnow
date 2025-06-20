-- Migration: add_names_to_users_with_auth_view
-- Created: Fri Jun 20 05:07:03 PM EST 2025
-- 
-- Description: Add first_name and last_name to users_with_auth view for system admin users management

-- Drop the existing view first
DROP VIEW IF EXISTS public.users_with_auth CASCADE;

-- Recreate the view with additional name fields from auth metadata
CREATE OR REPLACE VIEW public.users_with_auth AS
SELECT 
  u.id,
  u.tenant_id,
  u.role,
  u.created_at,
  u.updated_at,
  au.email,
  au.email_confirmed_at,
  au.last_sign_in_at,
  au.created_at as auth_created_at,
  COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
  t.name as tenant_name
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
LEFT JOIN public.tenants t ON u.tenant_id = t.id;

-- Grant access to authenticated users
GRANT SELECT ON public.users_with_auth TO authenticated;

-- Recreate the function that uses this view
CREATE OR REPLACE FUNCTION public.get_users_with_auth()
RETURNS SETOF public.users_with_auth
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is system admin by querying the users table directly
  -- This avoids issues with JWT metadata not being available immediately after login
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'system_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Only system admins can view user details.';
  END IF;
  
  RETURN QUERY SELECT * FROM public.users_with_auth;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_users_with_auth() TO authenticated;

-- Add comment
COMMENT ON VIEW public.users_with_auth IS 'View that joins users with auth.users to include email and name information. Only accessible via get_users_with_auth() function to system admins.';

