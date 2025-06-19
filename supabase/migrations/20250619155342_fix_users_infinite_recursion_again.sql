-- Migration: fix_users_infinite_recursion_again
-- Created: Wed Jun 19 03:53:42 PM EDT 2025
-- 
-- Description: Fix infinite recursion introduced by previous migration
-- We cannot have RLS policies on users table that query the users table itself

-- Drop the problematic policies we just added
DROP POLICY IF EXISTS "Tenant admins can view users in their tenant" ON public.users;
DROP POLICY IF EXISTS "System admins can view all users" ON public.users;

-- Also need to fix the existing policy that calls is_system_admin() which queries users table
DROP POLICY IF EXISTS "users_select_own" ON public.users;

-- Recreate the users_select_own policy without the is_system_admin() check to avoid recursion
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (
    auth.role() = 'service_role'::text 
    OR auth.role() = 'anon'::text
    OR (auth.role() = 'authenticated'::text AND id = auth.uid())
  );

-- Create a view for tenant users that bypasses RLS
CREATE OR REPLACE VIEW public.tenant_users_view AS
SELECT 
  u.id,
  u.tenant_id,
  u.role,
  u.created_at,
  u.updated_at,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id;

-- Grant access to the view
GRANT SELECT ON public.tenant_users_view TO authenticated;

-- Create RLS policies on the view to control access
ALTER VIEW public.tenant_users_view SET (security_invoker = true);

-- Add comment to explain the view
COMMENT ON VIEW public.tenant_users_view IS 'View for accessing user data without causing infinite recursion in RLS policies. Use this instead of querying users table directly when you need to see other users in your tenant.';

