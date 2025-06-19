-- Migration: fix_tenant_invitations_update_policy
-- Created: Wed Jun 19 04:28:20 PM EDT 2025
-- 
-- Description: Add UPDATE policy to allow authenticated users to update their own tenant invitation during onboarding

-- Add UPDATE policy for tenant_invitations to allow users to mark their invitation as accepted
CREATE POLICY "Users can update their own invitation during onboarding" ON public.tenant_invitations
  FOR UPDATE USING (
    -- Allow authenticated users to update invitations with their email
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    -- Only allow updating accepted_at and tenant_id fields
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Also create an INSERT policy for users table during onboarding
-- This is needed because the user needs to create their own user record
CREATE POLICY "New users can create their own user record during onboarding" ON public.users
  FOR INSERT WITH CHECK (
    -- Allow users to insert their own record during onboarding
    id = auth.uid()
  );

-- And UPDATE policy for users to update their own tenant_id during onboarding
CREATE POLICY "Users can update their own tenant_id during onboarding" ON public.users
  FOR UPDATE USING (
    id = auth.uid()
  )
  WITH CHECK (
    id = auth.uid()
  );

