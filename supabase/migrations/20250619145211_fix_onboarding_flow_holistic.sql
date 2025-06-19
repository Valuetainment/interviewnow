-- Migration: fix_onboarding_flow_holistic
-- Created: Thu Jun 19 14:52:11 PM EDT 2025
-- 
-- Description: Holistic fix for onboarding flow - simple and complete

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Authenticated users can create tenants during onboarding" ON public.tenants;

-- 1. Allow authenticated users to create tenants if they have a valid invitation
-- Use JWT email claim which is available immediately after signup
CREATE POLICY "Allow tenant creation with valid invitation" ON public.tenants
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.tenant_invitations
      WHERE email = (auth.jwt()->>'email')  -- Use JWT claim instead of auth.email()
      AND accepted_at IS NULL
      AND expires_at > now()
    )
  );

-- 2. Ensure users can always work with their own record in public.users
-- Drop existing policies first
DROP POLICY IF EXISTS "users_own_select" ON public.users;
DROP POLICY IF EXISTS "users_own_insert" ON public.users;
DROP POLICY IF EXISTS "users_own_update" ON public.users;
DROP POLICY IF EXISTS "Users can always see own record" ON public.users;
DROP POLICY IF EXISTS "Users can create own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;

-- Create simple, non-overlapping policies
CREATE POLICY "Users can always see own record" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can create own record" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 3. Fix the is_system_admin function to avoid recursion
-- This should check JWT metadata which is set after login
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- First try JWT metadata (set after login)
  user_role := auth.jwt()->>'role';
  IF user_role = 'system_admin' THEN
    RETURN true;
  END IF;
  
  -- If no JWT metadata, we're not a system admin
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Create a function to update JWT claims after user/role changes
-- This ensures the JWT reflects the current state
CREATE OR REPLACE FUNCTION update_user_metadata()
RETURNS trigger AS $$
BEGIN
  -- Update auth.users metadata when public.users changes
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', NEW.role,
      'tenant_id', NEW.tenant_id::text
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to keep metadata in sync
DROP TRIGGER IF EXISTS sync_user_metadata ON public.users;
CREATE TRIGGER sync_user_metadata
  AFTER INSERT OR UPDATE OF role, tenant_id ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_metadata();

-- 5. Ensure the tenant view policy works for new users
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;

CREATE POLICY "Users can view their own tenant" ON public.tenants
  FOR SELECT USING (
    -- Can view if they belong to the tenant
    id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
    OR
    -- Or if they're creating a new tenant (have valid invitation)
    EXISTS (
      SELECT 1 FROM public.tenant_invitations
      WHERE email = (auth.jwt()->>'email')
      AND accepted_at IS NULL
      AND expires_at > now()
    )
  ); 