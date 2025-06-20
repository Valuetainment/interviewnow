-- Migration: add_tenant_admin_invitation_policies
-- Created: Fri Jun 20 11:11:31 AM EDT 2025
-- 
-- Description: Add RLS policies for tenant admins to manage invitations in their tenant

-- Allow tenant admins to view invitations in their tenant
CREATE POLICY "Tenant admins can view their tenant invitations" ON public.tenant_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND tenant_id = tenant_invitations.tenant_id
      AND role = 'tenant_admin'
    )
  );

-- Allow tenant admins to delete invitations in their tenant
CREATE POLICY "Tenant admins can delete their tenant invitations" ON public.tenant_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND tenant_id = tenant_invitations.tenant_id
      AND role = 'tenant_admin'
    )
  );

-- Note: Insert is handled by the secure function add_tenant_user
-- Update is handled by the existing policy for users during onboarding

