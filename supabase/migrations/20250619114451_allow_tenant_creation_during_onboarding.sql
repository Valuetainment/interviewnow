-- Migration: allow_tenant_creation_during_onboarding
-- Created: Wed Jun 19 11:44:51 AM EDT 2025
-- 
-- Description: Allow authenticated users to create tenants during the onboarding process when they have a valid invitation

-- Add RLS policy to allow authenticated users to create tenants during onboarding
-- This policy checks if the user has a valid, unaccepted invitation
CREATE POLICY "Authenticated users can create tenants during onboarding" ON public.tenants
  FOR INSERT WITH CHECK (
    -- User must be authenticated
    auth.uid() IS NOT NULL
    AND
    -- User must have a valid invitation that hasn't been accepted yet
    EXISTS (
      SELECT 1 FROM public.tenant_invitations
      WHERE email = auth.jwt()->>'email'
      AND accepted_at IS NULL
      AND expires_at > now()
    )
  );

-- Also allow authenticated users without a tenant to insert their own user record
CREATE POLICY "New users can create their profile during onboarding" ON public.users
  FOR INSERT WITH CHECK (
    -- Must be creating their own user record
    id = auth.uid()
    AND
    -- User must not already have a profile
    NOT EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid()
    )
  );

