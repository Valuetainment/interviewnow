# AI Interview Insights Platform - Technical Context

## Technology Stack

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **State Management**: React Context API
- **Styling**: Tailwind CSS with shadcn/ui components
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router v6
- **API Client**: Custom hooks with Supabase JS client

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Serverless Functions**: Supabase Edge Functions (Deno)
- **API Layer**: PostgREST (via Supabase)
- **Realtime**: Supabase Realtime

### External Services
- **AI**: OpenAI API (GPT-4o, GPT-4o-mini)
- **PDF Processing**: PDF.co API
- **Video/Audio**: VideoSDK.live

## Development Environment
- **Package Manager**: npm/bun
- **Version Control**: Git
- **Local Development**: Supabase CLI with Docker
- **Code Quality**: ESLint, TypeScript
- **CI/CD**: TBD (GitHub Actions planned)

## Key Technical Decisions

### Architecture Overview
We've chosen a hybrid architecture that leverages Supabase's managed PostgreSQL database with serverless Edge Functions for specialized processing tasks. The frontend is built with React and Vite for optimal development experience and performance.

### Database Schema
- Multi-tenant design with RLS policies for data isolation
- Comprehensive schema with foreign key relationships
- Metadata tables for extensibility
- JSON columns for flexible data structures

### Authentication Flow
- Email/password authentication with Supabase Auth
- JWT-based session management
- Protected routes with auth context
- Role-based access control

### Storage Strategy
- Separate buckets for different file types (resumes, videos, audio)
- RLS policies for secure access
- Presigned URLs for temporary access
- Client-side file validation

### Edge Functions
- Deno runtime for serverless processing
- Separate functions for different processing needs:
  - `process-resume`: PDF text extraction
  - `analyze-resume`: Resume analysis with AI
  - `generate-position`: Position description generation
  - `transcript-processor`: Interview transcript processing
  - `check-env`: Environment variable verification
- Environment configuration:
  - Local development: `--env-file=supabase_secrets.env --no-verify-jwt`
  - Production: Environment secrets configured in Supabase dashboard
  - Key secrets: PDFCO_API_KEY, OPENAI_API_KEY
- Consistent error handling and CORS configuration
- npm: prefixed imports for dependencies

### Frontend Architecture
- Component-based architecture with React
- Hooks for reusable business logic
- Context API for global state management
- Lazy loading for performance optimization
- Responsive design with Tailwind CSS

## Technical Dependencies

### Supabase
- **Database**: PostgreSQL database hosted by Supabase
- **Auth**: JWT-based authentication system
- **Storage**: Object storage with bucket-based organization
- **Edge Functions**: Serverless functions using Deno runtime
- **Realtime**: WebSocket-based realtime subscriptions
- **PostgREST**: RESTful API auto-generated from database schema

### OpenAI
- **GPT-4o**: Latest model for high-quality text processing
- **GPT-4o-mini**: Cost-effective model for position generation
- **API Integration**: Direct API calls from Edge Functions
- **Usage Tracking**: Rate limiting to manage costs

### PDF.co
- **PDF Extraction**: Text and metadata extraction from resumes
- **API Integration**: Direct API calls from Edge Functions
- **Usage Limits**: Pay-as-you-go pricing model

### VideoSDK.live
- **Video/Audio Processing**: Real-time video and audio for interviews
- **Recording**: Server-side recording of sessions
- **API Integration**: Client-side integration

## Development Setup

### Local Environment
1. **Prerequisites**:
   - Node.js 18+
   - npm or bun
   - Docker Desktop
   - Supabase CLI

2. **Environment Variables**:
   **Frontend (.env file)**:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_OPENAI_API_KEY=your-openai-api-key
   VITE_PDFCO_API_KEY=your-pdfco-api-key
   VITE_VIDEOSDK_API_KEY=your-videosdk-api-key
   ```
   
   **Edge Functions (supabase_secrets.env file)**:
   ```
   PDFCO_API_KEY=your-pdfco-api-key
   OPENAI_API_KEY=your-openai-api-key
   ```
   
   **Edge Function Secrets (Supabase Dashboard)**:
   - PDFCO_API_KEY
   - OPENAI_API_KEY
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

3. **Setup Steps**:
   ```bash
   # Clone repository
   git clone https://github.com/your-org/ai-interview-insights-platform.git
   
   # Install dependencies
   npm install
   
   # Start Supabase local development
   npx supabase start
   
   # Serve Edge Functions with environment variables
   npx supabase functions serve --env-file=./supabase_secrets.env --no-verify-jwt
   
   # Start development server
   npm run dev
   ```

4. **Verification**:
   ```bash
   # Check environment variables in Edge Functions
   curl -X POST http://127.0.0.1:54321/functions/v1/check-env
   
   # Expected response:
   # {"pdfcoApiKey":"Found (ben@...QeCY)","openaiApiKey":"Found (sk-H...GKZ1)"}
   ```

## Technical Constraints

### Edge Function Limitations
- 2MB payload limit
- 6-second timeout for synchronous operations
- Limited runtime environment (Deno, not Node.js)
- No persistent storage within functions

### Database Constraints
- RLS policies required for all tables
- Limited query complexity for real-time subscriptions
- Storage quotas based on plan

### External API Dependencies
- Rate limits on OpenAI API calls
- Processing limits on PDF.co API
- Connection reliability with VideoSDK

## Deployment Strategy
- Local development with Supabase CLI
- Staging environment with dedicated Supabase project
- Production environment with separate Supabase project
- CI/CD pipeline for automated deployments (planned)

## Performance Considerations
- Lazy loading of components
- Optimistic UI updates
- Caching strategies for API responses
- Edge Function optimization for response times
- Database query optimization with indexes

## Security Measures
- JWT-based authentication
- Row-level security policies
- Presigned URLs for file access
- API key rotation strategy
- Content security policies

## Technical Debt and TODOs
- Complete Database type definitions
- Implement comprehensive error boundary system
- Optimize Edge Functions for large files
- Add extensive logging system
- Implement API caching layer
- Complete end-to-end testing suite 