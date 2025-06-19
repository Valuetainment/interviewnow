-- Migration: fix_users_table_duplicate_policies_holistic
-- Created: Wed Jun 19 04:42:03 PM EDT 2025
-- 
-- Description: Fix duplicate and conflicting RLS policies on users table that are causing permission errors during onboarding

-- Issue: Multiple migrations have created overlapping and conflicting policies on the users table
-- This is causing "permission denied" errors during the onboarding process
-- We need to clean up all duplicate policies and create a minimal, clear set

-- Step 1: Drop ALL existing policies on the users table to start fresh
-- This includes policies from multiple migrations that have accumulated over time
DROP POLICY IF EXISTS "New users can create their own user record during onboarding" ON public.users;
DROP POLICY IF EXISTS "New users can create their profile during onboarding" ON public.users;
DROP POLICY IF EXISTS "Users can always see own record" ON public.users;
DROP POLICY IF EXISTS "Users can create own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Users can update their own tenant_id during onboarding" ON public.users;
DROP POLICY IF EXISTS "users_delete_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "tenant_isolation_users" ON public.users;
DROP POLICY IF EXISTS "Tenant admins can view users in their tenant" ON public.users;
DROP POLICY IF EXISTS "System admins can view all users" ON public.users;

-- Step 2: Create a minimal set of RLS policies that avoid recursion and handle all use cases

-- Allow users to see their own record (simple, no recursion)
CREATE POLICY "users_can_view_own_record" ON public.users
  FOR SELECT USING (id = auth.uid());

-- Allow authenticated users to create their own user record during signup/onboarding
-- This is essential for the onboarding flow where users create their public.users record
CREATE POLICY "users_can_insert_own_record" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Allow users to update their own record (including tenant_id during onboarding)
CREATE POLICY "users_can_update_own_record" ON public.users
  FOR UPDATE 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow users to delete their own record (rarely used but included for completeness)
CREATE POLICY "users_can_delete_own_record" ON public.users
  FOR DELETE USING (id = auth.uid());

-- Note: We intentionally do NOT create policies for viewing other users here
-- to avoid the infinite recursion issue. Instead, use these approaches:
-- 1. System admins should use the system_admin_users_view
-- 2. Tenant admins should use the tenant_users_view
-- 3. The is_system_admin() function exists for checking system admin status
-- These views and functions were created specifically to avoid recursion

-- Step 3: Add helpful comments for future developers
COMMENT ON POLICY "users_can_view_own_record" ON public.users IS 
  'Allows users to view their own record only. For viewing other users, use tenant_users_view or system_admin_users_view';

COMMENT ON POLICY "users_can_insert_own_record" ON public.users IS 
  'Essential for onboarding flow - allows new authenticated users to create their public.users record';

COMMENT ON POLICY "users_can_update_own_record" ON public.users IS 
  'Allows users to update their own record, including setting tenant_id during onboarding';

COMMENT ON POLICY "users_can_delete_own_record" ON public.users IS 
  'Allows users to delete their own record if needed';

