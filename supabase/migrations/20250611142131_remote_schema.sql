drop trigger if exists "set_transcript_tenant_id" on "public"."transcript_entries";

drop trigger if exists "set_video_segment_tenant_id" on "public"."video_segments";

drop policy "tenant_isolation_candidate_profiles" on "public"."candidate_profiles";

drop policy "tenant_insert_candidates" on "public"."candidates";

drop policy "tenant_isolation_candidates" on "public"."candidates";

drop policy "tenant_insert_positions" on "public"."positions";

drop policy "tenant_isolation_candidate_assessments" on "public"."candidate_assessments";

drop policy "tenant_isolation_interview_invitations" on "public"."interview_invitations";

drop policy "Users can insert transcript entries for active sessions" on "public"."transcript_entries";

drop policy "Users can view transcript entries for sessions they have access" on "public"."transcript_entries";

drop policy "tenant_isolation_usage_events" on "public"."usage_events";

drop policy "tenant_isolation_users" on "public"."users";

drop policy "Users can insert video segments for active sessions" on "public"."video_segments";

drop policy "Users can view video segments for sessions they have access to" on "public"."video_segments";

revoke delete on table "public"."tenant_users" from "anon";

revoke insert on table "public"."tenant_users" from "anon";

revoke references on table "public"."tenant_users" from "anon";

revoke select on table "public"."tenant_users" from "anon";

revoke trigger on table "public"."tenant_users" from "anon";

revoke truncate on table "public"."tenant_users" from "anon";

revoke update on table "public"."tenant_users" from "anon";

revoke delete on table "public"."tenant_users" from "authenticated";

revoke insert on table "public"."tenant_users" from "authenticated";

revoke references on table "public"."tenant_users" from "authenticated";

revoke select on table "public"."tenant_users" from "authenticated";

revoke trigger on table "public"."tenant_users" from "authenticated";

revoke truncate on table "public"."tenant_users" from "authenticated";

revoke update on table "public"."tenant_users" from "authenticated";

revoke delete on table "public"."tenant_users" from "service_role";

revoke insert on table "public"."tenant_users" from "service_role";

revoke references on table "public"."tenant_users" from "service_role";

revoke select on table "public"."tenant_users" from "service_role";

revoke trigger on table "public"."tenant_users" from "service_role";

revoke truncate on table "public"."tenant_users" from "service_role";

revoke update on table "public"."tenant_users" from "service_role";

alter table "public"."candidate_profiles" drop constraint "unique_candidate_profile";

alter table "public"."tenant_users" drop constraint "tenant_users_tenant_id_user_id_key";

alter table "public"."transcript_entries" drop constraint "transcript_entries_interview_session_id_fkey";

alter table "public"."video_segments" drop constraint "video_segments_interview_session_id_fkey";

alter table "public"."video_segments" drop constraint "video_segments_tenant_id_fkey";

alter table "public"."transcript_entries" drop constraint "transcript_entries_tenant_id_fkey";

drop function if exists "public"."get_current_tenant_id"();

drop function if exists "public"."get_tenant_id"();

drop function if exists "public"."set_tenant_id_from_session"();

alter table "public"."tenant_users" drop constraint "tenant_users_pkey";

drop index if exists "public"."idx_interview_sessions_webrtc_architecture";

drop index if exists "public"."idx_interview_sessions_webrtc_session_id";

drop index if exists "public"."idx_interview_sessions_webrtc_status";

drop index if exists "public"."idx_transcript_entries_speaker";

drop index if exists "public"."idx_video_segments_session_id";

drop index if exists "public"."tenant_users_pkey";

drop index if exists "public"."tenant_users_tenant_id_user_id_key";

drop index if exists "public"."unique_candidate_profile";

drop index if exists "public"."idx_transcript_entries_session_id";

drop table "public"."tenant_users";

