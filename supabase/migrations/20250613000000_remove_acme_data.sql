-- Remove Acme Corp test data
-- This migration cleans up the old test data that was automatically created

-- First, we need to delete data in the correct order due to foreign key constraints

-- Delete transcript entries for any interview sessions related to Acme
DELETE FROM public.transcript_entries 
WHERE session_id IN (
    SELECT id FROM public.interview_sessions 
    WHERE tenant_id IN (
        SELECT id FROM public.tenants WHERE name = 'Acme Corp'
    )
);

-- Delete video segments for any interview sessions related to Acme
DELETE FROM public.video_segments 
WHERE session_id IN (
    SELECT id FROM public.interview_sessions 
    WHERE tenant_id IN (
        SELECT id FROM public.tenants WHERE name = 'Acme Corp'
    )
);

-- Delete interview invitations
DELETE FROM public.interview_invitations 
WHERE tenant_id IN (
    SELECT id FROM public.tenants WHERE name = 'Acme Corp'
);

-- Delete interview sessions
DELETE FROM public.interview_sessions 
WHERE tenant_id IN (
    SELECT id FROM public.tenants WHERE name = 'Acme Corp'
);

-- Delete position competencies
DELETE FROM public.position_competencies 
WHERE tenant_id IN (
    SELECT id FROM public.tenants WHERE name = 'Acme Corp'
);

-- Delete positions
DELETE FROM public.positions 
WHERE tenant_id IN (
    SELECT id FROM public.tenants WHERE name = 'Acme Corp'
);

-- Delete competencies
DELETE FROM public.competencies 
WHERE tenant_id IN (
    SELECT id FROM public.tenants WHERE name = 'Acme Corp'
);

-- Delete candidate profiles
DELETE FROM public.candidate_profiles 
WHERE tenant_id IN (
    SELECT id FROM public.tenants WHERE name = 'Acme Corp'
);

-- Delete candidates
DELETE FROM public.candidates 
WHERE tenant_id IN (
    SELECT id FROM public.tenants WHERE name = 'Acme Corp'
);

-- Delete companies associated with Acme Corp tenant
DELETE FROM public.companies 
WHERE tenant_id IN (
    SELECT id FROM public.tenants WHERE name = 'Acme Corp'
);

-- Delete tenant preferences
DELETE FROM public.tenant_preferences 
WHERE tenant_id IN (
    SELECT id FROM public.tenants WHERE name = 'Acme Corp'
);

-- Delete users associated with Acme Corp tenant
DELETE FROM public.users 
WHERE tenant_id IN (
    SELECT id FROM public.tenants WHERE name = 'Acme Corp'
);

-- Finally, delete the Acme Corp tenant
DELETE FROM public.tenants 
WHERE name = 'Acme Corp';

-- Also clean up any tenant with ID '11111111-1111-1111-1111-111111111111' if it exists
-- This was the hardcoded ID used in some migrations
DELETE FROM public.transcript_entries 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM public.video_segments 
WHERE session_id IN (
    SELECT id FROM public.interview_sessions 
    WHERE tenant_id = '11111111-1111-1111-1111-111111111111'
);

DELETE FROM public.interview_invitations 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM public.interview_sessions 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM public.position_competencies 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM public.positions 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM public.competencies 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM public.candidate_profiles 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM public.candidates 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM public.companies 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM public.tenant_preferences 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM public.users 
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

DELETE FROM public.tenants 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Log what we've done
DO $$
BEGIN
  RAISE NOTICE 'Cleaned up Acme Corp test data and related records';
END $$; 