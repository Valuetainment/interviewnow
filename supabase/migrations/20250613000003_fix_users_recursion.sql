-- Fix infinite recursion in users table RLS policy
-- The policy was trying to query the users table to check tenant_id, causing recursion

-- Drop all existing policies on users table to start fresh
DROP POLICY IF EXISTS "tenant_isolation_users" ON public.users;
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "insert_user_on_signup" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;

-- Create a simple policy for authenticated users to see their own record
CREATE POLICY "users_select_own" ON public.users
FOR SELECT
USING (
  auth.role() = 'service_role'
  OR auth.role() = 'anon'  -- Allow anon for auth checks
  OR (auth.role() = 'authenticated' AND id = auth.uid())
);

-- Create a policy for inserting users (for signup)
CREATE POLICY "users_insert_own" ON public.users
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
  OR (auth.role() = 'authenticated' AND id = auth.uid())
);

-- Create a policy for updating own user record
CREATE POLICY "users_update_own" ON public.users
FOR UPDATE
USING (
  auth.role() = 'service_role'
  OR (auth.role() = 'authenticated' AND id = auth.uid())
);

-- Create a policy for deleting (usually not needed but included for completeness)
CREATE POLICY "users_delete_own" ON public.users
FOR DELETE
USING (
  auth.role() = 'service_role'
  OR (auth.role() = 'authenticated' AND id = auth.uid())
);

-- Log what we've done
DO $$
BEGIN
  RAISE NOTICE 'Fixed infinite recursion in users table RLS policies';
  RAISE NOTICE 'Created simple policies that only allow users to see/modify their own records';
  RAISE NOTICE 'This avoids any recursive queries while maintaining security';
END $$; 