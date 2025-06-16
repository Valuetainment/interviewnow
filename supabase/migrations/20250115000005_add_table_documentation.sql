-- Migration: Add comprehensive table and column documentation
-- Purpose: Document all tables and important columns for better maintainability
-- Date: 2025-01-15
-- Priority: MEDIUM

-- Table comments
COMMENT ON TABLE public.tenants IS 'Multi-tenant organizations using the platform';
COMMENT ON TABLE public.users IS 'User accounts linked to Supabase Auth, with tenant association';
COMMENT ON TABLE public.tenant_users IS 'Maps users to tenants - supports many-to-many relationships if needed';
COMMENT ON TABLE public.companies IS 'Company profiles within a tenant organization';
COMMENT ON TABLE public.tenant_preferences IS 'Tenant-specific settings and preferences (avatar configs, limits, etc)';
COMMENT ON TABLE public.candidates IS 'Job candidates being interviewed';
COMMENT ON TABLE public.candidate_profiles IS 'Enriched candidate data from People Data Labs API';
COMMENT ON TABLE public.positions IS 'Job positions/roles being hired for';
COMMENT ON TABLE public.competencies IS 'Skills and competencies that can be evaluated';
COMMENT ON TABLE public.position_competencies IS 'Maps positions to required competencies with importance weights';
COMMENT ON TABLE public.interview_sessions IS 'Interview scheduling, status tracking, and WebRTC connection data';
COMMENT ON TABLE public.transcript_entries IS 'Speech-to-text transcript segments from interviews';
COMMENT ON TABLE public.video_segments IS 'Video recording segments from interviews';
COMMENT ON TABLE public.candidate_assessments IS 'AI-generated assessments and scores for completed interviews';
COMMENT ON TABLE public.interview_invitations IS 'Invitation tokens sent to candidates for interviews';
COMMENT ON TABLE public.usage_events IS 'Usage tracking for billing and analytics';

-- Key column comments for tenants table
COMMENT ON COLUMN public.tenants.plan_tier IS 'Subscription plan level: free, starter, professional, enterprise';
COMMENT ON COLUMN public.tenants.name IS 'Organization/company name';

-- Key column comments for users table
COMMENT ON COLUMN public.users.role IS 'User role within tenant: admin, interviewer, viewer, user';
COMMENT ON COLUMN public.users.tenant_id IS 'The tenant this user belongs to';

-- Key column comments for companies table
COMMENT ON COLUMN public.companies.culture IS 'Company culture description';
COMMENT ON COLUMN public.companies.story IS 'Company history/story';
COMMENT ON COLUMN public.companies.values IS 'Company values description';
COMMENT ON COLUMN public.companies.benefits IS 'General benefits description';
COMMENT ON COLUMN public.companies.core_values IS 'JSON array of core company values';
COMMENT ON COLUMN public.companies.benefits_list IS 'JSON array of specific benefits';

-- Key column comments for tenant_preferences table
COMMENT ON COLUMN public.tenant_preferences.avatar_enabled_default IS 'Whether AI avatars are enabled by default for new interviews';
COMMENT ON COLUMN public.tenant_preferences.default_avatar_id IS 'Default avatar ID to use (e.g., dvp_Tristan_cloth2_1080P)';
COMMENT ON COLUMN public.tenant_preferences.avatar_provider IS 'Avatar service provider (e.g., akool)';
COMMENT ON COLUMN public.tenant_preferences.avatar_monthly_limit IS 'Monthly limit for avatar-enabled interviews';
COMMENT ON COLUMN public.tenant_preferences.avatar_usage_count IS 'Current month avatar usage count';

-- Key column comments for candidates table
COMMENT ON COLUMN public.candidates.resume_url IS 'URL to uploaded resume file';
COMMENT ON COLUMN public.candidates.resume_analysis IS 'JSON containing AI-analyzed resume data';

-- Key column comments for candidate_profiles table
COMMENT ON COLUMN public.candidate_profiles.pdl_id IS 'People Data Labs unique identifier';
COMMENT ON COLUMN public.candidate_profiles.pdl_likelihood IS 'PDL match confidence score';
COMMENT ON COLUMN public.candidate_profiles.last_enriched_at IS 'When profile was last enriched from PDL';
COMMENT ON COLUMN public.candidate_profiles.skills IS 'Array of candidate skills';
COMMENT ON COLUMN public.candidate_profiles.experience IS 'JSON array of work experience entries';
COMMENT ON COLUMN public.candidate_profiles.education IS 'JSON array of education entries';

-- Key column comments for positions table
COMMENT ON COLUMN public.positions.level IS 'Seniority level (junior, mid, senior, lead, principal)';
COMMENT ON COLUMN public.positions.min_experience IS 'Minimum years of experience required';
COMMENT ON COLUMN public.positions.max_experience IS 'Maximum years of experience (for range)';
COMMENT ON COLUMN public.positions.additional_details IS 'JSON containing additional position details';

-- Key column comments for position_competencies table
COMMENT ON COLUMN public.position_competencies.weight IS 'Importance weight 0-100, total per position should equal 100';

-- Key column comments for interview_sessions table
COMMENT ON COLUMN public.interview_sessions.status IS 'Interview status: scheduled, in_progress, completed, cancelled, no_show';
COMMENT ON COLUMN public.interview_sessions.webrtc_status IS 'WebRTC connection status: pending, connecting, connected, failed, completed, disconnected';
COMMENT ON COLUMN public.interview_sessions.webrtc_server_url IS 'WebRTC signaling server URL';
COMMENT ON COLUMN public.interview_sessions.webrtc_session_id IS 'Unique WebRTC session identifier';
COMMENT ON COLUMN public.interview_sessions.webrtc_architecture IS 'WebRTC architecture type used';
COMMENT ON COLUMN public.interview_sessions.ice_candidates IS 'JSON array of ICE candidates for WebRTC';
COMMENT ON COLUMN public.interview_sessions.sdp_offers IS 'JSON array of SDP offers for WebRTC';
COMMENT ON COLUMN public.interview_sessions.sdp_answers IS 'JSON array of SDP answers for WebRTC';

-- Key column comments for video_segments table
COMMENT ON COLUMN public.video_segments.status IS 'Processing status: processing, ready, failed, deleted';
COMMENT ON COLUMN public.video_segments.video_provider IS 'Video service provider (e.g., api.video)';
COMMENT ON COLUMN public.video_segments.metadata IS 'JSON metadata from video provider';

-- Key column comments for candidate_assessments table
COMMENT ON COLUMN public.candidate_assessments.details IS 'JSON containing detailed assessment breakdown';
COMMENT ON COLUMN public.candidate_assessments.weighted_score IS 'Overall weighted score 0-10';

-- Key column comments for interview_invitations table
COMMENT ON COLUMN public.interview_invitations.token IS 'Unique token sent to candidate (also serves as primary key)';
COMMENT ON COLUMN public.interview_invitations.status IS 'Invitation status: pending, sent, opened, accepted, declined, expired';
COMMENT ON COLUMN public.interview_invitations.expires_at IS 'When the invitation link expires';

-- Key column comments for usage_events table
COMMENT ON COLUMN public.usage_events.event_type IS 'Type of billable event (e.g., interview_completed, avatar_used)';
COMMENT ON COLUMN public.usage_events.quantity IS 'Quantity for the event (default 1)'; 