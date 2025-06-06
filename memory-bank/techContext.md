# AI Interview Insights Platform - Technical Context

## Tech Stack Overview

The AI Interview Insights Platform is built using the following technology stack:

### Frontend
- **React**: UI library for building component-based interfaces
- **TypeScript**: Static typing for improved developer experience and code quality
- **Vite**: Next-generation frontend build tool for faster development
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Shadcn/UI**: Reusable UI component library based on Tailwind and Radix UI
- **Zustand**: State management library
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation library
- **React Router**: Client-side routing

### Backend (Supabase)
- **PostgreSQL**: Database for structured data storage
- **Supabase Auth**: Authentication and authorization service
- **Supabase Storage**: File storage and management
- **Supabase Edge Functions**: Serverless compute for custom logic
- **Row Level Security (RLS)**: Database-level security policies
- **PostgREST**: RESTful API for PostgreSQL
- **Realtime**: Real-time data subscriptions

### AI Services
- **OpenAI GPT-4o-mini**: For AI-powered analysis and insights
- **PDF.co**: For PDF text extraction
- **People Data Labs (PDL)**: For candidate enrichment and verification
- **Fly.io**: For isolated interview processing (selected after evaluation)

### Real-time Communication
- **WebRTC**: For direct browser-to-OpenAI audio streaming
- **WebSockets**: For real-time signaling and data exchange
- **SDP Proxy**: For secure WebRTC connection establishment
- **ICE Framework**: For NAT traversal and connection establishment

### Avatar Integration (Attempted and Removed)
- **AKOOL Avatar API**: Attempted integration for visual avatars (January 2025)
- **Agora SDK**: Used for avatar video streaming
- **Decision**: Backed out due to shared avatar availability limitations
- **Future**: May revisit when dedicated avatars become available

### Testing & Development
- **Vitest**: Unit testing framework
- **Playwright**: End-to-end testing
- **Supabase CLI**: Local development and migrations
- **GitHub Actions**: CI/CD automation

## Infrastructure Architecture

### Local Development
- Local Supabase instance running in Docker
- Environment variables in .env file
- Edge Functions executed locally with supabase_secrets.env
- Fly.io components run locally for testing

### CI/CD Pipeline
- GitHub repository at thelabvenice/triangularai
- Automatic Supabase deployments via GitHub integration
- Vercel for frontend hosting and preview deployments

### Production Environment
- Supabase hosted instance for database, auth, storage, and functions
- Vercel for production frontend hosting
- Fly.io for isolated interview processing workloads
- WebRTC SDP proxy deployed on Fly.io for secure signaling

## Supabase Configuration

### Database Schema
The database uses a multi-tenant design with tables including:

- users: User accounts and authentication
- tenants: Organization-level isolation
- companies: Company information
- candidates: Candidate core information
- candidate_profiles: Enriched candidate data from PDL
- candidate_tenants: Junction table for multi-tenant candidate relationships
- positions: Job positions with competencies
- competencies: Weighted skills for positions
- interview_sessions: Interview metadata and configuration
- transcripts: Interview transcripts and analysis

### Authentication
- Email-based authentication with password
- JWT tokens with custom claims for tenant_id
- Row Level Security (RLS) policies for data isolation
- Automatic tenant association for new users
- Multi-tenant candidate authentication flow

### Storage
- resumes: For PDF resume files
- videos: For interview recordings
- audio: For interview audio

### Edge Functions
- process-resume: PDF.co integration for text extraction
- analyze-resume: OpenAI integration for resume analysis
- enrich-candidate: PDL integration for candidate enrichment
- generate-position: OpenAI integration for job descriptions
- transcript-processor: OpenAI integration for transcript processing
- check-env: Utility for verifying environment configuration

## External API Integrations

### OpenAI
- API: https://api.openai.com/v1
- Models: GPT-4o-mini for resume analysis and transcript processing
- Authentication: API key in environment variables
- Used for: Resume analysis, position descriptions, transcript processing
- WebRTC Realtime API: Direct audio streaming for real-time transcription
  - API: https://sessions.openai.com/v1/realtime
  - Headers: Requires "OpenAI-Beta: realtime=v1"
  - Authentication: Direct API key (not JWT-based)
  - Used for: Real-time WebRTC connections for audio transcription

### PDF.co
- API: https://api.pdf.co/v1
- Authentication: API key in environment variables
- Used for: Extracting text from uploaded PDF resumes

### People Data Labs (PDL)
- API: https://api.peopledatalabs.com/v5
- Authentication: API key in environment variables
- Used for: Enriching candidate data with professional information

