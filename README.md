# AI Interview Insights Platform

A multi-tenant SaaS platform for end-to-end AI-driven hiring processes built on Supabase infrastructure. Streamline resume parsing, conduct AI-driven interviews, generate weighted assessments, and export to ATS systems.

## 🚀 New Developer Onboarding

**Welcome! Start here for fastest productive setup:**

### **Essential First Read** (30 minutes)
1. **[📋 Memory Bank Context](memory-bank/)** - Most up-to-date project state and progress
   - [Project Brief](memory-bank/projectbrief.md) - Core product vision
   - [Active Context](memory-bank/activeContext.md) - Current state and recent fixes
   - [Progress](memory-bank/progress.md) - Completed features and milestones
2. **[📖 Main Documentation](docs/index.md)** - Complete platform overview and navigation
3. **[🎯 WebRTC Entry Point](docs/architecture/webrtc-entry-point.md)** - Core system implementation

### **Development Setup** (45 minutes)
4. **[🛠️ Development Guide](docs/development/README.md)** - Environment setup and workflow
5. **[📝 Development Log](CLAUDE.md)** - Recent work, current issues, commands to run
6. **[🧪 Testing Structure](docs/guides/testing/TEST_STRUCTURE.md)** - Testing patterns and organization

### **When You Need It** (as needed)
7. **[🏗️ Implementation Details](docs/architecture/hybrid-implementation-details.md)** - Technical specs and APIs
8. **[🔒 Security Model](docs/architecture/vm-isolation-guide.md)** - Per-session VM isolation
9. **[✅ Checklists](memory-bank/checklist.md)** - Implementation status tracking
10. **[📊 Transcript Optimization](TRANSCRIPT_OPTIMIZATION_PLAN.md)** - Performance improvements roadmap

**⚠️ Critical Updates**: 
- WebRTC architecture identified: Fly.io needs to use HTTP-based SDP exchange with OpenAI
- Implementation fix planned: See [WebRTC Fix Action Plan](WEBRTC_FIX_ACTION_PLAN.md)
- JWT custom_access_token_hook is configured for tenant isolation
- VM isolation is per-session (not per-tenant) for security
- Sign out and back in after JWT configuration changes

**💡 Pro Tip**: Always check memory-bank/ for the most current project state before making changes.

## Core Features

- **Resume Processing**: Upload, parse, and analyze resumes with AI
- **Candidate Enrichment**: Enhance profiles with People Data Labs integration
- **Position Management**: Create positions with AI-generated descriptions and competencies
- **Interview Management**: Setup and conduct video interviews with real-time transcription
- **Assessment Engine**: Generate weighted competency-based assessments
- **Dashboard Analytics**: View key metrics and insights
- **Multi-tenant Support**: Secure data isolation between organizations

## Tech Stack

### Frontend
- React with TypeScript
- Vite build system
- Tailwind CSS with shadcn/ui components
- React Router v6
- React Context API for state management

### Backend (Supabase)
- PostgreSQL database
- Row Level Security for data isolation
- Supabase Auth with JWT
- Supabase Storage for file management
- Supabase Edge Functions (Deno)
- Supabase Realtime for live updates

### Integrations
- OpenAI API (GPT-4o, GPT-4o-mini)
- PDF.co API for document processing
- People Data Labs for candidate enrichment
- VideoSDK.live for video interviews

## Development Setup

### Prerequisites
- Node.js 18+
- npm or bun
- Docker Desktop (for local Supabase)
- Supabase CLI

### Environment Variables
Create a `.env` file with:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=your-openai-api-key
VITE_PDFCO_API_KEY=your-pdfco-api-key
VITE_VIDEOSDK_API_KEY=your-videosdk-api-key
```

For Edge Functions, create a `supabase_secrets.env` file:
```
PDFCO_API_KEY=your-pdfco-api-key
OPENAI_API_KEY=your-openai-api-key
```

### Installation

```bash
# Clone repository
git clone https://github.com/thelabvenice/triangularai.git
cd triangularai

# Install dependencies
npm install

# Start Supabase local development
npx supabase start

# Apply migrations
npx supabase db push

# Run Edge Functions locally (in a separate terminal)
npx supabase functions serve --env-file=./supabase_secrets.env --no-verify-jwt

# Start development server
npm run dev
```

### Testing Environment

To verify your setup is working:
```bash
# Verify environment variables
curl -X POST http://127.0.0.1:54321/functions/v1/check-env
```

For comprehensive testing options:
- [General Testing Guide](TESTING.md) - Manual testing for interview session management
- [WebRTC Testing Guide](WEBRTC_TESTING.md) - Testing the WebRTC implementation
- [Automated Testing Guide](docs/guides/testing/AUTOMATED_TESTING.md) - All automated test scripts

## Project Structure

```
triangularai/
├── public/                  # Static assets
├── src/
│   ├── components/          # React components
│   │   ├── candidates/      # Candidate management components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── interview/       # Interview components
│   │   ├── layouts/         # Layout components
│   │   ├── navbar/          # Navigation components
│   │   ├── resume/          # Resume upload/processing components
│   │   └── ui/              # UI components based on shadcn/ui
│   ├── hooks/               # Custom React hooks
│   ├── integrations/        # Integration clients
│   │   └── supabase/        # Supabase client and types
│   ├── lib/                 # Utility functions
│   ├── pages/               # Page components
│   └── scripts/             # Setup and utility scripts
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── analyze-resume/  # Resume analysis with OpenAI
│   │   ├── check-env/       # Environment variable verification
│   │   ├── enrich-candidate/# Candidate enrichment with PDL
│   │   ├── process-resume/  # PDF processing with PDF.co
│   │   └── transcript-processor/ # Real-time transcript processing
│   └── migrations/          # Database migrations
└── scripts/                 # Development and setup scripts
```

## Current Status

See [memory-bank/checklist.md](memory-bank/checklist.md) for detailed implementation status.

### Completed ✅
- Core platform infrastructure with multi-tenant support
- Database schema with RLS policies and JWT tenant isolation
- Authentication with custom_access_token_hook for tenant_id claims
- Dashboard implementation with full CRUD operations
- Resume processing flow (PDF.co extraction + OpenAI analysis)
- Position and competency management with AI generation
- Interview session setup with WebRTC support
- Candidate enrichment with People Data Labs
- WebRTC implementation with hybrid architecture (hooks-based)
- Comprehensive unit tests for WebRTC functionality
- Per-session VM isolation for security

### Recently Fixed 🔧
- Identified correct OpenAI WebRTC implementation (HTTP-based SDP exchange)
- Fixed component re-rendering issues causing WebSocket disconnections
- JWT claims properly configured for tenant isolation
- VM isolation changed from per-tenant to per-session
- Interview sessions table includes company_id with RLS policies

### In Progress 🚧
- Implementing proper OpenAI WebRTC SDP exchange in Fly.io proxy
- Production deployment of WebRTC functionality
- Assessment engine implementation
- End-to-end integration testing
- Performance optimization

## License

Proprietary and confidential. © 2024 Triangular AI.

<!-- Last updated: May 1, 2024 at 17:35 -->
