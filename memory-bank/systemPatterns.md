# AI Interview Insights Platform - System Patterns

## Triangular Architecture
The system follows a triangular architecture with three key layers:

```
Client (Next.js + shadcn/ui)
  ├─ WebRTC (mediasoup)          • video / audio
  └─ Supabase Realtime WS        • transcript deltas / presence

Supabase Project (Orchestration Layer)
  • Postgres + pgvector   – RLS tenant isolation
  • Storage buckets       – /resumes /videos /audio
  • Auth (JWT, OIDC/SAML)
  • Edge Functions (Deno)
      · rtc-proxy            · transcript-processor
      · session-manager      · assessment-generator
      · process-resume       · enrich-candidate
      · video-analyzer       · record-usage
      · generate-position    · analyze-interview
  • Realtime channels
      interview:<session_id>  |  audit:<tenant_id>

External Services
  • OpenAI / Anthropic realtime STT & LLM
  • VideoSDK.live cloud recorder
  • PDF.co, People Data Labs
```

## Core Architectural Patterns

### 1. Multi-Tenant Data Isolation
- Every table includes a `tenant_id` column
- Row-Level Security (RLS) policies enforce tenant isolation
- JWT claims contain `tenant_id` for authentication context
- Storage buckets use tenant-prefixed paths

Example RLS policy:
```sql
alter table <table_name> enable row level security;
create policy tenant_iso_<table_name> on <table_name>
  using (tenant_id = current_setting('request.jwt.claim.tenant_id')::uuid);
```

### 2. Event-Driven Communication
- Supabase Realtime channels for pub/sub patterns
- Channel naming convention: `<entity>:<id>` (e.g., `interview:123`)
- Presence for tracking active users in sessions
- Transcript deltas delivered via Realtime for sub-200ms latency

### 3. Serverless Edge Functions
- Deno-based Edge Functions for all server-side logic
- Function boundaries align with domain workflows
- Each function authenticates via JWT and respects tenant isolation
- Functions communicate with external services when needed

### 4. Structured Assessment Methodology
- Position-defined competencies with weights (sum = 100%)
- AI assessment generator analyzes transcript against competencies
- Behavioral metrics incorporated into final assessment
- Weighted scoring calculations done server-side for consistency

### 5. Environment and Testing Infrastructure
- Standardized environment configuration through structured scripts
- API connectivity verification prior to feature usage
- Comprehensive testing documentation with step-by-step guides
- Automated checks for critical dependencies

## Data Flow Patterns

### 1. Resume Processing Flow
```
Upload → Storage → process-resume → analyze-resume → Candidate DB Entry
```

The resume processing flow is now fully implemented:

- **Frontend Components**:
  - `ResumeUploader`: Handles file selection, validation, and upload
  - `Candidate` page: Displays processed candidate information with skills tags and summary

- **Storage Pattern**:
  - Files stored in `resumes` bucket with tenant isolation
  - File naming: `${tenantId}/${timestamp}_${filename}`
  - Public URLs generated for downstream processing

- **Edge Functions**:
  - `process-resume`: Extracts text from PDF using PDF.co API
    - Takes a PDF URL as input
    - Returns extracted text as output
    - Handles CORS and auth validation
    - Validates environment variables and inputs
  
  - `analyze-resume`: Analyzes resume text using OpenAI
    - Takes extracted text as input
    - Uses GPT-4o-mini to structure the resume data
    - Returns JSON with personal info, skills, experience, education
    - Implements error handling and response formatting

- **Database Integration**:
  - Candidates stored in `candidates` table
  - Resume URL stored in `resume_url` field
  - Structured data stored in `resume_analysis` JSONB field
  - Tenant isolation enforced via RLS policies

- **Error Handling**:
  - Client-side validation for file type (PDF only) and size (< 10MB)
  - Progress indicators for upload and processing steps
  - Comprehensive error handling with user feedback
  - Fallback mechanisms for API failures