### Fly.io
- Selected platform for interview processing infrastructure
- Used for: Isolated interview transcription, WebRTC signaling, SDP proxy
- Evaluated against E2B and selected for better multi-tenant isolation
- Provides secure credential management without client exposure

## WebRTC SDP Proxy Architecture

The WebRTC SDP proxy is a critical security and connectivity component that enables direct browser-to-OpenAI audio streaming without exposing API keys:

### Components
- **Node.js/Express Server**: Base server for HTTP and WebSocket communication
- **WebSocket Server**: Handles real-time signaling for WebRTC establishment
- **SDP Exchange Mechanism**: Transforms client SDP offers into compatible answers
- **Session Management**: Tracks active connections with unique session IDs
- **ICE Candidate Handling**: Manages ICE candidates for NAT traversal

### Security Features
- **API Key Protection**: Keys remain on the server, never exposed to clients
- **Secure Signaling**: WebSocket with proper CORS and security headers
- **Session Isolation**: Each interview session gets a unique ID and state
- **Connection Cleanup**: Proper resource release after session completion

### Technical Implementation
- **Line-by-line SDP Processing**: Maintains exact media line order and format compatibility
- **SDP Answer Generation**: Creates compatible answers with proper attribute matching
- **ICE Credential Handling**: Generates unique ICE credentials for each connection
- **Session State Management**: Tracks offer/answer exchange and candidate collection
- **Error Handling**: Robust error handling for connection failures and format issues

### Connection Flow
1. Client connects to proxy via WebSocket
2. Proxy assigns unique session ID
3. Client sends SDP offer over WebSocket
4. Proxy processes offer and generates compatible answer
5. Client and server exchange ICE candidates
6. Direct WebRTC connection established between client and OpenAI
7. Audio streaming and transcription happens directly with OpenAI
8. Proxy maintains session state and handles cleanup

## Hooks-Based WebRTC Architecture

The WebRTC implementation has been refactored using a hooks-based architecture that eliminates circular dependencies and creates a more maintainable, modular system for WebRTC functionality:

### Core Hooks
- **useConnectionState**: Manages connection state transitions and provides consistent state reporting across the system
- **useRetry**: Implements retry logic with exponential backoff for handling connection failures gracefully
- **useAudioVisualization**: Manages audio capture and provides real-time visualization of audio levels

### Connection Hooks
- **useWebRTCConnection**: Handles WebRTC peer connection establishment, ICE negotiation, and media track management
- **useWebSocketConnection**: Manages WebSocket connections to the SDP proxy with automatic reconnection
- **useOpenAIConnection**: Specialized hook for direct OpenAI WebRTC connections with AI-specific configuration
- **useSDPProxy**: Specialized hook for the SDP proxy architecture that handles signaling and transcript management
- **useTranscriptManager**: Manages the accumulation, processing, and storage of transcript data

### Orchestration Hook
- **useWebRTC**: Main entry point that orchestrates all specialized hooks based on configuration settings

### Advantages of Hooks Architecture
1. **Separation of Concerns**: Each hook has a specific, focused responsibility
2. **Improved Testability**: Individual hooks can be tested in isolation with specialized mocks
3. **Code Reusability**: Hooks can be combined in different ways for various use cases
4. **Reduced Complexity**: Simpler components with clearer boundaries and interfaces
5. **Maintainable Codebase**: Easier to extend and modify specific aspects without affecting others
6. **Better Error Handling**: More granular error tracking and recovery at each level
7. **Resource Management**: Proper cleanup of resources with useEffect dependency arrays

### Integration into WebRTCManager
The WebRTCManager component has been updated to use this hooks-based architecture, resulting in:
1. Simplified component code with functionality delegated to hooks
2. Support for multiple connection modes (simulation, SDP proxy, direct OpenAI)
3. Improved error handling and recovery
4. Better visual feedback for connection state
5. Comprehensive test pages for development and validation

### Testing Infrastructure
Comprehensive testing has been implemented for all hooks:
1. Unit tests with Vitest and React Testing Library
2. Mocks for WebRTC and WebSocket APIs
3. Tests for connection establishment, error handling, message processing, and state transitions
4. Interactive test pages with debug information panels and state visualization

## Environment Configuration

### Development
```
VITE_SUPABASE_URL="http://localhost:54321"
VITE_SUPABASE_ANON_KEY="your-local-anon-key"
VITE_IS_DEVELOPMENT="true"
```

### Edge Function Secrets (supabase_secrets.env)
```
OPENAI_API_KEY="your-openai-key"
PDFCO_API_KEY="your-pdfco-key"
PDL_API_KEY="your-pdl-key"
```

