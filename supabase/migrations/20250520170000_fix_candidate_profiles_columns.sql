-- Migration: Fix candidate_profiles missing PDL columns
-- Purpose: Ensure pdl_id, pdl_likelihood, and last_enriched_at columns exist before comments in previous migration
-- Date: 2025-05-20

-- Add columns if they do not already exist
alter table if exists public.candidate_profiles
  add column if not exists pdl_id text null,
  add column if not exists pdl_likelihood integer null,
  add column if not exists last_enriched_at timestamptz null;

-- Add comments for documentation
comment on column public.candidate_profiles.pdl_id is 'People Data Labs unique identifier';
comment on column public.candidate_profiles.pdl_likelihood is 'Likelihood score assigned by PDL';
comment on column public.candidate_profiles.last_enriched_at is 'Timestamp when profile was last enriched from PDL'; 