create table "public"."candidate_tenants" (
    "candidate_id" uuid not null,
    "tenant_id" uuid not null,
    "status" text not null default 'active'::text,
    "relationship_type" text not null default 'candidate'::text,
    "invitation_date" timestamp with time zone not null default now(),
    "last_interaction" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."candidate_tenants" enable row level security;

alter table "public"."candidate_profiles" drop column "pdl_source_id";

alter table "public"."candidate_profiles" drop column "pdl_updated_at";

alter table "public"."candidate_profiles" alter column "created_at" set not null;

alter table "public"."candidates" add column "auth_email" text;

alter table "public"."candidates" add column "auth_id" uuid;

alter table "public"."candidates" add column "first_name" text;

alter table "public"."candidates" add column "last_name" text;

alter table "public"."interview_sessions" drop column "ai_persona";

alter table "public"."interview_sessions" drop column "fly_machine_id";

alter table "public"."interview_sessions" drop column "fly_region";

alter table "public"."interview_sessions" drop column "openai_configuration";

alter table "public"."interview_sessions" drop column "webrtc_disconnection_time";

alter table "public"."interview_sessions" alter column "webrtc_architecture" drop default;

alter table "public"."transcript_entries" drop column "interview_session_id";

alter table "public"."transcript_entries" drop column "updated_at";

alter table "public"."transcript_entries" add column "session_id" uuid not null;

alter table "public"."transcript_entries" add column "start_ms" integer not null;

alter table "public"."transcript_entries" alter column "confidence" set data type real using "confidence"::real;

alter table "public"."transcript_entries" alter column "id" set default uuid_generate_v4();

alter table "public"."transcript_entries" alter column "speaker" set not null;

alter table "public"."transcript_entries" alter column "tenant_id" set not null;

alter table "public"."transcript_entries" alter column "timestamp" drop not null;

alter table "public"."video_segments" drop column "interview_session_id";

alter table "public"."video_segments" drop column "tenant_id";

alter table "public"."video_segments" add column "session_id" uuid not null;

alter table "public"."video_segments" alter column "id" set default uuid_generate_v4();

drop extension if exists "pg_trgm";

CREATE UNIQUE INDEX candidate_profiles_candidate_id_key ON public.candidate_profiles USING btree (candidate_id, tenant_id);

CREATE UNIQUE INDEX candidate_tenants_pkey ON public.candidate_tenants USING btree (candidate_id, tenant_id);

CREATE INDEX idx_transcript_entries_tenant_id ON public.transcript_entries USING btree (tenant_id);

CREATE INDEX idx_transcript_entries_timestamp ON public.transcript_entries USING btree (session_id, "timestamp");

CREATE INDEX idx_transcript_entries_session_id ON public.transcript_entries USING btree (session_id);

alter table "public"."candidate_tenants" add constraint "candidate_tenants_pkey" PRIMARY KEY using index "candidate_tenants_pkey";

alter table "public"."candidate_profiles" add constraint "candidate_profiles_candidate_id_key" UNIQUE using index "candidate_profiles_candidate_id_key";

alter table "public"."candidate_tenants" add constraint "candidate_tenants_candidate_id_fkey" FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE not valid;

alter table "public"."candidate_tenants" validate constraint "candidate_tenants_candidate_id_fkey";

alter table "public"."candidate_tenants" add constraint "candidate_tenants_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE not valid;

alter table "public"."candidate_tenants" validate constraint "candidate_tenants_tenant_id_fkey";

alter table "public"."candidates" add constraint "candidates_auth_id_fkey" FOREIGN KEY (auth_id) REFERENCES auth.users(id) not valid;

alter table "public"."candidates" validate constraint "candidates_auth_id_fkey";

alter table "public"."transcript_entries" add constraint "transcript_entries_session_id_fkey" FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."transcript_entries" validate constraint "transcript_entries_session_id_fkey";

alter table "public"."video_segments" add constraint "video_segments_session_id_fkey" FOREIGN KEY (session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."video_segments" validate constraint "video_segments_session_id_fkey";

alter table "public"."transcript_entries" add constraint "transcript_entries_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE not valid;

alter table "public"."transcript_entries" validate constraint "transcript_entries_tenant_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_candidate_invitation(p_tenant_id uuid, p_candidate_email text, p_position_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_candidate_id UUID;
  v_invitation_token UUID;
  v_session_id UUID;
BEGIN
  -- Find or create candidate
  SELECT id INTO v_candidate_id FROM candidates 
  WHERE email = p_candidate_email AND tenant_id = p_tenant_id;
  
  IF v_candidate_id IS NULL THEN
    -- Create new candidate
    INSERT INTO candidates (tenant_id, email, full_name, auth_email)
    VALUES (p_tenant_id, p_candidate_email, split_part(p_candidate_email, '@', 1), p_candidate_email)
    RETURNING id INTO v_candidate_id;
  END IF;
  
  -- Create interview session if position provided
  IF p_position_id IS NOT NULL THEN
    INSERT INTO interview_sessions (tenant_id, candidate_id, position_id, status)
    VALUES (p_tenant_id, v_candidate_id, p_position_id, 'invited')
    RETURNING id INTO v_session_id;
  END IF;
  
  -- Create invitation token
  INSERT INTO interview_invitations (tenant_id, candidate_id, session_id, expires_at)
  VALUES (
    p_tenant_id, 
    v_candidate_id,
    v_session_id,
    NOW() + INTERVAL '7 days'
  )
  RETURNING token INTO v_invitation_token;
  
  -- Create candidate-tenant relationship if it doesn't exist
  INSERT INTO candidate_tenants (candidate_id, tenant_id)
  VALUES (v_candidate_id, p_tenant_id)
  ON CONFLICT (candidate_id, tenant_id) DO NOTHING;
  
  RETURN v_invitation_token;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.debug_jwt_claims()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'jwt', auth.jwt(),
    'uid', auth.uid(),
    'role', auth.role(),
    'email', auth.email(),
    'tenant_id_function', auth.get_tenant_id()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  default_tenant_id uuid := '11111111-1111-1111-1111-111111111111'; -- Acme Corp
BEGIN
  -- Create a new user record and associate with default tenant
  INSERT INTO public.users (id, tenant_id, role, created_at, updated_at)
  VALUES (NEW.id, default_tenant_id, 'member', NOW(), NOW());
  
  -- Return the new auth user
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_candidate_tenants_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$function$
;

grant delete on table "public"."candidate_tenants" to "anon";

grant insert on table "public"."candidate_tenants" to "anon";

grant references on table "public"."candidate_tenants" to "anon";

grant select on table "public"."candidate_tenants" to "anon";

grant trigger on table "public"."candidate_tenants" to "anon";

grant truncate on table "public"."candidate_tenants" to "anon";

grant update on table "public"."candidate_tenants" to "anon";

grant delete on table "public"."candidate_tenants" to "authenticated";

grant insert on table "public"."candidate_tenants" to "authenticated";

grant references on table "public"."candidate_tenants" to "authenticated";

grant select on table "public"."candidate_tenants" to "authenticated";

grant trigger on table "public"."candidate_tenants" to "authenticated";

grant truncate on table "public"."candidate_tenants" to "authenticated";

grant update on table "public"."candidate_tenants" to "authenticated";

grant delete on table "public"."candidate_tenants" to "service_role";

grant insert on table "public"."candidate_tenants" to "service_role";

grant references on table "public"."candidate_tenants" to "service_role";

grant select on table "public"."candidate_tenants" to "service_role";

grant trigger on table "public"."candidate_tenants" to "service_role";

grant truncate on table "public"."candidate_tenants" to "service_role";

grant update on table "public"."candidate_tenants" to "service_role";

create policy "Candidates can view their own tenant relationships"
on "public"."candidate_tenants"
as permissive
for select
to public
using ((candidate_id IN ( SELECT c.id
   FROM candidates c
  WHERE (c.auth_id = auth.uid()))));


create policy "Tenant users can create candidate relationships"
on "public"."candidate_tenants"
as permissive
for insert
to public
with check ((tenant_id IN ( SELECT users.tenant_id
   FROM users
  WHERE (users.id = auth.uid()))));


create policy "Tenant users can view their tenant's candidates"
on "public"."candidate_tenants"
as permissive
for select
to public
using ((tenant_id IN ( SELECT users.tenant_id
   FROM users
  WHERE (users.id = auth.uid()))));


create policy "Allow authenticated users to access candidates"
on "public"."candidates"
as permissive
for all
to authenticated
using (true);


create policy "Candidates can view their own profile"
on "public"."candidates"
as permissive
for select
to public
using ((auth_id = auth.uid()));


create policy "Users can view own data"
on "public"."users"
as permissive
for select
to authenticated
using ((auth.uid() = id));


create policy "insert_user_on_signup"
on "public"."users"
as permissive
for insert
to public
with check (true);


create policy "users_insert_policy"
on "public"."users"
as permissive
for insert
to public
with check (true);


create policy "tenant_isolation_candidate_assessments"
on "public"."candidate_assessments"
as permissive
for all
to public
using ((tenant_id = (current_setting('request.jwt.claim.tenant_id'::text))::uuid));


create policy "tenant_isolation_interview_invitations"
on "public"."interview_invitations"
as permissive
for all
to public
using ((tenant_id = (current_setting('request.jwt.claim.tenant_id'::text))::uuid));


create policy "Users can insert transcript entries for active sessions"
on "public"."transcript_entries"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM interview_sessions s
  WHERE ((s.id = transcript_entries.session_id) AND (s.status = 'in_progress'::text) AND (s.tenant_id IN ( SELECT users.tenant_id
           FROM users
          WHERE (users.id = auth.uid())))))));


