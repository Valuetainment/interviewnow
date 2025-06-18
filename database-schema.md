# InterviewNow Database Schema

## Overview
The InterviewNow application uses PostgreSQL with Supabase. The schema follows a multi-tenant architecture where all data is isolated by `tenant_id`.

## Core Tables

### tenants
- **id**: uuid (PK)
- **name**: text
- **plan_tier**: text (default: 'free')
- **tenancy_type**: text (default: 'enterprise', options: 'enterprise', 'self-service')
- **created_at**: timestamp
- **updated_at**: timestamp

### users
Links Supabase Auth users to tenants with roles.

**Columns:**
- `id` (uuid, PK): References auth.users
- `tenant_id` (uuid, FK → tenants): User's organization
- `role` (text): User role (options: 'system_admin', 'tenant_admin', 'tenant_interviewer', 'tenant_candidate', 'user')
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Triggers:**
- `on_auth_user_created`: Automatically creates public.users entry when auth.users are created
- `update_users_updated_at`: Updates timestamp on row changes

**Notes:**
- Every auth.users entry must have a corresponding public.users entry
- System Admin: Can access all tenants and system-wide features
- Tenant Admin: Full access within their tenant
- Tenant Interviewer: Limited access based on company assignments
- Tenant Candidate: Currently not allowed to login

### company_codes
For tenant invitation system.

- **id**: uuid (PK)
- **code**: text (unique)
- **tenant_id**: uuid (FK to tenants)
- **created_at**: timestamp
- **expires_at**: timestamp (default: 30 days from creation)
- **used_at**: timestamp
- **used_by**: uuid (FK to auth.users)

### tenant_invitations
Tracks tenant invitations sent by system admins.

- **id**: uuid (PK)
- **email**: text
- **tenant_name**: text
- **company_code**: text (unique)
- **tenancy_type**: text (default: 'enterprise')
- **invited_by**: uuid (FK to auth.users)
- **created_at**: timestamp
- **expires_at**: timestamp (default: 7 days from creation)
- **accepted_at**: timestamp
- **tenant_id**: uuid (FK to tenants)

### interviewer_company_access
Controls which companies interviewers can access.

- **id**: uuid (PK)
- **user_id**: uuid (FK to users)
- **company_id**: uuid (FK to companies)
- **tenant_id**: uuid (FK to tenants)
- **granted_by**: uuid (FK to users)
- **created_at**: timestamp
- **Unique constraint**: (user_id, company_id)

### billing_information
Stores billing details for each tenant.

- **id**: uuid (PK)
- **tenant_id**: uuid (unique, FK to tenants)
- **stripe_customer_id**: text
- **payment_method_id**: text
- **card_last4**: text
- **card_brand**: text
- **card_exp_month**: integer
- **card_exp_year**: integer
- **billing_email**: text
- **billing_address**: jsonb
- **created_at**: timestamp
- **updated_at**: timestamp

### invoices
Tracks all invoices for tenants.

- **id**: uuid (PK)
- **tenant_id**: uuid (FK to tenants)
- **invoice_number**: text (unique)
- **stripe_invoice_id**: text
- **amount_due**: integer (in cents)
- **amount_paid**: integer (default: 0, in cents)
- **currency**: text (default: 'usd')
- **status**: text (options: 'draft', 'open', 'paid', 'void', 'uncollectible')
- **due_date**: date
- **paid_at**: timestamp
- **invoice_pdf_url**: text
- **line_items**: jsonb
- **created_at**: timestamp
- **updated_at**: timestamp

### payment_history
Records all payment transactions.

- **id**: uuid (PK)
- **tenant_id**: uuid (FK to tenants)
- **invoice_id**: uuid (FK to invoices)
- **stripe_payment_intent_id**: text
- **amount**: integer (in cents)
- **currency**: text (default: 'usd')
- **status**: text (options: 'succeeded', 'failed', 'pending', 'refunded')
- **payment_method**: text
- **failure_reason**: text
- **created_at**: timestamp

### companies
- **id**: uuid (PK)
- **tenant_id**: uuid (FK to tenants)
- **name**: text
- **culture**: text
- **story**: text
- **benefits_data**: jsonb (structured as {description: string, items: string[]})
- **values_data**: jsonb (structured as {description: string, items: string[]})
- **created_at**: timestamp
- **updated_at**: timestamp

