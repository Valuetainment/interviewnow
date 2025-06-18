-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  interview_session_id uuid references public.interview_sessions(id) on delete cascade,
  type text not null check (type in ('interview_completed', 'interview_scheduled', 'interview_cancelled', 'assessment_ready')),
  title text not null,
  message text,
  is_read boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable row level security
alter table public.notifications enable row level security;

-- Create policies for authenticated users to access their own notifications
create policy "Users can view their own notifications"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "System can create notifications"
  on public.notifications
  for insert
  to authenticated
  with check (true);

create policy "Users can update their own notifications"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete their own notifications"
  on public.notifications
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Create indexes for performance
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_tenant_id on public.notifications(tenant_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- Create trigger to update the updated_at timestamp
create or replace function update_notifications_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_notifications_updated_at
  before update on public.notifications
  for each row
  execute function update_notifications_updated_at();

-- Create a function to create notifications when interviews are completed
create or replace function create_interview_completed_notification()
returns trigger as $$
begin
  -- Only create notification when status changes to 'completed'
  if new.status = 'completed' and old.status != 'completed' then
    -- Get all users in the tenant who should be notified
    insert into public.notifications (user_id, tenant_id, interview_session_id, type, title, message)
    select 
      tu.user_id,
      new.tenant_id,
      new.id,
      'interview_completed',
      'Interview Completed',
      concat('Interview with ', coalesce(c.first_name || ' ' || c.last_name, 'Unknown Candidate'), ' for ', p.title, ' has been completed')
    from public.tenant_users tu
    left join public.candidates c on c.id = new.candidate_id
    left join public.positions p on p.id = new.position_id
    where tu.tenant_id = new.tenant_id
    and tu.role in ('admin', 'user'); -- Only notify admin and regular users, not candidates
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically create notifications when interviews are completed
create trigger create_interview_completed_notification_trigger
  after update on public.interview_sessions
  for each row
  execute function create_interview_completed_notification(); 