create policy "Users can view transcript entries for sessions they have access"
on "public"."transcript_entries"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM interview_sessions s
  WHERE ((s.id = transcript_entries.session_id) AND ((s.tenant_id IN ( SELECT users.tenant_id
           FROM users
          WHERE (users.id = auth.uid()))) OR (s.candidate_id IN ( SELECT candidates.id
           FROM candidates
          WHERE (candidates.email = auth.email()))))))));


create policy "tenant_isolation_usage_events"
on "public"."usage_events"
as permissive
for all
to public
using ((tenant_id = (current_setting('request.jwt.claim.tenant_id'::text))::uuid));


create policy "tenant_isolation_users"
on "public"."users"
as permissive
for all
to public
using (((tenant_id = (NULLIF(current_setting('request.jwt.claim.tenant_id'::text, true), ''::text))::uuid) OR (auth.role() = 'service_role'::text) OR (auth.role() = 'anon'::text)));


create policy "Users can insert video segments for active sessions"
on "public"."video_segments"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM interview_sessions s
  WHERE ((s.id = video_segments.session_id) AND (s.status = 'in_progress'::text) AND (s.tenant_id IN ( SELECT users.tenant_id
           FROM users
          WHERE (users.id = auth.uid())))))));


create policy "Users can view video segments for sessions they have access to"
on "public"."video_segments"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM interview_sessions s
  WHERE ((s.id = video_segments.session_id) AND ((s.tenant_id IN ( SELECT users.tenant_id
           FROM users
          WHERE (users.id = auth.uid()))) OR (s.candidate_id IN ( SELECT candidates.id
           FROM candidates
          WHERE (candidates.email = auth.email()))))))));


CREATE TRIGGER update_candidate_tenants_timestamp BEFORE UPDATE ON public.candidate_tenants FOR EACH ROW EXECUTE FUNCTION update_candidate_tenants_timestamp();

CREATE TRIGGER update_candidate_tenants_updated_at BEFORE UPDATE ON public.candidate_tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