### positions
- **id**: uuid (PK)
- **tenant_id**: uuid (FK to tenants)
- **company_id**: uuid (FK to companies)
- **title**: text
- **description**: text
- **role_overview**: text
- **key_responsibilities**: text
- **required_qualifications**: text
- **preferred_qualifications**: text
- **key_competencies_section**: text
- **experience_level**: text
- **department**: text
- **location**: text
- **employment_type**: text (Full-Time, Part-Time, Contract, or Internship)
- **salary_range**: text
- **application_deadline**: date
- **reference_number**: text
- **travel_requirements**: text
- **work_authorization**: text
- **created_at**: timestamp
- **updated_at**: timestamp

Note: Benefits are now stored at the company level in `companies.benefits_data`

### candidates
- **id**: uuid (PK)
- **tenant_id**: uuid (FK to tenants)
- **company_id**: uuid (FK to companies, required, CASCADE DELETE)
- **email**: text (unique per tenant)
- **phone**: text
- **first_name**: text (required)
- **last_name**: text (required)
- **auth_email**: text
- **auth_id**: uuid (FK to auth.users)
- **skills**: text[]
- **experience**: jsonb
- **education**: text
- **resume_text**: text
- **resume_analysis**: jsonb
- **resume_url**: text
- **linkedin_url**: text
- **current_title**: text
- **current_company**: text
- **created_at**: timestamp
- **updated_at**: timestamp

### candidate_profiles
- **id**: uuid (PK)
- **tenant_id**: uuid (FK to tenants)
- **candidate_id**: uuid (FK to candidates)
- **pdl_id**: text
- **pdl_likelihood**: integer
- **last_enriched_at**: timestamp
- **first_name**: text
- **last_name**: text
- **middle_name**: text
- **birth_year**: integer
- **gender**: text
- **location_name**: text
- **location_locality**: text
- **location_region**: text
- **location_country**: text
- **location_continent**: text
- **location_street_address**: text
- **location_postal_code**: text
- **location_geo**: text
- **linkedin_id**: text
- **linkedin_url**: text
- **linkedin_username**: text
- **facebook_url**: text
- **facebook_username**: text
- **twitter_url**: text
- **twitter_username**: text
- **github_url**: text
- **github_username**: text
- **job_title**: text
- **job_company_name**: text
- **job_company_industry**: text
- **job_company_size**: text
- **job_start_date**: text
- **job_last_updated**: text
- **job_title_levels**: text[]
- **industry**: text
- **interests**: text[]
- **skills**: text[]
- **countries**: text[]
- **experience**: jsonb
- **education**: jsonb
- **created_at**: timestamp
- **updated_at**: timestamp

### candidate_tenants
- **candidate_id**: uuid (FK to candidates)
- **tenant_id**: uuid (FK to tenants)
- **status**: text (default: 'active')
- **relationship_type**: text (default: 'candidate')
- **invitation_date**: timestamp
- **last_interaction**: timestamp
- **created_at**: timestamp
- **updated_at**: timestamp
- **Primary Key**: (candidate_id, tenant_id)

### competencies
- **id**: uuid (PK)
- **tenant_id**: uuid (FK to tenants)
- **name**: text (unique per tenant)
- **description**: text
- **created_at**: timestamp
- **updated_at**: timestamp

### position_competencies
- **position_id**: uuid (FK to positions)
- **competency_id**: uuid (FK to competencies)
- **tenant_id**: uuid (FK to tenants)
- **weight**: integer (0-100)
- **created_at**: timestamp
- **updated_at**: timestamp
- **Primary Key**: (position_id, competency_id)

### interview_sessions
- **id**: uuid (PK)
- **tenant_id**: uuid (FK to tenants)
- **position_id**: uuid (FK to positions)
- **candidate_id**: uuid (FK to candidates)
- **company_id**: uuid (FK to companies)
- **title**: text
- **description**: text
- **scheduled_time**: timestamp
- **start_time**: timestamp
- **end_time**: timestamp
- **status**: text (scheduled, in_progress, completed, cancelled)
- **video_url**: text
- **webrtc_status**: text (default: 'pending')
- **webrtc_server_url**: text
- **webrtc_session_id**: text
- **webrtc_architecture**: text
- **webrtc_connection_time**: timestamp
- **webrtc_operation_id**: text
- **ice_candidates**: jsonb
- **sdp_offers**: jsonb
- **sdp_answers**: jsonb
- **ai_persona**: text (default: 'default')
- **openai_configuration**: jsonb (default: '{}')
- **avatar_enabled**: boolean (default: false)
- **avatar_session_id**: varchar(255)
- **avatar_provider**: varchar(50) (default: 'akool')
- **created_at**: timestamp
- **updated_at**: timestamp