### 2. Position Creation Flow
```
Form Input → OpenAI Generation → Competency Suggestion → DB Persistence
```

The position creation flow is now implemented:

- **Frontend Components**:
  - `CreatePosition` page: Form for creating positions with AI assistance
  - `CompetencyWeights`: Interactive UI for managing competency weights
  - `CompetencySelector`: Component for selecting and adding competencies

- **Form Validation**:
  - Zod schema for client-side validation
  - Form validation using React Hook Form
  - Interactive feedback for validation errors

- **Edge Functions**:
  - `generate-position`: Creates job descriptions and suggests competencies
    - Takes title and short description as input
    - Uses OpenAI GPT-4o-mini to generate structured content
    - Returns markdown job description and suggested competencies with weights
    - Implements proper error handling and response formatting

- **Database Schema**:
  - `positions`: Stores position details with tenant isolation
  - `competencies`: Reusable competency definitions
  - `position_competencies`: Join table with weight values
  - Validation trigger to ensure weights sum to 100%

- **UI Components**:
  - Two-panel layout for input and preview
  - Interactive weight distribution with pie chart visualization
  - Real-time validation for weight distribution
  - Toast notifications for operation status

### 3. Interview Session Flow
```
Create Session → Generate Invitation → Candidate Joins → 
RTC Connection → Live Transcription → Assessment Generation
```

The interview session flow is now implemented:

- **Frontend Components**:
  - `Sessions` page: Displays sessions with tabs for different statuses
  - `SessionList`: Component for viewing and managing sessions
  - `CreateSession`: Form for setting up new interview sessions
  - `InterviewRoom`: Full-screen interface for conducting interviews
  - `InterviewInvitation`: Component for managing candidate invitations

- **Form Validation**:
  - Zod schema for session creation validation
  - Required fields for candidate, position, and scheduling
  - Date and time validation for scheduling

- **Database Schema**:
  - `interview_sessions`: Stores session details with references to candidates and positions
  - `interview_invitations`: Manages invitation tokens and statuses
  - `transcript_entries`: Stores real-time transcript segments

- **UI Components**:
  - Filtering and search for session management
  - Video/audio controls for interview room
  - Real-time transcript panel
  - Recording and pause/resume functionality
  - Session status tracking (scheduled, in_progress, completed, cancelled)

- **Edge Functions**:
  - `transcript-processor`: Processes audio chunks for real-time transcription
    - Takes base64-encoded audio as input
    - Uses OpenAI Whisper API for speech-to-text
    - Returns structured transcript entries
    - Broadcasts updates via Realtime channels

- **WebRTC Integration**:
  - Local video preview with mirroring
  - Audio level visualization
  - Media device permission handling
  - Connection state management

- **Real-time Updates**:
  - Transcript entries delivered via Realtime channels
  - Session status updates for all participants
  - Presence for tracking active users

### 4. Assessment Generation Flow
```
Session End → Fetch Transcript → Retrieve Position Competencies → 
AI Assessment → Weighted Calculation → Store Results → Realtime Notification
```

## Component Relationships

### Frontend Components
- **Layout Components**: Page shells, navigation, tenant context providers
- **Feature Components**: Interview room, resume upload, assessment viewer
- **UI Components**: From shadcn/ui, customized for the application's design

### Backend Services
- **Edge Functions**: Serverless compute for business logic
- **Supabase Core**: Database, auth, storage, and realtime services
- **External Integrations**: AI/ML services, PDF processing, video handling

### Testing and Environment Infrastructure
- **Environment Setup**: Scripts for configuring required variables
- **Verification Tools**: API connectivity testing and validation
- **Documentation**: Comprehensive guides for testing and troubleshooting
- **API Testing**: Direct validation of Edge Function behavior

### Cross-Cutting Concerns
- **Authentication**: JWT-based with tenant context
- **Authorization**: RLS for data access, role-based UI permissions
- **Audit Logging**: All sensitive operations logged to audit table
- **Error Handling**: Structured error responses, monitoring via Logflare 