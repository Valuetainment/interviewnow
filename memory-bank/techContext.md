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
- Future WebRTC API: Direct audio streaming for real-time transcription (requires SDP proxy for security)

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
3. Apply migration with `npx supabase migration up`
4. Commit migration files to repository

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