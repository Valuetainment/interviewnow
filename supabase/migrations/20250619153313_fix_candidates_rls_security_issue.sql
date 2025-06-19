-- Migration: fix_candidates_rls_security_issue
-- Created: Wed Jun 19 03:33:13 PM EDT 2025
-- 
-- Description: Fix critical security issue where any authenticated user can see all candidates

-- Drop the overly permissive policy that allows any authenticated user to see all candidates
DROP POLICY IF EXISTS "Allow authenticated users to access candidates" ON public.candidates;

-- Ensure proper tenant isolation for candidates
-- The remaining policies should handle access control properly:
-- 1. "System admins can view all candidates" - for system admins
-- 2. "Tenant users can view candidates based on company access" - for tenant admins and interviewers
-- 3. "candidates_company_tenant_access" - for service role and authenticated users with proper tenant_id
-- 4. "Candidates can view their own profile" - for candidates viewing their own data

-- Add a policy for tenant admins to manage candidates in their tenant
CREATE POLICY "Tenant admins can manage candidates in their tenant" ON public.candidates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND tenant_id = candidates.tenant_id
      AND role = 'tenant_admin'
    )
  );

-- Add a policy for tenant interviewers to insert candidates for companies they have access to
CREATE POLICY "Tenant interviewers can insert candidates for their companies" ON public.candidates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interviewer_company_access ica
      JOIN public.users u ON u.id = ica.user_id
      WHERE ica.user_id = auth.uid()
      AND ica.company_id = candidates.company_id
      AND u.role = 'tenant_interviewer'
    )
  );

-- Verify RLS is still enabled
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

