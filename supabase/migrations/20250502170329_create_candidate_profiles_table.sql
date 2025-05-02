-- Migration: Create candidate_profiles table
-- Purpose: Add support for storing enriched candidate data from People Data Labs (PDL)
-- Date: 2025-05-02
--
-- This migration creates a new candidate_profiles table to store enriched profile data
-- from PDL API, separate from the basic candidate information.
-- The table includes tenant isolation for multi-tenant architecture support.

-- create candidate_profiles table
create table if not exists public.candidate_profiles (
  -- primary key and relationships
  id uuid not null default gen_random_uuid(),
  candidate_id uuid not null,
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  
  -- pdl specific fields
  pdl_id text null,
  pdl_likelihood integer null,
  last_enriched_at timestamptz null,
  
  -- basic profile information
  first_name text null,
  middle_name text null,
  last_name text null,
  gender text null,
  birth_year integer null,
  
  -- location information
  location_name text null,
  location_locality text null,
  location_region text null,
  location_country text null,
  location_continent text null,
  location_postal_code text null,
  location_street_address text null,
  location_geo text null,
  
  -- current job information
  job_title text null,
  job_company_name text null,
  job_company_size text null,
  job_company_industry text null,
  job_start_date text null,
  job_last_updated text null,
  
  -- social profiles
  linkedin_url text null,
  linkedin_username text null,
  linkedin_id text null,
  twitter_url text null,
  twitter_username text null,
  facebook_url text null,
  facebook_username text null,
  github_url text null,
  github_username text null,
  
  -- skills and interests
  skills text[] null,
  interests text[] null,
  countries text[] null,
  
  -- structured json data
  experience jsonb null,
  education jsonb null,
  
  -- job related classifications
  industry text null,
  job_title_levels text[] null,
  
  -- constraints
  constraint candidate_profiles_pkey primary key (id),
  constraint candidate_profiles_candidate_id_key unique (candidate_id, tenant_id),
  constraint candidate_profiles_candidate_id_fkey foreign key (candidate_id) references public.candidates(id) on delete cascade,
  constraint candidate_profiles_tenant_id_fkey foreign key (tenant_id) references public.tenants(id) on delete cascade
);

-- create indexes for performance
create index if not exists idx_candidate_profiles_candidate_id on public.candidate_profiles using btree (candidate_id);
create index if not exists idx_candidate_profiles_tenant_id on public.candidate_profiles using btree (tenant_id);
create index if not exists idx_candidate_profiles_linkedin_url on public.candidate_profiles using btree (linkedin_url);
create index if not exists idx_candidate_profiles_email_gin on public.candidate_profiles using gin (skills);

-- enable row level security
alter table public.candidate_profiles enable row level security;

-- create policies for tenant isolation and proper access control
-- select policy - authenticated users can view profiles in their tenant
create policy "tenant_users_can_view_profiles" 
on public.candidate_profiles
for select
to authenticated
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- insert policy - authenticated users can insert profiles in their tenant
create policy "tenant_users_can_insert_profiles" 
on public.candidate_profiles
for insert
to authenticated
with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- update policy - authenticated users can update profiles in their tenant
create policy "tenant_users_can_update_profiles" 
on public.candidate_profiles
for update
to authenticated
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- delete policy - authenticated users can delete profiles in their tenant
create policy "tenant_users_can_delete_profiles" 
on public.candidate_profiles
for delete
to authenticated
using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- create trigger function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- check if the trigger function already exists, and add an updated_at column if needed
alter table public.candidate_profiles add column if not exists updated_at timestamptz not null default now();

-- create trigger to update the updated_at column
create trigger update_candidate_profiles_updated_at
before update on public.candidate_profiles
for each row
execute function public.update_updated_at_column();

-- add comments
comment on table public.candidate_profiles is 'Stores enriched candidate profile data from People Data Labs';
comment on column public.candidate_profiles.tenant_id is 'The tenant that this profile belongs to';
comment on column public.candidate_profiles.candidate_id is 'Reference to the candidate this profile enriches';
comment on column public.candidate_profiles.pdl_id is 'People Data Labs unique identifier';
comment on column public.candidate_profiles.experience is 'JSON array of work experience entries';
comment on column public.candidate_profiles.education is 'JSON array of education entries'; 