### transcript_entries
- **id**: uuid (PK)
- **tenant_id**: uuid (FK to tenants)
- **session_id**: uuid (FK to interview_sessions)
- **speaker**: text
- **text**: text
- **timestamp**: timestamp
- **start_ms**: integer
- **actual_start_ms**: integer
- **duration_ms**: integer
- **confidence**: float (0-1)
- **source_architecture**: text
- **created_at**: timestamp

### video_segments
- **id**: uuid (PK)
- **session_id**: uuid (FK to interview_sessions)
- **segment_url**: text
- **start_ms**: integer
- **end_ms**: integer
- **created_at**: timestamp

### interview_invitations
- **token**: text (PK)
- **tenant_id**: uuid (FK to tenants)
- **session_id**: uuid (FK to interview_sessions)
- **candidate_id**: uuid (FK to candidates)
- **expires_at**: timestamp
- **status**: text (pending, sent, accepted, expired)
- **created_at**: timestamp
- **updated_at**: timestamp

### candidate_assessments
- **id**: uuid (PK)
- **tenant_id**: uuid (FK to tenants)
- **session_id**: uuid (FK to interview_sessions)
- **candidate_id**: uuid (FK to candidates)
- **overall_score**: numeric
- **competency_scores**: jsonb
- **summary**: text
- **transcript_analysis**: jsonb
- **created_at**: timestamp

### notifications
- **id**: uuid (PK)
- **user_id**: uuid (FK to auth.users)
- **tenant_id**: uuid (FK to tenants)
- **interview_session_id**: uuid (FK to interview_sessions)
- **type**: text (interview_completed, interview_scheduled, interview_cancelled, assessment_ready)
- **title**: text
- **message**: text
- **is_read**: boolean (default: false)
- **created_at**: timestamp
- **updated_at**: timestamp

### tenant_preferences
- **id**: uuid (PK)
- **tenant_id**: uuid (FK to tenants)
- **avatar_enabled_default**: boolean
- **avatar_provider**: varchar(50)
- **default_avatar_id**: varchar(100)
- **avatar_monthly_limit**: integer
- **avatar_usage_count**: integer
- **created_at**: timestamp
- **updated_at**: timestamp

### usage_events
- **id**: uuid (PK)
- **tenant_id**: uuid (FK to tenants)
- **event_type**: text
- **quantity**: integer (must be > 0)
- **created_at**: timestamp

## Relationships

1. **Multi-tenancy**: All tables (except auth.users) have a `tenant_id` that ensures data isolation
2. **User Management**: `users` table extends Supabase's auth.users with tenant and role information
3. **Company Structure**: Companies can have multiple positions
4. **Interview Flow**: 
   - Positions are linked to companies
   - Candidates apply/interview for positions
   - Interview sessions connect candidates and positions
   - Transcripts and videos are linked to sessions
5. **Assessments**: Candidate assessments are linked to both the candidate and the interview session
6. **Notifications**: Users receive notifications for interview events
7. **Competencies**: Positions can have weighted competencies for evaluation
8. **Candidate Relationships**: candidate_tenants manages many-to-many relationships between candidates and tenants
9. **Access Control**: 
   - System Admins have full system access
   - Tenant Admins have full access within their tenant
   - Tenant Interviewers have access controlled by interviewer_company_access
   - Tenant Candidates currently cannot login
10. **Billing**: Each tenant has billing information, invoices, and payment history

## Row Level Security (RLS)
All tables have RLS policies that ensure:
- System Admins can access all data across all tenants
- Tenant Admins can access all data within their tenant
- Tenant Interviewers can only access data for companies they're assigned to
- Proper isolation between tenants
- Candidates can access their own interview data (when login is enabled)

## Helper Functions
- `is_system_admin()`: Returns true if the current user is a system admin

## Indexes
Key indexes are created on:
- tenant_id (all tables)
- Foreign key relationships
- status fields for filtering
- created_at for sorting
- email fields for lookups
- expires_at for cleanup operations 