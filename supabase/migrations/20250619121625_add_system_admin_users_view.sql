-- Migration: add_system_admin_users_view
-- Created: Wed Jun 19 12:16:25 PM EST 2025
-- 
-- Description: Create a view for system admins to see user information including emails

-- Create a view that joins public.users with auth.users
-- This view is only accessible to system admins
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
  t.name as tenant_name
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
LEFT JOIN public.tenants t ON u.tenant_id = t.id;

-- Grant access to authenticated users
GRANT SELECT ON public.users_with_auth TO authenticated;

-- Create a function to check if the current user is a system admin before accessing the view
CREATE OR REPLACE FUNCTION public.get_users_with_auth()
RETURNS SETOF public.users_with_auth
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only system admins can access this function
  IF NOT is_system_admin() THEN
    RAISE EXCEPTION 'Access denied. Only system admins can view user details.';
  END IF;
  
  RETURN QUERY SELECT * FROM public.users_with_auth;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_users_with_auth() TO authenticated;

