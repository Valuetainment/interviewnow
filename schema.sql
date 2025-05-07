

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  default_tenant_id uuid := '11111111-1111-1111-1111-111111111111'; -- Acme Corp
BEGIN
  -- Create a new user record and associate with default tenant
  INSERT INTO public.users (id, tenant_id, role, created_at, updated_at)
  VALUES (NEW.id, default_tenant_id, 'member', NOW(), NOW());
  
  -- Return the new auth user
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_position_competency_weights"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_weight INTEGER;
BEGIN
  -- Calculate the total weight for the position including the new/updated row
  SELECT SUM(weight) INTO total_weight
  FROM position_competencies
  WHERE position_id = NEW.position_id AND tenant_id = NEW.tenant_id;
  
  -- Check if the total weight exceeds 100
  IF total_weight > 100 THEN
    RAISE EXCEPTION 'Total weight for position competencies cannot exceed 100';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_position_competency_weights"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."candidate_assessments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "details" "jsonb" NOT NULL,
    "weighted_score" real NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."candidate_assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."candidates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "resume_url" "text",
    "resume_analysis" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."candidates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."competencies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."competencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_invitations" (
    "token" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "candidate_id" "uuid" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."interview_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interview_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "position_id" "uuid" NOT NULL,
    "candidate_id" "uuid" NOT NULL,
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "video_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."interview_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."position_competencies" (
    "position_id" "uuid" NOT NULL,
    "competency_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "weight" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "position_competencies_weight_check" CHECK ((("weight" >= 0) AND ("weight" <= 100)))
);


ALTER TABLE "public"."position_competencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."positions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."positions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "plan_tier" "text" DEFAULT 'free'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transcript_entries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "speaker" "text" NOT NULL,
    "text" "text" NOT NULL,
    "start_ms" integer NOT NULL,
    "confidence" real,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."transcript_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usage_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."usage_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."candidate_assessments"
    ADD CONSTRAINT "candidate_assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "candidates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."competencies"
    ADD CONSTRAINT "competencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interview_invitations"
    ADD CONSTRAINT "interview_invitations_pkey" PRIMARY KEY ("token");



ALTER TABLE ONLY "public"."interview_sessions"
    ADD CONSTRAINT "interview_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."position_competencies"
    ADD CONSTRAINT "position_competencies_pkey" PRIMARY KEY ("position_id", "competency_id");



ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transcript_entries"
    ADD CONSTRAINT "transcript_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."usage_events"
    ADD CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_candidate_assessments_tenant_id" ON "public"."candidate_assessments" USING "btree" ("tenant_id");



CREATE INDEX "idx_candidates_tenant_id" ON "public"."candidates" USING "btree" ("tenant_id");



CREATE INDEX "idx_competencies_tenant_id" ON "public"."competencies" USING "btree" ("tenant_id");



CREATE INDEX "idx_interview_invitations_tenant_id" ON "public"."interview_invitations" USING "btree" ("tenant_id");



CREATE INDEX "idx_interview_sessions_tenant_id" ON "public"."interview_sessions" USING "btree" ("tenant_id");



CREATE INDEX "idx_position_competencies_tenant_id" ON "public"."position_competencies" USING "btree" ("tenant_id");



CREATE INDEX "idx_positions_tenant_id" ON "public"."positions" USING "btree" ("tenant_id");



CREATE INDEX "idx_transcript_entries_session_id" ON "public"."transcript_entries" USING "btree" ("session_id");



CREATE INDEX "idx_transcript_entries_tenant_id" ON "public"."transcript_entries" USING "btree" ("tenant_id");



CREATE INDEX "idx_usage_events_tenant_id" ON "public"."usage_events" USING "btree" ("tenant_id");



CREATE INDEX "idx_users_tenant_id" ON "public"."users" USING "btree" ("tenant_id");



CREATE OR REPLACE TRIGGER "check_position_competency_weights" BEFORE INSERT OR UPDATE ON "public"."position_competencies" FOR EACH ROW EXECUTE FUNCTION "public"."validate_position_competency_weights"();



ALTER TABLE ONLY "public"."candidate_assessments"
    ADD CONSTRAINT "candidate_assessments_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."candidate_assessments"
    ADD CONSTRAINT "candidate_assessments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."candidates"
    ADD CONSTRAINT "candidates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."competencies"
    ADD CONSTRAINT "competencies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_invitations"
    ADD CONSTRAINT "interview_invitations_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_invitations"
    ADD CONSTRAINT "interview_invitations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_invitations"
    ADD CONSTRAINT "interview_invitations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_sessions"
    ADD CONSTRAINT "interview_sessions_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_sessions"
    ADD CONSTRAINT "interview_sessions_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interview_sessions"
    ADD CONSTRAINT "interview_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_competencies"
    ADD CONSTRAINT "position_competencies_competency_id_fkey" FOREIGN KEY ("competency_id") REFERENCES "public"."competencies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_competencies"
    ADD CONSTRAINT "position_competencies_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."position_competencies"
    ADD CONSTRAINT "position_competencies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."positions"
    ADD CONSTRAINT "positions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transcript_entries"
    ADD CONSTRAINT "transcript_entries_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transcript_entries"
    ADD CONSTRAINT "transcript_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usage_events"
    ADD CONSTRAINT "usage_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated users to access candidates" ON "public"."candidates" TO "authenticated" USING (true);



CREATE POLICY "Users can view own data" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."candidate_assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."candidates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."competencies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_user_on_signup" ON "public"."users" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."interview_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interview_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."position_competencies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."positions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenant_isolation_candidate_assessments" ON "public"."candidate_assessments" USING (("tenant_id" = ("current_setting"('request.jwt.claim.tenant_id'::"text"))::"uuid"));



CREATE POLICY "tenant_isolation_competencies" ON "public"."competencies" USING (("tenant_id" = ("current_setting"('request.jwt.claim.tenant_id'::"text"))::"uuid"));



CREATE POLICY "tenant_isolation_interview_invitations" ON "public"."interview_invitations" USING (("tenant_id" = ("current_setting"('request.jwt.claim.tenant_id'::"text"))::"uuid"));



CREATE POLICY "tenant_isolation_interview_sessions" ON "public"."interview_sessions" USING (("tenant_id" = ("current_setting"('request.jwt.claim.tenant_id'::"text"))::"uuid"));



CREATE POLICY "tenant_isolation_position_competencies" ON "public"."position_competencies" USING (("tenant_id" = ("current_setting"('request.jwt.claim.tenant_id'::"text"))::"uuid"));



CREATE POLICY "tenant_isolation_positions" ON "public"."positions" USING (("tenant_id" = ("current_setting"('request.jwt.claim.tenant_id'::"text"))::"uuid"));



CREATE POLICY "tenant_isolation_tenants" ON "public"."tenants" USING (("id" = ("current_setting"('request.jwt.claim.tenant_id'::"text"))::"uuid"));



CREATE POLICY "tenant_isolation_transcript_entries" ON "public"."transcript_entries" USING (("tenant_id" = ("current_setting"('request.jwt.claim.tenant_id'::"text"))::"uuid"));



CREATE POLICY "tenant_isolation_usage_events" ON "public"."usage_events" USING (("tenant_id" = ("current_setting"('request.jwt.claim.tenant_id'::"text"))::"uuid"));



CREATE POLICY "tenant_isolation_users" ON "public"."users" USING ((("tenant_id" = (NULLIF("current_setting"('request.jwt.claim.tenant_id'::"text", true), ''::"text"))::"uuid") OR ("auth"."role"() = 'service_role'::"text") OR ("auth"."role"() = 'anon'::"text")));



CREATE POLICY "tenant_view_policy" ON "public"."tenants" FOR SELECT USING ((("id" = ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) OR ("auth"."role"() = 'service_role'::"text")));



ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transcript_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_insert_policy" ON "public"."users" FOR INSERT WITH CHECK (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_position_competency_weights"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_position_competency_weights"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_position_competency_weights"() TO "service_role";


















GRANT ALL ON TABLE "public"."candidate_assessments" TO "anon";
GRANT ALL ON TABLE "public"."candidate_assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."candidate_assessments" TO "service_role";



GRANT ALL ON TABLE "public"."candidates" TO "anon";
GRANT ALL ON TABLE "public"."candidates" TO "authenticated";
GRANT ALL ON TABLE "public"."candidates" TO "service_role";



GRANT ALL ON TABLE "public"."competencies" TO "anon";
GRANT ALL ON TABLE "public"."competencies" TO "authenticated";
GRANT ALL ON TABLE "public"."competencies" TO "service_role";



GRANT ALL ON TABLE "public"."interview_invitations" TO "anon";
GRANT ALL ON TABLE "public"."interview_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."interview_sessions" TO "anon";
GRANT ALL ON TABLE "public"."interview_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."interview_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."position_competencies" TO "anon";
GRANT ALL ON TABLE "public"."position_competencies" TO "authenticated";
GRANT ALL ON TABLE "public"."position_competencies" TO "service_role";



GRANT ALL ON TABLE "public"."positions" TO "anon";
GRANT ALL ON TABLE "public"."positions" TO "authenticated";
GRANT ALL ON TABLE "public"."positions" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."transcript_entries" TO "anon";
GRANT ALL ON TABLE "public"."transcript_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."transcript_entries" TO "service_role";



GRANT ALL ON TABLE "public"."usage_events" TO "anon";
GRANT ALL ON TABLE "public"."usage_events" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_events" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
