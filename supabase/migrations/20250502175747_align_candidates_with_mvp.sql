-- migration: align candidates table with mvp structure
-- purpose: add missing columns from the mvp structure while maintaining multi-tenant architecture
-- date: 2025-05-02
--
-- this migration adds missing columns to the candidates table to align with the mvp implementation
-- while preserving our triangular saas multi-tenant architecture.

-- add missing columns to candidates table
alter table public.candidates 
  add column if not exists phone text,
  add column if not exists resume_text text,
  add column if not exists skills text[] default '{}',
  add column if not exists experience jsonb default '{}',
  add column if not exists education text;

-- add comments explaining the columns
comment on column public.candidates.phone is 'phone number for the candidate, used for pdl enrichment';
comment on column public.candidates.resume_text is 'raw text extracted from the resume pdf';
comment on column public.candidates.skills is 'array of candidate skills extracted from resume analysis';
comment on column public.candidates.experience is 'structured json representation of work experience';
comment on column public.candidates.education is 'education background information';

-- create an index on skills array for better search performance
create index if not exists idx_candidates_skills on public.candidates using gin (skills);

-- ensure rls policies are correctly enforced
-- note: we're checking existing policies rather than modifying them
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'candidates' and policyname like '%tenant_id%'
  ) then
    raise notice 'warning: candidates table may be missing tenant isolation policies';
  end if;
end
$$; 