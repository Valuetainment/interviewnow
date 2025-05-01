# AI Interview Insights Platform - System Patterns

## System Architecture Overview

The AI Interview Insights Platform is built on a multi-tenant architecture using Supabase as the core infrastructure provider. The system follows a client-server model with a React frontend and Supabase-powered backend (PostgreSQL database, authentication, storage, edge functions, and realtime features).

### Architecture Diagram

```
┌─────────────────┐     ┌─────────────────────────────────────┐
│                 │     │              Supabase               │
│                 │     │                                     │
│    Frontend     │     │  ┌─────────┐       ┌────────────┐  │
│    (React,      │     │  │         │       │            │  │
│     Vite,       │◄────┼─►│ PostgREST◄───────► PostgreSQL │  │
│     Tailwind)   │     │  │         │       │            │  │
│                 │     │  └─────────┘       └────────────┘  │
│                 │     │                                     │
│                 │     │  ┌─────────┐       ┌────────────┐  │
│                 │     │  │         │       │            │  │
│                 │◄────┼─►│ Auth    │       │ Storage    │  │
│                 │     │  │         │       │            │  │
│                 │     │  └─────────┘       └────────────┘  │
│                 │     │                                     │
│                 │     │  ┌─────────┐       ┌────────────┐  │
│                 │     │  │         │       │            │  │
│                 │◄────┼─►│ Realtime│       │ Edge       │  │
│                 │     │  │         │       │ Functions  │  │
└─────────────────┘     │  └─────────┘       └────────────┘  │
                        │                                     │
                        └─────────────────────────────────────┘
                                        │
                                        ▼
                        ┌─────────────────────────────────────┐
                        │        External Services            │
                        │                                     │
                        │  ┌─────────┐       ┌────────────┐  │
                        │  │         │       │            │  │
                        │  │ OpenAI  │       │ PDF.co     │  │
                        │  │         │       │            │  │
                        │  └─────────┘       └────────────┘  │
                        │                                     │
                        │  ┌─────────┐       ┌────────────┐  │
                        │  │         │       │            │  │
                        │  │ PDL     │       │ VideoSDK   │  │
                        │  │         │       │            │  │
                        │  └─────────┘       └────────────┘  │
                        │                                     │
                        └─────────────────────────────────────┘
```

## Development and Deployment Workflow

The project follows a structured development and deployment workflow:

### CI/CD Pipeline

```
┌───────────────┐     ┌───────────────┐     ┌───────────────────────┐
│               │     │               │     │                       │
│    Local      │     │    GitHub     │     │ Supabase/Vercel       │
│  Development  │────►│  Repository   │────►│ Automated Deployment  │
│               │     │               │     │                       │
└───────────────┘     └───────────────┘     └───────────────────────┘
```

1. **Local Development**
   - Developers work with local Supabase instance
   - Environment variables in .env and supabase_secrets.env files
   - Edge functions served locally with --env-file flag

2. **GitHub Integration**
   - Code pushed to thelabvenice/triangularai repository
   - Branch-based development workflow
   - Pull requests for code review

3. **Supabase Integration**
   - Connected to GitHub repository
   - Database branching enabled for development
   - Migrations automatically applied from supabase directory
   - Edge functions automatically deployed

4. **Vercel Deployment**
   - Frontend deployed to Vercel
   - Environment variables synchronized with Supabase
   - Preview deployments for pull requests
   - Production deployment from main branch

## Data Flow Patterns

### Authentication Flow

```
┌──────────┐     ┌───────────────┐     ┌───────────────┐
│          │     │               │     │               │
│  Client  │────►│ Supabase Auth │────►│ JWT Creation  │
│          │     │               │     │               │
└──────────┘     └───────────────┘     └───────┬───────┘
                                              │
┌──────────┐     ┌───────────────┐     ┌──────▼───────┐
│          │     │               │     │               │
│Protected │◄────│  RLS Policies │◄────│ JWT with      │
│Resources │     │               │     │ tenant_id     │
│          │     │               │     │ claim         │
└──────────┘     └───────────────┘     └───────────────┘
```

### Resume Processing Flow

