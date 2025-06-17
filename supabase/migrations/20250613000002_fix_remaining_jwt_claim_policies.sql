-- Fix remaining RLS policies that use request.jwt.claim.tenant_id
-- This resolves the error: "unrecognized configuration parameter 'request.jwt.claim.tenant_id'"

-- Fix candidate_assessments policies
DROP POLICY IF EXISTS "tenant_isolation_candidate_assessments" ON public.candidate_assessments;

CREATE POLICY "tenant_isolation_candidate_assessments" ON public.candidate_assessments
FOR ALL
USING (
  CASE
    WHEN auth.role() = 'service_role' THEN true
    WHEN auth.role() = 'authenticated' THEN 
      tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())
    ELSE false
  END
);

-- Fix interview_invitations policies
DROP POLICY IF EXISTS "tenant_isolation_interview_invitations" ON public.interview_invitations;

CREATE POLICY "tenant_isolation_interview_invitations" ON public.interview_invitations
FOR ALL
USING (
  CASE
    WHEN auth.role() = 'service_role' THEN true
    WHEN auth.role() = 'authenticated' THEN 
      tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())
      OR candidate_id IN (SELECT id FROM public.candidates WHERE email = auth.email())
    ELSE false
  END
);

-- Fix usage_events policies
DROP POLICY IF EXISTS "tenant_isolation_usage_events" ON public.usage_events;

CREATE POLICY "tenant_isolation_usage_events" ON public.usage_events
FOR ALL
USING (
  CASE
    WHEN auth.role() = 'service_role' THEN true
    WHEN auth.role() = 'authenticated' THEN 
      tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())
    ELSE false
  END
);

-- Fix users policies
DROP POLICY IF EXISTS "tenant_isolation_users" ON public.users;

CREATE POLICY "tenant_isolation_users" ON public.users
FOR ALL
USING (
  CASE
    WHEN auth.role() = 'service_role' THEN true
    WHEN auth.role() = 'anon' THEN true  -- Allow anon to check if user exists
    WHEN auth.role() = 'authenticated' THEN 
      -- Users can see other users in their tenant or themselves
      tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())
      OR id = auth.uid()
    ELSE false
  END
);

-- Log what we've done
DO $$
BEGIN
  RAISE NOTICE 'Fixed RLS policies for candidate_assessments, interview_invitations, usage_events, and users tables';
  RAISE NOTICE 'All policies now use proper tenant lookup instead of JWT claims';
END $$; 