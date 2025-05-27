-- transcript_entries table schema
-- stores transcript entries for interview sessions

create table if not exists public.transcript_entries (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null,
  session_id uuid not null references public.interview_sessions(id) on delete cascade,
  speaker text not null,
  text text not null,
  start_ms integer not null,
  confidence real,
  created_at timestamptz not null default now(),
  timestamp timestamptz default now(),
  source_architecture text
);

-- enable row level security
alter table public.transcript_entries enable row level security;

-- rls policies for anon role
create policy "anon_select_transcript_entries"
  on public.transcript_entries
  for select
  to anon
  using (false); -- anon users cannot view transcript entries

create policy "anon_insert_transcript_entries"
  on public.transcript_entries
  for insert
  to anon
  with check (false); -- anon users cannot insert transcript entries

create policy "anon_update_transcript_entries"
  on public.transcript_entries
  for update
  to anon
  using (false); -- anon users cannot update transcript entries

create policy "anon_delete_transcript_entries"
  on public.transcript_entries
  for delete
  to anon
  using (false); -- anon users cannot delete transcript entries

-- rls policies for authenticated role
create policy "authenticated_select_transcript_entries"
  on public.transcript_entries
  for select
  to authenticated
  using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = transcript_entries.session_id
      and (
        s.tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid())
        or s.candidate_id in (select id from public.candidates where email = auth.email())
      )
    )
  );

create policy "authenticated_insert_transcript_entries"
  on public.transcript_entries
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.interview_sessions s
      where s.id = transcript_entries.session_id
      and s.status = 'in_progress'
      and s.tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid())
    )
  );

create policy "authenticated_update_transcript_entries"
  on public.transcript_entries
  for update
  to authenticated
  using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = transcript_entries.session_id
      and s.tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid())
    )
  );

create policy "authenticated_delete_transcript_entries"
  on public.transcript_entries
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = transcript_entries.session_id
      and s.tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid())
    )
  );

-- create indexes for performance
create index if not exists idx_transcript_entries_session_id on public.transcript_entries(session_id);
create index if not exists idx_transcript_entries_timestamp on public.transcript_entries(session_id, timestamp);
create index if not exists idx_transcript_entries_tenant_id on public.transcript_entries(tenant_id);