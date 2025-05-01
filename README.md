# Triangular AI Interview Insights Platform

A multi-tenant SaaS platform for end-to-end AI-driven hiring processes built on Supabase infrastructure. Streamline resume parsing, conduct AI-driven interviews, generate weighted assessments, and export to ATS systems.

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

See [CHECKLIST.md](memory-bank/checklist.md) for implementation status.

### Completed
- Core platform infrastructure
- Database schema with RLS policies
- Authentication and authorization
- Dashboard implementation
- Resume processing flow
- Position and competency management
- Interview session setup
- Candidate enrichment with PDL

### In Progress
- Assessment engine implementation
- End-to-end testing
- Performance optimization

## License

Proprietary and confidential. © 2024 Triangular AI.

<!-- Last updated: May 1, 2024 -->
