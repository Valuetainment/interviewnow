-- interview_sessions table schema
-- stores interview session information

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  position_id uuid references public.positions(id) on delete set null,
  candidate_id uuid references public.candidates(id) on delete set null,
  title text,
  description text,
  scheduled_time timestamptz,
  status text default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- webrtc related columns
  webrtc_status text default 'pending',
  webrtc_server_url text,
  webrtc_session_id text,
  webrtc_architecture text,
  webrtc_connection_time timestamptz,
  webrtc_operation_id text,
  ice_candidates jsonb default '[]',
  sdp_offers jsonb default '[]',
  sdp_answers jsonb default '[]',
  company_id uuid
);

-- enable row level security
alter table public.interview_sessions enable row level security;

-- rls policies for anon role
create policy "anon_select_interview_sessions"
  on public.interview_sessions
  for select
  to anon
  using (false); -- anon users cannot view interview sessions

create policy "anon_insert_interview_sessions"
  on public.interview_sessions
  for insert
  to anon
  with check (false); -- anon users cannot insert interview sessions

create policy "anon_update_interview_sessions"
  on public.interview_sessions
  for update
  to anon
  using (false); -- anon users cannot update interview sessions

create policy "anon_delete_interview_sessions"
  on public.interview_sessions
  for delete
  to anon
  using (false); -- anon users cannot delete interview sessions

-- rls policies for authenticated role
create policy "authenticated_select_interview_sessions"
  on public.interview_sessions
  for select
  to authenticated
  using (
    tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid())
    or candidate_id in (select id from public.candidates where email = auth.email())
  );

create policy "authenticated_insert_interview_sessions"
  on public.interview_sessions
  for insert
  to authenticated
  with check (
    tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid())
  );

create policy "authenticated_update_interview_sessions"
  on public.interview_sessions
  for update
  to authenticated
  using (
    tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid())
  );

create policy "authenticated_delete_interview_sessions"
  on public.interview_sessions
  for delete
  to authenticated
  using (
    tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid())
  );

-- create indexes for performance
create index if not exists idx_interview_sessions_tenant_id on public.interview_sessions(tenant_id);
create index if not exists idx_interview_sessions_status on public.interview_sessions(status);
create index if not exists idx_interview_sessions_webrtc_session_id on public.interview_sessions(webrtc_session_id) where webrtc_session_id is not null;