### Fly.io SDP Proxy (env.example)
```
PORT=3000
OPENAI_API_KEY="your-openai-key"
ICE_SERVER_URLS=stun:stun.l.google.com:19302
LOG_LEVEL=info
```

### Production
```
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-production-anon-key"
```

## Development Workflow

### Local Setup
1. Clone the repository
2. Install dependencies with `npm install`
3. Start Supabase with `npx supabase start`
4. Set up environment variables
5. Run the dev server with `npm run dev`

### Database Migrations
1. Make changes to local database
2. Generate migration with `npx supabase db diff -f migration_name`
3. Apply migrations to local database with `npx supabase db push`
4. Commit migrations to git
5. Migrations are automatically applied in CI/CD pipeline

### Branching Workflow
1. Create a feature branch: `git checkout -b feat/feature-name`
2. Make changes to code and database
3. Commit and push: `git push -u origin feat/feature-name`
4. Open a pull request on GitHub
5. Supabase automatically creates a database branch
6. Vercel automatically creates a preview deployment with appropriate env variables
7. Test changes in the isolated environment
8. Merge to main when ready
9. Migrations are automatically applied to production
10. For detailed information, see `docs/development/supabase-branching-guide.md`

### Edge Functions
1. Create function in supabase/functions directory
2. Test locally with `npx supabase functions serve --env-file ./supabase_secrets.env`
3. Deploy with `npx supabase functions deploy function-name`
4. Set production secrets with `npx supabase secrets set KEY=VALUE`

### Fly.io Components
1. Create isolated components in separate directories
2. Use `fly launch` to create a new app
3. Configure secrets with `fly secrets set KEY=value`
4. Deploy with `fly deploy`
5. Test with provided test utilities

### Deployment
1. Push changes to GitHub repository
2. Supabase automatically applies migrations and deploys functions
3. Vercel deploys the frontend automatically
4. Fly.io components deployed separately with `fly deploy`

## Technical Constraints

### Supabase Limitations
- Edge Functions limited to 2 seconds execution time (production)
- Storage limited by plan tier
- RLS policies required for all tables
- JWT size limitations for claims

### WebRTC Constraints
- SDP format compatibility must be exact for connections to work
- Media line order in SDP answers must match exactly with offers
- ICE candidates must be exchanged for NAT traversal
- Connection reliability varies with network conditions

### Security Considerations
- RLS policies must be carefully designed for proper isolation
- Edge Functions need to handle authentication carefully
- Sensitive API keys must be stored as secrets
- Public access needed for certain files (resumes for PDF.co)
- WebRTC connections require secure signaling

### Performance Considerations
- OpenAI API calls can add latency
- PDF processing can be time-consuming
- Edge Function cold starts impact performance
- Interview processing requires specialized infrastructure (Fly.io)
- WebRTC connection establishment takes time

## Fly.io Infrastructure (Selected for Interview Processing)

After evaluating E2B and Fly.io, we selected Fly.io as our platform for interview processing due to:

1. **Superior Multi-tenant Isolation**
   - Hierarchical Apps → Machines structure maps perfectly to our tenant → interview model
   - Each interview can be isolated in its own VM for security and resource management
   - Strong boundary guarantees between different tenants' interview sessions

2. **Performance Characteristics**
   - Burstable CPU capabilities ideal for interview transcription workloads
   - CPU can scale up during active transcription and scale down during idle periods
   - Better cost efficiency for the intermittent nature of interview processing

3. **Production Readiness**
   - Mature platform with proven reliability for production workloads
   - Well-documented API and deployment options
   - Established pricing model with predictable costs

4. **Strategic Alignment**
   - General-purpose compute platform better aligned with our interview processing needs
   - Not limited to AI agent use cases like E2B
   - More flexible for our varied interview processing requirements

### Hybrid Architecture with WebRTC

Our current architecture combines Fly.io's secure infrastructure with OpenAI's upcoming WebRTC capabilities:

```
┌─────────────────────┐
│                     │
│  Frontend (Vercel)  │
│                     │
└─────────┬───────────┘
          │
          ▼
┌──────────────────────┐      ┌────────────────────────┐      ┌────────────────────┐
│                      │      │                        │      │                    │
│  Supabase            │◄────►│  Fly.io                │◄────►│  OpenAI WebRTC API │
│  (Auth, Database,    │      │  (SDP Proxy, Session   │      │  (Audio Processing │
│   Storage)           │      │   Management)          │      │   & Transcription) │
│                      │      │                        │      │                    │
└──────────────────────┘      └──────────┬─────────────┘      └────────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────────┐
                              │  Tenant 1               │
                              │  ┌───────────────────┐  │
                              │  │  Interview A VM   │  │
                              │  └───────────────────┘  │
                              │  ┌───────────────────┐  │
                              │  │  Interview B VM   │  │
                              │  └───────────────────┘  │
                              └─────────────────────────┘
                              ┌─────────────────────────┐
                              │  Tenant 2               │
                              │  ┌───────────────────┐  │
                              │  │  Interview C VM   │  │
                              │  └───────────────────┘  │
                              │  ┌───────────────────┐  │
                              │  │  Interview D VM   │  │
                              │  └───────────────────┘  │
                              └─────────────────────────┘
```

