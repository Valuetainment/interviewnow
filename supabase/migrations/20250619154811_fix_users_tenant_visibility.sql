-- Migration: fix_users_tenant_visibility
-- Created: Wed Jun 19 03:48:11 PM EDT 2025
-- 
-- Description: Add SELECT-only policies to allow tenant admins to view users in their tenant
-- This fixes the issue where Settings > Users tab can't display tenant interviewers
-- IMPORTANT: This only adds SELECT permissions and does not modify existing INSERT/UPDATE/DELETE policies

-- Add READ-ONLY policy for tenant admins to see users in their tenant
CREATE POLICY "Tenant admins can view users in their tenant" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users AS viewer
      WHERE viewer.id = auth.uid()
      AND viewer.tenant_id = users.tenant_id
      AND viewer.role = 'tenant_admin'
    )
  );

-- Add READ-ONLY policy for system admins to see all users
-- This complements the existing users_select_own policy which already includes is_system_admin()
CREATE POLICY "System admins can view all users" ON public.users
  FOR SELECT USING (is_system_admin());

-- IMPORTANT: We are NOT removing any existing policies to avoid breaking the onboarding flow
-- The existing policies handle:
-- - "Users can always see own record" - users can see themselves
-- - "Users can create own record" - users can create their profile during signup
-- - "Users can update own record" - users can update their own profile
-- - "New users can create their profile during onboarding" - critical for onboarding

-- This migration only ADDS visibility for:
-- 1. Tenant admins to see other users in their tenant (for the Settings > Users page)
-- 2. System admins to see all users (for system administration)

