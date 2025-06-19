-- Migration: fix_system_admin_users_view
-- Created: Thu Jun 19 15:08:59 PM EDT 2025
-- 
-- Description: Fix the system admin users view to check role directly from database

-- Replace the function to check system admin role from database instead of JWT
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

-- Also update the is_system_admin function to have a fallback
-- This makes it more robust when JWT metadata is not yet available
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS boolean AS $$
DECLARE
  user_role text;
  db_role text;
BEGIN
  -- First try JWT metadata (fast path)
  user_role := auth.jwt()->>'role';
  IF user_role = 'system_admin' THEN
    RETURN true;
  END IF;
  
  -- If no JWT metadata or not system admin in JWT, check database (fallback)
  -- This helps when JWT hasn't been refreshed yet after login
  SELECT role INTO db_role FROM public.users WHERE id = auth.uid();
  IF db_role = 'system_admin' THEN
    RETURN true;
  END IF;
  
  -- Not a system admin
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE; 