### Connection Flow

1. Client initiates WebRTC connection via Fly.io SDP proxy
2. Proxy handles secure signaling without exposing API keys
3. WebRTC direct connection established between client and OpenAI
4. Audio streams directly to OpenAI for transcription
5. Transcription results flow back through WebRTC data channel
6. Persistent transcript data stored in Supabase

## Tools and Libraries

### Frontend Development
- VS Code with TypeScript and ESLint plugins
- Chrome DevTools for debugging
- React Developer Tools extension
- Tailwind CSS IntelliSense extension
- WebRTC debugging tools

### Backend Development
- Supabase CLI for local development
- psql for direct database access
- curl and Postman for API testing
- TablePlus for database visualization
- WebSocket testing tools

### Deployment
- GitHub for version control
- GitHub Actions for CI/CD
- Vercel for frontend hosting
- Supabase Dashboard for backend management
- Fly.io CLI for interview processing deployment

## Technical Documentation

Documentation is maintained in the following locations:

- README.md: Project overview and setup instructions
- docs/: Detailed documentation by topic
- src/components/: Component-specific documentation
- supabase/: Database schema and migration documentation
- memory-bank/: Project memory bank for AI assistant
- Edge Function files: Documentation in comments
- fly-interview-poc/WEBRTC-SDP-PROXY-TEST.md: WebRTC SDP proxy details

## Future Technical Considerations

- Optimizing OpenAI API usage for cost reduction
- Adding caching layer for transcript processing
- Implementing more sophisticated database indices
- Setting up monitoring and logging infrastructure
- Creating a development/staging environment
- Implementing database replication for analytics
- Exploring Fly.io's horizontal scaling capabilities for interview processing
- Improving WebRTC connection resilience in poor network conditions
- Implementing fallback mechanisms for connection failures
- Testing compatibility across different browsers and devices

### Database Migration Best Practices

When creating SQL migrations, follow these guidelines for reliability:

1. **Schema Qualification**: Always fully qualify table and column names:
   ```sql
   -- Good
   SELECT * FROM public.my_table WHERE public.my_table.column_name = 'value';
   
   -- Bad
   SELECT * FROM my_table WHERE column_name = 'value';
   ```

2. **Object Dependency Order**: Create objects in the correct dependency order:
   - Extensions first
   - Then tables
   - Then indexes, constraints, triggers
   - Finally policies
   
3. **Conditional Creation**: Use IF EXISTS/IF NOT EXISTS for safer migrations:
   ```sql
   CREATE TABLE IF NOT EXISTS public.my_table (...);
   DROP POLICY IF EXISTS "Policy name" ON public.my_table;
   ```
   
4. **Auth Function Wrapping**: Wrap auth functions in SELECT for better performance:
   ```sql
   -- Good
   WHERE user_id = (SELECT auth.uid())
   
   -- Less efficient
   WHERE user_id = auth.uid()
   ```
   
5. **Atomic Migrations**: For complex changes, use a single atomic migration that:
   - Drops dependent objects first
   - Creates tables in dependency order
   - Recreates policies after tables exist
   
6. **Migration Documentation**: Always include detailed comments:
   ```sql
   -- Migration: Purpose of migration
   -- Description: What this migration does
   -- Date: YYYY-MM-DD
   --
   -- Additional context about changes...
   ```
   
7. **Naming Conventions**: Use timestamp-prefixed names for proper sequencing:
   ```
   20250507144000_create_tables.sql
   20250507144100_create_policies.sql
   ```

For a complete guide, see `docs/development/supabase-branching-guide.md` 

## WebRTC Implementation

The platform incorporates WebRTC technology for real-time communication during interviews. Two approaches have been implemented:

1. **Original SDP Proxy Approach** (fly-interview-poc):
   - Traditional WebRTC SDP proxy with server-side audio processing
   - Full audio transmission over WebSockets
   - Higher latency and server resources required
   - Currently suspended in production (last deployed May 9, 2025)

