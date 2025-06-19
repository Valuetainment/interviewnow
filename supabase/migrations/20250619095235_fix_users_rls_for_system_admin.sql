-- Migration: fix_users_rls_for_system_admin
-- Created: Thu Jun 19 09:52:35 AM EDT 2025
-- 
-- Description: [Add description here]

-- Add your SQL here

-- Fix users RLS policy to allow system admins to see all users
-- The current policy only allows users to see their own record

-- Drop the existing select policy
DROP POLICY IF EXISTS users_select_own ON public.users;

-- Create a new select policy that allows:
-- 1. System admins to see all users
-- 2. Regular users to see only their own record
CREATE POLICY users_select_own ON public.users
FOR SELECT
USING (
    auth.role() = 'service_role'::text 
    OR auth.role() = 'anon'::text 
    OR (auth.role() = 'authenticated'::text AND id = auth.uid())
    OR is_system_admin()  -- Allow system admins to see all users
);

-- Also update the companies table to ensure system admins can see all companies
DROP POLICY IF EXISTS tenant_isolation_companies ON public.companies;

CREATE POLICY tenant_isolation_companies ON public.companies
FOR ALL
USING (
    auth.role() = 'service_role'::text 
    OR is_system_admin()  -- System admins can see all companies
    OR tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
)
WITH CHECK (
    auth.role() = 'service_role'::text 
    OR is_system_admin()  -- System admins can manage all companies
    OR tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
);