```
┌──────────┐     ┌───────────────┐     ┌───────────────┐
│          │     │               │     │               │
│  Upload  │────►│ Supabase      │────►│ process-resume│
│Component │     │ Storage       │     │ Edge Function │
│          │     │               │     │               │
└──────────┘     └───────────────┘     └───────┬───────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │              │
                                       │   PDF.co     │
                                       │              │
                                       └──────┬───────┘
                                              │
┌──────────┐     ┌───────────────┐     ┌──────▼───────┐
│          │     │               │     │               │
│ Candidate│◄────│ analyze-resume│◄────│ Extracted     │
│ Creation │     │ Edge Function │     │ Text          │
│          │     │               │     │               │
└──────────┘     └───────────────┘     └───────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │              │
                  │   OpenAI     │
                  │              │
                  └──────┬───────┘
                         │
┌──────────┐     ┌──────▼───────┐     ┌───────────────┐
│          │     │               │     │               │
│ Candidate│     │ enrich-       │────►│ People Data   │
│ Profile  │◄────│ candidate     │     │ Labs API      │
│          │     │ Edge Function │     │               │
└──────────┘     └───────────────┘     └───────────────┘
```

### Position Creation Flow

```
┌──────────┐     ┌───────────────┐     ┌───────────────┐
│          │     │               │     │               │
│  Position│────►│ generate-     │────►│ OpenAI API    │
│  Form    │     │ position      │     │               │
│          │     │ Edge Function │     │               │
└──────────┘     └───────┬───────┘     └───────┬───────┘
                         │                     │
                         ▼                     ▼
                  ┌──────────────┐     ┌──────────────┐
                  │              │     │              │
                  │  Position    │     │ Competency   │
                  │  Description │     │ Suggestions  │
                  │              │     │              │
                  └──────┬───────┘     └──────┬───────┘
                         │                    │
                         ▼                    ▼
                  ┌─────────────────────────────────┐
                  │                                 │
                  │      Database Storage           │
                  │                                 │
                  └─────────────────────────────────┘
```

### Interview Session Flow

```
┌──────────┐     ┌───────────────┐     ┌───────────────┐
│          │     │               │     │               │
│ Session  │────►│ Session       │────►│ Invitation    │
│ Creation │     │ Storage       │     │ Generation    │
│          │     │               │     │               │
└──────────┘     └───────────────┘     └───────────────┘
       │
       │
       ▼
┌──────────┐     ┌───────────────┐     ┌───────────────┐
│          │     │               │     │               │
│ Interview│     │ VideoSDK      │     │ transcript-   │
│ Room     │────►│ Integration   │────►│ processor     │
│          │     │               │     │ Edge Function │
└──────────┘     └───────────────┘     └───────┬───────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │              │
                                       │   OpenAI     │
                                       │              │
                                       └──────┬───────┘
                                              │
┌──────────┐     ┌───────────────┐     ┌──────▼───────┐
│          │     │               │     │               │
│Transcript│◄────│ Realtime      │◄────│ Processed     │
│Display   │     │ Subscription  │     │ Transcript    │
│          │     │               │     │               │
└──────────┘     └───────────────┘     └───────────────┘
```

## Authentication and Authorization

The system uses Supabase Auth combined with Row Level Security (RLS) policies to implement a secure multi-tenant model:

### Multi-tenant Isolation

```sql
CREATE POLICY "Tenants can only access their own data" ON table_name
    USING (tenant_id = auth.jwt() -> 'tenant_id');
```

### Role-Based Access

```sql
CREATE POLICY "Role-based access" ON table_name
    USING (auth.jwt() -> 'role' = 'admin');
```

### User Identity

```sql
CREATE POLICY "Users can access their own data" ON table_name
    USING (user_id = auth.uid());
```

## Database Schema Patterns

The database schema follows several key patterns:

### Multi-tenant Design

All major tables include a `tenant_id` column that links to the `tenants` table.

### Relationship Design

Foreign key relationships are used to maintain data integrity:

```sql
CREATE TABLE child_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES parent_table(id),
    tenant_id UUID REFERENCES tenants(id),
    ...
);
```

### Metadata Storage

JSON columns are used for flexible metadata storage:

```sql
CREATE TABLE table_name (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metadata JSONB DEFAULT '{}',
    ...
);
```

### Transaction History

Triggers are used to maintain transaction history:

```sql
CREATE TRIGGER track_changes
AFTER INSERT OR UPDATE OR DELETE ON table_name
FOR EACH ROW EXECUTE FUNCTION audit_trail();
```

## Error Handling Patterns

### Edge Function Error Handling

```typescript
try {
  // Function logic
  return new Response(
    JSON.stringify({ status: 'ok', data: result }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
} catch (error) {
  return new Response(
    JSON.stringify({ error: error.message || "Unknown error" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

### Frontend Error Handling

```typescript
const fetchData = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase.from('table').select('*');
    if (error) throw error;
    setData(data);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

## Frontend Component Patterns

### Layout Components

```tsx
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
};
```

### Data Fetching with Hooks

```tsx
const useFetchData = (table: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data, error } = await supabase.from(table).select('*');
        if (error) throw error;
        setData(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [table]);
  
  return { data, loading, error };
};
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