2. **Hybrid OpenAI Approach** (fly-interview-hybrid):
   - Uses OpenAI's native WebRTC capabilities
   - Fly.io serves only as a secure SDP exchange proxy
   - Direct WebRTC connection between client and OpenAI
   - Lower latency and more efficient resource usage
   - Successfully deployed and tested in production
   - Fixed authentication to use OpenAI API key directly
   - Uses proper Realtime API endpoints (sessions.openai.com)
   - Requires OpenAI-Beta: realtime=v1 header

Both architectures now implement a strict **per-session VM isolation model**, where each interview session gets its own dedicated VM regardless of the chosen architecture. This ensures complete isolation between interviews and prevents potential data leakage.

### VM Isolation Architecture

The platform enforces a strict isolation model where each interview session gets its own isolated virtual machine:

1. **Per-Session Isolation**: Every interview session has its own isolated VM 
   - VM naming pattern: `interview-{architecture}-{tenantId}-{sessionShortId}`
   - Complete separation between all interviews, even within the same tenant
   - Prevents any potential cross-session data leakage

2. **Implementation Details**:
   - The `interview-start` edge function creates unique VM names for each session
   - WebRTC hooks dynamically handle server URLs from edge function responses
   - Session tokens include tenant and session context for authentication
   - Comprehensive documentation in `docs/architecture/VM_ISOLATION.md`

3. **Security Benefits**:
   - Physical isolation between interview sessions
   - API keys and secrets isolated to each VM
   - No shared memory or disk space between sessions
   - Reduced attack surface through compartmentalization
   - Improved observability with per-session logs

### Hooks-Based Architecture

The WebRTC implementation uses a hooks-based architecture for better maintainability and separation of concerns:

1. **Core WebRTC Hooks**:
   - `useConnectionState`: Manages connection state transitions and reporting
   - `useRetry`: Implements retry logic with exponential backoff
   - `useAudioVisualization`: Manages audio capture and visualization

2. **Connection Hooks**:
   - `useWebRTCConnection`: Handles WebRTC peer connection and ICE negotiation
   - `useWebSocketConnection`: Manages WebSocket connections to the proxy
   - `useOpenAIConnection`: Specialized hook for direct OpenAI connections
   - `useSDPProxy`: Specialized hook for SDP proxy architecture
   - `useTranscriptManager`: Manages transcript data and storage

3. **Orchestration Hook**:
   - `useWebRTC`: Main entry point that coordinates all specialized hooks
   - Dynamically determines which connection implementation to use
   - Handles initialization, cleanup, and status reporting

This architecture eliminates circular dependencies and creates a more maintainable system by separating concerns into focused hooks with clear responsibilities.

### WebRTC Test Structure

WebRTC testing is organized into several categories:

1. **Unit Tests**: 
   - Located in `src/hooks/webrtc/__tests__/`
   - Tests individual hooks in isolation
   - Uses comprehensive mocks for WebRTC, WebSocket, and Audio APIs

2. **Integration Tests**: 
   - Tests interaction between hooks and components
   - Validates complete connection flow

3. **Manual Test Pages**: 
   - Interactive interfaces at specific routes:
     - `/interview-test-simple`: Main test page
     - `/test/openai`: Direct OpenAI testing
     - `/test/full`: Comprehensive end-to-end testing
     - `/test/ngrok`: Testing with ngrok tunneling
     - `/test/webrtc-hooks`: Testing hooks architecture

4. **Simulation Tools**: 
   - Local testing without OpenAI API keys
   - Located in `fly-interview-hybrid/`
   - `simple-server.js` provides WebSocket simulation

### WebRTC Operational Procedures

To manage the WebRTC infrastructure in production:

1. **Restart Suspended SDP Proxy**:
   ```bash
   fly apps start interview-sdp-proxy
   fly apps status interview-sdp-proxy
   fly logs interview-sdp-proxy
   ```

2. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy interview-start
   supabase functions deploy transcript-processor
   ```

3. **Local Testing Setup**:
   ```bash
   # Start development server
   npm run dev
   
   # Start simulation server
   cd fly-interview-hybrid && node simple-server.js
   
   # Start ngrok tunnel (if needed)
   ./start-ngrok-test.sh
   ```

4. **VM Management**:
   ```bash
   # Scale VM capacity
   fly scale count 50 --app interview-sdp-proxy
   
   # Check VM status
   fly status --app interview-sdp-proxy
   ``` 

### JWT Configuration
- **Custom Access Token Hook**: `auth.custom_access_token_hook`
  - Adds tenant_id to JWT claims at top level
  - Configured in Supabase Authentication → Hooks
  - Enables RLS policies to check `(auth.jwt() ->> 'tenant_id')`
  - Users must sign out/in after configuration for new JWT tokens 